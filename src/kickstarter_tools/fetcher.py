#!/usr/bin/env python3
"""Utilities to collect 'upcoming' Kickstarter projects with pagination."""

from __future__ import annotations

import argparse
import json
import re
import signal
import sys
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence

import requests
from cloudscraper import CloudScraper

from .session import create_scraper, rotate_proxy_session, get_current_ip, supports_session_params, is_rotating_proxy


class TimeoutError(Exception):
    pass


def timeout_handler(signum, frame):
    raise TimeoutError("Request timed out")

BASE_URL = "https://www.kickstarter.com/discover/advanced"
LISTING_URL = "https://www.kickstarter.com/discover/advanced?state=upcoming&sort=newest"
DEFAULT_PARAMS: Dict[str, Any] = {
    "google_chrome_workaround": "",
    "per_page": 48,
    "state": "upcoming",
    "woe_id": 0,
    "sort": "newest",
    "seed": 2934888,
    "format": "json",
}


def extract_csrf_token(html: str) -> str:
    match = re.search(r'name=["\']csrf-token["\']\s+content=["\']([^"\']+)["\']', html)
    if not match:
        raise ValueError("CSRF token not found on listing page.")
    return match.group(1)


def prepare_listing_session(
    scraper: CloudScraper,
    *,
    timeout: int,
    max_ip_rotations: int = 10,
    retries_per_ip: int = 3,
    retry_wait: float = 3.0,
    verbose: bool = False,
    base_proxy_url: Optional[str] = None,
    scraper_config: Optional[dict] = None,
) -> CloudScraper:
    """
    Prepare listing session with retry strategy:
    - Try same IP up to `retries_per_ip` times with `retry_wait` delay
    - After exhausting retries, rotate to new IP
    - Try up to `max_ip_rotations` different IPs
    - Raise exception if all IPs fail (total attempts: max_ip_rotations * retries_per_ip)
    """
    last_error: Optional[Exception] = None
    
    max_total_time = 180
    start_time = time.time()

    for ip_rotation in range(1, max_ip_rotations + 1):
        elapsed = time.time() - start_time
        if elapsed > max_total_time:
            raise RuntimeError(f"Timeout exceeded. Please try again later.")
        
        # Rotate IP (except first attempt)
        if ip_rotation > 1 and base_proxy_url:
            if is_rotating_proxy(base_proxy_url):
                current_ip = get_current_ip(base_proxy_url)
            elif supports_session_params(base_proxy_url):
                new_proxy_url = rotate_proxy_session(base_proxy_url)
                scraper.proxies = {
                    'http': new_proxy_url,
                    'https': new_proxy_url,
                }
                current_ip = get_current_ip(new_proxy_url)
            elif scraper_config:
                scraper = create_scraper(**scraper_config)
                scraper.proxies = {
                    'http': base_proxy_url,
                    'https': base_proxy_url,
                }
                current_ip = get_current_ip(base_proxy_url)
            else:
                current_ip = get_current_ip(base_proxy_url)
        elif ip_rotation == 1 and base_proxy_url:
            current_ip = get_current_ip(base_proxy_url)
        
        # Try same IP multiple times
        for retry in range(1, retries_per_ip + 1):
            try:
                if retry > 1:
                    time.sleep(retry_wait)
                
                scraper.headers.update(
                    {
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                    }
                )
                
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(60)
                try:
                    homepage_response = scraper.get("https://www.kickstarter.com/", timeout=timeout)
                    homepage_response.raise_for_status()
                finally:
                    signal.alarm(0)

                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(60)
                try:
                    response = scraper.get(LISTING_URL, timeout=timeout)
                finally:
                    signal.alarm(0)
                
                # Check status code before raise_for_status to get accurate error messages
                if response.status_code == 403:
                    print(f"[403] Access forbidden. Retry {retry}/{retries_per_ip} on IP {ip_rotation}/{max_ip_rotations}", flush=True)
                    last_error = requests.HTTPError("Access forbidden (403)", response=response)
                    continue
                elif response.status_code == 429:
                    print(f"[429] Rate limited. Retry {retry}/{retries_per_ip} on IP {ip_rotation}/{max_ip_rotations}", flush=True)
                    last_error = requests.HTTPError("Rate limited (429)", response=response)
                    continue
                
                response.raise_for_status()

                csrf_token = extract_csrf_token(response.text)
                scraper.headers.update(
                    {
                        "Referer": LISTING_URL,
                        "X-CSRF-Token": csrf_token,
                        "Accept": "application/json, text/javascript, */*; q=0.01",
                        "Accept-Language": "en-US,en;q=0.5",
                        "X-Requested-With": "XMLHttpRequest",
                        "Sec-GPC": "1",
                        "Pragma": "no-cache",
                        "Cache-Control": "no-cache",
                    }
                )
                return scraper
            except TimeoutError as exc:
                last_error = exc
                signal.alarm(0)
                continue
            except requests.Timeout as exc:
                last_error = exc
                signal.alarm(0)
                continue
            except requests.HTTPError as exc:
                last_error = exc
                signal.alarm(0)
                continue
            except requests.RequestException as exc:
                last_error = exc
                signal.alarm(0)
                continue
            except Exception as exc:
                last_error = exc
                signal.alarm(0)
                continue
        
        # All retries on this IP failed - try next IP
        if ip_rotation < max_ip_rotations:
            continue

    # All IPs exhausted
    total_attempts = max_ip_rotations * retries_per_ip
    raise RuntimeError(
        f"❌ FATAL: Failed to prepare session after trying {max_ip_rotations} different IPs "
        f"({total_attempts} total requests). Last error: {last_error}"
    ) from last_error


def fetch_all_projects(
    scraper: CloudScraper,
    *,
    max_pages: int | None = None,
    timeout: int = 20,
    max_retries: int = 10,
    retry_wait: float = 5.0,
    debug: bool = False,
    base_proxy_url: Optional[str] = None,
    scraper_config: Optional[dict] = None,
    existing_checker: Optional[Callable[[List[Dict[str, Any]]], List[int]]] = None,
) -> List[Dict[str, Any]]:
    """Iterate through API pages until `has_more` is false or existing_checker signals stop."""
    collected: List[Dict[str, Any]] = []
    page = 1

    print("🔄 Connecting to Kickstarter...", flush=True)
    scraper = prepare_listing_session(
        scraper,
        timeout=timeout,
        max_ip_rotations=max_retries,
        retries_per_ip=3,
        retry_wait=3.0,
        verbose=debug,
        base_proxy_url=base_proxy_url,
        scraper_config=scraper_config,
    )
    print("✅ Connected! Fetching projects...", flush=True)

    pages_fetched = 0

    while True:
        if max_pages is not None and page > max_pages:
            print(f"🛑 Max pages limit reached ({max_pages}).", flush=True)
            break

        print(f"📄 Fetching page {page}...", flush=True)

        params = {**DEFAULT_PARAMS, "page": page}
        
        # Apply same retry strategy: 3 retries per IP, up to 10 IPs (30 total attempts)
        page_fetched = False
        last_error = None
        
        for ip_rotation in range(1, max_retries + 1):
            # Rotate IP (except first attempt)
            if ip_rotation > 1 and base_proxy_url:
                from .session import rotate_proxy_session, get_current_ip, supports_session_params, is_rotating_proxy
                
                print(f"   🔄 Rotating to IP {ip_rotation}/{max_retries} for page {page}...", flush=True)
                
                if is_rotating_proxy(base_proxy_url):
                    # Auto-rotating proxy: IP changes automatically
                    current_ip = get_current_ip(base_proxy_url)
                    print(f"      🌐 New IP: {current_ip} (auto-rotating)", flush=True)
                elif supports_session_params(base_proxy_url):
                    # Session-based rotation: change session parameter
                    new_proxy_url = rotate_proxy_session(base_proxy_url)
                    scraper.proxies = {
                        'http': new_proxy_url,
                        'https': new_proxy_url,
                    }
                    current_ip = get_current_ip(new_proxy_url)
                    print(f"      🌐 New IP: {current_ip} (session rotation)", flush=True)
                elif scraper_config:
                    # Regular proxy: recreate scraper for new connection
                    from .session import create_scraper
                    scraper = create_scraper(proxies=[base_proxy_url], **scraper_config)
                    current_ip = get_current_ip(base_proxy_url)
                    print(f"      🌐 New IP: {current_ip} (connection recreation)", flush=True)
            
            # Try same IP multiple times
            for retry in range(1, 4):  # 3 retries per IP (hardcoded to match strategy)
                try:
                    if retry > 1:
                        print(f"   ⏳ Waiting 3s before retry {retry}/3 on IP {ip_rotation}...", flush=True)
                        time.sleep(3.0)
                    
                    response = scraper.get(
                        BASE_URL,
                        params=params,
                        timeout=timeout,
                    )
                    
                    # Check status code before raise_for_status
                    if response.status_code == 429:
                        print(f"   [429] Rate limited. Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                        last_error = f"Rate limited (429)"
                        continue
                    
                    if response.status_code == 403:
                        print(f"   [403] Access forbidden. Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                        last_error = f"Access forbidden (403)"
                        continue
                    
                    response.raise_for_status()
                    payload = response.json()
                    
                    projects = payload.get("projects", [])

                    # Check if any project from this page already exists (stop condition)
                    to_keep = projects
                    if existing_checker:
                        existing_ids = existing_checker(projects)
                        if existing_ids:
                            to_keep = [p for p in projects if p.get('id') not in existing_ids]
                            print(
                                f"🛑 Found existing projects in Supabase at page {page}. "
                                f"Keeping {len(to_keep)}/{len(projects)} new projects from this page.",
                                flush=True,
                            )
                            collected.extend(to_keep)
                            pages_fetched += 1
                            print(f"   ✅ {len(to_keep)} projects (total: {len(collected)})", flush=True)
                            return collected

                    collected.extend(to_keep)
                    pages_fetched += 1
                    print(f"   ✅ {len(to_keep)} projects (total: {len(collected)})", flush=True)
                    
                    page_fetched = True
                    break
                    
                except requests.Timeout:
                    last_error = f"Request timeout"
                    print(f"   ⏱️  Timeout. Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                    continue
                except json.JSONDecodeError:
                    last_error = f"Invalid JSON response"
                    print(f"   ⚠️  Invalid response. Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                    continue
                except requests.HTTPError as exc:
                    status_code = exc.response.status_code if exc.response else "unknown"
                    last_error = f"HTTP error ({status_code})"
                    print(f"   ❌ HTTP error ({status_code}). Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                    continue
                except requests.RequestException as exc:
                    last_error = f"Connection error: {type(exc).__name__}"
                    print(f"   ⚠️  Connection error. Retry {retry}/3 on IP {ip_rotation}/{max_retries}", flush=True)
                    continue
            
            if page_fetched:
                break
            
            # All retries on this IP failed
            if ip_rotation < max_retries:
                print(f"   ❌ All 3 retries failed on IP {ip_rotation}. Rotating to next IP...", flush=True)
        
        if not page_fetched:
            total_attempts = max_retries * 3
            raise RuntimeError(
                f"❌ FATAL: Failed to fetch page {page} after trying {max_retries} different IPs "
                f"({total_attempts} total requests). Last error: {last_error}"
            )

        if not payload.get("has_more"):
            print("🏁 All projects collected!", flush=True)
            break

        page += 1

    print(f"📊 Total: {len(collected)} projects in {pages_fetched} pages", flush=True)
    return collected


def save_projects(projects: Sequence[Dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as stream:
        json.dump(list(projects), stream, ensure_ascii=False, indent=2)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Fetch all pages of the Kickstarter 'upcoming' listing and optionally save them to disk."
        )
    )
    parser.add_argument("--max-pages", type=int, help="Limit the number of pages to fetch.")
    parser.add_argument("--timeout", type=int, default=20, help="Timeout in seconds (default: 20).")
    parser.add_argument("--max-retries", type=int, default=5, help="Maximum retry attempts (default: 5).")
    parser.add_argument("--retry-wait", type=float, default=5.0, help="Seconds to wait between retries (default: 5).")
    parser.add_argument("--proxy-url", type=str, help="Single rotating proxy URL (overrides PROXY_URL env).")
    parser.add_argument("--browser", default="chrome", help="Emulated browser profile.")
    parser.add_argument("--platform", default="windows", help="Emulated user-agent platform.")
    parser.add_argument("--mobile", action="store_true", help="Force a mobile user-agent.")
    parser.add_argument("--debug", action="store_true", help="Enable additional application debug logs.")
    parser.add_argument("--cloudscraper-debug", action="store_true", help="Enable low-level cloudscraper HTTP logging.")
    parser.add_argument("--output", type=Path, help="If provided, save the result to this JSON file.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)

    proxy_url = args.proxy_url or os.environ.get("PROXY_URL")

    scraper = create_scraper(
        debug=args.debug,
        browser=args.browser,
        platform=args.platform,
        mobile=args.mobile,
        proxy_url=proxy_url,
        cloudscraper_debug=args.cloudscraper_debug,
    )

    try:
        projects = fetch_all_projects(
            scraper,
            max_pages=args.max_pages,
            timeout=args.timeout,
            max_retries=args.max_retries,
            retry_wait=args.retry_wait,
            debug=args.debug,
        )
    except requests.HTTPError as exc:
        print(f"HTTP error while fetching data: {exc}", file=sys.stderr)
        if exc.response is not None:
            body = exc.response.text
            print("Response body (first 500 chars):", file=sys.stderr)
            print(body[:500], file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while fetching data: {exc}", file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(f"Failed to prepare session: {exc}", file=sys.stderr)
        return 1

    if args.output:
        save_projects(projects, args.output)
        print(f"Projects saved to {args.output}")
    else:
        print(json.dumps(projects, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Enrich Kickstarter projects with creator websites using batch GraphQL queries."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from cloudscraper import CloudScraper

from .session import create_scraper, is_rotating_proxy, supports_session_params, rotate_proxy_session, get_current_ip

GRAPH_URL = "https://www.kickstarter.com/graph"
BATCH_SIZE = 100

CREATOR_QUERY = """
query CreatorInfo($slug: String!) {
  project(slug: $slug) {
    creator {
      websites {
        url
        domain
      }
    }
  }
}
""".strip()


def load_projects(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"Expected a list of projects in {path}")
    return data


def extract_csrf_token(html: str) -> str:
    """Extract CSRF token from HTML page."""
    match = re.search(r'name=["\']csrf-token["\']\s+content=["\']([^"\']+)["\']', html)
    if not match:
        raise ValueError("CSRF token not found on project page.")
    return match.group(1)


def build_batch_payload(slugs: List[str]) -> List[Dict[str, Any]]:
    """Build GraphQL batch payload for multiple slugs."""
    payload = []
    for slug in slugs:
        payload.append({
            "operationName": "CreatorInfo",
            "variables": {"slug": slug},
            "query": CREATOR_QUERY,
        })
    return payload


def prepare_session_for_graphql(
    scraper: CloudScraper,
    *,
    timeout: int,
    max_ip_rotations: int = 10,
    retries_per_ip: int = 3,
    retry_wait: float = 3.0,
    base_proxy_url: Optional[str] = None,
    scraper_config: Optional[dict] = None,
) -> tuple[str, CloudScraper]:
    """
    Prepare session for GraphQL API with retry strategy:
    - Try same IP up to `retries_per_ip` times with `retry_wait` delay
    - After exhausting retries, rotate to new IP
    - Try up to `max_ip_rotations` different IPs
    - Raise exception if all IPs fail (total attempts: max_ip_rotations * retries_per_ip)
    """
    last_error = None
    
    for ip_rotation in range(1, max_ip_rotations + 1):
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
        elif ip_rotation == 1 and base_proxy_url:
            current_ip = get_current_ip(base_proxy_url)
        
        # Try same IP multiple times
        for retry in range(1, retries_per_ip + 1):
            try:
                if retry > 1:
                    time.sleep(retry_wait)
                
                response = scraper.get(
                    "https://www.kickstarter.com/discover",
                    timeout=timeout,
                    allow_redirects=True
                )
                
                # Check status code before raise_for_status to get accurate error messages
                if response.status_code == 403:
                    last_error = requests.HTTPError("Access forbidden (403)", response=response)
                    continue
                elif response.status_code == 429:
                    last_error = requests.HTTPError("Rate limited (429)", response=response)
                    continue
                
                response.raise_for_status()

                csrf_token = extract_csrf_token(response.text)
                scraper.headers.update({
                    "Referer": "https://www.kickstarter.com/discover",
                    "X-CSRF-Token": csrf_token,
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Content-Type": "application/json",
                    "Origin": "https://www.kickstarter.com",
                })
                return csrf_token, scraper
            except requests.Timeout as exc:
                last_error = exc
                continue
            except requests.HTTPError as exc:
                last_error = exc
                continue
            except requests.RequestException as exc:
                last_error = exc
                continue
        
        # All retries on this IP failed - try next IP
        if ip_rotation < max_ip_rotations:
            continue
    
    # All IPs exhausted
    total_attempts = max_ip_rotations * retries_per_ip
    raise RuntimeError(
        f"❌ FATAL: Failed to prepare GraphQL session after trying {max_ip_rotations} different IPs "
        f"({total_attempts} total requests). Last error: {last_error}"
    ) from last_error


def fetch_batch_data(
    scraper: CloudScraper,
    slugs: List[str],
    timeout: int,
    max_ip_rotations: int = 10,
    retries_per_ip: int = 3,
    retry_wait: float = 3.0,
    base_proxy_url: Optional[str] = None,
    scraper_config: Optional[dict] = None,
) -> tuple[List[Dict[str, Any]], CloudScraper]:
    """
    Fetch batch of projects from GraphQL API with retry strategy:
    - Try same IP up to `retries_per_ip` times with `retry_wait` delay
    - After exhausting retries, rotate to new IP
    - Try up to `max_ip_rotations` different IPs
    - Raise exception if all IPs fail (total attempts: max_ip_rotations * retries_per_ip)
    """
    payload = build_batch_payload(slugs)
    last_error = None

    for ip_rotation in range(1, max_ip_rotations + 1):
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
        
        # Try same IP multiple times
        for retry in range(1, retries_per_ip + 1):
            try:
                if retry > 1:
                    time.sleep(retry_wait)
                
                response = scraper.post(
                    GRAPH_URL,
                    json=payload,
                    timeout=timeout,
                )
                
                # Check status code before raise_for_status
                if response.status_code == 429:
                    last_error = requests.HTTPError("Rate limited (429)", response=response)
                    continue

                if response.status_code == 403:
                    last_error = requests.HTTPError("Access forbidden (403)", response=response)
                    continue

                response.raise_for_status()
                return response.json(), scraper
                
            except requests.Timeout as exc:
                last_error = exc
                continue
            except requests.HTTPError as exc:
                last_error = exc
                continue
            except requests.RequestException as exc:
                last_error = exc
                continue
        
        # All retries on this IP failed - try next IP
        if ip_rotation < max_ip_rotations:
            continue

    # All IPs exhausted
    total_attempts = max_ip_rotations * retries_per_ip
    raise RuntimeError(
        f"❌ FATAL: Failed to fetch batch data after trying {max_ip_rotations} different IPs "
        f"({total_attempts} total requests). Last error: {last_error}"
    )


def enrich_projects(
    projects: List[Dict[str, Any]],
    scraper: CloudScraper,
    *,
    timeout: int,
    max_retries: int,
    retry_wait: int,
    delay: float,
    limit: Optional[int],
    base_proxy_url: Optional[str] = None,
    scraper_config: Optional[dict] = None,
) -> List[Dict[str, Any]]:
    total = len(projects) if limit is None else min(limit, len(projects))
    projects_to_process = projects[:total]
    num_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"🔍 Collecting information from {total} creators...", flush=True)
    
    try:
        csrf_token, scraper = prepare_session_for_graphql(
            scraper, 
            timeout=timeout,
            max_ip_rotations=10,
            retries_per_ip=3,
            retry_wait=3.0,
            base_proxy_url=base_proxy_url,
            scraper_config=scraper_config,
        )
        print(f"✅ GraphQL session prepared", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Failed to prepare GraphQL session: {exc}", flush=True)
        return projects_to_process
    
    results: List[Dict[str, Any]] = []
    success_count = 0
    failure_count = 0

    for batch_idx in range(num_batches):
        start_idx = batch_idx * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, total)
        batch_projects = projects_to_process[start_idx:end_idx]
        batch_slugs = [p.get("slug", "") for p in batch_projects]
        
        valid_indices = {i: slug for i, slug in enumerate(batch_slugs) if slug}
        valid_slugs = list(valid_indices.values())
        
        print(f"📦 Processing {start_idx + 1}-{end_idx} of {total}...", flush=True)
        
        if not valid_slugs:
            results.extend(batch_projects)
            failure_count += len(batch_projects)
            continue
        
        try:
            graph_results, scraper = fetch_batch_data(
                scraper,
                valid_slugs,
                timeout=timeout,
                max_ip_rotations=max_retries,
                retries_per_ip=3,
                retry_wait=3.0,
                base_proxy_url=base_proxy_url,
                scraper_config=scraper_config,
            )
            
            result_map = {}
            for i, result in enumerate(graph_results):
                if i < len(valid_slugs):
                    result_map[valid_slugs[i]] = result
            
            for i, project in enumerate(batch_projects):
                slug = batch_slugs[i]
                if slug and slug in result_map:
                    graph_data = result_map[slug]
                    
                    if "data" in graph_data:
                        creator = graph_data.get("data", {}).get("project", {}).get("creator", {})
                        websites = creator.get("websites", [])
                        
                        if "creator" not in project:
                            project["creator"] = {}
                        project["creator"]["websites"] = websites
                        
                        success_count += 1
                    
                    if "errors" in graph_data:
                        project["graph_errors"] = graph_data["errors"]
                        failure_count += 1
                else:
                    failure_count += 1
            
            # Only add to results if processing succeeded
            results.extend(batch_projects)
            
            websites_found = sum(1 for p in batch_projects if p.get("creator", {}).get("websites"))
            print(f"   ✅ {websites_found} creators with websites", flush=True)
            
        except requests.HTTPError as exc:
            print(f"   ❌ HTTP error: {exc}", flush=True)
            # Add projects as-is when HTTP error occurs
            results.extend(batch_projects)
            failure_count += len(batch_projects)
        except Exception as exc:  # noqa: BLE001
            print(f"   ⚠️  Unexpected error: {type(exc).__name__}: {exc}", flush=True)
            # Add projects as-is when unexpected error occurs
            results.extend(batch_projects)
            failure_count += len(batch_projects)

        if delay and batch_idx < num_batches - 1:
            time.sleep(delay)

        if (batch_idx + 1) % 10 == 0 or (batch_idx + 1) == num_batches:
            print(f"📊 Progress: {len(results)}/{total} processed", flush=True)

    print(f"✅ Enrichment complete! {success_count} creators with data", flush=True)
    return results


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Enrich projects with additional data (especially creator details) "
            "using the Kickstarter Graph endpoint."
        )
    )
    parser.add_argument("--input", type=Path, default=Path("projects.json"), help="Path to the collected projects JSON file.")
    parser.add_argument("--output", type=Path, default=Path("projects_enriched.json"), help="Path to the enriched output JSON file.")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout in seconds (default: 30).")
    parser.add_argument("--max-retries", type=int, default=5, help="Max retry attempts (default: 5).")
    parser.add_argument("--retry-wait", type=int, default=60, help="Wait time between retries in seconds (default: 60).")
    parser.add_argument("--delay", type=float, default=0.0, help="Delay between enrichment requests (default: 0).")
    parser.add_argument("--limit", type=int, help="Limit the number of projects to enrich.")
    parser.add_argument("--proxy-url", type=str, help="Single rotating proxy URL (overrides PROXY_URL env).")
    parser.add_argument("--browser", default="chrome", help="Emulated browser.")
    parser.add_argument("--platform", default="windows", help="Emulated user-agent platform.")
    parser.add_argument("--mobile", action="store_true", help="Force mobile user-agent.")
    parser.add_argument("--debug", action="store_true", help="Enable additional application debug logs.")
    parser.add_argument("--cloudscraper-debug", action="store_true", help="Enable low-level cloudscraper HTTP logging.")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)

    try:
        projects = load_projects(args.input)
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to load {args.input}: {exc}", file=sys.stderr)
        return 1

    proxy_url = args.proxy_url or os.environ.get("PROXY_URL")

    scraper = create_scraper(
        debug=args.debug,
        browser=args.browser,
        platform=args.platform,
        mobile=args.mobile,
        proxy_url=proxy_url,
        cloudscraper_debug=args.cloudscraper_debug,
    )

    enriched = enrich_projects(
        projects,
        scraper,
        timeout=args.timeout,
        max_retries=args.max_retries,
        retry_wait=args.retry_wait,
        delay=args.delay,
        limit=args.limit,
    )

    args.output.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nProcess completed. Output saved to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

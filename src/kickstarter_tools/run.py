#!/usr/bin/env python3
"""Entry point for the Kickstarter data extraction pipeline."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import logging
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence

import requests

from .fetcher import fetch_all_projects, save_projects
from .enricher import enrich_projects
from .session import create_scraper
from .supabase_sync import sync_all_to_supabase, get_supabase_client
from . import exporter
from src.firecrawl_tools.contact_runner import run_contacts


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Kickstarter 'upcoming' project collection and enrichment pipeline.")
    parser.add_argument("--projects-path", type=Path, default=Path("projects.json"), help="(debug-only) path to save fetched projects when --debug-local is enabled.")
    parser.add_argument("--enriched-path", type=Path, default=Path("projects_enriched.json"), help="(debug-only) path to save enriched projects when --debug-local is enabled.")
    parser.add_argument("--proxy-url", type=str, help="Single rotating proxy URL (e.g., http://user:pass@host:port). Overrides PROXY_URL env.")
    parser.add_argument("--browser", default="chrome", help="Browser profile emulated by cloudscraper.")
    parser.add_argument("--platform", default="windows", help="Platform for the emulated user-agent.")
    parser.add_argument("--mobile", action="store_true", help="Force a mobile user-agent.")
    parser.add_argument("--disable-proxy", action="store_true", help="Ignore PROXY_URL/--proxy-url and run without proxy.")
    parser.add_argument("--cloudscraper-debug", action="store_true", help="Enable low-level cloudscraper HTTP logging.")
    parser.add_argument("--debug", action="store_true", help="Enable additional application debug logs.")
    parser.add_argument("--force-fetch", action="store_true", help="Force collection even if the output file already exists.")
    parser.add_argument("--force-enrich", action="store_true", help="Force enrichment even if the output file already exists.")
    parser.add_argument("--skip-enrich", action="store_true", help="Run only the collection step.")
    parser.add_argument("--max-pages", type=int, help="Limit the number of pages to fetch.")
    parser.add_argument("--fetch-timeout", type=int, default=20, help="Timeout in seconds for collection (default: 20).")
    parser.add_argument("--fetch-max-retries", type=int, default=10, help="Maximum retry attempts for collection (default: 10).")
    parser.add_argument("--fetch-retry-wait", type=float, default=5.0, help="Seconds to wait between collection retries (default: 5).")
    parser.add_argument("--enrich-timeout", type=int, default=30, help="Timeout in seconds for enrichment (default: 30).")
    parser.add_argument("--enrich-max-retries", type=int, default=5, help="Maximum retry attempts for enrichment (default: 5).")
    parser.add_argument("--enrich-retry-wait", type=float, default=60.0, help="Seconds to wait between enrichment retries (default: 60).")
    parser.add_argument("--enrich-delay", type=float, default=0.0, help="Delay between enrichment requests.")
    parser.add_argument("--enrich-limit", type=int, help="Limit the number of projects to enrich (useful for tests).")
    parser.add_argument("--skip-supabase", action="store_true", help="Skip Supabase sync step.")
    parser.add_argument("--days-filter", type=int, help="Filter projects from the last N days (e.g., 90 for last 90 days). Uses created_at timestamp.")
    parser.add_argument(
        "--stop-on-existing",
        dest="stop_on_existing",
        action="store_true",
        default=True,
        help="Stop fetching when a page contains any project already in Supabase (default: on).",
    )
    parser.add_argument(
        "--no-stop-on-existing",
        dest="stop_on_existing",
        action="store_false",
        help="Fetch all pages even if existing projects are found in Supabase.",
    )
    parser.add_argument(
        "--debug-local",
        action="store_true",
        help="Enable local debug outputs (projects.json/enriched.json). Without this flag, no JSON files are written.",
    )
    # Contact extraction flags
    parser.add_argument("--limit-contacts", type=int, help="Limit number of creators to process for contact extraction.")
    parser.add_argument("--dry-run-contacts", action="store_true", help="Do not persist contact extraction results.")
    parser.add_argument("--skip-contacts", action="store_true", help="Skip contact extraction step.")
    parser.add_argument("--export-xlsx", action="store_true", help="Export creators XLSX from enriched data (optional artifact).")
    parser.add_argument("--export-path", type=Path, default=Path("creators_export.xlsx"), help="Path for optional XLSX export.")
    parser.add_argument("--skip-export", action="store_true", help="Ignore XLSX export (compatibility flag).")
    parser.add_argument("--skip-fetch", action="store_true", help="Skip Kickstarter fetch step.")
    parser.add_argument("--contacts-only", action="store_true", help="Run only contact extraction (skip fetch/enrich/sync/export).")
    return parser.parse_args(argv)


def load_projects_from_disk(path: Path) -> List[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: List[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def setup_pipeline_logging(log_file: Path = Path("logs/pipeline.log"), level: int = logging.INFO) -> None:
    """Configure root logging to file + stdout."""
    log_file.parent.mkdir(parents=True, exist_ok=True)
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter("%(message)s"))

    logging.basicConfig(
        level=level,
        handlers=[file_handler, console_handler],
        force=True,
    )
    # Silence noisy HTTP clients unless debugging
    noisy_loggers = ["httpx", "httpcore", "urllib3", "hpack"]
    quiet_level = logging.WARNING if level > logging.DEBUG else level
    for name in noisy_loggers:
        logging.getLogger(name).setLevel(quiet_level)



def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)

    # Logging setup (captures contact runner logs too)
    log_level = logging.DEBUG if args.debug else logging.INFO
    setup_pipeline_logging(level=log_level)

    # Contacts-only mode (skip fetch/enrich/sync/export)
    if args.contacts_only:
        contact_args = []
        if args.limit_contacts:
            contact_args.extend(["--limit-contacts", str(args.limit_contacts)])
        if args.dry_run_contacts:
            contact_args.append("--dry-run-contacts")
        if args.skip_contacts:
            contact_args.append("--skip-contacts")
        return run_contacts(contact_args)

    # Single rotating proxy (env wins unless disabled)
    base_proxy_url = None
    if not args.disable_proxy:
        env_proxy = os.environ.get('PROXY_URL')
        if env_proxy:
            base_proxy_url = env_proxy
            print("🔧 Using proxy from environment variable")
        elif args.proxy_url:
            base_proxy_url = args.proxy_url
            print("🔧 Using proxy from CLI argument")
    else:
        print("🚫 Proxy disabled via --disable-proxy")

    projects_path = args.projects_path
    enriched_path = args.enriched_path
    
    # Store scraper configuration for recreation on retry
    scraper_config = {
        'debug': args.debug,
        'browser': args.browser,
        'platform': args.platform,
        'mobile': args.mobile,
        'cloudscraper_debug': args.cloudscraper_debug,
    }

    supabase = None
    existing_checker_fn: Optional[Callable[[List[Dict[str, Any]]], List[int]]] = None
    if args.stop_on_existing:
        try:
            supabase = get_supabase_client()
        except Exception as exc:  # noqa: BLE001
            print(f"❌ Supabase client not available for stop-on-existing: {exc}", file=sys.stderr)
            return 1

        def _to_int(value: Any) -> Optional[int]:
            if isinstance(value, bool):
                return None
            if isinstance(value, int):
                return value
            if isinstance(value, float) and value.is_integer():
                return int(value)
            if isinstance(value, str):
                try:
                    return int(value)
                except ValueError:
                    return None
            return None

        def _existing_checker(projects: List[Dict[str, Any]]) -> List[int]:
            raw_ids: List[int] = []
            for p in projects:
                pid = p.get('id')
                coerced = _to_int(pid)
                if coerced is not None:
                    raw_ids.append(coerced)
            if not raw_ids:
                return []
            try:
                result = supabase.table('projects').select('id').in_('id', raw_ids).execute()
                data = result.data or []
                existing_ids: List[int] = []
                for row in data:
                    if isinstance(row, dict):
                        coerced = _to_int(row.get('id'))
                        if coerced is not None:
                            existing_ids.append(coerced)
                if existing_ids:
                    if args.debug:
                        print(
                            f"   ⚠️  Existing projects already in Supabase ({len(existing_ids)}); skipping.",
                            flush=True,
                        )
                    else:
                        print(
                            f"   ⚠️  Existing projects found in Supabase; skipping current page.",
                            flush=True,
                        )
                return existing_ids
            except Exception as exc:  # noqa: BLE001
                print(f"   ⚠️  Failed to check existing projects in Supabase: {exc}", flush=True)
                return []

        existing_checker_fn = _existing_checker

    try:
        projects_path = args.projects_path if args.debug_local else None
        enriched_path = args.enriched_path if args.debug_local else None

        if args.skip_fetch:
            print("⏭️  Skipping fetch (--skip-fetch)")
            projects = []
        elif args.force_fetch or not (projects_path and projects_path.exists()):
            print("🚀 Starting collection of 'upcoming' projects...")
            fetch_scraper = create_scraper(
                proxy_url=base_proxy_url,
                **scraper_config
            )
            projects = fetch_all_projects(
                fetch_scraper,
                max_pages=args.max_pages,
                timeout=args.fetch_timeout,
                max_retries=args.fetch_max_retries,
                retry_wait=args.fetch_retry_wait,
                debug=args.debug,
                base_proxy_url=base_proxy_url,
                scraper_config=scraper_config,
                existing_checker=existing_checker_fn,
            )
            if args.debug_local and projects_path:
                save_projects(projects, projects_path)
                print(f"✅ Collection complete. {len(projects)} projects saved to {projects_path}")
            else:
                print(f"✅ Collection complete. {len(projects)} projects (not persisted to disk)")
        else:
            print(f"ℹ️ Using existing projects from {projects_path}")
            projects = load_projects_from_disk(projects_path)
        
        # Apply days filter if specified
        if args.days_filter:
            cutoff_time = time.time() - (args.days_filter * 86400)  # Convert days to seconds
            projects_before = len(projects)
            projects = [p for p in projects if p.get('created_at', 0) >= cutoff_time]
            projects_after = len(projects)
            print(f"📅 Applied {args.days_filter}-day filter: {projects_before} → {projects_after} projects")
            if projects_after == 0:
                print("⚠️  Warning: No projects found within the specified date range!")
                return 0

        if args.skip_enrich:
            enriched = projects
            if args.debug_local and enriched_path:
                write_json(enriched_path, enriched)
            if not args.skip_supabase:
                sync_all_to_supabase(enriched)
        else:
            print("🚀 Starting project enrichment...")
            enrich_scraper = create_scraper(
                debug=args.debug,
                browser=args.browser,
                platform=args.platform,
                mobile=args.mobile,
                proxy_url=base_proxy_url,
                cloudscraper_debug=args.cloudscraper_debug,
            )
            # Configure single proxy directly to avoid ProxyManager
            if base_proxy_url:
                enrich_scraper.proxies = {
                    'http': base_proxy_url,
                    'https': base_proxy_url,
                }
                print("🔧 Using single proxy (no rotation)")
            
            enriched = enrich_projects(
                projects,
                enrich_scraper,
                timeout=args.enrich_timeout,
                max_retries=args.enrich_max_retries,
                retry_wait=args.enrich_retry_wait,
                delay=args.enrich_delay,
                limit=args.enrich_limit,
                base_proxy_url=base_proxy_url,
                scraper_config=scraper_config,
            )
            if args.debug_local and enriched_path:
                write_json(enriched_path, enriched)
                print(f"✅ Enrichment complete. Output saved to {enriched_path}")
            else:
                print(f"✅ Enrichment complete. Processed {len(enriched)} projects (not persisted to disk)")

        # Sync to Supabase if not skipped
        if not args.skip_supabase:
            try:
                sync_all_to_supabase(enriched)
            except Exception as e:
                print(f"❌ Supabase sync failed: {e}", file=sys.stderr)
                if args.debug:
                    import traceback
                    traceback.print_exc()
                # Don't fail the entire pipeline if Supabase sync fails
                print("⚠️  Continuing despite Supabase sync failure...")
        else:
            print("⏭️  Skipping Supabase sync (--skip-supabase flag set)")

        # Contact extraction step (Firecrawl) using Supabase data
        if not args.skip_contacts:
            print("\n🚀 Starting contact extraction (Firecrawl)...")
            try:
                # Reuse CLI flags for contacts; forward only contact-related args
                contact_args = []
                if args.limit_contacts:
                    contact_args.extend(["--limit-contacts", str(args.limit_contacts)])
                if args.dry_run_contacts:
                    contact_args.append("--dry-run-contacts")
                # call runner; it will use supabase client internally
                run_contacts(contact_args)
            except Exception as e:  # noqa: BLE001
                print(f"⚠️  Contact extraction failed: {e}", file=sys.stderr)
                if args.debug:
                    import traceback
                    traceback.print_exc()
        else:
            print("⏭️  Skipping contact extraction (--skip-contacts flag set)")

        # Optional XLSX export (artifact only)
        if args.export_xlsx and not args.skip_export:
            try:
                print("\n📤 Exporting XLSX artifact...")
                exporter.export_projects_to_excel(enriched, args.export_path)
            except Exception as e:  # noqa: BLE001
                print(f"⚠️  XLSX export failed: {e}", file=sys.stderr)
                if args.debug:
                    import traceback
                    traceback.print_exc()


    except requests.HTTPError as exc:
        print(f"HTTP error: {exc}", file=sys.stderr)
        if exc.response is not None:
            body = exc.response.text
            print("Corpo da resposta (primeiros 500 chars):", file=sys.stderr)
            print(body[:500], file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error: {exc}", file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(f"Session preparation failed: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

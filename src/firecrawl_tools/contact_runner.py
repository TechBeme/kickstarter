from __future__ import annotations

import argparse
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import Client

from .contact_selector import (
    compute_site_hash,
    fetch_creators_needing_contact,
    normalize_primary_site,
)
from .firecrawl_extractor import FirecrawlExtractor
from .contact_validator import ContactValidator
from .account_manager import AccountManager
from .domain_blocker import DomainBlocker

try:
    # Preferred absolute import
    from src.kickstarter_tools.supabase_sync import get_supabase_client
except ImportError:  # pragma: no cover - fallback
    from ..kickstarter_tools.supabase_sync import get_supabase_client


logger = logging.getLogger(__name__)


def _parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run Firecrawl contact extraction for creators needing contact."
    )
    parser.add_argument("--limit-contacts", type=int, help="Limit number of creators to process.")
    parser.add_argument("--dry-run-contacts", action="store_true", help="Do not persist results.")
    parser.add_argument("--skip-contacts", action="store_true", help="Skip contact extraction step.")
    parser.add_argument("--log-level", default="INFO", help="Logging level (default: INFO).")
    parser.add_argument("--contacts-workers", type=int, default=100, help="Parallel workers for Firecrawl (map/scrape).")
    parser.add_argument("--contacts-batch-size", type=int, default=20, help="Persist contact results every N creators.")
    return parser.parse_args(argv)


def _build_payload(
    creator: Dict[str, Any],
    result: Dict[str, Any],
    contact_status: str,
) -> Dict[str, Any]:
    """Prepare outreach payload row for Supabase RPC."""
    return {
        "creator_id": creator["id"],
        "email": result.get("email"),
        "email_source_url": result.get("email_source_url"),
        "has_contact_form": result.get("has_contact_form") or False,
        "contact_form_url": result.get("contact_form_url"),
        "contact_status": contact_status,
        "contact_error": result.get("error"),
        "contact_attempts": (creator.get("outreach") or {}).get("contact_attempts", 0) + 1,
        "last_contact_check_at": datetime.now(timezone.utc).isoformat(),
        "site_hash": result.get("site_hash"),
    }


def _persist_results(
    supabase: Client,
    payload: List[Dict[str, Any]],
    dry_run: bool = False,
) -> None:
    if not payload:
        return
    if dry_run:
        logger.info("[dry-run] Skipping save of %s contacts", len(payload))
        return
    try:
        res = supabase.rpc("sync_creator_outreach_bulk", {"outreach_data": payload}).execute()
        logger.info("💾 Saved %s contacts to Supabase", len(payload))
        logger.debug("Persist response: %s", res.data)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to persist contact results: %s", exc)
        raise


def _update_pipeline_state(supabase: Client, dry_run: bool = False) -> None:
    if dry_run:
        logger.info("[dry-run] Skipping pipeline_state update")
        return
    try:
        supabase.table("pipeline_state").update(
            {"last_contact_check_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", 1).execute()
        logger.info("Updated pipeline_state.last_contact_check_at")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to update pipeline_state: %s", exc)


def _select_targets(limit_contacts: Optional[int], supabase: Optional[Client]) -> List[Dict[str, Any]]:
    return fetch_creators_needing_contact(limit=limit_contacts, supabase=supabase)


def _extract_for_creator(
    extractor: FirecrawlExtractor,
    validator: ContactValidator,
    creator: Dict[str, Any],
) -> Dict[str, Any]:
    """Run Firecrawl across all creator sites until email+form found or exhaust."""
    websites = creator.get("websites") or []
    valid_sites: List[str] = []
    for site in websites:
        if not isinstance(site, dict):
            continue
        raw = site.get("url")
        if not raw:
            continue
        norm = validator.normalize_url(raw)
        if norm and validator.is_valid_url(norm):
            valid_sites.append(norm)

    if not valid_sites:
        return {"error": "no_valid_site"}

    best_email = None
    best_email_source = None
    best_form_url = None
    best_has_form = None
    status_priority = {"completed": 3, "blocked": 2, "error": 1, "not_found": 0, None: -1}
    best_status = "not_found"
    used_site_hash = None

    for site in valid_sites:
        email, email_source, has_form, form_url, status = extractor.extract_contact_info(
            url=site,
            creator_name=creator.get("name", ""),
            project_name="",
        )

        if email and not validator.is_valid_email(email):
            email = None
            email_source = None
        if form_url and not validator.is_valid_url(form_url):
            form_url = None
            has_form = False

        # Keep best findings
        if email and not best_email:
            best_email = email
            best_email_source = email_source
        if has_form and not best_has_form:
            best_has_form = has_form
            best_form_url = form_url

        used_site_hash = compute_site_hash(site)
        if status_priority.get(status, 0) > status_priority.get(best_status, 0):
            best_status = status

        # Stop if we have both email and form
        if best_email and best_has_form:
            break

    return {
        "email": best_email,
        "email_source_url": best_email_source,
        "has_contact_form": best_has_form,
        "contact_form_url": best_form_url,
        "status": best_status or "not_found",
        "site_hash": used_site_hash,
    }


def run_contacts(
    argv: Optional[List[str]] = None,
    supabase_client: Optional[Client] = None,
    extractor: Optional[FirecrawlExtractor] = None,
) -> int:
    args = _parse_args(argv)
    log_level = getattr(logging, args.log_level.upper(), logging.INFO)
    # Configure logging only if not already set by the pipeline runner
    if not logging.getLogger().handlers:
        logging.basicConfig(level=log_level, format="%(message)s")
    else:
        logging.getLogger().setLevel(log_level)
    if log_level > logging.DEBUG:
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("firecrawl").setLevel(logging.WARNING)
        logging.getLogger("postgrest").setLevel(logging.WARNING)

    if args.skip_contacts:
        logger.info("⏭️  Skipping contact extraction (--skip-contacts)")
        return 0

    supabase = supabase_client or get_supabase_client()
    selector_rows = _select_targets(args.limit_contacts, supabase)

    if not selector_rows:
        logger.info("✨ No creators pending contact extraction. Nothing to do.")
        return 0

    validator = ContactValidator()

    # FirecrawlExtractor expects a config-like object; pass a minimal shim
    class _ConfigShim:
        STATUS_COMPLETED = "completed"
        STATUS_NOT_FOUND = "not_found"
        STATUS_BLOCKED = "blocked"
        STATUS_ERROR = "error"
        MAX_RETRIES = 3
        REQUEST_DELAY = 0.5  # tighter for parallel

    # Prepare shared domain blocker (single load from Supabase)
    shared_blocker = DomainBlocker(disable_local_cache=True)

    # Prepare multiple extractors (one per worker) with separate account managers
    max_workers = max(1, args.contacts_workers)
    extractors: List[FirecrawlExtractor] = []
    for _ in range(max_workers):
        try:
            am = AccountManager()
            ext = FirecrawlExtractor(config=_ConfigShim, account_manager=am, domain_blocker=shared_blocker)
            extractors.append(ext)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to init extractor: %s", exc)
    if not extractors:
        logger.error("No extractors available for parallel processing")
        return 1

    payload: List[Dict[str, Any]] = []
    processed_count = 0

    from concurrent.futures import ThreadPoolExecutor, as_completed

    logger.info(
        "📞 Starting Firecrawl contact extraction for %s creators | workers=%s | batch=%s",
        len(selector_rows),
        len(extractors),
        max(1, args.contacts_batch_size),
    )
    with ThreadPoolExecutor(max_workers=len(extractors)) as executor:
        future_map = {}
        for idx, creator in enumerate(selector_rows):
            extractor_for_worker = extractors[idx % len(extractors)]
            future = executor.submit(_extract_for_creator, extractor_for_worker, validator, creator)
            future_map[future] = creator

        batch_size = max(1, args.contacts_batch_size)
        for future in as_completed(future_map):
            creator = future_map[future]
            try:
                result = future.result()
                status = result.get("status") or "not_found"
                payload.append(_build_payload(creator, result, contact_status=status))
            except Exception as exc:  # noqa: BLE001
                logger.error("Error extracting for creator %s: %s", creator.get("id"), exc)
                payload.append(
                    _build_payload(
                        creator,
                        {"error": str(exc), "site_hash": compute_site_hash(creator.get("primary_site"))},
                        contact_status="error",
                    )
                )
            processed_count += 1
            # Persist in batches
            if len(payload) >= batch_size:
                _persist_results(supabase, payload, dry_run=args.dry_run_contacts)
                payload.clear()

    # Persist remaining
    _persist_results(supabase, payload, dry_run=args.dry_run_contacts)
    _update_pipeline_state(supabase, dry_run=args.dry_run_contacts)
    logger.info("Contact extraction finished. Processed: %s", processed_count)
    return 0


if __name__ == "__main__":  # pragma: no cover
    run_contacts()

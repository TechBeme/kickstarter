from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from supabase import Client

try:
    # Preferred absolute import when PYTHONPATH includes repo root
    from src.kickstarter_tools.supabase_sync import get_supabase_client
except ImportError:  # pragma: no cover - fallback for module execution
    from ..kickstarter_tools.supabase_sync import get_supabase_client


logger = logging.getLogger(__name__)


def _parse_dt(value: Any) -> Optional[datetime]:
    """Parse an ISO timestamp string into datetime (UTC-aware when possible)."""
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _is_gt(value: Any, compare_iso: str) -> bool:
    """Check if value datetime is greater than a comparison ISO string."""
    base = _parse_dt(value)
    cmp_dt = _parse_dt(compare_iso)
    if not base or not cmp_dt:
        return False
    return base > cmp_dt


def normalize_primary_site(websites: Optional[List[Dict[str, Any]]]) -> Optional[str]:
    """Pick the primary website URL (first valid) and normalize scheme/host."""
    if not websites:
        return None

    for site in websites:
        if not isinstance(site, dict):
            continue
        raw_url = site.get("url") or ""
        if not raw_url:
            continue
        parsed = urlparse(raw_url if "://" in raw_url else f"https://{raw_url}")
        if not parsed.netloc:
            continue
        scheme = parsed.scheme or "https"
        host = parsed.netloc
        path = parsed.path or ""
        normalized = f"{scheme}://{host}{path}".rstrip("/")
        return normalized
    return None


def compute_site_hash(url: Optional[str]) -> Optional[str]:
    """Compute a stable hash for the canonical host (lowercase, no www)."""
    if not url:
        return None
    parsed = urlparse(url if "://" in url else f"https://{url}")
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    if not host:
        return None
    return hashlib.sha256(host.encode("utf-8")).hexdigest()


def _get_last_contact_check(supabase: Client) -> Optional[str]:
    """Fetch last_contact_check_at from pipeline_state (id=1)."""
    try:
        result = (
            supabase.table("pipeline_state")
            .select("last_contact_check_at")
            .eq("id", 1)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if rows and isinstance(rows[0], dict):
            return rows[0].get("last_contact_check_at")
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Could not read pipeline_state: {exc}")
    return None


def fetch_creators_needing_contact(
    limit: Optional[int] = None,
    supabase: Optional[Client] = None,
) -> List[Dict[str, Any]]:
    """
    Select creators that still need contact extraction.

    Criteria:
    - No email and no contact form recorded, OR
    - site_hash differs from current primary site, OR
    - never checked (last_contact_check_at is null)
    Filtered to newly created/updated creators when pipeline_state.last_contact_check_at exists.
    """
    client = supabase or get_supabase_client()
    last_contact_ts = _get_last_contact_check(client)

    query = client.table("creators").select(
        "id,name,slug,websites,created_at,updated_at,"
        "creator_outreach("
        "email,has_contact_form,contact_form_url,contact_status,"
        "contact_attempts,site_hash,last_contact_check_at,updated_at"
        ")"
    )

    if last_contact_ts:
        query = query.or_(
            f"created_at.gt.{last_contact_ts},updated_at.gt.{last_contact_ts}"
        )

    if limit:
        query = query.limit(limit)

    result = query.execute()
    rows = result.data or []
    selected: List[Dict[str, Any]] = []

    for row in rows:
        outreach = row.get("creator_outreach") or {}
        primary_site = normalize_primary_site(row.get("websites"))
        computed_hash = compute_site_hash(primary_site)

        has_email = bool(outreach.get("email"))
        has_form = bool(outreach.get("has_contact_form"))
        stored_hash = outreach.get("site_hash")
        last_check = outreach.get("last_contact_check_at")

        missing_contact = not has_email and not has_form
        site_changed = bool(computed_hash and stored_hash and computed_hash != stored_hash)
        never_checked = not last_check
        not_executed = (outreach.get("contact_status") in (None, "not_checked")) and (outreach.get("contact_attempts") in (None, 0))

        if last_contact_ts:
            updated_recently = (
                _is_gt(row.get("created_at"), last_contact_ts)
                or _is_gt(row.get("updated_at"), last_contact_ts)
                or _is_gt(outreach.get("updated_at"), last_contact_ts)
            )
            if not updated_recently:
                continue

        if (missing_contact or site_changed or never_checked) and not_executed:
            selected.append(
                {
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "slug": row.get("slug"),
                    "websites": row.get("websites") or [],
                    "primary_site": primary_site,
                    "computed_site_hash": computed_hash,
                    "outreach": outreach,
                }
            )

    logger.debug("Contact queue: %s creators", len(selected))
    return selected

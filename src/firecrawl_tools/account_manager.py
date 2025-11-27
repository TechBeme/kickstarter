"""Account manager for rotating Firecrawl API keys."""

import logging
from datetime import datetime
from threading import Lock
from typing import Optional, Dict, List, Any

from dotenv import load_dotenv

try:
    from src.kickstarter_tools.supabase_sync import get_supabase_client
except ImportError:  # pragma: no cover
    from ..kickstarter_tools.supabase_sync import get_supabase_client

# Load env for Supabase credentials
load_dotenv()


class AccountManager:
    """Manages rotation of Firecrawl API accounts stored in Supabase."""

    _cached_accounts: List[Dict[str, Any]] = []
    _cache_lock: Lock = Lock()

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.supabase = self._get_supabase_client_optional()
        self.accounts: List[Dict] = []
        self.current_account: Optional[Dict] = None
        self._load_accounts()

    def _get_supabase_client_optional(self):
        try:
            return get_supabase_client()
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Supabase client required for AccountManager: {exc}")

    def _load_accounts(self):
        """Load accounts from Supabase, cached across instances."""
        with AccountManager._cache_lock:
            if not AccountManager._cached_accounts:
                result = self.supabase.table("firecrawl_accounts").select("*").execute()
                data = result.data or []
                rows: List[Dict[str, Any]] = [
                    row for row in data if isinstance(row, dict)
                ]
                # Keep only non-empty keys
                AccountManager._cached_accounts = [
                    {
                        "id": row.get("id"),
                        "email": row.get("email"),
                        "api_key": row.get("api_key"),
                        "status": row.get("status", "active"),
                        "exhausted_at": row.get("exhausted_at"),
                    }
                    for row in rows
                    if row.get("api_key")
                ]
                self.logger.debug(
                    "Loaded %s accounts from Supabase (%s active)",
                    len(AccountManager._cached_accounts),
                    len([a for a in AccountManager._cached_accounts if a.get("status") == "active"]),
                )
            # Copy cache to instance
            self.accounts = [dict(a) for a in AccountManager._cached_accounts]

    def _update_cache_status(self, api_key: str, status: str, exhausted_at: Optional[str] = None):
        with AccountManager._cache_lock:
            if AccountManager._cached_accounts:
                for acc in AccountManager._cached_accounts:
                    if acc.get("api_key") == api_key:
                        acc["status"] = status
                        acc["exhausted_at"] = exhausted_at
            # Sync local copy
            for acc in self.accounts:
                if acc.get("api_key") == api_key:
                    acc["status"] = status
                    acc["exhausted_at"] = exhausted_at

    def get_active_account(self) -> Optional[Dict]:
        """Get current active account or next available one."""
        if self.current_account and self.current_account.get("status") == "active":
            return self.current_account

        for account in self.accounts:
            if account.get("status") == "active":
                self.current_account = account
                self.logger.debug(
                    "Using account id=%s email=%s", account.get("id"), account.get("email")
                )
                return account

        self.logger.error("No active accounts available!")
        return None

    def mark_account_exhausted(self, api_key: str):
        """Mark account as exhausted (out of credits)."""
        now_iso = datetime.now().isoformat()
        try:
            self.supabase.table("firecrawl_accounts").update(
                {"status": "exhausted", "exhausted_at": now_iso}
            ).eq("api_key", api_key).execute()
        except Exception as exc:  # noqa: BLE001
            self.logger.warning(f"Failed to update account in Supabase: {exc}")

        self._update_cache_status(api_key, "exhausted", now_iso)

        exhausted_id = next((a.get("id") for a in self.accounts if a.get("api_key") == api_key), None)
        self.logger.warning("❌ Account marked as EXHAUSTED (id=%s)", exhausted_id)
        if self.current_account and self.current_account.get("api_key") == api_key:
            self.current_account = None

        active_remaining = len([a for a in self.accounts if a.get("status") == "active"])
        self.logger.info(f"📊 Remaining active accounts: {active_remaining}")
        return True

    def get_current_api_key(self) -> Optional[str]:
        """Get current API key."""
        account = self.get_active_account()
        return account.get("api_key") if account else None

    def has_active_accounts(self) -> bool:
        """Check if there are any active accounts available."""
        return any(a.get("status") == "active" for a in self.accounts)

    def get_stats(self) -> Dict:
        """Get statistics about accounts."""
        total = len(self.accounts)
        active = len([a for a in self.accounts if a.get("status") == "active"])
        exhausted = len([a for a in self.accounts if a.get("status") == "exhausted"])

        return {
            'total': total,
            'active': active,
            'exhausted': exhausted,
            'current_account_id': self.current_account.get('id') if self.current_account else None
        }

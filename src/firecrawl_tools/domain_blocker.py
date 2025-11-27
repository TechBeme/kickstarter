"""
Dynamic Domain Blocker
Automatically detects and caches domains that are not supported by Firecrawl
"""

import json
from urllib.parse import urlparse
from typing import Set, Optional
from pathlib import Path
import logging

from supabase import Client
from dotenv import load_dotenv

try:
    # Preferred absolute import
    from src.kickstarter_tools.supabase_sync import get_supabase_client
except ImportError:  # pragma: no cover - fallback
    from ..kickstarter_tools.supabase_sync import get_supabase_client

# Ensure env is loaded for Supabase credentials
load_dotenv()


class DomainBlocker:
    """Manages a dynamic list of blocked domains based on Firecrawl responses"""
    
    BLOCKED_DOMAINS_FILE = 'blocked_domains.json'
    NOT_SUPPORTED_PATTERNS = [
        'not currently supported',
        'this website is not currently supported',
        'please reach out to help@firecrawl.com',
        'website not supported',
    ]
    
    def __init__(self, cache_dir: str = '.', supabase_client: Optional[Client] = None, dry_run: bool = False, disable_local_cache: bool = True):
        """
        Initialize the domain blocker
        
        Args:
            cache_dir: Directory where blocked_domains.json will be stored
        """
        self.cache_path = Path(cache_dir) / self.BLOCKED_DOMAINS_FILE
        self.dry_run = dry_run
        self.disable_local_cache = disable_local_cache
        self.supabase = supabase_client or self._get_supabase_client_optional()
        self.logger = logging.getLogger(__name__)
        self.blocked_domains: Set[str] = set()
        self._load_blocked_domains()
    
    def _get_supabase_client_optional(self) -> Optional[Client]:
        """Create Supabase client if env vars are available; otherwise return None."""
        try:
            return get_supabase_client()
        except Exception:
            return None

    def _load_blocked_domains(self) -> None:
        """Load blocked domains from Supabase if possible; fallback to local JSON."""
        supa_set: Set[str] = set()
        local_set: Set[str] = set()

        # Load from Supabase
        if self.supabase:
            try:
                result = self.supabase.table("firecrawl_blocked_domains").select("domain").execute()
                rows = result.data or []
                for row in rows:
                    dom = row.get("domain")
                    if isinstance(dom, str) and dom.strip():
                        supa_set.add(dom.strip().lower())
                # Log only once on initial load
                self.logger.debug("Blocked domains loaded from Supabase: %s", len(supa_set))
            except Exception as exc:  # noqa: BLE001
                self.logger.warning("Could not load blocked domains from Supabase: %s", exc)

        # Load from local file unless disabled
        if not self.disable_local_cache and self.cache_path.exists():
            try:
                with open(self.cache_path, 'r') as f:
                    data = json.load(f)
                    local_set = set(data.get('blocked_domains', []))
                    if local_set:
                        self.logger.debug("Loaded %s blocked domains from local cache", len(local_set))
            except Exception as e:
                self.logger.warning(f"Could not load blocked domains locally: {e}")

        # Union sets
        union_set = supa_set.union(local_set)
        self.blocked_domains = union_set

        # If Supabase is available and local has entries missing there, push them
        missing = local_set - supa_set
        if missing and self.supabase and not self.dry_run:
            try:
                payload = [{"domain": dom, "reason": "Not supported by Firecrawl", "source": "firecrawl"} for dom in missing]
                self.supabase.table("firecrawl_blocked_domains").upsert(payload).execute()
                self.logger.info(f"Synced {len(missing)} local blocked domains to Supabase")
            except Exception as exc:  # noqa: BLE001
                self.logger.warning(f"Failed to sync local blocked domains to Supabase: {exc}")
    
    def _save_blocked_domains(self) -> None:
        """Save blocked domains to Supabase (if available) and local cache (buffer)."""
        # Local cache disabled or dry-run: skip writing file
        if self.disable_local_cache or self.dry_run:
            return
        try:
            data = {
                'blocked_domains': sorted(list(self.blocked_domains)),
                'count': len(self.blocked_domains),
                'description': 'Domains automatically detected as not supported by Firecrawl'
            }
            with open(self.cache_path, 'w') as f:
                json.dump(data, f, indent=2)
            self.logger.info(f"Saved {len(self.blocked_domains)} blocked domains to {self.cache_path}")
        except Exception as e:
            self.logger.error(f"Failed to save blocked domains: {e}")
    
    def extract_domain(self, url: str) -> Optional[str]:
        """
        Extract domain from URL
        
        Args:
            url: Full URL string
            
        Returns:
            Domain string (e.g., 'reddit.com') or None if invalid
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix for consistency
            if domain.startswith('www.'):
                domain = domain[4:]
                
            return domain if domain else None
        except Exception:
            return None
    
    def is_blocked(self, url: str) -> bool:
        """
        Check if a URL's domain is blocked
        
        Args:
            url: Full URL to check
            
        Returns:
            True if domain is in blocked list, False otherwise
        """
        domain = self.extract_domain(url)
        if not domain:
            return False
            
        return domain in self.blocked_domains
    
    def is_not_supported_error(self, error_message: str) -> bool:
        """
        Check if error message indicates domain is not supported
        
        Args:
            error_message: Error message from Firecrawl
            
        Returns:
            True if error indicates unsupported domain
        """
        error_lower = error_message.lower()
        return any(pattern in error_lower for pattern in self.NOT_SUPPORTED_PATTERNS)
    
    def block_domain(self, url: str, reason: str = "Not supported by Firecrawl") -> bool:
        """
        Add a domain to the blocked list
        
        Args:
            url: URL whose domain should be blocked
            reason: Reason for blocking (logged but not stored)
            
        Returns:
            True if domain was newly added, False if already blocked
        """
        domain = self.extract_domain(url)
        if not domain:
            return False
            
        if domain in self.blocked_domains:
            return False
            
        self.blocked_domains.add(domain)
        # Persist to Supabase if available
        if self.supabase and not self.dry_run:
            self._persist_to_supabase(domain, reason)
        else:
            self.logger.info("Dry-run or no Supabase: blocked domain kept local only")
        # Persist local cache as buffer
        self._save_blocked_domains()
        self.logger.info(f"🚫 Blocked domain: {domain} - {reason}")
        return True

    def _persist_to_supabase(self, domain: str, reason: str) -> None:
        """Upsert blocked domain into Supabase (table or RPC)."""
        if not self.supabase:
            return
        payload = {
            "p_domain": domain.lower(),
            "p_reason": reason,
            "p_source": "firecrawl",
            "p_notes": None,
        }
        try:
            # Prefer RPC for single upsert
            self.supabase.rpc("firecrawl_block_domain", payload).execute()
            self.logger.info(f"Saved blocked domain to Supabase: {domain}")
        except Exception as exc:  # noqa: BLE001
            self.logger.warning(f"RPC firecrawl_block_domain failed ({domain}): {exc}, falling back to table upsert")
            try:
                self.supabase.table("firecrawl_blocked_domains").upsert(
                    {
                        "domain": domain.lower(),
                        "reason": reason,
                        "source": "firecrawl",
                    }
                ).execute()
            except Exception as exc2:  # noqa: BLE001
                self.logger.error(f"Failed to upsert blocked domain to Supabase: {exc2}")
    
    def get_blocked_count(self) -> int:
        """Get number of blocked domains"""
        return len(self.blocked_domains)
    
    def get_blocked_list(self) -> list:
        """Get sorted list of blocked domains"""
        return sorted(list(self.blocked_domains))

"""Firecrawl integration module for extracting contact information."""

import logging
import time
from typing import Optional, Dict, Any, Tuple
from firecrawl import Firecrawl
from firecrawl.v2.utils.error_handler import WebsiteNotSupportedError, PaymentRequiredError
from .domain_blocker import DomainBlocker
from .account_manager import AccountManager


class FirecrawlExtractor:
    """Handles contact information extraction using Firecrawl API v2."""
    
    def __init__(
        self,
        config,
        account_manager: Optional[AccountManager] = None,
        domain_blocker: Optional[DomainBlocker] = None,
    ):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.domain_blocker = domain_blocker or DomainBlocker(disable_local_cache=True)
        
        if account_manager:
            self.account_manager = account_manager
        else:
            self.account_manager = AccountManager()
        
        self._init_client()
        blocked_count = self.domain_blocker.get_blocked_count()
        if blocked_count > 0:
            self.logger.debug("Blocked domains cached: %s", blocked_count)
    
    def _init_client(self):
        """Initialize Firecrawl client with current API key."""
        api_key = self.account_manager.get_current_api_key()
        if not api_key:
            raise Exception("No active API keys available")
        
        self.client = Firecrawl(api_key=api_key)
        self.current_api_key = api_key
    
    def _handle_payment_error(self):
        """Handle payment error by switching to next account."""
        self.logger.warning("💳 Current account out of credits, switching to next account...")
        
        self.account_manager.mark_account_exhausted(self.current_api_key)
        
        if not self.account_manager.has_active_accounts():
            self.logger.error("❌ CRITICAL: All accounts exhausted!")
            self.logger.error("🛑 No more active accounts available")
            raise Exception("ALL_ACCOUNTS_EXHAUSTED")
        
        self._init_client()
        self.logger.info("✅ Switched to new account, retrying...")
    
    
    def extract_contact_info(
        self,
        url: str,
        creator_name: str,
        project_name: str,
        retry_count: int = 0
    ) -> Tuple[Optional[str], Optional[str], Optional[bool], Optional[str], str]:
        """Extract contact info using Map API to find pages, then Scrape API to extract emails."""
        
        if self.domain_blocker.is_blocked(url):
            domain = self.domain_blocker.extract_domain(url)
            self.logger.info(f"🚫 Skipping blocked domain: {domain}")
            return None, None, None, None, self.config.STATUS_BLOCKED
        
        self.logger.info(f"🗺️  Mapping website: {url} (searching for 'contact/email' pages)")
        
        try:
            map_result = self.client.map(
                url=url,
                search="contact",
                limit=5,
                include_subdomains=False,
                sitemap="include"
            )
            
            urls_to_try = []
            if hasattr(map_result, 'links') and map_result.links:
                for link in map_result.links:
                    if hasattr(link, 'url'):
                        urls_to_try.append(link.url)
                    elif isinstance(link, str):
                        urls_to_try.append(link)
                self.logger.info(f"📍 Map found {len(urls_to_try)} pages to try")
            elif isinstance(map_result, dict) and 'links' in map_result:
                for link in map_result['links']:
                    if isinstance(link, dict) and 'url' in link:
                        urls_to_try.append(link['url'])
                    elif isinstance(link, str):
                        urls_to_try.append(link)
                self.logger.info(f"📍 Map found {len(urls_to_try)} pages to try")
            else:
                self.logger.warning(f"Map API returned unexpected format: {map_result}")
                urls_to_try = []
            
            if not urls_to_try:
                self.logger.info("📍 Map found nothing, using fallback URLs")
                urls_to_try = self._generate_contact_urls(url)
        
        except PaymentRequiredError as e:
            self.logger.warning(f"💳 Payment required: {e}")
            self._handle_payment_error()
            return self.extract_contact_info(url, creator_name, project_name, retry_count)
                
        except Exception as e:
            self.logger.warning(f"Map API failed: {e}. Using fallback URLs")
            urls_to_try = self._generate_contact_urls(url)
        
        best_email = None
        best_email_source = None
        best_has_form = None
        best_form_url = None
        
        for idx, try_url in enumerate(urls_to_try):
            self.logger.info(f"🔍 Trying URL {idx+1}/{len(urls_to_try)}: {try_url}")
            
            email, email_source, has_form, form_url, status = self._scrape_for_contact(
                try_url, creator_name, project_name, retry_count
            )
            
            is_contact_page = any(x in try_url.lower() for x in ['/contact', '/about', '/faq'])
            
            if email:
                if not best_email or is_contact_page:
                    if best_email and best_email != email:
                        self.logger.info(f"📧 Updating email from {best_email} to {email} (contact page)")
                    best_email = email
                    best_email_source = email_source
                    self.logger.info(f"✅ Found email: {email}")
            
            if has_form and not best_has_form:
                best_has_form = has_form
                best_form_url = form_url
                self.logger.info(f"✅ Found contact form: {form_url}")
            
            if best_email and best_has_form:
                self.logger.info("✅ Found both email AND form, stopping search")
                break
            
            if idx < len(urls_to_try) - 1:
                time.sleep(1)
        
        # Determine final status
        if best_email or best_has_form:
            final_status = self.config.STATUS_COMPLETED
        else:
            final_status = self.config.STATUS_NOT_FOUND  # Search completed but nothing found
        
        return best_email, best_email_source, best_has_form, best_form_url, final_status
    
    def _generate_contact_urls(self, base_url: str) -> list:
        """Generate list of common contact page URLs to try."""
        from urllib.parse import urlparse, urljoin
        
        parsed = urlparse(base_url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        
        contact_paths = [
            '/contact',
            '/pages/contact',
            '/contact-us',
            '/about',
            '/pages/about',
            '/',
        ]
        
        urls = []
        
        if parsed.path and parsed.path != '/':
            urls.append(base_url.rstrip('/'))
        
        for path in contact_paths:
            full_url = urljoin(base, path)
            if full_url not in urls:
                urls.append(full_url)
        
        return urls[:4]
    
    def _scrape_for_contact(
        self,
        url: str,
        creator_name: str,
        project_name: str,
        retry_count: int = 0
    ) -> Tuple[Optional[str], Optional[str], Optional[bool], Optional[str], str]:
        """Scrape a single URL for contact information using Scrape API."""
        try:
            if self.domain_blocker.is_blocked(url):
                return None, None, None, None, self.config.STATUS_BLOCKED
            
            prompt = """
TASK: Extract the contact email address from this webpage.

CRITICAL RULES - READ CAREFULLY:
1. Extract the email EXACTLY as it appears on the page
   - Copy the EXACT characters you see
   - DO NOT modify, correct, or "fix" the email
   - DO NOT remove parts that look unusual (like "2d6wargaming.com@gmail.com")
   - DO NOT change "2d6wargaming.com@gmail.com" to "2d6wargaming@gmail.com"
   
2. Only extract if you can SEE the email written on the page
   - DO NOT infer emails from domain names
   - DO NOT create emails like "info@domain.com" 
   - If no email is visible, return empty string

3. Contact Form:
   - Return true if there's an HTML contact form on this page
   - Return false otherwise

EXAMPLES:
✅ CORRECT: Page shows "2d6wargaming.com@gmail.com" → Return: "2d6wargaming.com@gmail.com"
✅ CORRECT: Page shows "contact@example.com" → Return: "contact@example.com"  
❌ WRONG: Page shows "2d6wargaming.com@gmail.com" → Return: "2d6wargaming@gmail.com" (YOU CHANGED IT!)
❌ WRONG: Domain is "example.com" → Return: "info@example.com" (YOU MADE IT UP!)

Remember: Copy emails EXACTLY as written. Do not "fix" them.
"""
            
            result = self.client.scrape(
                url=url,
                only_main_content=False,
                formats=[
                    {
                        "type": "json",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {
                                    "type": "string",
                                    "description": "Email address ONLY if explicitly visible on the page"
                                },
                                "has_contact_form": {
                                    "type": "boolean",
                                    "description": "Whether there's a contact form on the page"
                                },
                                "contact_form_url": {
                                    "type": "string",
                                    "description": "URL of the contact form if it exists"
                                }
                            }
                        },
                        "prompt": prompt
                    }
                ]
            )
            
            email = None
            has_form = None
            form_url = None
            
            if hasattr(result, 'json') and result.json:
                data = result.json
                email = data.get('email') if isinstance(data, dict) else None
                has_form = data.get('has_contact_form') if isinstance(data, dict) else None
                form_url = data.get('contact_form_url') if isinstance(data, dict) else None
            elif isinstance(result, dict):
                if 'json' in result:
                    data = result['json']
                elif 'data' in result:
                    data = result['data']
                else:
                    data = result
                    
                email = data.get('email') if isinstance(data, dict) else None
                has_form = data.get('has_contact_form') if isinstance(data, dict) else None
                form_url = data.get('contact_form_url') if isinstance(data, dict) else None
            
            if email:
                email = self._validate_extracted_email(email)
            
            email = email if email and email.strip() else None
            form_url = form_url if form_url and form_url.strip() else None
            email_source = url if email else None
            
            return email, email_source, has_form, form_url, self.config.STATUS_COMPLETED
        
        except PaymentRequiredError as e:
            self.logger.warning(f"💳 Payment required: {e}")
            self._handle_payment_error()
            return self._scrape_for_contact(url, creator_name, project_name, retry_count)
            
        except WebsiteNotSupportedError as e:
            self.logger.warning(f"🚫 Website not supported by Firecrawl: {url}")
            self.domain_blocker.block_domain(url, "Website not supported by Firecrawl")
            return None, None, None, None, self.config.STATUS_BLOCKED
            
        except Exception as e:
            error_msg = str(e).lower()
            
            if 'rate limit' in error_msg or '429' in error_msg:
                if retry_count < self.config.MAX_RETRIES:
                    wait_time = (retry_count + 1) * 5
                    self.logger.warning(
                        f"Rate limit hit, waiting {wait_time}s before retry {retry_count + 1}/{self.config.MAX_RETRIES}"
                    )
                    time.sleep(wait_time)
                    return self._scrape_for_contact(url, creator_name, project_name, retry_count + 1)
            
            if retry_count < self.config.MAX_RETRIES:
                self.logger.warning(f"Error scraping {url}: {e}. Retry {retry_count + 1}/{self.config.MAX_RETRIES}")
                time.sleep(self.config.REQUEST_DELAY)
                return self._scrape_for_contact(url, creator_name, project_name, retry_count + 1)
            
            self.logger.error(f"Failed to scrape {url} after {self.config.MAX_RETRIES} retries: {e}")
            return None, None, None, None, self.config.STATUS_ERROR
    
    def _validate_extracted_email(self, email: str) -> Optional[str]:
        """Basic email validation."""
        if not email or not isinstance(email, str):
            return None
        
        email = email.strip().lower()
        
        if not email or '@' not in email:
            return None
        
        return email

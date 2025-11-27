"""Contact information validator module."""

import re
from typing import Optional
from urllib.parse import urlparse


class ContactValidator:
    """Validates emails and contact form URLs."""
    
    # Email regex pattern (basic validation)
    EMAIL_PATTERN = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    # Common email patterns to exclude (generic/spam)
    EXCLUDE_EMAIL_PATTERNS = [
        r'noreply@',
        r'no-reply@',
        r'donotreply@',
        r'info@example\.',
        r'support@linktree',
        r'hello@linktree',
        r'support@shopify',
        r'admin@example',
    ]
    
    @classmethod
    def is_valid_email(cls, email: Optional[str]) -> bool:
        """
        Validate if the email is in a valid format and not a generic/spam email.
        
        Args:
            email: Email address to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not email or not isinstance(email, str):
            return False
        
        email = email.strip().lower()
        
        # Check basic format
        if not cls.EMAIL_PATTERN.match(email):
            return False
        
        # Check against exclusion patterns
        for pattern in cls.EXCLUDE_EMAIL_PATTERNS:
            if re.search(pattern, email, re.IGNORECASE):
                return False
        
        return True
    
    @classmethod
    def is_valid_url(cls, url: Optional[str]) -> bool:
        """
        Validate if the URL is in a valid format.
        
        Args:
            url: URL to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip()
        
        try:
            result = urlparse(url)
            return all([result.scheme in ['http', 'https'], result.netloc])
        except Exception:
            return False
    
    @classmethod
    def is_social_media_url(cls, url: Optional[str], social_domains: list) -> bool:
        """
        Check if URL is a social media platform.
        
        Args:
            url: URL to check
            social_domains: List of social media domains
            
        Returns:
            bool: True if URL is social media, False otherwise
        """
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip().lower()
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove 'www.' prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Check if domain matches any social media domain
            for social_domain in social_domains:
                if domain == social_domain or domain.endswith('.' + social_domain):
                    return True
            
            return False
        except Exception:
            return False
    
    @classmethod
    def normalize_email(cls, email: Optional[str]) -> Optional[str]:
        """
        Normalize email address (lowercase, trim).
        
        Args:
            email: Email to normalize
            
        Returns:
            str: Normalized email or None
        """
        if not email or not isinstance(email, str):
            return None
        
        return email.strip().lower()
    
    @classmethod
    def normalize_url(cls, url: Optional[str]) -> Optional[str]:
        """
        Normalize URL (trim, ensure scheme).
        
        Args:
            url: URL to normalize
            
        Returns:
            str: Normalized URL or None
        """
        if not url or not isinstance(url, str):
            return None
        
        url = url.strip()
        
        # Add https:// if no scheme
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        return url

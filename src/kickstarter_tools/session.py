#!/usr/bin/env python3
"""Helpers to create configured CloudScraper sessions with optional proxy support."""

from __future__ import annotations

import random
import string
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, urlunparse

import cloudscraper
import requests
def is_rotating_proxy(proxy_url: str) -> bool:
    """
    Check if proxy is a rotating proxy endpoint (automatically rotates IPs).
    These proxies handle rotation internally without needing session params.
    """
    parsed = urlparse(proxy_url)
    if '@' not in parsed.netloc:
        return False
    
    host = parsed.netloc.split('@')[-1].lower()
    rotating_providers = [
        'webshare.io',  # Webshare rotating endpoint (p.webshare.io)
    ]
    
    return any(provider in host for provider in rotating_providers)


def supports_session_params(proxy_url: str) -> bool:
    """
    Check if proxy URL looks like it supports session parameters.
    Currently detects Oxylabs, BrightData, Smartproxy patterns.
    """
    parsed = urlparse(proxy_url)
    if '@' not in parsed.netloc:
        return False
    
    # Check for known session-based proxy providers
    host = parsed.netloc.split('@')[-1].lower()
    session_providers = [
        'oxylabs.io',
        'brightdata.com', 'luminati.io',
        'smartproxy.com',
        'geonode.com',
    ]
    
    return any(provider in host for provider in session_providers)


def rotate_proxy_session(proxy_url: str) -> str:
    """
    Add a random session ID to proxy URL to force IP rotation.
    Only works with proxies that support session parameters (Oxylabs, BrightData, etc.).
    For other proxies, returns the original URL unchanged.
    """
    if not supports_session_params(proxy_url):
        return proxy_url
    
    parsed = urlparse(proxy_url)
    
    # Extract username and password
    if '@' not in parsed.netloc:
        return proxy_url
    
    auth_part, host_part = parsed.netloc.rsplit('@', 1)
    
    # Generate random session ID
    session_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    
    # If username already has -session-, replace it
    if '-session-' in auth_part:
        # Remove existing session parameter
        parts = auth_part.split('-session-')
        base_auth = parts[0]
        # Keep password if it exists
        if ':' in base_auth:
            new_auth = f"{base_auth}-session-{session_id}"
        else:
            new_auth = f"{base_auth}-session-{session_id}"
    else:
        # Add new session parameter before password
        if ':' in auth_part:
            username, password = auth_part.split(':', 1)
            new_auth = f"{username}-session-{session_id}:{password}"
        else:
            new_auth = f"{auth_part}-session-{session_id}"
    
    # Reconstruct URL
    new_netloc = f"{new_auth}@{host_part}"
    new_parsed = parsed._replace(netloc=new_netloc)
    
    return urlunparse(new_parsed)


def get_current_ip(proxy_url: Optional[str] = None) -> str:
    """Get current IP address being used (through proxy if provided)."""
    proxies = None
    if proxy_url:
        proxies = {'http': proxy_url, 'https': proxy_url}
    
    # Try multiple IP check services
    services = [
        'https://api.ipify.org?format=json',
        'http://ip-api.com/json/?fields=query',
        'https://ifconfig.me/ip',
    ]
    
    for service in services:
        try:
            response = requests.get(service, proxies=proxies, timeout=5)
            if 'ipify' in service or 'ip-api' in service:
                return response.json().get('ip', response.json().get('query', 'unknown'))
            else:
                return response.text.strip()
        except Exception:
            continue
    
    return 'unknown'


def create_scraper(
    *,
    debug: bool = False,
    browser: str = "chrome",
    platform: str = "windows",
    mobile: bool = False,
    proxy_url: Optional[str] = None,
    cloudscraper_debug: bool = False,
) -> cloudscraper.CloudScraper:
    """Create a CloudScraper instance with advanced anti-detection configuration."""

    scraper_kwargs = dict(
        debug=cloudscraper_debug,
        interpreter="js2py",
        browser={
            "browser": browser,
            "platform": platform,
            "mobile": mobile,
        },
        allow_brotli=True,
        delay=5,
        enable_stealth=True,
        stealth_options={
            "min_delay": 1.0,
            "max_delay": 3.0,
            "human_like_delays": True,
            "randomize_headers": True,
            "browser_quirks": True,
        },
    )

    scraper = cloudscraper.create_scraper(**scraper_kwargs)
    
    # Disable automatic session refresh on 403 to avoid ProxyManager loops
    # Our manual retry logic with IP rotation handles errors properly
    scraper.auto_refresh_on_403 = False

    if debug:
        print(
            "🧪 Debug session config • managed_pool=0 • "
            f"cloudscraper_debug={'on' if cloudscraper_debug else 'off'}",
            flush=True,
        )

    if proxy_url:
        proxy_val = proxy_url
        # Webshare requires trailing slash
        if 'webshare.io' in proxy_val.lower() and not proxy_val.endswith('/'):
            proxy_val = proxy_val + '/'
        scraper.proxies = {
            'http': proxy_val,
            'https': proxy_val,
        }
        if debug:
            print("🔧 Using configured proxy (masked)", flush=True)

    return scraper

"""Supabase synchronization module for Kickstarter data.

This module uses PostgreSQL RPC functions for efficient bulk operations.
All data is sent to the database in a single call and processed server-side.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List
from datetime import datetime, timezone
import hashlib
import json

from supabase import create_client, Client
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


def unix_to_datetime(unix_timestamp: int | float | None) -> str | None:
    """Convert UNIX timestamp (seconds) to ISO 8601 datetime string with UTC timezone.
    
    Args:
        unix_timestamp: UNIX timestamp in seconds (can be int or float)
    
    Returns:
        ISO 8601 formatted string with UTC timezone, or None if input is None or invalid
    
    Examples:
        >>> unix_to_datetime(1762254705)
        '2025-09-10T12:45:05+00:00'
        >>> unix_to_datetime(None)
        None
        >>> unix_to_datetime(0)
        None
    """
    if unix_timestamp is None or unix_timestamp == 0:
        return None
    
    try:
        # Convert UNIX timestamp to datetime in UTC
        dt = datetime.fromtimestamp(unix_timestamp, tz=timezone.utc)
        # Format as ISO 8601
        return dt.isoformat()
    except (ValueError, OSError, TypeError):
        return None


# Social network mapping (same as exporter.py)
SOCIAL_NETWORKS = {
    'instagram': ['instagram.com'],
    'facebook': ['facebook.com'],
    'twitter': ['twitter.com', 'x.com'],
    'youtube': ['youtube.com'],
    'tiktok': ['tiktok.com'],
    'linkedin': ['linkedin.com'],
    'patreon': ['patreon.com'],
    'discord': ['discord.gg', 'discord.com'],
    'twitch': ['twitch.tv'],
    'bluesky': ['bsky.app'],
}


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_KEY environment variables must be set. "
            "Please check your .env file or environment configuration."
        )
    
    return create_client(url, key)


def normalize_domain(domain: str) -> str:
    """Normalize domain to lowercase and remove www prefix."""
    domain = domain.lower().strip()
    if domain.startswith('www.'):
        domain = domain[4:]
    return domain


def categorize_website(url: str, domain: str) -> str | None:
    """Identify which social network a website belongs to."""
    normalized = normalize_domain(domain)
    
    for network, domains in SOCIAL_NETWORKS.items():
        for net_domain in domains:
            if normalized == net_domain or normalized.endswith('.' + net_domain):
                return network
    return None


def extract_social_media_info(websites: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Extract social media presence from websites list.
    
    Returns dict with has_* flags for each social network.
    """
    social_info = {
        'has_instagram': False,
        'has_facebook': False,
        'has_twitter': False,
        'has_youtube': False,
        'has_tiktok': False,
        'has_linkedin': False,
        'has_patreon': False,
        'has_discord': False,
        'has_twitch': False,
        'has_bluesky': False,
        'has_other_website': False,
    }
    
    for website in websites:
        url = website.get('url', '').strip()
        domain = website.get('domain', '').strip()
        
        if not url:
            continue
        
        network = categorize_website(url, domain)
        
        if network:
            social_info[f'has_{network}'] = True
        else:
            # It's a website but not a known social network
            social_info['has_other_website'] = True
    
    return social_info


def compute_data_hash(data: Dict[str, Any]) -> str:
    """
    Compute a hash of the data for change detection.
    Excludes timestamps and hash fields.
    """
    # Create a copy without metadata fields
    clean_data = {k: v for k, v in data.items() 
                  if k not in ('created_at', 'updated_at', 'data_hash')}
    
    # Sort keys for consistent hashing
    data_str = json.dumps(clean_data, sort_keys=True, default=str)
    return hashlib.sha256(data_str.encode()).hexdigest()


def prepare_creators_data(projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prepare all creators data for bulk insert."""
    creators_map: Dict[int, Dict[str, Any]] = {}
    
    for project in projects:
        creator = project.get('creator', {})
        creator_id = creator.get('id')
        
        if not creator_id:
            continue
        
        # Skip if we already processed this creator
        if creator_id in creators_map:
            continue
        
        creator_data = {
            'id': creator_id,
            'slug': creator.get('slug'),
            'name': creator.get('name', ''),
            'is_registered': creator.get('is_registered'),
            'is_email_verified': creator.get('is_email_verified'),
            'chosen_currency': creator.get('chosen_currency'),
            'is_superbacker': creator.get('is_superbacker'),
            'has_admin_message_badge': creator.get('has_admin_message_badge', False),
            'ppo_has_action': creator.get('ppo_has_action', False),
            'backing_action_count': creator.get('backing_action_count', 0),
            'avatar': creator.get('avatar'),
            'urls': creator.get('urls'),
            'websites': creator.get('websites', []),
        }
        
        # Compute hash for change detection
        creator_data['data_hash'] = compute_data_hash(creator_data)
        
        creators_map[creator_id] = creator_data
    
    return list(creators_map.values())


def prepare_projects_data(projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prepare all projects data for bulk insert."""
    projects_data = []
    
    for project in projects:
        creator = project.get('creator', {})
        creator_id = creator.get('id')
        
        if not creator_id:
            continue
        
        # Get expanded_country from location object if available
        location = project.get('location', {})
        country_displayable = ''
        if location and isinstance(location, dict):
            country_displayable = location.get('expanded_country', '')
        
        project_data = {
            'id': project.get('id'),
            'creator_id': creator_id,
            'name': project.get('name', ''),
            'blurb': project.get('blurb', ''),
            'slug': project.get('slug', ''),
            'state': project.get('state', ''),
            'country': project.get('country', ''),
            'country_displayable_name': country_displayable,
            'currency': project.get('currency', ''),
            'currency_symbol': project.get('currency_symbol'),  # e.g., '$', '€'
            'currency_trailing_code': project.get('currency_trailing_code', False),
            'static_usd_rate': project.get('static_usd_rate'),
            'usd_pledged': project.get('usd_pledged'),
            'converted_pledged_amount': project.get('converted_pledged_amount'),
            'fx_rate': project.get('fx_rate'),
            'usd_exchange_rate': project.get('usd_exchange_rate'),
            'current_currency': project.get('current_currency'),
            'usd_type': project.get('usd_type'),
            'goal': project.get('goal', 0),
            'pledged': project.get('pledged', 0),
            'percent_funded': project.get('percent_funded', 0),
            'backers_count': project.get('backers_count', 0),
            'state_changed_at': unix_to_datetime(project.get('state_changed_at')),
            'created_at_ks': unix_to_datetime(project.get('created_at')),
            'launched_at': unix_to_datetime(project.get('launched_at')),
            'deadline': unix_to_datetime(project.get('deadline')),
            'staff_pick': project.get('staff_pick', False),
            'spotlight': project.get('spotlight', False),
            'is_starrable': project.get('is_starrable', True),
            'disable_communication': project.get('disable_communication', False),
            'is_in_post_campaign_pledging_phase': project.get('is_in_post_campaign_pledging_phase', False),
            'is_launched': project.get('is_launched', False),
            'prelaunch_activated': project.get('prelaunch_activated', False),
            'is_liked': project.get('is_liked', False),
            'is_disliked': project.get('is_disliked', False),
            'photo': project.get('photo'),
            'category': project.get('category'),
            'location': project.get('location'),
            'profile': project.get('profile'),
            'urls': project.get('urls'),
        }
        
        # Compute hash for change detection
        project_data['data_hash'] = compute_data_hash(project_data)
        
        projects_data.append(project_data)
    
    return projects_data


def prepare_outreach_data(projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prepare all creator outreach data for bulk insert."""
    outreach_map: Dict[int, Dict[str, Any]] = {}
    
    for project in projects:
        creator = project.get('creator', {})
        creator_id = creator.get('id')
        websites = creator.get('websites', [])
        
        if not creator_id:
            continue
        
        # Skip if we already processed this creator
        if creator_id in outreach_map:
            continue
        
        # Extract social media info
        social_info = extract_social_media_info(websites)
        
        outreach_data = {
            'creator_id': creator_id,
            **social_info,
            'outreach_status': 'not_contacted',
            'first_contacted_at': None,
            'last_contacted_at': None,
            'response_received_at': None,
            'notes': None,
            'tags': [],
        }
        
        outreach_map[creator_id] = outreach_data
    
    return list(outreach_map.values())


def sync_in_chunks(supabase: Client, rpc_name: str, data: List[Dict[str, Any]], 
                   chunk_size: int = 1000, entity_name: str = "items") -> Dict[str, Any]:
    """
    Sync data in chunks to avoid statement timeout.
    
    Args:
        supabase: Supabase client
        rpc_name: Name of the RPC function to call
        data: List of data to sync
        chunk_size: Number of items per chunk
        entity_name: Name for logging (e.g., "creators", "projects")
    
    Returns:
        Dictionary with aggregated stats
    """
    total_inserted = 0
    total_updated = 0
    total_unchanged = 0
    total_errors = []
    
    total_items = len(data)
    num_chunks = (total_items + chunk_size - 1) // chunk_size
    
    for i in range(0, total_items, chunk_size):
        chunk = data[i:i + chunk_size]
        chunk_num = (i // chunk_size) + 1
        
        print(f"   Processing chunk {chunk_num}/{num_chunks} ({len(chunk)} {entity_name})...")
        
        try:
            result = supabase.rpc(rpc_name, {f'{entity_name}_data': chunk}).execute()
            
            if result.data and isinstance(result.data, list) and len(result.data) > 0:
                chunk_data_raw = result.data[0]
                if isinstance(chunk_data_raw, dict):
                    chunk_data: Dict[str, Any] = chunk_data_raw
                    inserted_val = chunk_data.get('inserted_count', 0)
                    updated_val = chunk_data.get('updated_count', 0)
                    total_val = chunk_data.get('total_count', 0)
                    errors_val = chunk_data.get('errors', [])
                    
                    inserted: int = inserted_val if isinstance(inserted_val, int) else 0
                    updated: int = updated_val if isinstance(updated_val, int) else 0
                    total: int = total_val if isinstance(total_val, int) else 0
                    
                    total_inserted += inserted
                    total_updated += updated
                    total_unchanged += (total - inserted - updated)
                    
                    if errors_val and isinstance(errors_val, list):
                        total_errors.extend(errors_val)
                
        except Exception as e:
            print(f"   ⚠️  Error in chunk {chunk_num}: {e}")
            # Continue with next chunk instead of failing completely
            total_errors.append({
                'chunk': chunk_num,
                'error': str(e)
            })
    
    return {
        'inserted': total_inserted,
        'updated': total_updated,
        'unchanged': total_unchanged,
        'errors': len(total_errors),
        'error_details': total_errors[:10]  # Keep first 10 errors for reference
    }


def sync_all_to_supabase(projects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronize all data to Supabase using bulk RPC functions.
    
    Data is sent in chunks to avoid statement timeout.
    """
    print("\n" + "=" * 60)
    print("🚀 Starting Supabase synchronization")
    print("=" * 60)
    print()
    
    # Get Supabase client
    supabase = get_supabase_client()
    print("✅ Connected to Supabase")
    
    stats = {}
    
    # ========================================
    # 1. Sync Creators (using RPC)
    # ========================================
    print("\n📤 Preparing creators data...")
    creators_data = prepare_creators_data(projects)
    print(f"   Found {len(creators_data)} unique creators")
    
    print("💾 Syncing creators to database...")
    try:
        creator_stats = sync_in_chunks(
            supabase, 
            'upsert_creators_bulk', 
            creators_data, 
            chunk_size=1000,
            entity_name='creators'
        )
        
        print(f"   ✅ Inserted: {creator_stats['inserted']}")
        print(f"   ✅ Updated: {creator_stats['updated']}")
        print(f"   ℹ️  Unchanged: {creator_stats['unchanged']}")
        
        if creator_stats['errors'] > 0:
            print(f"   ⚠️  Errors: {creator_stats['errors']}")
            for error in creator_stats['error_details'][:5]:
                if 'creator_id' in error:
                    print(f"      - Creator {error.get('creator_id')}: {error.get('error')}")
                else:
                    print(f"      - Chunk {error.get('chunk')}: {error.get('error')}")
        
        stats['creators'] = creator_stats
        
    except Exception as e:
        print(f"   ❌ Error syncing creators: {e}")
        stats['creators'] = {'error': str(e)}
    
    # ========================================
    # 2. Sync Projects (using RPC)
    # ========================================
    print("\n📤 Preparing projects data...")
    projects_data = prepare_projects_data(projects)
    print(f"   Found {len(projects_data)} projects")
    
    print("💾 Syncing projects to database...")
    try:
        project_stats = sync_in_chunks(
            supabase, 
            'upsert_projects_bulk', 
            projects_data, 
            chunk_size=1000,
            entity_name='projects'
        )
        
        print(f"   ✅ Inserted: {project_stats['inserted']}")
        print(f"   ✅ Updated: {project_stats['updated']}")
        print(f"   ℹ️  Unchanged: {project_stats['unchanged']}")
        
        if project_stats['errors'] > 0:
            print(f"   ⚠️  Errors: {project_stats['errors']}")
            for error in project_stats['error_details'][:5]:
                if 'project_id' in error:
                    print(f"      - Project {error.get('project_id')}: {error.get('error')}")
                else:
                    print(f"      - Chunk {error.get('chunk')}: {error.get('error')}")
        
        stats['projects'] = project_stats
        
    except Exception as e:
        print(f"   ❌ Error syncing projects: {e}")
        stats['projects'] = {'error': str(e)}
    
    # ========================================
    # 3. Sync Creator Outreach (using RPC)
    # ========================================
    print("\n📤 Preparing creator outreach data...")
    outreach_data = prepare_outreach_data(projects)
    print(f"   Found {len(outreach_data)} creators")
    
    print("💾 Syncing outreach data to database...")
    try:
        outreach_stats = sync_in_chunks(
            supabase, 
            'sync_creator_outreach_bulk', 
            outreach_data, 
            chunk_size=1000,
            entity_name='outreach'
        )
        
        print(f"   ✅ Inserted: {outreach_stats['inserted']}")
        print(f"   ✅ Updated: {outreach_stats['updated']}")
        print(f"   ℹ️  Unchanged: {outreach_stats['unchanged']}")
        
        if outreach_stats['errors'] > 0:
            print(f"   ⚠️  Errors: {outreach_stats['errors']}")
            for error in outreach_stats['error_details'][:5]:
                if 'creator_id' in error:
                    print(f"      - Creator {error.get('creator_id')}: {error.get('error')}")
                else:
                    print(f"      - Chunk {error.get('chunk')}: {error.get('error')}")
        
        stats['creator_outreach'] = outreach_stats
        
    except Exception as e:
        print(f"   ❌ Error syncing outreach: {e}")
        stats['creator_outreach'] = {'error': str(e)}
    
    # ========================================
    # Summary
    # ========================================
    print("\n" + "=" * 60)
    print("✅ Supabase synchronization complete!")
    print("=" * 60)
    
    return stats

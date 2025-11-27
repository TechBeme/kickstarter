"""Export enriched project data to Excel spreadsheet."""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


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


def group_projects_by_creator(projects: List[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
    """Group projects by creator ID."""
    creators = defaultdict(list)
    
    for project in projects:
        creator = project.get('creator', {})
        creator_id = creator.get('id')
        
        if creator_id:
            creators[creator_id].append(project)
    
    return dict(creators)


def extract_social_media_urls(websites: List[Dict[str, str]]) -> Dict[str, List[str]]:
    """Extract and categorize social media URLs from websites list."""
    social_urls = defaultdict(list)
    other_urls = []
    
    for website in websites:
        url = website.get('url', '').strip()
        domain = website.get('domain', '').strip()
        
        if not url:
            continue
        
        network = categorize_website(url, domain)
        
        if network:
            social_urls[network].append(url)
        else:
            other_urls.append(url)
    
    if other_urls:
        social_urls['other'] = other_urls
    
    return dict(social_urls)


def export_to_excel(
    enriched_path: Path,
    output_path: Path | None = None,
) -> None:
    """
    Export enriched projects data to Excel spreadsheet.
    
    One row per creator with aggregated project information.
    """
    import json
    
    if not enriched_path.exists():
        print(f"❌ File not found: {enriched_path}")
        return
    
    print(f"📖 Loading data...")
    with open(enriched_path, 'r', encoding='utf-8') as f:
        projects = json.load(f)
    
    creators_projects = group_projects_by_creator(projects)
    
    print(f"👥 {len(creators_projects)} creators found")
    
    rows = []
    
    for creator_id, creator_projects in creators_projects.items():
        first_project = creator_projects[0]
        creator = first_project.get('creator', {})
        
        creator_name = creator.get('name', '')
        creator_slug = creator.get('slug', '')
        creator_url = f"https://www.kickstarter.com/profile/{creator_slug}" if creator_slug else ''
        
        websites = creator.get('websites', [])
        social_urls = extract_social_media_urls(websites)
        
        all_website_urls = [w.get('url', '') for w in websites if w.get('url')]
        websites_combined = '\n'.join(all_website_urls) if all_website_urls else ''
        
        project_urls = []
        project_names = []
        project_created_dates = []
        countries = set()
        locations = set()
        categories = set()
        parent_categories = set()
        
        for proj in creator_projects:
            slug = proj.get('slug', '')
            if slug:
                project_urls.append(f"https://www.kickstarter.com/projects/{slug}")
            
            name = proj.get('name', '')
            if name:
                project_names.append(name)
            
            # Get project creation date (UNIX timestamp to Excel-readable date)
            created_at = proj.get('created_at')
            if created_at:
                from datetime import datetime, timezone
                try:
                    dt = datetime.fromtimestamp(created_at, tz=timezone.utc)
                    # Format as YYYY-MM-DD HH:MM for Excel compatibility
                    project_created_dates.append(dt.strftime('%Y-%m-%d %H:%M'))
                except (ValueError, OSError, TypeError):
                    project_created_dates.append('')
            else:
                project_created_dates.append('')
            
            location = proj.get('location', {})
            country = location.get('expanded_country', '')
            displayable = location.get('displayable_name', '')
            
            if country:
                countries.add(country)
            if displayable:
                locations.add(displayable)
            
            category = proj.get('category', {})
            cat_name = category.get('name', '')
            if cat_name:
                categories.add(cat_name)
            
            parent = category.get('parent_name') or category.get('parent', {}).get('name', '')
            if parent:
                parent_categories.add(parent)
        
        row = {
            'Creator Name': creator_name,
            'Creator Profile URL': creator_url,
            'Creator Slug': creator_slug,
            'Project Count': len(creator_projects),
            'Project Names': '\n'.join(project_names),
            'Project Created Dates': '\n'.join(project_created_dates),
            'Project URLs': '\n'.join(project_urls),
            'Country': ', '.join(sorted(countries)),
            'Location': ', '.join(sorted(locations)),
            'Category': ', '.join(sorted(categories)),
            'Parent Category': ', '.join(sorted(parent_categories)),
            'All Websites': websites_combined,
        }
        
        for network in SOCIAL_NETWORKS.keys():
            urls = social_urls.get(network, [])
            row[network.title()] = '\n'.join(urls) if urls else ''
        
        row['Other Websites'] = '\n'.join(social_urls.get('other', []))
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    
    df = df.sort_values('Creator Name', ignore_index=True)
    
    if output_path is None:
        output_path = enriched_path.parent / 'creators_export.xlsx'
    
    print(f"💾 Generating Excel spreadsheet...")
    
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Creators')
        
        workbook = writer.book
        worksheet = writer.sheets['Creators']
        
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if cell.value:
                        cell_length = max(len(str(line)) for line in str(cell.value).split('\n'))
                        max_length = max(max_length, cell_length)
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 60)
            worksheet.column_dimensions[column_letter].width = adjusted_width
        
        from openpyxl.styles import Alignment
        
        for row in worksheet.iter_rows():
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical='top')
        
        worksheet.freeze_panes = 'A2'
    
    print(f"✅ Spreadsheet generated successfully!")
    print(f"📄 {len(df)} creators exported to: {output_path}")


def export_projects_to_excel(
    projects: List[Dict[str, Any]],
    output_path: Path,
) -> None:
    """
    Export enriched projects (already loaded in memory) to Excel.
    Reuses the same structure as export_to_excel, without reading from disk.
    """
    creators_projects = group_projects_by_creator(projects)
    rows: List[Dict[str, Any]] = []

    for creator_id, creator_projects in creators_projects.items():
        first_project = creator_projects[0]
        creator = first_project.get('creator', {})

        creator_name = creator.get('name', '')
        creator_slug = creator.get('slug', '')
        creator_url = f"https://www.kickstarter.com/profile/{creator_slug}" if creator_slug else ''

        websites = creator.get('websites', [])
        social_urls = extract_social_media_urls(websites)

        all_website_urls = [w.get('url', '') for w in websites if w.get('url')]
        websites_combined = '\n'.join(all_website_urls) if all_website_urls else ''

        project_urls = []
        project_names = []
        project_created_dates = []
        countries = set()
        locations = set()
        categories = set()
        parent_categories = set()

        for proj in creator_projects:
            slug = proj.get('slug', '')
            if slug:
                project_urls.append(f"https://www.kickstarter.com/projects/{slug}")

            name = proj.get('name', '')
            if name:
                project_names.append(name)

            created_at = proj.get('created_at')
            if created_at:
                from datetime import datetime, timezone
                try:
                    dt = datetime.fromtimestamp(created_at, tz=timezone.utc)
                    project_created_dates.append(dt.strftime('%Y-%m-%d %H:%M'))
                except (ValueError, OSError, TypeError):
                    project_created_dates.append('')
            else:
                project_created_dates.append('')

            location = proj.get('location', {})
            country = location.get('expanded_country', '')
            displayable = location.get('displayable_name', '')

            if country:
                countries.add(country)
            if displayable:
                locations.add(displayable)

            category = proj.get('category', {})
            cat_name = category.get('name', '')
            if cat_name:
                categories.add(cat_name)

            parent = category.get('parent_name') or category.get('parent', {}).get('name', '')
            if parent:
                parent_categories.add(parent)

        row = {
            'Creator Name': creator_name,
            'Creator Profile URL': creator_url,
            'Creator Slug': creator_slug,
            'Project Count': len(creator_projects),
            'Project Names': '\n'.join(project_names),
            'Project Created Dates': '\n'.join(project_created_dates),
            'Project URLs': '\n'.join(project_urls),
            'Country': ', '.join(sorted(countries)),
            'Location': ', '.join(sorted(locations)),
            'Category': ', '.join(sorted(categories)),
            'Parent Category': ', '.join(sorted(parent_categories)),
            'All Websites': websites_combined,
        }

        for network in SOCIAL_NETWORKS.keys():
            urls = social_urls.get(network, [])
            row[network.title()] = '\n'.join(urls) if urls else ''

        row['Other Websites'] = '\n'.join(social_urls.get('other', []))

        rows.append(row)

    df = pd.DataFrame(rows).sort_values('Creator Name', ignore_index=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Creators')
        workbook = writer.book
        worksheet = writer.sheets['Creators']

        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if cell.value:
                        cell_length = max(len(str(line)) for line in str(cell.value).split('\n'))
                        max_length = max(max_length, cell_length)
                except Exception:
                    pass
            adjusted_width = min(max_length + 2, 60)
            worksheet.column_dimensions[column_letter].width = adjusted_width

        from openpyxl.styles import Alignment

        for row in worksheet.iter_rows():
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical='top')

        worksheet.freeze_panes = 'A2'

    print(f"✅ Spreadsheet generated successfully!")
    print(f"📄 {len(df)} creators exported to: {output_path}")

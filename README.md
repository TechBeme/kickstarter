# 🚀 Kickstarter Creator Database & Analytics Platform

> Automatically collect, analyze, and track 8,000+ Kickstarter creators with a modern web interface.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-brightgreen)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

**🌐 [Live Demo](https://kickstarter.techbe.me)**

---

## 📊 What You Get

### Excel Export (`creators_export.xlsx`)
- **One row per creator** with all their projects
- 22 columns including: name, projects, location, categories, social media URLs
- **Social Media**: Instagram, Facebook, Twitter, YouTube, TikTok, LinkedIn, Patreon, Discord, Twitch, Bluesky
- **~8,000 creators** with complete contact information
- Formatted with auto-sized columns, frozen headers, and wrapping enabled

### Database Sync (Optional) 
Sync to **PostgreSQL (Supabase)** with 3 smart tables:

| Table | Purpose |
|-------|---------|
| `creators` | Creator profiles, avatars, websites, social media |
| `projects` | Project details, funding data, categories, deadlines |
| `creator_outreach` | Track outreach status, notes, tags, and follow-ups |

**Features:**
- ✅ Smart updates (only changes data that actually changed)
- ✅ Auto-detects creators without contact info
- ✅ Tracks social media presence
- ✅ Manual outreach tracking (contacted, accepted, declined, etc.)
- ✅ Preserves your manual notes and tags
- ✅ Detects when creators add contact info in new scrapes

### Web Interface
- 🔍 Advanced search & filtering by name, category, country, funding
- 📊 Creator & project dashboards
- 💼 Outreach management system
- 📱 Responsive design with dark/light mode
- 📤 Export filtered results to Excel
- ∞ Infinite scroll with smart pagination

---

## ✨ Key Features

### 🔍 Advanced Search & Filtering
- **Projects**: Search by name, category, country, state, funding goals
- **Creators**: Filter by backed projects count, social media presence
- **Multi-filter support**: Combine multiple criteria for precise results
- **Real-time search**: Instant results as you type

### 📊 Comprehensive Data
- **8,000+ Projects**: All upcoming Kickstarter campaigns with complete details
- **Creator Profiles**: Full creator info including bio, location, and statistics
- **Social Media**: 10+ platforms (Instagram, Twitter, LinkedIn, TikTok, YouTube, etc.)
- **Project Metrics**: Funding goals, backers count, deadlines, categories
- **Automatic Updates**: Data synced regularly from Kickstarter

### 💼 Outreach Management
- Track communication status with creators
- Custom status labels: Not Contacted, Email Sent, Follow-ups, Partnership, etc.
- Notes and tags for each creator
- Timeline tracking for follow-ups

### 📈 Analytics Dashboard
- Total projects tracked
- Creator statistics
- Funding goals aggregation
- Category breakdowns
- Social media presence insights

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks
- **Data Fetching**: Server Components + Client-side RPC
- **Icons**: Lucide React
- **Excel Export**: SheetJS (xlsx)

### Backend
- **Database**: PostgreSQL (Supabase)
- **API**: Supabase RPC Functions
- **Authentication**: Supabase Auth (ready for implementation)
- **Real-time**: Supabase Realtime subscriptions

### Data Collection (Python)
- **Web Scraping**: Cloudscraper (bypasses Cloudflare)
- **HTTP**: Requests with retry logic
- **Data Processing**: Pandas for exports
- **Database Sync**: Supabase Python client
- **Proxy Support**: Rotating proxies for large-scale scraping
- **Contact Extraction**: Firecrawl Map + Scrape with Supabase-managed API keys, domain blocking, and rotation when credits are exhausted

---

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended - No Local Setup)

The scraper + contact extraction runs automatically **every hour (`0 * * * *`)**. No setup needed!

1. **Fork this repository**
2. **Enable Actions** in your fork (Actions tab → Enable workflows)
3. **Download results** from the Actions tab after each run
   - Files are kept for **24 hours**
4. (Optional) [Configure settings](#configuration) in GitHub Secrets

**Manual Trigger:**
- Go to **Actions** tab → **Scheduled Kickstarter Scraper** → **Run workflow** → Wait ~10 minutes

**Change Schedule:**
1. Edit `.github/workflows/scheduled-scraper.yml` (line 5: `- cron: '0 * * * *'`)
2. Use [crontab.guru](https://crontab.guru/) to generate cron expressions

### Option 2: Local Installation (Excel Only)

```bash
# Clone and install
git clone https://github.com/TechBeme/kickstarter-scraper.git
cd kickstarter-scraper
pip install -r requirements.txt

# Run scraper (Excel only, no database)
python run.py --skip-supabase
```

**Time**: ~6-10 minutes for 8,000+ projects

### Option 3: With Database Sync (Default)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Create database (run in Supabase SQL Editor):
#    Tables:
#    - supabase/tables/creators.sql
#    - supabase/tables/projects.sql
#    - supabase/tables/creator_outreach.sql
#    - supabase/tables/firecrawl_accounts.sql       # Firecrawl API keys + status
#    - supabase/tables/firecrawl_blocked_domains.sql # Domains that failed in Firecrawl
#    - supabase/tables/pipeline_state.sql            # Tracks last contact run
#    Functions:
#    - supabase/functions/bulk_upsert.sql
#    - supabase/functions/search_projects.sql
#    - supabase/functions/search_creators.sql
#    - supabase/functions/get_home_stats.sql
#    - supabase/functions/get_projects_metadata.sql
#    - supabase/functions/firecrawl_block_domain.sql

# 4. Run scraper (syncs to Supabase by default)
python run.py
```

---

## 💻 Web Interface Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/TechBeme/kickstarter-scraper.git
cd kickstarter-scraper

# 2. Set up Python environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Set up the database
# - Create a Supabase project at https://supabase.com
# - Run SQL migrations in supabase/ folder (in order):
#   - supabase/tables/creators.sql
#   - supabase/tables/projects.sql
#   - supabase/tables/creator_outreach.sql
#   - supabase/tables/firecrawl_accounts.sql
#   - supabase/tables/firecrawl_blocked_domains.sql
#   - supabase/tables/pipeline_state.sql
#   - supabase/functions/bulk_upsert.sql
#   - supabase/functions/search_projects.sql
#   - supabase/functions/search_creators.sql
#   - supabase/functions/get_home_stats.sql
#   - supabase/functions/get_projects_metadata.sql
#   - supabase/functions/firecrawl_block_domain.sql

# 4. Configure environment variables
# Create .env in root:
cat > .env << EOF
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
EOF

# Create website/.env.local:
cat > website/.env.local << EOF
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# 5. Install frontend dependencies
cd website
npm install

# 6. Run the scraper (optional - syncs to Supabase by default)
# From project root:
python run.py

# 7. Start the development server
cd website
npm run dev
```

Visit `http://localhost:3000` or [kickstarter.techbe.me](https://kickstarter.techbe.me) for the live demo.

---

## 📚 Common Commands

```bash
# Basic run (collects, enriches, exports, and syncs to Supabase)
python run.py

# Excel only (no database sync)
python run.py --skip-supabase

# 🆕 Filter projects from last 90 days
python run.py --days-filter 90

# 🆕 Filter projects from last 7 days (quick scan)
python run.py --days-filter 7 --skip-fetch

# Filter and sync only (skip collection & enrichment)
python run.py --skip-fetch --skip-enrich --days-filter 90
python run.py --skip-contacts  # Skip Firecrawl step if you just want Supabase sync

# With proxy (env or CLI)
PROXY_URL=http://user:pass@host:port python run.py
# or:
python run.py --proxy-url http://user:pass@host:port

# Test with limited data
python run.py --enrich-limit 200

# Re-create Excel from existing data
python run.py --skip-fetch

# Show detailed progress
python run.py --debug

# Skip enrichment phase
python run.py --skip-enrich

# Skip both export and database sync
python run.py --skip-export --skip-supabase

# Contacts only (parallel Firecrawl map/scrape using Supabase queue)
PYTHONPATH=src python -m firecrawl_tools.contact_runner --limit-contacts 200 --contacts-workers 50 --contacts-batch-size 10
# Dry-run contacts (no writes): add --dry-run-contacts

# View all options
python run.py --help
```

### New Filter Option: `--days-filter`

Filter projects by creation date (in Kickstarter):

```bash
# Extract only projects from the last 90 days
python run.py --days-filter 90

# Extract only from the last 30 days
python run.py --days-filter 30

# Quick test: last 7 days, limited enrichment
python run.py --days-filter 7 --enrich-limit 100

# Use with existing data (faster) - skip fetch/enrich, only sync
python run.py --skip-fetch --skip-enrich --days-filter 90
```

**How it works:**
- Filters based on project's `created_at` timestamp from Kickstarter API
- Applied AFTER collection (use `--max-pages` to limit collection)
- Shows before/after count: `📅 Applied 90-day filter: 8500 → 2340 projects`
- Useful for focused outreach campaigns or testing

### Firecrawl Contact Extraction
- Runs automatically after Supabase sync unless you pass `--skip-contacts`.
- Selects creators missing email/form or with a new primary site (tracked via `site_hash` and `pipeline_state.last_contact_check_at`).
- Uses Supabase tables for state: `firecrawl_accounts` (API key rotation), `firecrawl_blocked_domains` (shared blocklist), and `creator_outreach` (`sync_creator_outreach_bulk` RPC).
- Mapping (`search="contact"`, limit 5) + scraping to find visible emails/forms; stops early when both are found.
- Parallel by default (100 workers / batch size 20). Tune via `PYTHONPATH=src python -m firecrawl_tools.contact_runner --contacts-workers ... --contacts-batch-size ...`.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | _(required)_ | Supabase project URL |
| `SUPABASE_KEY` | _(required)_ | Supabase service role key (kept as secret) |
| `FETCH_TIMEOUT` | `20` | Timeout for requests (seconds) |
| `ENRICH_TIMEOUT` | `30` | Timeout for enrichment (seconds) |
| `FETCH_MAX_RETRIES` | `10` | Number of retry attempts |
| `ENRICH_MAX_RETRIES` | `5` | Number of retry attempts |
| `FETCH_RETRY_WAIT` | `5.0` | Wait between retries (seconds) |
| `ENRICH_RETRY_WAIT` | `60.0` | Wait between retries (seconds) |
| `ENRICH_DELAY` | `0.0` | Delay between enrichment requests |
| `USE_PROXY` | `false` | Enable proxy usage |
| `PROXY_URL` | _(empty)_ | Proxy URL (e.g., `http://user:pass@host:port`) |

**For GitHub Actions:** Set as repository secrets in Settings → Secrets and variables → Actions

**Default values work well for most cases!** Only change if needed.

---

## 📊 Database Schema

### Tables

**`creators`**
- Creator profiles with avatar, bio, location
- Social media websites array (JSONB)
- Backing statistics

**`projects`**
- Project details, funding goals, deadlines
- Category and location information
- Creator relationships
- Photo and media URLs

**`creator_outreach`**
- Outreach status tracking
- Social media presence flags
- Contact history and notes
- Tags for organization

**`firecrawl_accounts`**
- Firecrawl API keys and status (`active`/`exhausted`) shared across workers

**`firecrawl_blocked_domains`**
- Shared blocklist for unsupported or failed domains during contact extraction

**`pipeline_state`**
- Tracks last contact extraction run to avoid reprocessing unchanged creators

### RPC Functions

- `search_projects()` - Advanced project search with filters
- `search_creators()` - Creator search with social media filters
- `get_home_stats()` - Dashboard statistics
- `get_projects_metadata()` - Filter dropdown options
- `upsert_creators_bulk()` - Bulk insert/update creators
- `upsert_projects_bulk()` - Bulk insert/update projects
- `sync_creator_outreach_bulk()` - Bulk sync outreach data
- `firecrawl_block_domain()` - Upsert blocked domains from Firecrawl errors
 
See `docs/supabase-functions.md` for detailed setup instructions.

---

## 📋 Excel Output Details

The spreadsheet includes **22 columns**:

**Creator Information:**
- Name, Profile URL, Slug
- Project count

**Projects:**
- Project names (one per line)
- Project URLs (one per line)

**Location:**
- Country
- City/State

**Categories:**
- Category
- Parent category

**Social Media & Websites:**
- Instagram, Facebook, Twitter, YouTube, TikTok
- LinkedIn, Patreon, Discord, Twitch, Bluesky
- Other websites

**Features:**
- Text wrapping enabled
- Auto-adjusted column widths
- Frozen header row
- Alphabetically sorted

---

## 🔒 Security & Privacy

- All sensitive credentials stored in environment variables
- `.env` files ignored by Git
- No hardcoded API keys or passwords
- Supabase Row Level Security ready
- HTTPS enforced in production
- CORS properly configured

---

## 📈 Performance Optimizations

- Server-side rendering with Next.js
- PostgreSQL indexes on all search fields
- Efficient RPC functions with computed columns
- Infinite scroll pagination (50 items per page)
- Image optimization with Next.js Image
- SQL query optimization with proper joins

---

## 📈 Performance Metrics

**Collection Phase:**
- 3-5 minutes for 8,000+ projects

**Enrichment Phase:**
- 2-3 minutes for metadata extraction

**Excel Export:**
- 10-20 seconds

**Database Sync:**
- 30-60 seconds (if enabled)

**Total**: 6-10 minutes

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ⚠️ Disclaimer

This project is independent and is not officially affiliated with or endorsed by Kickstarter. It's a third-party tool designed to help businesses and marketers discover partnership opportunities. All Kickstarter trademarks and data belong to their respective owners.

**Important Notes:**
- **Purpose**: Educational and research use only
- **Respect**: Kickstarter's Terms of Service
- **Rate limiting**: Don't run too frequently
- **Privacy**: Never commit `.env` file or expose API keys

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 🤝 Need Custom Automation?

**Looking for a tailored automation solution for your business?**

I specialize in building high-quality, production-ready automation systems.

### Services Offered
- 🔍 **Web Scraping** - Extract data from any website
- ⚡ **Automation** - Automate repetitive tasks and workflows
- 💻 **Website Development** - Build modern web applications
- 🤖 **AI Integrations** - Connect AI models to your applications

### Contact
- **Fiverr**: [Tech_Be](https://www.fiverr.com/tech_be)
- **Upwork**: [Profile](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
- **GitHub**: [TechBeme](https://github.com/TechBeme)
- **Email**: [contact@techbe.me](mailto:contact@techbe.me)

---

## 👨‍💻 About the Author

**Rafael Vieira** - Full-Stack Developer & AI Automation Specialist

### Expertise
- 🔍 Web Scraping & Data Collection
- ⚡ Automation & Process Optimization
- 💻 Full-Stack Web Development
- 🤖 AI & Machine Learning Integration
- 📊 Database Design & Optimization

### Languages
🇺🇸 English • 🇪🇸 Español • 🇧🇷 Português

### Get in Touch
- **Website**: [techbe.me](https://techbe.me)
- **Email**: [contact@techbe.me](mailto:contact@techbe.me)
- **GitHub**: [@TechBeme](https://github.com/TechBeme)
- **Fiverr**: [Tech_Be](https://www.fiverr.com/tech_be)
- **Upwork**: [Profile](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)

### Services
Looking for a custom automation solution? I build production-ready systems tailored to your needs:
- 🔧 Web scraping & data extraction
- 🚀 Automated workflows & integrations
- 🌐 Modern web applications
- 🧠 AI-powered solutions

**Get a free quote today!** [contact@techbe.me](mailto:contact@techbe.me)

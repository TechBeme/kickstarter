<div align="center">

# 🚀 Kickstarter Creator Intelligence Platform

**Professional data collection, enrichment, and analytics platform for 8,000+ Kickstarter creators**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green?logo=python)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-brightgreen?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[🚀 Live Demo](https://kickstarter.yuia.dev) • [Features](#-key-features) • [Quick Start](#-quick-start) • [Tech Stack](#%EF%B8%8F-technology-stack) • [Configuration](#%EF%B8%8F-configuration) • [License](#-license)

**Languages:** [🇧🇷 Português](README.pt-BR.md) • [🇪🇸 Español](README.es.md)

</div>

---

## 🚀 Live Demo

**Try it now:** [https://kickstarter.yuia.dev](https://kickstarter.yuia.dev)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [About the Developer](#-about-the-developer)
- [Key Features](#-key-features)
- [What You Get](#-what-you-get)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Quick Start](#-quick-start)
- [Configuration](#%EF%B8%8F-configuration)
- [License](#-license)
- [Disclaimer](#%EF%B8%8F-disclaimer)

---

## 🎯 Overview

The **Kickstarter Creator Intelligence Platform** is a professional system that automatically collects, enriches, and analyzes data from 8,000+ upcoming Kickstarter campaigns. It provides actionable intelligence for partnership opportunities, market research, and outreach campaigns.

**Key capabilities:**
- Automated data collection from Kickstarter
- AI-powered contact extraction (emails and forms)
- Social media profile extraction (10+ platforms)
- Advanced filtering and search
- Professional Excel exports
- Modern web interface with Next.js
- Automated workflows with GitHub Actions

---

## 👨‍💻 About the Developer

<div align="center">

**Developed by Rafael Vieira (TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contact@techbe.me-EA4335?logo=gmail)](mailto:contact@techbe.me)

**Full-Stack Developer & AI Automation Specialist**

Specialized in **web scraping**, **automation systems**, **modern web applications**, and **AI integrations**.

### 💼 Core Expertise

- 🔍 Web Scraping & Data Extraction
- ⚡ Process Automation & Workflows
- 💻 Full-Stack Development (Next.js, React, Python, TypeScript)
- 🤖 AI Integrations (OpenAI, Anthropic, RAG systems)
- 📊 Database Design & Optimization
- 🎨 Modern UI/UX Development

### 🌍 Languages

🇺🇸 **English** • 🇧🇷 **Português** • 🇪🇸 **Español**

### 📬 Contact

**Email**: [contact@techbe.me](mailto:contact@techbe.me)

</div>

---

## ✨ Key Features

### Data Collection & Enrichment
- **8,000+ Projects**: All upcoming Kickstarter campaigns
- **Creator Profiles**: Bio, location, statistics, projects history
- **Social Media**: Instagram, Twitter, LinkedIn, TikTok, YouTube, Discord, Patreon, Bluesky, Twitch, Facebook
- **Automated Updates**: GitHub Actions runs hourly

### AI-Powered Contact Extraction
- Intelligent email and contact form discovery using Firecrawl
- Multi-account API key rotation
- Parallel processing (100+ concurrent workers)
- Domain blocklist for failed sites

### Web Interface
- Advanced search and filtering
- Creator and project dashboards
- Outreach management (status tracking, notes, tags)
- Excel export functionality
- Responsive design with dark mode

---

## 📦 What You Get

### 1. Excel Export (`creators_export.xlsx`)
- One row per creator with all projects
- 22 columns: creator info, projects, location, categories, 10+ social media URLs
- ~8,000 creators with complete data
- Professional formatting

### 2. PostgreSQL Database (Supabase)
- `creators`: Profiles, avatars, websites, social media
- `projects`: Details, funding data, categories, deadlines
- `creator_outreach`: Status tracking, contact info, notes, tags
- `firecrawl_accounts`: API key management
- `firecrawl_blocked_domains`: Shared blocklist
- `pipeline_state`: Tracks last extraction run

### 3. Modern Web Application
- Next.js 16 with TypeScript
- Server Components for performance
- Tailwind CSS + shadcn/ui
- Supabase integration

### 4. GitHub Actions Automation
- Runs every hour automatically
- No server required
- Artifacts saved for 24 hours

---

## 🛠️ Technology Stack

### Backend (Python)

| Technology | Version | Purpose |
|------------|---------|----------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | 3.9+ | Core scripting language |
| **Cloudscraper** | Latest | Bypass Cloudflare anti-bot |
| **Requests** | 2.32+ | HTTP client with retry logic |
| **Pandas** | 2.2+ | Data processing & Excel export |
| **Supabase Client** | 2.22+ | Database operations |
| **Firecrawl** | 1.0+ | AI-powered contact extraction |
| **openpyxl** | 3.1+ | Excel file generation |

### Frontend (Next.js)

| Technology | Version | Purpose |
|------------|---------|----------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | 16.0+ | React framework with App Router |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 5.0+ | Type-safe development |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | 19.2+ | UI library |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-38B2AC?logo=tailwind-css&logoColor=white) | 4.0+ | Utility-first CSS framework |
| **shadcn/ui** | Latest | High-quality React components |
| **Radix UI** | Latest | Unstyled accessible components |
| **Lucide React** | Latest | Beautiful icon library |
| **TanStack Table** | 8.21+ | Powerful table component |
| **Recharts** | 3.3+ | Chart library |
| **xlsx** | 0.18+ | Client-side Excel export |
| **Zustand** | 5.0+ | Lightweight state management |

### Database & Infrastructure

| Technology | Purpose |
|------------|----------|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | Production database |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) | Backend-as-a-Service |
| **GitHub Actions** | Automated workflows |
| **Vercel** | Frontend hosting |

---

## 🚀 Quick Start

### Option 1: GitHub Actions (No Local Setup)

1. Fork this repository
2. Enable Actions in your fork
3. Add GitHub Secrets: `SUPABASE_URL` and `SUPABASE_KEY`
4. Wait for automatic run or trigger manually
5. Download results from Actions tab

**Change schedule:** Edit `.github/workflows/scheduled-scraper.yml` cron expression

### Option 2: Local Run

```bash
# Clone and install
git clone https://github.com/TechBeme/kickstarter-scraper.git
cd kickstarter-scraper
pip install -r requirements.txt

# Excel only (no database)
python run.py --skip-supabase --skip-contacts

# Full pipeline (requires Supabase setup)
python run.py
```

### Option 3: Web Interface

```bash
# Install dependencies
cd website
npm install

# Configure .env.local with Supabase credentials
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Run
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` in project root:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

### Common Commands

```bash
# Full pipeline
python run.py

# Excel only
python run.py --skip-supabase --skip-contacts

# Filter by date (last 90 days)
python run.py --days-filter 90

# Contact extraction only
python run.py --contacts-only

# Limit for testing
python run.py --enrich-limit 100

# View all options
python run.py --help
```

---

## 📝 License

**Proprietary License - All Rights Reserved**

Copyright © 2026 Rafael Vieira (TechBeme)

### ❌ Restrictions

- No commercial use
- No modifications or derivative works
- No distribution or sublicensing
- No reverse engineering

### ✅ Permitted Use

- View source code for educational purposes
- Run for personal, non-commercial use
- Fork for personal study only

### 📧 Commercial Licensing

For commercial use, contact: [contact@techbe.me](mailto:contact@techbe.me)

---

## ⚠️ Disclaimer

This project is **independent** and **NOT affiliated with Kickstarter**. It's a third-party tool for educational, research, and business intelligence purposes.

- Respects Kickstarter's Terms of Service
- Built-in rate limiting
- Collects only publicly available data
- Users responsible for compliance with applicable laws

---

## 🙏 Acknowledgments

Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Firecrawl](https://firecrawl.dev/), and other amazing open-source technologies.

---

<div align="center">

**Developed by [Rafael Vieira](https://github.com/TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contact@techbe.me-EA4335?logo=gmail)](mailto:contact@techbe.me)

</div>

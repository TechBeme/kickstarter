<div align="center">

# 🚀 Plataforma de Inteligência de Criadores do Kickstarter

**Plataforma profissional de coleta, enriquecimento e análise de dados de mais de 8.000 criadores do Kickstarter**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green?logo=python)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-brightgreen?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[🚀 Demo ao Vivo](https://kickstarter.yuia.dev) • [Recursos](#-principais-recursos) • [Início Rápido](#-início-rápido) • [Stack](#%EF%B8%8F-stack-tecnológica) • [Configuração](#%EF%B8%8F-configuração) • [Licença](#-licença)

**Idiomas:** [🇺🇸 English](README.md) • [🇪🇸 Español](README.es.md)

</div>

---

## 🚀 Demo ao Vivo

**Experimente agora:** [https://kickstarter.yuia.dev](https://kickstarter.yuia.dev)

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Sobre o Desenvolvedor](#-sobre-o-desenvolvedor)
- [Principais Recursos](#-principais-recursos)
- [O Que Você Recebe](#-o-que-você-recebe)
- [Stack Tecnológica](#%EF%B8%8F-stack-tecnológica)
- [Início Rápido](#-início-rápido)
- [Configuração](#%EF%B8%8F-configuração)
- [Licença](#-licença)
- [Aviso Legal](#%EF%B8%8F-aviso-legal)

---

## 🎯 Visão Geral

A **Plataforma de Inteligência de Criadores do Kickstarter** é um sistema profissional que coleta, enriquece e analisa automaticamente dados de mais de 8.000 campanhas futuras do Kickstarter. Fornece inteligência acionável para oportunidades de parceria, pesquisa de mercado e campanhas de divulgação.

**Principais capacidades:**
- Coleta automatizada de dados do Kickstarter
- Extração de contatos com IA (e-mails e formulários)
- Extração de perfis de redes sociais (mais de 10 plataformas)
- Filtragem e busca avançadas
- Exportações profissionais para Excel
- Interface web moderna com Next.js
- Workflows automatizados com GitHub Actions

---

## 👨‍💻 Sobre o Desenvolvedor

<div align="center">

**Desenvolvido por Rafael Vieira (TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contato@techbe.me-EA4335?logo=gmail)](mailto:contato@techbe.me)

**Desenvolvedor Full-Stack & Especialista em Automação com IA**

Especializado em **web scraping**, **sistemas de automação**, **aplicações web modernas** e **integrações de IA**.

### 💼 Principais Especialidades

- 🔍 Web Scraping & Extração de Dados
- ⚡ Automação de Processos & Workflows
- 💻 Desenvolvimento Full-Stack (Next.js, React, Python, TypeScript)
- 🤖 Integrações de IA (OpenAI, Anthropic, sistemas RAG)
- 📊 Design & Otimização de Bancos de Dados
- 🎨 Desenvolvimento de UI/UX Moderno

### 🌍 Idiomas

🇺🇸 **Inglês** • 🇧🇷 **Português** • 🇪🇸 **Espanhol**

### 📬 Contato

**Email**: [contato@techbe.me](mailto:contato@techbe.me)

</div>

---

## ✨ Principais Recursos

### Coleta & Enriquecimento de Dados
- **Mais de 8.000 Projetos**: Todas as campanhas futuras do Kickstarter
- **Perfis de Criadores**: Bio, localização, estatísticas, histórico de projetos
- **Redes Sociais**: Instagram, Twitter, LinkedIn, TikTok, YouTube, Discord, Patreon, Bluesky, Twitch, Facebook
- **Atualizações Automáticas**: GitHub Actions executa a cada hora

### Extração de Contatos com IA
- Descoberta inteligente de e-mails e formulários de contato usando Firecrawl
- Rotação automática de múltiplas contas de API
- Processamento paralelo (mais de 100 workers simultâneos)
- Lista de bloqueio de domínios com falha

### Interface Web
- Busca e filtragem avançadas
- Dashboards de criadores e projetos
- Gestão de divulgação (rastreamento de status, notas, tags)
- Funcionalidade de exportação para Excel
- Design responsivo com modo escuro

---

## 📦 O Que Você Recebe

### 1. Exportação Excel (`creators_export.xlsx`)
- Uma linha por criador com todos os projetos
- 22 colunas: info do criador, projetos, localização, categorias, mais de 10 URLs de redes sociais
- ~8.000 criadores com dados completos
- Formatação profissional

### 2. Banco de Dados PostgreSQL (Supabase)
- `creators`: Perfis, avatares, websites, redes sociais
- `projects`: Detalhes, dados de financiamento, categorias, prazos
- `creator_outreach`: Rastreamento de status, info de contato, notas, tags
- `firecrawl_accounts`: Gestão de chaves de API
- `firecrawl_blocked_domains`: Lista de bloqueio compartilhada
- `pipeline_state`: Rastreia última execução de extração

### 3. Aplicação Web Moderna
- Next.js 16 com TypeScript
- Server Components para performance
- Tailwind CSS + shadcn/ui
- Integração com Supabase

### 4. Automação com GitHub Actions
- Executa automaticamente a cada hora
- Sem necessidade de servidor
- Artefatos salvos por 24 horas

---

## 🛠️ Stack Tecnológica

### Backend (Python)

| Tecnologia | Versão | Propósito |
|------------|---------|------------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | 3.9+ | Linguagem de script principal |
| **Cloudscraper** | Mais recente | Bypass de anti-bot Cloudflare |
| **Requests** | 2.32+ | Cliente HTTP com retry |
| **Pandas** | 2.2+ | Processamento de dados & Excel |
| **Supabase Client** | 2.22+ | Operações de banco de dados |
| **Firecrawl** | 1.0+ | Extração de contatos com IA |
| **openpyxl** | 3.1+ | Geração de arquivos Excel |

### Frontend (Next.js)

| Tecnologia | Versão | Propósito |
|------------|---------|------------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | 16.0+ | Framework React com App Router |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 5.0+ | Desenvolvimento type-safe |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | 19.2+ | Biblioteca de UI |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-38B2AC?logo=tailwind-css&logoColor=white) | 4.0+ | Framework CSS utility-first |
| **shadcn/ui** | Mais recente | Componentes React de alta qualidade |
| **Radix UI** | Mais recente | Componentes acessíveis sem estilo |
| **Lucide React** | Mais recente | Biblioteca de ícones bonita |
| **TanStack Table** | 8.21+ | Componente de tabela poderoso |
| **Recharts** | 3.3+ | Biblioteca de gráficos |
| **xlsx** | 0.18+ | Exportação Excel no cliente |
| **Zustand** | 5.0+ | Gestão de estado leve |

### Banco de Dados & Infraestrutura

| Tecnologia | Propósito |
|------------|-------------|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | Banco de dados de produção |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) | Backend-as-a-Service |
| **GitHub Actions** | Workflows automatizados |
| **Vercel** | Hospedagem do frontend |

---

## 🚀 Início Rápido

### Opção 1: GitHub Actions (Sem Configuração Local)

1. Faça fork deste repositório
2. Ative as Actions no seu fork
3. Adicione GitHub Secrets: `SUPABASE_URL` e `SUPABASE_KEY`
4. Aguarde execução automática ou acione manualmente
5. Baixe resultados da aba Actions

**Alterar agendamento:** Edite a expressão cron em `.github/workflows/scheduled-scraper.yml`

### Opção 2: Execução Local

```bash
# Clone e instale
git clone https://github.com/TechBeme/kickstarter-scraper.git
cd kickstarter-scraper
pip install -r requirements.txt

# Apenas Excel (sem banco de dados)
python run.py --skip-supabase --skip-contacts

# Pipeline completo (requer configuração do Supabase)
python run.py
```

### Opção 3: Interface Web

```bash
# Instale dependências
cd website
npm install

# Configure .env.local com credenciais do Supabase
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Execute
npm run dev
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

### Comandos Comuns

```bash
# Pipeline completo
python run.py

# Apenas Excel
python run.py --skip-supabase --skip-contacts

# Filtrar por data (últimos 90 dias)
python run.py --days-filter 90

# Apenas extração de contatos
python run.py --contacts-only

# Limitar para testes
python run.py --enrich-limit 100

# Ver todas as opções
python run.py --help
```

---

## 📝 Licença

**Licença Proprietária - Todos os Direitos Reservados**

Copyright © 2026 Rafael Vieira (TechBeme)

### ❌ Restrições

- Sem uso comercial
- Sem modificações ou trabalhos derivados
- Sem distribuição ou sublicenciamento
- Sem engenharia reversa

### ✅ Uso Permitido

- Visualizar código-fonte para fins educacionais
- Executar para uso pessoal e não comercial
- Fazer fork apenas para estudo pessoal

### 📧 Licenciamento Comercial

Para uso comercial, contate: [contato@techbe.me](mailto:contato@techbe.me)

---

## ⚠️ Aviso Legal

Este projeto é **independente** e **NÃO é afiliado ao Kickstarter**. É uma ferramenta de terceiros para fins educacionais, de pesquisa e inteligência de negócios.

- Respeita os Termos de Serviço do Kickstarter
- Rate limiting embutido
- Coleta apenas dados publicamente disponíveis
- Usuários responsáveis pela conformidade com leis aplicáveis

---

## 🙏 Agradecimentos

Construído com [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Firecrawl](https://firecrawl.dev/) e outras tecnologias open-source incríveis.

---

<div align="center">

**Desenvolvido por [Rafael Vieira](https://github.com/TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contato@techbe.me-EA4335?logo=gmail)](mailto:contato@techbe.me)

</div>

<div align="center">

# 🚀 Plataforma de Inteligencia de Creadores de Kickstarter

**Plataforma profesional de recopilación, enriquecimiento y análisis de datos de más de 8,000 creadores de Kickstarter**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green?logo=python)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-brightgreen?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[🚀 Demo en Vivo](https://kickstarter.yuia.dev) • [Características](#-características-principales) • [Inicio Rápido](#-inicio-rápido) • [Stack](#%EF%B8%8F-stack-tecnológico) • [Configuración](#%EF%B8%8F-configuración) • [Licencia](#-licencia)

**Idiomas:** [🇺🇸 English](README.md) • [🇧🇷 Português](README.pt-BR.md)

</div>

---

## 🚀 Demo en Vivo

**Pruébalo ahora:** [https://kickstarter.yuia.dev](https://kickstarter.yuia.dev)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Lo Que Obtienes](#-lo-que-obtienes)
- [Stack Tecnológico](#%EF%B8%8F-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#%EF%B8%8F-configuración)
- [Licencia](#-licencia)
- [Descargo de Responsabilidad](#%EF%B8%8F-descargo-de-responsabilidad)

---

## 🎯 Descripción General

La **Plataforma de Inteligencia de Creadores de Kickstarter** es un sistema profesional que recopila, enriquece y analiza automáticamente datos de más de 8,000 campañas futuras de Kickstarter. Proporciona inteligencia accionable para oportunidades de asociación, investigación de mercado y campañas de divulgación.

**Capacidades principales:**
- Recopilación automatizada de datos de Kickstarter
- Extracción de contactos con IA (correos electrónicos y formularios)
- Extracción de perfiles de redes sociales (más de 10 plataformas)
- Filtrado y búsqueda avanzados
- Exportaciones profesionales a Excel
- Interfaz web responsiva construida con Next.js
- Flujos de trabajo automatizados con GitHub Actions

---

## ✨ Características Principales

### Recopilación y Enriquecimiento de Datos
- **Más de 8,000 Proyectos**: Todas las campañas futuras de Kickstarter
- **Perfiles de Creadores**: Bio, ubicación, estadísticas, historial de proyectos
- **Redes Sociales**: Instagram, Twitter, LinkedIn, TikTok, YouTube, Discord, Patreon, Bluesky, Twitch, Facebook
- **Actualizaciones Automáticas**: GitHub Actions se ejecuta cada hora

### Extracción de Contactos con IA
- Descubrimiento de correos y formularios de contacto usando Firecrawl
- Rotación automática de múltiples cuentas de API
- Procesamiento paralelo (más de 100 workers simultáneos)
- Lista de bloqueo de dominios fallidos

### Interfaz Web
- Búsqueda y filtrado avanzados
- Paneles de creadores y proyectos
- Gestión de divulgación (rastreo de estado, notas, etiquetas)
- Funcionalidad de exportación a Excel
- Diseño responsive con modo oscuro

---

## 📦 Lo Que Obtienes

### 1. Exportación Excel (`creators_export.xlsx`)
- Una fila por creador con todos los proyectos
- 22 columnas: info del creador, proyectos, ubicación, categorías, más de 10 URLs de redes sociales
- ~8,000 registros de creadores con campos de campaña y contacto
- Formato profesional

### 2. Base de Datos PostgreSQL (Supabase)
- `creators`: Perfiles, avatares, sitios web, redes sociales
- `projects`: Detalles, datos de financiación, categorías, plazos
- `creator_outreach`: Rastreo de estado, info de contacto, notas, etiquetas
- `firecrawl_accounts`: Gestión de claves de API
- `firecrawl_blocked_domains`: Lista de bloqueo compartida
- `pipeline_state`: Rastrea última ejecución de extracción

### 3. Aplicación Web
- Next.js 16 con TypeScript
- Server Components para rendimiento
- Tailwind CSS + shadcn/ui
- Integración con Supabase

### 4. Automatización con GitHub Actions
- Se ejecuta automáticamente cada hora
- Sin necesidad de servidor
- Artefactos guardados por 24 horas

---

## 🛠️ Stack Tecnológico

### Backend (Python)

| Tecnología | Versión | Propósito |
|------------|---------|-------------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | 3.9+ | Lenguaje de scripting principal |
| **Cloudscraper** | Más reciente | Bypass de anti-bot Cloudflare |
| **Requests** | 2.32+ | Cliente HTTP con retry |
| **Pandas** | 2.2+ | Procesamiento de datos & Excel |
| **Supabase Client** | 2.22+ | Operaciones de base de datos |
| **Firecrawl** | 1.0+ | Extracción de contactos con IA |
| **openpyxl** | 3.1+ | Generación de archivos Excel |

### Frontend (Next.js)

| Tecnología | Versión | Propósito |
|------------|---------|-------------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | 16.0+ | Framework React con App Router |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 5.0+ | Desarrollo type-safe |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | 19.2+ | Biblioteca de UI |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-38B2AC?logo=tailwind-css&logoColor=white) | 4.0+ | Framework CSS utility-first |
| **shadcn/ui** | Más reciente | Componentes React de alta calidad |
| **Radix UI** | Más reciente | Componentes accesibles sin estilo |
| **Lucide React** | Más reciente | Biblioteca de iconos hermosa |
| **TanStack Table** | 8.21+ | Ordenación, filtros y paginación de tablas |
| **Recharts** | 3.3+ | Biblioteca de gráficos |
| **xlsx** | 0.18+ | Exportación Excel del lado del cliente |
| **Zustand** | 5.0+ | Gestión de estado ligera |

### Base de Datos e Infraestructura

| Tecnología | Propósito |
|------------|-------------|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | Base de datos de producción |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) | Backend-as-a-Service |
| **GitHub Actions** | Flujos de trabajo automatizados |
| **Vercel** | Alojamiento del frontend |

---

## 🚀 Inicio Rápido

### Opción 1: GitHub Actions (Sin Configuración Local)

1. Haz fork de este repositorio
2. Activa las Actions en tu fork
3. Añade GitHub Secrets: `SUPABASE_URL` y `SUPABASE_KEY`
4. Espera la ejecución automática o activa manualmente
5. Descarga resultados desde la pestaña Actions

**Cambiar programación:** Edita la expresión cron en `.github/workflows/scheduled-scraper.yml`

### Opción 2: Ejecución Local

```bash
# Clona e instala
git clone https://github.com/TechBeme/kickstarter-scraper.git
cd kickstarter-scraper
pip install -r requirements.txt

# Solo Excel (sin base de datos)
python run.py --skip-supabase --skip-contacts

# Ejecutar recolección, enriquecimiento y exportación (requiere configuración de Supabase)
python run.py
```

### Opción 3: Interfaz Web

```bash
# Instala dependencias
cd website
npm install

# Configura .env.local con credenciales de Supabase
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Ejecuta
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea `.env` en la raíz del proyecto:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

### Comandos Comunes

```bash
# Ejecutar recolección, enriquecimiento y exportación
python run.py

# Solo Excel
python run.py --skip-supabase --skip-contacts

# Filtrar por fecha (últimos 90 días)
python run.py --days-filter 90

# Solo extracción de contactos
python run.py --contacts-only

# Limitar para pruebas
python run.py --enrich-limit 100

# Ver todas las opciones
python run.py --help
```

---

## 📝 Licencia

**Licencia Propietaria - Todos los Derechos Reservados**

Copyright © 2026 Rafael Vieira (TechBeme)

### ❌ Restricciones

- Sin uso comercial
- Sin modificaciones o trabajos derivados
- Sin distribución o sublicenciamiento
- Sin ingeniería inversa

### ✅ Uso Permitido

- Ver código fuente con fines educativos
- Ejecutar para uso personal y no comercial
- Hacer fork solo para estudio personal

### 📧 Licenciamiento Comercial

Para uso comercial, contacta: [contacto@techbe.me](mailto:contacto@techbe.me)

---

## ⚠️ Descargo de Responsabilidad

Este proyecto es **independiente** y **NO está afiliado a Kickstarter**. Es una herramienta de terceros con fines educativos, de investigación e inteligencia de negocios.

- Respeta los Términos de Servicio de Kickstarter
- Rate limiting incorporado
- Recopila solo datos públicamente disponibles
- Los usuarios son responsables del cumplimiento de las leyes aplicables

---

<div align="center">

**Desarrollado por [Rafael Vieira](https://github.com/TechBeme)**

[![GitHub](https://img.shields.io/badge/GitHub-TechBeme-181717?logo=github)](https://github.com/TechBeme)
[![Fiverr](https://img.shields.io/badge/Fiverr-Tech__Be-1DBF73?logo=fiverr)](https://www.fiverr.com/tech_be)
[![Upwork](https://img.shields.io/badge/Upwork-Profile-14a800?logo=upwork)](https://www.upwork.com/freelancers/~01f0abcf70bbd95376)
[![Email](https://img.shields.io/badge/Email-contacto@techbe.me-EA4335?logo=gmail)](mailto:contacto@techbe.me)

</div>

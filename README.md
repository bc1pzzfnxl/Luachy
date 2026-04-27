<div align="center">
  <img src="./assets/logo.png" alt="Luachy Logo" width="120" />

  # Luachy ⚡️
  
  **Ultra-minimalist workspace for students and IT professionals.**
  *Capture thoughts in the Journal. Organize tasks on the Kanban. Focus on the moment.*

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](./docker-compose.yml)
  [![Bun](https://img.shields.io/badge/Runtime-Bun-black.svg)](https://bun.sh)

  [Features](#-features) • [Deployment](#-self-hosting) • [Data Migration](#-data-migration) • [Development](#-local-development) • [Tech Stack](#-tech-stack)
</div>

---

<div align="center">
  <img src="./demo.gif" alt="Luachy Demo" width="800" style="border-radius: 10px; border: 1px solid #333;" />
</div>

## ✨ Features

- **📓 Journal First:** Centered, high-readability timeline for capturing thoughts.
- **🔗 Bidirectional Linking:** Use `[[Task Title]]` in notes to link or auto-promote thoughts to tasks.
- **📊 Kanban Mastery:** Full-screen task management with action-oriented categories (Code, Ship, Crypto, etc.).
- **⚡️ Daily Focus:** A high-performance dashboard with a 7-day Momentum activity heatmap.
- **📅 Sidebar Calendar:** Fixed-width density view to track deadlines without layout shift.
- **🔍 Search Overlay:** Global `Cmd+K` fuzzy search across all notes and tasks.
- **🔐 Secure Auth:** Powered by [Lucia Auth](https://lucia-auth.com) with environment-based admin synchronization.
- **🌓 OLED Minimal:** Warm monochrome theme designed for deep focus and OLED screens.

## 🐳 Self-Hosting

The fastest way to get Luachy running is using Docker.

```bash
# 1. Clone the repository
git clone https://github.com/bc1pzzfnxl/Luachy.git
cd Luachy

# 2. Configure your environment
cp .env.example .env
# Edit .env with your credentials

# 3. Launch with Docker Compose
docker-compose up -d --build
```
Access dashboard at `http://localhost:82` (or your configured port).

## 📤 Data Migration

If you have a `backup.sql` file from a previous installation, follow these steps to import your data into the Docker container:

```bash
# 1. Ensure the schema is up to date (run from host)
# Requires ports: "5432:5432" to be temporary uncommented in docker-compose.yml
bun run drizzle-kit push

# 2. Copy the backup to the DB container
docker cp backup.sql luachy-db-1:/tmp/backup.sql

# 3. Execute the import
docker exec -it luachy-db-1 psql -U postgres -d luachy -f /tmp/backup.sql
```

## 🛠 Local Development

To modify Luachy or run without Docker (except DB):

> [!IMPORTANT]
> For `drizzle-kit push` to work, you must uncomment the `ports` section in `docker-compose.yml` to expose the database (5432) to your local machine.

```bash
# 1. Start the database
docker-compose up -d db

# 2. Install dependencies
bun install

# 3. Setup database schema
bun run drizzle-kit push

# 4. Run development servers
bun run dev      # Frontend (Vite HMR)
bun run server.ts # Backend (API)
```

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgrespassword` |
| `DB_NAME` | PostgreSQL database name | `luachy` |
| `LUACHY_USER` | Workspace admin username | `admin` |
| `LUACHY_PASSWORD` | Workspace admin password | `password123` |
| `SECURE_COOKIES` | Enable secure cookies (HTTPS) | `false` |
| `NODE_ENV` | Environment mode | `production` |

## 🏗 Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Frontend:** [React 19](https://react.dev) + [Vite](https://vitejs.dev)
- **Database:** [PostgreSQL 15](https://www.postgresql.org)
- **Authentication:** [Lucia Auth](https://lucia-auth.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) + [Geist Sans/Mono](https://vercel.com/font)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  Built with 🖤 by <a href="https://github.com/bc1pzzfnxl">bc1pzzfnxl</a>
</div>

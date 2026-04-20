# Project Overview

**Luachy** is a local-first, ultra-minimalist workspace designed for students and IT professionals. It bridges the gap between rapid, unstructured thought capture (Journal) and structured task management (Kanban), centered around a high-performance **Daily Focus** dashboard.

## Technologies
- **Runtime Environment:** Bun
- **Frontend Framework:** React 19 (TypeScript) built with Vite
- **Styling:** Tailwind CSS v4. Typography uses Geist (Sans/Mono) for body/code and Lyon Text (Serif) for headings and accents.
- **Backend & Database:** A Bun HTTP server (`server.ts`) using **Drizzle ORM** over a **PostgreSQL** database.
- **Infrastructure:** Containerized with **Docker** and orchestrated via **Docker Compose**.
- **Visuals:** "Premium Utilitarian Minimalism" - High-contrast warm monochrome, bento-grid layouts, and ultra-flat component architecture.

## Architecture
The application is structured into three primary services managed via Docker:
1. **Database (`db`):** PostgreSQL 15 container with persistent volume storage.
2. **Backend (`backend`):** Bun runtime container running the REST API (`server.ts`). Connects to Postgres via Drizzle ORM.
3. **Frontend (`frontend`):** Nginx container serving the static React production build. Includes a reverse proxy configuration (`nginx.conf`) to route `/api` requests to the backend.

# Features & Navigation

Luachy is organized into four primary focus areas:
1.  **Daily Focus (`Home` icon):** The default dashboard. Features a progress bento-grid showing today's completion rate, active tasks (including recurring), and a quick view of recent Journal entries. Includes a 7-day Momentum activity heatmap.
2.  **Journal (`StickyNote` icon):** A centered, high-readability timeline for capturing thoughts. Supports quick prefixes and bidirectional linking using `[[Task Title]]`. Linked tasks display real-time Ghost Status icons (Circle/CheckCircle2) based on Kanban completion.
3.  **Kanban Board (`Layout` icon):** Full-screen task management. Features action-oriented cards with **Serif Italic** type labels. Categories include: `Buy, Sell, Write, Read, School, Clean, Call, Meet, Code, Ship, Crypto`.
4.  **Calendar (`Calendar` icon):** A fixed-width (380px) sidebar calendar showing activity density and task deadlines without layout shifting.

### Key Interactions
- **Global Command Palette:** Cmd+K triggers a fuzzy search overlay (`SearchOverlay.tsx`) across all notes and tasks.
- **Bidirectional Auto-Promotion:** Typing `[[New Task]]` in a note and clicking the link opens the `GuidedTaskBuilder` pre-filled with the title.
- **Dynamic Prefix Styling:** Prefixes in Journal entries (e.g., `Buy :`) are automatically styled based on the `ACTIONS` configuration in `src/lib/constants.ts`.
- **Automatic Task Archiving:** Completed tasks older than 7 days can be archived via the Settings dialog to maintain board performance.

# Building and Running

## Docker (Production-Ready)
**1. Build and Launch Containers:**
```bash
docker-compose up -d --build
```

**2. Stop Containers:**
```bash
docker-compose down
```

## Local Development (JS/TS Sources)
**1. Start Database Only:**
```bash
docker-compose up -d db
```

**2. Setup Environment:**
Copy `.env.example` to `.env` and adjust if necessary.

**3. Initialize Database Schema:**
```bash
bun run drizzle-kit generate
bun run drizzle-kit push
```

**4. Start Backend (API):**
```bash
bun run server.ts
```

**5. Start Frontend (Vite HMR):**
```bash
bun run dev
```

# Development Conventions & Methods

- **Defensive Rendering (React):** Guard against `undefined` or `null` values. Apply fallback defaults (`|| []`, `|| 4`) and explicit type casting (`Number()`) before map lookups or iterations.
- **ORM & Type Safety:** All database interactions must go through Drizzle ORM using the schema defined in `src/lib/schema.ts`. Avoid raw SQL unless performing complex date aggregations for statistics.
- **UI Refinement:** Adhere to the "Minimalist UI" skill: avoid gradients (except transitions) and heavy shadows. Use `font-serif italic` for emphasis, task prefixes, and action labels.
- **Layout Stability:** Center the Journal (`max-w-4xl mx-auto`). Keep the Calendar sidebar width strictly fixed at `380px`.
- **Docker Workflow:** Rebuild full stack to verify production stability. PostgreSQL data persists in `pgdata` volume.
- **Backend Safety:** Environment variables managed via Docker Compose or `.env`. Server includes error handling for DB connection stability.

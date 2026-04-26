# Project Overview

**Luachy** local-first, minimalist workspace. Students, IT pros. Journal (thoughts) + Kanban (tasks). **Daily Focus** dashboard.

## Technologies
- **Runtime:** Bun
- **Frontend:** React 19 (TypeScript), Vite
- **Styling:** Tailwind CSS v4. Geist (body/code), Lyon Text (Serif headings).
- **Backend/DB:** Bun server (`server.ts`), **Drizzle ORM**, **PostgreSQL**.
- **Infrastructure:** **Docker**, **Docker Compose**.
- **Visuals:** Warm monochrome, bento-grid, flat architecture.

## Architecture
3 services (Docker):
1. **Database (`db`):** PostgreSQL 15. Persistent volume.
2. **Backend (`backend`):** Bun runtime. REST API. Drizzle ORM.
3. **Frontend (`frontend`):** Nginx. React build. Reverse proxy `/api`.

# Features & Navigation

4 areas:
1. **Daily Focus:** Dashboard. Progress grid, active tasks, Journal view. 7-day Momentum heatmap.
2. **Journal:** Timeline. Thoughts capture. Bidirectional links `[[Task Title]]`. Ghost Status icons.
3. **Kanban Board:** Task management. Serif Italic labels. Categories: `Buy, Sell, Write, Read, School, Clean, Call, Meet, Code, Ship, Crypto`.
4. **Calendar:** Sidebar (380px). Activity density, deadlines.

### Key Interactions
- **Command Palette:** Cmd+K fuzzy search notes/tasks.
- **Auto-Promotion:** `[[New Task]]` open `GuidedTaskBuilder`.
- **Prefix Styling:** `Buy :` style based on `ACTIONS` in `src/lib/constants.ts`.
- **Task Archiving:** Completed tasks > 7 days archive via Settings.

# Building and Running

## Docker (Prod)
**1. Launch:**
```bash
docker-compose up -d --build
```

**2. Stop:**
```bash
docker-compose down
```

## Local Dev (JS/TS)
**1. DB:**
```bash
docker-compose up -d db
```

**2. Env:**
Copy `.env.example` to `.env`.

**3. DB Schema:**
*Note: Uncomment `ports` in `docker-compose.yml` for DB service to run push locally.*
```bash
bun run drizzle-kit generate
bun run drizzle-kit push
```

**4. Backend:**
```bash
bun run server.ts
```

**5. Frontend:**
```bash
bun run dev
```

# Development Conventions & Methods

- **Defensive Rendering (React):** Guard `undefined`/`null`. Fallbacks (`|| []`), type casting (`Number()`).
- **ORM & Type Safety:** Drizzle ORM (`src/lib/schema.ts`). No raw SQL except complex stats.
- **UI Refinement:** Minimalist UI. No gradients/shadows. `font-serif italic` for emphasis.
- **Layout Stability:** Center Journal (`max-w-4xl`). Fixed Calendar width (`380px`).
- **Docker Workflow:** Rebuild stack to verify stability. Postgres data persists in `pgdata`.
- **Backend Safety:** Env via Compose/`.env`. Error handling for DB stability.

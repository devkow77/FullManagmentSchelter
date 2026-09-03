# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout

Three independent npm apps (no root workspace):

| App | Path | Dev command | Default URL |
|-----|------|-------------|-------------|
| Backend (Express + Prisma) | `backend/` | `npm run dev` | `http://localhost:4000` |
| Frontend (Vite + React) | `frontend/` | `npm run dev` | `http://localhost:5173` |
| Blog CMS (Strapi 5) | `cms/` | `npm run develop` | `http://localhost:1337` |

### PostgreSQL (backend)

The backend expects `NEON_DATABASE_URL` (any PostgreSQL connection string). For local Cloud VMs, start the system Postgres cluster before migrations:

```bash
sudo pg_ctlcluster 16 main start
```

Create a dev DB/user if needed (example): database `schronisko`, user `schronisko` / password `schronisko`.

Backend `.env` (gitignored) minimum:

- `NEON_DATABASE_URL` — PostgreSQL URL
- `JWT_SECRET`, `JWT_EXPIRES_IN` (e.g. `86400`)
- `PORT=4000` — **required** so Vite’s `/api` proxy (`frontend/vite.config.ts`) matches the API

After `.env` exists: `npx prisma migrate deploy`, optional `npm run seed`.

**Seed logins** (password `Haslo12345.`): `admin@gmail.com` (admin), `michal@gmail.com` (user).

### Frontend env

Vite proxies `/api` → `http://localhost:4000`. Without Supabase vars, admin modules that import `@supabase/supabase-js` at load time will crash the app (`supabaseUrl is required`). For local UI-only dev, set placeholders in `frontend/.env`:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_CMS_ADMIN_URL` — Strapi base URL for blog (name is historical; use `http://localhost:1337` locally)

Optional: `VITE_GOOGLE_MAPS_API_KEY` (footer map).

### CMS (Strapi)

- Copy `cms/.env.example` → `cms/.env` and fill `APP_KEYS` / JWT / encryption secrets (random base64 strings are fine for local dev).
- Default DB is SQLite; install native driver: `npm install better-sqlite3` in `cms/` (not always pulled by `npm ci` / lockfile drift).
- `cms/package-lock.json` may be out of sync with `package.json`; use `npm install` in `cms/` rather than `npm ci` until the lockfile is fixed upstream.

### Lint / test / build

| App | Lint | Test | Build |
|-----|------|------|-------|
| `frontend/` | `npm run lint` | — | `npm run build` |
| `backend/` | — | `npm test` | — |
| `cms/` | — | — | `npm run build` |

Known pre-existing issues: one backend test expects role `USER` but API returns `UZYTKOWNIK`; frontend ESLint reports multiple `react-refresh` / `no-explicit-any` violations.

### Running all services

Use separate terminals (or tmux sessions). Order: Postgres → backend (`PORT=4000`) → frontend → CMS (blog only).

Core shelter flows (auth, animals, admin CRUD without image upload) need only frontend + backend + PostgreSQL. Blog needs CMS. Image uploads need real Supabase credentials.

### Optional integrations

- **Supabase** — admin animal/user image uploads
- **Gmail** (`EMAIL_USER`, `EMAIL_PASS`) — contact form
- **Google Maps** — footer map

No Docker or monorepo orchestration in this repo.

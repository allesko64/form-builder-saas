# Form Builder SaaS — The Dossier Times

A classified form builder with a newspaper / case-file aesthetic. Creators build dossiers (forms), publish them publicly or unlisted, collect field reports (responses), and review analytics — all behind Better Auth.

## Stack

- **Web:** Next.js 16 (port 3000)
- **API:** Express + tRPC (port 8000)
- **DB:** PostgreSQL + Drizzle
- **Auth:** Better Auth (email/password + Google OAuth)
- **Cache / rate limits / live analytics:** Valkey (Redis-compatible), optional

## Architecture overview

```text
┌─────────────┐     session cookie      ┌─────────────┐
│  apps/web   │ ───────────────────────►│  apps/api   │
│  Next.js    │   tRPC + /api/auth      │  Express    │
└──────┬──────┘                         └──────┬──────┘
       │                                         │
       │  @repo/trpc/client                      │  @repo/trpc/server
       │  @repo/validators (client preview)      │  @repo/services
       │  @repo/types (shared inferred types)    │  @repo/validators (server submit)
       └─────────────────┬───────────────────────┘
                         ▼
                  ┌─────────────┐
                  │ PostgreSQL  │  users, forms, form_fields, responses (JSONB answers)
                  └─────────────┘
                         ▲
                  ┌─────────────┐
                  │   Valkey    │  rate limits, public form cache, analytics pub/sub
                  └─────────────┘
```

**Request paths**

| Path | Role |
|------|------|
| `/trpc/*` | Primary API — typed procedures, shared with web via `@repo/trpc/client` |
| `/api/*` | OpenAPI REST mirror of the same tRPC router (`trpc-to-openapi`) |
| `/api/auth/*` | Better Auth (sign-in, session, OAuth) — not tRPC |
| `/ws/analytics` | Live analytics WebSocket (creator session required) |
| `/docs` | Scalar API reference |

**Shared packages**

| Package | Purpose |
|---------|---------|
| `@repo/types` | Zod schemas + **inferred types** (`FormField`, `ResponseAnswers`, status enums) used by web, API, and DB |
| `@repo/validators` | **Dynamic runtime Zod** — `buildZodSchema()` from DB field rows; discriminated union per field type |
| `@repo/services` | Business logic (forms, fields, public submit, analytics, billing) |
| `@repo/trpc` | Routers, context, client |
| `@repo/database` | Drizzle schema, migrations, seed |

## Dynamic runtime Zod validation

Submission and preview validation do **not** use a static form schema. On each request the server:

1. Loads `form_fields` for the dossier from Postgres.
2. Applies **conditional visibility** (`visibility_config`) when answers are present.
3. Builds a fresh `z.object({ [fieldId]: valueSchema }).strict()` via `buildZodSchema()` in `@repo/validators`.
4. Validates with **`safeParse`** on the API (client public filler also uses `safeParse` for field-level errors).

Field value rules come from a **discriminated union** on `type` (`short_text`, `email`, `single_select`, etc.) plus per-field `validation_config` (min/max, options, rating max).

Types are shared end-to-end: `FormField = z.infer<typeof formFieldSchema>` in `@repo/types` — no duplicate hand-written field interfaces between apps.

## Response ingestion pipeline

`public.submit` runs these layers in order (defense in depth):

| Layer | Check |
|-------|--------|
| 1 | **Rate limit** — per terminal fingerprint + form (`enforceSubmissionRateLimit`; Valkey or in-memory) |
| 2 | **Input schema** — `submitFormInputSchema` (formId, submissionId, answers record) |
| 3 | **Form exists** — row found, not soft-deleted |
| 4 | **Status** — not `draft` |
| 5 | **Visibility** — `published_public` or `published_unlisted` only |
| 6 | **Field ownership** — strict dynamic schema: only visible field IDs allowed; unknown keys rejected |
| 7 | **Required fields** — enforced in dynamic Zod |
| 8 | **Type / option rules** — email, enums, number min/max, etc. |
| 9 | **Dedup / spam** — idempotent `submissionId`; **terminal dedup** via `x-terminal-id` / IP / UA hash → `responses.ip_hash` |
| 10 | **Concurrency** — `SELECT … FOR UPDATE` on form row when checking response limit |
| 11 | **Transactional write** — `createWithSubmissionGuards()` in a DB transaction (limit + dedup + insert) |
| 12 | **DB constraints** — unique `submission_id`; partial unique `(form_id, ip_hash)` |

Set `IP_HASH_SALT` in production (see `.env.example`) so terminal fingerprints are not predictable.

## Database schema (high level)

| Table | Notes |
|-------|--------|
| `user` | Creators (Better Auth) |
| `session` | Server-side sessions (httpOnly cookie) |
| `account` | Credential / OAuth linkage |
| `forms` | Dossier metadata, `status` enum, `theme` JSONB, soft `deleted_at` |
| `form_fields` | Field definitions, `sort_order`, `validation_config`, `visibility_config` |
| `responses` | One row per submission; **`answers` JSONB** keyed by field UUID |
| `form_funnel_sessions` | Multi-step dropoff / funnel analytics |

Enums: `form_status`, `form_field_type`, `subscription_plan`. Cascading deletes from user → forms → fields / responses.

Answers are stored as JSONB (not a normalized `response_answers` table) for simpler reads and CSV export; validation always runs against live field config at submit time.

## Auth (Better Auth)

| Rubric concept | This project |
|----------------|--------------|
| Session cookie | httpOnly `better-auth.session_token` |
| Server-side session | `session` table; revoke by invalidating rows |
| Protected routes | Next.js middleware on `/dashboard`, `/forms/*`; tRPC `protectedProcedure` |
| Public forms | No login required; `publicProcedure` + session still parsed if cookie present |

Public respondent flows do not require authentication. Creator mutations require a valid session.

## Prerequisites

- Node.js 18+
- pnpm 9
- Docker (recommended for Postgres + Valkey)

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Use **one** `.env` at the **repository root** only. Do not copy it into `packages/*` or `apps/*` — nested copies drift and risk leaking secrets. CI runs `pnpm env:check` to enforce this.

Edit `.env` as needed. Minimum for local dev:

- `DATABASE_URL` — Postgres connection string
- `BETTER_AUTH_SECRET` — any long random string
- `IP_HASH_SALT` — recommended even locally (terminal dedup salting)
- `GOOGLE_OAUTH_*` — only if testing Google sign-in (see below)

### 3. Start infrastructure

```bash
docker compose up -d
```

Runs Postgres on `localhost:5432` and Valkey on `localhost:6379`.

### 4. Migrate database

```bash
pnpm db:migrate
```

### 5. Seed demo data (optional)

```bash
pnpm db:seed
```

Creates a demo operative, three published dossiers, and 100 sample responses spread over the last 30 days.

|              |                        |
| ------------ | ---------------------- |
| **Email**    | `demo@formbuilder.dev` |
| **Password** | `Demo1234!`            |

Re-running the seed **wipes** prior demo + integration-test clutter, then recreates everything (idempotent fresh demo).

### 6. Run dev servers

```bash
pnpm dev
```

| Service           | URL                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| Web app           | [http://localhost:3000](http://localhost:3000)                           |
| API health        | [http://localhost:8000/health](http://localhost:8000/health)             |
| API docs (Scalar) | [http://localhost:8000/docs](http://localhost:8000/docs)                 |
| OpenAPI JSON      | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) |

## Demo dossiers (after seed)

| Form                      | Status   | Explore | Public URL                      |
| ------------------------- | -------- | ------- | ------------------------------- |
| Anime Personality Test    | Public   | Yes     | `/f/anime-character-poll`       |
| Startup Hiring Form       | Public   | Yes     | `/f/startup-feedback`           |
| Gaming Tournament Signup  | Unlisted | No      | `/f/gaming-tournament-signup`   |

`pnpm db:seed` **always resets first**: removes reserved demo slugs, leftover integration-test users (`*@integration.local`), then recreates the demo operative and 100 responses.

Sign in as the demo user → **INTELLIGENCE OVERVIEW** (`/dashboard`) to edit, duplicate, view analytics (including **live** WebSocket updates), and export CSV.

## Google OAuth (optional)

The app sends this redirect URI to Google:

```text
http://localhost:3000/api/auth/callback/google
```

Add it under **Google Cloud Console → APIs & Services → Credentials → OAuth client → Authorized redirect URIs**.

Use the app at `http://localhost:3000` (not `127.0.0.1` unless you register that too).

## Main routes

| Route                   | Description                 |
| ----------------------- | --------------------------- |
| `/`                     | Landing page                |
| `/sign-in`, `/sign-up`  | Auth                        |
| `/dashboard`            | Your dossiers               |
| `/forms/new`            | New dossier                 |
| `/forms/[id]`           | Document architect (editor) |
| `/forms/[id]/analytics` | Charts + CSV export         |
| `/forms/[id]/responses` | Response browser            |
| `/explore`              | Public dossier gallery      |
| `/f/[slug]`             | Public form (respondents)   |
| `/pricing`              | Pricing page                |

## Scripts

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Start web + API + DB studio (turbo) |
| `pnpm build`       | Production build                    |
| `pnpm db:migrate`  | Apply Drizzle migrations            |
| `pnpm db:generate` | Generate migrations from schema     |
| `pnpm db:seed`     | Load demo user, forms, responses    |
| `pnpm lint`        | Lint monorepo                       |
| `pnpm check-types` | Typecheck                           |
| `pnpm test`        | Unit + integration tests (CI)       |

## Project layout

```text
apps/web/            Next.js frontend
apps/api/            Express API (tRPC + Better Auth + WebSocket analytics)
packages/database/   Schema, migrations, seed
packages/trpc/       tRPC routers + shared client
packages/services/   Business logic
packages/types/      Shared Zod schemas + inferred types (web + API)
packages/validators/ Dynamic Zod schemas built from form fields
packages/realtime/   Analytics WebSocket hub + Redis bridge
packages/auth/       Better Auth config
```

## Testing

- **Unit:** `@repo/validators` (discriminated unions, `buildZodSchema`, visibility, strict keys)
- **Integration:** auth, submit, terminal dedup, analytics, billing (`packages/integration-tests`)
- **CI:** `.github/workflows/ci.yml` — migrate, lint, typecheck, `pnpm test`

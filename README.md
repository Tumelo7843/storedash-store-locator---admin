# StoreDash

A multi-store marketplace and store-locator platform: a public **customer** website for
discovering nearby stores, browsing products/services, and placing orders, plus a private
**admin** website for store owners to manage their own store(s). Backend and database are
shared; the two frontends are separate deployable applications with no shared code beyond
plain TypeScript types.

## 1. Project overview

- **Customer app** (`apps/customer`): store discovery with a real interactive map, product/service
  browsing, cart, checkout, and order history.
- **Admin app** (`apps/admin`): store management dashboard — products, services, orders, store
  profile, and store-admin management. Scoped entirely to the stores the signed-in user manages.
- **Backend** (`backend`): a single Express API that both frontends call. Enforces authentication
  and authorization for every write; the frontends have no special privileges the API doesn't
  independently verify.
- **Database**: PostgreSQL (Cloud SQL in production), accessed through Drizzle ORM.
- **Auth**: Firebase Authentication (Google Sign-In) for identity; a `users.role` column plus a
  `store_admins` join table for authorization (see §22–23).

## 2. Architecture

```
Customer Website (apps/customer, Vercel)
        |
        v
   Backend API (backend, Render) ----> Firebase Admin SDK ----> Firebase Auth
        |                                                       (verifies ID tokens)
        v
Cloud SQL PostgreSQL (Drizzle ORM)
        ^
        |
   Backend API (same instance, shared)
        ^
        |
Admin Website (apps/admin, Vercel)
```

Both frontends talk to the **same** backend and database. There is no admin-only database or
admin-only API deployment — isolation between customers, store admins, and other stores' data is
enforced entirely by backend authorization logic (see §22), not by network topology.

## 3. Repository structure

```
/apps
  /customer     Customer-facing Vite + React app (npm workspace @storedash/customer)
  /admin        Admin dashboard Vite + React app (npm workspace @storedash/admin)
/backend        Express API (npm workspace @storedash/backend)
  /src
    routes/       Express routers — public and /admin-prefixed variants per resource
    controllers/  Request handling: parse, call a service, shape the response
    services/     Database access and business logic (Drizzle queries live here)
    middleware/   requireAuth, requireRole, requireStoreAccess, error handling
    validators/   Zod schemas for every write endpoint
    db/           Drizzle schema and connection pool
    lib/          Firebase Admin SDK setup
  /drizzle       Generated SQL migrations (versioned, checked into git)
/shared          Framework-agnostic TypeScript types shared by backend + both frontends
  (npm workspace @storedash/shared)
render.yaml      Render Blueprint for the backend
.env.example     Documents every environment variable, split by which app needs it
```

This is an npm-workspaces monorepo. `package.json` at the repo root lists `shared`, `backend`,
and `apps/*` as workspaces — a single `npm install` at the root installs everything and wires up
the `@storedash/shared` package as a local symlink, so backend and both frontends always share the
exact same type definitions.

**Why this structure over alternatives:** the customer and admin apps needed to be genuinely
separate deployables (separate Vercel projects, separate auth gates, separate bundles) per the
project requirements, which rules out a single SPA. A fully separate multi-repo setup was rejected
because the backend/shared types would drift between repos. npm workspaces gives independent
deploys with shared types and a single install step, at the cost of both frontends needing their
own `package.json` (a small amount of duplication, e.g. each has its own `lib/api.ts` — deliberate,
since each app should be free to evolve its own API surface without touching the other).

## 4. Prerequisites

- Node.js 20+ and npm 10+
- A PostgreSQL database (Cloud SQL for production; any local/hosted Postgres for development)
- A Firebase project with Authentication enabled (Google provider)

## 5. Environment variables

Every variable is documented in [.env.example](.env.example). Summary:

**`backend/.env`** (server-only — never exposed to a browser):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `ALLOWED_ORIGINS` | yes | Comma-separated frontend origins for CORS |
| `FIREBASE_PROJECT_ID` | yes | Must match both frontends' `VITE_FIREBASE_PROJECT_ID` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | on Render (optional on GCP) | base64-encoded service account JSON |
| `NODE_ENV` | yes | `development` or `production` |
| `PORT` | no | Defaults to 3001; Render injects its own |

**`apps/customer/.env` and `apps/admin/.env`** (safe to expose — ships in the browser bundle):

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | Backend base URL, no trailing slash |
| `VITE_FIREBASE_API_KEY` | yes | From Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | |
| `VITE_FIREBASE_PROJECT_ID` | yes | |
| `VITE_FIREBASE_STORAGE_BUCKET` | no | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | no | |
| `VITE_FIREBASE_APP_ID` | yes | |

**Never put in a frontend `.env`:** `DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, or any
database credential. The `VITE_` Firebase values are not secret in the traditional sense (the
Firebase Web SDK is designed to ship its config to the browser — it identifies the project, it
doesn't authenticate as it), but they still don't belong in the backend's env either. What
actually protects your Firebase project is the Console's **Authorized domains** list (Authentication
> Settings) and, if you use one, an API-key HTTP-referrer restriction in Google Cloud Console >
Credentials — set both before going to production.

No mapping API key is required anywhere: the customer app's map uses Leaflet with OpenStreetMap
tiles, which are free and keyless.

## 6. Local development

```bash
npm install                     # installs all workspaces from the repo root
```

Create `backend/.env`, `apps/customer/.env`, and `apps/admin/.env` from the tables above (or copy
the relevant sections out of `.env.example`).

Run each piece in its own terminal:

```bash
npm run dev:backend             # http://localhost:3001
npm run dev:customer            # http://localhost:5173
npm run dev:admin               # http://localhost:5174
```

Health check: `curl http://localhost:3001/api/health` — returns `{"status":"ok"}` when the
database is reachable, `{"status":"degraded"}` (HTTP 503) when it isn't. The backend intentionally
still starts and serves this endpoint even if the database is down, so you always have a live
signal for what's wrong.

## 7. Database setup and migrations

Schema lives in [backend/src/db/schema.ts](backend/src/db/schema.ts). Migrations are generated
files in `backend/drizzle/`, checked into git — never hand-edit a generated migration.

```bash
npm run db:generate --workspace=backend   # after changing schema.ts, generates a new migration
npm run db:migrate --workspace=backend    # applies pending migrations to DATABASE_URL
npm run db:studio --workspace=backend     # opens Drizzle Studio against DATABASE_URL
```

The initial migration (`backend/drizzle/0000_*.sql`) creates all tables, enums, foreign keys,
unique constraints, and indexes from scratch. Run `db:migrate` once against a fresh database to
get started — it does not drop or reset anything, so it's safe to run against a database that
already has other data in it (as long as it doesn't already have conflicting tables).

**Do not use `drizzle-kit push` in production.** `push` diffs the live schema and applies changes
directly with no reviewable file and no rollback path — fine for quick local iteration, wrong for
a database anyone depends on. Use `generate` + `migrate` so every schema change is a reviewable,
re-runnable file.

## 8. Production build

```bash
npm run build --workspace=@storedash/customer   # outputs apps/customer/dist
npm run build --workspace=@storedash/admin      # outputs apps/admin/dist
```

Both run `tsc --noEmit` first (via each package's `prebuild` script) and fail the build on any
type error, then run `vite build`.

The backend has no separate compile step — it runs directly via `tsx` in both development and
production (`npm run start --workspace=backend` → `tsx src/index.ts`). `tsx` is a normal
(non-dev) dependency for exactly this reason. This trades a small amount of cold-start overhead
for eliminating an entire class of "worked in dev, broke in the bundled build" bugs, which is the
right tradeoff for a backend of this size — revisit only if cold-start latency actually becomes a
measured problem.

## 9. Deployment architecture

| Piece | Host | Why |
|---|---|---|
| `apps/customer` | Vercel | Static Vite build, global CDN, zero-config for SPAs |
| `apps/admin` | Vercel | Same — as a second, independent Vercel project |
| `backend` | Render | Long-running Node process (Postgres pool, no cold starts) |
| Database | Google Cloud SQL (PostgreSQL) | Managed Postgres; Render connects over the network |
| Auth | Firebase Authentication | Managed identity; both frontends and the backend integrate with it directly |

Vercel is a poor fit for the backend (serverless functions don't hold a persistent Postgres
connection pool well), and Render is a poor fit for static frontends (no CDN edge network,
slower global TTFB) — hence the split rather than putting everything on one platform.

### Vercel — customer and admin apps

Create **two** Vercel projects from this one repository (Vercel supports multiple projects per
repo via each project's Root Directory setting):

1. New Project → import this repo.
2. **Root Directory**: `apps/customer` (repeat later with `apps/admin` for the second project).
3. **Framework Preset**: Vite (auto-detected).
4. **Build Command**: leave default (`npm run build`) — Vercel automatically runs the install
   from the repo root when it detects the `workspaces` field in the root `package.json`, so
   `@storedash/shared` resolves correctly.
5. **Output Directory**: `dist` (default).
6. **Environment Variables**: add the `VITE_*` variables from §5 (Production, Preview, and
   Development scopes as needed). Set `VITE_API_URL` to your Render backend's public URL.
7. Deploy. Repeat steps 1–6 with Root Directory `apps/admin` for the second project.

### Render — backend

Either use the included [render.yaml](render.yaml) (New → Blueprint → select this repo), or
configure manually:

1. New → Web Service → select this repo.
2. **Root Directory**: leave as the repo root (not `backend/`) — the build needs to install all
   workspaces.
3. **Build Command**: `npm install`
4. **Start Command**: `npm run start --workspace=backend`
5. **Health Check Path**: `/api/health`
6. **Environment Variables**: `DATABASE_URL`, `ALLOWED_ORIGINS`, `FIREBASE_PROJECT_ID`,
   `FIREBASE_SERVICE_ACCOUNT_BASE64`, `NODE_ENV=production` (see §5, §11).

Once deployed, set each Vercel project's `VITE_API_URL` to this service's Render URL
(`https://storedash-backend.onrender.com` or your custom domain), and set the backend's
`ALLOWED_ORIGINS` to both Vercel URLs.

### Custom domains

- Vercel: add the domain in each project's Settings > Domains (e.g. `store.example.com` for
  customer, `admin.example.com` for admin).
- Render: add the domain in the service's Settings > Custom Domains (e.g. `api.example.com`).
- After adding custom domains, update `ALLOWED_ORIGINS` on Render and `VITE_API_URL` on both
  Vercel projects to the new domains, and add the Vercel domains to Firebase's Authorized domains
  list (§10).

### CORS

The backend only accepts cross-origin requests from the exact origins listed in
`ALLOWED_ORIGINS` (comma-separated, no wildcards, no trailing slashes). Update it whenever you add
or change a frontend domain — a request from an origin not on this list is rejected by the `cors`
middleware before it reaches any route handler.

## 10. Firebase setup

1. Create a Firebase project (or use an existing one) at [console.firebase.google.com](https://console.firebase.google.com).
2. Authentication > Sign-in method > enable **Google**.
3. Authentication > Settings > **Authorized domains** — add your Vercel domains (both customer and
   admin) and your local dev origins if needed (`localhost` is included by default).
4. Project Settings > General > Your apps > add a Web app (or reuse one) to get the
   `VITE_FIREBASE_*` values for §5. The same Firebase project/config is used by both frontends.
5. Project Settings > Service Accounts > **Generate new private key** → downloads a JSON file.
   - On Render (or any non-GCP host): base64-encode it and set as `FIREBASE_SERVICE_ACCOUNT_BASE64`:
     ```bash
     base64 -w0 service-account.json   # Linux
     openssl base64 -A -in service-account.json   # macOS
     ```
   - On GCP compute (Cloud Run, GCE, App Engine): you can omit this variable — the Admin SDK
     authenticates automatically via Application Default Credentials, and only `FIREBASE_PROJECT_ID`
     is needed.
6. **If this JSON file, or any Firebase Admin credential, has ever been committed to a git repo,
   public gist, or shared insecurely: rotate it.** Go to the same Service Accounts page and
   generate a new key, then delete the old one from IAM. A leaked service account key gives full
   admin control over Firebase Authentication for the project — treat it like a root password, not
   like the client `VITE_FIREBASE_*` values above.

## 11. Cloud SQL (PostgreSQL) setup

1. Create a Cloud SQL for PostgreSQL instance in Google Cloud Console.
2. Create a database and a dedicated application user (not the default `postgres` superuser) with
   privileges scoped to that database.
3. Connection options, in order of preference:
   - **Cloud SQL Auth Proxy / Unix socket** (recommended if your backend host supports it): the
     connection string looks like
     `postgresql://user:password@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE`. No TLS
     configuration needed — the proxy handles encryption. `backend/src/db/index.ts` detects this
     form (`/cloudsql/` in the URL) and skips its TLS setup automatically.
   - **Public IP with TLS**: authorize the connecting host's IP in Cloud SQL's Authorized Networks,
     and use `?sslmode=require` in `DATABASE_URL`. In production (`NODE_ENV=production`), the
     backend enables TLS with `rejectUnauthorized: false` by default for this path — acceptable for
     most managed Postgres setups, but if you need strict certificate validation, supply Cloud
     SQL's server CA certificate and adjust `backend/src/db/index.ts` accordingly.
4. Render does not run inside Google Cloud, so the Unix-socket/Auth-Proxy path isn't available
   without running the proxy as a sidecar; the public-IP + TLS path is the practical default for a
   Render-hosted backend. If minimizing public exposure matters more than deployment simplicity,
   consider hosting the backend on Cloud Run instead, where the Unix socket path works natively.
5. Connection pooling: the backend keeps a single `pg.Pool` (max 10 connections) for its lifetime —
   see `backend/src/db/index.ts`. This is per-instance; if you scale the backend horizontally,
   multiply accordingly against your Cloud SQL instance's connection limit.

## 12. Authentication vs. authorization

**Authentication** (Firebase): every protected request carries `Authorization: Bearer <Firebase ID
token>`. `backend/src/middleware/auth.ts`'s `requireAuth` verifies it against Firebase using the
Admin SDK and loads (or lazily creates) the corresponding row in the `users` table. If the token is
missing, expired, or invalid, the request is rejected with 401 before any handler runs.

**Authorization** (this app's own logic, not Firebase's): a verified identity does not imply any
permission. Three roles exist on `users.role`: `customer` (default for every new sign-in),
`store_admin`, and `super_admin`. Role alone still isn't enough to act on a specific store — see
§13.

Every admin-write route is protected by one of two middlewares
(`backend/src/middleware/authorize.ts`):

- `requireRole(...roles)` — checks `req.authUser.role` is in the allowed list. Used for
  platform-wide actions like store creation (`super_admin` only).
- `requireStoreAccess(resolveStoreId)` — resolves the **real** store ID for the resource being
  acted on directly from the database (e.g. looks up a product's `storeId` column, not whatever a
  client claims), then checks the caller manages that store. This is what makes
  `PUT /api/admin/products/999` safe even if the request body contains a different `storeId`.

The frontends also gate their own UI (e.g. the admin app's login screen refuses a signed-in
non-admin), but that's a UX convenience, not the security boundary — every one of these checks is
re-verified server-side regardless of what the frontend does or doesn't show.

## 13. Store data isolation

The `store_admins` table is the single source of truth for "who can manage store X" — a many-to-
many join between `users` and `stores`:

```
users ----< store_admins >---- stores
```

- One user can manage multiple stores (multiple rows with the same `userId`).
- One store can have multiple admins (multiple rows with the same `storeId`).
- `super_admin` bypasses this table entirely (platform-wide access) — everyone else must have an
  explicit row.

Every service-layer function that lists or mutates products, services, or orders takes the
caller's resolved store ID(s) as an input, derived from `store_admins` (or `'all'` for
`super_admin`) — see `backend/src/services/storeAccess.service.ts`. A `store_admin` for Store A
querying `GET /api/admin/products` simply never receives Store B's rows; there's no filter to
bypass because the underlying query never included them.

## 14. How to add a new store

Only a `super_admin` can create a store (`POST /api/admin/stores`, gated by
`requireRole('super_admin')` in `backend/src/routes/stores.routes.ts`) — creating a store
establishes ownership, so it isn't self-service for a plain `store_admin`. In the admin app, a
`super_admin` sees a **Create Store** item in the sidebar (`apps/admin/src/pages/NewStorePage.tsx`).
The creator is automatically added as the first admin of the new store.

## 15. How to create an admin for a store

An existing admin of a store (or a `super_admin`) can grant access to another user from the admin
app's **Store Admins** page, or directly:

```
POST /api/admin/stores/:storeId/admins
{ "email": "newadmin@example.com" }
```

The target user must have **signed in to either app at least once already** — the backend can only
grant access to a row that already exists in `users`, since that's how it knows their Firebase
UID. If they haven't signed in yet, ask them to do so first (even just visiting the customer app
and signing in is enough — sign-in provisions the same `users` row regardless of which frontend
they used). Granting access upgrades their role from `customer` to `store_admin` if needed and
inserts the `store_admins` row.

## 16. How products and services belong to a store

Both `products` and `services` have a required `storeId` foreign key (`ON DELETE CASCADE` — 
deleting a store deletes its products/services/orders along with it). Every admin create/update
route verifies store access using that row's real `storeId` (§12), and every public read route
(`GET /api/products`, `GET /api/services`) only returns rows where `isActive` is true, scoped to
the requested `storeId` when the customer app is viewing a specific store's page. Product
availability (`in_stock` / `low_stock` / `out_of_stock`) is derived server-side from `stock` and
`isActive` on every response — it is never stored as a separate field that could drift from the
real stock count.

## 17. How maps and directions work

The customer app uses **Leaflet** with **OpenStreetMap** tile layers
(`apps/customer/src/components/StoreMap.tsx`) — no API key, no billing account, no usage quota to
manage. It's lazy-loaded into its own JS chunk since it's the single heaviest dependency in the app
and only needed on the store-discovery page.

- Store markers plot only stores with non-null `lat`/`lng`. A store without coordinates yet is
  never given a fake default position — it's excluded from the map and shown in the list with a
  "location not available" note instead (set coordinates in the admin app's Store Settings page).
- The user's own location (when granted) is a separate pulsing marker; the map is fully usable
  without it, and denial is handled gracefully (`apps/customer/src/lib/geo.ts`) — no default
  fallback city is substituted.
- "Get Directions" opens `https://www.google.com/maps/dir/?api=1&destination=<store address>` in
  a new tab — full turn-by-turn routing without embedding a paid directions API in this app.
- Distance-based sorting on the store list uses a plain Haversine calculation
  (`apps/customer/src/lib/geo.ts`), accurate enough for "nearby stores" without any external
  service.

## 18. Troubleshooting

- **`'...' is not recognized as an internal or external command` on `npm run <script>`
  (Windows)**: if your project path contains `&` (or other cmd.exe-special characters), npm's
  generated `.cmd` shims break under the default `cmd.exe` script shell. Fix: point npm at
  PowerShell instead — `npm config set script-shell "$(where.exe powershell.exe | Select-Object -First 1)" --location=user`
  (this is a machine-level setting, not part of the repo).
- **`Error: Missing required environment variable: DATABASE_URL`** (or any `FIREBASE_*`/`VITE_*`
  variable): the relevant `.env` file is missing or incomplete — see §5. The backend and both
  frontends fail fast and loudly on a missing required variable rather than silently falling back
  to a broken default.
- **`GET /api/health` returns `{"status":"degraded"}`**: the backend is running but can't reach
  `DATABASE_URL`. Check the connection string, Cloud SQL Authorized Networks / Auth Proxy setup,
  and that the database/user actually exist.
- **401 on every admin request**: confirm the frontend is sending a fresh ID token (Firebase
  tokens expire hourly and the SDK refreshes them automatically on `getIdToken()` calls — this
  should be transparent) and that `FIREBASE_PROJECT_ID` on the backend matches
  `VITE_FIREBASE_PROJECT_ID` on the frontend exactly.
- **403 "You do not manage this store"**: expected and correct if the signed-in user has no
  `store_admins` row for that store — see §15 to grant access, not a bug to work around.
- **CORS error in the browser console**: the calling origin isn't in the backend's
  `ALLOWED_ORIGINS`. Check for trailing slashes or `http` vs `https` mismatches — both need to
  match exactly.
- **A new store doesn't show up on the customer map**: it needs `lat`/`lng` set (Store Settings in
  the admin app) and `status: active` — see §17.

## 19. Production checklist

Before pointing real users at this:

- [ ] `DATABASE_URL` points at a real, backed-up Cloud SQL instance (not a dev database)
- [ ] `backend/drizzle` migrations have been applied to that database (`npm run db:migrate`)
- [ ] Firebase Authorized domains list only contains your real production domains
- [ ] Google Cloud Console API key restrictions are set on the Firebase Web API key (HTTP
      referrers limited to your real domains)
- [ ] `ALLOWED_ORIGINS` on Render lists only your real Vercel domains (no `localhost`)
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` is set via Render's environment variable dashboard, never
      committed to git
- [ ] At least one `super_admin` user exists — promote a user's role directly in the database once
      (there's no bootstrap UI for the very first super_admin, by design: it's a one-time manual
      step, not a self-service flow)
- [ ] Custom domains configured and `VITE_API_URL` / `ALLOWED_ORIGINS` updated to match (§9)
- [ ] Ran the manual test flows and security scenarios in §20 against the real deployment

## 20. Testing

**What has been verified in this repository** (see commit history for details):
- `npm install`, `tsc --noEmit`, and `vite build` succeed for `backend`, `apps/customer`, and
  `apps/admin`.
- Both frontends render correctly across mobile/tablet/desktop viewports in a real browser,
  including the live Leaflet/OpenStreetMap map, empty states, and error states.
- Unauthenticated requests to every admin write endpoint, and to order placement, are rejected
  with 401. An invalid/garbage bearer token is rejected with 401. Malformed JSON bodies return
  400. The public store-listing endpoint requires no auth token (confirmed by getting a 500 from
  an intentionally-unreachable test database rather than a 401).

**What still needs to be tested against a real deployment** (requires a real `DATABASE_URL` and
Firebase project, which weren't available in the environment this was built in):
- The full customer flow: browse → select a store → view products/services → cart → checkout →
  order history, with real data.
- The full admin flow: sign in → dashboard metrics reflect real orders → create/edit/delete a
  product and service → view and update a real order's status → edit store settings including
  opening hours → add/remove a store admin.
- **Store isolation, specifically**: create two stores with two different admins, and confirm
  Admin A gets 403 attempting to read or write Store B's products, services, or orders via direct
  API calls (not just that the UI hides the option). Example:
  ```bash
  curl -X PUT https://your-api/api/admin/products/<store-b-product-id> \
    -H "Authorization: Bearer <store-A-admin-token>" \
    -H "Content-Type: application/json" -d '{"price": 1}'
  # expect: 403 {"error":{"code":"FORBIDDEN", ...}}
  ```
- Firebase token expiry handling over a long-lived session.
- Order placement decrementing stock correctly under concurrent requests.

Do not treat this project as "fully tested" until the second list has been run against a real
deployment.

## 21. Available scripts (from the repo root)

```bash
npm run dev:backend       # backend dev server (tsx watch)
npm run dev:customer      # customer app dev server (Vite)
npm run dev:admin         # admin app dev server (Vite)
npm run build:customer    # customer production build
npm run build:admin       # admin production build
npm run typecheck         # tsc --noEmit across every workspace
npm run db:generate       # generate a new Drizzle migration from schema.ts
npm run db:migrate        # apply pending migrations to DATABASE_URL
npm run db:push           # dev-only schema sync — do not use in production (§7)
```

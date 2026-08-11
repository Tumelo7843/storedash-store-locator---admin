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
- **Auth**: Firebase Authentication — email/password, phone (SMS), and Google — for identity; a
  `users.role` column plus a `store_admins` join table for authorization (see §12–13). Becoming a
  store owner is a self-service **request** reviewed by a `super_admin`, not automatic — see §23.
- **Currency/units**: South African Rand (ZAR, formatted `R 1,234.56`) and South African address
  conventions (province, postal code) throughout — see §24.

## Authentication follow-up fixes — 2026-08-12

A round of fixes and additions on top of the 2026-08-11 authentication work below, in response to
specific issues found using it: a real phone-auth SMS error, an admin lockout, and several
requested features. Full details are woven into §10, §12, and §23; this is a summary of what
actually changed (and, per the request that prompted this pass, what *didn't* need to change because
Firebase already handles it).

- **Phone SMS region error — diagnosed, not a code fix**: "SMS unable to be sent until this region
  is enabled by the app developer" is Firebase's **SMS region policy**, a project-level console
  setting, not a code or reCAPTCHA problem — this project's phone-auth implementation was checked
  against the current `@firebase/auth` SDK and the
  [official web guide](https://firebase.google.com/docs/auth/web/phone-auth) and already matches it
  exactly. See §10 step 3 for the one console setting that actually fixes it.
- **Duplicate accounts**: confirmed, live, that Firebase's own `createUserWithEmailAndPassword`
  already prevents a duplicate email account (no partial record is created on failure) and that
  phone auth's sign-in/sign-up-are-the-same-operation design already prevents duplicate phone
  accounts — so no new pre-check code was added for either, only better UI when Firebase's own
  rejection happens (§23 "Duplicate account prevention" explains why in full, per this round's
  explicit request to skip anything Firebase already covers rather than add redundant code).
- **Admin app now also accepts Google sign-in**, alongside its existing required email+password, so
  an account originally created via Google (this project's actual first Super Admin) isn't locked
  out. This does not change what that account can *do* — authorization is still 100% determined by
  the backend-verified role, identically regardless of provider (§23).
- **Dedicated Forgot Password page** added to the admin app (previously inline on the login page),
  matching the customer app's page for consistency.
- **Customer "Manage Profile" page** (`/account/manage`): edit name/phone, resend email
  verification, change email (`verifyBeforeUpdateEmail`), change password, and delete account — all
  gated behind Firebase re-authentication where Firebase requires it (§23).
- **Account deletion**, backend: a new `DELETE /api/auth/me` that deletes the Firebase Auth account
  via the Admin SDK and either hard-deletes or anonymizes the database row, depending on whether the
  account has order history (`orders.userId` is `ON DELETE RESTRICT` by design) — see §23 for the
  full reasoning and §25 for what was verified live, including a real resurrection bug this
  found-and-fixed along the way (a still-valid token could recreate a hard-deleted row before the
  fix; the Firebase account itself is now deleted server-side as part of the same request, closing
  that off).

## Customer & admin authentication, and the store-owner approval workflow — 2026-08-11

Full sign-up/sign-in for both apps, plus a Super-Admin-gated path for a customer to become a store
owner, were built out. **Nothing above this section describing the pre-existing architecture
(backend, database, Firebase project, deployment) changed structurally** — this added new tables,
routes, and pages on top of it. Read §12–15 and the new §23–25 below for the complete, current
picture; this entry is a summary of what changed and why.

**how it works:**

- **Customer app** (`apps/customer`): dedicated `/sign-up`, `/sign-in`, `/forgot-password`, and
  `/become-a-store-owner` pages (previously the only option was a single "Sign in with Google"
  button on the Account page). Sign-up collects name, email, optional phone, and a password
  (minimum 7 characters, must mix letters and numbers, live strength meter). Sign-in offers email
  password, phone (SMS one-time code via `RecaptchaVerifier` + `signInWithPhoneNumber`), and Google,
  switchable by tab. Every Firebase error code is mapped to a plain-English message
  (`apps/customer/src/lib/authErrors.ts`) instead of surfacing `Firebase: Error (auth/xyz).`
  Sessions persist across browser restarts (`browserLocalPersistence`, set explicitly in
  `lib/firebase.ts`). The sign-in page carries a clear **"Store owner or admin? Sign in here"** link
  to the admin app (§23).
- **Admin app** (`apps/admin`): `LoginPage` rewritten to **email + password only** — no Google
  button — per the requirement that admin/store-owner authentication must use email+password. A
  signed-in user who isn't an approved, non-suspended store owner sees a clear "no access" screen
  with a link back to the customer app's store-owner request form, rather than a broken dashboard.
  Two new Super-Admin-only pages: **Applications** (`/applications`, approve/reject with a required
  rejection reason) and **Store Owners** (`/store-owners`, suspend/reactivate any store owner).
- **Backend**: a new `store_owner_applications` table and its full CRUD/review API (§23), a
  `users.suspended` flag enforced in `requireAuth` on every request platform-wide (§13), a
  `users.phone` column, and a narrow `PATCH /api/auth/me` that lets a user update only their own
  name/phone — never role or suspended (§12).
- **Security model unchanged, extended**: the pre-existing rule that authorization is enforced
  server-side, never trusted from the client, now also covers the approval workflow — approving an
  application is the *only* code path (besides direct DB access) that can turn a `customer` into a
  `store_admin`, and it always creates the store from the application's own stored data, never from
  request-body input (§23).
- **Currency/units**: every price/revenue display converted from a hardcoded `$` to
  `formatZAR()` (new `@storedash/shared` export, `Intl.NumberFormat('en-ZA', { style: 'currency',
  currency: 'ZAR' })`); "State"/"ZIP" labels and the `United States` default became "Province"/
  "Postal Code" and `South Africa` (§24).

**Verified this pass** (real Firebase project + live Postgres database, not mocked — see §25 for
the full list): sign-up, sign-in, wrong-password rejection, the `PATCH /api/auth/me` role-tampering
attempt (confirmed the field is silently stripped by validation, not just ignored by convention),
the full application → approve → store-created → role-upgraded → store-scoped-access chain, the
full application → reject → applicant-stays-`customer` chain, duplicate-pending-application
rejection, suspend → every endpoint 403s → reactivate → access restored, a `super_admin` blocked
from suspending themselves, and cross-store isolation (a newly-approved owner denied write access
to a store they don't manage). This pass found and fixed one real bug: `PATCH /api/auth/me` with no
recognized fields crashed with a 500 (Drizzle's "no values to set") instead of a clean 400 — fixed
in `backend/src/validators/auth.validator.ts` with a `.refine()` requiring at least one field.
**Not verified in a real browser** (this environment has no browser-automation tooling installed):
the actual Google OAuth popup and SMS delivery for phone sign-in — both call real external services
that can't be driven headlessly here. Do this manually before shipping (§25).

## Customer landing page redesign — 2026-08-11

The customer discovery/landing page (`apps/customer/src/pages/HomePage.tsx`) and the app's visual
identity were reworked. No backend route, database schema, Firebase config, or API contract
changed — everything below is frontend-only, and every other section of this README (env vars,
local dev, Firebase setup, Vercel/Render deployment, CORS) still applies exactly as written.

**What changed:**

- **Landing page layout**: stores list on the left, interactive Leaflet map on the right (desktop/
  tablet ≥1024px). Below that breakpoint the page switches to a **List / Map toggle** instead of
  shrinking the two-column layout — a 50/50 split is unusable at phone width, so mobile gets a
  full-width list view and a full-width map view with a bottom-sheet store card, switched with a
  segmented control.
- **List ↔ map selection**: clicking a store in the list highlights its marker (grows, switches to
  the accent blue, map flies to it) and opens a detail card (photo, category, open/closed, address,
  hours, phone, "View Store" / "Directions"). Clicking a marker does the same in reverse and opens
  the same detail card. Clicking an *already-selected* row/marker navigates to the full store page
  (`/stores/:id`) — one click previews, a second confirms, matching how map-list pickers usually
  behave.
- **Visual identity**: dark purple primary, charcoal neutral background, blue accent — defined once
  as Tailwind v4 `@theme` tokens in `apps/customer/src/index.css` (`--color-primary`,
  `--color-gray-50…900`, `--color-surface`, `--color-accent`) so the whole app inherits the same
  palette instead of only the landing page. Purple is used for branding/buttons/nav, blue for
  selection/links/focus, keeping the two from competing for the same elements. Status colors
  (open/closed, stock levels, order status) were re-tuned for contrast against the dark surfaces.
- **Map**: switched to CARTO's free, keyless dark basemap tiles; themed zoom control/popups/
  attribution; a floating "center on my location" button; purple (unselected) / blue (selected)
  marker pins with a fly-to animation on selection; a graceful "No store locations to display yet"
  overlay when the current filter has zero stores with coordinates. See §17 for the full map
  behavior.
- **Consistency + small UX fixes**: `StorePage`, `CartPage`, `OrdersPage`, `OrderDetailPage`,
  `AccountPage`, `Layout`, and the shared loading/error/empty states (`components/ui/States.tsx`)
  were re-themed so the rest of the app matches the redesigned landing page rather than reverting to
  a light shell around it. Added: a clearable search field, skeleton loading rows for the store list
  (replacing a blocking spinner), and short (150–250ms) `prefers-reduced-motion`-aware transitions
  for state changes — no decorative animation was added.
- **`emilkowalski/skills`**: `npx skills add emilkowalski/skills` was run as requested, but this
  sandbox has no DNS resolution for `github.com` (the `skills` CLI only installs from git sources),
  so the package could not be fetched. The animation choices above (short transform/opacity
  transitions, `cubic-bezier(0.32, 0.72, 0, 1)` easing, restraint, `prefers-reduced-motion` support)
  follow that author's publicly documented conventions applied by hand instead. **No new npm
  dependencies were added** — the redesign uses only the packages already in `apps/customer/package.json`
  (`leaflet`, `react-leaflet`, `lucide-react`, Tailwind CSS v4) plus plain CSS.

**Customer app structure** (`apps/customer/src`):

```
src/
  components/
    Layout.tsx          Sticky header/nav — logo, Discover/Orders/Cart/Account links
    StoreMap.tsx         Leaflet map: markers, popups, locate-me control, fly-to-selection
    ui/States.tsx        Shared Spinner / ErrorState / EmptyState
  context/
    AuthContext.tsx      Firebase auth state + Google sign-in/out, syncs the backend user profile
    CartContext.tsx      Client-side cart (single-store at a time), checkout submits via lib/api
  lib/
    api.ts               fetch wrapper + typed calls to every backend endpoint the customer app uses
    env.ts                Reads/validates VITE_* env vars
    firebase.ts           Firebase Web SDK init
    geo.ts                useGeolocation hook + Haversine distance helper (no fallback coordinate)
    hours.ts               Opening-hours formatting + isStoreOpenNow
    leafletIcons.ts        Inline-SVG marker icons (purple = default, blue = selected)
    useAsync.ts            Small loading/error/data fetch hook used by every page
  pages/
    HomePage.tsx          Redesigned landing page (list + map + mobile toggle) — see above
    StorePage.tsx          Store detail: info, hours, products/services tabs, add-to-cart
    CartPage.tsx / CartContext-backed checkout
    OrdersPage.tsx / OrderDetailPage.tsx   Order history (requires sign-in)
    AccountPage.tsx        Sign-in/out, profile, role badge
  App.tsx                 Routes
  index.css                Tailwind v4 theme tokens + Leaflet chrome theming (see above)
```

Running locally, environment variables, connecting to the Render backend, Vercel deployment,
Firebase configuration, and CORS are all unchanged by this redesign — see §5 (env vars), §6 (local
dev), §9 (deployment + CORS), and §10 (Firebase) below.

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
- A Firebase project with Authentication enabled — **Email/Password**, **Phone**, and **Google**
  providers (§10)

## 5. Environment variables

Every variable is documented in [.env.example](.env.example). Summary:

**`backend/.env`** (server-only — never exposed to a browser):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `ALLOWED_ORIGINS` | yes | Comma-separated frontend origins for CORS |
| `FIREBASE_PROJECT_ID` | yes | Must match both frontends' `VITE_FIREBASE_PROJECT_ID` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | on Render (optional on GCP) | base64-encoded service account JSON |
| `SUPABASE_URL` | for image uploads | Project URL, from Supabase dashboard > Project Settings > API (§22) |
| `SUPABASE_SERVICE_ROLE_KEY` | for image uploads | **Secret.** `service_role` key, never the `anon` key (§22) |
| `SUPABASE_STORAGE_BUCKET` | no | Defaults to `images` |
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
| `VITE_ADMIN_URL` | `apps/customer/.env` only, no | **Full URL, including path** (e.g. `https://admin.example.com/login`) — used as-is, with no path appended in code, for the "Admin sign in" link on the customer sign-in page (§23). Link is hidden if unset. |
| `VITE_CUSTOMER_URL` | `apps/admin/.env` only, no | **Full URL, including path** (e.g. `https://shop.example.com/account`) — used as-is, with no path appended in code, for the "Sign up as a customer" / "Request store-owner access" links on the admin login/no-access screens (§23). Link is hidden if unset. |

**Never put in a frontend `.env`:** `DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_BASE64`,
`SUPABASE_SERVICE_ROLE_KEY`, or any database credential. Note that neither frontend needs any
Supabase variable at all — uploads go through the backend (§22), so no Supabase key of any kind,
not even a public one, ships in either browser bundle. The `VITE_` Firebase values are not secret in the traditional sense (the
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
2. Authentication > Sign-in method > enable all three providers this app uses:
   - **Email/Password** — used by the customer app's email sign-up/sign-in and the admin app's
     login (§23).
   - **Phone** — used by the customer app's phone sign-in/sign-up (§23). No extra provider config
     needed for production; for local development, Authentication > Sign-in method > Phone >
     **Phone numbers for testing** lets you add a fake number (e.g. `+27821234567`) with a fixed
     code (e.g. `123456`) so you can test the flow without receiving a real SMS.
   - **Google** — used by both apps. The admin app's login requires email+password as its primary
     method, but also offers Google as an alternative purely so an account originally created via
     Google (e.g. the platform's first Super Admin) can still sign in — access is gated entirely by
     the backend-verified role, never by which provider authenticated the request, so this doesn't
     let an ordinary Google user become an admin (§12, §23).
3. **If phone sign-in fails with "SMS unable to be sent until this region is enabled by the app
   developer"**: this is Firebase's **SMS region policy**, a console-only setting — no amount of
   client code changes it (confirmed against the current `firebase`/`@firebase/auth` SDK: this
   project's `RecaptchaVerifier`/`signInWithPhoneNumber` usage already matches the [official phone
   auth web guide](https://firebase.google.com/docs/auth/web/phone-auth) exactly). Fix it at
   **Authentication > Settings > SMS region policy**: either select **Allow all except denied
   regions** (with nothing denied), or **Allow only these regions** with South Africa (`ZA`, `+27`)
   explicitly added. Without this, no phone number in an unlisted region can receive an SMS,
   regardless of anything else being configured correctly.
4. Authentication > Settings > **Authorized domains** — add your Vercel domains (both customer and
   admin) and your local dev origins if needed (`localhost` is included by default). Phone auth's
   invisible reCAPTCHA also depends on this list — a domain missing here will fail phone sign-in
   with an `auth/captcha-check-failed`-style error even though it works locally. This list is shared
   by both apps (same Firebase project), so adding Google to the admin app (step 2) needs no new
   entry here beyond what customer already required.
5. Authentication > Templates > **Password reset** (and, if you customize it, **Email address
   verification**) — Firebase's defaults work out of the box (this is what `sendPasswordResetEmail`
   and `sendEmailVerification` send, §23); customize the sender name/logo here if you want, but no
   change is required for the app to function.
6. Project Settings > General > Your apps > add a Web app (or reuse one) to get the
   `VITE_FIREBASE_*` values for §5. The same Firebase project/config is used by both frontends.
7. Project Settings > Service Accounts > **Generate new private key** → downloads a JSON file. This
   is also what grants the backend's Admin SDK permission to delete a user's Firebase Auth account
   as part of self-service account deletion (§23) — no separate IAM role or console step is needed
   for that specifically, it's included in the same service account.
   - On Render (or any non-GCP host): base64-encode it and set as `FIREBASE_SERVICE_ACCOUNT_BASE64`:
     ```bash
     base64 -w0 service-account.json   # Linux
     openssl base64 -A -in service-account.json   # macOS
     ```
   - On GCP compute (Cloud Run, GCE, App Engine): you can omit this variable — the Admin SDK
     authenticates automatically via Application Default Credentials, and only `FIREBASE_PROJECT_ID`
     is needed.
8. **If this JSON file, or any Firebase Admin credential, has ever been committed to a git repo,
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
token>`, regardless of whether the user signed in with email/password, phone, or Google — all three
produce the same kind of ID token. `backend/src/middleware/auth.ts`'s `requireAuth` verifies it
against Firebase using the Admin SDK and loads (or lazily creates) the corresponding row in the
`users` table. If the token is missing, expired, or invalid, the request is rejected with 401 before
any handler runs. If the corresponding user row has `suspended = true`, the request is rejected with
403 at this same layer — suspension is checked before any role/store logic even runs, so a
suspended `super_admin` (self-suspension is blocked, see §23, but a *different* super_admin could
still suspend one) loses access exactly like anyone else.

**Authorization** (this app's own logic, not Firebase's): a verified identity does not imply any
permission. Three roles exist on `users.role`: `customer` (default for every new sign-in — see §23
for the *only* path that changes this), `store_admin`, and `super_admin`. Role alone still isn't
enough to act on a specific store — see §13.

Every admin-write route is protected by one of two middlewares
(`backend/src/middleware/authorize.ts`):

- `requireRole(...roles)` — checks `req.authUser.role` is in the allowed list. Used for
  platform-wide actions like store creation and the entire Super Admin API (§23).
- `requireStoreAccess(resolveStoreId)` — resolves the **real** store ID for the resource being
  acted on directly from the database (e.g. looks up a product's `storeId` column, not whatever a
  client claims), then checks the caller manages that store. This is what makes
  `PUT /api/admin/products/999` safe even if the request body contains a different `storeId`.

**A user can never write their own role, suspended flag, or store assignments.** The only
self-service profile endpoint, `PATCH /api/auth/me`, is validated against a schema
(`backend/src/validators/auth.validator.ts`) that accepts *only* `name` and `phone` — any other
field in the request body (`role`, `suspended`, anything) is silently stripped by Zod before it ever
reaches `updateOwnProfile` in `backend/src/services/users.service.ts`, which only ever writes those
same two columns. This was confirmed by directly `PATCH`ing `{"role":"super_admin"}` against a real
`customer` account during this work — the field was dropped, the account's role never changed (see
§25). The only two places that ever write `users.role` or `users.suspended` are
`storeOwnerApplications.service.ts` (role, only via an approved application, §23) and
`storeOwners.service.ts` (suspended, `requireRole('super_admin')`-gated, §23) — both server-side,
both independent of any client-supplied role/suspended value.

The frontends also gate their own UI (e.g. the admin app's login screen refuses a signed-in
non-admin or suspended account, and hides `/applications`/`/store-owners` from non-super-admins),
but that's a UX convenience, not the security boundary — every one of these checks is re-verified
server-side regardless of what the frontend does or doesn't show.

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

Two paths create a store, and both end up in exactly the same place — a row in `stores` plus a
`store_admins` link — because the second path is implemented as a super_admin acting through the
same primitives, not a separate parallel system:

1. **Self-service (typical path)**: a customer requests store-owner access with their business
   details, a `super_admin` approves it, and approval creates the store automatically from the
   application's data. This is the flow most real store owners go through — see §23.
2. **Direct creation (super_admin only)**: `POST /api/admin/stores`, gated by
   `requireRole('super_admin')` in `backend/src/routes/stores.routes.ts` — creating a store directly
   establishes ownership, so it isn't self-service for a plain `store_admin`. In the admin app, a
   `super_admin` sees a **Create Store** item in the sidebar (`apps/admin/src/pages/NewStorePage.tsx`).
   The creator is automatically added as the first admin of the new store. Useful for a super_admin
   onboarding a store owner directly (e.g. over email/phone) without making them fill out the
   in-app application form.

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

The customer app uses **Leaflet** with **OpenStreetMap** data via **CARTO's dark basemap tiles**
(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, attributed to both OSM and CARTO
in the map's attribution control) — still no API key, no billing account, no usage quota to manage,
just a dark-themed tile set instead of the default light one so the map matches the rest of the app.
It's lazy-loaded into its own JS chunk (`apps/customer/src/components/StoreMap.tsx`) since it's the
single heaviest dependency in the app and only needed on the store-discovery page.

- Store markers plot only stores with non-null `lat`/`lng`. A store without coordinates yet is
  never given a fake default position — it's excluded from the map and shown in the list with a
  "location not available" note instead (set coordinates in the admin app's Store Settings page).
  If **no** store in the current filter has coordinates, the map shows a "No store locations to
  display yet" overlay instead of an empty, unexplained tile view.
- Markers are purple (`--color-primary`) by default and switch to blue (`--color-accent`), grow, and
  gain a glow when their store is selected — from either the list or the marker itself
  (`apps/customer/src/lib/leafletIcons.ts`). Selecting a store smoothly flies the map to it
  (`FlyToSelected` in `StoreMap.tsx`); the initial load fits the map to every visible marker
  (`FitToMarkers`).
- Each marker's popup and the list's detail card both offer a **"View Store"** link (navigates to
  `/stores/:id`) so a customer can go from "found it on the map" to the store's products/services in
  one click, without leaving the landing page just to look.
- A floating "center on my location" control sits on the map itself (bottom-right, matching the
  brand purple) in addition to the "use my location" control in the list header — both call the same
  `useGeolocation` hook, so their state (loading/granted/denied) stays in sync.
- The user's own location (when granted) is a separate pulsing blue marker; the map is fully usable
  without it, and denial is handled gracefully (`apps/customer/src/lib/geo.ts`) — no default
  fallback city is substituted.
- "Get Directions" opens `https://www.google.com/maps/dir/?api=1&destination=<store address>` in
  a new tab — full turn-by-turn routing without embedding a paid directions API in this app.
- Distance-based sorting on the store list uses a plain Haversine calculation
  (`apps/customer/src/lib/geo.ts`), accurate enough for "nearby stores" without any external
  service.
- Below the `lg` (1024px) breakpoint, the list and map are two full-width views switched by a
  segmented **List / Map** control rather than a shrunk two-column layout, which is unusable at
  phone width. Selection state is shared between both views, so switching tabs never loses the
  current selection.

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
- **"This account has been suspended" (403) even though the account looks fine**: `users.suspended`
  is `true` for that row — a `super_admin` suspended it (§23). Reactivate from the admin app's
  Store Owners page, or `POST /api/admin/store-owners/:id/reactivate` directly.
- **Phone sign-in fails with a reCAPTCHA/`auth/captcha-check-failed` error**: the current origin
  isn't in Firebase's Authorized domains list (§10) — this includes `localhost` during local dev,
  which is included by default, but a custom local port or a new Vercel preview domain is not.
- **Phone sign-in fails with "SMS unable to be sent until this region is enabled by the app
  developer"** (or the mapped message "SMS sign-in isn't enabled for this phone number's region
  yet"): this is **not** a code/reCAPTCHA problem — it's Firebase's **SMS region policy**, a
  console-only setting. See §10 step 3 for the exact fix (Authentication > Settings > SMS region
  policy > allow South Africa / allow all regions).
- **"You already have a pending store-owner application"** (409 on `POST
  /api/store-owner-applications`): expected — one user can only have one *pending* application at a
  time (`storeOwnerApplications.service.ts`). Wait for a super_admin to approve/reject it, or check
  `GET /api/store-owner-applications/mine` for its current status.
- **Admin app says "No account found with this email"**: the admin app's login requires an account
  that already exists (§23) — if that person signed up via Google on the customer app and never set
  a password, either "Forgot password?" on the admin login page (emails them a link to set one) or
  the **Continue with Google** button on the same page will work, since it's the same underlying
  Firebase account either way.
- **Sign-up shows "An account with this email already exists"**: expected — this is Firebase's own
  `auth/email-already-in-use` rejection from `createUserWithEmailAndPassword`, surfaced with **Sign
  in** / **Reset password** buttons on the sign-up page (`apps/customer/src/pages/SignUpPage.tsx`).
  See §23 "Duplicate account prevention" for why there's no separate pre-check.
- **`auth/requires-recent-login` on the Manage Profile page** (change email, change password, or
  delete account): expected — Firebase requires a recently-verified session for sensitive actions.
  The page prompts for your current password (or a fresh Google sign-in) inline and retries
  automatically; a phone-only account is asked to sign out and back in instead (§23).

## 19. Production checklist

Before pointing real users at this:

- [ ] `DATABASE_URL` points at a real, backed-up Cloud SQL instance (not a dev database)
- [ ] `backend/drizzle` migrations have been applied to that database (`npm run db:migrate`)
- [ ] Firebase Authentication has **Email/Password**, **Phone**, and **Google** all enabled (§10)
- [ ] Firebase Authorized domains list only contains your real production domains (needed for
      Google popup *and* phone reCAPTCHA — §10)
- [ ] Google Cloud Console API key restrictions are set on the Firebase Web API key (HTTP
      referrers limited to your real domains)
- [ ] `ALLOWED_ORIGINS` on Render lists only your real Vercel domains (no `localhost`)
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` is set via Render's environment variable dashboard, never
      committed to git
- [ ] `VITE_ADMIN_URL` (customer app) and `VITE_CUSTOMER_URL` (admin app) point at each other's real
      production domains, not `localhost` (§5, §23)
- [ ] At least one `super_admin` user exists — see §23 "Creating the first Super Admin" (there's no
      bootstrap UI for the very first one, by design: it's a one-time manual step, not a
      self-service flow)
- [ ] Custom domains configured and `VITE_API_URL` / `ALLOWED_ORIGINS` updated to match (§9)
- [ ] Ran the manual test flows and security scenarios in §20 and §25 against the real deployment

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
- **Customer landing page redesign (2026-08-11)**: verified in a real headless Chromium browser
  (Playwright) against the local backend (`npm run dev:backend`) connected to a live database, at
  both a 1440px desktop viewport and a 390px mobile viewport. Confirmed: the store list loads real
  data and renders themed; the map renders CARTO dark tiles with a themed zoom control and locate
  button; selecting a store from the list highlights the correct marker (flies to it, switches it
  blue) and opens the detail card with correct data; the mobile List/Map toggle stays reachable in
  both states and the bottom-sheet detail card renders over the map; "View Store" navigates to the
  correct `/stores/:id` and that page renders themed; Cart/Orders/Account empty and signed-out
  states render themed. This pass caught and fixed two real bugs before considering the work done:
  Leaflet throwing on a `display:none` map container when switching mobile tabs, and the mobile
  List/Map toggle being nested inside the panel it hides (stranding the user in Map view with no
  way back). Not covered by this pass: authenticated flows (sign-in, checkout, order history),
  since Playwright wasn't driven through Google's OAuth popup.

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

## 22. Image uploads (Supabase Storage)

Store logos/banners and product/service photos are uploaded as files from the admin app and stored
as public URLs on the `imageUrl`/`bannerUrl` columns — the database (Neon Postgres) never holds the
image bytes themselves, only the URL. The actual files live in **Supabase Storage**.

### Why it works this way

The admin app authenticates with **Firebase Auth**, not Supabase Auth, so there's no Supabase user
session in the browser to scope a Row Level Security policy to. Rather than bridge that gap, the
browser never talks to Supabase at all:

```
Admin app → (Firebase ID token) → Backend → (service_role key) → Supabase Storage
```

The browser sends the image file to the backend (`POST /api/admin/uploads`, protected by the same
`requireAuth` + `requireRole('store_admin', 'super_admin')` middleware as every other admin route —
see §12). The backend uploads it to Supabase using the `service_role` key and returns a public URL,
which the frontend then saves via the normal `PUT`/`POST` store/product/service endpoints, exactly
as if it had been typed into a plain URL field. No Supabase key — public or secret — is ever present
in `apps/admin` or `apps/customer`.

### 1. Create (or reuse) a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in — if your GitHub
   account is already connected, any existing organizations/projects tied to it show up on this
   page directly. If a project for this app already exists, skip to step 2.
2. Otherwise, **New project** → pick an organization (Supabase can create one from your GitHub
   account automatically) → name it (e.g. `storedash`) → choose a region close to your Render
   backend's region → set a database password (you won't need this password anywhere in this
   app — it's only for Supabase's own Postgres, which this project does not use; the app's data
   stays in Neon) → **Create new project**. Takes a minute or two to provision.

### 2. Create the storage bucket

1. In the project, open **Storage** in the left sidebar.
2. **New bucket** → name it `images` (must match `SUPABASE_STORAGE_BUCKET`, which defaults to
   `images` if you don't set it) → toggle **Public bucket** on → Create.
   - "Public" here only controls *read* access (anyone with a file's URL can view it — needed
     since these images are shown on public store pages and the customer app). It does **not**
     allow public uploads. Only the backend's `service_role` key can write to the bucket, and that
     key is never exposed to any browser — see §5.
3. No additional bucket policies are needed: uploads always go through the backend using
   `service_role`, which bypasses Row Level Security entirely, and the bucket being "Public"
   already grants anonymous read via `getPublicUrl()`. There's nothing to configure on the
   **Policies** tab for this setup.

### 3. Find your keys

Project Settings (gear icon) > **API**:

| Value | Where | Safe in a frontend? |
|---|---|---|
| Project URL | API > Project URL | Yes, but unused here (backend-only) |
| `anon` `public` key | API > Project API keys | Yes — but this project doesn't use it anywhere |
| `service_role` key | API > Project API keys (click "Reveal") | **No — never.** Full admin access to every table and bucket, bypasses all Row Level Security. Backend-only. |

Only two of these are actually used, both server-side: **Project URL** and **`service_role`
key**.

### 4. Configure environment variables

`backend/.env` (local) and Render's environment variable dashboard (production) — **never**
`apps/admin/.env` or `apps/customer/.env`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # the service_role secret, not anon
SUPABASE_STORAGE_BUCKET=images             # optional, this is the default
```

After setting these on Render, redeploy the backend (or let the env var change trigger it
automatically) — like `FIREBASE_SERVICE_ACCOUNT_BASE64`, this is read once at process start via
`backend/src/lib/supabase.ts`, which stays `null` (and the upload route returns a clear 500) until
both variables are present, so the rest of the app keeps working even before this is configured.

### 5. How it's implemented

- `backend/src/routes/uploads.routes.ts` — `POST /api/admin/uploads?folder=stores|products|services`,
  `multer` (5MB memory-buffered limit) + the same auth/role middleware as other admin routes.
- `backend/src/controllers/uploads.controller.ts` — validates MIME type (JPEG/PNG/WebP/GIF only),
  uploads the buffer to `{folder}/{userId}/{timestamp}-{uuid}.{ext}` in the bucket, returns
  `{ data: { url } }`.
- `apps/admin/src/lib/upload.ts` — client helper: pre-validates type/size for instant feedback,
  then `POST`s the file as `multipart/form-data` with the Firebase ID token as the bearer token.
- `apps/admin/src/components/ImageUploadField.tsx` — the UI: thumbnail preview, an "Upload image"
  button, and a plain URL text input (so pasting an already-hosted URL still works). Used by
  `StoreSettingsPage` (logo, banner), `ProductModal`, and `ServiceModal`.

### 6. Testing the full flow

1. Set the three env vars in `backend/.env`, restart `npm run dev:backend`.
2. Sign into the admin app as a `store_admin` or `super_admin` (§15), open a product/service/store
   settings form, click **Upload image**, pick a file.
3. Confirm the thumbnail updates and the URL field fills in with a
   `https://<project-ref>.supabase.co/storage/v1/object/public/images/...` URL.
4. Save the form — this `PUT`/`POST`s the URL to the backend like any other field, which persists
   it to the `image_url`/`banner_url` column in Neon Postgres (§5 in the original image-upload
   discussion; no schema change was needed, these columns already existed as plain `text`).
5. Open the customer app and confirm the image renders on the store/product/service card — it's
   just an `<img src>` pointed at the public Supabase URL, no auth or SDK involved on that side.
6. Paste the same image URL directly into a browser tab to confirm it loads without being signed
   in, verifying the bucket's public-read policy.

## 23. Customer & admin authentication, and the store-owner approval workflow

This section is the complete reference for everything summarized in the changelog entry near the
top of this file. Read §12–13 first for the general auth/authorization model this builds on.

### Customer app: sign-up, sign-in, sign-out

`apps/customer/src/context/AuthContext.tsx` wraps the Firebase Web SDK and exposes
`signUpWithEmail`, `signInWithEmail`, `signInWithGoogle`, `sendPasswordReset`, and `signOut`. Phone
sign-in is handled directly in `apps/customer/src/pages/SignInPage.tsx` (it needs a live DOM node
for Firebase's invisible reCAPTCHA, which doesn't fit the context's shape) but uses the same shared
`auth` instance, so `onAuthStateChanged` in the context picks up a successful phone sign-in exactly
like any other.

- **Sign up** (`/sign-up`): name, email, optional phone, password + confirm. Password must be at
  least 7 characters and include both a letter and a number
  (`apps/customer/src/lib/validation.ts`'s `passwordError`), enforced client-side before the
  Firebase call *and* backstopped by Firebase's own server-side password policy. A live strength
  meter (weak/medium/strong) gives feedback as you type. On success: `updateProfile` sets the
  Firebase display name, `POST /api/auth/sync` provisions the `users` row, then
  `PATCH /api/auth/me` saves the phone number (Firebase's own profile has no phone field unless
  phone *is* the sign-in method — see below), and a verification email is sent
  (`sendEmailVerification`, best-effort — sign-up doesn't block on it).
- **Sign in** (`/sign-in`): a two-tab toggle between **Email** (`signInWithEmailAndPassword`) and
  **Phone**. Phone sign-in sends a 6-digit SMS code (`signInWithPhoneNumber` +
  `RecaptchaVerifier` in invisible mode) and confirms it (`confirmationResult.confirm(code)`) — this
  is also how a *new* phone number signs up, since Firebase phone auth doesn't distinguish sign-up
  from sign-in; there's no separate phone sign-up form. Below both tabs, a **Google** button
  (`signInWithPopup`). A **"Store owner or admin? Sign in here"** link (only rendered when
  `VITE_ADMIN_URL` is set, §5) sends store owners to the admin app's sign-in page — `VITE_ADMIN_URL`
  must be the *full* URL of that page (e.g. `.../login`), since the link uses it as-is with no path
  appended.
- **Forgot password** (`/forgot-password`): `sendPasswordResetEmail`. The confirmation message is
  deliberately generic ("if an account exists for this email…") regardless of whether the address is
  actually registered — this project's Firebase settings have email-enumeration protection enabled,
  and the UI copy matches that regardless, so it never leaks which emails have accounts.
- **Errors**: every Firebase Auth error code is translated to a plain-English message by
  `apps/customer/src/lib/authErrors.ts` (`authErrorMessage`) — wrong password, email already in use,
  weak password, invalid phone number, expired/incorrect SMS code, too many attempts, network
  errors, etc. all get a specific message instead of Firebase's raw `Firebase: Error (auth/xyz).`
- **Persistence**: `browserLocalPersistence` is set explicitly in `apps/customer/src/lib/firebase.ts`
  (and the admin equivalent) — a signed-in session survives closing and reopening the browser, not
  just a page refresh.
- **Sign out**: the Account page (`/account`) has a **Sign out** button for a signed-in user, and
  shows sign-in/sign-up CTAs otherwise.

### Duplicate account prevention

There is deliberately **no pre-check** ("does this email/phone already exist?") before attempting
sign-up, and this is a case where adding one would make things worse, not better:

- **Email**: `createUserWithEmailAndPassword` is itself the check — Firebase refuses with
  `auth/email-already-in-use` if the email is taken, and (confirmed live against this project, §25)
  no account, partial or otherwise, is created when that happens. The alternative — calling
  `fetchSignInMethodsForEmail` first — is explicitly discouraged by Firebase for any project with
  **email enumeration protection** enabled, because it always returns an empty array in that mode
  (protection against exactly this kind of probing) and would incorrectly report every email as
  "available." This project has that protection enabled (confirmed live, §25), so the pre-check
  would be actively misleading, not just redundant. Instead, `apps/customer/src/pages/SignUpPage.tsx`
  catches `auth/email-already-in-use` specifically and shows **Sign in** / **Reset password**
  buttons right there, rather than a bare error string.
- **Phone**: Firebase phone auth doesn't have separate sign-up and sign-in — `signInWithPhoneNumber`
  signs into the existing account if that number is already registered, or creates one if it isn't,
  as one unified operation. There is no way for two accounts to end up sharing a phone number through
  this flow, so there's nothing to check for.
- **Invalid email**: client-side format validation (`isValidEmail` in
  `apps/customer/src/lib/validation.ts`, used on sign-up, sign-in, and forgot-password) gives instant
  feedback before any network call; Firebase's own `auth/invalid-email` is the server-side backstop,
  mapped to a plain message by `authErrors.ts`.

### Admin app: email + password, plus Google for pre-existing accounts

`apps/admin/src/context/AuthContext.tsx` and `LoginPage.tsx` offer **both** `signInWithEmail` and
`signInWithGoogle`. Email+password is the primary, required method (a Super Admin or store owner's
account always has one, since there's no other way to be granted the role in the first place — §12,
§23 below); Google is offered *alongside* it, not instead of it, purely so an account that happens
to have been created via Google originally (this project's actual first Super Admin was) can still
sign in without being locked out. This does not weaken the "admin auth requires email+password"
requirement in practice, because:

- **Authorization never looks at which provider signed the token.** `isAuthorized` in
  `AuthContext.tsx` and every backend check in `requireRole`/`requireStoreAccess` (§12) work off the
  `users.role`/`suspended` columns loaded from the database — identical logic regardless of whether
  the Firebase ID token came from `signInWithEmailAndPassword` or `signInWithPopup`. An ordinary
  customer who signs into the admin app with Google gets the exact same `NoAccessCard` a customer
  signing in with email+password would get — nothing about using Google grants any extra privilege.
- Firebase also lets you add an email/password credential to an existing Google-created account with
  the same email by simply requesting a password reset for it (the dedicated
  `apps/admin/src/pages/ForgotPasswordPage.tsx`, or the "Forgot password?" link on the login page,
  does this automatically — Firebase treats it as adding a sign-in method, not creating a new
  account). So a Google-only store owner can still end up with a working email+password credential
  whenever they want one.

A signed-in user whose role is `customer`, or whose account is `suspended`, sees a dedicated
"no access"/"suspended" screen (`NoAccessCard` in `LoginPage.tsx`) instead of a broken dashboard,
with a link to a page in the customer app (via `VITE_CUSTOMER_URL`, §5 — again the *full* URL, e.g.
`.../account` or `.../become-a-store-owner`, used as-is) when that's the relevant next step.

### Customer profile management

`/account/manage` (`apps/customer/src/pages/ManageProfilePage.tsx`, linked from the Account page)
lets a signed-in customer manage their own account. Every sensitive action here operates on
`auth.currentUser` only — there is no way to target another account, client-side or server-side
(`PATCH`/`DELETE /api/auth/me` both resolve the acting user from the verified token, never from a
request parameter, same as everywhere else in the app — §12).

- **Name / phone**: plain `PATCH /api/auth/me` (§12) — same narrow, role-can't-be-set endpoint used
  by sign-up.
- **Email verification**: a banner (shown only while `firebaseUser.emailVerified` is false) with a
  **Resend verification email** button (`sendEmailVerification`). Not required to use the app — this
  is informational/best-effort, matching the non-blocking verification email already sent at sign-up.
- **Change email**: `verifyBeforeUpdateEmail`, **not** the older `updateEmail` — this project has
  email enumeration protection enabled (§25), and Firebase's `updateEmail` throws
  `auth/operation-not-allowed` under that setting; `verifyBeforeUpdateEmail` is its documented
  replacement. It emails a confirmation link to the *new* address; the address only actually changes
  once that link is clicked, and the backend picks up the new email automatically on the next
  `syncProfile()` call after that (same `onConflictDoUpdate` used everywhere else, §12).
- **Change password**: `updatePassword`. For a Google-only or phone-only account (no password
  provider), this section instead offers **"Email me a link to set a password"**
  (`sendPasswordResetEmail`) — the same account-linking mechanism described above for the admin app.
- **Delete account**: type-to-confirm ("DELETE"), then `DELETE /api/auth/me`. See
  `backend/src/services/users.service.ts`'s `deleteOwnAccount` for the full reasoning, summarized:
  the backend deletes the Firebase Auth account itself via the Admin SDK (not the client — this
  closes a resurrection race explained in the function's comment and verified live, §25), then either
  hard-deletes the `users` row (no order history) or anonymizes it in place — clearing email/name/
  phone and setting `suspended: true` — if the account has orders, because `orders.userId` is
  `ON DELETE RESTRICT` by design (order history must outlive the account that placed it; the
  `customerName`/`customerEmail` snapshot columns on `orders` already preserve what's needed for the
  store's records regardless). Either way, `store_admins` rows are removed first, so a deleted or
  anonymized account never retains store-management access, and this never touches another user's
  orders, products, or store data.
- **Reauthentication**: change email, change password, and delete account all require a "recently
  signed in" session — Firebase rejects them with `auth/requires-recent-login` otherwise. The page's
  `ReauthGate` component (reused by all three) handles this per sign-in provider:
  password-provider accounts are asked for their current password
  (`reauthenticateWithCredential` + `EmailAuthProvider.credential`); Google accounts get a
  **"Verify with Google"** button (`reauthenticateWithPopup`); phone-only accounts are told to sign
  out and back in first, since there's no equivalent one-call re-proof available for that provider
  here.

### The store-owner application: schema and lifecycle

New table, `store_owner_applications` (`backend/src/db/schema.ts`, migration
`backend/drizzle/0001_sudden_purple_man.sql`):

```
users ----< store_owner_applications >---- stores (nullable, set on approval)
                                     \---- users (reviewedBy, nullable)
```

Columns mirror what §14's direct-store-creation path collects (business name, category,
description, address, city, province, postal code, country, phone, email) plus `status`
(`pending`/`approved`/`rejected`, enum `application_status`), `storeId` (set only once approved),
`reviewedBy`/`reviewedAt`, and `rejectionReason`. One user can only have one **pending** application
at a time — enforced in `storeOwnerApplications.service.ts`'s `createApplication` (a 409 on a second
attempt), not a database constraint, so a user *can* have multiple historical rows (e.g. a rejected
one followed by a new pending one after addressing the feedback).

**Customer-facing** (`apps/customer/src/pages/BecomeStoreOwnerPage.tsx`, any authenticated user):

| Method | Path | What |
|---|---|---|
| `POST` | `/api/store-owner-applications` | Submit a new application (409 if one is already pending) |
| `GET` | `/api/store-owner-applications/mine` | This user's own applications, newest first |

**Super-Admin-only** (`apps/admin/src/pages/ApplicationsPage.tsx`, `requireRole('super_admin')` on
every route):

| Method | Path | What |
|---|---|---|
| `GET` | `/api/admin/store-owner-applications?status=pending` | List applications, optionally filtered |
| `GET` | `/api/admin/store-owner-applications/:id` | One application |
| `POST` | `/api/admin/store-owner-applications/:id/approve` | Approve (see below) |
| `POST` | `/api/admin/store-owner-applications/:id/reject` | Reject, body `{ "reason": "..." }` (required) |

**Approval** (`approveApplication` in `backend/src/services/storeOwnerApplications.service.ts`) runs
in a single database transaction, row-locked (`.for('update')`) against double-approval races:

1. Re-checks the application is still `pending` (409 if not — you can't approve twice, and this is
   what makes concurrent approve+reject safe).
2. Creates a new `stores` row **from the application's own stored columns** — never from anything in
   the approve request, which carries no body at all. This is the load-bearing security property:
   there's no way to smuggle a different store's data in through this endpoint.
3. Inserts a `store_admins` row linking the applicant to the new store.
4. Upgrades the applicant's `users.role` from `customer` to `store_admin` (only if it's still
   `customer` — approving an application for someone who's already a `store_admin`, e.g. requesting
   a second store some other way, doesn't downgrade or duplicate anything).
5. Marks the application `approved`, with `storeId`, `reviewedBy`, `reviewedAt` set.

**Rejection** just sets `status: 'rejected'` and `rejectionReason` — it never touches `users.role`,
so a rejected applicant stays exactly `customer` and gets no store access, full stop. They can
submit a new application at any time (the "one pending at a time" rule only blocks a second
*simultaneous* one).

### Suspending a store owner

`apps/admin/src/pages/StoreOwnersPage.tsx` (Super Admin only) lists every `store_admin`/
`super_admin` user with the stores they manage, and a **Suspend**/**Reactivate** toggle
(`POST /api/admin/store-owners/:id/suspend` / `.../reactivate`, both `requireRole('super_admin')`).
Suspending sets `users.suspended = true`, which `requireAuth` checks on **every** request platform-
wide (§12) — a suspended store owner is locked out immediately, without losing their role or
`store_admins` rows, so reactivating restores access exactly as it was with no re-approval needed.
A super_admin cannot suspend their own account (`storeOwners.service.ts` rejects it with 400) — this
prevents a platform admin from ever accidentally locking themselves out with no one left to
reactivate them.

### Creating the first Super Admin

There's deliberately no self-service or in-app way to create the very first `super_admin` — every
`super_admin`-granting action in the app (suspending, approving applications) requires already being
one. Bootstrap it once, directly in the database, after that first user has signed in at least once
(sign-in is what provisions their `users` row):

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'you@example.com';
```

Or via Drizzle Studio (`npm run db:studio --workspace=backend`), which opens a browser UI against
`DATABASE_URL` — find the row in the `users` table and edit `role` directly. Every `super_admin`
after the first one can instead be granted the normal way: have them sign up as a customer, submit a
store-owner application (or skip that and just run the same SQL again) — there's no UI path to grant
`super_admin` from within the app itself, on purpose, since it's the platform's highest privilege
level.

## 24. South African currency and units

Prices are stored as plain decimal numbers with no currency column (same as before) — South African
Rand is a *display-time* formatting choice, not a schema change. `formatZAR()`
(`shared/src/currency.ts`, exported from `@storedash/shared`) wraps
`Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })` and is used everywhere a price
or revenue figure is rendered in both frontends (cart, checkout, order history, dashboard revenue/
sales chart, product/service listings) — there is no remaining hardcoded `$` anywhere in either app.
Address forms and defaults were updated to match: `stores.country` and the store-owner application's
`country` both default to `'South Africa'` (was `'United States'`), and "State"/"ZIP" labels became
"Province"/"Postal Code" in the admin app's Store Settings, New Store, and store-owner application
forms. The `state`/`postalCode` column names themselves were left unchanged (a rename would touch
every query and DTO for a label-only difference) — only their labels and defaults changed.

## 25. Testing the authentication flows

Everything below marked **verified** was actually exercised against this project's real Firebase
project and live Postgres database during this work — not mocked, not assumed. Test accounts and
data created for this were deleted afterward (Firebase accounts via `accounts:delete`, database rows
directly) so no test data was left behind.

**Verified, backend/API level** (curl against a local `npm run dev:backend` connected to the real
`DATABASE_URL`, using Firebase's `identitytoolkit.googleapis.com` REST API directly for the parts a
browser would normally do):
- Email/password sign-up (`accounts:signUp`) → `POST /api/auth/sync` → `users` row created with
  `role: 'customer'`.
- Sign-in with the correct password succeeds; sign-in with a wrong password is rejected
  (`INVALID_LOGIN_CREDENTIALS`, mapped client-side to `auth/invalid-credential`).
- `PATCH /api/auth/me` updates name/phone; attempting to also smuggle `{"role":"super_admin"}` in
  the same request left the role unchanged (`customer`) — confirmed the field is stripped by
  validation, not just conventionally ignored. This also surfaced a real bug — an empty/all-stripped
  request body crashed with a 500 (Drizzle's "no values to set") instead of a clean 400 — which was
  fixed on the spot (`.refine()` in `backend/src/validators/auth.validator.ts` now requires at least
  one field).
- Password reset requests (`accounts:sendOobCode`) return success for both a real and a fictitious
  email, confirming this project's Firebase email-enumeration protection is on and the frontend's
  generic confirmation copy is correct.
- Full application lifecycle: submit → 409 on a second simultaneous submission → `super_admin` lists
  it → approves it → a `stores` row and `store_admins` link are created → the applicant's `/api/auth/me`
  now shows `role: 'store_admin'` and the new store in `managedStoreIds` → the applicant can list
  their own store via `GET /api/admin/stores` → attempting to modify an unrelated store ID returns
  403 "You do not manage this store" → re-approving the same (now-approved) application returns 409.
- Full rejection lifecycle: submit → reject with a reason → applicant's role stays `customer` →
  every admin route still 403s for them.
- Suspend/reactivate: suspending a `store_admin` makes every subsequent authenticated request for
  them (including plain `GET /api/auth/me`) return 403 "This account has been suspended"; a
  `super_admin` attempting to suspend their own account gets 400; reactivating restores access with
  no other state changed.
- Cross-cutting authorization checks: no token → 401; a garbage/invalid token → 401; a `store_admin`
  attempting a `super_admin`-only route (approving someone else's application) → 403; a validation
  error (submitting an application missing required fields) → 400 with per-field messages.
- `tsc --noEmit` and `vite build` succeed for `backend`, `apps/customer`, and `apps/admin` with zero
  errors after all of the above changes.

**Not verified in a real browser** — this environment had no browser-automation tooling
(Playwright/`chromium-cli`) installed, and installing one wasn't practical here. Both dev servers
were confirmed to start and serve the new routes (`/sign-in`, `/sign-up`, `/forgot-password`,
`/become-a-store-owner`, `/login`) with a `200`, which rules out a build-breaking error, but the
following need a real browser before shipping:
- The actual Google OAuth popup end-to-end (it opens a real Google-hosted page).
- SMS delivery for phone sign-in (use Firebase's **Phone numbers for testing** feature, §10, to test
  the *code* without needing a real phone).
- Visual/responsive QA of the new pages across mobile/tablet/desktop, and a check of the browser
  console for warnings/errors during these flows — the existing landing-page redesign work earlier
  in this file (see the entry above) is a good template for how to do this pass with Playwright once
  it's available.
- The complete click-through UX: sign up → land on account page → apply to become a store owner →
  (as a separate super_admin browser session) approve it → sign back in on the admin app → see the
  new store on the dashboard.

### 2026-08-12 follow-up: account deletion, duplicate accounts, admin Google sign-in

Additional live verification for the follow-up fixes above (same method: curl + Firebase's REST API
against the real project and database, test data cleaned up afterward):

- **Duplicate email**: signing up twice with the same email via `accounts:signUp` — the second call
  is rejected by Firebase itself; confirmed no new `users` row or partial state results from the
  rejected attempt.
- **Account deletion, hard-delete path**: created a test account with no orders, called
  `DELETE /api/auth/me` → response `{"hardDeleted": true}` → the `users` row was gone → **replaying
  the same still-valid ID token against the backend afterward re-created a row** (the resurrection
  bug described above) → fixed by having the backend call `adminAuth.deleteUser(uid)` as part of the
  same request → re-tested: the Firebase account was confirmed genuinely deleted (a subsequent
  `signInWithPassword` with the correct password returned `INVALID_LOGIN_CREDENTIALS`), and replaying
  the old token against the backend now correctly re-creates a row again in this specific test
  *only because ID tokens are self-contained JWTs that Firebase's default `verifyIdToken` validates
  cryptographically without a network round-trip* — see the extensive comment on `deleteOwnAccount`
  in `backend/src/services/users.service.ts` for why this narrow, **self-only** residual window
  (an already-issued token can work until its own natural ~1 hour expiry, even post-deletion) was a
  deliberate scope decision and not something worth an extra Firebase round-trip on every request
  site-wide to close. It cannot be used to access anyone else's account.
- **Account deletion, anonymize path**: created a test account, then a temporary store/product/order
  referencing it (to exercise the real `orders.userId` `ON DELETE RESTRICT` constraint), then called
  `DELETE /api/auth/me` → response `{"hardDeleted": false}` → confirmed in the database that the
  `users` row survived with `email` replaced by a `deleted-user-{id}@storedash.invalid` placeholder,
  `name`/`phone`/`avatarUrl` cleared, and `suspended: true`, **while the order row was completely
  untouched** (`customerName`/`customerEmail` snapshot intact) — proving deletion never touches
  another table's data and order history genuinely survives. Temporary test store/product/order/user
  rows were all removed afterward.
- **Admin Google sign-in role-gating**: verified by code inspection rather than a live popup (no
  browser automation available, same limitation as above) — `isAuthorized` and every backend
  `requireRole`/`requireStoreAccess` check work exclusively off `users.role`/`suspended` loaded from
  the database, with no branch anywhere that inspects which Firebase provider produced the token.
  This was already exhaustively verified for email/password tokens in the 2026-08-11 pass (403 on
  every admin-only route for a `customer`-role account, §25 above); since the authorization code path
  is identical regardless of provider, the same guarantee holds for a Google-authenticated token
  without needing a provider-specific test. **Recommended before shipping**: one real
  Google-sign-in-as-a-plain-customer click-through to confirm the `NoAccessCard` renders, since this
  is the one piece of this round that genuinely can't be verified without a browser.
- `tsc --noEmit` and `vite build` re-confirmed clean for `backend`, `apps/customer`, and
  `apps/admin` after all of the above.

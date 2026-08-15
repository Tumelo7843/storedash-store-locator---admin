# StoreDash

StoreDash is a multi-store marketplace and store-locator platform for South African businesses. It provides a customer storefront, a store-management dashboard, and a mobile customer app backed by one API, database, and authentication system.

Customer site: https://storedash-store-locator-admin-custo.vercel.app/

## What it does

- Discover nearby stores on an interactive map or list.
- Browse store information, products, and services.
- Add items to a cart, place orders, and view order history.
- Create customer accounts and manage profile details.
- Let prospective store owners apply for access.
- Give store owners tools to manage their stores, products, services, orders, and settings.
- Give super administrators controls for store-owner applications, approvals, and access management.

## Applications

| App | Location | Purpose |
| --- | --- | --- |
| Customer website | `apps/customer` | Store discovery, shopping, orders, and customer accounts. |
| Admin website | `apps/admin` | Store operations, inventory, services, orders, and administrative workflows. |
| Mobile app | `apps/mobile` | Native customer experience for Android and iOS using Expo. |
| Backend API | `backend` | Authentication, authorization, business logic, uploads, and data access. |
| Shared package | `shared` | TypeScript types shared across applications. |

## Technology

- React, Vite, TypeScript, and Tailwind CSS for the web apps
- Expo and React Native for mobile
- Express and Zod for the API
- PostgreSQL and Drizzle ORM for data
- Firebase Authentication for identity
- Supabase Storage for images
- Leaflet and React Leaflet for store maps

## Roles and access

StoreDash uses server-enforced roles:

- `customer` — browses stores, places orders, and can apply to become a store owner.
- `store_admin` — manages only the stores assigned to them.
- `super_admin` — manages platform-wide approvals, store owners, and stores.

The backend verifies Firebase ID tokens and checks roles and store access for protected requests.

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- PostgreSQL database
- Firebase project with Email/Password and Google sign-in enabled
- Supabase project and Storage bucket for image uploads

## Getting started

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Create environment files using [`.env.example`](.env.example) as the reference:

   - `backend/.env`
   - `apps/customer/.env`
   - `apps/admin/.env`
   - `apps/mobile/.env` (for the mobile app)

3. Apply database migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the API and web applications in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:customer
   npm run dev:admin
   ```

The customer app runs on `http://localhost:5173`, the admin app on `http://localhost:5174`, and the API on `http://localhost:3001` by default.

## Mobile app

Run mobile commands from `apps/mobile`:

```bash
cd apps/mobile
npm run start
```

Use `npm run android`, `npm run ios`, or `npm run web` to launch a target.

## Environment configuration

All variables are documented in [`.env.example`](.env.example).

### Backend

The backend requires:

- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64` when running outside Google Cloud
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` for uploads

### Customer and admin apps

Both web apps require:

- `VITE_API_URL`
- Firebase Web SDK configuration: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`

The customer app also uses `VITE_ADMIN_URL`; the admin app uses `VITE_CUSTOMER_URL`.

Never commit environment files or expose backend credentials in a browser bundle.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev:backend` | Start the Express API. |
| `npm run dev:customer` | Start the customer web app. |
| `npm run dev:admin` | Start the admin web app. |
| `npm run build:customer` | Build the customer web app. |
| `npm run build:admin` | Build the admin web app. |
| `npm run typecheck` | Type-check all workspaces that provide the script. |
| `npm run db:generate` | Generate a Drizzle migration from schema changes. |
| `npm run db:migrate` | Apply database migrations. |

## Deployment

- Deploy `apps/customer` and `apps/admin` as separate Vercel projects.
- Deploy `backend` to Render using [`render.yaml`](render.yaml), or another Node-compatible host.
- Configure the deployed website origins in `ALLOWED_ORIGINS`.
- Add deployed web domains to Firebase Authentication's authorized domains.
- Configure the matching API URL and Firebase web settings for each frontend.

## Project structure

```text
apps/
  admin/       Store and platform administration dashboard
  customer/    Customer marketplace and store locator
  mobile/      Expo React Native customer app
backend/       Express API, Drizzle schema, migrations, and services
shared/        Shared TypeScript types
```

## License

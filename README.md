# StoreDash Store Locator & Admin

StoreDash is a full-stack store locator and admin management application for a retail network. It combines a public customer-facing store finder and product storefront with a private admin dashboard for operating locations, product inventory, and business metrics.

The application is built with a Vite + React frontend, an Express API server, Firebase Authentication, and a PostgreSQL/Cloud SQL data layer managed through Drizzle ORM.

## What This Project Includes

### Customer Experience

- Store finder interface for locating nearby or supported stores
- Store category, city, status, and search filtering
- Storefront product display with add-to-cart-like order flow
- Google Maps-style location links and customer order submission

### Admin Experience

- Dashboard with sales/operating KPI cards and chart data
- Stores management UI for creating, reading, updating, and viewing locations
- Products management UI for inventory search, status filtering, and CRUD operations
- Authenticated admin interface protected by Firebase ID token verification
- User sync flow between Firebase Auth and PostgreSQL users table

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Lucide icons
- Backend: Express server with API routes
- Data access: Drizzle ORM with PostgreSQL/Cloud SQL connection pool
- Identity: Firebase Auth and Firebase Admin SDK
- Database: PostgreSQL schema for users, stores, products, and orders

## Project Structure

- [server.ts](server.ts): Express server, API routes, Vite dev middleware, SPA hosting
- [src/App.tsx](src/App.tsx): Top-level app mode switching between customer and admin views
- [src/lib/api.ts](src/lib/api.ts): Client-side API wrapper for server endpoints
- [src/db/schema.ts](src/db/schema.ts): Database schema definition for stores, products, orders, and users
- [src/db/index.ts](src/db/index.ts): PostgreSQL/Drizzle connection initialization
- [src/middleware/auth.ts](src/middleware/auth.ts): Firebase-authenticated API protection middleware
- [src/components](src/components): Dashboard, Products, Stores, Storefront, Settings, Auth, and UI components

## Required Environment Variables

The app reads database configuration from environment variables:

- `SQL_HOST`
- `SQL_DB_NAME`
- `SQL_USER`
- `SQL_PASSWORD`
- `SQL_ADMIN_USER`
- `SQL_ADMIN_PASSWORD`

The Firebase configuration is expected to be available through the checked-in configuration file [firebase-applet-config.json](firebase-applet-config.json), which is consumed by the client and admin Firebase bootstrapping layers.

## Local Development

### Install Dependencies

```bash
npm install
```

### Run the App

```bash
npm run dev
```

The development server starts the Express API on port 3000 and serves the Vite React client in development mode.

## Production Build

```bash
npm run build
npm start
```

The production build bundles the server and frontend assets into the dist folder.

## API Overview

The server exposes these main API groups:

- `GET /api/health`: health check
- `POST /api/auth/sync`: sync authenticated Firebase user profile to PostgreSQL
- `GET /api/dashboard/metrics`: dashboard KPI metrics
- `GET /api/stores` and `GET /api/stores/:id`: list or fetch store details
- `POST /api/stores` and `PUT /api/stores/:id`: create or update stores
- `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`: product inventory operations
- `POST /api/orders`: customer order submission

## Database Schema

The data model currently covers:

- `users`: Firebase-authenticated admin/user profiles
- `stores`: physical store locations and retail metadata
- `products`: inventory for each store
- `orders`: store order records and totals

## Notes

This project is organized as a multi-page administrative retail management system with a connected public storefront experience. It is not a static marketing page; it relies on runtime API behavior and persistent PostgreSQL records.

If the frontend is not authenticated via Firebase, the admin portal can still render, but protected API endpoints such as user sync and write operations require a valid Firebase bearer token.

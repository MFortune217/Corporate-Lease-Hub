# CorpLease - Corporate Housing & Vendor Services Platform

## Overview

CorpLease is a full-stack web application for corporate housing, property management, and vendor services. It serves multiple user roles — customers (corporate tenants), property owners, vendors (maintenance/services), and administrators. The platform manages properties, corporate leases, vendor job requests, document management, and cryptocurrency payment options.

The app follows a monorepo structure with a React frontend, Express backend, PostgreSQL database with Drizzle ORM, and shared schema definitions between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend API server
- `shared/` — Shared TypeScript types and Drizzle schema (used by both client and server)
- `migrations/` — Drizzle-generated database migrations
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with routes for Home, Customers, Owners, Vendors, and Admin pages
- **State Management**: TanStack React Query for server state (API data fetching, caching, mutations)
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Styling**: Tailwind CSS with CSS variables for theming (deep navy corporate color scheme), custom fonts (Inter + Space Grotesk)
- **Animations**: Framer Motion for hero section transitions
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (tsx for dev, esbuild for production)
- **API Pattern**: RESTful JSON API under `/api/` prefix with standard CRUD operations
- **Resources**: Properties, Corporate Leases, Vendors, Documents, Cryptocurrencies, Job Requests, Users, Notifications
- **Real-time**: Server-Sent Events (SSE) for push notifications at `/api/notifications/stream`
- **Validation**: Zod schemas generated from Drizzle table definitions via `drizzle-zod`
- **Storage Layer**: `IStorage` interface with `DatabaseStorage` implementation, providing a clean abstraction over database operations
- **Dev Server**: Vite dev server integrated as middleware in development; static file serving in production
- **Build**: Client built with Vite, server bundled with esbuild into `dist/` directory

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema Location**: `shared/schema.ts` — single source of truth for both database tables and TypeScript types
- **Tables**:
  - `users` — authentication (username, password, role)
  - `properties` — housing listings (title, type, price, address, beds, baths, sqft, status)
  - `corporate_leases` — lease agreements linking employees to properties
  - `vendors` — service provider records
  - `documents` — document tracking with status
  - `crypto_currencies` — cryptocurrency payment configuration (toggleable)
  - `job_requests` — maintenance/service job tracking for vendors
  - `notifications` — real-time payment status notifications (type, title, message, portal, method, amount, read status)
- **Schema Push**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### API Endpoints
All endpoints are prefixed with `/api/`:
- `GET/POST /properties`, `GET/PATCH/DELETE /properties/:id`
- `GET/POST /leases`, `GET/PATCH /leases/:id`
- `GET/POST /vendors`, `GET/PATCH /vendors/:id`
- `GET/POST /documents`, `PATCH /documents/:id`
- `GET /crypto`, `POST /crypto`, `PATCH /crypto/:id/toggle`
- `GET/POST /jobs`, `GET /jobs/vendor/:vendorId`, `PATCH /jobs/:id`
- `GET /notifications/stream` — SSE endpoint for real-time push notifications
- `GET/POST /notifications`, `GET /notifications/unread`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`
- `POST /seed` — Seeds initial data (properties, leases, vendors, docs, crypto, jobs, notifications)

## Recent Changes
- 2026-02-14: Added portal auth pages (login/register with company fields) at /customers, /owners, /vendors; dashboards moved to /*/dashboard paths; bcrypt password hashing
- 2026-02-14: Added real-time notification system with SSE, notifications table, NotificationCenter component in Navbar, and payment event broadcasting
- 2026-02-14: Integrated Stripe payments via Replit connector (ACH, credit/debit cards) for Owner and Customer portals
- 2026-02-14: Added Stripe backend infrastructure (stripeClient.ts, webhookHandlers.ts, payment intent/payout routes)
- 2026-02-14: Updated Owner Portal with vendor payment dialog (card/ACH via Stripe Elements) and payment method settings (traditional + crypto tabs)
- 2026-02-14: Updated Customer Portal with Stripe checkout for ACH and card alongside crypto payments
- 2026-02-14: Added server-side payment amount validation for corporate lease payments
- 2026-02-13: Converted from prototype to full-stack app with PostgreSQL database
- 2026-02-13: Implemented all database tables, storage layer (DatabaseStorage), and API routes
- 2026-02-13: Connected all 4 frontend portals (Customers, Owners, Vendors, Admin) to real API endpoints using TanStack React Query
- 2026-02-13: Added seed endpoint and seeded initial data for all tables
- 2026-02-13: Database connection via server/db.ts using pg Pool + drizzle-orm

### Key Scripts
- `npm run dev` — Start development server (tsx with Vite middleware)
- `npm run build` — Build client (Vite) and server (esbuild) for production
- `npm start` — Run production build
- `npm run db:push` — Push Drizzle schema to PostgreSQL

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple** — PostgreSQL session store (available but sessions not fully wired)

### Frontend Libraries
- **@tanstack/react-query** — Server state management
- **Radix UI** — Accessible UI primitives (dialog, tabs, select, switch, etc.)
- **shadcn/ui** — Pre-built component library on top of Radix
- **Framer Motion** — Animation library
- **wouter** — Client-side routing
- **recharts** — Charting library (chart component available)
- **embla-carousel-react** — Carousel component
- **react-day-picker** — Calendar/date picker
- **react-hook-form** + **@hookform/resolvers** — Form handling with Zod validation

### Backend Libraries
- **express** v5 — HTTP server framework
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **drizzle-zod** — Auto-generate Zod validation schemas from Drizzle tables
- **pg** — PostgreSQL client for Node.js
- **zod** — Schema validation

### Build Tools
- **Vite** — Frontend bundler and dev server
- **esbuild** — Server bundler for production
- **tsx** — TypeScript execution for development
- **@tailwindcss/vite** — Tailwind CSS Vite plugin
- **@replit/vite-plugin-runtime-error-modal** — Dev error overlay

### Fonts (External CDN)
- Google Fonts: Inter and Space Grotesk
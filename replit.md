# CorpLease - Corporate Housing & Vendor Services Platform

## Overview

CorpLease is a full-stack multi-tenant web application for corporate housing, property management, and vendor services. It serves multiple user roles — customers (corporate tenants), property owners, vendors (maintenance/services), and administrators. The platform manages properties, corporate leases, vendor job requests, document management, and cryptocurrency payment options with both traditional (Stripe) and Web3 payment support.

The app follows a monorepo structure with a React frontend, Express backend, PostgreSQL database with Drizzle ORM, and shared schema definitions between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenant Architecture
- **Companies table**: Each registered company is a tenant with its own isolated data
- **User-Company binding**: Every user belongs to exactly one company (companyId FK)
- **Role system**: Dual-role model:
  - `role` — portal type: customer, owner, vendor, admin
  - `companyRole` — permission within company: admin, member
- **Data isolation**: All data tables (properties, leases, vendors, documents, jobs, notifications) include `companyId` for tenant scoping
- **JWT authentication**: Stateless auth via Bearer tokens containing userId, companyId, role, companyRole
- **Auth middleware**: `requireAuth` validates JWT and attaches user context to every protected request
- **Role middleware**: `requireRole` and `requireCompanyRole` for fine-grained access control
- **Stripe customer mapping**: Each company gets a Stripe customer ID on registration for per-tenant payment tracking

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend API server
  - `server/auth.ts` — JWT token signing/verification, auth middleware
  - `server/notifications.ts` — SSE broadcast system
  - `server/stripeClient.ts` — Stripe SDK initialization from env vars
  - `server/webhookHandlers.ts` — Stripe webhook event processing with tenant resolution
- `shared/` — Shared TypeScript types and Drizzle schema (used by both client and server)
- `migrations/` — Drizzle-generated database migrations
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with routes for Home, Customers, Owners, Vendors, and Admin pages
- **State Management**: TanStack React Query for server state (API data fetching, caching, mutations)
- **Auth**: JWT token stored in localStorage, sent via Authorization header on all API calls
- **Auth Context**: `client/src/lib/authContext.tsx` — provides `useAuth()` hook, `authFetch()` helper, `getAuthHeaders()` for authenticated requests
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Styling**: Tailwind CSS with CSS variables for theming (deep navy corporate color scheme), custom fonts (Inter + Space Grotesk)
- **Animations**: Framer Motion for hero section transitions
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (tsx for dev, esbuild for production)
- **API Pattern**: RESTful JSON API under `/api/` prefix with JWT auth middleware
- **Auth**: JWT-based authentication with `requireAuth` middleware on all protected routes
- **Resources**: Companies, Properties, Corporate Leases, Vendors, Documents, Cryptocurrencies, Job Requests, Users, Notifications
- **Real-time**: Server-Sent Events (SSE) for push notifications at `/api/notifications/stream`
- **Validation**: Zod schemas generated from Drizzle table definitions via `drizzle-zod`
- **Storage Layer**: `IStorage` interface with `DatabaseStorage` implementation, all data methods accept optional `companyId` for tenant scoping
- **Dev Server**: Vite dev server integrated as middleware in development; static file serving in production
- **Build**: Client built with Vite, server bundled with esbuild into `dist/` directory

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema Location**: `shared/schema.ts` — single source of truth for both database tables and TypeScript types
- **Tables**:
  - `companies` — tenant entities (name, email, phone, stripeCustomerId, stripeSubscriptionId)
  - `users` — authentication (username, password, role, companyId, companyRole, email)
  - `properties` — housing listings (title, type, price, address, beds, baths, sqft, status, companyId)
  - `corporate_leases` — lease agreements linking employees to properties (companyId)
  - `vendors` — service provider records (companyId)
  - `documents` — document tracking with status (companyId)
  - `crypto_currencies` — cryptocurrency payment configuration (toggleable, admin-only control)
  - `job_requests` — maintenance/service job tracking for vendors (companyId)
  - `notifications` — real-time payment status notifications (companyId for tenant isolation)
  - `contact_requests` — contact form submissions (name, email, subject, message, status, adminResponse)
  - `page_contents` — admin-editable page content (slug, title, content, updatedAt)
- **Schema Push**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### API Endpoints
All endpoints are prefixed with `/api/`:

**Public (no auth required):**
- `POST /auth/register` — Register company + user, returns JWT token
- `POST /auth/login` — Login, returns JWT token
- `POST /auth/request-reset` — Request password reset code
- `POST /auth/reset-password` — Reset password with code
- `GET /stripe/publishable-key` — Get Stripe publishable key
- `POST /seed` — Seed demo data

**Protected (require JWT):**
- `GET /auth/me` — Get current user + company info
- `GET/POST /properties`, `GET/PATCH/DELETE /properties/:id` — tenant-scoped
- `GET/POST /leases`, `GET/PATCH /leases/:id` — tenant-scoped
- `GET/POST /vendors`, `GET/PATCH /vendors/:id` — tenant-scoped
- `GET/POST /documents`, `PATCH /documents/:id` — tenant-scoped
- `GET /crypto` — read available cryptos (all users)
- `POST /crypto`, `PATCH /crypto/:id/toggle` — admin-only
- `GET/POST /jobs`, `GET /jobs/vendor/:vendorId`, `PATCH /jobs/:id` — tenant-scoped
- `GET /notifications/stream` — SSE endpoint for real-time push notifications
- `GET/POST /notifications`, `GET /notifications/unread`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` — tenant-scoped
- `POST /stripe/create-payment-intent` — Create Stripe payment (maps to company's Stripe customer)
- `POST /stripe/create-payout` — Create vendor payout

**Public (no auth):**
- `POST /contact` — Submit a contact form request
- `GET /pages/:slug` — Get page content by slug
- `GET /pages` — Get all page contents
- `POST /seed-pages` — Seed default page content

**Admin-only (require JWT + admin role):**
- `GET /contact` — List all contact requests
- `PATCH /contact/:id` — Respond to a contact request
- `PUT /pages/:slug` — Create or update page content

### Frontend Pages
- `/` — Home (hero, featured listings, portal overview)
- `/customers` — Corporate Clients portal auth (login/register)
- `/owners` — Property Owners portal auth
- `/vendors` — Vendors portal auth
- `/customers/dashboard`, `/owners/dashboard`, `/vendors/dashboard` — Portal dashboards
- `/admin` — Super Admin (Overview, Finance, Approvals, Contacts, Pages tabs)
- `/contact` — Contact form (public)
- `/search` — Search properties with filters
- `/about`, `/careers`, `/press` — Company info pages (admin-editable)
- `/privacy-policy`, `/terms-of-service`, `/cookie-policy` — Legal pages (admin-editable)

## Recent Changes
- 2026-03-13: Renamed "For Customers" to "Corporate Clients" across Navbar and Footer
- 2026-03-13: Removed Connect Wallet and Login buttons from Homepage/Navbar
- 2026-03-13: Added payment request feature for Super Admin in Admin Portal Finance tab
- 2026-03-13: Created all footer link pages (About, Careers, Press, Contact, Search Properties, Privacy Policy, Terms of Service, Cookie Policy)
- 2026-03-13: Added Super Admin page editing (Pages tab) and contact response management (Contacts tab)
- 2026-03-13: Added contact_requests and page_contents database tables with full CRUD
- 2026-02-23: Implemented full multi-tenant architecture with companies table, JWT auth, tenant-scoped data isolation, and Stripe customer mapping per tenant
- 2026-02-22: Rewrote Stripe integration for Render deployment — standard env vars (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)
- 2026-02-14: Added portal auth pages (login/register with company fields) at /customers, /owners, /vendors; dashboards moved to /*/dashboard paths; bcrypt password hashing
- 2026-02-14: Added real-time notification system with SSE, notifications table, NotificationCenter component in Navbar
- 2026-02-14: Integrated Stripe payments (ACH, credit/debit cards) for Owner and Customer portals
- 2026-02-14: Added Stripe backend infrastructure (stripeClient.ts, webhookHandlers.ts, payment intent/payout routes)
- 2026-02-13: Converted from prototype to full-stack app with PostgreSQL database
- 2026-02-13: Implemented all database tables, storage layer (DatabaseStorage), and API routes

### Key Scripts
- `npm run dev` — Start development server (tsx with Vite middleware)
- `npm run build` — Build client (Vite) and server (esbuild) for production
- `npm start` — Run production build
- `npm run db:push` — Push Drizzle schema to PostgreSQL

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable

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

### Auth
- **jsonwebtoken** — JWT token signing and verification
- **bcryptjs** — Password hashing

### Stripe Integration
- **stripe** — Stripe Node.js SDK for payment processing
- **@stripe/react-stripe-js** + **@stripe/stripe-js** — Frontend Stripe Elements integration
- Required environment variables for deployment:
  - `STRIPE_SECRET_KEY` — Stripe secret API key
  - `STRIPE_PUBLISHABLE_KEY` — Stripe publishable API key
  - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (for verifying webhook events)
- Webhook endpoint: `POST /api/stripe/webhook` (must be registered in Stripe Dashboard)

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

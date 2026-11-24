# Embroidery Thread Inventory & Business Management System

A multi-warehouse inventory and business management system for an embroidery
thread business: product/thread inventory, warehouse transfers, sales (admin
and salesperson roles), customers, suppliers, purchases, returns, expenses,
reporting, and audit logging.

See `docs/proposal-v1.0.txt` for the client proposal (placeholder — replace
with the real proposal).

## Stack

- **Backend**: Spring Boot 4 (Java 21), Maven, Spring Security (JWT),
  Spring Data JPA, PostgreSQL, Flyway, MapStruct, springdoc-openapi,
  Actuator, Testcontainers.
- **Frontend**: Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui,
  React Router, TanStack Query, Axios, React Hook Form, Zod, Recharts.
- **Database**: PostgreSQL 16 via Docker Compose (+ optional pgAdmin).

## Project status

**Phase 7 (reports, employee monitoring, activity log, notifications)
in progress.** Implemented so far:

- JWT auth (login/refresh/logout with revocable, hashed refresh tokens),
  role-based authorization (`ADMIN` / `SALESPERSON`) enforced on every
  protected endpoint via `@PreAuthorize`, never on the frontend alone, plus
  server-side location scoping (`LocationAccessGuard`) so a salesperson's
  requests always resolve to their own assigned location.
- `User` and `Location` modules (CRUD + employee-to-location assignment
  with history).
- Product catalog: brands, categories, products, and color/shade variants
  (the actual sellable, stockable SKUs — each with its own unique SKU).
- Inventory ledger: per-location stock balances (`inventory_balances`) are
  a transactionally-maintained projection of an immutable movement history
  (`stock_movements`); every mutation goes through the single
  `InventoryService.applyMovement` choke point, which row-locks the
  balance, rejects anything that would go negative, and recalculates
  weighted-average cost on real receipts. An admin-approved stock
  adjustment workflow is the first caller of this ledger; purchases,
  transfers, sales, and returns will reuse the same entry point in later
  phases.
- Stock transfers: create (draft) → dispatch (deducts source stock,
  snapshots the source's average cost onto each line) → receive (supports
  multiple partial receipts) → close (locks in any shortfall as a
  discrepancy, auto-noted when the receiver doesn't supply one). Every
  step reuses `InventoryService.applyMovement`, so the same negative-stock
  guard and atomic-rollback guarantees apply here as they do to
  adjustments. Receiving and closing are location-scoped: a salesperson
  can only act on transfers addressed to their own shop.
- Point-of-sale checkout: a single all-or-nothing transaction that
  resolves prices server-side from the catalog (never trusts a
  client-supplied price), validates and deducts stock through
  `InventoryService.applyMovement`, requires payments to sum exactly to
  the total (no credit sales), and snapshots each line's cost for
  margin/COGS reporting later. Admin-only sale reversal restores stock.
  No tax and no barcode scanning, per the locked-in Phase 1 decisions.
- Purchasing: suppliers, and purchases that go create (draft) → receive,
  feeding the same inventory ledger and recalculating weighted-average
  cost exactly like a transfer receipt does.
- Customers: a minimal module retrofitted onto `sales` (optional
  `customer_id`), selectable at POS checkout.
- Returns: a salesperson requests a return against one of their own
  completed sales; an admin approves or rejects it. Approving a
  `SELLABLE` item restocks it through the ledger; a `DAMAGED` item is
  never restocked — the approved `return_items` row is itself the
  permanent record, since no inventory balance changes. A second
  cumulative check at approval time stops a sale item from ever being
  returned for more than it actually sold, across multiple return
  requests.
- Expenses: simple admin-only recording, optionally tied to a location.
- Daily closing: expected quantity is derived directly from the ledger
  (opening balance — itself the sum of all movements before the period —
  plus the period's own movements), never from a separately maintained
  running total, so it can never drift out of sync with reality.
  Consecutive closings tile the ledger with no gaps or overlaps. A
  salesperson submits physical counts against the computed expectation;
  discrepancies are recorded automatically, and an admin marks the
  closing reviewed. Correcting a discrepancy is a deliberate, separate
  action through the existing stock-adjustment workflow, not an
  automatic side effect of reviewing.
- Insert-only audit log (`audit_logs`) recording auth, user-management,
  product, stock-adjustment, transfer, sale, purchase, return, expense,
  and closing events.
- Employee monitoring (PRD §15.1–15.3): a salesperson list with live
  stats, an individual profile with tabs (overview, inventory
  accountability, sales history, performance, stock movements, activity),
  and a cross-employee performance comparison — all computed from the
  same ledger/sales/returns data other modules already write, not a
  separate tracked total that could drift.
- Activity Log UI (PRD §15.4–15.5): browse, search, and filter the audit
  trail that's been recording since Phase 2, with CSV and genuine Excel
  (Apache POI) export.
- Notifications: broadcast-to-admins or targeted-at-one-user, triggered
  from existing events (a return or stock-adjustment request, a transfer
  or daily closing closing with a discrepancy) — not a new approval
  workflow, just visibility into ones that already exist. A bell with an
  unread count lives in both shells.
- Reports: a sales summary (revenue, transactions, best sellers, revenue
  by payment method) and per-location inventory exports, both with
  CSV/Excel download.
- Admin shell (now with Monitoring, Activity Logs, Notifications, and
  Reports pages, all real, alongside everything from earlier phases) and
  the mobile-first salesperson/POS shell, both wired to real backend
  data — no mock data anywhere.

Not yet implemented: PDF export (CSV and Excel are done; PDF was
deliberately deferred rather than rushed — see note below), and
Phase 8's hardening pass (expanded automated test coverage, a security
review, and deployment documentation).

**Scope note:** PDF generation (OpenPDF, per the original tech stack)
was not built this phase. CSV and Excel cover the same reports with
less unbounded formatting work, and building a half-finished PDF
renderer felt worse than being upfront that it's still open — it's a
reasonable Phase 8 addition if still wanted.

### Seeded dev accounts (local only — see `V3__seed_core_data.sql`)

| Username | Password    | Role        | Location    |
|----------|-------------|-------------|-------------|
| admin    | Admin@123   | ADMIN       | —           |
| sales1   | Sales@123   | SALESPERSON | Sales Shop  |

## Getting started

### Prerequisites

- Java 21
- Maven (or use the included `backend/mvnw` wrapper)
- Node.js 20+ and npm
- Docker + Docker Compose

### 1. Configure environment variables

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `.env` if you want non-default DB credentials.

### 2. Start the database

```bash
make db-up
```

This starts PostgreSQL 16 on the host port set by `POSTGRES_PORT` in
`.env` (5436 by default) and, with `docker compose --profile tools up -d`,
pgAdmin on http://localhost:5050 (login with the credentials in `.env`).

### 3. Run the backend

```bash
make backend
```

This runs the Spring Boot app with the `dev` profile. Flyway runs
migrations automatically on startup (`ddl-auto` is `validate` — Flyway is
the only thing allowed to change the schema).

- Health check: http://localhost:8080/actuator/health
- Swagger UI: http://localhost:8080/swagger-ui.html

### 4. Run the frontend

```bash
make frontend
```

Opens at http://localhost:5173.

### 5. Stop the database

```bash
make db-down
```

### Running backend tests

```bash
cd backend && ./mvnw test
```

Integration tests use Testcontainers, which requires Docker to be running.

## Repository layout

```
backend/   Spring Boot API (com.michias.threadims)
frontend/  Vite + React + TypeScript SPA
docs/      Proposal and project documentation
```

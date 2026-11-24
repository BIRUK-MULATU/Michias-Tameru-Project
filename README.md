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

**Phase 2 (foundation) in progress.** Implemented so far:

- JWT auth (login/refresh/logout with revocable, hashed refresh tokens),
  role-based authorization (`ADMIN` / `SALESPERSON`) enforced on every
  protected endpoint via `@PreAuthorize`, never on the frontend alone.
- `User` and `Location` modules (CRUD + employee-to-location assignment
  with history).
- Insert-only audit log (`audit_logs`) recording login/logout/failed-login
  and user management actions.
- Admin shell (collapsible sidebar) and a mobile-first salesperson/POS
  shell, both wired to real backend data — no mock data anywhere.

Not yet implemented: products/catalog, inventory ledger, transfers,
sales/POS, purchases, returns, expenses, daily closing, reports, employee
monitoring dashboards, and notifications. These land in Phases 3–7 per
the project's development roadmap.

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

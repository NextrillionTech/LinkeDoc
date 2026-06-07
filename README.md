# LinkeDoc - Medical Professionals Networking & Job Platform

LinkeDoc is a professional networking and career development platform tailored specifically for medical professionals (doctors, nurses, pharmacists, researchers, etc.) and recruiters.

This repository is set up as a decoupled monorepo containing:
1.  **Backend API Server** (`backend/`): Node.js / Express with TypeScript, Prisma ORM, and PostgreSQL.
2.  **Frontend Client** (`frontend/`): React + Vite with TypeScript and HSL Hires Vanilla CSS layout variables.

---

## Technical Architecture

-   **Backend**: Decoupled REST API with JWT-based authentication.
-   **Security Gates**:
    -   Professional registrations initialized in `PENDING` validation queue. Forbidden from peer-connection or discussion board requests until approved.
    -   Strict clinical privacy: patient PII reported posts are hidden instantly from standard category feeds.
-   **Frontend**: High-contrast light/dark layout system built with raw CSS tokens.
-   **Storage**: Neon/PostgreSQL transactional data, discussion categories, connection graphs, and job search indices.

---

## Directory Structure

```text
LinkeDoc/
├── backend/             # Node.js Express API Server
│   ├── src/             # Route controllers, middlewares, models
│   ├── prisma/          # PostgreSQL migrations and seed scripts
│   └── tests/           # Integration (Supertest) and unit (Jest) tests
├── frontend/            # React + Vite Client
│   ├── src/             # Components, Pages, APIs, and App.css
│   └── tests/           # UI rendering tests (Vitest + React Testing Library)
├── specs/               # Specifications and planning documentation
├── package.json         # Workspace configurations and scripts
└── vercel.json          # Deployment configuration
```

---

## Getting Started

Refer to the detailed installation, seed execution, and validation guide:
👉 **[specs/001-core-platform-setup/quickstart.md](file:///Users/shubhamtaneja/LinkeDoc/specs/001-core-platform-setup/quickstart.md)**

### Quick Commands

#### 1. Setup Dependencies
```bash
npm install
```

#### 2. Run Database Migrations
```bash
npm run prisma:migrate --prefix backend
```

#### 3. Run Development Servers
```bash
# Starts both frontend and backend concurrently
npm run dev --prefix backend
npm run dev --prefix frontend
```

#### 4. Run Verification Tests (Monorepo Root)
```bash
npm test
```

---

## Testing & Quality Assurance

LinkeDoc enforces strict TDD (Test-Driven Development) policies:
-   Unified command: Running `npm test` at the root executes all Jest backend suites and Vitest frontend rendering checks.
-   Husky is configured to ensure no failing tests or unformatted code gets pushed to the main feature branches.

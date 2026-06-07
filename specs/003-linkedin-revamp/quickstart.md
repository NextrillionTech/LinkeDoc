# Quickstart: LinkedIn UI Revamp and Medical Feed

This guide outlines the commands and steps to run, migrate, and test the revamped LinkedIn features.

## 1. Database Migration
To apply the schema changes and recreate the database schema locally and on the serverless Neon Postgres instance:
```bash
# Generate Prisma Client locally
npm run prisma:generate --prefix backend

# Apply DB migrations (in development environment)
# NOTE: Make sure the connection string in .env is configured correctly
npm run prisma:migrate --prefix backend
```

## 2. Running Local Servers
Start the full stack:
```bash
# Run both frontend and backend concurrently in dev mode
# (Or run backend and frontend separately)
npm run dev --prefix backend
npm run dev --prefix frontend
```

## 3. Running Automated Tests
Run integration and unit tests:
```bash
# Run all tests (Jest + Vitest)
npm run test
```
To run backend integration tests specifically:
```bash
npm run test:backend
```

## 4. Manual Verification Steps
1. Sign up as a Doctor or Researcher (these will be PENDING approval).
2. Sign up as a System Administrator (automatically APPROVED).
3. Log in as System Administrator, go to the **Admin Panel**, and approve the Doctor/Researcher account.
4. Log in as the approved Doctor/Researcher.
5. On the homepage `/`, verify that the LinkedIn-style 3-column feed renders.
6. Create a standard update, then create a research paper post. Verify both render correctly.
7. Click "Like" and write comments to verify engagement.

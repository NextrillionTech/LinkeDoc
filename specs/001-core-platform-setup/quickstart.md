# Quickstart: Core Platform Setup

This guide provides instructions to run, verify, and test the initial LinkeDoc core platform.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL instance running

## 1. Environment Setup

Clone the repository and install dependencies in both the backend and frontend folders:

```bash
# Clone the repository
git clone <repository_url>
cd LinkeDoc

# Install backend dependencies
cd backend
npm install

# Setup environment variables (.env)
cp .env.example .env
# Edit .env to set your DATABASE_URL (PostgreSQL) and JWT_SECRET

# Run database migrations
npx prisma migrate dev --name init

# Seed initial forum categories (e.g. Cardiology, Pediatrics)
npm run seed

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Running the Servers

Start the backend API server and frontend client dev servers:

```bash
# Start backend server (from backend directory)
# Server runs at http://localhost:5000
npm run dev

# Start frontend dev server (from frontend directory in a separate terminal)
# Client runs at http://localhost:5173
npm run dev
```

## 3. Verification & Smoke Testing (cURL)

Verify key endpoints are working:

### A. Register a user (Pending verification)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Smith",
    "email": "sarah.smith@hospital.org",
    "password": "securepassword123",
    "role": "DOCTOR",
    "specialty": "Cardiology",
    "licenseNumber": "LIC-987654-NY"
  }'
```

### B. Approve User (Admin action)
Admin verifies user manually to update status to `APPROVED`.
```bash
# Mocking admin approval via DB or verification endpoint
curl -X PUT http://localhost:5000/api/admin/users/e581290e-fcb2-4d04-a6c3-18cb5a85ccf9/verify \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### C. Login to get token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.smith@hospital.org",
    "password": "securepassword123"
  }'
```

### D. List forum categories
```bash
curl http://localhost:5000/api/forums/categories
```

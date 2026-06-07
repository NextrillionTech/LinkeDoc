# Implementation Plan: E2EE Direct Messaging

**Branch**: `002-realtime-messaging` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-realtime-messaging/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

We will build an end-to-end encrypted direct messaging channel for clinical consultations.
1.  **Backend API Server**: Node.js/Express with Prisma PostgreSQL. Exposes public key registry updates, conversation listing, thread creation, and message storage. Integrates Pusher Node SDK to broadcast raw encrypted message payloads.
2.  **Frontend Client**: React + Vite using Web Crypto API. Generates and stores ECDH key pairs locally in IndexedDB, publishes the public key, derives shared secrets, encrypts message bodies using AES-GCM (256-bit), and subscribes to Pusher Channels to render received messages in real time.

## Technical Context

**Language/Version**: Node.js v18+, TypeScript v5.0+

**Primary Dependencies**: Express, Prisma Client, Zod, JWT, Pusher (Node SDK), Pusher JS (Client SDK), Web Crypto API (Native browser)

**Storage**: PostgreSQL

**Testing**: Jest + Supertest (Backend), Vitest + React Testing Library (Frontend)

**Target Platform**: Web Browsers (Mobile and Desktop responsive)

**Project Type**: web-service + frontend application

**Performance Goals**: Message encryption/decryption overhead < 100ms. Real-time message delivery latency < 1 second.

**Constraints**: Messages are encrypted client-side; no database record contains unencrypted body text. Only `APPROVED` status accounts can access messaging endpoints or publish key exchange pairs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Peer-to-Peer Privacy & HIPAA Compliance**: Message bodies are encrypted client-side using derived shared keys. The server only receives and persists ciphertext blobs. System administrators cannot read message content, satisfying clinical privacy rules. (Status: **PASSED**)
- **Principle II: API-First Modular Design**: Messaging and key exchange endpoints are decoupled from frontend views and defined under explicit REST route paths. (Status: **PASSED**)
- **Principle III: Test-Driven Development (TDD)**: Mock tests for public key registration, conversation creation, and message sending will be implemented and verified failing before core features are coded. (Status: **PASSED**)
- **Principle IV: Accessibility & Responsive UX**: The chat UI fits light/dark mode and is built with fluid CSS glassmorphic tokens. (Status: **PASSED**)
- **Principle V: Type-Safe API Contracts**: Message payloads and key parameters are mapped to Zod schemas and type-validated on server/client borders. (Status: **PASSED**)

## Project Structure

### Documentation (this feature)

```text
specs/002-realtime-messaging/
├── plan.md              # This file
├── research.md          # Cryptographic design & sync choice
├── data-model.md        # DB schema additions
├── quickstart.md        # Verification details & commands
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/     # messagingController.ts
│   ├── routes/          # messagingRoutes.ts
│   └── middleware/      # validation schemas (publicKey, message content)
└── tests/
    └── integration/     # messaging.test.ts (key exchange, conversation routing tests)

frontend/
├── src/
│   ├── pages/           # Messaging.tsx (chat directory and dialog views)
│   ├── services/        # api.ts (extend with conversations, message triggers)
│   └── utils/           # crypto.ts (keypair generation, derivation, AES encryption wrappers)
└── tests/
    └── components/      # messaging.test.tsx (UI chat rendering and input mock tests)
```

**Structure Decision**: Decoupled Web Application Structure is utilized. Frontend manages client cryptographic routines, while backend manages state persistence and real-time subscription broadcasting.

## Complexity Tracking

*No constitutional violations or complex architectural overrides identified.*

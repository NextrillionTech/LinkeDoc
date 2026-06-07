# Implementation Plan: LinkedIn UI Revamp and Medical Feed

**Branch**: `main` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-linkedin-revamp/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

We will transform the LinkeDoc web application frontend to align with LinkedIn's clean, multi-column visual layout while retaining all existing medical-specific capabilities. We will also implement a centralized home page feed (`/`), support for posting text updates and medical research papers, and social engagement actions (likes and comments) stored in Postgres database models.

## Technical Context

**Language/Version**: Node.js v18+, TypeScript v5.0+

**Primary Dependencies**: Express, Prisma Client, React 18, React Router v6, Vitest, Jest, Pusher (for potential feed live-reload, optional)

**Storage**: PostgreSQL (Neon Database)

**Testing**: Jest + Supertest (Backend), Vitest + React Testing Library (Frontend)

**Target Platform**: Modern Web Browsers (Mobile and Desktop responsive layout)

**Project Type**: web-service + frontend application

**Performance Goals**: Homepage feed loads in under 1 second. Social actions (likes, comment post) update the UI state in under 300ms.

**Constraints**: Users with `PENDING` validation status are blocked from creating posts, writing comments, or liking. Only `DOCTOR` and `RESEARCHER` roles can attach research papers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Peer-to-Peer Privacy & HIPAA Compliance**: Posts and comments are intended for general professional updates and research paper abstracts. System guidelines and placeholder text will instruct users to avoid sharing any protected health information (PHI) or patient identifiers, keeping discussion strictly professional. (Status: **PASSED**)
- **Principle II: API-First Modular Design**: New Feed router and controllers will be defined under `/api/feed` as a separate, self-contained router module. (Status: **PASSED**)
- **Principle III: Test-Driven Development (TDD)**: Backend integration tests for post creation, likes toggles, and commenting validation, as well as frontend feed rendering tests, will be formulated before code implementation. (Status: **PASSED**)
- **Principle IV: Accessibility & Responsive UX**: Column configurations on Feed, Network, Jobs, Forums, Messaging, and Profile will be built using CSS flexbox and grids to collapse nicely on tablet/mobile views. Micro-interactions for likes, edits, and comments will use existing smooth transitions. (Status: **PASSED**)
- **Principle V: Type-Safe API Contracts**: Feed requests, post items, and comment payloads are defined as Zod validation schemas in the middleware and strictly typed in the frontend services. (Status: **PASSED**)

## Project Structure

### Documentation (this feature)

```text
specs/003-linkedin-revamp/
├── plan.md              # This file
├── research.md          # Layout, routing, database research
├── data-model.md        # DB schemas and routes specifications
└── quickstart.md        # Test execution & migration instructions
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/     # feedController.ts
│   ├── routes/          # feedRoutes.ts
│   ├── config/          # server.ts (mount feedRoutes)
│   └── middleware/      # validation schemas (post content)
└── prisma/              # schema.prisma (add Post, PostLike, PostComment)

frontend/
├── src/
│   ├── pages/           # Feed.tsx (new Home feed page)
│   │                    # Network.tsx, JobBoard.tsx, Forums.tsx, Messaging.tsx, ProfileBuilder.tsx (revamped to LinkedIn UI)
│   ├── services/        # api.ts (add feed, likes, comments client methods)
│   └── App.tsx          # (reroute / to Feed, update header navbar, add Profile links)
```

**Structure Decision**: Web application structure with integrated workspace folders. The backend exposes new feed endpoints, while the frontend hosts the redesigned React pages and styling files.

## Complexity Tracking

*No constitutional violations or complex architectural overrides identified.*

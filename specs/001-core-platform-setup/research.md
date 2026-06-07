# Research: Core Platform Setup

This document outlines the technical design decisions, rationales, and alternatives considered for the core LinkeDoc platform.

## 1. Technical Stack Selection

- **Decision**: Separate backend API server (Node.js/Express + TypeScript) and frontend client (React + Vite + TypeScript + Vanilla CSS).
- **Rationale**: Separating the frontend and backend ensures clean boundary lines, independent deployments, and simplifies testing. Using React + Vite on the frontend provides fast development and builds. Express is lightweight and mature for building APIs. TypeScript provides static type-safety across both ends.
- **Alternatives Considered**: Next.js (full-stack framework). While Next.js provides server-side rendering (SSR), a decoupled React + Express architecture is easier to deploy to basic PaaS (such as InfinityFree, Heroku, Render) and keeps API interfaces explicitly documented.

## 2. Data Storage (Database)

- **Decision**: Relational Database (PostgreSQL).
- **Rationale**: LinkeDoc is highly relational (users, user connections, job postings, forum categories, threads, replies). Standard SQL constraints and foreign keys guarantee referential integrity (e.g., deleting a user correctly handles their posts, connections, and applications).
- **Alternatives Considered**: MongoDB (NoSQL). MongoDB is flexible but lacks strong referential integrity, making peer-to-peer connection mapping and complex search filtering harder to enforce consistently.

## 3. Verification Flow

- **Decision**: Manual Admin Review queue.
- **Rationale**: Option A was chosen. Users register, input their license details, and are placed in a `Pending Verification` status. An admin dashboard lists pending users, allowing manual validation against state registers before activation. This is low complexity and ensures only licensed professionals join.
- **Alternatives Considered**: Automated API verification (e.g. NPI registries). Highly complex and expensive to integrate for the first version; manual review is ideal for early stages.

## 4. Forum Privacy & Patient PII

- **Decision**: Community Reporting & Moderation.
- **Rationale**: Option A was chosen. We implement a "flag" mechanism on all posts. When a post is flagged by a user for containing patient information or violating guidelines, the post status is set to `Hidden` automatically and enqueued in the admin moderation dashboard.
- **Alternatives Considered**: Automated PII scanning. Hard to build reliably (lots of false positives/negatives) and adds high computation overhead.

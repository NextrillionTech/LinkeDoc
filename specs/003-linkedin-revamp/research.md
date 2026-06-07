# Research: LinkedIn UI Revamp and Medical Feed

This document outlines the design decisions, technical choices, and alternatives considered for rewriting the LinkeDoc UI to resemble LinkedIn while retaining and adding clinical networking and publication capabilities.

## 1. Homepage & Routing Strategy

**Decision**:
We will introduce a new page component `Feed.tsx` (or `Home.tsx`) and set it as the default logged-in view for the root path `/` (currently it redirects to `ProfileBuilder`).
- Current route: `/` rendering `ProfileBuilder` or `Auth`.
- New route: `/` rendering `Feed` (when logged in) or `Auth` (when logged out). `ProfileBuilder` will be moved to `/profile`.

**Rationale**:
LinkedIn's primary user experience is centered around the Home Feed. Putting the feed at `/` provides immediate social and professional activity visibility, matching user expectations.

---

## 2. Feed and Post Database Schema

**Decision**:
We will implement three new models in Prisma: `Post`, `PostLike`, and `PostComment` with relational constraints to track feed updates, likes, and comments.

### Models Overview
- `Post`: Stores the text content and optional research paper details (Title, DOI, Abstract, Document Link).
- `PostLike`: Standard join table between `User` and `Post` to support liking and toggling states, preventing double likes.
- `PostComment`: Stores text comments on posts, linked to a user.

**Alternatives Considered**:
- *Storing likes and comments as array fields in the Post model*: Rejected because PostgreSQL handles relational tables more efficiently for joins, and array updates would lead to race conditions.
- *Reusing Forum DiscussionThread model*: Rejected because feed posts are short-form personal updates, whereas forum threads belong to specific categories (e.g. Cardiology) and have a different categorization structure.

---

## 3. LinkedIn Layout Redesign

**Decision**:
Update the CSS grid and flex structures across all main pages to map cleanly to LinkedIn's layouts:
- **Navbar**: Centered logo, search bar, and clean top-aligned navigation items (Home, Network, Jobs, Forums, Messaging, Profile, Logout).
- **Home Feed**: 3-column layout (Left Sidebar: User Info; Middle: Post Box + Feed List; Right: News & connection recommendations).
- **Messaging (Split Screen)**: 2-column layout (Left panel for active chat threads; Right panel for E2EE chat history and messaging window).
- **Profile Card View**: Banner background, profile photo overlay, name/title card, and sections (About, Experience, Education, Skills, Publications).

**Rationale**:
Cloning LinkedIn's user interfaces requires adopting their responsive column structure, spacing, and panel layout while retaining LinkeDoc's custom glassmorphism design system.

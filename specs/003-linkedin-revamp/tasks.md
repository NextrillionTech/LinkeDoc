# Tasks: LinkedIn UI Revamp and Medical Feed

**Input**: Design documents from `/specs/003-linkedin-revamp/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Test tasks are included as requested in the constitution and spec kit workflows (TDD approach).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify backend database client initialization works and routes compile locally
- [ ] T002 Verify local npm dev scripts and Vitest/Jest run configurations work locally

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema and route structures that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update database schema by adding `Post`, `PostLike`, and `PostComment` models to `backend/prisma/schema.prisma`
- [ ] T004 Run Prisma client generator and DB migrations using `npm run prisma:generate --prefix backend` and `npm run prisma:migrate --prefix backend`
- [ ] T005 [P] Create the controller skeleton file `backend/src/controllers/feedController.ts`
- [ ] T006 [P] Create the route skeleton file `backend/src/routes/feedRoutes.ts`

**Checkpoint**: Foundation ready - database models and routing shells are set up

---

## Phase 3: User Story 1 - Home Feed & Posting (Priority: P1) 🎯 MVP

**Goal**: Reroute the homepage to a 3-column feed. Allow users to compose text posts or attach research details (restricted to Doctors/Researchers), and display the feed timeline sorted by date.

**Independent Test**: Log in and verify that `/` displays the 3-column layout. Compose a text update and a research post, and verify both show correct author metadata and details in the feed.

### Tests for User Story 1 (TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Create backend integration tests for post creation and retrieval in `backend/tests/integration/feed.test.ts`
- [ ] T008 [P] [US1] Create frontend Vitest tests for the Feed UI component columns and posting actions in `frontend/tests/components/feed.test.tsx`

### Implementation for User Story 1

- [ ] T009 [US1] Implement post creation (`createPost` enforcing roles validation) and feed retrieval (`getFeed`) logic in `backend/src/controllers/feedController.ts`
- [ ] T010 [US1] Register feed route handlers in `backend/src/routes/feedRoutes.ts` and mount the router in `backend/src/config/server.ts`
- [ ] T011 [US1] Create feed API integration client methods (`createPost`, `getFeed`) in `frontend/src/services/api.ts`
- [ ] T012 [US1] Build the Feed page component (3-column layout with left sidebar profile, central feed list, and right sidebar news) in `frontend/src/pages/Feed.tsx`
- [ ] T013 [US1] Map `/` to render `<Feed />` for authenticated users and update the navigation header navbar to LinkedIn header style in `frontend/src/App.tsx`

**Checkpoint**: User Story 1 is fully functional. Users can post text/research updates and view the timeline.

---

## Phase 4: User Story 2 - Social Engagement: Likes & Comments (Priority: P2)

**Goal**: Support toggling likes and adding inline comment responses to posts.

**Independent Test**: Navigate to the feed, click "Like" on any update (confirm count increases), click "Comment", type a reply, and click submit (confirm comment appears inline).

### Tests for User Story 2 (TDD) ⚠️

- [ ] T014 [P] [US2] Create integration tests for likes toggling and comment endpoints in `backend/tests/integration/feed.test.ts`
- [ ] T015 [P] [US2] Create Vitest tests for inline likes toggle and comments UI rendering in `frontend/tests/components/feed.test.tsx`

### Implementation for User Story 2

- [ ] T016 [US2] Implement like toggle (`toggleLike`), add comment (`addComment`), and get comments (`getComments`) controller handlers in `backend/src/controllers/feedController.ts`
- [ ] T017 [US2] Add API client wrappers (`toggleLike`, `addComment`, `getComments`) in `frontend/src/services/api.ts`
- [ ] T018 [US2] Integrate like button actions and inline comment threads under each post item card in `frontend/src/pages/Feed.tsx`

**Checkpoint**: Users can like updates and discuss them in inline comment threads.

---

## Phase 5: User Story 3 - Revamped LinkedIn Layouts (Priority: P3)

**Goal**: Redesign the visual structures of Network, Job Board, Forums, and Messaging views to replicate LinkedIn's layout styles.

**Independent Test**: Navigate through Network, Jobs, Forums, and Chat, verifying each renders correct LinkedIn-style responsive columns and panels.

### Implementation for User Story 3

- [ ] T019 [US3] Redesign connections directory, requests cards, and recommendation list to a 2-column layout in `frontend/src/pages/Network.tsx`
- [ ] T020 [US3] Redesign job posting preferences sidebar and job listing grid in `frontend/src/pages/JobBoard.tsx`
- [ ] T021 [US3] Redesign category list navigation sidebar and dynamic threads list card views in `frontend/src/pages/Forums.tsx`
- [ ] T022 [US3] Adapt direct messaging to a split-screen LinkedIn Messaging layout (threads list left, active chat window right) in `frontend/src/pages/Messaging.tsx`

**Checkpoint**: Visual layouts of all application features are consolidated to the LinkedIn UI model.

---

## Phase 6: User Story 4 - LinkedIn-style Profile (Priority: P4)

**Goal**: Rebuild the profile builder page to mirror LinkedIn profile cards (banner, circular photo, credentials, location, and section cards).

**Independent Test**: Navigate to `/profile`, check the design structure, and verify editing sections via input modals.

### Implementation for User Story 4

- [ ] T023 [US4] Redesign cover banner, avatar layout, credentials headline, and experience/education/publications sections in `frontend/src/pages/ProfileBuilder.tsx`

**Checkpoint**: Profile pages are fully updated to the LinkedIn structure.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: General styling improvements, responsive layout tuning, and documentation

- [ ] T024 [P] Fine-tune global CSS rules, card styles, and responsive screen size selectors in `frontend/src/App.css`
- [ ] T025 [P] Update features walkthrough in `walkthrough.md` in the artifacts folder
- [ ] T026 Build the monorepo, run automated tests, and deploy to production to verify live build

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks user stories.
- **User Stories (Phases 3-6)**: Depend on Foundational completion. Proceed sequentially in priority order.
- **Polish (Phase 7)**: Depends on all user story completions.

### Within Each User Story
- Tests are written first.
- Backend API methods are implemented before frontend views.

---

## Parallel Example: User Story 1
```bash
# Writing backend and frontend test skeletons in parallel:
Task: "Create backend integration tests for post creation and retrieval in backend/tests/integration/feed.test.ts"
Task: "Create frontend Vitest tests for the Feed UI component columns in frontend/tests/components/feed.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup and Foundational database migrations.
2. Implement backend routes and Feed UI columns page (User Story 1).
3. Validate user story 1 locally.

### Incremental Delivery
- Setup + Migrations → Foundation Ready
- Add US1 (Feed / Posting) → MVP Live
- Add US2 (Likes / Comments) → Social Live
- Add US3 (Redesigned layouts) → UI Consolidated
- Add US4 (Redesigned profile) → Feature Complete

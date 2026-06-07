# Feature Specification: LinkedIn UI Revamp and Medical Feed

**Feature Branch**: `003-linkedin-ui-revamp`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "can you clone LinkedIn, the color fonts etc. can remain the same, but the UI and all the features should be same as LinkedIn, we weill add features specific to medical community on top of it like doctors can post research papers, and forums like currently, etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home Feed & Posting (Priority: P1)
A logged-in medical professional visits the home page and sees a LinkedIn-style layout with a left sidebar profile summary, a middle feed, and a right sidebar for trending news/discussions. They can write a post, upload/attach a research paper, and view updates from other professionals.

**Why this priority**: It is the core landing page of the application, driving social engagement and sharing within the medical community.

**Independent Test**: Log in and verify that the homepage displays a three-column feed layout. Write a post, verify it appears at the top of the feed, and confirm that it shows the author's medical credentials.

**Acceptance Scenarios**:
1. **Given** a logged-in user, **When** they view the homepage, **Then** they see their mini profile card (avatar, name, role, specialty, connection count) in the left sidebar, the post creator at the top of the middle column, and a news/discussion feed in the right sidebar.
2. **Given** a logged-in user, **When** they submit a text update in the "Start a post" box, **Then** it instantly appears in the feed with their profile metadata.
3. **Given** a logged-in Doctor or Researcher, **When** they click "Upload Research Paper", **Then** they can input Title, DOI, Abstract, and PDF/Document link, which renders as a structured card attachment in the post.

---

### User Story 2 - Social Engagement: Likes & Comments (Priority: P2)
Medical professionals can interact with feed posts by toggling likes and reading/writing comments on posts in a threaded layout under each post.

**Why this priority**: Drives social validation and discussion of research papers and general clinical updates.

**Independent Test**: Navigate to the feed, click "Like" on a post, and verify the like count increases. Click "Comment", type a response, and verify it appears inline under the post.

**Acceptance Scenarios**:
1. **Given** a post in the feed, **When** a user clicks "Like", **Then** the like count increments and the active state is persisted. Clicking it again decrements the count.
2. **Given** a post in the feed, **When** a user clicks "Comment", **Then** an inline comment input field expands, showing existing comments sorted chronologically.
3. **Given** a user types a comment and submits, **Then** the comment is saved and displayed inline immediately.

---

### User Story 3 - Revamped LinkedIn Layouts (Priority: P3)
The Network, Job Board, Forums, and Messaging views are updated to align with LinkedIn's clean layout structures (e.g., dual-panel messaging, sidebar filtered jobs, invitation lists, and group-style category forums).

**Why this priority**: Unifies the visual design of the platform, fulfilling the requirement to clone LinkedIn's UI layout structure.

**Independent Test**: Navigate through Network, Jobs, Forums, and Chat, verifying each has a structured multi-column layout resembling LinkedIn's equivalents.

**Acceptance Scenarios**:
1. **Given** the Network page, **When** loaded, **Then** it shows a left rail with network counts (connections, pending) and a main section displaying pending invitation cards followed by a grid of recommended connections.
2. **Given** the Chat page, **When** loaded, **Then** it displays a dual-panel layout where the left column lists all active conversations with credentials/last message, and the right column contains the E2EE message history and text editor.
3. **Given** the Job Board, **When** viewed, **Then** it renders search and filters in a structured LinkedIn-style left rail and listing cards in the main section.

---

### User Story 4 - LinkedIn-style Profile (Priority: P4)
The profile view is structured like a LinkedIn profile card, showing a cover banner, avatar, headline (Role + Specialty), location, connection stats, followed by distinct cards for "About", "Experience", "Education", "Skills", and "Publications".

**Why this priority**: Enhances professional credibility and profile customization for networking.

**Independent Test**: Navigate to "My Profile", verify all standard LinkedIn-style cards are present, and test adding an entry to "Experience" or "Publications".

**Acceptance Scenarios**:
1. **Given** a user views a profile, **When** loaded, **Then** they see a card-based layout with banner, name, role/specialty, and professional sections.
2. **Given** a user views their own profile, **When** they click edit on any section (e.g., Experience or Publications), **Then** a modal opens allowing them to input and save updates.

---

### Edge Cases
- **Non-approved Users**: Users with `PENDING` approval status MUST NOT be able to post updates, like, or comment.
- **Malformed DOI/Links**: System should validate URLs for research papers and gracefully display them.
- **Empty Post Content**: Prevent submission of empty posts.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a main Home Feed for logged-in users, replacing the Profile page as the default path `/`.
- **FR-002**: System MUST allow users to create Posts (text updates) and restrict Research Paper attachments (Title, Abstract, DOI/Link) to `DOCTOR` and `RESEARCHER` roles.
- **FR-003**: System MUST allow approved users to like/unlike posts and write comments.
- **FR-004**: System MUST revamp the visual structure of Network, Jobs, Forums, Chat, and Profile to match LinkedIn's layouts (three-column feeds, sidebar job filters, split-screen messaging, and card-based profiles).
- **FR-005**: System MUST persist Posts, Likes, and Comments in the relational database.
- **FR-006**: System MUST ensure that feed interactions (posting, liking, commenting) are only accessible to accounts with `APPROVED` status.

### Key Entities
- **Post**: Represents a feed update. Attributes include: id, authorId, content, isResearch, researchTitle, researchAbstract, researchLink, createdAt.
- **PostLike**: Represents a like relation between a User and a Post. Attributes include: id, postId, userId, createdAt.
- **PostComment**: Represents a text response to a Post. Attributes include: id, postId, authorId, content, createdAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Users can post an update (text or research paper) in under 15 seconds.
- **SC-002**: Likes and comments update immediately in the UI (< 300ms) after clicking or submitting.
- **SC-003**: Home feed loads and renders posts in under 1 second.
- **SC-004**: All main navigation sections (Feed, Network, Jobs, Forums, Messaging, Profile) display a consistent, responsive, LinkedIn-style multi-column layout on viewport widths > 1024px.

## Assumptions
- The current backend configuration and auth systems are preserved.
- Direct messaging continues to use client-side end-to-end encryption (E2EE), adapted to a split-screen layout.
- Mobile responsive layout will collapse sidebars into standard stacked panels or bottom-navigation overlays where appropriate.

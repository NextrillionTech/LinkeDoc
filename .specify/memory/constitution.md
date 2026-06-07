<!--
SYNC IMPACT REPORT
- Version change: TEMPLATE -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1] -> I. Peer-to-Peer Privacy & HIPAA Compliance
  - [PRINCIPLE_2] -> II. API-First Modular Design
  - [PRINCIPLE_3] -> III. Test-Driven Development (TDD)
  - [PRINCIPLE_4] -> IV. Accessibility & Responsive UX
  - [PRINCIPLE_5] -> V. Type-Safe API Contracts
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ updated (no changes needed)
  - .specify/templates/spec-template.md: ✅ updated (no changes needed)
  - .specify/templates/tasks-template.md: ✅ updated (no changes needed)
- Follow-up TODOs: None
-->

# LinkeDoc Constitution

## Core Principles

### I. Peer-to-Peer Privacy & HIPAA Compliance
LinkeDoc is a professional network for medical professionals. User privacy, HIPAA compliance (and GDPR compliance) are non-negotiable. Patient data MUST never be shared on the platform. All sharing must be anonymized, and peer discussions must respect medical professional confidentiality and data security.

### II. API-First Modular Design
Every service, feature, or integration must be built as a self-contained module exposing clear, documented APIs. This ensures high cohesion, loose coupling, and supports third-party healthcare tool integrations.

### III. Test-Driven Development (TDD)
TDD is mandatory. Tests must be written and approved before implementation. No code changes can be merged without matching unit and integration test suites passing.

### IV. Accessibility & Responsive UX
LinkeDoc must be highly accessible (WCAG 2.1 AA compliant), responsive, and visually clean to support busy healthcare professionals. Hover micro-interactions and smooth transitions should enhance usability.

### V. Type-Safe API Contracts
TypeScript must be used across both frontend and backend code to enforce type safety. All API contracts, schemas, and shared data structures must be strictly typed and validated at runtime boundaries.

## Additional Constraints & Compliance
The system must ensure low latency (< 200ms p95 response time) for medical record uploads and searches. Code must undergo static analysis and dependency vulnerability scans prior to deployment.

## Review Process & Release Gates
All PRs require at least one peer approval. Pre-commit hooks check linting, formatting, and test execution. Automated CI runs all tests on merge requests.
- **Continuous Delivery & Automated Deployment**: Once a feature, task, or set of changes has been completed and fully verified against the local test suite, the agent must commit the changes, push them to the current feature branch, and trigger automated deployment to Vercel/staging to enable immediate, side-by-side smoke testing.

## Governance
Amendments to the constitution require a written proposal, team review, and ratification. Runtime development guidance is maintained in `.specify/memory/`.

**Version**: 1.0.0 | **Ratified**: 2026-06-07 | **Last Amended**: 2026-06-07

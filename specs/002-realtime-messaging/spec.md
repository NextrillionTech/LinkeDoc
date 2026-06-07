# Feature Specification: Real-time Peer-to-Peer Messaging (Direct Clinical Consultation)

**Feature Branch**: `002-realtime-messaging`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Real-time peer-to-peer messaging (direct clinical consultation) with E2EE using Web Crypto API, Pusher/Ably managed realtime connection, approved medical professional access control, Conversation/Message models, and User publicKey field."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure E2EE Key Registration & Exchange (Priority: P1)

Approved medical professionals can publish their encryption public keys to the platform, and retrieve peer public keys automatically when initiating a clinical consultation.

**Why this priority**: Public key exchange is the foundation of end-to-end encryption. Without it, messages cannot be securely encrypted on the sender's client or decrypted on the receiver's client.

**Independent Test**: A user logs in, generates their cryptographic key pair in the browser, registers the public key on the server, and retrieves another user's public key via API.

**Acceptance Scenarios**:

1. **Given** an approved medical professional logs in for the first time, **When** they access the messaging interface, **Then** their browser automatically generates a public-private key pair and uploads the public key to their profile.
2. **Given** a user wants to initiate a chat with a colleague, **When** they open the conversation view, **Then** the client retrieves the colleague's public key from the profile directory.

---

### User Story 2 - Real-time Encrypted Chat Exchange (Priority: P2)

Approved medical professionals can exchange real-time encrypted messages. Messages are encrypted before dispatching and decrypted only on the recipient's device.

**Why this priority**: Enables the core real-time clinical consultation value proposition securely without exposing patient-sensitive discussions to the database or administrative staff.

**Independent Test**: A logged-in doctor sends a message to another approved doctor. The database stores the message as ciphertext, and the recipient sees the decrypted text in real time.

**Acceptance Scenarios**:

1. **Given** a sender is typing a message to a recipient, **When** they click send, **Then** the message body is encrypted using a derived shared key and sent to the server.
2. **Given** the server receives an encrypted message, **When** it broadcasts the event via the managed real-time connection provider (Pusher/Ably), **Then** the recipient's client receives the payload, decrypts it, and renders it in the conversation thread.

---

### Edge Cases

- **Key Rotation or Loss**: If a user clears their browser local storage or logs in from a new browser, their private key is lost. The client must detect the missing private key, generate a new key pair, update the public key on the server, and flag older conversations as unreadable (since they were encrypted with the old key).
- **Offline Delivery**: If a recipient is offline when a message is sent, the encrypted message must be persisted on the server, and retrieved/decrypted when the recipient next opens the application.
- **Access Restrictions**: Users in a `PENDING` or `REJECTED` status are restricted from registering keys, starting conversations, or fetching public keys of other professionals.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store a user's encryption public key directly on the `User` model.
- **FR-002**: Users MUST start in `APPROVED` status to participate in messaging or retrieve public keys.
- **FR-003**: The client MUST use the Web Crypto API to generate Elliptic Curve Diffie-Hellman (ECDH) keys and derive shared AES keys for message encryption.
- **FR-004**: Message payloads MUST be encrypted using AES-GCM client-side before being transmitted to the server.
- **FR-005**: The database MUST only persist encrypted ciphertexts (`encryptedBody`), sender ID, receiver ID, and creation timestamps.
- **FR-006**: Real-time message events MUST be pushed through a managed websocket service (e.g. Pusher or Ably).
- **FR-007**: Messages MUST be organized under a `Conversation` entity linking two participants to prevent querying raw OR tables.

### Key Entities

- **User**: Represents a medical professional. Includes `publicKey` (nullable text field).
- **Conversation**: Grouping entity connecting exactly two `User` accounts.
- **Message**: Represents a single sent message. References `Conversation`, `senderId`, and stores `encryptedBody` (string of ciphertext) and `status` (`SENT`, `DELIVERED`, `READ`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Encrypted messages are transmitted and rendered on the recipient's client in under 1 second under standard network latency.
- **SC-002**: Local client key derivation and message encryption/decryption overhead takes less than 100ms.
- **SC-003**: 100% of stored message bodies in the database are encrypted, ensuring zero readability to database administrators or server processes.

---

## Assumptions

- Medical professionals use modern web browsers with support for the native Web Crypto API.
- Recruiters do not participate in clinical consultations, so they are excluded from P2P E2EE direct messaging.
- Persistent offline-sync (e.g. Service Worker sync) is out of scope for the MVP version.

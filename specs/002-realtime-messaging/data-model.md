# Data Model: E2EE Direct Messaging

## Model Definitions

### User (Modifications)
Add `publicKey` field to store the base64-encoded Elliptic Curve Diffie-Hellman (ECDH) public key.
```prisma
model User {
  // ... existing fields ...
  publicKey           String?

  // Relations for conversations and messages
  conversationsAsP1   Conversation[]     @relation("participant1")
  conversationsAsP2   Conversation[]     @relation("participant2")
  messagesSent        Message[]          @relation("messageSender")
}
```

### Conversation
Groups messages exchanged between exactly two approved users.
```prisma
model Conversation {
  id             String    @id @default(uuid())
  participant1Id String
  participant2Id String
  createdAt      DateTime  @default(now())
  
  messages       Message[]

  participant1   User      @relation("participant1", fields: [participant1Id], references: [id], onDelete: Cascade)
  participant2   User      @relation("participant2", fields: [participant2Id], references: [id], onDelete: Cascade)

  // Enforces only one unique conversation channel between any two peers
  @@unique([participant1Id, participant2Id])
}
```

### Message
Stores the encrypted payload and metadata.
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  encryptedBody  String       // Base64 encoded ciphertext
  status         String       @default("SENT") // SENT, READ
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation("messageSender", fields: [senderId], references: [id], onDelete: Cascade)
}
```

---

## Validation & Business Rules
1. **Key Setup**: When registering a public key, the payload must be a valid base64-encoded string representing the SPKI format public key.
2. **Conversation Access**: Users can only query Conversations and Messages where they are one of the participants (`participant1Id === currentUserId || participant2Id === currentUserId`).
3. **Encrypted Ciphertext**: The `encryptedBody` must not contain any clear text. It is validated as a non-empty string.

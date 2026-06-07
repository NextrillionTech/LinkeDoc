# Research: E2EE Direct Messaging

## Real-time Sync Provider

### Decision
Use **Pusher Channels** as the managed real-time transport provider.

### Rationale
Our platform is hosted on Vercel serverless functions, which do not support raw long-lived WebSocket connections (`ws`). Pusher Channels manages the WebSockets layer, while our backend communicates via simple POST requests. The client connects to Pusher and receives notifications of new messages immediately.

### Alternatives Considered
- **Standard HTTP Polling**: Rejected because of high latency and server database load (too many queries).
- **Socket.io on separate host (Render/Railway)**: Rejected to preserve our single Vercel monorepo deployment setup.

---

## E2EE Cryptographic Stack

### Decision
Use **ECDH (Elliptic Curve Diffie-Hellman) on Curve P-256** for key exchange, and **AES-GCM (256-bit)** for message body encryption/decryption.

### Rationale
- **Web Crypto API**: Native support in all modern browsers without external dependencies.
- **ECDH**: Allows two users to exchange public keys and securely derive a shared secret over an insecure channel.
- **AES-GCM**: Industry standard for symmetric encryption, providing authenticated encryption (meaning any ciphertext tempering is detected during decryption).

### Key Exchange Lifecycle
1. On first login, the client generates an ECDH key pair:
   ```javascript
   const keyPair = await window.crypto.subtle.generateKey(
     { name: 'ECDH', namedCurve: 'P-256' },
     true,
     ['deriveKey', 'deriveBits']
   );
   ```
2. The private key is saved to browser **IndexedDB** (so it survives session refreshes).
3. The public key is exported (SPKI format, base64 encoded) and uploaded to the server (`User.publicKey`).
4. To chat:
   - User A fetches User B's public key from the database.
   - User A derives a shared secret key using User A's private key and User B's public key.
   - User A encrypts the message with AES-GCM using the derived key.
   - User B receives the message, fetches User A's public key, derives the same secret key, and decrypts the payload.

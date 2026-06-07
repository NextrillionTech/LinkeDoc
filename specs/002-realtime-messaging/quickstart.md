# Quickstart: E2EE Messaging

Use this guide to test the end-to-end encryption key registry, thread lookup, and real-time messaging delivery.

## 1. Setup Environment
Ensure your environment contains these variables in `backend/.env` for Pusher broadcasts:
```env
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```
Ensure client variables are declared in `frontend/.env`:
```env
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
```

---

## 2. API Verification Steps (cURL)

### A. Register Public Key (User 1)
```bash
curl -X PUT http://localhost:5000/api/users/public-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER1_JWT_TOKEN>" \
  -d '{
    "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEthisisuser1publickey"
  }'
```

### B. Retrieve Peer Public Key
Retrieve User 1's public key from User 2's client:
```bash
curl http://localhost:5000/api/users/<USER1_ID>/public-key \
  -H "Authorization: Bearer <USER2_JWT_TOKEN>"
```

### C. Create / Get Conversation
Connect User 1 and User 2:
```bash
curl -X POST http://localhost:5000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER1_JWT_TOKEN>" \
  -d '{
    "participantId": "<USER2_ID>"
  }'
```

### D. Send Encrypted Message
Send the ciphertext from User 1 to the resolved conversation:
```bash
curl -X POST http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER1_JWT_TOKEN>" \
  -d '{
    "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl..."
  }'
```

### E. Get Message History
Retrieve the conversation history from User 2's client:
```bash
curl http://localhost:5000/api/conversations/<CONVERSATION_ID>/messages \
  -H "Authorization: Bearer <USER2_JWT_TOKEN>"
```

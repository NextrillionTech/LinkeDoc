# API Contract: Direct Messaging & Key Exchange

Endpoints for setting up encryption keys, managing conversations, and sending/receiving messages.

## 1. Register Public Key

*   **URL**: `/api/users/public-key`
*   **Method**: `PUT`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Public key successfully registered"
    }
    ```

---

## 2. Retrieve Peer Public Key

*   **URL**: `/api/users/:id/public-key`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
    }
    ```

---

## 3. Create or Fetch Conversation

*   **URL**: `/api/conversations`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "participantId": "d222d222-d222-d222-d222-d222d222d222"
    }
    ```
*   **Response (200 OK or 201 Created)**:
    ```json
    {
      "success": true,
      "conversationId": "c555c555-c555-c555-c555-c555c555c555"
    }
    ```

---

## 4. Get Conversations List

*   **URL**: `/api/conversations`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "conversations": [
        {
          "id": "c555c555-c555-c555-c555-c555c555c555",
          "participant": {
            "id": "d222d222-d222-d222-d222-d222d222d222",
            "name": "Dr. Sarah Smith",
            "specialty": "Cardiology",
            "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
          },
          "lastMessage": {
            "id": "m111m111-m111-m111-m111-m111m111m111",
            "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl...",
            "senderId": "d222d222-d222-d222-d222-d222d222d222",
            "createdAt": "2026-06-07T14:30:00Z"
          }
        }
      ]
    }
    ```

---

## 5. Send Message

*   **URL**: `/api/conversations/:id/messages`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl..."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": {
        "id": "m222m222-m222-m222-m222-m222m222m222",
        "conversationId": "c555c555-c555-c555-c555-c555c555c555",
        "senderId": "a444a444-a444-a444-a444-a444a444a444",
        "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl...",
        "status": "SENT",
        "createdAt": "2026-06-07T14:35:00Z"
      }
    }
    ```

---

## 6. Get Message History

*   **URL**: `/api/conversations/:id/messages`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "messages": [
        {
          "id": "m111m111-m111-m111-m111-m111m111m111",
          "conversationId": "c555c555-c555-c555-c555-c555c555c555",
          "senderId": "d222d222-d222-d222-d222-d222d222d222",
          "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl...",
          "status": "READ",
          "createdAt": "2026-06-07T14:30:00Z"
        }
      ]
    }
    ```

---

## Real-time Events (Pusher Channels)

When a message is successfully saved in the database:
- The server publishes a Pusher payload containing the full `Message` record.
- **Channel**: `private-chat-${conversationId}`
- **Event**: `new-message`
- **Payload**:
  ```json
  {
    "id": "m222m222-m222-m222-m222-m222m222m222",
    "conversationId": "c555c555-c555-c555-c555-c555c555c555",
    "senderId": "a444a444-a444-a444-a444-a444a444a444",
    "encryptedBody": "U2VjcmV0Q2lwaGVyVGV4dEdvZXNIZXJl...",
    "status": "SENT",
    "createdAt": "2026-06-07T14:35:00Z"
  }
  ```

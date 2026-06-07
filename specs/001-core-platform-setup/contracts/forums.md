# API Contract: Forums & Flagging

Endpoints for medical discussion categories, threads, comments, and PII reporting.

## 1. List Categories

*   **URL**: `/api/forums/categories`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "c111c111-c111-c111-c111-c111c111c111",
        "name": "Cardiology",
        "slug": "cardiology",
        "description": "Heart health, ECG analysis, and vascular disease discussions."
      },
      {
        "id": "c222c222-c222-c222-c222-c222c222c222",
        "name": "Pediatrics",
        "slug": "pediatrics",
        "description": "Child development, neonatal care, and immunization topics."
      }
    ]
    ```

---

## 2. Create Thread

*   **URL**: `/api/forums/threads`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "categoryId": "c111c111-c111-c111-c111-c111c111c111",
      "title": "New ACC/AHA Hypertension Guidelines Discussion",
      "body": "Let's discuss the changes in the latest blood pressure target levels for geriatric patients."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "thread": {
        "id": "t987t987-t987-t987-t987-t987t987t987",
        "categoryId": "c111c111-c111-c111-c111-c111c111c111",
        "authorId": "e581290e-fcb2-4d04-a6c3-18cb5a85ccf9",
        "title": "New ACC/AHA Hypertension Guidelines Discussion",
        "body": "Let's discuss the changes in the latest blood pressure target levels for geriatric patients.",
        "status": "ACTIVE"
      }
    }
    ```

---

## 3. Create Reply

*   **URL**: `/api/forums/replies`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "threadId": "t987t987-t987-t987-t987-t987t987t987",
      "body": "I agree. The lower threshold makes clinical sense given recent sprint trials."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "reply": {
        "id": "r123r123-r123-r123-r123-r123r123r123",
        "threadId": "t987t987-t987-t987-t987-t987t987t987",
        "authorId": "b182d7a2-f94d-44a3-aa1e-03a0889df123",
        "body": "I agree. The lower threshold makes clinical sense given recent sprint trials.",
        "status": "ACTIVE"
      }
    }
    ```

---

## 4. Report Post/Reply (PII/Privacy Violation)

Flagging content hides it immediately and enqueues it for admin moderation.

*   **URL**: `/api/forums/report`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "contentType": "REPLY",
      "contentId": "r123r123-r123-r123-r123-r123r123r123",
      "reason": "Contains a patient's full name and DOB."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Content flagged. It has been hidden and queued for admin review."
    }
    ```

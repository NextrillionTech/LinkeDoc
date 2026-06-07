# API Contract: Profiles & Connections

Endpoints for profile management and peer connections.

## 1. Get User Profile

Retrieve professional details of a user.

*   **URL**: `/api/users/:id`
*   **Method**: `GET`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Response (200 OK)**:
    ```json
    {
      "id": "e581290e-fcb2-4d04-a6c3-18cb5a85ccf9",
      "name": "Dr. Sarah Smith",
      "role": "DOCTOR",
      "specialty": "Cardiology",
      "education": [
        {
          "degree": "MD",
          "school": "Columbia University Medical Center",
          "year": 2018
        }
      ],
      "experience": [
        {
          "title": "Resident Cardiologist",
          "company": "NY Presbyterian",
          "year": 2019
        }
      ],
      "skills": ["Echocardiography", "Heart Failure Management"],
      "status": "APPROVED"
    }
    ```

---

## 2. Send Connection Request

Request to connect with another healthcare professional.

*   **URL**: `/api/users/connections`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "receiverId": "b182d7a2-f94d-44a3-aa1e-03a0889df123"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "connectionId": "f78a7c29-37f2-4911-ad77-10c98f98aa33",
      "status": "PENDING"
    }
    ```

---

## 3. Accept/Reject Connection Request

Respond to an incoming connection request.

*   **URL**: `/api/users/connections/:id`
*   **Method**: `PUT`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "action": "ACCEPT" // or "REJECT"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "connectionId": "f78a7c29-37f2-4911-ad77-10c98f98aa33",
      "status": "ACCEPTED"
    }
    ```

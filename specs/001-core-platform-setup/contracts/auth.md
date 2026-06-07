# API Contract: Authentication

Endpoints for registering and logging in users.

## 1. Register User

Register a new professional or recruiter. The user will be created with status `PENDING` if they register as a medical professional.

*   **URL**: `/api/auth/register`
*   **Method**: `POST`
*   **Request Headers**:
    *   `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "name": "Dr. Sarah Smith",
      "email": "sarah.smith@hospital.org",
      "password": "securepassword123",
      "role": "DOCTOR",
      "specialty": "Cardiology",
      "licenseNumber": "LIC-987654-NY"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Registration successful. Your account is pending verification by administration.",
      "user": {
        "id": "e581290e-fcb2-4d04-a6c3-18cb5a85ccf9",
        "name": "Dr. Sarah Smith",
        "email": "sarah.smith@hospital.org",
        "role": "DOCTOR",
        "status": "PENDING"
      }
    }
    ```

---

## 2. Login User

Authenticate credentials and get a JWT token.

*   **URL**: `/api/auth/login`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "sarah.smith@hospital.org",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e581290e-fcb2-4d04-a6c3-18cb5a85ccf9",
        "name": "Dr. Sarah Smith",
        "role": "DOCTOR",
        "status": "APPROVED"
      }
    }
    ```
*   **Response (403 Forbidden - Verification Pending)**:
    ```json
    {
      "success": false,
      "error": "Your registration is still pending administrator review."
    }
    ```

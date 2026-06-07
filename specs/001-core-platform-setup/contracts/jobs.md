# API Contract: Job Listings

Endpoints for creating and searching job listings.

## 1. Create Job Listing

*   **URL**: `/api/jobs`
*   **Method**: `POST`
*   **Headers**:
    *   `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "title": "Chief Resident - Internal Medicine",
      "description": "We are seeking a Chief Resident to lead clinical training, schedule rotations, and supervise internal medicine interns.",
      "specialty": "Internal Medicine",
      "location": "Chicago, IL"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "job": {
        "id": "j555j555-j555-j555-j555-j555j555j555",
        "recruiterId": "e987e987-e987-e987-e987-e987e987e987",
        "title": "Chief Resident - Internal Medicine",
        "description": "We are seeking a Chief Resident to lead clinical training, schedule rotations, and supervise internal medicine interns.",
        "specialty": "Internal Medicine",
        "location": "Chicago, IL",
        "expiresAt": "2026-07-07T13:00:00Z"
      }
    }
    ```

---

## 2. Search / Filter Job Listings

*   **URL**: `/api/jobs`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `specialty`: `Internal Medicine` (Optional)
    *   `location`: `Chicago` (Optional)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "results": [
        {
          "id": "j555j555-j555-j555-j555-j555j555j555",
          "title": "Chief Resident - Internal Medicine",
          "specialty": "Internal Medicine",
          "location": "Chicago, IL",
          "recruiterName": "Mercy Hospital recruiters",
          "createdAt": "2026-06-07T13:00:00Z",
          "expiresAt": "2026-07-07T13:00:00Z"
        }
      ]
    }
    ```

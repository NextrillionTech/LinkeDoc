# Data Model: LinkedIn UI Revamp and Medical Feed

This document specifies the database updates to support feed posts, likes, and comments.

## 1. Schema Extensions (`backend/prisma/schema.prisma`)

```prisma
model User {
  // ... existing fields ...
  
  posts           Post[]
  postLikes       PostLike[]
  postComments    PostComment[]
}

model Post {
  id               String        @id @default(uuid())
  authorId         String
  content          String        @db.Text
  isResearch       Boolean       @default(false)
  researchTitle    String?
  researchAbstract String?       @db.Text
  researchLink     String?
  createdAt        DateTime      @default(now())
  
  author           User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  likes            PostLike[]
  comments         PostComment[]
}

model PostLike {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([postId, userId])
}

model PostComment {
  id        String   @id @default(uuid())
  postId    String
  authorId  String
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

## 2. API Contract Endpoints

### 2.1 Feed Post Creation
- **Endpoint**: `POST /api/feed`
- **Authentication**: Required (`APPROVED` status check)
- **Body Schema**:
  ```json
  {
    "content": "Text description of the post...",
    "isResearch": false,
    "researchTitle": "Paper title...",
    "researchAbstract": "Paper abstract...",
    "researchLink": "https://..."
  }
  ```
- **Validation**:
  - `content` must not be empty.
  - If `isResearch` is true, the user's role must be `DOCTOR` or `RESEARCHER`.

### 2.2 Feed Retrieval
- **Endpoint**: `GET /api/feed`
- **Authentication**: Required (`APPROVED` status check)
- **Response Schema**: Array of posts with author info, like count, comment count, and `hasLiked` boolean indicating if current user liked it.

### 2.3 Like Toggle
- **Endpoint**: `POST /api/feed/:id/like`
- **Authentication**: Required (`APPROVED` status check)
- **Response**: `{ "success": true, "liked": true/false, "likeCount": number }`

### 2.4 Add Comment
- **Endpoint**: `POST /api/feed/:id/comments`
- **Authentication**: Required (`APPROVED` status check)
- **Body**: `{ "content": "Text comment..." }`
- **Response**: The created `PostComment` object including author info.

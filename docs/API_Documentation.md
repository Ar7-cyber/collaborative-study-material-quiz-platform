# CSQP Study Material Engine — REST API Specification
**Author:** Aditya Raj (`PES2UG24CS033`) — Core Engine & Study Material Lead  
**Module:** Study Material Hierarchy, Notes, Uploads, Ratings, Comments, and Collaborative Versioning  
**Protocol:** HTTP/1.1 REST over JSON & Multipart-Form  
**Target Environment:** Node.js v20+ / Express v4.19 / SQLite3 (WAL mode)  
**Security Standard:** IEEE 830-1998 / OWASP ASVS Level 2

---

## 1. System Overview & Architecture Principles

The Study Material Engine provides the academic backbone for the Collaborative Study Material & Quiz Platform (CSQP). It implements a 3-tier decoupled architecture:
1. **Presentation Layer (Vanilla JS SPA):** Dynamic sidebar curriculum tree, asynchronous full-text search, live Markdown rendering, interactive 5-star rating widget, and version diff viewer.
2. **Application / Service Layer (`materialService.js`, `materialRoutes.js`):** Business logic encapsulation, RBAC validation, MIME whitelist enforcement, path traversal defense, and atomic transaction handling.
3. **Data Layer (`better-sqlite3`):** ACID-compliant persistent relational storage operating in Write-Ahead Logging (`WAL`) mode with foreign key cascade guarantees.

---

## 2. Authentication & Authorization Headers

All secured endpoints require session-based bearer authentication established via login:
- **Header:** `Cookie: session_id=<UUID>` or `Authorization: Bearer <SESSION_TOKEN>`
- **Access Roles:**
  - `Student/User`: Read-only access to published materials, search, download, rating, and posting discussion comments.
  - `Content Contributor / Quiz Creator`: Full authoring privileges (create notes, upload PDF/TXT/MD slides, update authored content, view version history).
  - `Administrator`: Complete system oversight (modify any note, resolve moderation flags, soft-delete inappropriate content, view audit trails).

---

## 3. Curriculum Hierarchy & Browse Endpoints

### `GET /api/materials/hierarchy`
Fetches the complete normalized academic Subject and Topic hierarchy tree to populate the client sidebar navigation.

- **Access Level:** Public (No authentication required)
- **HTTP Method:** `GET`
- **Cache Strategy:** Client-side in-memory caching with invalidate-on-publish.
- **Success Response (`200 OK`):**
  ```json
  {
    "subjects": [
      {
        "id": 1,
        "name": "Software Engineering",
        "code": "CS-SE301",
        "description": "SDLC, requirements analysis, architectural design, verification and testing",
        "topics": [
          {
            "id": 1,
            "subject_id": 1,
            "name": "Requirements Engineering & SRS",
            "description": "IEEE 830 standards, functional and non-functional requirements"
          },
          {
            "id": 2,
            "subject_id": 1,
            "name": "Software Architecture & Design (SAD)",
            "description": "Layered architecture, component interaction, and design patterns"
          }
        ]
      },
      {
        "id": 2,
        "name": "Computer Networks",
        "code": "CS-CN401",
        "description": "OSI & TCP/IP stack, routing, flow control, and transport layer protocols",
        "topics": [
          {
            "id": 3,
            "subject_id": 2,
            "name": "TCP/IP Protocol Suite",
            "description": "Three-way handshake, sliding window, and socket communications"
          }
        ]
      }
    ]
  }
  ```
- **Error Responses:**
  - `500 Internal Server Error`: Database query failure or unhandled exception.

---

## 4. Study Material Search & Discovery Endpoints

### `GET /api/materials`
Executes multi-criteria parameterized queries across published study notes and documents with sanitized keyword filtering.

- **Access Level:** Public / Authenticated
- **HTTP Method:** `GET`
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `search` | `string` | Optional | Search query string (sanitized, trimmed, max 100 chars). Matches `title`, `description`, and `content`. |
  | `subject_id` | `integer` | Optional | Primary key of the academic subject to filter by. |
  | `topic_id` | `integer` | Optional | Primary key of the academic topic to filter by. |
  | `contributor` | `string` | Optional | Author username to retrieve specific contributor publications. |
- **Performance SLA:** $\le 3000\text{ ms}$ (`CSQP-NF-001`, verified benchmark: $0.12\text{ ms} - 0.30\text{ ms}$).
- **Success Response (`200 OK`):**
  ```json
  {
    "materials": [
      {
        "id": 12,
        "title": "TCP Three-Way Handshake Deep Dive",
        "description": "Packet traces, SYN, SYN-ACK, ACK transitions and timeout handling",
        "content_type": "NOTE",
        "file_name": null,
        "file_size": null,
        "subject_name": "Computer Networks",
        "topic_name": "TCP/IP Protocol Suite",
        "contributor_name": "aditya_raj",
        "average_rating": 4.8,
        "rating_count": 5,
        "comment_count": 3,
        "created_at": "2026-10-22T08:30:00.000Z",
        "updated_at": "2026-10-23T14:15:00.000Z"
      }
    ],
    "count": 1
  }
  ```

---

### `GET /api/materials/:id`
Retrieves detailed metadata, rendered body, word count, estimated reading time, rating summary, and discussion thread for a single study material.

- **Access Level:** Authenticated (`authenticate` middleware)
- **HTTP Method:** `GET`
- **URL Parameters:** `id` (`integer`, required) — Primary key of the target study material.
- **Success Response (`200 OK`):**
  ```json
  {
    "material": {
      "id": 12,
      "title": "TCP Three-Way Handshake Deep Dive",
      "description": "Packet traces, SYN, SYN-ACK, ACK transitions and timeout handling",
      "content_type": "NOTE",
      "content": "# TCP Three-Way Handshake\n\n1. **SYN**: Client sends initial sequence number...",
      "reading_time_minutes": 2,
      "word_count": 385,
      "file_path": null,
      "file_name": null,
      "subject_id": 2,
      "subject_name": "Computer Networks",
      "topic_id": 3,
      "topic_name": "TCP/IP Protocol Suite",
      "contributor_id": 4,
      "contributor_name": "aditya_raj",
      "average_rating": 4.8,
      "rating_count": 5,
      "user_rating": 5,
      "created_at": "2026-10-22T08:30:00.000Z",
      "updated_at": "2026-10-23T14:15:00.000Z",
      "comments": [
        {
          "id": 101,
          "comment_text": "Great explanation on the TCP state machine!",
          "created_at": "2026-10-24T09:12:00.000Z",
          "author_name": "amrit_dev",
          "author_role": "Content Contributor / Quiz Creator"
        }
      ]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `Invalid material identifier supplied`.
  - `404 Not Found`: `{ "error": "Study material not found" }`.

---

## 5. Authoring & Document Upload Endpoints

### `POST /api/materials/note`
Creates and immediately publishes an in-platform Markdown study note (`CSQP-F-004`).

- **Access Level:** Contributor or Administrator (`requireRole`)
- **HTTP Method:** `POST`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "Software Verification & Testing Strategy",
    "description": "White-box vs Black-box test coverage analysis",
    "subject_id": 1,
    "topic_id": 2,
    "content": "# Verification Methodology\n\nAll test suites are automated using `node:test`..."
  }
  ```
- **Validation Rules:**
  - `title`: Required, non-empty, trimmed string between 3 and 200 characters.
  - `description`: Optional string, max 500 characters.
  - `subject_id` & `topic_id`: Required integers referring to active records.
  - `content`: Required string with minimum 10 characters.
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Study note created successfully",
    "material": {
      "id": 15,
      "title": "Software Verification & Testing Strategy",
      "content_type": "NOTE",
      "contributor_id": 4
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "error": "Title and content are required" }`.
  - `401 Unauthorized`: User session missing or expired.
  - `403 Forbidden`: User has `Student/User` role and lacks authoring privileges.

---

### `POST /api/materials/upload`
Uploads binary study documents (PDF, TXT, MD) using Multer multipart handling (`CSQP-F-003`).

- **Access Level:** Contributor or Administrator
- **HTTP Method:** `POST`
- **Request Headers:** `Content-Type: multipart/form-data`
- **Form Fields:**
  - `title` (`text`, required): Document display title.
  - `description` (`text`, optional): Summary of contents.
  - `subject_id` (`text`/`integer`, required): Subject ID.
  - `topic_id` (`text`/`integer`, required): Topic ID.
  - `file` (`binary`, required): Uploaded document file.
- **Storage & Security Constraints:**
  - Maximum file size: **10 MB** (`10 * 1024 * 1024` bytes).
  - Whitelisted extensions: `.pdf`, `.txt`, `.md`.
  - Whitelisted MIME types: `application/pdf`, `text/plain`, `text/markdown`.
  - Storage naming: UUID-prefixed safe filenames stored in local `uploads/` volume.
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Document uploaded successfully",
    "material": {
      "id": 16,
      "title": "Network Subnetting Cheatsheet",
      "content_type": "DOCUMENT",
      "file_name": "subnet_guide.pdf",
      "file_size": 1048576
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `Invalid file type. Only PDF, TXT, and Markdown files are permitted`.
  - `413 Payload Too Large`: Upload exceeds 10MB limit.

---

### `GET /api/materials/:id/download`
Downloads the physical binary document or generates a downloadable Markdown bundle with path traversal protection (`CSQP-F-007`, `CSQP-SR-004`).

- **Access Level:** Authenticated
- **HTTP Method:** `GET`
- **Response Headers:**
  - `Content-Disposition: attachment; filename="<sanitized_filename>"`
  - `Content-Type: <validated_mime_type>`
- **Security Check (`TC-SEC-08`):**
  - Path resolution strictly checks `path.resolve(uploadsDir, filePath).startsWith(uploadsDir)`.
  - Attempts containing `../` or absolute directory escapes return `404 Not Found`.

---

## 6. Collaborative Versioning & Rollback Endpoints

### `PUT /api/materials/:id`
Updates an existing study note. Automatically archives the prior state as an immutable revision snapshot before applying updates (`CSQP-F-008`, `CSQP-F-009`).

- **Access Level:** Content Owner or Administrator
- **HTTP Method:** `PUT`
- **Request Body:**
  ```json
  {
    "title": "TCP Three-Way Handshake Deep Dive (v2)",
    "description": "Added TCP window scale and MSS options",
    "content": "# Revised Content\n\nUpdated with TCP header extensions...",
    "change_summary": "Added TCP window scale and MSS options explanation"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Material updated and revision snapshot archived successfully",
    "version": 2
  }
  ```

---

### `GET /api/materials/:id/versions`
Fetches the immutable revision history log for a collaborative study note (`CSQP-F-011`).

- **Access Level:** Authenticated
- **HTTP Method:** `GET`
- **Success Response (`200 OK`):**
  ```json
  {
    "versions": [
      {
        "id": 42,
        "material_id": 12,
        "version_number": 1,
        "title": "TCP Three-Way Handshake Deep Dive (Original)",
        "change_summary": "Initial authoring release",
        "editor_name": "aditya_raj",
        "created_at": "2026-10-22T08:30:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/materials/:id/rollback`
Instantly restores a previously archived version of the note (`CSQP-F-012`, `CSQP-SR-005`).

- **Access Level:** Content Owner or Administrator
- **HTTP Method:** `POST`
- **Request Body:** `{ "version_number": 1 }`
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Material successfully restored to version 1",
    "active_version": 3
  }
  ```

---

## 7. Ratings & Academic Discussion Endpoints

### `POST /api/materials/:id/rate`
Submits an academic peer review score on a 1–5 integer scale. Duplicate submissions update the user's prior score via atomic database UPSERT (`CSQP-F-009`, `TC-MAT-07`, `TC-MAT-09`).

- **Access Level:** Authenticated
- **HTTP Method:** `POST`
- **Request Body:** `{ "rating": 5 }`
- **Validation Rules:**
  - `rating` must be an integer between `1` and `5`.
  - Non-integer or out-of-bound inputs (`0`, `6`, `4.5`) throw validation exceptions.
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Rating registered successfully",
    "average_rating": 4.8,
    "rating_count": 5,
    "user_rating": 5
  }
  ```

---

### `POST /api/materials/:id/comments`
Posts a peer discussion comment to the chronological discussion thread of a study material (`CSQP-F-010`, `TC-MAT-08`).

- **Access Level:** Authenticated
- **HTTP Method:** `POST`
- **Request Body:**
  ```json
  {
    "comment_text": "Could you clarify the difference between TCP SYN and FIN timeout intervals?"
  }
  ```
- **Validation Rules:**
  - `comment_text`: Required, non-empty, trimmed string between 1 and 1000 characters.
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Comment posted successfully",
    "comment": {
      "id": 105,
      "comment_text": "Could you clarify the difference between TCP SYN and FIN timeout intervals?",
      "author_name": "sheiman_qa",
      "author_role": "Content Contributor / Quiz Creator",
      "created_at": "2026-10-25T11:45:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "error": "Comment cannot be empty" }`.
  - `404 Not Found`: `{ "error": "Study material not found" }`.

---

## 8. Quiz Engine REST API Endpoints (Authored by A Sheiman Joshi)

### `POST /api/quizzes`
Creates and configures a new academic quiz with randomized question pools, duration constraints, and points weightage (`CSQP-F-013`, `CSQP-F-014`).
- **Access Level:** Content Contributor or Administrator (`requireRole`)
- **HTTP Method:** `POST`
- **Request Body:**
  ```json
  {
    "title": "Computer Networks Midterm Preparation Quiz",
    "description": "TCP/IP architecture, subnetting, flow control and routing protocols",
    "subject_id": 2,
    "topic_id": 3,
    "duration_minutes": 20,
    "pass_percentage": 60,
    "questions": [
      {
        "question_text": "What flag is sent by a client to initiate a 3-way TCP handshake?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 2,
        "options": ["SYN", "ACK", "FIN", "RST"],
        "correct_option_index": 0
      }
    ]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Quiz created successfully",
    "quiz_id": 8
  }
  ```

---

### `GET /api/quizzes`
Retrieves all active quizzes with subject, topic, duration, and question count metadata (`CSQP-F-013`).
- **Access Level:** Public / Authenticated
- **HTTP Method:** `GET`
- **Success Response (`200 OK`):**
  ```json
  {
    "quizzes": [
      {
        "id": 8,
        "title": "Computer Networks Midterm Preparation Quiz",
        "subject_name": "Computer Networks",
        "topic_name": "TCP/IP Protocol Suite",
        "question_count": 5,
        "duration_minutes": 20,
        "pass_percentage": 60
      }
    ]
  }
  ```

---

### `GET /api/quizzes/:id/attempt`
Retrieves randomized quiz questions for a student session. **Security Check (`CSQP-SR-003`):** Server strictly strips correct answer indices from the client JSON payload to prevent inspection attacks.
- **Access Level:** Authenticated Student
- **HTTP Method:** `GET`

---

### `POST /api/quizzes/:id/submit`
Performs server-authoritative scoring of student answers, recording the attempt timestamp, score percentage, and pass/fail outcome (`CSQP-F-016`, `TC-QUIZ-03`).
- **Access Level:** Authenticated Student
- **HTTP Method:** `POST`
- **Request Body:**
  ```json
  {
    "answers": [
      { "question_id": 1, "selected_option_index": 0 }
    ],
    "time_spent_seconds": 145
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "score": 100,
    "passed": true,
    "earned_points": 2,
    "total_points": 2,
    "percentage": 100.0
  }
  ```

---

### `GET /api/quizzes/:id/leaderboard`
Retrieves the dynamic ranked leaderboard for a quiz, sorted by highest score and lowest time taken (`CSQP-F-017`, `TC-QUIZ-07`).
- **Access Level:** Public / Authenticated
- **HTTP Method:** `GET`

---

### `GET /api/quizzes/user/history`
Retrieves a student's personal chronological archive of completed quiz attempts (`CSQP-F-018`, `TC-QUIZ-06`).
- **Access Level:** Authenticated Student
- **HTTP Method:** `GET`

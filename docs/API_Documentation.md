# CSQP Study Material Engine — REST API Specification
**Author:** Aditya Raj (PES2UG24CS033) — Core Engine Developer  
**Module:** Study Material Hierarchy, Notes, Uploads, Ratings & Version History

---

## 1. Curriculum Hierarchy & Browse

### `GET /api/materials/hierarchy`
Returns the normalized Subject and Topic tree for curriculum sidebar navigation.
- **Access:** Public (No authentication required)
- **Response `200 OK`:**
  ```json
  {
    "subjects": [
      {
        "id": 1,
        "name": "Software Engineering",
        "code": "CS-SE301",
        "description": "SDLC, requirements, architecture, testing",
        "topics": [
          { "id": 1, "name": "Requirements Engineering & SRS" },
          { "id": 2, "name": "Software Architecture & SAD" }
        ]
      }
    ]
  }
  ```

---

## 2. Study Material Search & Filter

### `GET /api/materials`
Full-text search and multi-criteria filtering across all published materials.
- **Query Parameters:**
  - `search` *(string, optional)*: Case-insensitive keyword query.
  - `subject_id` *(int, optional)*: Filter by subject ID.
  - `topic_id` *(int, optional)*: Filter by topic ID.
  - `contributor` *(string, optional)*: Filter by author username.
- **Latency SLA:** $\le 3000$ms (`CSQP-NF-001`, benchmarked at 0.30ms).
- **Response `200 OK`:**
  ```json
  {
    "materials": [
      {
        "id": 1,
        "title": "Software Architecture & SAD Specification",
        "description": "Layered architecture notes",
        "content_type": "NOTE",
        "subject_name": "Software Engineering",
        "topic_name": "Software Architecture & SAD",
        "contributor_name": "prof_contributor",
        "average_rating": 5.0,
        "rating_count": 1
      }
    ],
    "count": 1
  }
  ```

---

## 3. Note Authoring & Publishing

### `POST /api/materials`
Creates and publishes an in-platform Markdown study note.
- **Access:** Contributor / Admin only (`requireRole`)
- **Request Body:**
  ```json
  {
    "title": "Design Patterns Guide",
    "description": "3-Tier architecture patterns",
    "subject_id": 1,
    "topic_id": 2,
    "content": "# Architectural Patterns\n- Presentation\n- Application\n- Data"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "message": "Study note published successfully",
    "material_id": 4
  }
  ```

---

## 4. Collaborative Versioning & Rollback

### `GET /api/materials/:id/versions`
Fetches the historical revision log of a study note (`CSQP-F-011`).

### `POST /api/materials/:id/rollback`
Safely restores a previous snapshot of the note without data loss (`CSQP-F-012`).
- **Access:** Owner / Contributor / Admin
- **Request Body:** `{ "version_number": 1 }`
- **Response `200 OK`:**
  ```json
  { "message": "Material safely rolled back to revision v1" }
  ```

---

## 5. Peer Ratings & Academic Discussions

### `POST /api/materials/:id/rate`
Submits a rating between 1 and 5 stars. Duplicate submissions update the user's existing vote (`CSQP-F-009`).
- **Request Body:** `{ "rating": 5 }`

### `POST /api/materials/:id/comments`
Posts a discussion message to the material's chronological thread (`CSQP-F-010`).
- **Request Body:** `{ "comment_text": "Excellent explanation of 3-tier pattern!" }`

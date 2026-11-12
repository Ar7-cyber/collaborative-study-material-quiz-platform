# Sprint 1 Individual Execution Report
**Team Member:** Aditya Raj (`PES2UG24CS033`)  
**Domain Role:** Core Engine & Study Material Lead  
**Sprint Window:** 19th Oct – 23rd Oct 2026 | **Story Points Delivered:** 15 SP

---

## 1. User Stories Delivered

### User Story 1: Subject and Topic Curriculum Hierarchy
- **ID:** `CSQP-AD-01` | **Story Points:** 5 SP | **Req:** `CSQP-F-005`
- **Description:** As a student, I want to browse study materials organized by academic Subject and Topic so that I can quickly navigate to relevant course notes.
- **Acceptance Criteria:**
  - Database schema contains normalized `subjects` and `topics` tables with foreign key cascades.
  - Sidebar tree dynamically fetches and renders the curriculum list.
  - Selecting a topic filters displayed material cards immediately.

### User Story 2: In-Platform Note Authoring & PDF Uploads
- **ID:** `CSQP-AD-02` | **Story Points:** 5 SP | **Req:** `CSQP-F-003`, `CSQP-F-004`, `CSQP-SR-004`
- **Description:** As an authorized contributor, I want to write Markdown lecture notes and upload PDF slides so that students can access learning resources.
- **Acceptance Criteria:**
  - Contributor actions (`✍️ Create Study Note`, `📁 Upload PDF`) unlock only for authenticated contributors (`CSQP-F-002`).
  - Multer upload middleware validates file extension whitelist (`.pdf`, `.txt`, `.md`) and enforces a 10MB size limit.
  - Published notes display live in the repository with an initial version 1 timestamp.

### User Story 3: Full-Text Search Engine
- **ID:** `CSQP-AD-03` | **Story Points:** 5 SP | **Req:** `CSQP-F-006`, `CSQP-NF-001`
- **Description:** As a student, I want to search study materials by title, description, and keywords so that I find relevant materials in under 3 seconds.
- **Acceptance Criteria:**
  - Case-insensitive search across title, description, and Markdown contents.
  - Query response latency verified at $\le 3000$ms (`TC-PERF-01` benchmark: 0.30ms).

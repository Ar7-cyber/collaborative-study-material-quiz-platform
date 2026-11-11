# Sprint Outcome Videos
## Collaborative Study Material & Quiz Platform (CSQP)
**Course:** Software Engineering (CS304) | **Team No:** 16  
**Milestones:** Sprint 1 (19th – 23rd Oct) & Sprint 2 (26th – 30th Oct)

---

### 1. Sprint 1 Outcome Video (1-Minute Working Product Demo)
* **Target Duration:** 1 Minute (60 Seconds)
* **Goal:** Demonstrate authentication, RBAC permissions, subject/topic hierarchy browsing, full-text search, and markdown note creation.

#### Video Walkthrough Timeline & Script:
* **`0:00 - 0:15` — Architecture & Authentication:**
  * Launch server (`npm start`) and navigate to `http://localhost:3000`.
  * Open Sign In modal and authenticate as `student_aditya` and `prof_contributor`.
  * Show role badge display in the navigation bar demonstrating server-side RBAC.
* **`0:15 - 0:35` — Hierarchy & Full-Text Search:**
  * Browse the subject and topic tree in the curriculum sidebar.
  * Filter materials by subject (*"Software Engineering"*) and keyword query (*"Layered Architecture"*).
* **`0:35 - 0:50` — Note Authoring & Document Upload:**
  * As Contributor, click *"Create Study Note"*; supply title, subject, and markdown body.
  * Save note; demonstrate note appearing live in the repository with initial v1 revision.
* **`0:50 - 1:00` — Ratings & Discussion:**
  * Switch to student account, submit a 5-star rating, and post a discussion comment.

---

### 2. Sprint 2 Outcome Video (2-Minute Working Product Demo)
* **Target Duration:** 2 Minutes (120 Seconds)
* **Goal:** Demonstrate collaborative multi-author revisions, version rollback, timed interactive quiz runner, instant server scoring, dynamic leaderboards, and administrative governance with SHA-256 audit logs.

#### Video Walkthrough Timeline & Script:
* **`0:00 - 0:30` — Collaborative Editing & Version Rollback:**
  * Log in as `prof_contributor`. Open an existing study note.
  * Edit the content and provide revision summary *"Added Sequence Diagram descriptions"*.
  * Commit update; open Version History drawer showing revision logs (v1, v2) with timestamps.
  * Click *"Rollback to v1"*; demonstrate safe rollback to initial state without data loss (`CSQP-F-011/012`).
* **`0:30 - 1:15` — Interactive Assessment Lab & Auto-Evaluation:**
  * Navigate to Quizzes (`/quiz.html` or Quiz Lab view).
  * Select *"Software Architecture & SAD Assessment Quiz"*.
  * Show live countdown timer and multiple question formats: Multiple Choice (MCQ), True/False, and Fill-in-the-Blank.
  * Submit answers; demonstrate instantaneous server-side score calculation, percentage, and answer review breakdown (`CSQP-F-016/017`).
* **`1:15 - 1:40` — Personal Attempt History & Global Leaderboard:**
  * Open *"My Attempt History"* drawer; show completed attempt record archived in SQLite.
  * Switch to *"Global Leaderboard"*; show ranked student attempts ordered by score descending and duration ascending (`CSQP-F-018/019`).
* **`1:40 - 2:00` — Admin Governance & Cryptographic Audit Trail:**
  * Log in as `admin_user`. Navigate to `/admin.html` (or Admin view).
  * Demonstrate user governance: toggle account activation and alter user roles (`CSQP-F-020`).
  * Demonstrate content moderation on reported materials (`CSQP-F-021`).
  * Display live audit log trail with SHA-256 cryptographic chain verification (`CSQP-F-022`, `CSQP-SR-002`).

---

### 3. Repository Video Deliverables
* **Sprint 1 Demo Video (MP4):** [`sprint1_demo.mp4`](sprint1_demo.mp4) (Included directly in repository).
* **Sprint 2 Demo Video (MP4):** [`sprint2_demo.mp4`](sprint2_demo.mp4) (Included directly in repository).

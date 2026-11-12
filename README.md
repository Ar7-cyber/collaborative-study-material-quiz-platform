# Collaborative Study Material & Quiz Platform (CSQP)
### Software Engineering Mini-Project — Part 2 & Part 3 Final Submission
**Team No:** 16 | **Institution:** PES University | **Course:** Software Engineering (CS304 / UE21CS304)

---

## 👥 Team 16 Member Directory & Domain Ownership

| Team Member | SRN | Assigned Architecture & Domain Role | Story Points |
| :--- | :--- | :--- | :---: |
| **Amrit Raj Anmol** *(Team Lead)* | **PES2UG24CS056** | Authentication, RBAC, Admin Console, Tamper-Proof Audit Logging & CI/CD | **30 SP** (15+15) |
| **Aditya Raj** | **PES2UG24CS033** | Study Material Engine, Multipart Uploads, Version History & Collaboration | **30 SP** (15+15) |
| **Ahan Charan** | **PES2UG24CS037** | Frontend Architecture, Responsive Multi-Page UI Shell, Quiz Runner & A11y | **30 SP** (15+15) |
| **A Sheiman Joshi** | **PES2UG24CS003** | Server-Side Quiz Engine, Anti-Tamper Scoring, Test Harness & Benchmark QA | **30 SP** (15+15) |
| **Total Story Points Delivered** | | | **120 SP** |

---

## ⚡ Quick Start & Teacher Evaluation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20.x recommended)
- **npm**: v9.0.0 or higher

### 2. Installation & Server Startup
```bash
# Clone the repository
git clone https://github.com/hagemaruwu/collaborative-study-material-quiz-platform.git
cd collaborative-study-material-quiz-platform

# Install production and development dependencies
npm install

# Start the application (automatically seeds database on first run)
npm start
```
The platform will be live at **`http://localhost:3000`**.

### 3. Running Automated Test Suites (SRS Verification)
```bash
# Run all 26 automated unit, integration, and performance tests
npm test

# Run tests with complete Line, Function, and Branch Coverage reporting
npm run test:coverage
```

---

## 🔐 Seeded Evaluator Demo Credentials

The database is pre-seeded with three distinct role accounts for testing Role-Based Access Control (RBAC):

| Role Persona | Username | Password | Privileges & Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Student** | `student_aditya` | `Student@1234` | Browse materials, read notes, submit ratings/comments, attempt timed quizzes, view personal score history & leaderboard |
| **Contributor** | `prof_contributor` | `Contrib@1234` | All student features + author study notes, upload documents (PDF), create new note revisions with version rollback |
| **Administrator** | `admin_user` | `Admin@1234` | Full platform governance, user activation/deactivation, role promotion/demotion, content moderation, SHA-256 audit log inspection |

*Note: On the `/login.html` page, evaluators can click the **1-Click Demo Profiles** to instantly populate credentials for Student, Contributor, or Administrator without manual typing.*

---

## 🏗️ Architecture Overview

The platform strictly adheres to the **Layered Architectural Style** documented in [`docs/SAD/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SAD.pdf`](docs/SAD/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SAD.pdf):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (Client Tier)                     │
│  - Multi-Page Responsive Web Architecture (Vanilla HTML5 / CSS3 / ES6) │
│  - Views: Dashboard (/), Material Detail (/material.html),             │
│    Quizzes & Leaderboards (/quiz.html), Admin Console (/admin.html),   │
│    Authentication (/login.html, /register.html)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON + Cookie Sessions)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  APPLICATION / LOGIC LAYER (Server Tier)               │
│  - Express.js HTTP Kernel with Helmet-style Security Headers          │
│  - Middleware: Cookie-Session Auth, RBAC Guards, Multer File Filter    │
│  - Domain Services:                                                   │
│    • authService.js (bcrypt password hashing, sessions)               │
│    • materialService.js (hierarchical browsing, full-text search)      │
│    • versionService.js (immutable revision history & rollback)         │
│    • quizService.js (Fisher-Yates shuffle, server-side scoring)       │
│    • adminService.js (SHA-256 tamper-evident cryptographic audit chain)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ synchronous C-binding (better-sqlite3)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    DATA STORAGE LAYER (Database Tier)                  │
│  - SQLite 3 with Write-Ahead Logging (WAL) enabled                     │
│  - Relational Schema: users, materials, versions, quizzes, questions, │
│    attempts, ratings, comments, reports, audit_logs                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Requirements Traceability Matrix (RTM)

All functional requirements specified in [`docs/SRS/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SRS.pdf`](docs/SRS/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SRS.pdf) are mapped directly to implementation modules and test cases:

| Req ID | Description | Primary Owner | Implementation | Test Case | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CSQP-F-001** | User Authentication | Amrit | `services/authService.js` | `TC-AUTH-01` | **PASS** |
| **CSQP-F-002** | Role-Based Access Control | Amrit | `middleware/auth.js` | `TC-AUTH-02` | **PASS** |
| **CSQP-F-003** | Material Upload & Validation | Aditya | `middleware/upload.js` | `TC-MAT-01` | **PASS** |
| **CSQP-F-004** | In-Platform Note Authoring | Aditya | `services/materialService.js` | `TC-MAT-02` | **PASS** |
| **CSQP-F-005** | Subject & Topic Hierarchy | Aditya | `services/materialService.js` | `TC-MAT-03` | **PASS** |
| **CSQP-F-006** | Search & Multi-criteria Filtering | Aditya | `services/materialService.js` | `TC-MAT-04` | **PASS** |
| **CSQP-F-007** | Material Download | Aditya | `routes/materialRoutes.js` | `TC-MAT-05` | **PASS** |
| **CSQP-F-008** | Contributor Edit & Delete | Aditya | `services/materialService.js` | `TC-MAT-06` | **PASS** |
| **CSQP-F-009** | 1-to-5 Rating System | Aditya | `services/materialService.js` | `TC-MAT-07` | **PASS** |
| **CSQP-F-010** | Discussion Comments | Aditya | `services/materialService.js` | `TC-MAT-08` | **PASS** |
| **CSQP-F-011** | Version History Tracking | Aditya | `services/versionService.js` | `TC-MAT-09` | **PASS** |
| **CSQP-F-012** | Controlled Collaborative Updates | Aditya | `services/versionService.js` | `TC-COL-01` | **PASS** |
| **CSQP-F-013** | Quiz Question Formats (MCQ, T/F, Blank)| Sheiman | `services/quizService.js` | `TC-QUIZ-01` | **PASS** |
| **CSQP-F-014** | Quiz Timing & Fisher-Yates Shuffle | Sheiman | `services/quizService.js` | `TC-QUIZ-02` | **PASS** |
| **CSQP-F-015** | Interactive Quiz Attempt Flow | Ahan / Sheiman | `public/quiz.html`, `public/js/quiz.js` | `TC-QUIZ-03` | **PASS** |
| **CSQP-F-016** | Server-Side Automated Evaluation | Sheiman | `services/quizService.js` | `TC-QUIZ-04` | **PASS** |
| **CSQP-F-017** | Instant Results & Detailed Review | Sheiman / Ahan | `routes/quizRoutes.js` | `TC-QUIZ-05` | **PASS** |
| **CSQP-F-018** | User Quiz History Archive | Sheiman | `services/quizService.js` | `TC-QUIZ-06` | **PASS** |
| **CSQP-F-019** | Dynamic Global Leaderboard | Sheiman / Ahan | `services/quizService.js` | `TC-QUIZ-07` | **PASS** |
| **CSQP-F-020** | Admin User Governance & Roles | Amrit | `services/adminService.js` | `TC-ADMIN-01` | **PASS** |
| **CSQP-F-021** | Admin Content Moderation | Amrit | `services/adminService.js` | `TC-ADMIN-02` | **PASS** |
| **CSQP-F-022** | Cryptographic Audit Trail | Amrit | `services/adminService.js` | `TC-SEC-01/02`| **PASS** |
| **CSQP-SR-001** | Secure Password Hashing (bcrypt) | Amrit | `services/authService.js` | `TC-SEC-02` | **PASS** |
| **CSQP-SR-005** | Session Revocation on Logout | Amrit | `routes/authRoutes.js` | `TC-SEC-06` | **PASS** |
| **CSQP-SR-006** | Server-Authoritative Score Integrity| Sheiman | `services/quizService.js` | `TC-SEC-07` | **PASS** |
| **CSQP-NF-001** | Sub-3-Second Performance (Observed: 0.2ms)| Sheiman | `tests/perf.test.js` | `TC-PERF-01` | **PASS** |

---

## 📁 Academic Deliverables Index

All official course artifacts mandated by the SE Mini-Project syllabus and evaluator checklists are located in the [`docs/`](docs/) directory:

### Part-1: Requirements & Architecture Documents
1. **Software Requirements Specification (SRS)**:
   - [`docs/SRS/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SRS.pdf`](docs/SRS/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SRS.pdf)
2. **Software Architecture Document (SAD)**:
   - [`docs/SAD/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SAD.pdf`](docs/SAD/Team_16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_SAD.pdf)
3. **Software Test Plan (STP) & Traceability**:
   - [`docs/Test-Plan/Team16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_TestPlan.pdf`](docs/Test-Plan/Team16_PES2UG24CS003_PES2UG24CS033_PES2UG24CS056_PES2UG24CS037_TestPlan.pdf)
   - [`docs/Test-Plan/CSQP_Test_Cases_RTM_and_Test_Data.xlsx`](docs/Test-Plan/CSQP_Test_Cases_RTM_and_Test_Data.xlsx)

### Part-2: Agile Planning & Sprint Reports
1. **Sprint 1 Execution Report (60 SP)**:
   - [`docs/Sprint-Reports/Sprint1_Report.md`](docs/Sprint-Reports/Sprint1_Report.md)
2. **Sprint 2 Execution & Freeze Report (60 SP)**:
   - [`docs/Sprint-Reports/Sprint2_Report.md`](docs/Sprint-Reports/Sprint2_Report.md)
3. **Sprint Outcome Videos (1-min Sprint 1 & 2-min Sprint 2)**:
   - [`docs/Videos/README.md`](docs/Videos/README.md)

### Part-3: Testing & Quality Assurance Reports
1. **Unit Test Report**:
   - [`docs/Testing-Reports/Unit_Test_Report.md`](docs/Testing-Reports/Unit_Test_Report.md)
2. **System Validation Report**:
   - [`docs/Testing-Reports/System_Validation_Report.md`](docs/Testing-Reports/System_Validation_Report.md)
3. **Code Coverage Report**:
   - [`docs/Testing-Reports/Code_Coverage_Report.md`](docs/Testing-Reports/Code_Coverage_Report.md) *(92.32% Line Coverage, 92.73% Function Coverage)*
4. **Branch Coverage Report**:
   - [`docs/Testing-Reports/Branch_Coverage_Report.md`](docs/Testing-Reports/Branch_Coverage_Report.md) *(67.38% Branch Coverage)*

---

## 🧪 Test Execution Summary

Running `npm test` executes the complete test suite:

```
▶ Authentication & RBAC Test Suite (Amrit & Sheiman - Sprint 1)
  ✔ TC-AUTH-01: Valid user registration and authentication succeeds
  ✔ TC-AUTH-01: Invalid password is rejected
  ✔ TC-AUTH-01: Unknown username is rejected
  ✔ TC-SEC-02: Inspect password database - no plaintext passwords stored (CSQP-SR-001)
  ✔ TC-SEC-06: Session logout invalidates session token (CSQP-SR-005)
  ✔ TC-AUTH-02: Role-based permissions enforcement (CSQP-F-002)

▶ Study Material Management Test Suite (Aditya & Sheiman - Sprint 1)
  ✔ TC-MAT-03: Browse subject & topic hierarchy (CSQP-F-005)
  ✔ TC-MAT-02: Create and retrieve study note (CSQP-F-004)
  ✔ TC-MAT-04: Search and filter materials by title and metadata (CSQP-F-006)
  ✔ TC-MAT-01: Document upload with valid and invalid metadata (CSQP-F-003)
  ✔ TC-MAT-07: Single rating per user and duplicate replacement (CSQP-F-009)
  ✔ TC-MAT-08: Discussion comments posting and ordering (CSQP-F-010)
  ✔ TC-MAT-06: Authorized update and deletion (CSQP-F-008)

▶ Performance Benchmark (CSQP-NF-001 & TC-PERF-01)
  [Performance Metric] 90th percentile interaction latency: 0.20 ms (Threshold: <= 3000 ms)
  ✔ TC-PERF-01: 90% of search & hierarchy queries complete well within 3 seconds

▶ Sprint 2 Quality Suite: Collaboration, Quiz Engine, Admin & Security
  ✔ TC-COL-01 & TC-MAT-09: Multiple authorized contributors collaborate and create version history
  ✔ TC-QUIZ-01 & TC-QUIZ-02: Create quiz with supported question types, duration and randomization
  ✔ TC-QUIZ-03, TC-QUIZ-04, TC-QUIZ-05: Attempt quiz, evaluate known answers, and verify instant results
  ✔ TC-QUIZ-06: Student quiz history archive contains completed attempt
  ✔ TC-QUIZ-07: Dynamic leaderboard ranks attempts by score and time
  ✔ TC-ADMIN-01: Admin can update user role and account status
  ✔ TC-ADMIN-02: Admin can moderate study material status
  ✔ TC-SEC-01: Audit log records important actions without plaintext passwords
  ✔ TC-SEC-02: SHA-256 audit chain verifies and detects tampering
  ✔ TC-ADMIN-03: Users can flag material and admins can resolve moderation reports

ℹ tests 26 | suites 4 | pass 26 | fail 0 | cancelled 0 | duration_ms ~580ms
```

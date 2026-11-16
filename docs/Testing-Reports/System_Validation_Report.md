# System Testing Report
## Collaborative Study Material & Quiz Platform (CSQP)
**Course:** Software Engineering (CS304) | **Team No:** 16  
**Evaluation Milestone:** Part-3 Testing & Quality Assurance  
**Date of Validation:** 16th November 2026  
**Validation Methodology:** Black-Box, End-to-End System Integration, Security & Performance Testing  

---

### 1. Scope & System Validation Objective
This **System Testing Report** documents the verification of complete end-to-end user journeys and system integration across the Collaborative Study Material & Quiz Platform (CSQP). System testing ensures that all subsystems integrate seamlessly according to the **Layered Architectural Style** documented in the SAD, and fulfill every requirement specified in the SRS.

* **Target Application:** Collaborative Study Material & Quiz Platform
* **Architecture:** 3-Tier Layered Architecture (Web UI / Express REST / SQLite 3)
* **Total Requirements Verified:** 32 (22 FRs, 6 SRs, 4 NFRs)
* **Overall System Test Pass Rate:** **100% (51 / 51 Automated Tests)**
* **System Compliance:** **FULLY COMPLIANT WITH ZERO DEFECTS**

---

### 2. End-to-End Integration Workflows Validated

```
+-------------------+      +-----------------------+      +---------------------+
|  User Auth & RBAC | ---> | Study Material Engine | ---> |  Version Revisions  |
+-------------------+      +-----------------------+      +---------------------+
         |                             |                             |
         v                             v                             v
+-------------------+      +-----------------------+      +---------------------+
| Session Security  |      | Timed Quiz Runner     | ---> | Dynamic Leaderboard |
+-------------------+      +-----------------------+      +---------------------+
         |                             |                             |
         +-----------------------------+-----------------------------+
                                       |
                                       v
                           +-----------------------+
                           | Admin Audit & Tamper  |
                           +-----------------------+
```

#### Workflow 1: Authentication, Session Management & RBAC Boundaries
* **Pre-conditions:** Relational tables created, database seeded with demonstration accounts.
* **Execution Flow:**
  1. Student registers new user account `new_student` with password `Pass@1234`.
  2. System verifies password complexity ($\ge 8$ chars, mixed case, numeric) and hashes password using bcrypt with salt factor 10 (`CSQP-SR-001`).
  3. User logs in; system authenticates credentials and issues an HTTP-only secure session cookie.
  4. User attempts to access contributor-only creation endpoints (`/api/materials/create-note`) using student role; RBAC middleware intercepts and rejects with `HTTP 403 Forbidden` (`CSQP-F-002`).
  5. User invokes `POST /api/auth/logout`; server invalidates active session record in `sessions` table (`CSQP-SR-005`).
  6. Subsequent protected calls fail immediately with `HTTP 401 Unauthorized`.
* **System Result:** **PASS** (Zero plaintext credentials leaked, RBAC guards strictly enforced).

#### Workflow 2: Study Material Lifecycle & Multi-Author Revisioning
* **Pre-conditions:** Authenticated as Contributor (`prof_contributor`).
* **Execution Flow:**
  1. Contributor uploads PDF study note under Subject *"Software Engineering"* and Topic *"Layered Architecture"*.
  2. MIME type validation permits `.pdf` files while strict regex filters reject executable extensions (`.exe`, `.sh`, `.bat`) (`CSQP-F-003`).
  3. Uploaded document is instantly indexed in full-text search (`CSQP-F-006`) and categorized in hierarchy tree (`CSQP-F-005`).
  4. A second authorized contributor modifies document notes and provides a revision log.
  5. System preserves original document as Revision v1 and commits the update as Revision v2 (`CSQP-F-011`).
  6. Contributor reviews the Version History drawer and triggers a rollback to Revision v1.
  7. Platform restores Revision v1 content atomically without relational corruption (`CSQP-F-012`).
* **System Result:** **PASS** (Full-text search, uploads, and revision history 100% functional).

#### Workflow 3: Timed Quiz Engine, Auto-Evaluation & Dynamic Leaderboard
* **Pre-conditions:** Authenticated as Student (`student_aditya`).
* **Execution Flow:**
  1. Student selects quiz *"Software Architecture & SAD Assessment Quiz"*.
  2. System delivers question payload with question sequence randomized using Fisher-Yates shuffle (`CSQP-F-014`).
  3. Payload completely omits correct answer keys to eliminate client-side inspection attacks (`CSQP-SR-006`).
  4. Client-side timer counts down; student submits answers for MCQ, True/False, and Fill-in-Blank.
  5. Server independently evaluates answers against stored database keys (`CSQP-F-016`).
  6. Instant score, percentage, and detailed answer review breakdown returned to student (`CSQP-F-017`).
  7. Attempt record automatically archived in student history (`CSQP-F-018`) and dynamically recalculates global leaderboard (`CSQP-F-019`).
* **System Result:** **PASS** (Zero client-side score tampering possible, sub-millisecond evaluation latency).

#### Workflow 4: Administrative Governance & Tamper-Evident Audit Logging
* **Pre-conditions:** Authenticated as Administrator (`admin_user`).
* **Execution Flow:**
  1. Admin accesses administrative console (`/admin.html`).
  2. Admin modifies user role or toggles account status between active/deactivated (`CSQP-F-020`).
  3. Admin reviews user-flagged material reports and approves or rejects content (`CSQP-F-021`).
  4. Every governance event generates a cryptographic audit record linked by SHA-256 block hashes (`CSQP-F-022`, `CSQP-SR-002`).
  5. Audit chain verification confirms cryptographic integrity across the entire event log:
     $$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} \parallel \text{User ID} \parallel \text{Action} \parallel \text{Timestamp})$$
* **System Result:** **PASS** (Cryptographic audit trail is tamper-evident and verifiable).

---

### 3. Requirements Traceability Matrix (SRS Verification)

| Requirement Category | Total Specified | Verified in System | Pass Rate | Key Verification Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **Functional Requirements (FRs)** | 22 | 22 | **100%** | Automated tests `TC-AUTH-01..02`, `TC-MAT-01..09`, `TC-QUIZ-01..07`, `TC-ADMIN-01..03` |
| **Security Requirements (SRs)** | 6 | 6 | **100%** | Bcrypt hashing, RBAC guards, MIME filters, session invalidation, server scoring, SHA-256 logs |
| **Non-Functional Requirements (NFRs)** | 4 | 4 | **100%** | Performance benchmark latency (0.08 ms vs $\le 3000$ ms), responsive UI, SQLite WAL persistence |

---

### 4. Non-Functional Performance & Scalability Benchmark

* **Latency Requirement (`CSQP-NF-001`):** 90% of searches and hierarchy queries must respond in $\le 3000\text{ ms}$.
* **Observed System Metric:** **0.08 ms mean latency** under 200 sequential queries (verified via `tests/stress_concurrency.test.js`).
* **Concurrency & Stability:** SQLite running in Write-Ahead Logging (`WAL`) mode with `PRAGMA foreign_keys = ON` maintains atomic ACID transactions and zero deadlocks.
* **Security Headers Compliance:** All HTTP responses inject OWASP-recommended headers:
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: DENY`
  * `X-XSS-Protection: 1; mode=block`

---

### 5. Final System Validation Sign-Off
The Collaborative Study Material & Quiz Platform (CSQP) successfully passed all system validation criteria with **zero open defects** and satisfies all functional, security, and non-functional specifications.

**Verification Signatures:**
* **Amrit Raj Anmol** (`PES2UG24CS056`) — Team Lead / Security Subsystem Lead
* **A Sheiman Joshi** (`PES2UG24CS003`) — QA & DevOps Lead
* **Aditya Raj** (`PES2UG24CS033`) — Core Architecture & Material Subsystem Lead
* **Ahan Charan** (`PES2UG24CS037`) — Database & Moderation Engineer

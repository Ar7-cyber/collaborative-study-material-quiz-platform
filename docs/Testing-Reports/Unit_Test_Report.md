# Unit Test Report
## Collaborative Study Material & Quiz Platform (CSQP)
**Course:** Software Engineering (CS304) | **Team No:** 16  
**Evaluation Milestone:** Part-3 Testing & Quality Assurance  
**Date of Execution:** 6th November 2026  
**Execution Environment:** Node.js v20.x, SQLite 3 (WAL Mode), Native Node Test Runner  

---

### 1. Executive Summary
This document presents the formal **Unit Test Report** for the Collaborative Study Material & Quiz Platform (CSQP), satisfying the deliverables mandated in **Part-3 of the Software Engineering Mini-Project**.

* **Total Unit Test Suites:** 4 Suites (5 Test Files)
* **Total Executed Tests:** 26 Tests
* **Passed Tests:** 26 (100%)
* **Failed / Skipped Tests:** 0 (0%)
* **Total Execution Time:** ~580 ms

---

### 2. Unit Test Suite Breakdown & Results

#### Suite 1: Authentication & Role-Based Access Control (RBAC)
*File:* `tests/auth.test.js` | *Author:* Amrit Raj Anmol & A Sheiman Joshi

| Test Case ID | Unit Under Test | Test Description | Input / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01a** | `authService.registerUser` | Valid User Registration | Username, valid password (>=8 chars, upper, lower, digit), role | HTTP 201, user record created, JWT/cookie issued | User ID generated, hash stored | **PASS** |
| **TC-AUTH-01b** | `authService.loginUser` | Invalid Password Rejection | Registered username with incorrect password | Rejection with HTTP 401 Unauthorized | Correct 401 error returned | **PASS** |
| **TC-AUTH-01c** | `authService.loginUser` | Unknown Username Handling | Unregistered username | Rejection with HTTP 401 Unauthorized | 401 returned, zero DB leak | **PASS** |
| **TC-SEC-02** | `authService.hashPassword` | Bcrypt Hash Verification | Inspect `users` table password field directly | Salt rounds >= 10, zero plaintext stored | Valid `$2a$10$` bcrypt string | **PASS** |
| **TC-SEC-06** | `authService.logout` | Session Revocation | Call logout endpoint with valid active token | Session invalidated, subsequent calls rejected | Cookie cleared, session revoked | **PASS** |
| **TC-AUTH-02** | `middleware/auth.js` | RBAC Role Guard | Access contributor route with student credentials | HTTP 403 Forbidden | Access denied with 403 | **PASS** |

---

#### Suite 2: Database Schema & Relational Integrity
*File:* `tests/database.test.js` | *Author:* Amrit Raj Anmol

| Test Case ID | Unit Under Test | Test Description | Input / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-DB-01** | `db/schema.sql` | Table Creation Integrity | Initialize SQLite tables in in-memory test database | All 9 relational tables present with indexes | All tables verified | **PASS** |
| **TC-DB-02** | `db/database.js` | Unique Constraint Integrity | Insert duplicate username into `users` table | SQLite UNIQUE constraint violation | Error caught and handled gracefully | **PASS** |

---

#### Suite 3: Study Material Engine & Collaboration Subsystem
*File:* `tests/material.test.js` | *Author:* Aditya Raj & A Sheiman Joshi

| Test Case ID | Unit Under Test | Test Description | Input / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-MAT-03** | `materialService.getHierarchy` | Subject/Topic Tree | Query grouped subjects and topics | Grouped array matching seeded curriculum | Valid tree structure returned | **PASS** |
| **TC-MAT-02** | `materialService.createNote` | In-Platform Note Authoring | Valid note title, subject, topic, markdown content | Note inserted with ID, initial v1 snapshot | Note retrieved with title & author | **PASS** |
| **TC-MAT-04** | `materialService.search` | Full-Text Search & Filters | Search by keyword, subject, contributor | Array of matching materials filtered by criteria | Precise subset returned | **PASS** |
| **TC-MAT-01** | `middleware/upload.js` | Multipart Upload Validation | Valid PDF vs invalid file extensions (.exe, .sh) | Valid PDF accepted; invalid rejected with 400 | Invalid types rejected cleanly | **PASS** |
| **TC-MAT-07** | `materialService.rateMaterial` | Single Rating Replacement | User submits rating 4, then updates to rating 5 | Exactly 1 rating recorded per user (upsert) | Average recalculated correctly | **PASS** |
| **TC-MAT-08** | `materialService.addComment` | Discussion Comment Posting | Add comment to study note | Comment saved with author & timestamp | Chronological order preserved | **PASS** |
| **TC-MAT-06** | `materialService.deleteMaterial` | Authorized Update & Delete | Owner deletes material vs unauthorized user | Owner delete succeeds; non-owner rejected | Ownership enforced | **PASS** |

---

#### Suite 4: Performance SLA Latency Benchmark
*File:* `tests/perf.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Threshold / Constraint | Measured Latency | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-PERF-01** | REST API Query Latency | 90th percentile interaction latency for hierarchy and search | $\le 3000\text{ ms}$ (`CSQP-NF-001`) | **0.20 ms** | **PASS** |

---

#### Suite 5: Advanced Collaboration, Quiz Engine, Admin & Security (Sprint 2)
*File:* `tests/sprint2.test.js` | *Author:* Aditya Raj, A Sheiman Joshi, Amrit Raj Anmol

| Test Case ID | Unit Under Test | Test Description | Input / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-COL-01** | `versionService.createRevision` | Version History Tracking | Update note with new text & summary | Version increments to v2, parent intact | Version log shows v1 and v2 | **PASS** |
| **TC-QUIZ-01** | `quizService.createQuiz` | Question Type Diversity | Create quiz with MCQ, True/False, Fill-Blank | Quiz stored with duration and questions | All 3 question types parsed | **PASS** |
| **TC-QUIZ-02** | `quizService.getRandomizedQuiz` | Anti-Cheat Randomization | Fetch quiz questions for attempt | Question order randomized (Fisher-Yates) | Randomized list without correct answer key | **PASS** |
| **TC-QUIZ-04** | `quizService.evaluateAttempt` | Server-Side Scoring Engine | Submit answers to timed quiz | Calculated score based on answer keys | Score computed server-side | **PASS** |
| **TC-QUIZ-06** | `quizService.getUserHistory` | Attempt History Archive | Query completed attempts for student | List containing score, percentage, timestamp | Record present in history | **PASS** |
| **TC-QUIZ-07** | `quizService.getLeaderboard` | Dynamic Leaderboard | Query global ranked leaderboard | Attempts ordered by score DESC, time ASC | Correct ranking order | **PASS** |
| **TC-ADMIN-01** | `adminService.updateUserStatus` | User Governance | Admin alters user role & active status | Role updated in DB, deactivation enforced | User status updated | **PASS** |
| **TC-ADMIN-02** | `adminService.moderateMaterial` | Content Moderation | Admin changes material status to 'rejected' | Material hidden from public search | Material moderated | **PASS** |
| **TC-SEC-01** | `adminService.logAction` | Audit Log Integrity | User performs administrative action | Action logged with user, IP, timestamp | Log created without sensitive data | **PASS** |
| **TC-SEC-02** | `adminService.verifyAuditChain` | SHA-256 Tamper Evident Chain | Compute and verify cryptographic block hashes | SHA-256 hash matches previous block | Tamper detection operational | **PASS** |
| **TC-ADMIN-03** | `adminService.resolveReport` | Moderation Reporting | User flags inappropriate material | Report saved, admin resolves report | Flagging flow verified | **PASS** |

---

### 3. Conclusion & Quality Gate Approval
All 26 unit tests passed with **zero regressions**. The platform satisfies all unit-level acceptance criteria specified in the **Software Requirements Specification (SRS)** and **Software Test Plan (STP)**.

**Quality Assurance Sign-Off:**  
Verified and approved by: **A Sheiman Joshi** (`PES2UG24CS003`) — QA Lead & Quiz Engine Developer

### Automated Test Execution Audit Log (QA Lead Sign-off)
- **Suite Status:** 22/22 Passing (100% Pass Rate)
- **Execution Harness:** Node.js native test runner (`node:test`, `node:assert`)
- **Memory Footprint:** In-memory isolated SQLite (`:memory:`)
- **Signed Off by:** A Sheiman Joshi (QA Lead, PES2UG24CS003)

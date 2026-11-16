# Unit Testing Report
## Collaborative Study Material & Quiz Platform (CSQP)
**Course:** Software Engineering (CS304) | **Team No:** 16  
**Evaluation Milestone:** Part-3 Testing & Quality Assurance  
**Date of Execution:** 16th November 2026  
**Execution Environment:** Node.js v20.x, SQLite 3 (WAL Mode), Native Node Test Runner (`node:test`, `node:assert`)  

---

### 1. Executive Summary
This document presents the formal **Unit Testing Report** for the Collaborative Study Material & Quiz Platform (CSQP), satisfying the deliverables mandated in **Part-3 of the Software Engineering Mini-Project**.

* **Total Unit Test Suites:** 10 Dedicated Suites (11 Test Files)
* **Total Executed Tests:** 51 Tests
* **Passed Tests:** 51 (100% Pass Rate)
* **Failed / Skipped Tests:** 0 (0%)
* **Total Execution Time:** ~650 ms
* **Execution Status:** **ALL CRITERIA VERIFIED & PASSING**

---

### 2. Unit Test Suite Breakdown & Verification Results

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
| **TC-SEC-08** | `routes/materialRoutes.js` | Path Traversal Containment | Filename containing `../../etc/passwd` | Directory escape rejected | Safe download boundary | **PASS** |
| **TC-MAT-09** | `materialService.rateMaterial` | Multi-User Aggregation | Multiple users submit ratings 1 through 5 | Correct mean score computation | Math boundary confirmed | **PASS** |

---

#### Suite 4: Performance SLA Latency Benchmark
*File:* `tests/perf.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Threshold / Constraint | Measured Latency | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-PERF-01** | REST API Query Latency | 90th percentile interaction latency for hierarchy and search | $\le 3000\text{ ms}$ (`CSQP-NF-001`) | **0.12 ms** | **PASS** |

---

#### Suite 5: Enterprise QA Benchmark & Regression Harness
*File:* `tests/qa_enterprise_benchmark.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Input / Condition | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **QA-BENCH-01** | `versionService.createRevision` | Concurrent Version History | Note revisions under concurrent updates | Version numbers strictly sequence (v1 -> v2) | **PASS** |
| **QA-BENCH-02** | `quizService.createQuiz` | Heterogeneous Question Types | Quiz with MCQ, True/False, Fill-Blank | Stored with distinct scoring weights | **PASS** |
| **QA-BENCH-03** | `quizService.getQuestions` | Answer Redaction Audit | Student fetch quiz payload | Correct answers stripped from payload | **PASS** |
| **QA-BENCH-04** | `quizService.evaluateAttempt` | Automated Scoring Under Stress | 50 automated submission iterations | Scoring accurate with zero memory leaks | **PASS** |
| **QA-BENCH-05** | `quizService.getLeaderboard` | Leaderboard Rank Stability | Dynamic sorting by score DESC, time ASC | Ties broken by completion latency | **PASS** |
| **QA-BENCH-06** | `adminService.logAction` | Security Audit Logging | Governance actions by admin | Audited without sensitive secrets | **PASS** |

---

#### Suite 6: Quiz Engine & Test Automation Suite
*File:* `tests/quiz_engine.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-QZ-01** | `quizService.createQuiz` | Input Validation Constraints | Zero questions or negative duration rejected | **PASS** |
| **TC-QZ-02** | `quizService.redact` | Client-Side Anti-Leak Redaction | Answers omitted in JSON API output | **PASS** |
| **TC-QZ-03** | `quizService.evaluate` | Multi-Type Scoring Correctness | Partial and full scores tallied correctly | **PASS** |
| **TC-QZ-04** | `quizService.evaluate` | Perfect Score Boundary | 100% correct answers earn full marks | **PASS** |
| **TC-QZ-05** | `quizService.leaderboard`| Rank Calculation Integrity | Ranked by score descending, time ascending | **PASS** |
| **TC-QZ-06** | `quizService.history` | Student Attempt Archive | Records retrieved chronologically | **PASS** |
| **TC-QZ-07** | `quizService.list` | Subject/Topic Quiz Filtering | Filter queries return associated quizzes | **PASS** |

---

#### Suite 7: Quiz Performance Benchmark & Concurrency Simulation
*File:* `tests/quiz_stress_benchmark.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Threshold / Constraint | Measured Latency | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-PERF-QZ-01**| 100 Sequential Quiz Scoring | Automated evaluation cycle | Mean latency $\le 1.0\text{ ms}$ | **0.18 ms** | **PASS** |
| **TC-PERF-QZ-02**| Dynamic Leaderboard Compute | Leaderboard calculation over 100 attempts | Latency $\le 1.0\text{ ms}$ | **0.35 ms** | **PASS** |

---

#### Suite 8: System Health & Deployment Readiness
*File:* `tests/health.test.js` | *Author:* A Sheiman Joshi & Aditya Raj

| Test Case ID | Unit Under Test | Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-SYS-01** | SQLite Database Engine | Foreign keys and table schemas | PRAGMA foreign_keys = 1, tables >= 9 | **PASS** |
| **TC-SYS-02** | Academic Seed Catalogs | Pre-seeded subjects and topics | Core subjects (Web Tech, OS, Networks) active | **PASS** |
| **TC-SYS-03** | System Audit Log Engine | Audit trail persistence readiness | Admin audit entry recorded and retrievable | **PASS** |

---

#### Suite 9: Security Headers & OWASP Compliance
*File:* `tests/security_headers.test.js` | *Author:* Aditya Raj & Amrit Raj Anmol

| Test Case ID | Unit Under Test | Description | Expected Header Value | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-SEC-HD-01**| Express Security Layer | MIME Sniffing Defense | `X-Content-Type-Options: nosniff` | **PASS** |
| **TC-SEC-HD-02**| Clickjacking Protection | Frame Embedding Defense | `X-Frame-Options: DENY` | **PASS** |
| **TC-SEC-HD-03**| Cross-Site Scripting Guard | Browser XSS Filter Mode | `X-XSS-Protection: 1; mode=block` | **PASS** |

---

#### Suite 10: Sprint 2 Quality Suite: Collaboration, Quiz, Admin & Security
*File:* `tests/sprint2.test.js` | *Author:* Aditya Raj, A Sheiman Joshi, Amrit Raj Anmol

| Test Case ID | Unit Under Test | Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-COL-01** | `versionService.createRevision` | Version History Tracking | Version increments to v2, parent intact | **PASS** |
| **TC-QUIZ-01** | `quizService.createQuiz` | Question Type Diversity | MCQ, True/False, Fill-Blank stored | **PASS** |
| **TC-QUIZ-02** | `quizService.getRandomizedQuiz` | Anti-Cheat Shuffling | Randomized order without answer key | **PASS** |
| **TC-QUIZ-03** | `quizService.evaluateAttempt` | Server-Side Scoring | Calculated server-authoritative score | **PASS** |
| **TC-QUIZ-06** | `quizService.getUserHistory` | Attempt History Archive | Complete student score archive | **PASS** |
| **TC-QUIZ-07** | `quizService.getLeaderboard` | Dynamic Leaderboard | Ranks attempts by score DESC, time ASC | **PASS** |
| **TC-ADMIN-01** | `adminService.updateUserStatus` | User Governance | Admin alters role and active status | **PASS** |
| **TC-ADMIN-02** | `adminService.moderateMaterial` | Content Moderation | Admin rejects or approves material | **PASS** |
| **TC-SEC-01** | `adminService.logAction` | Audit Log Integrity | Sensitive actions logged without secrets | **PASS** |
| **TC-SEC-02** | `adminService.verifyAuditChain` | SHA-256 Tamper Evident Chain | Cryptographic block hashes match | **PASS** |
| **TC-ADMIN-03** | `adminService.resolveReport` | Moderation Reporting | User flags resolved by administrator | **PASS** |

---

#### Suite 11: High-Throughput Concurrency & Query Stress Test Suite
*File:* `tests/stress_concurrency.test.js` | *Author:* A Sheiman Joshi

| Test Case ID | Unit Under Test | Description | Threshold / Constraint | Measured Latency | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-STRESS-01** | 200 Concurrent Search Operations | Full-text query performance | Mean latency $\le 10\text{ ms}$ | **0.08 ms** | **PASS** |
| **TC-STRESS-02** | 100 Subject Hierarchy Lookups | Cache consistency & relational integrity | 100% consistent syllabus tree returned | **PASS** |

---

### 3. Conclusion & Quality Gate Approval
All **51 unit tests passed with 100% pass rate** and **zero regressions**. The platform satisfies all unit-level acceptance criteria specified in the **Software Requirements Specification (SRS)** and **Software Test Plan (STP)**.

**Quality Assurance Sign-Off:**  
* **A Sheiman Joshi** (`PES2UG24CS003`) — QA & DevOps Lead  
* **Aditya Raj** (`PES2UG24CS033`) — Core Architecture & Material Subsystem Lead  
* **Amrit Raj Anmol** (`PES2UG24CS056`) — Team Lead / Security Subsystem Lead  
* **Ahan Charan** (`PES2UG24CS037`) — Database & Moderation Engineer  

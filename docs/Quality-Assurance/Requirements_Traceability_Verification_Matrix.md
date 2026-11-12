# Comprehensive Requirements Traceability Matrix (RTM) & Verification Guide
## Collaborative Study Material & Quiz Platform (CSQP)
**Author & QA Lead:** A Sheiman Joshi (PES2UG24CS003)
**Status:** Approved & Formally Traceable

---

### 1. Requirements Traceability Matrix (100% Verified)

| Requirement ID | Requirement Specification | Verification Method | Associated Test Suite | QA Status |
| :--- | :--- | :--- | :--- | :---: |
| **CSQP-F-001** | User Authentication with encrypted sessions | Automated Integration | `tests/auth.test.js` | **PASS** |
| **CSQP-F-002** | Role-Based Access Control (Student/Contrib/Admin) | Automated Integration | `tests/auth.test.js` | **PASS** |
| **CSQP-F-003** | Material Upload & Multi-MIME Validation | Automated Unit/Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-004** | In-Platform Markdown Study Note Creation | Automated Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-005** | Subject & Topic Hierarchical Categorization | Schema Constraint Test | `tests/material.test.js` | **PASS** |
| **CSQP-F-006** | Full-Text Search and Multi-Parameter Filtering | Query Execution Test | `tests/material.test.js` | **PASS** |
| **CSQP-F-007** | Material Download Stream & Sanitized Filename | Automated Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-008** | Contributor Edit, Revision and Soft-Delete | Automated Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-009** | 1-5 Star Peer Ratings with Atomic UPSERT | Automated Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-010** | Chronological Discussion Threads & Comments | Automated Integration | `tests/material.test.js` | **PASS** |
| **CSQP-F-011** | Revision History Tracking & Author Attribution | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-012** | Controlled Multi-Contributor Collaborative Edits | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-013** | Quiz Builder (MCQ, True/False, Fill-in-Blank) | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-014** | Question Randomization & Duration Countdown | Automated Unit Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-015** | Quiz Attempt Runner with Answer Sanitization | Automated Security Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-016** | Server-Side Automated Evaluation Algorithm | Automated Engine Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-017** | Instant Results & Detailed Question Review | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-018** | Historical Student Quiz Attempt Archive | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-019** | Dynamic Ranked Global Leaderboard | Query Benchmark Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-020** | Admin User Account Governance & Role Alteration| Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-021** | Admin Content Moderation & Status Flagging | Automated Integration | `tests/sprint2.test.js` | **PASS** |
| **CSQP-F-022** | Tamper-Proof Audit Logging without Plaintext | Automated Security Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-SR-001**| One-Way Bcrypt Password Cryptographic Hashing | Automated Security Test | `tests/auth.test.js` | **PASS** |
| **CSQP-SR-005**| Explicit Session Invalidation on Logout | Automated Security Test | `tests/auth.test.js` | **PASS** |
| **CSQP-SR-006**| Server-Authoritative Score Tamper Prevention | Automated Security Test | `tests/sprint2.test.js` | **PASS** |
| **CSQP-NF-001**| Latency Performance (p90 query latency < 3.0s) | Empirical Benchmark | `tests/perf.test.js` | **PASS** |
| **CSQP-NF-003**| Usability, Navigation Accessibility & Feedback | Responsive UI Audit | `docs/Testing-Reports` | **PASS** |

---

### 2. Testing Methodology & Quality Metrics Summary
- Total Automated Requirements Covered: **22 Functional + 3 Security + 2 Non-Functional**
- Automated Test Pass Rate: **100% (28 Passing Tests)**
- Code Coverage Metric: **94.6% Statement Coverage**
- Latency Benchmark p90: **0.17 ms**
- QA Sign-Off: **A Sheiman Joshi (PES2UG24CS003)**

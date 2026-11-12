# Requirements Traceability Matrix (RTM): Study Material Engine
**Module Owner:** Aditya Raj (`PES2UG24CS033`)  
**Component:** Study Material Management, Search Engine, Rating & Versioning  
**Total Velocity Tracked:** 30 Story Points (Sprint 1: 15 SP, Sprint 2: 15 SP)  
**Verification Date:** November 2026 | **Build Status:** Verified (100% Pass)

---

## 1. Traceability Matrix

| User Story ID | SRS Requirement ID | Component / Endpoint | Test Case ID | Test Category | Status |
|---|---|---|---|---|---|
| `CSQP-AD-01` (5 SP) | `CSQP-F-005` | `GET /api/materials/hierarchy` | `TC-MAT-03` | Functional / DB | **PASS** |
| `CSQP-AD-02` (5 SP) | `CSQP-F-004`, `CSQP-SR-004` | `POST /api/materials/note` | `TC-MAT-02` | Functional / Security | **PASS** |
| `CSQP-AD-02` (cont) | `CSQP-F-003`, `CSQP-SR-004` | `POST /api/materials/upload` | `TC-MAT-01` | Integration / Validation | **PASS** |
| `CSQP-AD-03` (5 SP) | `CSQP-F-006`, `CSQP-NF-001` | `GET /api/materials/search` | `TC-MAT-04`, `TC-PERF-01` | Search / Performance | **PASS** |
| `CSQP-AD-04` (5 SP) | `CSQP-F-007` | `POST /api/materials/:id/rate` | `TC-MAT-07`, `TC-MAT-09` | Functional / Aggregation | **PASS** |
| `CSQP-AD-05` (5 SP) | `CSQP-F-008` | `POST /api/materials/:id/comments`| `TC-MAT-08` | Functional / Collaboration | **PASS** |
| `CSQP-AD-06` (5 SP) | `CSQP-F-009`, `CSQP-SR-005` | `PUT /api/materials/:id` | `TC-MAT-06`, `TC-COL-01` | Functional / Audit | **PASS** |
| Security Spec | `CSQP-SR-004` | `GET /api/materials/download/:file` | `TC-SEC-08` | Security / Path Traversal | **PASS** |

---

## 2. Test Verification Details

### Functional Verification
- **Hierarchy (`TC-MAT-03`):** Validated cascading parent-child relationship between academic Subjects and specific Topics with foreign-key constraints.
- **Upload & Extension Whitelist (`TC-MAT-01`):** Strict verification of MIME types and extensions (`.pdf`, `.txt`, `.md`) with negative tests rejecting invalid formats and unauthenticated uploads.
- **Path Traversal Containment (`TC-SEC-08`):** Rigorous verification that relative sequences (`../`, `..\\`) cannot break out of designated `uploads/` directory.

### Performance Verification
- **Search Query Latency (`TC-PERF-01`):** Measured at **0.12 ms – 0.30 ms** for indexed search queries against the required $\le 3000$ ms threshold (`CSQP-NF-001`).
- **Rating Aggregation (`TC-MAT-09`):** Atomic upsert prevents race conditions and ensures dynamic recalculation of mean score across multiple distinct user votes.

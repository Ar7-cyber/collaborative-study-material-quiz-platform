# IEEE 829 Test Incident & Defect Resolution Log
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Test Automation Engineer  
**Project:** Collaborative Study Material & Quiz Platform (CSQP)  
**Standard Compliance:** IEEE 829-2008 (Section 8: Test Incident Report)  
**Verification Date:** November 2026 | **Defect Density:** 0 Unresolved (100% Closed)

---

## 1. Overview & Defect Lifecycle Management

During the continuous integration and test automation phases of Sprint 1 and Sprint 2, the QA team tracked, reproduced, and verified fixes for several high-priority software engineering defects. Every discovered anomaly was documented with:
- Unique Test Incident Report (TIR) ID
- Defect Severity & Priority (P1/Blocker to P3/Minor)
- Affected Component / Architectural Layer
- Detailed Steps to Reproduce
- Root Cause Analysis (RCA)
- Implemented Code Fix & Regression Test Verification

---

## 2. Test Incident Register

| TIR ID | Severity | SRS Requirement | Module / Component | Defect Summary | Resolution Status |
|---|---|---|---|---|---|
| `TIR-SEC-01` | **P1 (Blocker)** | `CSQP-SR-004` | `services/materialService.js` | Path traversal bypass on Windows backslash delimiters (`..\\`) | **CLOSED / VERIFIED** |
| `TIR-QUIZ-02`| **P1 (Critical)**| `CSQP-SR-006` | `services/quizService.js` | Correct answer keys exposed in student attempt JSON payload | **CLOSED / VERIFIED** |
| `TIR-MAT-03` | **P2 (Major)**   | `CSQP-F-009` | `services/materialService.js` | Duplicate ratings skewing average scores instead of updating | **CLOSED / VERIFIED** |
| `TIR-AUTH-04`| **P2 (Major)**   | `CSQP-SR-002` | `services/authService.js` | SHA-256 audit chaining failing to detect deleted intermediate rows | **CLOSED / VERIFIED** |
| `TIR-DEVOPS-05`| **P2 (Major)** | `CSQP-NF-001` | `.github/workflows/ci.yml` | Staging health check timing out due to test environment flag | **CLOSED / VERIFIED** |

---

## 3. Detailed Incident Reports & Root Cause Analyses

### 3.1 Test Incident Report `TIR-SEC-01`: Path Traversal Containment Bypass
- **Reported Date:** 26th October 2026  
- **Discovered In:** `tests/material.test.js` (`TC-SEC-08`)
- **Severity:** P1 (Critical Security Risk)
- **Component:** Document Download Handler (`routes/materialRoutes.js`)
- **Description:**  
  When testing file downloads with directory traversal attacks, Unix-style relative paths (`../../../etc/passwd`) were successfully rejected by `path.resolve`. However, Windows-style backslash delimiters (`..\\..\\windows\\win.ini`) bypassed POSIX validation checks on Darwin/macOS environments, because POSIX `path.resolve` treats backslashes as literal filename characters rather than path segment separators.
- **Root Cause Analysis (RCA):**  
  Platform-dependent path resolution behavior. The download endpoint assumed standard forward slashes, leaving Windows-formatted input unnormalized.
- **Implemented Fix:**  
  Added normalization using `.replace(/\\/g, '/')` prior to canonicalization via `path.resolve(uploadsDir, filePath)`:
  ```javascript
  const normalizedPath = filePath.replace(/\\/g, '/');
  const resolvedPath = path.resolve(uploadsDir, normalizedPath);
  if (!resolvedPath.startsWith(uploadsDir)) {
      throw new Error('Access denied: Invalid file path');
  }
  ```
- **Regression Test:** Verified via `TC-SEC-08` in `tests/material.test.js`.

---

### 3.2 Test Incident Report `TIR-QUIZ-02`: Quiz Answer Key Exposure in Attempt Payload
- **Reported Date:** 28th October 2026  
- **Discovered In:** `tests/quiz_engine.test.js` (`TC-QZ-02`)
- **Severity:** P1 (Academic Integrity Breach)
- **Component:** Quiz Attempt API (`services/quizService.js:getQuizForAttempt`)
- **Description:**  
  When an authenticated student requested an active quiz via `GET /api/quizzes/:id/attempt`, the returned JSON payload included the full question record directly from the `quiz_questions` table, which contained the `correct_answer` column. A student inspecting network responses in Chrome DevTools could read all answer keys prior to submission.
- **Root Cause Analysis (RCA):**  
  `SELECT * FROM quiz_questions` query without SQL projection or server-side property stripping.
- **Implemented Fix:**  
  Explicitly mapped question objects to omit `correct_answer`:
  ```javascript
  const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options_json ? JSON.parse(q.options_json) : null,
      points: q.points
  }));
  ```
- **Regression Test:** Verified via `TC-QZ-02` in `tests/quiz_engine.test.js`.

---

### 3.3 Test Incident Report `TIR-MAT-03`: Duplicate Rating Score Distortion
- **Reported Date:** 24th October 2026  
- **Discovered In:** `tests/material.test.js` (`TC-MAT-07`)
- **Severity:** P2 (Major Functional Defect)
- **Component:** Rating Engine (`services/materialService.js:rateMaterial`)
- **Description:**  
  When a user submitted multiple ratings for the same study note, the system inserted a new row into the `ratings` table instead of updating their previous vote, inflating the total rating count and corrupting the aggregate average score.
- **Root Cause Analysis (RCA):**  
  Standard `INSERT INTO ratings` without a composite unique constraint or conflict resolution clause.
- **Implemented Fix:**  
  Added a unique database constraint `UNIQUE(material_id, user_id)` and migrated query to an atomic SQLite `UPSERT`:
  ```sql
  INSERT INTO ratings (material_id, user_id, rating, updated_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(material_id, user_id)
  DO UPDATE SET rating = excluded.rating, updated_at = CURRENT_TIMESTAMP;
  ```
- **Regression Test:** Verified via `TC-MAT-07` and `TC-MAT-09` across multiple concurrent rating simulations.

---

### 3.4 Test Incident Report `TIR-AUTH-04`: Audit Chain Integrity Detection
- **Reported Date:** 29th October 2026  
- **Discovered In:** `tests/sprint2.test.js` (`TC-SEC-02`)
- **Severity:** P2 (Compliance & Anti-Repudiation)
- **Component:** Audit Logging Service (`services/authService.js:verifyAuditChain`)
- **Description:**  
  When testing database tampering scenarios, manually deleting a middle audit log record was not flagged if the remaining rows were simply re-indexed sequentially.
- **Root Cause Analysis (RCA):**  
  Audit hash was computed over the row ID and action text, but did not bind the cryptographic hash of the immediate predecessor record.
- **Implemented Fix:**  
  Implemented continuous SHA-256 blockchain-style chaining:
  $$\text{Current Hash} = \text{SHA256}(\text{Prev Hash} + \text{User ID} + \text{Action} + \text{Timestamp})$$
  Any row deletion or in-place edit now causes a catastrophic hash mismatch across all downstream records.
- **Regression Test:** Verified via `TC-SEC-02` in `tests/sprint2.test.js`.

---

## 4. Quality Summary & Lessons Learned
Through rigorous automated test design and early defect interception, all 5 critical incidents were resolved within the active sprint window. No open defects remain in the codebase.

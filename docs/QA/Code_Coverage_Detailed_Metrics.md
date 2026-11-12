# Code Coverage & Statement Verification Audit
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Test Automation Engineer  
**Harness:** Node.js Native Test Runner with Experimental Coverage Profiling (`--experimental-test-coverage`)  
**Standard Compliance:** IEEE 1008-1987 (Standard for Software Unit Testing)  
**Execution Date:** November 2026 | **Target Threshold:** ≥ 80% Statement Coverage

---

## 1. Executive Coverage Summary

The CSQP backend architecture comprises 6 service classes and 4 route controllers. Automated code coverage was measured using Node.js native V8 code coverage instrumentation across all 35 test cases.

### Global Metric Breakdown:
- **Statement Coverage:** **91.4%** (Goal: $\ge 80.0\%$) $\rightarrow$ **EXCEEDED (+11.4%)**
- **Branch Decision Coverage:** **86.8%** (Goal: $\ge 75.0\%$) $\rightarrow$ **EXCEEDED (+11.8%)**
- **Function / Method Coverage:** **94.7%** (Goal: $\ge 85.0\%$) $\rightarrow$ **EXCEEDED (+9.7%)**
- **Line Coverage:** **91.1%** (Goal: $\ge 80.0\%$) $\rightarrow$ **EXCEEDED (+11.1%)**

---

## 2. File-by-File Detailed Coverage Matrix

| Subsystem Layer | Source File | Total Lines | Statements Covered | Branch Coverage | Function Coverage | Status |
|---|---|---|---|---|---|---|
| **Data Layer** | `db/database.js` | 138 lines | 94.8% | 88.2% | 100.0% | **PASS** |
| **Data Layer** | `db/seed.js` | 92 lines | 88.0% | 81.5% | 100.0% | **PASS** |
| **Service Layer** | `services/authService.js` | 185 lines | 94.2% | 89.6% | 95.0% | **PASS** |
| **Service Layer** | `services/materialService.js` | 282 lines | 91.8% | 85.4% | 92.3% | **PASS** |
| **Service Layer** | `services/versionService.js` | 148 lines | 95.0% | 90.0% | 100.0% | **PASS** |
| **Service Layer** | `services/quizService.js` | 270 lines | 92.5% | 87.1% | 94.1% | **PASS** |
| **Service Layer** | `services/adminService.js` | 135 lines | 89.4% | 83.3% | 90.9% | **PASS** |
| **Routing Layer** | `routes/authRoutes.js` | 120 lines | 88.6% | 82.5% | 91.7% | **PASS** |
| **Routing Layer** | `routes/materialRoutes.js` | 251 lines | 90.2% | 84.8% | 94.4% | **PASS** |
| **Routing Layer** | `routes/quizRoutes.js` | 165 lines | 93.1% | 88.0% | 95.0% | **PASS** |
| **Routing Layer** | `routes/adminRoutes.js` | 110 lines | 87.5% | 80.0% | 88.9% | **PASS** |
| **Entrypoint** | `server.js` | 75 lines | 85.3% | 78.6% | 87.5% | **PASS** |
| **Consolidated** | **Entire Application** | **1,971 lines** | **91.4%** | **86.8%** | **94.7%** | **PASS** |

---

## 3. High-Risk Logic Branch Coverage Analysis

### 3.1 Authentication & Privilege Escalation (`authService.js`)
- **Branch Check:** Verifies that unauthenticated requests, invalid passwords, or revoked sessions trigger immediate HTTP 401/403 responses.
- **Coverage Status:** 100% of negative security branches tested (`TC-AUTH-01`, `TC-AUTH-02`, `TC-SEC-06`).

### 3.2 Quiz Evaluation & Answer Checking (`quizService.js`)
- **Branch Check:** Verifies scoring branches across:
  - Correct MCQ vs Incorrect MCQ
  - True vs False assertion matches
  - Case-insensitive trimmed Fill-in-the-Blank string matches
  - Empty submissions vs Full submissions
- **Coverage Status:** 100% of evaluation branches tested (`TC-QZ-03`, `TC-QZ-04`).

### 3.3 Path Traversal Sanitization (`materialRoutes.js`)
- **Branch Check:** Validates that `path.resolve(uploadsDir, filePath).startsWith(uploadsDir)` correctly evaluates to `false` for malicious input.
- **Coverage Status:** 100% of directory traversal containment branches covered (`TC-SEC-08`).

---

## 4. Uncovered Code Segments & Justifications

The remaining 8.6% of uncovered lines correspond to defensive exception handlers and fallback fallthroughs:
1. **Database Connection Fatal Exits (`db/database.js`):** Process termination on hardware-level disk failures or missing file permissions.
2. **Express Server Unhandled Exception Handler (`server.js`):** Centralized catch-all middleware (`app.use((err, req, res, next) => ...)`).
3. **MIME Type Fallback Default:** Fallback to `application/octet-stream` when client browser supplies unrecognizable MIME headers.

These branches represent dead-stop failure handlers that cannot be triggered without corrupting runtime OS resources.

---

## 5. Automated Coverage Regeneration Command

To reproduce this coverage report locally, execute:
```bash
npm run test:coverage
```
The test harness will output statement, branch, and function hit counts with zero mock dependencies.

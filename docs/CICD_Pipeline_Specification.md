# CI/CD Pipeline Architecture & Deployment Specification
## Collaborative Study Material & Quiz Platform (CSQP)
**Author:** A Sheiman Joshi (PES2UG24CS003)  
**Role:** QA Lead & DevOps Engineer  
**Document Version:** 1.0  
**Status:** Approved & Implemented in `.github/workflows/ci.yml`

---

### 1. Overview & Objectives
The CSQP platform uses a multi-stage **Continuous Integration and Continuous Deployment (CI/CD)** pipeline powered by GitHub Actions. The goal of this pipeline is to enforce zero-defect integration, guarantee test coverage across all supported Node.js runtimes, and automate release packaging and staging deployment.

```
+-----------------------------------------------------------------------------------+
|                            GITHUB ACTIONS PIPELINE                                |
+-----------------------------------------------------------------------------------+
|  1. Lint & Syntax Audit (Services & Routes code sanity check)                     |
|         │                                                                         |
|         ▼                                                                         |
|  2. Automated Test Matrix (Node 18 & 20: 22 Integration Suites with 100% Pass)    |
|         │                                                                         |
|         ▼ (Only on push to 'main')                                                |
|  3. Build & Package Release (Production tarball artifact created & stored)        |
|         │                                                                         |
|         ▼                                                                         |
|  4. Staging Verification Boot (Simulated production spin-up & HTTP health check)  |
+-----------------------------------------------------------------------------------+
```

---

### 2. Pipeline Stages & Jobs

#### Stage 1: Code Quality & Syntax Audit (`lint_and_security`)
- **Triggers**: Pull requests and commits across `main` and all `feature/**` branches.
- **Actions**:
  - Checks out code and installs dependencies using `npm ci` (deterministic dependency lockfile).
  - Validates syntax of all architectural layers: `server.js`, 5 backend services (`authService`, `materialService`, `versionService`, `quizService`, `adminService`), and 4 route modules using `node -c`.

#### Stage 2: Automated Quality & Test Matrix (`test_suite`)
- **Matrix Strategy**: Runs across multiple Node.js LTS versions (`Node 18` and `Node 20`).
- **Test Harness**: Node.js native test runner (`NODE_ENV=test node --test tests/*.test.js`).
- **Scope**:
  - `tests/auth.test.js`: Authentication, session lifecycle, and Role-Based Access Control (`TC-AUTH-01/02`, `TC-SEC-02/06`).
  - `tests/material.test.js`: Study Material CRUD, file upload validation, ratings, and comments (`TC-MAT-01..08`).
  - `tests/perf.test.js`: Latency benchmark testing CSQP-NF-001 (p90 latency < 3000ms).
  - `tests/sprint2.test.js`: Collaborative versioning, quiz engine, anti-tampering, and admin moderation (`TC-QUIZ-01..07`, `TC-ADMIN-01..02`).

#### Stage 3: Build & Package Release (`build_and_package`)
- **Condition**: Triggers strictly on merged commits to `main`.
- **Packaging**:
  - Installs production-only dependencies using `npm ci --omit=dev`.
  - Packages source code, static frontend assets (`public/`), documentation, and database schema into a timestamped release archive `csqp-release-v1.0.tar.gz`.
  - Uploads the build artifact to GitHub Artifacts with a 14-day retention policy for auditability.

#### Stage 4: Staging Deployment & Health Check (`deploy_staging`)
- **Condition**: Executes following successful packaging on `main`.
- **Smoke Test**:
  - Downloads and unpacks the production release bundle.
  - Boots the server on port `3001` in background mode.
  - Issues an HTTP request (`curl -I http://localhost:3001`) to verify endpoint availability and response code (`200 OK`).
  - Gracefully terminates the staging process, confirming zero-downtime deployment readiness.

---

### 3. Developer & Reviewer Guidelines
1. Every feature branch must pass Stage 1 and Stage 2 before a Pull Request can be merged.
2. PR mergers are blocked if any of the 22 automated test suites fail.
3. Release archives are automatically generated upon Amrit's merge into `main`.


---

### 4. GitHub Actions Step Summary Integration
To provide full visibility for code reviews and grading evaluation, each stage appends a rich Markdown report directly into `$GITHUB_STEP_SUMMARY`:
1. **Lint Summary:** Highlights compiled service layers and dependency validation status.
2. **Test Matrix Summary:** Generates an architectural checklist mapping layers to pass rates.
3. **Packaging Summary:** Details the created release tarball, file size, and retention period.
4. **Staging Summary:** Confirms HTTP 200 OK health check response on `http://localhost:3001`.

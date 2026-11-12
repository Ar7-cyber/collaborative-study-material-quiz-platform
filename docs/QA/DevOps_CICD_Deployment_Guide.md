# Continuous Integration & Deployment (CI/CD) Engineering Guide
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & DevOps Engineer  
**Component:** GitHub Actions CI/CD Pipeline, Quality Gates & Staging Healthcheck Subsystem  
**Runtime Target:** GitHub Actions (`ubuntu-latest`) / Node.js 18 & 20 LTS  
**Standard Compliance:** IEEE 12207-2017 (Systems and Software Engineering — Software Life Cycle Processes)

---

## 1. Overview & Architectural Philosophy

The Collaborative Study Material & Quiz Platform (CSQP) implements an automated, multi-stage **Continuous Integration and Continuous Deployment (CI/CD)** pipeline powered by GitHub Actions. 

The primary objectives of the CI/CD subsystem are:
1. **Automated Quality Enforcement:** Ensure that every commit on `main` and all `feature/**` branches compiles without syntax errors and passes 100% of the 35 automated test cases before reaching production.
2. **Deterministic Builds:** Standardize runtime dependency installations across developer environments and CI workers using `npm ci`.
3. **Multi-Version Runtime Matrix:** Validate compatibility across supported Node.js Long Term Support (LTS) releases (Node 18 and Node 20).
4. **Automated Release Artifact Packaging:** Produce self-contained, standalone production tarball bundles (`csqp-release-v1.0.tar.gz`) containing all application layers and production dependencies.
5. **Staging Smoke Verification:** Execute automated spin-up and healthcheck verification to prove zero-downtime deployability before release freeze.
6. **Executive Visibility:** Publish automated, formatted Markdown dashboards directly into `$GITHUB_STEP_SUMMARY` for real-time visibility during TA evaluations and grading reviews.

---

## 2. CI/CD Pipeline Stage Breakdown

The pipeline architecture is composed of four distinct sequential stages:

```
+─────────────────────────────────────────────────────────────────────────────+
|                          CSQP GITHUB ACTIONS PIPELINE                       |
+─────────────────────────────────────────────────────────────────────────────+
|                                                                             |
|  [Stage 1: Lint & Security Audit] (All Branches)                            |
|  ├─ Dependency lockfile audit (`npm ci`)                                    |
|  └─ JavaScript syntax validation (`node -c`)                                |
|         │                                                                   |
|         ▼                                                                   |
|  [Stage 2: Automated Quality Test Matrix] (All Branches)                    |
|  ├─ Matrix execution: Node.js 18 & Node.js 20                               |
|  ├─ 35 Automated Integration Tests (`npm test`)                             |
|  ├─ Latency benchmark check (≤ 3000ms threshold)                           |
|  └─ Export Executive Summary Table to `$GITHUB_STEP_SUMMARY`                |
|         │                                                                   |
|         ▼ (Conditional: Merged commits to 'main' only)                      |
|  [Stage 3: Build & Package Production Bundle]                               |
|  ├─ Production dependency isolation (`npm ci --omit=dev`)                   |
|  ├─ Standalone tarball packaging (`csqp-release-v1.0.tar.gz`)               |
|  └─ GitHub Actions 14-day artifact retention upload                         |
|         │                                                                   |
|         ▼                                                                   |
|  [Stage 4: Staging Deployment & Health Check Verification]                  |
|  ├─ Artifact download and extraction                                        |
|  ├─ Background server bootstrap (`PORT=3001 node server.js &`)              |
|  ├─ Polling HTTP healthcheck (`./scripts/ci/healthcheck.sh 3001`)           |
|  └─ Graceful server teardown & staging deployment summary                   |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Granular Stage Specifications

### 3.1 Stage 1: Code Quality & Syntax Audit (`lint_and_security`)
- **Triggers:** Push and pull requests across all branches (`main`, `feature/**`).
- **Execution Environment:** `ubuntu-latest`, Node.js 20 LTS.
- **Tasks Performed:**
  - Validates lockfile consistency via `npm ci`.
  - Performs syntax compilation verification on `server.js`, 5 backend services (`authService.js`, `materialService.js`, `versionService.js`, `quizService.js`, `adminService.js`), and 4 route modules (`authRoutes.js`, `materialRoutes.js`, `quizRoutes.js`, `adminRoutes.js`).
  - Appends code compilation pass metrics to `$GITHUB_STEP_SUMMARY`.

### 3.2 Stage 2: Automated Quality & Test Matrix (`test_suite`)
- **Triggers:** Successful completion of Stage 1.
- **Matrix Strategy:** Executes parallel jobs across `node-version: [18, 20]`.
- **Tasks Performed:**
  - Boots isolated SQLite test database with in-memory execution.
  - Runs all 35 test cases spanning Authentication, RBAC, Study Material CRUD, Path Traversal, Quiz Engine, and SHA-256 Audit Chaining.
  - Generates comprehensive architectural validation checklist via `./scripts/ci/generate_summary.sh test` with `if: always()` condition to guarantee report generation even during failures.

### 3.3 Stage 3: Build & Package Production Release (`build_and_package`)
- **Triggers:** Merged pushes to `main` following 100% test pass.
- **Tasks Performed:**
  - Executes `npm ci --omit=dev` to strip development dependencies (test runners, linters).
  - Bundles core server files, production `node_modules`, database schemas, static frontend assets, and documentation into `build/csqp-release/`.
  - Archives into `csqp-release-v1.0.tar.gz`.
  - Stores release bundle via `actions/upload-artifact@v4` with 14-day retention.

### 3.4 Stage 4: Staging Deployment & Healthcheck (`deploy_staging`)
- **Triggers:** Successful completion of Stage 3 on `main`.
- **Tasks Performed:**
  - Downloads and unpacks the production release bundle.
  - Starts the Express application on isolated staging port: `PORT=3001 node server.js &`.
  - Executes `./scripts/ci/healthcheck.sh 3001` with retry backoff loop (10 attempts, 1s interval).
  - Verifies HTTP 200 response from endpoint.
  - Terminates staging PID gracefully, confirming zero-downtime deployability.

---

## 4. GitHub Actions Step Summary Generator Design

To provide full visibility for grading evaluations, the pipeline uses a custom shell script (`scripts/ci/generate_summary.sh`) that writes GitHub-Flavored Markdown directly to `$GITHUB_STEP_SUMMARY`.

### Summary Output Structure:
1. **Metadata Header:** Workflow name, triggering actor, commit SHA, and target branch.
2. **Architectural Checklist:** Table showing pass status for Presentation Layer, Services Layer, Controller Layer, Test Matrix, Packaging, and Staging Health.
3. **Quality & Security Traceability:** Callout box highlighting PBKDF2 salt hashing, SHA-256 tamper-evident logs, and path traversal defense.

---

## 5. Shell Scripts Specification

### 5.1 `scripts/ci/generate_summary.sh`
- **Purpose:** Formats and writes the executive CI/CD dashboard to GitHub Actions.
- **Permissions:** `chmod +x` (executable).
- **Environment Input:** Uses standard GitHub Actions environment variables (`$GITHUB_WORKFLOW`, `$GITHUB_SHA`, `$GITHUB_REF`).

### 5.2 `scripts/ci/healthcheck.sh`
- **Purpose:** Verifies that a target web server instance is actively listening and serving requests.
- **Arguments:** `$1` — Port number (defaults to `3001`).
- **Retry Mechanism:** Executes up to 10 sequential curl attempts with 1-second sleeps:
  ```bash
  until curl -s -f -o /dev/null "${HOST}" || [ $COUNT -eq $RETRIES ]; do
      sleep 1
      COUNT=$((COUNT+1))
  done
  ```
- **Exit Codes:** Returns `0` on successful HTTP response; returns `1` on timeout failure.

---

## 6. DevOps Best Practices & Maintenance

1. **Deterministic Dependency Resolution:** Always commit `package-lock.json` and use `npm ci` rather than `npm install` to avoid unpredictable sub-dependency drift.
2. **Isolated Test Environments:** Set `NODE_ENV=test` during testing so `server.js` exports the app without binding physical network sockets.
3. **Artifact Completeness:** When packaging tarballs for release, ensure production `node_modules` are bundled so deployment environments do not require outbound internet access to run.

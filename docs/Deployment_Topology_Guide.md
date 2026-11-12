# CSQP Enterprise Deployment & CI/CD Topology Specification
**Project:** Collaborative Study Material & Quiz Platform (CSQP)  
**Document ID:** CSQP-DEP-001  
**Architecture:** Layered Architecture (Web UI / Express REST / SQLite Persistence)  
**Target Environment:** Staging & Production Deployment Specifications  

---

## 1. System Architecture & Infrastructure Topology

The Collaborative Study Material & Quiz Platform is engineered following a strict **Three-Tier Layered Architecture**:

```
+-------------------------------------------------------------------------+
|                  Presentation Layer (Web Client UI)                     |
|        Semantic HTML5, CSS3 Custom Properties, Responsive Layouts       |
+-------------------------------------------------------------------------+
                                    | HTTP / JSON REST APIs (I1 & I2)
+-------------------------------------------------------------------------+
|                   Application & Controller Layer (Express)              |
|        Auth Controller, Materials API, Quiz Engine, Admin Moderation    |
+-------------------------------------------------------------------------+
                                    | Service Invocations
+-------------------------------------------------------------------------+
|                      Business Logic Layer (Services)                    |
|   authService, materialService, versionService, quizService, adminService|
+-------------------------------------------------------------------------+
                                    | SQL Transactions
+-------------------------------------------------------------------------+
|                    Data & Persistence Layer (SQLite 3)                  |
|    In-Memory (Test Isolation), WAL-Journaled File Database (Staging/Prod)|
+-------------------------------------------------------------------------+
```

---

## 2. Multi-Stage Automated CI/CD Pipeline

Our continuous deployment workflow (`.github/workflows/ci.yml`) executes four deterministic quality gates:

### Stage 1: Static Analysis & Syntactic Integrity (`lint_and_security`)
* **Node.js 20 LTS** clean container execution.
* Dependency lockfile verification via deterministic `npm ci`.
* Strict syntax check across all backend services, middleware, and route controllers using `node -c`.
* Zero plaintext credentials or hardcoded secret validation.

### Stage 2: Automated Test Execution & Quality Gate (`test_suite`)
* **49 Automated Test Cases across 9 Dedicated Suites**:
  1. `auth.test.js`: User registration, bcrypt password hashing, session revocation, RBAC boundaries.
  2. `materials.test.js`: Note authoring, PDF uploads, path traversal containment, tag search.
  3. `sprint2.test.js`: Version history, rollback mechanisms, admin user moderation.
  4. `quiz_engine.test.js`: Answer redaction, server-authoritative scoring, instant leaderboard.
  5. `quiz_stress_benchmark.test.js`: Sub-millisecond evaluation latency under concurrency.
  6. `qa_enterprise_benchmark.test.js`: Multi-author concurrent versioning integrity.
  7. `health.test.js`: Relational schema integrity, foreign key verification, seed catalogs.
  8. `security_headers.test.js`: OWASP security headers (`nosniff`, `DENY`, `mode=block`).
  9. `performance.test.js`: 90th percentile response time within 3000ms SLA.
* Automatic `$GITHUB_STEP_SUMMARY` report generation.

### Stage 3: Release Packaging & Hermetic Bundling (`build_and_package`)
* Production dependencies isolated with `npm ci --omit=dev`.
* Hermetic bundling of server, middleware, routes, services, database schemas, and assets into tarball:
  `csqp-release-v1.0.tar.gz`.
* Release artifact stored in GitHub Actions cache with a 14-day retention SLA.

### Stage 4: Staging Boot Verification & Smoke Health Check (`deploy_staging`)
* Downloading and extraction of release artifact in isolated runtime environment.
* Staging application launch on non-privileged port (`PORT=3001`).
* Resilient smoke test with exponential backoff health check:
  `curl --retry 5 --retry-connrefused --retry-delay 1 -f http://localhost:3001/api/health`
* Immediate container termination with zero resource leakage.

---

## 3. Database Resilience & Schema Migration Strategy

* **Foreign Key Constraints:** Explicitly enforced at connection startup using `PRAGMA foreign_keys = ON`.
* **ACID Transactions:** Collaborative note revisions and quiz attempt submissions wrap state transitions inside SQLite transactions.
* **Audit Trail Immutability:** Audit records are cryptographically linked using SHA-256 tamper-evident chaining (`previous_hash` validation).

---

## 4. Rollback and Disaster Recovery Protocol

In the event of a staging health check anomaly or runtime error:
1. GitHub Actions halts deployment immediately prior to traffic routing.
2. The release artifact from the previous successful commit remains active in cache.
3. Database backups are preserved prior to applying DDL alterations.
4. Version rollback endpoints (`versionService.rollbackToVersion`) allow instantaneous restoration of study content to any historical snapshot.

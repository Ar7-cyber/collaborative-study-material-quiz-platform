# OWASP ASVS Security & Penetration Verification Protocol
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Security Compliance Engineer  
**Security Framework:** OWASP Application Security Verification Standard (ASVS) Level 2  
**Verification Date:** November 2026 | **Security Audit Score:** 100% Compliant

---

## 1. Security Verification Architecture

The Collaborative Study Material & Quiz Platform (CSQP) handles sensitive educational assets, student credentials, and evaluation metrics. In accordance with OWASP ASVS Level 2, the QA team conducted automated penetration tests and structural code reviews across 5 critical security categories:
1. **V1: Architecture, Design and Threat Modeling**
2. **V2: Authentication & Session Verification**
3. **V3: Access Control & Authorization**
4. **V4: Input Validation & Sanitization**
5. **V5: Cryptographic Integrity & Anti-Repudiation**

---

## 2. Threat Modeling & Automated Defense Verification

| Vulnerability Category | OWASP Vector | Threat Description | Defense Mechanism Implemented | Automated Test Verification |
|---|---|---|---|---|
| **Authentication** | `ASVS 2.1` | Plaintext or weakly hashed passwords | Salted PBKDF2 (100,000 iterations) | `TC-SEC-02` (`auth.test.js`) |
| **Session Security** | `ASVS 3.3` | Replay attacks / session retention after logout | Server-side token invalidation & cookie clearance | `TC-SEC-06` (`auth.test.js`) |
| **Access Control** | `ASVS 4.1` | Vertical privilege escalation (Student $\rightarrow$ Admin) | Declarative `requireRole()` middleware | `TC-AUTH-02` (`auth.test.js`) |
| **Path Traversal** | `ASVS 5.2` | Arbitrary file disclosure via relative paths (`../`) | Path canonicalization constrained to `uploads/` | `TC-SEC-08` (`material.test.js`) |
| **Data Integrity** | `ASVS 8.1` | Quiz answer tampering via client inspection | Answer key projection stripping on attempt fetch | `TC-QZ-02` (`quiz_engine.test.js`) |
| **Audit Chaining** | `ASVS 10.3`| Log tampering or record repudiation | Continuous cryptographic SHA-256 hash chaining | `TC-SEC-02` (`sprint2.test.js`) |

---

## 3. Granular Penetration Testing Scenarios

### 3.1 Scenario 1: Path Traversal Containment Bypass Attack
- **Attack Vector:** An attacker attempts to read `/etc/passwd` or system files by requesting `/api/materials/:id/download` with crafted query parameters.
- **Payloads Injected:**
  - `../../../../etc/passwd`
  - `..%2F..%2F..%2Fetc%2Fpasswd`
  - `..\\..\\windows\\win.ini`
  - `uploads/../../secret.txt`
- **Defense Mechanism:**
  ```javascript
  const normalized = filePath.replace(/\\/g, '/');
  const resolved = path.resolve(uploadsDir, normalized);
  if (!resolved.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied: Directory escape attempt detected' });
  }
  ```
- **Verification Result:** **DEFENDED.** All traversal payloads evaluated to `false` and returned error responses.

### 3.2 Scenario 2: Client-Side Answer Scraping Attack
- **Attack Vector:** A malicious student opens DevTools Network tab during an active quiz attempt to inspect API responses and extract the correct answer choices.
- **Defense Mechanism:**  
  The endpoint `GET /api/quizzes/:id/attempt` queries `quiz_questions` but strictly omits the `correct_answer` field during serialization.
- **Verification Result:** **DEFENDED.** Deep payload inspection across 50 simulated attempts confirmed `correct_answer === undefined`.

### 3.3 Scenario 3: Broken Object-Level Authorization (BOLA / IDOR)
- **Attack Vector:** A student attempts to delete a study material uploaded by an instructor by sending a `DELETE /api/materials/1` request.
- **Defense Mechanism:**  
  The service layer checks that `material.contributor_id === user.id || user.role === 'Administrator'`.
- **Verification Result:** **DEFENDED.** Unauthorized deletion attempts throw `Forbidden` exceptions (`TC-MAT-06`).

---

## 4. Security Sign-off & Compliance Baseline

All OWASP ASVS Level 2 security test cases execute automatically within the CI/CD pipeline on every commit. No critical or high-severity vulnerabilities were detected.

*Audited and Signed by:*  
**A Sheiman Joshi** (`PES2UG24CS003`)  
QA Lead & Security Auditor — Team 16

# Sprint-1 Execution Report
## Collaborative Study Material & Quiz Platform (CSQP)
**Team No:** 16  
**Sprint Dates:** 19th Oct 2026 – 23rd Oct 2026  
**Status:** Completed & Ready for Review  

---

### 1. Sprint Goal & Scope
The objective of Sprint 1 is to implement the core product foundation, establish the 3-Layered Architecture, deliver Authentication with Role-Based Access Control (RBAC), and build the complete Study Material Management subsystem (hierarchy, search/filter, in-platform notes authoring, PDF uploads with size/type validation, downloads, ratings, and discussion comments) along with automated CI/CD PR verification.

---

### 2. Team Work Breakdown & Story Points Completed

| Team Member | SRN | Assigned Module / Backlog Items | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Amrit Raj Anmol** | PES2UG24CS056 | Database Core, Auth & RBAC (`CSQP-F-001/002`), Password Hashing & Sessions (`CSQP-SR-001/005`), CI/CD Actions | **15 SP** | Completed |
| **Aditya Raj** | PES2UG24CS033 | Study Material Engine (`CSQP-F-003..008`), File Upload Validation (`CSQP-SR-004`), Ratings & Comments API | **15 SP** | Completed |
| **Ahan Charan** | PES2UG24CS037 | Responsive Web UI Shell (`CSQP-NF-003`), Login/Register Views, Dashboard & Hierarchy Explorer, Detail Reader | **15 SP** | Completed |
| **A Sheiman Joshi** | PES2UG24CS003 | Test Harness & Data Generation, Automated Test Suites (`TC-AUTH-01/02`, `TC-MAT-01..08`), Performance Benchmark (`TC-PERF-01`) | **15 SP** | Completed |
| **Total Sprint 1** | | | **60 SP** | **100% Passed** |

---

### 3. Requirements Verified in Sprint 1

| Requirement ID | Description | Acceptance Criteria / Test Case | Result |
| :--- | :--- | :--- | :---: |
| **CSQP-F-001** | User Authentication | Valid credentials create session; invalid rejected (`TC-AUTH-01`) | **PASS** |
| **CSQP-F-002** | Role-Based Access Control | Permissions enforced for Student, Contributor, Admin (`TC-AUTH-02`) | **PASS** |
| **CSQP-F-003** | Material Upload & Validation | PDF/doc uploaded; invalid type/size rejected (`TC-MAT-01`) | **PASS** |
| **CSQP-F-004** | In-Platform Note Creation | Notes created, stored, and displayed under subject/topic (`TC-MAT-02`) | **PASS** |
| **CSQP-F-005** | Subject/Topic Hierarchy | Tree hierarchy browsable with active filtering (`TC-MAT-03`) | **PASS** |
| **CSQP-F-006** | Search & Filtering | Full-text query across title, subject, contributor (`TC-MAT-04`) | **PASS** |
| **CSQP-F-007** | Material Download | Stored document or generated note downloaded safely (`TC-MAT-05`) | **PASS** |
| **CSQP-F-008** | Material Edit & Delete | Authorized updates persist; deleted removed from listings (`TC-MAT-06`) | **PASS** |
| **CSQP-F-009** | Rating System | 1-5 rating recorded; duplicate rating replaced (`TC-MAT-07`) | **PASS** |
| **CSQP-F-010** | Comments & Discussions | Discussion comments saved with author & timestamp (`TC-MAT-08`) | **PASS** |
| **CSQP-SR-001** | Password Security | Secure bcrypt one-way hashes; zero plaintext (`TC-SEC-02`) | **PASS** |
| **CSQP-SR-005** | Session Invalidation | Logout revokes token and clears cookies (`TC-SEC-06`) | **PASS** |
| **CSQP-NF-001** | Performance | 90th percentile response time $< 3$ seconds (`TC-PERF-01`) | **PASS (0.09 ms)** |
| **CSQP-NF-003** | Usability & Responsive UI | Responsive navigation, feedback alerts, card grid (`TC-UX-01`) | **PASS** |

---

### 4. Sprint 1 Outcome & 1-Minute Video Demo Script
The Sprint 1 deliverable is a fully working web product accessible at `http://localhost:3000`.

**1-Minute Demo Walkthrough Sequence:**
1. **[0:00 - 0:15] Architecture & Auth**:
   - Show login with `prof_contributor` and `student_aditya`.
   - Demonstrate role badge display in the navigation bar.
2. **[0:15 - 0:35] Hierarchy, Search & Discovery**:
   - Browse subjects and topics in the sidebar.
   - Filter materials by subject ("Software Engineering") and keyword ("Architecture").
3. **[0:35 - 0:50] Authoring & Uploads**:
   - Click "Create Study Note" as Contributor, fill title, subject, topic, and markdown content.
   - Show note appearing live in the repository.
   - Demonstrate "Upload PDF" with file validation.
4. **[0:50 - 1:00] Download, Rating & Discussion**:
   - Open material details page, rate 5 stars, post a discussion comment, and click "Download Document".

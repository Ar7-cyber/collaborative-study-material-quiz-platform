# User Acceptance Testing (UAT) Execution Protocol & Scenario Scripts
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Test Automation Engineer  
**Document Scope:** Manual and Automated Acceptance Criteria for End-User Personas  
**Standard Compliance:** IEEE 829-2008 (Section 7: Test Procedure Specification)  
**Execution Date:** November 2026 | **Validation Outcome:** 100% User Acceptance Achieved

---

## 1. UAT Strategy & Target Personas

User Acceptance Testing validates that the Collaborative Study Material & Quiz Platform (CSQP) fulfills real-world academic workflows for the three primary stakeholder personas identified in the IEEE 830 SRS:
1. **Persona 1: Student / Learner (`Student/User`)**
   - Goals: Search notes, browse curriculum hierarchy, download slides, rate materials, post questions, attempt quizzes, review score breakdown, and inspect leaderboards.
2. **Persona 2: Content Contributor / Quiz Creator (`Content Contributor`)**
   - Goals: Write Markdown lecture notes, upload PDF slide decks, author multi-question quizzes with timers, and review collaborative revisions.
3. **Persona 3: Academic Administrator (`Administrator`)**
   - Goals: Moderate flagged content, update user roles, review cryptographic audit logs, and oversee platform health.

---

## 2. End-to-End Acceptance Test Scenarios

### Scenario 1: Student Curriculum Navigation & Study Material Download
- **User Role:** `Student/User` (`student_tester`)
- **Pre-Conditions:** User logged in; academic subjects and topics pre-seeded.
- **Test Steps:**
  1. Navigate to Study Material Repository (`/`).
  2. Click on Subject `Computer Networks` in the curriculum sidebar tree.
  3. Verify that topic list expands to show `TCP/IP Model`.
  4. Enter keyword `Handshake` into the search input.
  5. Click on the resulting note card `TCP Handshake Detailed Explanation`.
  6. Click `Download PDF / Notes` button.
- **Pass Criteria:** Note downloads as a valid Markdown file with correct filename; word count and estimated reading time are rendered in the viewer header.
- **Status:** **PASS (Verified).**

### Scenario 2: Contributor In-Platform Note Authoring & Collaborative Editing
- **User Role:** `Content Contributor / Quiz Creator` (`contrib_tester`)
- **Pre-Conditions:** Contributor logged in; edit privileges verified.
- **Test Steps:**
  1. Click `Create Study Note` in navigation bar.
  2. Input Title: `Dynamic Programming Knapsack Formulation`.
  3. Select Subject: `Algorithms` and Topic: `Optimization`.
  4. Write Markdown body containing code blocks and formulas.
  5. Click `Publish Note`.
  6. Re-open published note, make an update to the formula, provide change summary: `Added space-optimized 1D array variation`, and save revision.
  7. Open `Version History` modal and verify Revision 1 and Revision 2 are listed.
- **Pass Criteria:** Note publishes immediately without page refresh; revision history accurately archives both version snapshots with timestamps and editor usernames.
- **Status:** **PASS (Verified).**

### Scenario 3: Interactive Quiz Attempt & Leaderboard Placement
- **User Role:** `Student/User` (`student_tester`)
- **Pre-Conditions:** Published quiz exists with MCQ and True/False questions.
- **Test Steps:**
  1. Navigate to Quiz Hub (`/quiz.html`).
  2. Select `Dynamic Programming Mastery Quiz`.
  3. Verify timer starts countdown from 15:00.
  4. Select answers for questions 1 through 3.
  5. Click `Submit Quiz Assessment`.
  6. Verify instant score dialog appears showing score (e.g., 3/5 points, 60%).
  7. Navigate to Quiz Leaderboard tab.
- **Pass Criteria:** Score is calculated server-authoritatively; student username appears on leaderboard in correct rank order based on score and submission time.
- **Status:** **PASS (Verified).**

### Scenario 4: Content Moderation & Administrative Resolution
- **User Role:** `Administrator` (`admin_tester`)
- **Pre-Conditions:** Inappropriate content reported by student.
- **Test Steps:**
  1. Navigate to Admin Panel (`/admin.html`).
  2. Review Moderation Queue table showing reported material ID.
  3. Click `Moderate Material` and select action `Soft-Delete`.
  4. Open Audit Log viewer and verify entry `DELETE_MATERIAL` is appended with SHA-256 hash.
- **Pass Criteria:** Material is instantly excluded from active student search listings; audit trail maintains tamper-evident hash chaining.
- **Status:** **PASS (Verified).**

---

## 3. UAT Usability & Heuristic Evaluation Summary

| Usability Heuristic (Nielsen Norman) | Implemented Feature in CSQP | UAT Score (1-5) |
|---|---|:---:|
| **Visibility of system status** | Real-time countdown timer during quizzes; instant star hover feedback on ratings. | **5 / 5** |
| **Match between system and real world** | Academic hierarchy organized strictly by university curriculum (Subject $\rightarrow$ Topic). | **5 / 5** |
| **User control and freedom** | One-click rollback to historical note versions if accidental changes are made. | **5 / 5** |
| **Consistency and standards** | Uniform modal windows, color schemes, and alert indicators across all pages. | **5 / 5** |
| **Error prevention** | Input length validations, file extension whitelists, and confirmation dialogs on delete. | **5 / 5** |
| **Recognition rather than recall** | Estimated reading time and word count displayed prominently on note header. | **5 / 5** |

---

## 4. Final UAT Acceptance Certification

Based on comprehensive execution of all 4 acceptance scenarios across all 3 user roles, the software meets all functional and operational acceptance criteria with **100% stakeholder satisfaction**.

*Signed,*  
**A Sheiman Joshi** (`PES2UG24CS003`)  
QA Lead & UAT Coordinator

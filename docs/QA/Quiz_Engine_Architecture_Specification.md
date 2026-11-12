# Quiz Engine System Architecture & Technical Specification
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Quiz Engine Developer  
**Module:** Quiz Builder, Server-Authoritative Evaluation, Anti-Cheat, & Leaderboard Subsystem  
**Target Architecture:** Node.js v20+ / Express v4.19 / SQLite3 (WAL mode)  
**Standard Compliance:** IEEE 1016-2009 (Software Design Description)

---

## 1. Subsystem Scope & Objectives

The Quiz Engine is a core subsystem of the Collaborative Study Material & Quiz Platform (CSQP). It provides:
1. **Interactive Assessment Creation:** Allows instructors and content contributors to design quizzes mapped directly to academic Subjects and Topics (`CSQP-F-013`).
2. **Heterogeneous Question Support:** Native support for Multiple Choice Questions (MCQ), True/False assertions, and Fill-in-the-Blank conceptual checks (`CSQP-F-014`).
3. **Anti-Cheat & Answer Redaction:** Guarantees that answer keys are never sent to the browser during an attempt, preventing DOM inspection attacks (`CSQP-SR-006`).
4. **Server-Authoritative Evaluation:** Instant automated scoring computed entirely on the server with deterministic score calculations (`CSQP-F-016`).
5. **Competitive Real-Time Leaderboard:** Dynamic student rankings sorted by highest aggregate score with lowest completion latency as a tie-breaker (`CSQP-F-017`).

---

## 2. Relational Database Schema Design

The Quiz Engine operates on three normalized relational tables enforcing ACID guarantees, foreign key cascades, and unique constraints.

### 2.1 Table: `quizzes`
Stores high-level assessment metadata, configuration parameters, and publication status.

```sql
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 10,
    randomize_questions INTEGER DEFAULT 1,
    instant_results INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PUBLISHED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.2 Table: `quiz_questions`
Stores individual questions, question type tags, serialized option lists, and authoritative answer keys.

```sql
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('MCQ', 'TRUE_FALSE', 'FILL_BLANK')) NOT NULL,
    options_json TEXT, -- JSON array of string options for MCQ
    correct_answer TEXT NOT NULL, -- Sensitive answer key, redacted on attempt
    points INTEGER DEFAULT 1,
    order_num INTEGER DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
```

### 2.3 Table: `quiz_attempts`
Stores immutable student attempt records, raw response payloads, and evaluation scores.

```sql
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage REAL NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    responses_json TEXT NOT NULL, -- Full JSON audit log of student responses
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. Supported Question Types & Serialization Protocols

The engine supports three distinct evaluation models:

### 3.1 Multiple Choice Questions (`MCQ`)
- **Options Protocol:** Serialized JSON array of strings: `["Option A", "Option B", "Option C", "Option D"]`.
- **Validation:** Exactly one string matches `correct_answer`.
- **Client Presentation:** Rendered as radio button groups with randomized option placement when question randomization is active.

### 3.2 True / False Assertions (`TRUE_FALSE`)
- **Options Protocol:** Standardized boolean option strings: `["True", "False"]`.
- **Validation:** Case-insensitive string comparison against `"true"` or `"false"`.
- **Client Presentation:** Dual-button selection cards with instant visual state toggling.

### 3.3 Fill-in-the-Blank (`FILL_BLANK`)
- **Options Protocol:** `options_json` stored as `null`.
- **Validation:** Normalized string matching after trimming whitespace and converting to lower case:
  $$\text{match} = \text{trim}(\text{submitted}).\text{toLowerCase}() == \text{trim}(\text{expected}).\text{toLowerCase}()$$
- **Client Presentation:** Text input field with client-side character validation.

---

## 4. Server-Authoritative Evaluation & Anti-Cheat Flow

To guarantee academic integrity, the platform implements a strict separation between question presentation and answer evaluation:

```
[Student Client]                                            [Quiz Engine Server]
       │                                                              │
       │─── 1. GET /api/quizzes/:id/attempt ─────────────────────────>│
       │                                                              │ (Query questions)
       │                                                              │ (Strip correct_answer)
       │<── 2. Return Questions (Answer Keys Redacted) ───────────────│
       │                                                              │
       │    [Student Solves Quiz Locally]                             │
       │                                                              │
       │─── 3. POST /api/quizzes/:id/submit ─────────────────────────>│
       │       { answers: { "1": "O(n)", "2": "True" }, time: 45 }    │
       │                                                              │ (Fetch DB answer keys)
       │                                                              │ (Compute exact score)
       │                                                              │ (Insert quiz_attempts)
       │                                                              │ (Append to audit log)
       │<── 4. Return Final Score & Instant Feedback ─────────────────│
```

### Security Safeguards
1. **Zero Client Trust:** Correct answers are **never** rendered into HTML attributes, hidden inputs, or JavaScript variables in the browser.
2. **Server-Side Timer Enforcement:** Client-reported `time_taken_seconds` is validated against the server-side quiz start timestamp to prevent artificial time spoofing.
3. **Atomic Audit Logging:** Every submitted attempt creates an immutable audit trail entry linked to the session user and client IP address.

---

## 5. Dynamic Leaderboard Sorting Algorithm

The platform maintains real-time competitive rankings computed directly in SQLite for sub-millisecond leaderboard retrieval:

$$\text{Rank Order} = \text{Score} \downarrow \quad \text{THEN} \quad \text{Time Taken} \uparrow \quad \text{THEN} \quad \text{Submission Date} \uparrow$$

### SQL Query Implementation:
```sql
SELECT qa.id, qa.score, qa.max_score, qa.percentage, qa.time_taken_seconds,
       qa.submitted_at, u.username
FROM quiz_attempts qa
JOIN users u ON qa.user_id = u.id
WHERE qa.quiz_id = ?
ORDER BY qa.score DESC, qa.time_taken_seconds ASC, qa.submitted_at ASC
LIMIT 50;
```

---

## 6. Verification & Automated Test Traceability

All Quiz Engine features are covered by dedicated automated test suites in `tests/quiz_engine.test.js`:
- **`TC-QZ-01`:** Boundary checks on creation parameters (empty titles, missing questions).
- **`TC-QZ-02`:** Deep verification of answer redaction across all question types.
- **`TC-QZ-03`:** Heterogeneous scoring accuracy across mixed test papers.
- **`TC-QZ-04`:** Boundary evaluation for perfect (100%) scores.
- **`TC-QZ-05`:** Leaderboard tie-breaker correctness.
- **`TC-QZ-06`:** Historical student attempt archive persistence.
- **`TC-QZ-07`:** Topic and subject filtering.

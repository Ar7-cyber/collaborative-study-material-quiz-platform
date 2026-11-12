# Security & Anti-Tampering Verification Report
## Collaborative Study Material & Quiz Platform (CSQP)
**QA Lead:** A Sheiman Joshi (PES2UG24CS003)

### 1. Zero Plaintext Security Verification (CSQP-SR-001)
- Validated that all user passwords undergo one-way bcrypt hashing before database persistence.
- Verified that database snapshots and audit logs do not contain raw passwords.

### 2. Server-Authoritative Quiz Evaluation (CSQP-SR-006)
- The endpoint `GET /api/quizzes/:id/attempt` strips all `correct_answer` fields from client JSON payloads.
- All evaluation is performed exclusively on the server in `quizService.evaluateAttempt()`.

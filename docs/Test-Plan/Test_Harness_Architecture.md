# Test Harness Architecture & Automation Framework
**Author:** A Sheiman Joshi (PES2UG24CS003)

### Architectural Overview
The CSQP testing framework is designed for lightweight, zero-dependency test execution:
1. Native `node:test` runner.
2. In-memory SQLite for ephemeral test databases.
3. Deterministic seeding and tear-down hooks (`before`, `after`).
4. Full coverage of all 22 requirement acceptance criteria.

# Mathematical Modeling & Scoring Algorithms for Quiz Engine
**Author:** A Sheiman Joshi (`PES2UG24CS003`)  
**Domain Role:** QA Lead & Quiz Engine Developer  
**Mathematical Formulation:** Discrete Scoring Models, Weighted Normalization & Tie-Breaking Metric  
**Standard Compliance:** IEEE 1012-2016 (Software Verification Metrics)

---

## 1. Mathematical Formulation of Quiz Evaluation

The Quiz Engine evaluates student assessments using deterministic discrete scoring functions based on question point weights and submission timing.

### 1.1 Score Accumulation Function
Let a quiz $Q$ consist of an ordered sequence of $n$ questions:
$$Q = \{q_1, q_2, \dots, q_n\}$$
Each question $q_i$ possesses an assigned positive integer point weight $w_i \in \mathbb{Z}^+$ and an authoritative answer key $K_i$.

Let the student's submitted response for question $q_i$ be denoted by $R_i$. The correctness evaluation function $E(R_i, K_i) \in \{0, 1\}$ is defined as:
$$E(R_i, K_i) = \begin{cases} 1 & \text{if } \text{normalize}(R_i) = \text{normalize}(K_i) \\ 0 & \text{otherwise} \end{cases}$$

The student's raw earned aggregate score $S$ is given by:
$$S = \sum_{i=1}^{n} w_i \cdot E(R_i, K_i)$$

The total maximum possible score $M$ is the sum of all question weights:
$$M = \sum_{i=1}^{n} w_i$$

### 1.2 Percentage Normalization & Precision
The final percentage score $P$ is calculated as a single-precision floating point rounded to one decimal place:
$$P = \text{round}\left(\frac{S}{M} \times 100, 1\right)$$

Let $T_{\text{pass}} \in [0, 100]$ denote the instructor-defined pass threshold percentage (default: $60.0\%$). The binary pass indicator $B_{\text{pass}} \in \{0, 1\}$ is:
$$B_{\text{pass}} = \begin{cases} 1 & \text{if } P \ge T_{\text{pass}} \\ 0 & \text{if } P < T_{\text{pass}} \end{cases}$$

---

## 2. Dynamic Leaderboard Ranking & Lexicographic Order

When multiple students complete the same assessment, their rank on the leaderboard is determined by a strict lexicographic composite key:

$$\text{Candidate Key} = (S \downarrow, t \uparrow, \tau \uparrow)$$

Where:
- $S \in \mathbb{N}$: Total earned score (sorted descending).
- $t \in \mathbb{R}^+$: Measured completion latency in seconds: $t = t_{\text{submit}} - t_{\text{start}}$ (sorted ascending).
- $\tau \in \text{Timestamp}$: Chronological ISO submission timestamp (sorted ascending as final tie-breaker).

### Formal Ordering Relation:
For two distinct student attempts $A_1 = (S_1, t_1, \tau_1)$ and $A_2 = (S_2, t_2, \tau_2)$:
$$A_1 \succ A_2 \iff (S_1 > S_2) \lor (S_1 = S_2 \land t_1 < t_2) \lor (S_1 = S_2 \land t_1 = t_2 \land \tau_1 < \tau_2)$$

This guarantees strict determinism: faster students with identical scores are awarded higher rank placements.

# Decision 001: Fibonacci Algorithm
**Date:** 2026-10-17
**Decision:** Use a simple iterative `while` loop instead of recursion.
**Rationale:** Iteration is more memory-efficient for generating sequences up to a target number `n` and avoids hitting Python's recursion depth limit.
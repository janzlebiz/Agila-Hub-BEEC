# Tests

The `tests/` directory houses automated tests to verify project functionality, validate repairs, and prevent regressions.

## Testing Hierarchy

In accordance with [AGENTS.md](../AGENTS.md) Section 3 (Step 5):

1. **Targeted Reproducer**: Smallest script or test isolating a bug or specific unit.
2. **Unit Tests**: Fast, isolated tests for components, utilities, and execution scripts.
3. **Integration Tests**: Tests verifying end-to-end interactions across modules, APIs, or database operations.
4. **Regression Tests**: Long-term suites preventing reoccurrence of verified past defects.

## Standards

- Never weaken assertions or disable failing tests merely to force a passing result.
- Verify recovery independently of the script or command that performed the repair.

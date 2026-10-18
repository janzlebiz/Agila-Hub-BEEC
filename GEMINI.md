# Gemini Operating Instructions

This project adheres to the operating architecture, safety boundaries, and self-annealing recovery loop defined in [AGENTS.md](./AGENTS.md).

## Core Directives for Gemini / Antigravity

1. **Architecture Reference**:
   - **Directives (`directives/`)**: Inspect existing Standard Operating Procedures before initiating workflows.
   - **Execution (`execution/`)**: Rely on deterministic, modular scripts in `execution/` for operational workflows.
   - **Tests (`tests/`)**: Verify every material outcome independently with test coverage.

2. **Operating Principles**:
   - Inspect before acting: inspect existing repository state, changes, and configurations before modifying code.
   - Respect stop conditions: escalate immediately when permission boundaries are reached or persistent failures occur.
   - Capture learning: update directives and test suites when verified recoveries reveal reusable workflows.

3. **Status Reporting**:
   - Follow Section 7 of [AGENTS.md](./AGENTS.md): Outcome, Evidence, Changes, Limitations, Risks & Next Steps.

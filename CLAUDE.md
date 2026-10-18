# Claude Operating Instructions

This project adheres to the operating architecture, safety boundaries, and self-annealing recovery loop defined in [AGENTS.md](./AGENTS.md).

## Core Directives for Claude

1. **Architecture Reference**:
   - **Directives (`directives/`)**: Inspect existing Standard Operating Procedures before initiating multi-step workflows.
   - **Execution (`execution/`)**: Build and run deterministic, reusable scripts for repeatable business logic instead of ad-hoc commands.
   - **Tests (`tests/`)**: Validate all material changes with independent unit, integration, and regression tests.

2. **Self-Healing & Safety Loop**:
   - Follow the 7-step recovery process: Detect -> Diagnose -> Select Safe Recovery -> Implement Repair -> Test -> Verify -> Capture Learning.
   - Strictly honor permission boundaries (no secrets in code/logs, no destructive operations without explicit approval).

3. **Status Reporting**:
   - Structure completion summaries with: Outcome, Evidence, Changes, Limitations, and Next Steps.

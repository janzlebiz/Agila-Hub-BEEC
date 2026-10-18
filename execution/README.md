# Execution (Layer 3)

The `execution/` directory contains deterministic, testable, and reusable scripts that perform operational tasks.

## Principles

1. **Deterministic Logic**:
   - Move repeatable, deterministic logic out of ad-hoc prompt commands into parameterized scripts (Python, Node/TS, Bash/PowerShell).
2. **Clear Interface**:
   - Accept well-defined arguments or structured configuration.
   - Return standard exit codes (0 for success, non-zero for distinct failure modes).
   - Emit structured, parseable logs or clear diagnostic messages to stdout/stderr.
3. **Bounded & Resilient**:
   - Implement bounded timeouts for network or sub-process calls.
   - Fail fast and cleanly when prerequisites or inputs are missing.
4. **Secret Safety**:
   - Access secrets strictly via environment variables or secret stores.
   - Never print sensitive credentials or tokens in console output or log files.

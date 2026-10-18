# Directive: [Title / Workflow Name]

> Reference: [AGENTS.md](../AGENTS.md) Layer 1 Directive

## 1. Objective and Scope

- **Goal**: [Clear, measurable goal of this workflow]
- **In Scope**: [List of workflows, files, and services covered]
- **Out of Scope**: [Explicit non-goals or excluded paths]

## 2. Prerequisites and Inputs

- **Required Runtimes/Dependencies**: [e.g., Node.js >= 18, Python >= 3.10]
- **Environment Variables / Secrets**: [List required keys without real secrets, e.g. API_TOKEN]
- **Input Artifacts / Paths**: [Specific file paths or resources required]

## 3. Execution Plan

| Step | Action / Script | Arguments / Input | Expected Output |
| :--- | :--- | :--- | :--- |
| 1 | `execution/[script_name]` | `[args]` | `[output / state change]` |
| 2 | `execution/[script_name]` | `[args]` | `[output / state change]` |

## 4. Verification and Acceptance Criteria

- [ ] **Functional Verification**: [How to verify step outcomes]
- [ ] **Independent Checks**: [Commands, logs, or file state inspection]
- [ ] **Regression Tests**: [Test command to run, e.g. `npm test` or `pytest`]

## 5. Failure Handling and Recovery

- **Transient Failures (network/timeout)**: [Retry policy with bounded backoff]
- **Configuration/Auth Failures**: [Remediation guidance, key rotation, or escalation]
- **Stop Conditions**: Escalate immediately if data loss is risked or credentials are exposed.

## 6. Prohibited Actions and Boundaries

- Do not perform destructive database or file changes without explicit authorization.
- Do not commit secrets or raw tokens.

# Directives (Layer 1)

Directives are version-controlled Standard Operating Procedures (SOPs) that guide agent orchestration and execution.

## Purpose

- Define deterministic workflows and boundaries before actions are taken.
- Decouple repetitive operational logic from probabilistic decision-making.
- Provide established recovery patterns and success metrics.

## Structure of a Directive

Every directive in this directory should follow the template defined in [`_template.md`](./_template.md):

1. **Objective & Scope**: What problem does this directive solve? What is out of scope?
2. **Prerequisites & Inputs**: Required credentials, tools, runtimes, environment variables, and input files.
3. **Execution Steps**: Deterministic sequence of scripts to execute from `execution/`.
4. **Expected Outputs & Verification**: Explicit acceptance criteria and how to independently verify them.
5. **Recovery & Self-Annealing**: Known edge cases, failure classifications, and safe rollback or repair procedures.
6. **Permission & Safety Boundaries**: Prohibited actions, sensitive data considerations, and stop conditions.

# Spec Delta

## ADDED Requirements

### Requirement: Mono root exposes a one-command startup entry
The system SHALL provide a `docs:verify` command at the mono root that serves as the canonical entry point for launching the local verification site, and that command MUST pass the requested version and the resolved repository paths to the zh-repository runner without requiring `repos/dapr-docs-copilot`.

#### Scenario: Operator launches the verification site from the mono root
- **WHEN** the operator runs `pnpm run docs:verify` at the mono root
- **THEN** the command SHALL invoke the zh-repository startup flow for `repos/v1.17` and `repos/v1.17_zh` by default, without a second repository or a manual second script

#### Scenario: Version and network parameters are forwarded
- **WHEN** the operator supplies `version`, `sourceRepo`, `zhRepo`, `host` or `port`
- **THEN** the entry point SHALL forward the resolved values to the zh-repository runner so the launched site reflects the requested configuration

#### Scenario: Entry test runs from the mono root
- **WHEN** the operator runs `pnpm run docs:verify:test` at the mono root
- **THEN** the entry's test suite MUST run and report pass or fail through its exit code

## REMOVED Requirements

### Requirement: Copilot exposes a one-command startup entry
**Reason**: The command lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Use `pnpm run docs:verify` at the mono root (requirement "Mono root exposes a one-command startup entry"). The runner scripts in `repos/v1.17_zh/scripts/` are unchanged.

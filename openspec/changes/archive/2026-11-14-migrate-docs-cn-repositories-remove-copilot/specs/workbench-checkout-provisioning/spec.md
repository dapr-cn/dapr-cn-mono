# Spec Delta

## MODIFIED Requirements

### Requirement: Required checkouts are declared in the mono root
The system SHALL declare in `.hagicode/monospecs.yaml` every versioned checkout the zh data tasks and the translation skill read or write, namely the upstream and zh repository for each supported version, each with its remote URL and branch, and MUST NOT declare `repos/dapr-docs-copilot`.

#### Scenario: Version set is declared
- **WHEN** the declaration is read
- **THEN** it SHALL list `repos/v1.15`, `repos/v1.15_zh`, `repos/v1.17` and `repos/v1.17_zh`, each with the same remote and branch the declaration used before this change

#### Scenario: Existing declarations are preserved
- **WHEN** the copilot entry is removed
- **THEN** the entries for the other repositories already declared SHALL remain unchanged

#### Scenario: Copilot is not provisioned
- **WHEN** provisioning runs after the migration
- **THEN** it SHALL NOT clone, fetch or report `repos/dapr-docs-copilot`

## REMOVED Requirements

### Requirement: Fork checkouts are separate from the single fork-docs checkout
**Reason**: The per-version `repos/fork-<version>` checkouts existed for the PR workbench, which is removed. They were never declared in `.hagicode/monospecs.yaml`.
**Migration**: `repos/fork-docs` remains the single fork checkout. Preparing an upstream pull request follows the manual procedure documented in the mono root `README.md`.

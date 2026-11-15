# Spec

## Purpose

Defines how the mono root declares and provisions the versioned repository checkouts that the translation workbench reads and writes, so a fresh clone of the mono repository can reach a runnable workbench without a second clone tool and without losing uncommitted translation work.

## Requirements

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

### Requirement: Declared branch is honored when provisioning
The system SHALL clone a missing checkout on its declared branch and SHALL switch an existing clean checkout to that branch, and it MUST treat an unreachable declared branch as a failure for that entry unless the entry is marked optional.

#### Scenario: Missing checkout is cloned on its branch
- **WHEN** `repos/v1.17_zh` is absent and its entry declares branch `v1.17_content`
- **THEN** provisioning SHALL clone that branch into `repos/v1.17_zh`

#### Scenario: Unreachable branch fails the entry
- **WHEN** a required entry's declared branch does not exist on its remote
- **THEN** provisioning MUST report that entry as failed and exit non-zero after processing the remaining entries

#### Scenario: Optional entry is skipped
- **WHEN** an optional entry's remote or branch is not reachable
- **THEN** provisioning SHALL skip that entry, report it as skipped and not count it as a failure

### Requirement: Provisioning never modifies uncommitted work
The system SHALL skip any existing checkout that has uncommitted changes, report it, and leave it untouched, and it MUST update clean checkouts with a fast-forward-only pull.

#### Scenario: Dirty checkout is skipped
- **WHEN** `repos/v1.17_zh` contains uncommitted translated files and provisioning runs
- **THEN** provisioning SHALL report that checkout as skipped and MUST NOT fetch into, switch branch on or modify its working tree

#### Scenario: Clean checkout is fast-forwarded
- **WHEN** a clean checkout is behind its remote on the declared branch
- **THEN** provisioning SHALL fast-forward it and report the old and new commit

#### Scenario: Diverged checkout is not rewritten
- **WHEN** a clean checkout has diverged from its remote branch
- **THEN** provisioning MUST report the entry as failed and MUST NOT merge, rebase or reset it

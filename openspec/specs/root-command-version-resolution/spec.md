# Spec

## Purpose

Defines how the mono root commands `zh:data:sync`, `zh:data:repair` and `docs:verify` decide which Dapr docs version they work on, so a newly bootstrapped version does not require editing any script and an explicit `--version` always behaves the same way.

## Requirements

### Requirement: Default version comes from monospecs
When `--version` is not given, each of `zh:data:sync`, `zh:data:repair` and `docs:verify` SHALL use the highest version `vX.Y` in `.hagicode/monospecs.yaml` for which both `repos/vX.Y` and `repos/vX.Y_zh` are registered and neither is marked `optional: true`. Versions SHALL be compared numerically by major and then minor.

#### Scenario: No-argument run keeps the v1.17 behavior
- **GIVEN** the current `.hagicode/monospecs.yaml`, where `repos/v1.17` and `repos/v1.17_zh` are required and `repos/v1.15` and `repos/v1.15_zh` are optional
- **WHEN** an operator runs `pnpm run zh:data:sync` without arguments
- **THEN** the command SHALL use version `v1.17`, source repository `repos/v1.17` and zh repository `repos/v1.17_zh`, as it did before this change

#### Scenario: Versions compare numerically
- **GIVEN** monospecs registers required pairs for `v1.9` and `v1.17`
- **WHEN** a command resolves the default version
- **THEN** it SHALL resolve `v1.17`, not `v1.9`

#### Scenario: Optional and unpaired entries are ignored
- **GIVEN** monospecs also registers `repos/v1.18` and `repos/v1.18_zh` with `optional: true`, or registers only one of the two entries of a version
- **WHEN** a command resolves the default version
- **THEN** that version SHALL NOT be chosen, and the default SHALL remain the highest required pair

#### Scenario: Bootstrap registration does not change the default
- **WHEN** the bootstrap skill registers a new version as optional entries in monospecs
- **THEN** the default version of the three commands SHALL stay unchanged until a person removes `optional: true` from both entries

### Requirement: Explicit version wins and derives the repositories
When `--version` is given, the command SHALL use that version without consulting monospecs, and SHALL derive any repository path that is not given explicitly as `repos/<version>` for the source and `repos/<version>_zh` for the zh repository. An explicitly given repository path SHALL override the derived one.

#### Scenario: Explicit version selects a non-default version
- **WHEN** an operator runs `pnpm run zh:data:sync --version v1.15` without repository options
- **THEN** the command SHALL use `repos/v1.15` as the source and `repos/v1.15_zh` as the zh repository

#### Scenario: Explicit repository path overrides the derived path
- **WHEN** an operator gives both `--version v1.15` and `--zh-repo <path>`
- **THEN** the command SHALL use `<path>` as the zh repository and still derive the source repository from `v1.15`

#### Scenario: Explicit version does not need monospecs
- **GIVEN** `.hagicode/monospecs.yaml` is missing or lists no usable version
- **WHEN** an operator runs a command with an explicit `--version`
- **THEN** the command SHALL NOT fail because of monospecs

### Requirement: Repair default repository is relative to the mono root
When `--repo` is not given, `zh:data:repair` SHALL default to `repos/<version>_zh`, resolved from the mono root, and MUST NOT resolve to a path outside the mono root.

#### Scenario: Default repository inside the mono root
- **WHEN** an operator runs `pnpm run zh:data:repair --mode audit` from the mono root
- **THEN** the repository audited SHALL be `repos/v1.17_zh` under the mono root, and the reported path SHALL NOT start outside the mono root

#### Scenario: Explicit repository is unchanged
- **WHEN** an operator runs `pnpm run zh:data:repair --repo repos/v1.17_zh --version v1.17 --mode audit`
- **THEN** the command SHALL audit that repository exactly as before this change

### Requirement: No usable version is a clear error
When `--version` is not given and monospecs holds no required version pair, or cannot be read or parsed, the command SHALL stop with a non-zero exit code and a message that names `.hagicode/monospecs.yaml` and tells the operator to pass `--version vX.Y` or register required `repos/vX.Y` and `repos/vX.Y_zh` entries. The command MUST NOT write any file in that case.

#### Scenario: Only optional versions are registered
- **GIVEN** every registered version pair is marked `optional: true`
- **WHEN** an operator runs a command without `--version`
- **THEN** the command SHALL exit non-zero with the message above and SHALL NOT fall back to `v1.17`

#### Scenario: Monospecs file is absent
- **GIVEN** `.hagicode/monospecs.yaml` does not exist
- **WHEN** an operator runs a command without `--version`
- **THEN** the command SHALL exit non-zero and the message SHALL state that the file was not found

### Requirement: Local verification output is unchanged by default resolution
Running `docs:verify` with `--dry-run` and no `--version` SHALL print the same resolved source repository, zh repository, generated config, cache directory and preview URL as it printed before this change.

#### Scenario: Dry run resolves the same paths
- **WHEN** an operator runs `pnpm run docs:verify --dry-run` in the current workspace
- **THEN** the resolved source repository SHALL be `repos/v1.17` and the zh repository SHALL be `repos/v1.17_zh`, and the printed fields SHALL be identical to the output before this change

### Requirement: Version default has a single source
The three commands MUST NOT carry a literal version or repository default of their own. The only default MUST be the one resolved from monospecs.

#### Scenario: A newly required version changes all three defaults together
- **WHEN** a person registers `repos/v1.18` and `repos/v1.18_zh` as required entries in monospecs
- **THEN** `zh:data:sync`, `zh:data:repair` and `docs:verify` SHALL all default to `v1.18` without any script being edited

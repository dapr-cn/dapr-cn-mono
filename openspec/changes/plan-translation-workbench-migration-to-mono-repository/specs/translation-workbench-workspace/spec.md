# Spec Delta

## Purpose

Defines the mono repository root as the single workspace that hosts the translation workbench's tasks, toolchain and root-relative lookups, so the workbench, its validation commands and the data-sync task run from one root instead of from the `docs` repository.

## ADDED Requirements

### Requirement: Mono root hosts the workbench data-sync and test tasks
The system SHALL expose the zh data-sync task and its test as `zh:data:sync` and `zh:data:test` at the mono root, with the same arguments (`--source-repo`, `--zh-repo`, `--version`) and the same output datasets under `repos/<version>_zh/data` as the task previously exposed in `repos/docs`.

#### Scenario: Sync task is run from the mono root
- **WHEN** the operator runs `zh:data:sync` at the mono root with `--source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17`
- **THEN** the system SHALL regenerate `sync-status.json`, `source.json` and `glossary.json` under `repos/v1.17_zh/data` using the same record shape as before the migration

#### Scenario: Sync task test passes at the mono root
- **WHEN** the operator runs `zh:data:test` at the mono root
- **THEN** the sync task's test suite MUST run against the mono-root copy of the task and report pass or fail through its exit code

### Requirement: Workbench resolves its workspace root to the mono root
The system SHALL resolve the workbench workspace root, the translation prompt template, the versioned checkouts and the `tsx` executable relative to the mono root when `repos/dapr-docs-copilot` is cloned into the mono root's `repos/` directory.

#### Scenario: Dev endpoint triggers a sync from the mono root
- **WHEN** the workbench dev server receives `POST /__admin/zh-data/sync?version=v1.17`
- **THEN** it SHALL pull `repos/v1.17` with fast-forward only and run `zh:data:sync` from the mono root, and respond with the combined stdout and stderr

#### Scenario: Prompt template is found under the mono root
- **WHEN** a translation job starts
- **THEN** the system SHALL load the `.hbs` template from `repos/dapr-docs-copilot/prompts/translation/` under the mono root

#### Scenario: Copilot commands find the shared toolchain
- **WHEN** an operator runs any npm validation command of `repos/dapr-docs-copilot` such as `translation-workbench:test` or `docs:verify:test`
- **THEN** the command SHALL find `tsx` in the mono root's `node_modules/.bin` without a second install at another root

### Requirement: Workbench behavior is unchanged by the relocation
The system SHALL keep every existing workbench validation suite passing when run against the mono root, without changing translation, PR workbench, glossary, data console or local verification behavior.

#### Scenario: Existing suites pass from the mono root
- **WHEN** the operator runs `translation-workbench:test`, `translation-output:test`, `translation-pipeline:test`, `zh:data:test`, `pr-workbench:test` and `docs:verify:test` from `repos/dapr-docs-copilot` with the mono root installed
- **THEN** every suite SHALL exit with code `0`, the same result as in the `docs` root

#### Scenario: Datasets and translations are untouched by the move
- **WHEN** the relocation is complete
- **THEN** no file under `repos/*_zh/data` or `repos/*_zh/translated_content` SHALL differ because of the relocation itself

### Requirement: Workspace check reports unmet preconditions
The system SHALL provide a read-only workspace check at the mono root that verifies the `zh:data:sync` task, the `tsx` executable and each required versioned checkout, and MUST exit non-zero with a message naming each unmet precondition without modifying any file.

#### Scenario: Complete workspace passes
- **WHEN** the check runs and the task, the toolchain and the required checkouts are all present
- **THEN** it SHALL print the resolved mono root and exit with code `0`

#### Scenario: Missing precondition is named
- **WHEN** the check runs and `repos/v1.17_zh` is absent or `tsx` is not installed
- **THEN** it MUST exit non-zero and name the missing path or executable together with the command that provisions it

#### Scenario: Check never writes
- **WHEN** the check runs in any workspace state
- **THEN** it MUST NOT create, modify or delete any file or checkout

### Requirement: Docs repository no longer owns workbench tasks
The system SHALL retire the workbench tasks from `repos/docs` after the mono root passes validation, and MUST leave the `docs` repository's translated content and Crowdin workflows unchanged.

#### Scenario: Retired entry points are gone
- **WHEN** the retirement is complete
- **THEN** `repos/docs` SHALL NOT define `zh:data:sync`, `zh:data:test` or `clone:repos`, and SHALL NOT contain `scripts/zh-data` or `scripts/clone-repos.mjs`

#### Scenario: Documentation points to the new root
- **WHEN** an operator reads the `repos/docs` README section on fetching upstream sources
- **THEN** it SHALL direct the operator to the mono root's sync and task commands

#### Scenario: Content is preserved
- **WHEN** the retirement is complete
- **THEN** `repos/docs/src/content`, `repos/docs/src/translated_content` and `repos/docs/.github/workflows` SHALL be unchanged

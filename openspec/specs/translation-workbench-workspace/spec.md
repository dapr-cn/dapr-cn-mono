# Spec

## Purpose

Defines the mono repository root as the single workspace that hosts the translation workbench's tasks, toolchain and root-relative lookups, so the workbench, its validation commands and the data-sync task run from one root instead of from the `docs` repository.

## Requirements

### Requirement: Mono root hosts the workbench data-sync and test tasks
The system SHALL expose the zh data-sync task and its test as `zh:data:sync` and `zh:data:test` at the mono root, with the same arguments (`--source-repo`, `--zh-repo`, `--version`) and the same output datasets under `repos/<version>_zh/data` as the task previously exposed in `repos/docs`.

#### Scenario: Sync task is run from the mono root
- **WHEN** the operator runs `zh:data:sync` at the mono root with `--source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17`
- **THEN** the system SHALL regenerate `sync-status.json`, `source.json` and `glossary.json` under `repos/v1.17_zh/data` using the same record shape as before the migration

#### Scenario: Sync task test passes at the mono root
- **WHEN** the operator runs `zh:data:test` at the mono root
- **THEN** the sync task's test suite MUST run against the mono-root copy of the task and report pass or fail through its exit code

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

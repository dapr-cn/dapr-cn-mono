# Spec Delta

## Purpose

Defines how the Chinese translation target repository is translated by the `dapr-docs-translation` skill: where its profile lives, what the skill may write, how existing translations and terminology are carried over, and how output is validated, so translation no longer depends on a separate workbench application.

## ADDED Requirements

### Requirement: Target repository declares a skill profile
The system SHALL keep a `translations/profile.yaml` in `repos/v1.17_zh` that names the English mirror `data/source` as the source root, `translated_content/zh_CN/{doc}` as the output location and `zh-CN` as the default locale, and MUST declare `translations/` and `translated_content/` as the only write scope.

#### Scenario: Skill discovers every mirrored source document
- **WHEN** the skill scans `repos/v1.17_zh` with this profile
- **THEN** it SHALL report one document for each Markdown file under `data/source`, and the target path of each document SHALL resolve under `translated_content/zh_CN` with the same relative path

#### Scenario: Data and site paths are read-only
- **WHEN** the skill runs against `repos/v1.17_zh`
- **THEN** it MUST NOT create, modify or delete any file under `data/`, `site/` or `scripts/`

#### Scenario: Profile is not changed by a run
- **WHEN** a translation run completes or fails
- **THEN** `translations/profile.yaml` SHALL be byte-identical to its state before the run

### Requirement: Existing translations are adopted, not retranslated
The system SHALL record the translations already present in `repos/v1.17_zh/translated_content/zh_CN` as the skill's baseline, and MUST NOT rewrite any translated file while doing so.

#### Scenario: Dry run reports without writing
- **WHEN** the operator runs adoption in dry-run mode
- **THEN** the system SHALL list the documents it would adopt and the documents it would skip with the reason, and SHALL NOT write any file

#### Scenario: Adopted documents are not selected for translation
- **WHEN** adoption has completed and the skill scans the repository
- **THEN** every adopted document whose source is unchanged SHALL be classified as up to date and SHALL NOT appear in the batch of documents to translate

#### Scenario: Translated files are untouched by adoption
- **WHEN** adoption completes
- **THEN** no file under `translated_content/zh_CN` SHALL differ from its content before adoption

### Requirement: Existing glossary terms seed the skill glossary
The system SHALL provide every term of `repos/v1.17_zh/data/glossary.json` to the skill's glossary with its source, its target and its notes, and MUST NOT overwrite a preferred translation that the skill glossary already holds.

#### Scenario: Seed terms are present after migration
- **WHEN** the migration completes
- **THEN** the skill glossary SHALL contain a preferred translation for each of the 7 source terms of `data/glossary.json`

#### Scenario: Existing preferred translation wins
- **WHEN** a seed term has a different target from a term already in the skill glossary
- **THEN** the system SHALL keep the existing preferred translation and report the disagreement without changing the glossary entry

### Requirement: Translated output is validated before it is accepted
The system SHALL accept a translated document only after the skill's checker confirms that its front matter keys, non-translatable front matter values, heading level sequence, code blocks and link targets match the source, and a document that fails the hard checks MUST NOT be written to `translated_content/zh_CN`.

#### Scenario: Structural mismatch is rejected
- **WHEN** a draft has a different heading level sequence from its source
- **THEN** the system MUST reject the draft, record the failure, and leave any previous translated file for that document unchanged

#### Scenario: Valid draft is written atomically
- **WHEN** a draft passes every hard check
- **THEN** the system SHALL write it to its output path, record it in the ledger and delete the draft

### Requirement: Commits cover only the write scope
The system SHALL limit any commit it creates in `repos/v1.17_zh` to paths inside the profile's write scope, and MUST leave uncommitted files outside that scope, including `data/`, untouched and unstaged.

#### Scenario: Dirty data files are not committed
- **WHEN** `repos/v1.17_zh` has uncommitted changes under `data/` and a translation run commits its results
- **THEN** the commit SHALL contain only files under `translations/` and `translated_content/`, and the `data/` changes SHALL remain uncommitted

### Requirement: Roles of the listed repositories are documented
The system SHALL document in the mono root `README.md` the role of each of `docs`, `agent-skills`, `fork-docs`, `v1.17`, `v1.17_zh`, `v1.15`, `v1.15_zh`, `dapr-cn-site`, `dapr-cn-site-source`, `dapr-cn-site-case` and `dapr-cn.github.io` under the skill, and MUST state that `v1.17` and `v1.15` are read-only sources.

#### Scenario: Operator finds the target repository
- **WHEN** an operator reads the repository roles in the mono root `README.md`
- **THEN** it SHALL identify `repos/v1.17_zh` as the translation target and `repos/v1.17` as its read-only source

#### Scenario: Removed repository is not listed
- **WHEN** the migration is complete
- **THEN** the repository table in the mono root `README.md` SHALL NOT list `repos/dapr-docs-copilot`

### Requirement: Fork pull-request procedure is documented
The system SHALL document in the mono root `README.md` the manual procedure for preparing an upstream pull request through `repos/fork-docs`: fast-forwarding the fork, switching the `translations/docs-zh` submodule and building locally.

#### Scenario: Operator can prepare an upstream pull request without a workbench
- **WHEN** an operator follows the documented procedure
- **THEN** every step SHALL be a command or an explicit instruction that does not require `repos/dapr-docs-copilot`

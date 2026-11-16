# Spec

## Purpose

Defines how the Chinese translation target repository is translated by the `dapr-docs-translation` skill: where its profile lives, what the skill may write, how existing translations and terminology are carried over, and how output is validated, so translation no longer depends on a separate workbench application.

## Requirements

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

### Requirement: Skill workflow order and entry points are documented
The system SHALL document in the mono root `README.md` the order `dapr-docs-version-bootstrap`, `dapr-docs-translate-incremental`, `dapr-docs-translation-verify`, `dapr-docs-upstream-pr`, and for each skill its entry command, its default dry-run behavior and its confirmation rule.

#### Scenario: Operator finds the order and the entry command of each skill
- **WHEN** an operator reads the translation section of the mono root `README.md`
- **THEN** it SHALL list the four skills in the order bootstrap, translate-incremental, verify, upstream-pr, and give for each the command that starts it

#### Scenario: Default behavior is stated per skill
- **WHEN** an operator reads the entry of a skill in the `README.md`
- **THEN** it SHALL state that bootstrap and upstream-pr output a plan by default, that verify only reads, and that the incremental commit step lists what it would commit unless it is executed explicitly

#### Scenario: Confirmation is stated as per step
- **WHEN** an operator reads the bootstrap and upstream-pr entries
- **THEN** the `README.md` SHALL state that executing a step needs `--execute` together with the confirmation value of that step, and that history or earlier output is never a confirmation

### Requirement: Write and push boundaries are stated accurately
The system MUST NOT state in the mono root `README.md` that the translation skills never push. It SHALL state that the translation engine writes only the profile write scope and never pushes, and list which of the other skills may commit, branch or push.

#### Scenario: Engine and skills are distinguished
- **WHEN** an operator reads the write and push statement in the `README.md`
- **THEN** it SHALL say that the engine writes only `translations/` and `translated_content/` and never pushes, that `dapr-docs-translate-incremental` commits only those paths and never pushes or creates branches, and that `dapr-docs-translation-verify` only reads

#### Scenario: Pushing skills are named with their confirmation
- **WHEN** an operator reads the same statement
- **THEN** it SHALL say that `dapr-docs-version-bootstrap` and `dapr-docs-upstream-pr` can push only after a separate confirmation for each push, and never force-push

### Requirement: Root command defaults are documented as resolved
The system SHALL document in the mono root `README.md` that `zh:data:sync`, `zh:data:repair` and `docs:verify` resolve their default version from `.hagicode/monospecs.yaml`, that an explicit `--version` wins, and that the default `--repo` of `zh:data:repair` is `repos/<version>_zh`.

#### Scenario: README matches the command behavior
- **WHEN** an operator reads the `zh:data:*` and `docs:verify` sections
- **THEN** they SHALL NOT describe `v1.17` as a fixed default, SHALL explain how the default version is chosen, and SHALL NOT tell the operator to pass `--repo` to avoid a path outside the mono root

### Requirement: Roles of the listed repositories are documented
The system SHALL document in the mono root `README.md` the role of each of `docs`, `agent-skills`, `fork-docs`, `v1.17`, `v1.17_zh`, `dapr-cn-site`, `dapr-cn-site-source`, `dapr-cn-site-case` and `dapr-cn.github.io` under the translation workflow, MUST state that `v1.17` is a read-only source, and MUST state that `agent-skills` owns the translation engine and the four orchestration skills and carries no repository facts.

#### Scenario: Operator finds the target repository
- **WHEN** an operator reads the repository roles in the mono root `README.md`
- **THEN** it SHALL identify `repos/v1.17_zh` as the translation target and `repos/v1.17` as its read-only source

#### Scenario: Operator finds the owner of the skills
- **WHEN** an operator reads the role of `repos/agent-skills`
- **THEN** it SHALL list `dapr-docs-translation`, `dapr-docs-translate-incremental`, `dapr-docs-translation-verify`, `dapr-docs-version-bootstrap` and `dapr-docs-upstream-pr` as the skills it owns

#### Scenario: Removed repository is not listed
- **WHEN** the migration is complete
- **THEN** the repository table in the mono root `README.md` SHALL NOT list `repos/dapr-docs-copilot`

### Requirement: Fork pull-request procedure is documented
The system SHALL document in the mono root `README.md` the preparation of an upstream pull request through `repos/fork-docs` as the two confirmed stages of `dapr-docs-upstream-pr`, and SHALL keep the manual equivalent: fast-forwarding the fork, switching the `translations/docs-zh` submodule and building locally. It MUST state that each push and each pull-request creation needs its own confirmation.

#### Scenario: Operator can prepare an upstream pull request without a workbench
- **WHEN** an operator follows the documented procedure
- **THEN** every step SHALL be a command or an explicit instruction that does not require `repos/dapr-docs-copilot`

#### Scenario: Stages and confirmations are visible
- **WHEN** an operator reads the procedure
- **THEN** it SHALL show that stage A pushes the translation branch to the translation remote, that stage B moves the fork, builds and prepares the pull-request text, and that the fork push and the pull-request creation are separate confirmed steps

#### Scenario: Procedure does not depend on the fork repository's own README
- **WHEN** an operator follows the documented procedure
- **THEN** no step SHALL require a section of the `repos/fork-docs` README, because that README does not describe this flow

#### Scenario: Verification comes first
- **WHEN** an operator reads where the procedure starts
- **THEN** it SHALL state that `dapr-docs-translation-verify` must have produced a passing and fresh verdict for the version before stage A is planned

# Spec Delta

## REMOVED Requirements

### Requirement: Workbench lists versions and untranslated files
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: User can enqueue multiple files for translation
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Translation templates are file-backed Handlebars assets
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Glossary is injected into every translation request
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Successful translations reconcile downstream datasets
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Failed files can be retried
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Localized front matter aliases are normalized before write
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Workbench validates markdown output before persistence
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Validation failure blocks downstream reconciliation
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: User can configure translation concurrency
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

### Requirement: Translation queue is bounded-concurrent and observable
**Reason**: The interactive workbench lived in `repos/dapr-docs-copilot`, which is removed.
**Migration**: Translation runs through the `dapr-docs-translation` skill against `repos/v1.17_zh` (see `zh-translation-skill-workspace`): the skill selects documents, runs bounded-parallel subagents, keeps the ledger and glossary, and retries failures.

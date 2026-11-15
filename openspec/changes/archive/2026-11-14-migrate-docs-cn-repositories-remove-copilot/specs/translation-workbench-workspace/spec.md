# Spec Delta

## REMOVED Requirements

### Requirement: Workbench resolves its workspace root to the mono root
**Reason**: `repos/dapr-docs-copilot` is removed. Nothing resolves a workbench root, prompt template or `tsx` for it any more.
**Migration**: Translation runs through the `dapr-docs-translation` skill (see `zh-translation-skill-workspace`). The data-sync task keeps resolving the mono root through its own requirement.

### Requirement: Workbench behavior is unchanged by the relocation
**Reason**: The workbench validation suites (`translation-workbench:test`, `translation-output:test`, `translation-pipeline:test`, `pr-workbench:test`) exist only inside the removed repository.
**Migration**: Output validation is covered by the skill's checker. The sync task's suite stays as `zh:data:test`. The verification entry's suite stays as `docs:verify:test`.

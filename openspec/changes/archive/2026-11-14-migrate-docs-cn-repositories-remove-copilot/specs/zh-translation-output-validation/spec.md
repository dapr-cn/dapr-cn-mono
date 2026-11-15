# Spec Delta

## REMOVED Requirements

### Requirement: Validator enforces structural parity for translated markdown
**Reason**: The validator ran inside the copilot's write path, and the copilot is removed.
**Migration**: The skill's checker validates front matter keys, headings, code blocks and links before a document is accepted (see `zh-translation-skill-workspace`).

### Requirement: Validator runs in both explicit-file and batch modes
**Reason**: The validator ran inside the copilot's write path, and the copilot is removed.
**Migration**: The skill's checker validates front matter keys, headings, code blocks and links before a document is accepted (see `zh-translation-skill-workspace`).

### Requirement: Validation failures are diagnosable and leave no invalid target behind
**Reason**: The validator ran inside the copilot's write path, and the copilot is removed.
**Migration**: The skill's checker validates front matter keys, headings, code blocks and links before a document is accepted (see `zh-translation-skill-workspace`).

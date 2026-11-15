# Tasks

## 1. Skill profile in `repos/v1.17_zh`

- [x] 1.1 Record the baseline: `git -C repos/v1.17_zh status --porcelain` (the 52 uncommitted `data/` files) and the sha256 of every file under `translated_content/zh_CN`, in the scratch area, to compare after each later step.
- [x] 1.2 Run `node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs init --repo repos/v1.17_zh --source-root data/source --glob "**/*.md" --locale zh-CN --output-template "translated_content/zh_CN/{doc}" --dry-run`, review the planned files, then run it without `--dry-run`.
- [x] 1.3 Complete `repos/v1.17_zh/translations/profile.yaml`: `description`, `writeScope: [translations/, translated_content/]`, `readOnly: [data/, site/, scripts/]`, `forbidden` (push, stash, reset, checkout, new branches, `--no-verify`), `priority` tiers (getting-started and concepts first, then building blocks, then SDKs), `rules` (keep front matter `aliases`, `type`, `weight` as in the source; keep relative links), `budgets`, `models`, `commit` prefix `docs(translation)`.
- [x] 1.4 Run `tr.mjs scan --profile repos/v1.17_zh/translations/profile.yaml` and compare the discovered document count with the 629 Markdown files under `data/source`; explain any difference before continuing.
- [x] 1.5 Verify `data/`, `site/` and `scripts/` of `repos/v1.17_zh` are unchanged against the task 1.1 baseline.

## 2. Adopt existing translations and seed the glossary

- [x] 2.1 Run `tr.mjs adopt --profile … --if-translation-newer --dry-run`; review the adopted and skipped lists and confirm the stale documents (about 42) are among the skipped.
- [x] 2.2 Run `tr.mjs adopt` with the same options; confirm every file under `translated_content/zh_CN` still matches the task 1.1 hashes.
- [x] 2.3 Convert the 7 terms of `repos/v1.17_zh/data/glossary.json` to a candidate list `[{doc, source, target, note}]` in the scratch area and run `tr.mjs glossary merge --file … --dry-run`, then without `--dry-run`; confirm each term is present and no existing preferred translation changed.
- [x] 2.4 Run `tr.mjs scan` and `tr.mjs status --verify`; confirm there are no `untracked` documents, adopted documents are `fresh`, and `check-translation.mjs` passes on a sample of at least 20 adopted documents across buckets.
- [x] 2.5 Run `tr.mjs next` for one new or stale document into a scratch directory outside `translations/`, produce a draft by hand, and run `tr.mjs check` on a deliberately broken draft (different heading levels) to confirm it is rejected and a previous translation is untouched.
- [x] 2.6 Verify again that `git status --porcelain` for `data/` equals the task 1.1 baseline.

## 3. Move the verification entry to the mono root

- [x] 3.1 Copy `repos/dapr-docs-copilot/scripts/start-local-docs-verification.ts` to `scripts/docs-verify/start-local-docs-verification.ts` and recompute its default workspace root for the new location; keep every other behavior.
- [x] 3.2 Copy `repos/dapr-docs-copilot/scripts/validate-local-docs-verification.ts` to `scripts/docs-verify/tests/validate-local-docs-verification.ts` and fix its imports and paths.
- [x] 3.3 Add `docs:verify` and `docs:verify:test` to the mono `package.json` (reusing the existing `tsx`).
- [x] 3.4 Run `pnpm run docs:verify:test`; it must exit `0`.
- [x] 3.5 Run `pnpm run docs:verify` with default arguments and with `--version`, `--host` and `--port`; confirm the output prints the resolved source repository, zh repository, generated config path and preview URL, and that a missing `hugo` or missing `translated_content/zh_CN` gives an explicit error.
- [x] 3.6 Confirm `repos/v1.17` and `repos/v1.17_zh/scripts/` are unchanged by the verification run (cache, logs and temporary output stay inside `repos/v1.17_zh/site`).

## 4. Documentation

- [x] 4.1 Re-read the mono root `README.md` and `package.json` immediately before editing (the in-flight change may have touched them).
- [x] 4.2 Update the mono `README.md`: remove the `repos/dapr-docs-copilot` row; add the role of each listed repository under the skill (target `v1.17_zh`, read-only sources `v1.17` and `v1.15`, frozen `v1.15_zh`, legacy `docs`, `agent-skills`, `fork-docs`, and the unrelated site and content repositories); add the skill workflow (sync, scan, next, finalize, status) and `pnpm run docs:verify`.
- [x] 4.3 Add to the mono `README.md` the manual `fork-docs` pull-request procedure: fast-forward the fork branch from upstream, switch `translations/docs-zh` to the target commit, run the local build, and the rule that nothing is pushed by the skill.
- [x] 4.4 Add to the mono `README.md` the note that `data/translation-state.json` is no longer updated and that progress comes from `tr.mjs status` (design D5).
- [x] 4.5 Update `repos/v1.17_zh/README.md`: replace workbench wording with the skill workflow, state that `data/` belongs to `zh:data:sync`, and describe `translations/`.
- [ ] 4.6 Run `grep -rn "dapr-docs-copilot"` over the mono root files and `repos/docs`, `repos/agent-skills`, `repos/v1.17_zh`, `repos/fork-docs`; every remaining hit must be a historical note or the archived change, and none may be an instruction.

## 5. Parity gate and removal of the copilot

- [x] 5.1 Walk the parity table: workbench UI, queue and templates → skill run (task 2.5); output validation and alias backfill → checker (task 2.5) and profile `rules`; zh-data console and glossary CRUD → skill glossary (task 2.3); PR workbench → README procedure (task 4.3); `docs:verify` → mono entry (tasks 3.4, 3.5); integrity repair → `zh:data:repair` (already at mono). Record any item without a replacement and stop if one exists.
- [x] 5.2 Run `pnpm run zh:data:test`, `pnpm run zh:data:check` and `pnpm run sync:repos:test` at the mono root; all must pass.
- [x] 5.3 Run `pnpm run zh:data:sync -- --source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17` into a copy or confirm by dry inspection that it does not read anything from `repos/dapr-docs-copilot`; record the integrity audit result with the frozen `translation-state.json`.
- [x] 5.4 Confirm the copilot clone has no uncommitted files and no commits ahead of `origin/main`; if it has either, stop and report instead of deleting.
- [x] 5.5 Remove the `repos/dapr-docs-copilot` entry from `.hagicode/monospecs.yaml`, keeping every other entry byte-identical.
- [x] 5.6 Run `pnpm run sync:repos` and confirm it neither clones nor reports `repos/dapr-docs-copilot`.
- [x] 5.7 Remove the local clone `repos/dapr-docs-copilot` and re-run tasks 3.4 and 5.2 to prove nothing depended on it.

## 6. Final verification

- [x] 6.1 Run `openspec validate migrate-docs-cn-repositories-remove-copilot --strict`.
- [x] 6.2 Confirm no change was made to `repos/docs`, `repos/agent-skills`, `repos/fork-docs`, `repos/v1.17`, `repos/v1.15`, `repos/v1.15_zh`, `repos/dapr-cn-site`, `repos/dapr-cn-site-case`, `repos/dapr-cn-site-source` or `repos/dapr-cn.github.io`.
- [x] 6.3 Confirm `git status` in `repos/v1.17_zh` shows only the new `translations/`, the README, and the pre-existing `data/` changes; no `translated_content` file is modified.

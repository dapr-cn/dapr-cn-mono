# Tasks

## 1. Checkout provisioning at the mono root

- [ ] 1.1 Append four entries to `.hagicode/monospecs.yaml`: `v1.17` and `v1.17_zh` (required) and `v1.15` and `v1.15_zh` (`optional: true`), copying URL and `branch` from `repos/docs/monospecs.yaml`; verify the ten existing entries are byte-identical, no `fork-v*` entry was added, and `node -e "require('js-yaml').load(require('fs').readFileSync('.hagicode/monospecs.yaml','utf8'))"` parses.
- [ ] 1.2 Add `branch` and `optional` support to `scripts/sync-repos.mjs` (clone with `--branch`; switch a clean checkout to the declared branch; keep `fetch --prune` plus `pull --ff-only`; report diverged or unreachable required entries as failed; entries without `branch` behave as before); verify a run against the current `repos/` tree reports the same outcome as before for the ten existing repositories.
- [ ] 1.3 Add `scripts/tests/sync-repos.test.mjs` and a `sync:repos:test` script covering clone on branch, dirty-tree skip, fast-forward, diverged failure and optional skip over temporary git repositories; verify `pnpm run sync:repos:test` passes.
- [ ] 1.4 Document the data checkout set and the `branch`/`optional` fields in the mono `README.md`; verify every command quoted in that section runs as written.

## 2. Toolchain and data tasks at the mono root

- [ ] 2.1 Add `tsx`, `typescript` and `@types/node` as dev dependencies and the `zh:data:sync`, `zh:data:test` and `zh:data:repair` scripts to `package.json`, using the same commands as `repos/docs/package.json` for the first two; verify `pnpm install` succeeds and `node_modules/.bin/tsx` exists.
- [ ] 2.2 Copy `repos/dapr-docs-copilot/src/server/translation-integrity-audit.ts` and `src/lib/translation-integrity-models.ts` to `scripts/zh-data/lib/` without edits; verify with `cmp` that both copies are identical to the source files and that neither imports anything outside `node:` built-ins and each other.
- [ ] 2.3 Copy `repos/docs/scripts/zh-data/sync_source_documents.ts` and `scripts/zh-data/tests/test_sync_source_documents.ts` to the same relative paths at the mono root, changing only the two imports of `repos/dapr-docs-copilot/...` to `./lib/...`; verify `diff` against the `docs` copies shows only those two lines and `grep -r "dapr-docs-copilot" scripts/` returns no match.
- [ ] 2.4 Copy `repos/dapr-docs-copilot/scripts/repair-translation-integrity.ts` to `scripts/zh-data/repair_translation_integrity.ts`, changing only its import to `./lib/translation-integrity-audit.ts`; verify `pnpm run zh:data:repair` with the same arguments produces the same report as `translation-integrity:repair` did for the same checkout.
- [ ] 2.5 Run `pnpm run zh:data:test` at the mono root; verify it exits `0` with the same test count as the `docs` run.
- [ ] 2.6 Add a "zh data tasks" section to the mono `README.md` describing `zh:data:sync`, `zh:data:test` and `zh:data:repair` with their arguments; verify the quoted `--source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17` example runs against provisioned checkouts.

## 3. Data workspace check

- [ ] 3.1 Add `scripts/check-zh-data-workspace.mjs` (Node built-ins and `js-yaml` only) that verifies the `zh:data:sync` script, `node_modules/.bin/tsx` and the required v1.17 checkouts, reports clean or dirty checkout status as information, prints the resolved root on success, lists each unmet precondition with its provisioning command, exits non-zero on failure and writes nothing; verify it exits `0` on a complete workspace.
- [ ] 3.2 Add the `zh:data:check` script and a `node:test` test that runs the check against a temporary incomplete workspace (missing `repos/v1.17_zh`, missing `tsx`) and asserts the named message, the non-zero exit and that no file changed; verify the test passes.
- [ ] 3.3 Document `zh:data:check` in the mono `README.md`; verify the documented command output matches the README example.

## 4. Validate the data tasks at the mono root

- [ ] 4.1 Provision the checkouts with `pnpm run sync:repos`; verify `pnpm run zh:data:check` exits `0`.
- [ ] 4.2 Run `zh:data:sync` once from the `docs` root and once from the mono root against the same inputs; verify `repos/v1.17_zh/data/*.json` differ only by timestamp fields.
- [ ] 4.3 Run the integrity audit through `zh:data:repair` at the mono root and compare with the copilot's `translation-integrity:repair` on the same checkout; verify the two reports contain the same findings.

## 5. Retire the data tasks from docs

- [ ] 5.1 Search `repos/docs` for imports and references to `animejs`, `chalk`, `cli-table3`, `commander`, `glob`, `ora`, `js-yaml`, `clone-repos`, `zh-data` and `monospecs.yaml`; verify the list of remaining references is recorded before any removal.
- [ ] 5.2 Remove `repos/docs/scripts/zh-data/**`, `repos/docs/scripts/clone-repos.mjs` and `repos/docs/monospecs.yaml`; verify none of those paths exist.
- [ ] 5.3 Remove the `zh:data:sync`, `zh:data:test`, `clone:repos` and `clone:all` scripts and the unused dependencies from `repos/docs/package.json` and refresh `package-lock.json`; verify `npm install` succeeds and `npm run` lists none of the retired scripts.
- [ ] 5.4 Update the "源码同步" section of `repos/docs/README.md` and the references in `repos/docs/SRC_TRANSLATION_BUILD_ANALYSIS.md` to point at the mono root; verify no remaining text mentions `npm run clone:repos` or `scripts/clone-repos.mjs`.
- [ ] 5.5 Verify `repos/docs/src/content`, `repos/docs/src/translated_content` and `repos/docs/.github/workflows` are unchanged and re-run `zh:data:test` and `zh:data:check` at the mono root; verify both exit `0`.

## 6. Audit the remaining repositories

- [ ] 6.1 Search `repos/dapr-cn-site`, `dapr-cn-site-case`, `dapr-cn-site-source`, `dapr-cn.github.io`, `docs-team`, `docsy`, `wowchemy-hugo-themes` and `fork-docs` for `zh:data:sync`, `clone:repos` and a path to the `docs` repository's `monospecs.yaml`; verify the result is recorded as "no change" per repository, or lists each reference that needs an edit.
- [ ] 6.2 For each reference found in 6.1, update the text to the mono-root command; verify a repeat of the 6.1 search returns no matches.

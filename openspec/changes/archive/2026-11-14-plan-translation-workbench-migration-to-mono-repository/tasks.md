# Tasks

## 1. Checkout provisioning at the mono root

- [x] 1.1 Append four entries to `.hagicode/monospecs.yaml`: `v1.17` and `v1.17_zh` (required) and `v1.15` and `v1.15_zh` (`optional: true`), copying URL and `branch` from `repos/docs/monospecs.yaml`; verify the ten existing entries are byte-identical, no `fork-v*` entry was added, and `node -e "require('js-yaml').load(require('fs').readFileSync('.hagicode/monospecs.yaml','utf8'))"` parses.
- [x] 1.2 Add `branch` and `optional` support to `scripts/sync-repos.mjs` (clone with `--branch`; switch a clean checkout to the declared branch; keep `fetch --prune` plus `pull --ff-only`; report diverged or unreachable required entries as failed; entries without `branch` behave as before); verify a run against the current `repos/` tree reports the same outcome as before for the ten existing repositories.
- [x] 1.3 Add `scripts/tests/sync-repos.test.mjs` and a `sync:repos:test` script covering clone on branch, dirty-tree skip, fast-forward, diverged failure and optional skip over temporary git repositories; verify `pnpm run sync:repos:test` passes.
- [x] 1.4 Document the data checkout set and the `branch`/`optional` fields in the mono `README.md`; verify every command quoted in that section runs as written.

## 2. Toolchain and data tasks at the mono root

- [x] 2.1 Add `tsx`, `typescript` and `@types/node` as dev dependencies and the `zh:data:sync`, `zh:data:test` and `zh:data:repair` scripts to `package.json`, using the same commands as `repos/docs/package.json` for the first two. Also add `pnpm-workspace.yaml` with `allowBuilds: esbuild: true` and a `packageManager` pin equal to the version in `repos/docs/package.json`; verify a clean `pnpm install` succeeds, `pnpm exec tsx --version` prints a version, and no `package-lock.json` or `yarn.lock` exists at the mono root.
- [x] 2.2 Copy `repos/dapr-docs-copilot/src/server/translation-integrity-audit.ts` and `src/lib/translation-integrity-models.ts` to `scripts/zh-data/lib/` without edits; verify with `cmp` that both copies are identical to the source files and that neither imports anything outside `node:` built-ins and each other.
- [x] 2.3 Copy `repos/docs/scripts/zh-data/sync_source_documents.ts` and `scripts/zh-data/tests/test_sync_source_documents.ts` to the same relative paths at the mono root, changing only the two imports of `repos/dapr-docs-copilot/...` to `./lib/...`; verify `diff` against the `docs` copies shows only those two lines and `grep -r "dapr-docs-copilot" scripts/` returns no match.
- [x] 2.4 Copy `repos/dapr-docs-copilot/scripts/repair-translation-integrity.ts` to `scripts/zh-data/repair_translation_integrity.ts`, changing only its import to `./lib/translation-integrity-audit.ts`; verify `pnpm run zh:data:repair` with the same arguments produces the same report as the copilot's `translation-integrity:repair` for the same checkout (run `pnpm install` in `repos/dapr-docs-copilot` first; do not edit its files).
- [x] 2.5 Run `pnpm run zh:data:test` at the mono root; verify it exits `0` with the same test count as the `docs` run.
- [x] 2.6 Add a "zh data tasks" section to the mono `README.md` describing `zh:data:sync`, `zh:data:test` and `zh:data:repair` with their arguments, written as `pnpm run zh:data:sync --source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17` (arguments follow the script name, no `--`); verify the quoted example runs against provisioned checkouts and that every command in the section uses pnpm.

## 3. Data workspace check

- [x] 3.1 Add `scripts/check-zh-data-workspace.mjs` (Node built-ins and `js-yaml` only) that verifies the `zh:data:sync` script, `node_modules/.bin/tsx` and the required v1.17 checkouts, reports clean or dirty checkout status as information, prints the resolved root on success, lists each unmet precondition with its provisioning command, exits non-zero on failure and writes nothing; verify it exits `0` on a complete workspace.
- [x] 3.2 Add the `zh:data:check` script and a `node:test` test that runs the check against a temporary incomplete workspace (missing `repos/v1.17_zh`, missing `tsx`) and asserts the named message, the non-zero exit and that no file changed; verify the test passes.
- [x] 3.3 Document `zh:data:check` in the mono `README.md`; verify the documented command output matches the README example.

## 4. Validate the data tasks at the mono root

- [ ] 4.1 Provision the checkouts with `pnpm run sync:repos`; verify `pnpm run zh:data:check` exits `0` and that `sync:repos` reports an outcome for every declared entry with none failed.
- [x] 4.2 Run `pnpm run zh:data:sync` once from the `docs` root (after `pnpm install` there) and once from the mono root against the same inputs; verify `repos/v1.17_zh/data/*.json` differ only by timestamp fields.
- [x] 4.3 Run the integrity audit through `pnpm run zh:data:repair` at the mono root and compare with the copilot's `pnpm run translation-integrity:repair` on the same checkout (copilot dependencies installed, its files unedited); verify the two reports contain the same findings.

## 5. Retire the data tasks from docs

- [x] 5.1 Record the baseline of `repos/docs` (its `HEAD` commit and its committed pnpm conversion: `package.json`, `README.md`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, removed `package-lock.json`) and search it for imports and references to `animejs`, `chalk`, `cli-table3`, `commander`, `glob`, `ora`, `js-yaml`, `tsx`, `typescript`, `clone-repos`, `zh-data` and `monospecs.yaml`; verify the baseline and the list of remaining references are recorded before any removal.
- [x] 5.2 Remove `repos/docs/scripts/zh-data/**`, `repos/docs/scripts/clone-repos.mjs` and `repos/docs/monospecs.yaml`; verify none of those paths exist.
- [x] 5.3 In place, on top of the existing pnpm files, remove the `zh:data:sync`, `zh:data:test`, `clone:repos` and `clone:all` scripts, the unused dependencies (including `tsx`, `typescript` and `@types/node` once no script needs them) and the `esbuild` entry of `allowBuilds` from `repos/docs/package.json` and `pnpm-workspace.yaml`, keeping `packageManager`, and refresh `pnpm-lock.yaml`; verify `pnpm install` succeeds, `pnpm run` lists none of the retired scripts, and no `package-lock.json` was reintroduced.
- [x] 5.4 Replace the pnpm commands in the "源码同步" section of `repos/docs/README.md` (`pnpm install`, `pnpm run clone:repos`) and the references in `repos/docs/SRC_TRANSLATION_BUILD_ANALYSIS.md` with a pointer to the mono root's `pnpm run sync:repos` and `zh:data:*` commands; verify no remaining text mentions `clone:repos`, `scripts/clone-repos.mjs` or `npm`.
- [x] 5.5 Verify `repos/docs/src/content`, `repos/docs/src/translated_content` and `repos/docs/.github/workflows` are unchanged and re-run `zh:data:test` and `zh:data:check` at the mono root; verify both exit `0`.

## 6. Audit the remaining repositories

- [x] 6.1 Search `repos/dapr-cn-site`, `dapr-cn-site-case`, `dapr-cn-site-source`, `dapr-cn.github.io`, `docs-team`, `docsy`, `wowchemy-hugo-themes` and `fork-docs` for `zh:data:sync`, `clone:repos` and a path to the `docs` repository's `monospecs.yaml`; verify the result is recorded as "no change" per repository, or lists each reference that needs an edit.
- [x] 6.2 For each reference found in 6.1, update the text to the mono-root command; verify a repeat of the 6.1 search returns no matches.

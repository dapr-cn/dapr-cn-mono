# dapr-cn-mono

Management repository for the [dapr-cn](https://github.com/dapr-cn) organization: the Chinese Dapr documentation, its translation skill workflow, the community website and their supporting forks and themes.

This repository holds only management files. Each project lives in its own GitHub repository and is cloned into `repos/` (ignored by git).

## Layout

```
dapr-cn-mono/
├── .hagicode/monospecs.yaml   # list of repositories, their URLs, tags and status
├── scripts/sync-repos.mjs     # clone missing repositories, fast-forward clean ones
├── scripts/docs-verify/       # docs:verify, the local verification site entry
├── scripts/lib/default-version.mjs # default Dapr docs version from monospecs (zh:data:*, docs:verify)
├── openspec/                  # OpenSpec specs and changes for all repositories
├── package.json
└── repos/                     # clones (not tracked)
```

## Repositories

| Path | Status | Purpose |
|---|---|---|
| `repos/docs` | active | Chinese translation of the Dapr documentation |
| `repos/agent-skills` | active | Agent skills: the `dapr-docs-translation` engine and four orchestration skills |
| `repos/fork-docs` | fork | Fork of dapr/docs, default branch `v1.17` |
| `repos/dapr-cn-site` | stale | Community website |
| `repos/dapr-cn-site-source` | stale | Source-code analysis content |
| `repos/dapr-cn-site-case` | stale | User case content |
| `repos/dapr-cn.github.io` | stale | Published output of `dapr-cn/docs` (gh-pages) |

### Roles under the translation skill

The Chinese Dapr documentation is translated by the `dapr-docs-translation` skill (`repos/agent-skills`). Its active target is `repos/v1.19_zh`; `repos/v1.17_zh` is the previous-version baseline.

| Repository | Role under the skill |
|---|---|
| `repos/v1.17_zh` | **Previous-version baseline** for v1.19. Its `data/` belongs to `zh:data:sync`, which the skill never writes. |
| `repos/v1.17` | **Read-only source**: English Dapr v1.17 docs. Feeds `repos/v1.17_zh/data/source` through `zh:data:sync`. |
| `repos/v1.19_zh` | **Active translation target.** Holds v1.19 translation state and `translated_content/zh_CN`; `data/` belongs to `zh:data:sync`. |
| `repos/v1.19` | **Read-only source**: English Dapr v1.19 docs. Feeds `repos/v1.19_zh/data/source` through `zh:data:sync`. |
| `repos/v1.15` | **Read-only source** for v1.15 (optional). |
| `repos/v1.15_zh` | Frozen optional v1.15 translation (last commit 2025-07-12). No profile until it is revived. |
| `repos/agent-skills` | Owns five skills: the `dapr-docs-translation` engine, `dapr-docs-translate-incremental`, `dapr-docs-translation-verify`, `dapr-docs-version-bootstrap` and `dapr-docs-upstream-pr`. Carries no repository facts. |
| `repos/docs` | Legacy Crowdin-managed content. Not a skill target. |
| `repos/fork-docs` | Fork of `dapr/docs`, used to open upstream pull requests by hand (see below). |
| `repos/dapr-cn-site`, `repos/dapr-cn-site-source`, `repos/dapr-cn-site-case` | Community website and its content. Unrelated to translation. |
| `repos/dapr-cn.github.io` | Stale gh-pages output from 2021. Unrelated to translation. |

## Usage

```bash
pnpm install
pnpm run sync:repos
```

`sync:repos` does the following for each repository:

- **Missing:** cloned from its URL, on its `branch` when one is declared.
- **Clean clone:** switched to its `branch` when one is declared, then `git fetch --prune` and `git pull --ff-only`.
- **Uncommitted changes:** skipped and reported, never modified.
- **Diverged:** reported as failed; nothing is merged, rebased or reset.

Add a repository by appending an entry to `.hagicode/monospecs.yaml`, then run the sync again.

Two optional fields control provisioning:

- `branch`: the branch to clone or switch to. Without it, the remote's default branch is used.
- `optional: true`: when the remote or branch is unreachable, the entry is skipped and not counted as a failure. Without it, an unreachable entry fails the run, and the other entries are still processed.

To test the sync behaviour against temporary git repositories (no network needed):

```bash
pnpm run sync:repos:test
```

### Data checkouts

The zh data tasks read and write these checkouts. They are declared in `.hagicode/monospecs.yaml` with their branches:

| Path | Branch | Required | Purpose |
|---|---|---|---|
| `repos/v1.17` | `v1.17` | yes | Upstream Dapr docs for v1.17: source documents |
| `repos/v1.17_zh` | `v1.17_content` | yes | Chinese translation data for v1.17 |
| `repos/v1.19` | `v1.19` | yes | Upstream Dapr docs for v1.19: source documents |
| `repos/v1.19_zh` | `v1.19_content` | yes | Chinese translation data for v1.19 |
| `repos/v1.15` | `v1.15` | no | Upstream Dapr docs for v1.15 |
| `repos/v1.15_zh` | `v1.15_content` | no | Chinese translation data for v1.15 |

Provision them with `pnpm run sync:repos`, as above.

### zh data tasks

Run these from the mono root after the data checkouts are provisioned. Every command uses pnpm, and arguments follow the script name without `--`.

```bash
pnpm run zh:data:sync --source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17
pnpm run zh:data:test
pnpm run zh:data:repair --repo repos/v1.17_zh --version v1.17 --mode audit
```

- **Default version.** Without `--version`, `zh:data:sync`, `zh:data:repair` and `docs:verify` use the highest `vX.Y` whose `repos/vX.Y` and `repos/vX.Y_zh` are both registered in `.hagicode/monospecs.yaml` without `optional: true`. The current default is v1.19. Versions compare by number, so v1.9 is older than v1.19. A bootstrapped version is registered as optional, so the default changes only when someone removes `optional: true` from both of its entries. If no version qualifies, the command exits non-zero, names the file and writes nothing; pass `--version vX.Y` to proceed.
- **Explicit options.** `--version` always wins and never reads monospecs. A repository path that is not given explicitly is derived from the version: `repos/<version>` for the source and `repos/<version>_zh` for the zh repository. An explicit `--source-repo`, `--zh-repo` or `--repo` overrides the derived path.
- `zh:data:sync` regenerates `sync-status.json`, `source.json`, `glossary.json` and `integrity-report.json` under `repos/<version>_zh/data`. With no arguments, `pnpm run zh:data:sync` does the same as the example from the mono root.
- `zh:data:test` runs the sync task's test suite, including the default-version cases. `pnpm run version:default:test` runs the tests of the version resolver on its own.
- `zh:data:repair` audits or repairs the integrity of a zh checkout. Its `--repo` defaults to `repos/<version>_zh` under the mono root, so it needs no `--repo` from there. `--mode audit` only reports; without it the command repairs the checkout and writes files.

The data tasks read the integrity logic from `scripts/zh-data/lib/`, so they need no other repository.

### Translate with the skill

The active translation target is `repos/v1.19_zh`. Its profile is `repos/v1.19_zh/translations/profile.yaml`: people maintain it, and runs never edit it. Run these from the mono root; `tr.mjs` lives in `repos/agent-skills`:

```bash
pnpm run zh:data:sync --source-repo repos/v1.19 --zh-repo repos/v1.19_zh --version v1.19
node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs scan --profile repos/v1.19_zh/translations/profile.yaml
node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs status --profile repos/v1.19_zh/translations/profile.yaml
```

The cycle is: `zh:data:sync` refreshes `data/source`; `scan` (read-only) picks the next batch; `next` writes one job per document; subagents return drafts; `check` and `finalize` accept a checked draft; `status` reports progress. `next`, `check`, `assemble`, `finalize` and `fail` take run and job options; see `repos/agent-skills/dapr-docs-translation/references/commands.md`.

The translation engine is `dapr-docs-translation`, the `tr.mjs` loop above. It writes only the profile's `writeScope`, which is `translations/` and `translated_content/`, and it never pushes. It commits only when the profile enables `commit`; `commit.enabled` is `false` today, so a plain run does not commit. `data/` stays with `zh:data:sync`.

#### The four skills, in order

For each version the four skills in `repos/agent-skills` run in this order: `dapr-docs-version-bootstrap` → `dapr-docs-translate-incremental` → `dapr-docs-translation-verify` → `dapr-docs-upstream-pr`. The incremental run drives the engine. Each skill's `SKILL.md` is the source of its steps; this section gives only the entry points and the rules.

| Skill | Entry command (from the mono root) | Default | Confirmation |
|---|---|---|---|
| `dapr-docs-version-bootstrap` | `node repos/agent-skills/dapr-docs-version-bootstrap/scripts/bootstrap.mjs plan --version vX.Y`, then `apply --version vX.Y --step <S>` | `plan` lists the steps and their hashes; `apply` without `--execute` only shows what the step would do | Each step needs `--execute --confirm <hash>` for that step. Step S7, the push, needs its own confirmation. |
| `dapr-docs-translate-incremental` | `node repos/agent-skills/dapr-docs-translate-incremental/scripts/incremental.mjs plan --version vX.Y`, then `run --phase pre`, the translation, `run --phase post`, and `commit` | `plan` and `commit` are dry runs; `commit` lists the paths it would stage and the command it would use | `commit --execute` is needed to commit. The flag applies to that call only. |
| `dapr-docs-translation-verify` | `node repos/agent-skills/dapr-docs-translation-verify/scripts/gate.mjs plan --version vX.Y`, then `run --version vX.Y --out <file outside the repo>` | `plan` lists the commands; `run` only reads | None. Exit code 0 means `canOpenPr` is true. |
| `dapr-docs-upstream-pr` | `node repos/agent-skills/dapr-docs-upstream-pr/scripts/upstream-pr.mjs plan --version vX.Y --gate <verdict.json>`, then `apply` for a stage or a step | `plan` and `apply` without `--execute` are dry runs | Stage A, stage B, step B4 and step B5 each need `--execute --confirm <hash>` for themselves. |

#### Write and push boundaries

- **Engine (`dapr-docs-translation`):** writes only `translations/` and `translated_content/`, and never pushes. It commits only when the profile enables `commit`.
- **`dapr-docs-translate-incremental`:** runs `zh:data:sync`, which writes `data/`, and its `commit` step stages and commits only changes under `translations/` and `translated_content/`. It never pushes and never creates branches. Changes under `data/` are listed, not committed.
- **`dapr-docs-translation-verify`:** only reads. It never commits, pushes, creates branches, stashes or repairs anything.
- **`dapr-docs-version-bootstrap`:** creates local clones and the local branch `vX.Y_content`, and commits its new profile and `release.yaml`. It pushes `vX.Y_content` only in step S7, after its own confirmation. It never force-pushes and does not use `adopt`.
- **`dapr-docs-upstream-pr`:** pushes to `dapr/docs-zh` (stage A) and to the fork (step B4) only after a separate confirmation for each push, and opens pull requests (A2 and B5) only after a separate confirmation each. It never force-pushes and never merges a diverged branch.

### Local verification site

```bash
pnpm run docs:verify
pnpm run docs:verify:test
```

Defaults: the version is the default described under zh data tasks (currently `v1.19`), `--source-repo repos/<version>`, `--zh-repo repos/<version>_zh`, `--host 127.0.0.1`, `--port 1313`. Pass `--version` to choose another version; explicit repository options still win. Other options: `--hugo-bin <path>` when `hugo` is not on `PATH`, and `--dry-run` to check and generate the config without starting the server. Pass options after the script name, without `--`. The command prints the resolved source repository, zh repository, generated config, cache directory, Hugo binary and preview URL (`http://127.0.0.1:1313/zh-hans/` by default). Everything it writes stays in `repos/<version>_zh/site`.

### Translation state

`data/translation-state.json` in `repos/v1.17_zh` is no longer updated. Only the removed copilot wrote it. `zh:data:sync` and the integrity audit still read it when present and tolerate its absence. Translation progress comes from `tr.mjs status`.

### Upstream pull requests through fork-docs

Upstream pull requests are prepared from `repos/fork-docs`, a fork of `dapr/docs`. Stage A is planned only after `dapr-docs-translation-verify` has produced a passing, fresh verdict for the version (`canOpenPr: true`).

`dapr-docs-upstream-pr` runs in two stages. Each push and each pull-request creation needs its own confirmation, given with `--execute --confirm <hash>`:

- **Stage A** pushes the translation branch `vX.Y_content` to `dapr/docs-zh` (step A1). Opening a pull request on `dapr/docs-zh` (A2) is optional and needs `--zh-pr-base`.
- **Stage B** fast-forwards the fork to the upstream branch, checks out the pushed commit in the `translations/docs-zh` submodule, builds, and writes the pull-request text (B1 to B3). Step B4 pushes the work branch to the fork, and step B5 opens the pull request on `dapr/docs`. B4 and B5 are confirmed separately.

Stage B starts only after stage A has finished. Neither stage force-pushes or merges a diverged branch.

The manual equivalent, without the skill, is the four steps below. Pushing and opening the pull request remain separate decisions:

1. Fast-forward the fork branch from upstream:

   ```bash
   cd repos/fork-docs
   git remote add upstream https://github.com/dapr/docs.git   # first time only
   git fetch upstream v1.17
   git switch v1.17
   git merge --ff-only upstream/v1.17
   ```

2. Switch the `translations/docs-zh` submodule to the target commit. That commit must already be pushed to `dapr/docs-zh` (branch `v1.17_content`):

   ```bash
   git submodule update --init translations/docs-zh
   git -C translations/docs-zh fetch origin
   git -C translations/docs-zh checkout <target-commit>
   git add translations/docs-zh
   ```

3. Build locally with `npm ci` and `npm run build`. Use `npm run serve` to preview.

4. Commit, push `v1.17` to `dapr-cn/fork-docs` and open the pull request on GitHub yourself.

### Check the data workspace

```bash
pnpm run zh:data:check
```

The check is read-only: it creates, modifies and deletes nothing. On a complete workspace it prints the resolved root and one line per precondition:

```
Mono root: /path/to/dapr-cn-mono
ok      zh:data:sync script is defined in package.json
ok      tsx is installed (node_modules/.bin/tsx)
ok      repos/v1.19 is present (clean)
ok      repos/v1.19_zh is present (clean)
info    repos/v1.15 is present (optional, not required by the data tasks)
info    repos/v1.15_zh is present (optional, not required by the data tasks)

zh data workspace is ready.
```

A missing precondition is printed as `MISSING` with the command that provisions it, for example `repos/v1.19_zh is missing` followed by `pnpm run sync:repos`, or `tsx is not installed` followed by `pnpm install`. The command then exits with code 1. A dirty checkout is reported as information only and does not fail the check, because `sync:repos` never touches it.

The check follows the required source/translation pair selected by the default-version resolver in `scripts/lib/default-version.mjs`; it now checks v1.19.

To test the check itself against temporary workspaces:

```bash
pnpm run zh:data:check:test
```

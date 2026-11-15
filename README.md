# dapr-cn-mono

Management repository for the [dapr-cn](https://github.com/dapr-cn) organization: the Chinese Dapr documentation, its translation skill workflow, the community website and their supporting forks and themes.

This repository holds only management files. Each project lives in its own GitHub repository and is cloned into `repos/` (ignored by git).

## Layout

```
dapr-cn-mono/
├── .hagicode/monospecs.yaml   # list of repositories, their URLs, tags and status
├── scripts/sync-repos.mjs     # clone missing repositories, fast-forward clean ones
├── scripts/docs-verify/       # docs:verify, the local verification site entry
├── openspec/                  # OpenSpec specs and changes for all repositories
├── package.json
└── repos/                     # clones (not tracked)
```

## Repositories

| Path | Status | Purpose |
|---|---|---|
| `repos/docs` | active | Chinese translation of the Dapr documentation |
| `repos/agent-skills` | active | Agent skills, including `dapr-docs-translation` |
| `repos/fork-docs` | fork | Fork of dapr/docs, default branch `v1.17` |
| `repos/dapr-cn-site` | stale | Community website |
| `repos/dapr-cn-site-source` | stale | Source-code analysis content |
| `repos/dapr-cn-site-case` | stale | User case content |
| `repos/dapr-cn.github.io` | stale | Published output of `dapr-cn/docs` (gh-pages) |

### Roles under the translation skill

The Chinese Dapr documentation is translated by the `dapr-docs-translation` skill (`repos/agent-skills`). Its target is `repos/v1.17_zh`. The other repositories are inputs, a frozen copy, or unrelated to translation.

| Repository | Role under the skill |
|---|---|
| `repos/v1.17_zh` | **Translation target.** Holds `translations/` (profile, ledger, glossary, state) and `translated_content/zh_CN`. Its `data/` belongs to `zh:data:sync`, which the skill never writes. |
| `repos/v1.17` | **Read-only source**: English Dapr v1.17 docs. Feeds `repos/v1.17_zh/data/source` through `zh:data:sync`. |
| `repos/v1.15` | **Read-only source** for v1.15 (optional). |
| `repos/v1.15_zh` | Frozen optional v1.15 translation (last commit 2025-07-12). No profile until it is revived. |
| `repos/agent-skills` | Owns the `dapr-docs-translation` skill. Carries no repository facts. |
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

- `zh:data:sync` regenerates `sync-status.json`, `source.json`, `glossary.json` and `integrity-report.json` under `repos/v1.17_zh/data`. Its `--source-repo`, `--zh-repo` and `--version` default to the values in the example, so `pnpm run zh:data:sync` alone does the same from the mono root.
- `zh:data:test` runs the sync task's test suite.
- `zh:data:repair` audits or repairs the integrity of a zh checkout. Its `--repo` defaults to `../v1.17_zh`, which is relative to the working directory, so pass `--repo repos/v1.17_zh` from the mono root. `--mode audit` only reports; without it the command repairs the checkout and writes files.

The data tasks read the integrity logic from `scripts/zh-data/lib/`, so they need no other repository.

### Translate with the skill

The translation target is `repos/v1.17_zh`. Its profile is `repos/v1.17_zh/translations/profile.yaml`: people maintain it, and runs never edit it. Run these from the mono root; `tr.mjs` lives in `repos/agent-skills`:

```bash
pnpm run zh:data:sync --source-repo repos/v1.17 --zh-repo repos/v1.17_zh --version v1.17
node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs scan --profile repos/v1.17_zh/translations/profile.yaml
node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs status --profile repos/v1.17_zh/translations/profile.yaml
```

The cycle is: `zh:data:sync` refreshes `data/source`; `scan` (read-only) picks the next batch; `next` writes one job per document; subagents return drafts; `check` and `finalize` accept a checked draft; `status` reports progress. `next`, `check`, `assemble`, `finalize` and `fail` take run and job options; see `repos/agent-skills/dapr-docs-translation/references/commands.md`.

The skill writes only `translations/` and `translated_content/`, and it never pushes. `data/` stays with `zh:data:sync`. `commit.enabled` is `false` in the profile, so runs do not commit.

### Local verification site

```bash
pnpm run docs:verify
pnpm run docs:verify:test
```

Defaults: `--version v1.17`, `--source-repo repos/v1.17`, `--zh-repo repos/v1.17_zh`, `--host 127.0.0.1`, `--port 1313`. Other options: `--hugo-bin <path>` when `hugo` is not on `PATH`, and `--dry-run` to check and generate the config without starting the server. Pass options after the script name, without `--`. The command prints the resolved source repository, zh repository, generated config, cache directory, Hugo binary and preview URL (`http://127.0.0.1:1313/zh-hans/` by default). Everything it writes stays in `repos/v1.17_zh/site`.

### Translation state

`data/translation-state.json` in `repos/v1.17_zh` is no longer updated. Only the removed copilot wrote it. `zh:data:sync` and the integrity audit still read it when present and tolerate its absence. Translation progress comes from `tr.mjs status`.

### Upstream pull requests through fork-docs

The PR workbench is removed. Upstream pull requests are opened by hand from `repos/fork-docs`, a fork of `dapr/docs`. The skill never pushes, so each step is a manual command:

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
ok      repos/v1.17 is present (clean)
ok      repos/v1.17_zh is present (clean)
info    repos/v1.15 is present (optional, not required by the data tasks)
info    repos/v1.15_zh is present (optional, not required by the data tasks)

zh data workspace is ready.
```

A missing precondition is printed as `MISSING` with the command that provisions it, for example `repos/v1.17_zh is missing` followed by `pnpm run sync:repos`, or `tsx is not installed` followed by `pnpm install`. The command then exits with code 1. A dirty checkout is reported as information only and does not fail the check, because `sync:repos` never touches it.

To test the check itself against temporary workspaces:

```bash
pnpm run zh:data:check:test
```

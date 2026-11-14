# dapr-cn-mono

Management repository for the [dapr-cn](https://github.com/dapr-cn) organization: the Chinese Dapr documentation, its translation workbench, the community website and their supporting forks and themes.

This repository holds only management files. Each project lives in its own GitHub repository and is cloned into `repos/` (ignored by git).

## Layout

```
dapr-cn-mono/
├── .hagicode/monospecs.yaml   # list of repositories, their URLs, tags and status
├── scripts/sync-repos.mjs     # clone missing repositories, fast-forward clean ones
├── openspec/                  # OpenSpec specs and changes for all repositories
├── package.json
└── repos/                     # clones (not tracked)
```

## Repositories

| Path | Status | Purpose |
|---|---|---|
| `repos/docs` | active | Chinese translation of the Dapr documentation |
| `repos/dapr-docs-copilot` | active | Translation workbench |
| `repos/fork-docs` | fork | Fork of dapr/docs, default branch `v1.17` |
| `repos/dapr-cn-site` | stale | Community website |
| `repos/docs-team` | archived | Translation team notes |
| `repos/docsy` | fork (stale) | Docsy Hugo theme fork |
| `repos/wowchemy-hugo-themes` | fork (stale) | Wowchemy theme fork |
| `repos/dapr-cn-site-source` | stale | Source-code analysis content |
| `repos/dapr-cn-site-case` | stale | User case content |
| `repos/dapr-cn.github.io` | stale | Published output of `dapr-cn/docs` (gh-pages) |

## Usage

```bash
pnpm install
pnpm run sync:repos
```

`sync:repos` does the following for each repository:

- **Missing:** cloned from its URL.
- **Clean clone:** `git fetch --prune` and `git pull --ff-only`.
- **Uncommitted changes:** skipped and reported, never modified.

Add a repository by appending an entry to `.hagicode/monospecs.yaml`, then run the sync again.

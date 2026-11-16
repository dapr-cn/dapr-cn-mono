# AGENTS.md

Guidance for agents working in `dapr-cn-mono`. The README is the reference for commands; this file holds the rules and the traps.

## What this repository is

A management repository for the Chinese Dapr documentation. It tracks only scripts, `openspec/` and `.hagicode/monospecs.yaml`. Every project lives in its own git repository under `repos/`, which this repository ignores. A change inside `repos/<x>` is committed in that repository, never in the mono root, and each of them has its own remote.

## Repositories and what you may write

| Path | Remote | Rule |
|---|---|---|
| `repos/v1.17`, `repos/v1.19` | `dapr/docs` | **Read-only upstream source.** Nobody here can push to it. Never commit or edit. Realign with `pnpm run source:reset` (discards local commits and edits; `--dry-run` first). |
| `repos/v1.17_zh` (`v1.17_content`) | `dapr/docs-zh` | Previous-version baseline. |
| `repos/v1.19_zh` (`v1.19_content`) | `dapr/docs-zh` | Active translation target. |
| `repos/agent-skills` | own repository | The `dapr-docs-*` skills and the `tr.mjs` engine. Scripts use Node built-ins only. |

In a `_zh` repository:

- You write only `translations/` and `translated_content/` (the profile's `writeScope`).
- `data/` belongs to `pnpm run zh:data:sync`; do not edit it by hand.
- `translations/profile.yaml` is maintained by people; runs never edit it.
- Never run `source:reset` or any `git reset`/`clean` there: it holds the translation work.

## Commands

Use pnpm from the mono root. Options follow the script name **without `--`** (`pnpm run docs:build --version v1.17`, not `pnpm run docs:build -- …`).

- Default version is the highest `vX.Y` registered without `optional: true` (currently v1.19). `--version` overrides it.
- `pnpm run zh:data:sync` refreshes `data/source` and the derived data files.
- `pnpm run docs:verify` serves the merged site; `pnpm run docs:build` makes a static build into `repos/<v>_zh/site/tmp/public`. Build needs Hugo extended, Go and PostCSS; `npm ci` in `repos/<v>` provides the last one. The runner sets `NODE_PATH` itself.
- Translation engine: `node repos/agent-skills/dapr-docs-translation/scripts/tr.mjs <scan|status|adopt|next|check|assemble|finalize|fail|fix-anchors|glossary> --profile repos/<v>_zh/translations/profile.yaml`. See `repos/agent-skills/dapr-docs-translation/references/commands.md`.
- Skill order per version: `dapr-docs-version-bootstrap` → `dapr-docs-translate-incremental` → `dapr-docs-translation-verify` → `dapr-docs-upstream-pr`. Each `SKILL.md` is the source of its steps.

## Guarded operations

Pushes, branch creation and pull requests default to a plan. Execute only with `--execute --confirm <hash>` given in that very call; the hash comes from the current plan, and nothing earlier (ledger, env, a past approval) counts. Never force-push. Do not commit, push or open a PR unless the user asks. See `openspec/specs/guarded-operation-confirmation/spec.md`.

## Before you change code

- Mono scripts: `pnpm run docs:verify:test`, `pnpm run zh:data:test`, `pnpm run version:default:test`, `pnpm run sync:repos:test`, `pnpm run zh:data:check:test`.
- Skills: `npm test` in `repos/agent-skills` (it also enforces the Node-built-ins-only rule).
- A behaviour change that a spec in `openspec/specs/` describes updates that spec in the same change.
- Verify with the real command, not only the unit test: the fake-Hugo tests cannot catch environment problems.

## Environment traps

- `npm ci`/`npm i` may fail with `EALLOWSCRIPTS` because `npm_config_allow_scripts` leaks from the shell: run `env -u npm_config_allow_scripts -u npm_config_local_prefix npm ci`.
- The `--cacheDir` passed to Hugo must be an absolute path.
- `docs:build` output is minified, so attributes are unquoted (`id=状态管理-api`); grep for that form, not `id="…"`.
- State in `repos/<v>_zh/translations/locales/zh-CN/` (`snapshot.json`, `ledger.jsonl`) is append-only history. Change it only through `tr.mjs`.

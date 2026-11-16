#!/usr/bin/env node
/**
 * Resets the upstream source repositories (repos/vX.Y, remote dapr/docs) to match their remote branch exactly.
 *
 * The source repositories are read-only inputs: nobody here can push to dapr/docs, so any local commit or
 * edit in them is unwanted. This command DISCARDS local commits, tracked changes and untracked files
 * (ignored files such as node_modules are kept). It never touches the zh repositories (repos/vX.Y_zh),
 * which hold the translation work.
 *
 * Usage: pnpm run source:reset [--version vX.Y] [--dry-run]
 *   no --version  every non-optional repos/vX.Y registered in .hagicode/monospecs.yaml
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { MONO_ROOT, MONOSPECS_RELATIVE_PATH } from './lib/default-version.mjs'

const args = process.argv.slice(2)
let version
let dryRun = false
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--dry-run') dryRun = true
  else if (args[i] === '--version' && args[i + 1]) version = args[++i]
  else {
    console.error(`[source:reset] 不支持的参数：${args[i]}\n用法：pnpm run source:reset [--version vX.Y] [--dry-run]`)
    process.exit(2)
  }
}

const git = (repo, ...gitArgs) => {
  const r = spawnSync('git', ['-C', repo, ...gitArgs], { encoding: 'utf8' })
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() }
}

const config = yaml.load(readFileSync(path.join(MONO_ROOT, MONOSPECS_RELATIVE_PATH), 'utf8'))
const sources = (config?.repositories ?? []).filter((r) => /^repos\/v\d+\.\d+$/.test(r.path ?? '') && r.branch)
const targets = version ? sources.filter((r) => r.path === `repos/${version}`) : sources.filter((r) => !r.optional)
if (targets.length === 0) {
  console.error(`[source:reset] 在 monospecs 中找不到源仓${version ? ` ${version}` : ''}`)
  process.exit(1)
}

let failed = 0
for (const target of targets) {
  const repo = path.join(MONO_ROOT, target.path)
  const remoteRef = `origin/${target.branch}`
  console.log(`\n== ${target.path} → ${remoteRef}`)
  if (!existsSync(path.join(repo, '.git'))) {
    console.log('  跳过：本地没有这个仓库')
    continue
  }
  const fetched = git(repo, 'fetch', '--prune', 'origin', `+refs/heads/${target.branch}:refs/remotes/${remoteRef}`)
  if (!fetched.ok) {
    console.error(`  失败：git fetch 出错\n${fetched.out}`)
    failed += 1
    continue
  }
  const ahead = git(repo, 'log', '--format=  丢弃提交 %h %s', `${remoteRef}..HEAD`).out
  const dirty = git(repo, 'status', '--short').out
  console.log(ahead || '  没有本地独有的提交')
  console.log(dirty ? `  丢弃未提交改动：\n${dirty.replace(/^/gm, '    ')}` : '  工作区干净')
  if (dryRun) {
    continue
  }
  // checkout -B puts the local branch on the remote tip even if it was on another branch; clean without -x keeps node_modules.
  const steps = [
    ['checkout', '-f', '-B', target.branch, remoteRef],
    ['reset', '--hard', remoteRef],
    ['clean', '-fd'],
  ]
  const bad = steps.map((step) => git(repo, ...step)).find((r) => !r.ok)
  if (bad) {
    console.error(`  失败：\n${bad.out}`)
    failed += 1
    continue
  }
  console.log(`  已重置到 ${git(repo, 'rev-parse', '--short', 'HEAD').out}`)
}
if (dryRun) console.log('\n[source:reset] dry-run：未修改任何仓库')
process.exit(failed ? 1 : 0)

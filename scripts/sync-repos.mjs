#!/usr/bin/env node

/**
 * Clone missing repositories listed in .hagicode/monospecs.yaml and bring
 * existing clean clones up to date with a fast-forward pull.
 *
 * - Missing directory      -> git clone (on `branch` when declared)
 * - Existing, dirty tree   -> skipped with a warning (never touched)
 * - Existing, clean tree   -> switch to `branch` when declared, then
 *                             git fetch --prune && git pull --ff-only
 * - Diverged checkout      -> failed (the pull refuses; nothing is rewritten)
 * - Unreachable `branch`   -> failed for a required entry,
 *                             skipped for an entry with `optional: true`
 */

import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import yaml from 'js-yaml';

const execFileAsync = promisify(execFile);
const MONO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(MONO_ROOT, '.hagicode', 'monospecs.yaml');

async function git(args, cwd) {
  // Never block on a credential prompt: an unreachable remote must fail, not hang.
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const { stdout } = await execFileAsync('git', args, { cwd, env, maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** True when the entry's remote answers and, if a branch is declared, that branch exists on it. */
async function isReachable(repo) {
  const ref = repo.branch ? `refs/heads/${repo.branch}` : 'HEAD';
  try {
    const out = await git(['ls-remote', repo.url, ref], MONO_ROOT);
    return out.length > 0;
  } catch {
    return false;
  }
}

async function hasLocalBranch(fullPath, branch) {
  try {
    await git(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], fullPath);
    return true;
  } catch {
    return false;
  }
}

/** Switch a clean checkout to `branch`. Returns true when the branch changed. */
async function switchToBranch(fullPath, branch) {
  // Explicit refspec: a single-branch clone only tracks its own branch by default.
  await git(['fetch', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], fullPath);

  const current = await git(['rev-parse', '--abbrev-ref', 'HEAD'], fullPath);
  if (current === branch) {
    return false;
  }

  if (await hasLocalBranch(fullPath, branch)) {
    await git(['checkout', branch], fullPath);
  } else {
    await git(['checkout', '-b', branch, '--track', `origin/${branch}`], fullPath);
  }
  return true;
}

/**
 * Sync one entry. Resolves to { status, message }; rejects when the entry failed.
 * `status` is one of: cloned, current, updated, skipped.
 */
export async function syncRepo(repo, monoRoot = MONO_ROOT) {
  const fullPath = path.join(monoRoot, repo.path);
  const label = repo.displayName ?? repo.path;
  const branchNote = repo.branch ? ` (${repo.branch})` : '';

  if (repo.optional && !(await isReachable(repo))) {
    const target = repo.branch ? `branch ${repo.branch} of ` : '';
    return { status: 'skipped', message: `skipped  ${label} (optional, ${target}${repo.url} not reachable)` };
  }

  if (!(await exists(fullPath))) {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const args = ['clone'];
    if (repo.branch) {
      args.push('--branch', repo.branch, '--single-branch');
    }
    args.push(repo.url, repo.path);
    await git(args, monoRoot);
    return { status: 'cloned', message: `cloned   ${label}${branchNote}` };
  }

  try {
    await git(['rev-parse', '--git-dir'], fullPath);
  } catch {
    return { status: 'skipped', message: `skipped  ${label} (directory exists but is not a git repository)` };
  }

  const dirty = await git(['status', '--porcelain'], fullPath);
  if (dirty) {
    return { status: 'skipped', message: `skipped  ${label} (uncommitted changes, not touched)` };
  }

  const before = await git(['rev-parse', 'HEAD'], fullPath);
  const switched = repo.branch ? await switchToBranch(fullPath, repo.branch) : false;
  await git(['fetch', '--prune', 'origin'], fullPath);
  await git(['pull', '--ff-only'], fullPath);
  const after = await git(['rev-parse', 'HEAD'], fullPath);

  if (before === after && !switched) {
    return { status: 'current', message: `current  ${label}${branchNote}` };
  }
  const switchNote = switched ? ` (switched to ${repo.branch})` : '';
  return {
    status: 'updated',
    message: `updated  ${label} ${before.slice(0, 7)}..${after.slice(0, 7)}${switchNote}`,
  };
}

/**
 * Sync every entry in the config. Returns the process exit code: 1 when any
 * entry failed, 0 otherwise. Failed entries do not stop the remaining ones.
 */
export async function runSync({ configPath = CONFIG_PATH, monoRoot = MONO_ROOT } = {}, out = console) {
  const config = yaml.load(await fs.readFile(configPath, 'utf-8'));
  if (!config?.repositories?.length) {
    out.error(`No repositories listed in ${configPath}`);
    return 1;
  }

  let failures = 0;
  for (const repo of config.repositories) {
    try {
      const { message } = await syncRepo(repo, monoRoot);
      out.log(message);
    } catch (error) {
      failures += 1;
      out.error(`failed   ${repo.displayName ?? repo.path}: ${error.stderr?.trim() || error.message}`);
    }
  }

  out.log(`\n${config.repositories.length} repositories processed, ${failures} failed.`);
  return failures > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runSync();
}

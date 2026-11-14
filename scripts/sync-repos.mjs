#!/usr/bin/env node

/**
 * Clone missing repositories listed in .hagicode/monospecs.yaml and bring
 * existing clean clones up to date with a fast-forward pull.
 *
 * - Missing directory      -> git clone
 * - Existing, dirty tree   -> skipped with a warning (never touched)
 * - Existing, clean tree   -> git fetch --prune && git pull --ff-only
 */

import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const execFileAsync = promisify(execFile);
const MONO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(MONO_ROOT, '.hagicode', 'monospecs.yaml');

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 16 * 1024 * 1024 });
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

async function syncRepo(repo) {
  const fullPath = path.join(MONO_ROOT, repo.path);
  const label = repo.displayName ?? repo.path;

  if (!(await exists(fullPath))) {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await git(['clone', repo.url, repo.path], MONO_ROOT);
    return `cloned   ${label}`;
  }

  try {
    await git(['rev-parse', '--git-dir'], fullPath);
  } catch {
    return `skipped  ${label} (directory exists but is not a git repository)`;
  }

  const dirty = await git(['status', '--porcelain'], fullPath);
  if (dirty) {
    return `skipped  ${label} (uncommitted changes, not touched)`;
  }

  await git(['fetch', '--prune', 'origin'], fullPath);
  const before = await git(['rev-parse', 'HEAD'], fullPath);
  await git(['pull', '--ff-only'], fullPath);
  const after = await git(['rev-parse', 'HEAD'], fullPath);
  return before === after ? `current  ${label}` : `updated  ${label} ${before.slice(0, 7)}..${after.slice(0, 7)}`;
}

async function main() {
  const config = yaml.load(await fs.readFile(CONFIG_PATH, 'utf-8'));
  if (!config?.repositories?.length) {
    console.error('No repositories listed in .hagicode/monospecs.yaml');
    process.exit(1);
  }

  let failures = 0;
  for (const repo of config.repositories) {
    try {
      console.log(await syncRepo(repo));
    } catch (error) {
      failures += 1;
      console.error(`failed   ${repo.displayName ?? repo.path}: ${error.stderr?.trim() || error.message}`);
    }
  }

  console.log(`\n${config.repositories.length} repositories processed, ${failures} failed.`);
  process.exit(failures > 0 ? 1 : 0);
}

main();

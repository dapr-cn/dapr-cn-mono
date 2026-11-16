#!/usr/bin/env node

/**
 * Read-only check that the mono root can run the zh data tasks.
 *
 * Verifies the zh:data:sync script, the tsx executable and the default-version
 * checkouts. Prints one line per check, names each unmet precondition with the
 * command that provisions it, and exits non-zero when anything is unmet.
 * It never creates, modifies or deletes a file or a checkout.
 *
 * Usage: pnpm run zh:data:check [--root <dir>]
 */

import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { parseArgs, promisify } from 'util';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import yaml from 'js-yaml';
import { repoPathsForVersion, resolveDefaultVersion } from './lib/default-version.mjs';

const execFileAsync = promisify(execFile);
const DEFAULT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYNC_COMMAND = 'pnpm run sync:repos';
const INSTALL_COMMAND = 'pnpm install';

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(p) {
  if (!(await exists(p))) {
    return null;
  }
  return JSON.parse(await fs.readFile(p, 'utf-8'));
}

async function readConfigIfPresent(p) {
  if (!(await exists(p))) {
    return null;
  }
  return yaml.load(await fs.readFile(p, 'utf-8'));
}

/** Number of changed paths in a checkout. `--no-optional-locks` keeps git from writing the index. */
async function changedPathCount(dir) {
  const { stdout } = await execFileAsync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: dir });
  return stdout.split('\n').filter(Boolean).length;
}

/**
 * Runs every check under `root`. Returns the report lines and the number of unmet preconditions.
 * Each line is `{ level, text, fix? }`, where level is `ok`, `info` or `missing`.
 */
export async function checkWorkspace(root) {
  const lines = [];
  const unmet = (text, fix) => lines.push({ level: 'missing', text, fix });
  const ok = (text) => lines.push({ level: 'ok', text });
  const info = (text) => lines.push({ level: 'info', text });

  const pkg = await readJsonIfPresent(path.join(root, 'package.json'));
  if (pkg?.scripts?.['zh:data:sync']) {
    ok('zh:data:sync script is defined in package.json');
  } else {
    unmet('zh:data:sync script is not defined in package.json', 'restore the zh:data:sync script (see README: zh data tasks)');
  }

  if (await exists(path.join(root, 'node_modules', '.bin', 'tsx'))) {
    ok('tsx is installed (node_modules/.bin/tsx)');
  } else {
    unmet('tsx is not installed (node_modules/.bin/tsx)', INSTALL_COMMAND);
  }

  const config = await readConfigIfPresent(path.join(root, '.hagicode', 'monospecs.yaml'));
  const declared = new Map((config?.repositories ?? []).map((repo) => [repo.path, repo]));

  let requiredCheckouts = [];
  try {
    requiredCheckouts = Object.values(repoPathsForVersion(resolveDefaultVersion(root)));
  } catch (error) {
    unmet(error instanceof Error ? error.message : String(error), 'register a required source/translation version pair in .hagicode/monospecs.yaml');
  }

  for (const checkout of requiredCheckouts) {
    const dir = path.join(root, checkout);
    const entry = declared.get(checkout);
    if (!entry) {
      unmet(`${checkout} is not declared in .hagicode/monospecs.yaml`, `add a ${checkout} entry to .hagicode/monospecs.yaml`);
    } else if (entry.optional) {
      unmet(`${checkout} is declared optional but the data tasks require it`, `remove optional: true from ${checkout} in .hagicode/monospecs.yaml`);
    }
    if (!(await exists(path.join(dir, '.git')))) {
      unmet(`${checkout} is missing`, SYNC_COMMAND);
      continue;
    }
    const changed = await changedPathCount(dir);
    ok(`${checkout} is present (${changed === 0 ? 'clean' : `dirty: ${changed} changed paths, left as they are`})`);
  }

  return { lines, unmet: lines.filter((line) => line.level === 'missing').length };
}

/** Prints the report and returns the exit code: 0 when every precondition is met, 1 otherwise. */
export async function main(argv = process.argv.slice(2), out = console) {
  const { values } = parseArgs({ args: argv, options: { root: { type: 'string' } }, strict: true });
  const root = path.resolve(values.root ?? DEFAULT_ROOT);
  const { lines, unmet } = await checkWorkspace(root);

  out.log(`Mono root: ${root}`);
  for (const line of lines) {
    const tag = { ok: 'ok     ', info: 'info   ', missing: 'MISSING' }[line.level];
    out.log(`${tag} ${line.text}`);
    if (line.fix) {
      out.log(`         provision: ${line.fix}`);
    }
  }

  if (unmet > 0) {
    out.log(`\nzh data workspace is not ready: ${unmet} unmet precondition(s).`);
    return 1;
  }
  out.log('\nzh data workspace is ready.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}

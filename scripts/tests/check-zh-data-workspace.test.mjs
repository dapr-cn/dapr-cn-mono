// Behavior tests for scripts/check-zh-data-workspace.mjs, run against temporary workspaces.

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'check-zh-data-workspace.mjs');

const CONFIG = [
  'repositories:',
  '- path: "repos/v1.17"',
  '  url: "https://github.com/dapr/docs.git"',
  '  branch: "v1.17"',
  '- path: "repos/v1.17_zh"',
  '  url: "https://github.com/dapr/docs-zh.git"',
  '  branch: "v1.17_content"',
  '',
].join('\n');

/** A temporary workspace with a package.json and monospecs.yaml, and no checkouts or toolchain yet. */
function makeWorkspace(base, config = CONFIG) {
  const root = mkdtempSync(path.join(base, 'ws-'));
  mkdirSync(path.join(root, '.hagicode'));
  writeFileSync(path.join(root, '.hagicode', 'monospecs.yaml'), config);
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ scripts: { 'zh:data:sync': 'tsx scripts/zh-data/sync_source_documents.ts' } }, null, 2),
  );
  mkdirSync(path.join(root, 'repos'));
  return root;
}

function makeCheckout(root, name) {
  const dir = path.join(root, 'repos', name);
  mkdirSync(dir, { recursive: true });
  execFileSync('git', ['init', '-b', 'main', dir], { stdio: ['ignore', 'pipe', 'pipe'] });
  writeFileSync(path.join(dir, 'README.md'), `${name}\n`);
}

function installTsx(root) {
  mkdirSync(path.join(root, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(path.join(root, 'node_modules', '.bin', 'tsx'), '#!/bin/sh\n');
}

/** Every file and directory under `dir` with its content, so a test can prove nothing was written. */
function snapshot(dir) {
  const entries = {};
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full);
      if (entry.isDirectory()) {
        entries[`${rel}/`] = '';
        walk(full);
      } else {
        entries[rel] = readFileSync(full, 'base64');
      }
    }
  };
  walk(dir);
  return entries;
}

function runCheck(root) {
  return spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });
}

function withTempBase(name, fn) {
  test(name, () => {
    const base = mkdtempSync(path.join(tmpdir(), 'zh-data-check-test-'));
    try {
      fn(base);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
}

withTempBase('incomplete workspace fails, names each missing precondition and writes nothing', (base) => {
  const root = makeWorkspace(base);
  makeCheckout(root, 'v1.17');
  // repos/v1.17_zh is absent and tsx is not installed.
  const before = snapshot(root);

  const result = runCheck(root);
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.match(output, /MISSING repos\/v1\.17_zh is missing/);
  assert.match(output, /provision: pnpm run sync:repos/);
  assert.match(output, /MISSING tsx is not installed/);
  assert.match(output, /provision: pnpm install/);
  assert.doesNotMatch(output, /workspace is ready/);
  assert.deepEqual(snapshot(root), before, 'the check must not create, modify or delete anything');
});

withTempBase('complete workspace passes and prints the resolved root', (base) => {
  const root = makeWorkspace(base);
  makeCheckout(root, 'v1.17');
  makeCheckout(root, 'v1.17_zh');
  installTsx(root);

  const result = runCheck(root);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`Mono root: ${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(result.stdout, /zh data workspace is ready/);
});

withTempBase('required checkouts follow the configured default version', (base) => {
  const config = [
    'repositories:',
    '- path: "repos/v1.17"',
    '  url: "https://github.com/dapr/docs.git"',
    '  branch: "v1.17"',
    '  optional: true',
    '- path: "repos/v1.17_zh"',
    '  url: "https://github.com/dapr/docs-zh.git"',
    '  branch: "v1.17_content"',
    '  optional: true',
    '- path: "repos/v1.19"',
    '  url: "https://github.com/dapr/docs.git"',
    '  branch: "v1.19"',
    '- path: "repos/v1.19_zh"',
    '  url: "https://github.com/dapr/docs-zh.git"',
    '  branch: "v1.19_content"',
    '',
  ].join('\n');
  const root = makeWorkspace(base, config);
  makeCheckout(root, 'v1.19');
  makeCheckout(root, 'v1.19_zh');
  installTsx(root);

  const result = runCheck(root);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /repos\/v1\.19 is present/);
  assert.match(result.stdout, /repos\/v1\.19_zh is present/);
  assert.doesNotMatch(result.stdout, /repos\/v1\.17 is missing/);
});

withTempBase('a dirty checkout is reported as information and does not fail the check', (base) => {
  const root = makeWorkspace(base);
  makeCheckout(root, 'v1.17');
  makeCheckout(root, 'v1.17_zh');
  writeFileSync(path.join(root, 'repos', 'v1.17_zh', 'README.md'), 'translation in progress\n');
  installTsx(root);

  const result = runCheck(root);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /repos\/v1\.17_zh is present \(dirty: 1 changed paths/);
});

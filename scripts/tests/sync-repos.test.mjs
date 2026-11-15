// Behavior tests for scripts/sync-repos.mjs, run against temporary git repositories.
// Remotes are local bare repositories, so the tests need no network access.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runSync, syncRepo } from '../sync-repos.mjs';

const IDENTITY = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

function git(args, cwd) {
  return execFileSync('git', args, { cwd, env: IDENTITY, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function head(cwd, ref = 'HEAD') {
  return git(['rev-parse', ref], cwd);
}

function branchOf(cwd) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
}

/** Creates a bare remote with `main` and `v1.17_content` branches. `seed` is a clone used to push more commits. */
function makeRemote(base, name) {
  const seed = path.join(base, `${name}-seed`);
  const bare = path.join(base, `${name}.git`);
  mkdirSync(seed);
  git(['init', '-b', 'main'], seed);
  writeFileSync(path.join(seed, 'README.md'), 'main 1\n');
  git(['add', '.'], seed);
  git(['commit', '-m', 'main 1'], seed);
  git(['checkout', '-b', 'v1.17_content'], seed);
  writeFileSync(path.join(seed, 'data.txt'), 'content 1\n');
  git(['add', '.'], seed);
  git(['commit', '-m', 'content 1'], seed);
  git(['checkout', 'main'], seed);
  execFileSync('git', ['init', '--bare', '-b', 'main', bare], { env: IDENTITY });
  git(['push', bare, 'main', 'v1.17_content'], seed);
  return { seed, bare };
}

/** Commits `text` to `file` on the seed's current branch and pushes that branch to the bare remote. */
function pushCommit(remote, file, text, message) {
  writeFileSync(path.join(remote.seed, file), text);
  git(['add', '.'], remote.seed);
  git(['commit', '-m', message], remote.seed);
  git(['push', remote.bare, `HEAD:${branchOf(remote.seed)}`], remote.seed);
}

function makeMonoRoot(base) {
  const mono = mkdtempSync(path.join(base, 'mono-'));
  mkdirSync(path.join(mono, 'repos'));
  mkdirSync(path.join(mono, '.hagicode'));
  return mono;
}

/** A test that gets its own temporary directory, removed afterwards even when the test fails. */
function tempTest(name, fn) {
  test(name, async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'sync-repos-test-'));
    try {
      await fn(base);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
}

tempTest('clones a missing entry on its declared branch', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const result = await syncRepo({ path: 'repos/data', url: remote.bare, displayName: 'data', branch: 'v1.17_content' }, mono);
  assert.equal(result.status, 'cloned');
  assert.equal(branchOf(path.join(mono, 'repos/data')), 'v1.17_content');
  assert.equal(readFileSync(path.join(mono, 'repos/data/data.txt'), 'utf8'), 'content 1\n');
});

tempTest('clones the default branch when no branch is declared', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const result = await syncRepo({ path: 'repos/plain', url: remote.bare, displayName: 'plain' }, mono);
  assert.equal(result.status, 'cloned');
  assert.equal(branchOf(path.join(mono, 'repos/plain')), 'main');
  assert.equal(result.message, 'cloned   plain');
});

tempTest('switches a clean checkout to the declared branch', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const entry = { path: 'repos/data', url: remote.bare, displayName: 'data' };
  await syncRepo(entry, mono);
  assert.equal(branchOf(path.join(mono, 'repos/data')), 'main');

  const result = await syncRepo({ ...entry, branch: 'v1.17_content' }, mono);
  assert.equal(result.status, 'updated');
  assert.match(result.message, /switched to v1\.17_content/);
  assert.equal(branchOf(path.join(mono, 'repos/data')), 'v1.17_content');
});

tempTest('reports current when the clean checkout already matches its remote', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const entry = { path: 'repos/data', url: remote.bare, displayName: 'data' };
  await syncRepo(entry, mono);
  const result = await syncRepo(entry, mono);
  assert.equal(result.status, 'current');
  assert.equal(result.message, 'current  data');
});

tempTest('skips a checkout with uncommitted changes and leaves it untouched', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const entry = { path: 'repos/data', url: remote.bare, displayName: 'data' };
  const checkout = path.join(mono, 'repos/data');
  await syncRepo(entry, mono);

  writeFileSync(path.join(checkout, 'README.md'), 'local translation in progress\n');
  const headBefore = head(checkout);
  pushCommit(remote, 'README.md', 'main 2\n', 'main 2');

  const result = await syncRepo({ ...entry, branch: 'v1.17_content' }, mono);
  assert.equal(result.status, 'skipped');
  assert.match(result.message, /uncommitted changes, not touched/);
  assert.equal(head(checkout), headBefore);
  assert.equal(branchOf(checkout), 'main');
  assert.equal(readFileSync(path.join(checkout, 'README.md'), 'utf8'), 'local translation in progress\n');
});

tempTest('fast-forwards a clean checkout that is behind its remote', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const entry = { path: 'repos/data', url: remote.bare, displayName: 'data' };
  const checkout = path.join(mono, 'repos/data');
  await syncRepo(entry, mono);
  const old = head(checkout);

  pushCommit(remote, 'README.md', 'main 2\n', 'main 2');
  const result = await syncRepo(entry, mono);
  assert.equal(result.status, 'updated');
  assert.equal(head(checkout), head(remote.seed));
  assert.notEqual(head(checkout), old);
});

tempTest('fails a diverged checkout and does not merge, rebase or reset it', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const entry = { path: 'repos/data', url: remote.bare, displayName: 'data' };
  const checkout = path.join(mono, 'repos/data');
  await syncRepo(entry, mono);

  writeFileSync(path.join(checkout, 'local.txt'), 'local only\n');
  git(['add', '.'], checkout);
  git(['commit', '-m', 'local only'], checkout);
  const localHead = head(checkout);
  pushCommit(remote, 'remote.txt', 'remote only\n', 'remote only');

  await assert.rejects(syncRepo(entry, mono));
  assert.equal(head(checkout), localHead);
  assert.equal(git(['rev-list', '--parents', '-n', '1', 'HEAD'], checkout).split(' ').length, 2, 'no merge commit');
});

tempTest('fails a required entry whose declared branch does not exist', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  await assert.rejects(syncRepo({ path: 'repos/data', url: remote.bare, displayName: 'data', branch: 'no-such-branch' }, mono));
});

tempTest('skips an optional entry whose remote is unreachable without creating anything', async (base) => {
  const mono = makeMonoRoot(base);
  const result = await syncRepo(
    { path: 'repos/data', url: path.join(base, 'missing.git'), displayName: 'data', branch: 'v1.15', optional: true },
    mono,
  );
  assert.equal(result.status, 'skipped');
  assert.match(result.message, /optional/);
  assert.equal(existsSync(path.join(mono, 'repos/data')), false);
});

tempTest('skips an optional entry whose declared branch is missing', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const result = await syncRepo({ path: 'repos/data', url: remote.bare, displayName: 'data', branch: 'v1.15', optional: true }, mono);
  assert.equal(result.status, 'skipped');
  assert.equal(existsSync(path.join(mono, 'repos/data')), false);
});

tempTest('runSync processes the remaining entries after a failure and exits 1', async (base) => {
  const remote = makeRemote(base, 'docs');
  const mono = makeMonoRoot(base);
  const configPath = path.join(mono, '.hagicode', 'monospecs.yaml');
  writeFileSync(
    configPath,
    [
      'repositories:',
      '- path: "repos/broken"',
      `  url: "${remote.bare}"`,
      '  displayName: "broken"',
      '  branch: "no-such-branch"',
      '- path: "repos/good"',
      `  url: "${remote.bare}"`,
      '  displayName: "good"',
      '  branch: "v1.17_content"',
      '- path: "repos/optional-gone"',
      `  url: "${path.join(base, 'gone.git')}"`,
      '  displayName: "optional-gone"',
      '  optional: true',
      '',
    ].join('\n'),
  );

  const lines = [];
  const out = { log: (m) => lines.push(m), error: (m) => lines.push(m) };
  const code = await runSync({ configPath, monoRoot: mono }, out);

  assert.equal(code, 1);
  assert.equal(branchOf(path.join(mono, 'repos/good')), 'v1.17_content');
  assert.ok(lines.some((l) => l.startsWith('failed   broken')), 'broken entry is reported as failed');
  assert.ok(lines.some((l) => l.startsWith('skipped  optional-gone')), 'optional entry is reported as skipped');
  assert.ok(lines.some((l) => l.includes('3 repositories processed, 1 failed.')), 'summary counts one failure');
});

tempTest('runSync exits 0 when the only unreachable entries are optional', async (base) => {
  const mono = makeMonoRoot(base);
  const configPath = path.join(mono, '.hagicode', 'monospecs.yaml');
  writeFileSync(
    configPath,
    [
      'repositories:',
      '- path: "repos/optional-gone"',
      `  url: "${path.join(base, 'gone.git')}"`,
      '  displayName: "optional-gone"',
      '  optional: true',
      '',
    ].join('\n'),
  );
  const out = { log: () => {}, error: () => {} };
  assert.equal(await runSync({ configPath, monoRoot: mono }, out), 0);
});

// Behavior tests for scripts/lib/default-version.mjs, run against temporary monospecs files.

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { repoPathsForVersion, resolveDefaultVersion, MONO_ROOT } from '../lib/default-version.mjs'

const REAL_MONOSPECS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.hagicode', 'monospecs.yaml')

/** One repository entry per path. `optional` adds `optional: true`. */
function entry(repoPath, { optional = false } = {}) {
  return [`- path: "${repoPath}"`, `  url: "https://example.test/${repoPath}.git"`, ...(optional ? ['  optional: true'] : [])].join('\n')
}

function pair(version, options = {}) {
  return [entry(`repos/${version}`, options), entry(`repos/${version}_zh`, options)].join('\n')
}

/** Writes a temporary mono root whose .hagicode/monospecs.yaml holds `body`, and returns the root. */
function makeRoot(body) {
  const root = mkdtempSync(path.join(tmpdir(), 'default-version-'))
  mkdirSync(path.join(root, '.hagicode'))
  writeFileSync(path.join(root, '.hagicode', 'monospecs.yaml'), `repositories:\n${body}\n`)
  return root
}

function withRoot(body, check) {
  const root = makeRoot(body)
  try {
    check(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('the current shape resolves to v1.17 (v1.17 required, v1.15 optional)', () => {
  withRoot([pair('v1.17'), pair('v1.15', { optional: true })].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
})

test('the real monospecs resolves to v1.19', () => {
  assert.equal(resolveDefaultVersion(MONO_ROOT), 'v1.19')
  assert.equal(path.join(MONO_ROOT, '.hagicode', 'monospecs.yaml'), REAL_MONOSPECS)
})

test('versions compare numerically, so v1.17 beats v1.9', () => {
  withRoot([pair('v1.9'), pair('v1.17')].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
  withRoot([pair('v1.17'), pair('v1.9')].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
})

test('major version is compared before minor version', () => {
  withRoot([pair('v1.17'), pair('v2.0')].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v2.0')
  })
})

test('optional pairs are ignored', () => {
  withRoot([pair('v1.17'), pair('v1.18', { optional: true })].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
})

test('a version with only one optional entry is ignored', () => {
  withRoot(
    [pair('v1.17'), entry('repos/v1.18'), entry('repos/v1.18_zh', { optional: true })].join('\n'),
    (root) => {
      assert.equal(resolveDefaultVersion(root), 'v1.17')
    },
  )
})

test('a version registered only as vX.Y is ignored', () => {
  withRoot([pair('v1.17'), entry('repos/v1.18')].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
})

test('a version registered only as vX.Y_zh is ignored', () => {
  withRoot([pair('v1.17'), entry('repos/v1.18_zh')].join('\n'), (root) => {
    assert.equal(resolveDefaultVersion(root), 'v1.17')
  })
})

test('a missing monospecs file is a clear error that names the file and the fix', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'default-version-'))
  try {
    assert.throws(
      () => resolveDefaultVersion(root),
      (error) => {
        assert.match(error.message, /未找到/)
        assert.match(error.message, /\.hagicode\/monospecs\.yaml/)
        assert.match(error.message, /--version vX\.Y/)
        assert.match(error.message, /repos\/vX\.Y 与 repos\/vX\.Y_zh/)
        return true
      },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('unparseable YAML is a clear error that names the file and the fix', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'default-version-'))
  try {
    mkdirSync(path.join(root, '.hagicode'))
    writeFileSync(path.join(root, '.hagicode', 'monospecs.yaml'), 'repositories: [\n  - path: "repos/v1.17"\n')
    assert.throws(
      () => resolveDefaultVersion(root),
      (error) => {
        assert.match(error.message, /无法解析 \.hagicode\/monospecs\.yaml/)
        assert.match(error.message, /--version vX\.Y/)
        assert.match(error.message, /repos\/vX\.Y 与 repos\/vX\.Y_zh/)
        return true
      },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('no required pair is a clear error that names the file and the fix', () => {
  withRoot(pair('v1.15', { optional: true }), (root) => {
    assert.throws(
      () => resolveDefaultVersion(root),
      (error) => {
        assert.match(error.message, /没有可用的必需版本配对/)
        assert.match(error.message, /\.hagicode\/monospecs\.yaml/)
        assert.match(error.message, /--version vX\.Y/)
        assert.match(error.message, /repos\/vX\.Y 与 repos\/vX\.Y_zh/)
        return true
      },
    )
  })
})

test('repoPathsForVersion derives the source and zh paths relative to the mono root', () => {
  assert.deepEqual(repoPathsForVersion('v1.15'), { sourceRepo: 'repos/v1.15', zhRepo: 'repos/v1.15_zh' })
  assert.deepEqual(repoPathsForVersion('v1.17'), { sourceRepo: 'repos/v1.17', zhRepo: 'repos/v1.17_zh' })
})

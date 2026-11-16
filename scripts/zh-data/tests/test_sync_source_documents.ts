import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync, existsSync, readFileSync, utimesSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { buildBucketConfigs, buildPipeline, parseCliArgs, parseMounts } from '../sync_source_documents.ts'
import { parseCliArgs as parseRepairArgs } from '../repair_translation_integrity.ts'

const REAL_MONO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function writeText(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
}

// The current shape: v1.17 required, v1.15 optional. Fixed here so the defaults do not follow the real file.
const CURRENT_SHAPE_MONOSPECS = [
  'repositories:',
  '- path: "repos/v1.17"',
  '  url: "https://github.com/dapr/docs.git"',
  '- path: "repos/v1.17_zh"',
  '  url: "https://github.com/dapr/docs-zh.git"',
  '- path: "repos/v1.15"',
  '  optional: true',
  '- path: "repos/v1.15_zh"',
  '  optional: true',
  '',
].join('\n')

/** Runs `check` with a temporary mono root whose monospecs holds `content`, or no monospecs file when `content` is null. */
function withMonoRoot(content: string | null, check: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'zh-sync-root-'))
  try {
    if (content !== null) {
      writeText(join(root, '.hagicode', 'monospecs.yaml'), content)
    }
    check(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('parseCliArgs without arguments uses the monospecs default and its derived paths', () => {
  withMonoRoot(CURRENT_SHAPE_MONOSPECS, (root) => {
    const { generatedAt, ...options } = parseCliArgs([], root)
    assert.equal(typeof generatedAt, 'string')
    assert.deepEqual(options, {
      version: 'v1.17',
      sourceRepo: 'repos/v1.17',
      zhRepo: 'repos/v1.17_zh',
      hugoConfigPath: 'repos/v1.17/hugo.yaml',
    })
  })
})

test('parseCliArgs with --version v1.15 derives every path from v1.15', () => {
  withMonoRoot(CURRENT_SHAPE_MONOSPECS, (root) => {
    const { generatedAt, ...options } = parseCliArgs(['--version', 'v1.15'], root)
    assert.deepEqual(options, {
      version: 'v1.15',
      sourceRepo: 'repos/v1.15',
      zhRepo: 'repos/v1.15_zh',
      hugoConfigPath: 'repos/v1.15/hugo.yaml',
    })
  })
})

test('parseCliArgs with --version v1.15 and --zh-repo keeps the explicit zh repo and derives the source', () => {
  withMonoRoot(CURRENT_SHAPE_MONOSPECS, (root) => {
    const { generatedAt, ...options } = parseCliArgs(['--version', 'v1.15', '--zh-repo', 'custom/zh'], root)
    assert.deepEqual(options, {
      version: 'v1.15',
      sourceRepo: 'repos/v1.15',
      zhRepo: 'custom/zh',
      hugoConfigPath: 'repos/v1.15/hugo.yaml',
    })
  })
})

test('parseCliArgs derives hugo-config from an explicit source repo when no hugo-config is given', () => {
  withMonoRoot(CURRENT_SHAPE_MONOSPECS, (root) => {
    const { generatedAt, ...options } = parseCliArgs(['--source-repo', 'other/src'], root)
    assert.deepEqual(options, {
      version: 'v1.17',
      sourceRepo: 'other/src',
      zhRepo: 'repos/v1.17_zh',
      hugoConfigPath: 'other/src/hugo.yaml',
    })
  })
})

test('parseCliArgs with an explicit --version never reads monospecs', () => {
  withMonoRoot(null, (root) => {
    const { generatedAt, ...options } = parseCliArgs(['--version', 'v1.15'], root)
    assert.equal(options.version, 'v1.15')
    assert.equal(options.sourceRepo, 'repos/v1.15')
  })
  withMonoRoot('repositories: []\n', (root) => {
    const { generatedAt, ...options } = parseCliArgs(['--version', 'v1.15'], root)
    assert.equal(options.zhRepo, 'repos/v1.15_zh')
  })
})

test('parseCliArgs without --version and without a usable monospecs version stops with a clear error', () => {
  withMonoRoot(null, (root) => {
    assert.throws(() => parseCliArgs([], root), /未找到 .*monospecs\.yaml/)
  })
  withMonoRoot('repositories: []\n', (root) => {
    assert.throws(() => parseCliArgs([], root), /没有可用的必需版本配对/)
  })
})

test('buildBucketConfigs derives buckets from hugo mounts', () => {
  const root = mkdtempSync(join(tmpdir(), 'zh-sync-'))
  try {
    const hugoPath = join(root, 'hugo.yaml')
    writeText(
      hugoPath,
      [
        'module:',
        '  mounts:',
        '    - source: daprdocs/content/en',
        '      target: content',
        '      lang: en',
        '    - source: sdkdocs/python/content/en/python-sdk-docs',
        '      target: content/developing-applications/sdks/python',
        '      lang: en',
        '    - source: sdkdocs/python/content/en/python-sdk-contributing',
        '      target: content/contributing/sdk-contrib/',
        '      lang: en',
        '    - source: translations/docs-zh/translated_content/zh_CN/docs',
        '      target: content',
        '      lang: zh-hans',
        '    - source: translations/docs-zh/translated_content/zh_CN/sdks_python',
        '      target: content/developing-applications/sdks/python',
        '      lang: zh-hans',
        '    - source: translations/docs-zh/translated_content/zh_CN/contributing',
        '      target: content/contributing/sdk-contrib/',
        '      lang: zh-hans',
      ].join('\n'),
    )

    const buckets = Object.fromEntries(buildBucketConfigs(parseMounts(hugoPath)).map((item) => [item.bucket, item]))
    assert.deepEqual(Object.keys(buckets).sort(), ['contributing', 'docs', 'sdks_python'])
    assert.deepEqual(buckets.docs.sourceRoots, ['daprdocs/content/en'])
    assert.deepEqual(buckets.sdks_python.sourceRoots, ['sdkdocs/python/content/en/python-sdk-docs'])
    assert.deepEqual(buckets.contributing.sourceRoots, ['sdkdocs/python/content/en/python-sdk-contributing'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('buildPipeline keeps relativePath stable and writes JSON', async () => {
  const root = mkdtempSync(join(tmpdir(), 'zh-sync-'))
  const sourceRepo = join(root, 'source')
  const zhRepo = join(root, 'zh')
  mkdirSync(sourceRepo, { recursive: true })
  mkdirSync(zhRepo, { recursive: true })

  try {
    const hugoPath = join(sourceRepo, 'hugo.yaml')
    writeText(
      hugoPath,
      [
        'module:',
        '  mounts:',
        '    - source: daprdocs/content/en',
        '      target: content',
        '      lang: en',
        '    - source: sdkdocs/python/content/en/python-sdk-docs',
        '      target: content/developing-applications/sdks/python',
        '      lang: en',
        '    - source: sdkdocs/python/content/en/python-sdk-contributing',
        '      target: content/contributing/sdk-contrib/',
        '      lang: en',
        '    - source: translations/docs-zh/translated_content/zh_CN/docs',
        '      target: content',
        '      lang: zh-hans',
        '    - source: translations/docs-zh/translated_content/zh_CN/sdks_python',
        '      target: content/developing-applications/sdks/python',
        '      lang: zh-hans',
        '    - source: translations/docs-zh/translated_content/zh_CN/contributing',
        '      target: content/contributing/sdk-contrib/',
        '      lang: zh-hans',
      ].join('\n'),
    )

    writeText(join(sourceRepo, 'daprdocs/content/en/getting-started/install.md'), '# install\n')
    writeText(join(sourceRepo, 'sdkdocs/python/content/en/python-sdk-docs/_index.md'), '# sdk\n')
    writeText(join(sourceRepo, 'sdkdocs/python/content/en/python-sdk-contributing/python.md'), '# contribute\n')
    writeText(join(zhRepo, 'data/source/stale/orphan.md'), '# stale\n')
    writeText(join(zhRepo, 'translated_content/zh_CN/docs/getting-started/install.md'), '# translated install\n')
    writeText(join(zhRepo, 'translated_content/zh_CN/contributing/python.md'), '# stale contribute\n')
    writeText(join(zhRepo, 'translated_content/zh_CN/docs/orphan.md'), '# orphan translation\n')
    utimesSync(
      join(zhRepo, 'translated_content/zh_CN/docs/getting-started/install.md'),
      new Date('2026-03-28T15:12:00Z'),
      new Date('2026-03-28T15:12:00Z'),
    )
    utimesSync(
      join(zhRepo, 'translated_content/zh_CN/contributing/python.md'),
      new Date('2026-03-28T12:00:00Z'),
      new Date('2026-03-28T12:00:00Z'),
    )
    utimesSync(
      join(zhRepo, 'translated_content/zh_CN/docs/orphan.md'),
      new Date('2026-03-28T16:00:00Z'),
      new Date('2026-03-28T16:00:00Z'),
    )

    const payloads = await buildPipeline({
      sourceRepo,
      zhRepo,
      hugoConfigPath: hugoPath,
      version: 'v1.17',
      generatedAt: '2026-03-28T14:08:00Z',
    })

    const dataDir = join(zhRepo, 'data')
    for (const filePath of [
      join(dataDir, 'sync-status.json'),
      join(dataDir, 'glossary.json'),
      join(dataDir, 'source.json'),
      join(dataDir, 'source-manifest.json'),
      join(dataDir, 'source/docs/getting-started/install.md'),
      join(dataDir, 'source/sdks_python/_index.md'),
      join(dataDir, 'source/contributing/python.md'),
    ]) {
      assert.equal(existsSync(filePath), true, `missing file: ${filePath}`)
      if (filePath.endsWith('.json')) {
        JSON.parse(readFileSync(filePath, 'utf-8'))
      }
    }

    const syncItems = payloads.syncStatus.items as Array<Record<string, string | null>>
    const byKey = new Map(syncItems.map((item) => [`${item.bucket}:${item.relativePath}`, item]))
    assert.ok(byKey.has('docs:getting-started/install.md'))
    assert.ok(byKey.has('sdks_python:_index.md'))
    assert.ok(byKey.has('contributing:python.md'))
    assert.equal(byKey.get('docs:orphan.md')?.translationStatus, 'orphanTranslation')
    assert.equal(byKey.get('contributing:python.md')?.status, 'synced')
    assert.equal(byKey.get('contributing:python.md')?.sourceStatus, 'synced')
    assert.equal(byKey.get('contributing:python.md')?.sourceFile, 'data/source/contributing/python.md')
    assert.equal(byKey.get('contributing:python.md')?.mirroredSha256, byKey.get('contributing:python.md')?.sourceSha256)
    assert.equal(byKey.get('docs:getting-started/install.md')?.translationStatus, 'translated')
    assert.equal(byKey.get('docs:getting-started/install.md')?.translationFile, 'translated_content/zh_CN/docs/getting-started/install.md')
    assert.equal(byKey.get('contributing:python.md')?.translationStatus, 'staleTranslation')
    assert.equal(byKey.get('sdks_python:_index.md')?.translationStatus, 'missingTranslation')
    assert.equal(existsSync(join(dataDir, 'source/stale/orphan.md')), false)
    assert.equal(existsSync(join(zhRepo, 'translated_content/zh_CN/docs/orphan.md')), true)

    const sourceMetadata = JSON.parse(readFileSync(join(dataDir, 'source.json'), 'utf-8')) as {
      items: Array<Record<string, string>>
    }
    const docsItem = sourceMetadata.items.find((item) => item.bucket === 'docs')
    assert.ok(docsItem)
    if (!docsItem) {
      throw new Error('expected docs item in source metadata')
    }
    assert.equal(docsItem.relativePath, 'getting-started/install.md')
    assert.equal(docsItem.sourceFile, 'data/source/docs/getting-started/install.md')
    assert.equal(byKey.get(`${docsItem.bucket}:${docsItem.relativePath}`)?.sourceFile, docsItem.sourceFile)
    assert.equal(readFileSync(join(zhRepo, docsItem.sourceFile), 'utf-8'), '# install\n')

    assert.equal(existsSync(join(dataDir, 'copy-log.json')), false)
    assert.deepEqual((payloads.syncStatus as { sourceSummary: Record<string, number> }).sourceSummary, {
      synced: 3,
      drift: 0,
      missingSource: 1,
    })
    assert.deepEqual((payloads.syncStatus as { translationSummary: Record<string, number> }).translationSummary, {
      translated: 1,
      staleTranslation: 1,
      missingTranslation: 1,
      orphanTranslation: 1,
    })
    assert.equal((payloads.source as { documentCount: number }).documentCount, 3)
    assert.equal((payloads.sourceManifest as { failureCount: number }).failureCount, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('zh:data:repair defaults to repos/<version>_zh inside the mono root', () => {
  withMonoRoot(CURRENT_SHAPE_MONOSPECS, (root) => {
    const options = parseRepairArgs([], root)
    assert.equal(options.version, 'v1.17')
    assert.equal(options.repoPath, join(root, 'repos', 'v1.17_zh'))
    assert.equal(relative(root, options.repoPath).startsWith('..'), false)
  })
})

test('zh:data:repair with an explicit --repo and --version keeps the old resolution and never reads monospecs', () => {
  withMonoRoot(null, () => {
    const options = parseRepairArgs(['--repo', 'repos/v1.17_zh', '--version', 'v1.17', '--mode', 'audit'])
    assert.equal(options.version, 'v1.17')
    assert.equal(options.repoPath, resolve(process.cwd(), 'repos/v1.17_zh'))
    assert.equal(options.mode, 'audit')
  })
})

test('zh:data:repair without --version and without a usable monospecs version stops with a clear error', () => {
  withMonoRoot('repositories: []\n', (root) => {
    assert.throws(() => parseRepairArgs([], root), /没有可用的必需版本配对/)
  })
})

test('zh:data:repair exits non-zero and writes nothing when monospecs has no usable version', () => {
  const root = mkdtempSync(join(tmpdir(), 'zh-repair-root-'))
  try {
    // A copy of the scripts under a temporary mono root, so the real monospecs is not involved.
    cpSync(join(REAL_MONO_ROOT, 'scripts', 'zh-data'), join(root, 'scripts', 'zh-data'), { recursive: true })
    cpSync(join(REAL_MONO_ROOT, 'scripts', 'lib'), join(root, 'scripts', 'lib'), { recursive: true })
    writeText(join(root, '.hagicode', 'monospecs.yaml'), 'repositories: []\n')
    symlinkSync(join(REAL_MONO_ROOT, 'node_modules'), join(root, 'node_modules'), 'dir')
    const before = readdirSync(root, { recursive: true }).map(String).sort()

    const result = spawnSync(
      join(REAL_MONO_ROOT, 'node_modules', '.bin', 'tsx'),
      [join(root, 'scripts', 'zh-data', 'repair_translation_integrity.ts'), '--mode', 'audit'],
      { cwd: root, encoding: 'utf-8' },
    )

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /\.hagicode\/monospecs\.yaml/)
    assert.match(result.stderr, /--version vX\.Y/)
    assert.deepEqual(readdirSync(root, { recursive: true }).map(String).sort(), before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

/**
 * Default Dapr docs version for the root commands (zh:data:sync, zh:data:repair, docs:verify).
 *
 * The default is the highest vX.Y for which both repos/vX.Y and repos/vX.Y_zh are registered in
 * .hagicode/monospecs.yaml without `optional: true`. Versions compare by major, then minor.
 * An explicit --version never reaches this module, so it works even when monospecs is unusable.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

export const MONOSPECS_RELATIVE_PATH = path.join('.hagicode', 'monospecs.yaml')

/** The mono root, from this file's location (scripts/lib/ is two levels below it). */
export const MONO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const SOURCE_PATH = /^repos\/v(\d+)\.(\d+)$/
const ZH_PATH = /^repos\/v(\d+)\.(\d+)_zh$/
const FIX_HINT = '请传入 --version vX.Y，或在 .hagicode/monospecs.yaml 中登记必需的 repos/vX.Y 与 repos/vX.Y_zh（不带 optional: true）。'

function fail(reason) {
  return new Error(`${reason}\n${FIX_HINT}`)
}

/**
 * Returns the default version (for example "v1.17") read from `<root>/.hagicode/monospecs.yaml`.
 * Throws an Error whose message names the file and says how to fix it when no version can be chosen.
 */
export function resolveDefaultVersion(root = MONO_ROOT) {
  const file = path.join(root, MONOSPECS_RELATIVE_PATH)
  if (!existsSync(file)) {
    throw fail(`未找到 ${file}（.hagicode/monospecs.yaml 不存在），无法确定默认版本。`)
  }

  let config
  try {
    config = yaml.load(readFileSync(file, 'utf-8'))
  } catch (error) {
    throw fail(`无法解析 .hagicode/monospecs.yaml：${error instanceof Error ? error.message : String(error)}`)
  }

  const repositories = Array.isArray(config?.repositories) ? config.repositories : []
  const pairs = new Map()
  for (const repo of repositories) {
    if (!repo || repo.optional || typeof repo.path !== 'string') {
      continue
    }
    const sourceMatch = SOURCE_PATH.exec(repo.path)
    const zhMatch = sourceMatch ? null : ZH_PATH.exec(repo.path)
    const match = sourceMatch ?? zhMatch
    if (!match) {
      continue
    }
    const major = Number(match[1])
    const minor = Number(match[2])
    const key = `${major}.${minor}`
    const pair = pairs.get(key) ?? { major, minor, source: false, zh: false }
    if (sourceMatch) {
      pair.source = true
    } else {
      pair.zh = true
    }
    pairs.set(key, pair)
  }

  const usable = [...pairs.values()]
    .filter((pair) => pair.source && pair.zh)
    .sort((left, right) => right.major - left.major || right.minor - left.minor)

  if (usable.length === 0) {
    throw fail('.hagicode/monospecs.yaml 中没有可用的必需版本配对（repos/vX.Y 与 repos/vX.Y_zh 都未登记为必需）。')
  }

  return `v${usable[0].major}.${usable[0].minor}`
}

/** Repository paths derived from a version, relative to the mono root (for example repos/v1.17 and repos/v1.17_zh). */
export function repoPathsForVersion(version) {
  return {
    sourceRepo: `repos/${version}`,
    zhRepo: `repos/${version}_zh`,
  }
}

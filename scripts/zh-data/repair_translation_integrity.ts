import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { auditTranslationIntegrity, readTranslationIntegrityBundle, repairTranslationIntegrity } from './lib/translation-integrity-audit.ts'
import { MONO_ROOT, repoPathsForVersion, resolveDefaultVersion } from '../lib/default-version.mjs'

export function parseCliArgs(argv: string[] = process.argv.slice(2), monoRoot: string = MONO_ROOT) {
  const { values } = parseArgs({
    args: argv,
    options: {
      version: { type: 'string' },
      repo: { type: 'string' },
      mode: { type: 'string', default: 'repair' },
      timestamp: { type: 'string' },
    },
  })

  // Without --version the default comes from monospecs; an explicit --version never reads it.
  const version = values.version ?? resolveDefaultVersion(monoRoot)
  // The default repo is relative to the mono root; an explicit --repo still resolves against the working directory.
  const repoPath = values.repo
    ? path.resolve(process.cwd(), values.repo)
    : path.resolve(monoRoot, repoPathsForVersion(version).zhRepo)
  const mode = values.mode === 'audit' ? 'audit' : 'repair'
  return {
    version,
    repoPath,
    mode,
    generatedAt: values.timestamp,
  }
}

export async function main() {
  const options = parseCliArgs()
  const action = options.mode === 'audit' ? auditTranslationIntegrity : repairTranslationIntegrity
  const result = await action(options.repoPath, options.version, { generatedAt: options.generatedAt })
  const current = await readTranslationIntegrityBundle(options.repoPath, options.version)

  console.log(
    JSON.stringify(
      {
        mode: options.mode,
        version: options.version,
        repoPath: options.repoPath,
        generatedAt: result.integrityReport.generatedAt,
        totalFindings: result.integrityReport.totalFindings,
        categories: result.integrityReport.categories,
        sourceSummary: current.syncStatus.sourceSummary,
        translationSummary: current.syncStatus.translationSummary,
      },
      null,
      2,
    ),
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}

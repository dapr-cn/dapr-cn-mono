# Tasks

## 1. 共享模块、配置与模板

- [x] 1.1 在 `repos/agent-skills` 为四个技能建立 `scripts/lib/` 骨架,以引擎的 `lib/yaml.mjs` 为底本拷贝出 `yaml.mjs`,并写 `config.mjs`(向上查找 `.hagicode/monospecs.yaml`、解析版本 参数 > `release.yaml` > 报错、解析仓库路径与引擎位置、向根命令显式传 `--version` / `--repo`)。验证:`tests/config.test.mjs` 覆盖「参数优先于 release.yaml」「无版本即报错」「从子目录定位 mono 根」「找不到 mono 根即报错」「审计命令的 `--repo` 是相对 mono 根的路径」,并通过。
- [x] 1.2 写 `guard.mjs`(计划哈希、`requireConfirm`、dry-run 判定,不读环境变量、台账或配置里的确认标记)和 `git.mjs`(`porcelain -z` 解析、`writeScope` 与 `syncOutputPaths` 分类、可注入的 `exec`)。验证:`tests/guard.test.mjs` 覆盖「确认与计划匹配才放行」「跨步骤确认被拒」「仓库状态变化后旧确认被拒」「历史记录不被当作确认」「dry-run 前后文件树与 git 状态一致」,`tests/git-scope.test.mjs` 覆盖重命名、暂存、未跟踪路径的分类。
- [x] 1.3 写 `tests/shared-lib-sync.test.mjs`,断言各技能下同名的共享模块逐字相同。验证:故意改动其中一份拷贝时该测试失败,恢复后通过。
- [x] 1.4 写 `repos/agent-skills/release.example.yaml`(逐字段注释:`schema`、`version`、`previousVersion`、`syncOutputPaths`、`upstreamPr.forkDocs.{path, submodulePath, upstreamUrl, upstreamBranch}`),在 `config.mjs` 里加 `release.yaml` 的结构校验。验证:`tests/config.test.mjs` 增加用例,模板通过校验,缺少 `version` 的文件报出缺失字段名。
- [x] 1.5 写 `repos/v1.17_zh/translations/release.yaml`(v1.17 的值,`syncOutputPaths: [data/]`)。验证:用同一校验器读取通过,且其 URL 与分支能在 `.hagicode/monospecs.yaml` 里找到对应条目;在添加前后各运行一次 `tr.mjs scan --json`,分类计数一致。

## 2. `dapr-docs-translate-incremental`

- [x] 2.1 写 `incremental.mjs` 的 `plan`:输出五个步骤的固定顺序(`sync:repos`、`zh:data:sync`、`scan`、引擎工作流 `kind: agent`、`status`),每条命令带解析出的版本与仓库参数,`--source-root` 由 profile 的 `sources.glob.root` 得出。验证:`tests/dapr-docs-translate-incremental/plan.test.mjs` 断言顺序、参数,以及计划里不含 `git push`、`git branch`、`git switch -c`、`git checkout`、`git stash`、`git reset`、`--no-verify`、`adopt`。
- [x] 2.2 写 `run --phase pre` 与 `run --phase post`:顺序执行,任一步非零退出就停止并报告;`scan` 无待办时标记「无待办」,仍运行 `status`。验证:`tests/dapr-docs-translate-incremental/run.test.mjs` 用注入的 `exec` 覆盖「同步失败后不运行 scan」「无待办」「全部成功」。
- [x] 2.3 写 `commit`:只收集 `translations/` 与 `translated_content/` 下有改动的路径,用 `git commit -m <prefix …> -- <path>` 提交,无改动不提交,`data/` 等其他改动只在输出中提示;默认 dry-run,`--execute` 才提交。验证:`tests/dapr-docs-translate-incremental/commit.test.mjs` 在临时 git 仓库里覆盖「范围外改动不被提交」「无改动不提交」「dry-run 前后仓库完全一致」。
- [x] 2.4 写 `SKILL.md`(`name: dapr-docs-translate-incremental`,description 写明触发场景:对已引导的版本做日常增量翻译;输入、五步流程、对 `dapr-docs-translation` 引擎技能的指向、规则、脚本用法)。验证:新增的 frontmatter 校验测试(检查 `name` 等于文件夹名、`description` 非空且包含触发场景)通过。

## 3. `dapr-docs-translation-verify`

- [x] 3.1 写 `gate.mjs` 的纯函数 `decide(inputs)`:三项检查结果、范围分类结果和前后快照比较产出 `canOpenPr` 与原因;命令无退出码即未通过。验证:`tests/dapr-docs-translation-verify/decide.test.mjs` 覆盖判定矩阵(全部通过、单项失败、命令无法启动、`fail` 路径、`blocked` 路径、快照不一致)。
- [x] 3.2 写 `gate.mjs run`:通过可注入的 `exec` 运行 `tr.mjs status --verify --fail-on stale,failed,blocked,orphan,drift,glossary`、`zh:data:repair --mode audit --version … --repo …`、`docs:verify --dry-run --version …`,前后各取一次 `git status --porcelain=v1 -z` 快照,输出含 `canOpenPr`、各项结果、`headCommit`、`statusDigest`、`generatedAt` 的 verdict。验证:`tests/dapr-docs-translation-verify/run.test.mjs` 断言命令行内容、verdict 字段,以及某个检查写了文件时结论为 `blocked`;并断言脚本自身运行前后临时仓库完全一致(只读)。
- [x] 3.3 在 v1.17 的真实数据上运行一次闸门的 `plan` 级输出(不执行写操作),核对 `--source-root` 的解析和 `zh:data:repair --mode audit` 是否只读。验证:记录结果;若 `--source-root` 无法由 `sources.glob.root` 得到,改用适配器 `_meta.sourceRoot` 并补测试。
- [x] 3.4 写 `SKILL.md`(`name: dapr-docs-translation-verify`,description 写明触发场景:发布前或开 PR 前的只读检查)。验证:frontmatter 校验测试通过。

## 4. `dapr-docs-version-bootstrap`

- [x] 4.1 写 `branches.mjs`:解析 `git ls-remote --heads` 输出,只识别 `^v(\d+)\.(\d+)$` 与 `^v(\d+)\.(\d+)_content$`,按数值排序,选出上一版,检测目标的上游分支是否存在。验证:`tests/dapr-docs-version-bootstrap/branches.test.mjs` 覆盖 `v1.2 < v1.13 < v1.20` 的排序、忽略 `new_content_v1.x`、空缺版本时选最近的较小版本、目标上游分支不存在。
- [x] 4.2 写 `monospecs-edit.mjs`:文本级追加 `repos/vX.Y` 与 `repos/vX.Y_zh` 两个 `optional: true` 条目(URL 取自上一版条目),保留注释与既有内容,已存在则不重复。验证:`tests/dapr-docs-version-bootstrap/monospecs-edit.test.mjs` 用现有 monospecs 的拷贝做夹具,断言既有部分逐字不变、重复运行为空操作。
- [x] 4.3 写 `bootstrap.mjs plan`:生成 S0 到 S7 的步骤(含 `done` 标记以支持中断后继续)、每步命令与 `planHash`;计划中没有 `adopt`;profile 更新只改版本相关字段。验证:`tests/dapr-docs-version-bootstrap/plan.test.mjs` 断言步骤顺序与类型、`done` 标记、`adopt` 缺席、目标上游分支缺失时停止。
- [x] 4.4 写 `bootstrap.mjs apply --step <id> --execute --confirm <hash>`:执行克隆、建分支、写 monospecs、更新 profile 与生成 `release.yaml`(不覆盖已有的)并只提交这两个 `translations/` 文件;S6 运行 `zh:data:sync` 与 `scan --json` 并报告 fresh / stale / new 数量;S7 推送仅在单独确认后执行。验证:`tests/dapr-docs-version-bootstrap/apply.test.mjs` 在本地裸仓库夹具上覆盖「只确认建分支时只有该步骤执行」「确认不匹配退出 3」「dry-run 前后文件树与引用不变」「报告的三类数量与 `scan --json` 一致」。
- [x] 4.5 写 `SKILL.md`(`name: dapr-docs-version-bootstrap`,description 写明触发场景:为新的 `vX.Y` 做首次引导),说明默认 dry-run、逐步确认与「不用 adopt」的原因。验证:frontmatter 校验测试通过。

## 5. `dapr-docs-upstream-pr`

- [x] 5.1 写 `upstream-pr.mjs` 的闸门校验:读取 `--gate <verdict.json>`,要求 `canOpenPr`、`headCommit`、`statusDigest` 与当前一致且 `generatedAt` 在 `--max-age-minutes` 内。验证:`tests/dapr-docs-upstream-pr/gate-check.test.mjs` 覆盖通过、过期、`headCommit` 不一致、`canOpenPr: false`(此时不输出确认值)。
- [x] 5.2 写 `plan`:输出阶段 A(A1 推送、A2 可选 PR)与阶段 B(B1 到 B5)的步骤、命令、目标与 `planHash`,B1 的 remote 与 B2 的子模块路径取自 `release.yaml`,推送目标取自 monospecs。验证:`tests/dapr-docs-upstream-pr/plan.test.mjs` 断言步骤与哈希、无 `--force`、dry-run 前后临时仓库完全一致。
- [x] 5.3 写 `apply`:阶段 A 的普通推送;阶段 B 开始前用 `git ls-remote` 确认目标提交存在,B1 只快进,B2 建分支并切子模块后 `git commit -- translations/docs-zh`,B3 运行 `npm ci && npm run build`(失败就停,不产出 PR 草稿),PR 描述草稿写入 `--out`;B4、B5 各自单独确认。验证:`tests/dapr-docs-upstream-pr/apply.test.mjs` 在本地裸仓库夹具和注入的 `exec` 上覆盖「只确认阶段 A 时阶段 B 不运行」「目标提交未推送时阶段 B 被拒」「上游分叉时停止且不合并」「远端不是祖先时推送被拒且不强推」「构建失败不推送」「确认不匹配退出 3」。
- [x] 5.4 写 `SKILL.md`(`name: dapr-docs-upstream-pr`,description 写明触发场景:译文通过闸门后向上游提交),写明两阶段、四步 PR 流程由技能自己定义、`fork-docs` README 没有对应小节、前置工具(Hugo、Node、`gh`)。验证:frontmatter 校验测试通过。

## 6. 文档与整体验证

- [x] 6.1 在 `repos/agent-skills/README.md` 的技能表里新增四行(各指向对应 `SKILL.md`,一句话说明用途)。验证:新增的 README 校验测试检查表格里有且仅有这四个新技能各一行,且链接指向存在的文件。
- [x] 6.2 写总的 frontmatter 校验测试 `tests/skills-structure.test.mjs`:每个顶层技能文件夹都有 `SKILL.md`,`name` 与文件夹同名,`description` 非空;所有 `scripts/**/*.mjs` 只 import `node:` 内置模块或相对路径。验证:该测试通过,且在一个夹具里加入 `import 'js-yaml'` 时失败。
- [x] 6.3 在 `repos/agent-skills` 运行 `npm test`。验证:全部测试通过,并且 `dapr-docs-translation/` 与 `tests/dapr-docs-translation/` 下的文件没有任何改动(`git diff --stat` 对这两个路径为空)。
- [x] 6.4 用 `rg` 在四个技能的 `scripts/` 与 `SKILL.md` 中搜索字面的 `v1.17`、`v1.15`。验证:没有命中(测试夹具目录除外)。

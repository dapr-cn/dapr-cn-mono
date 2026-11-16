# Tasks

## 1. 基线与共享解析器

- [x] 1.1 在改任何脚本之前,把 `pnpm run docs:verify --dry-run` 与 `pnpm run zh:data:check` 的输出各保存到会话临时目录作为基线;验证:两份基线文件存在,且 `docs:verify` 的基线含有解析出的源仓库、zh 仓库、生成的配置、缓存目录和预览地址。若 `docs:verify` 的 dry run 在当前环境无法运行,在基线文件里记下原因,并在 8.2 里改用 `--version v1.17` 的显式调用对比。
- [x] 1.2 新增 `scripts/lib/default-version.mjs`:按 design D2 的规则解析默认版本(只取必需的 `repos/vX.Y` 与 `repos/vX.Y_zh` 配对、数值比较),并提供由版本推导 `repos/<v>`、`repos/<v>_zh` 的出口;验证:`node -e` 引入该模块,对当前 `.hagicode/monospecs.yaml` 得到 `v1.17`。
- [x] 1.3 无可用版本、monospecs 缺失、YAML 无法解析三种情况抛出的错误都要包含 `.hagicode/monospecs.yaml` 与“传 `--version vX.Y` 或登记必需的配对”的提示;验证:下一项的测试断言了这些文字。
- [x] 1.4 新增 `scripts/tests/default-version.test.mjs`,用临时 monospecs 覆盖:`v1.9` 与 `v1.17` 数值比较、optional 配对被忽略、只登记 `vX.Y` 或只登记 `vX.Y_zh` 的版本被忽略、文件缺失、YAML 损坏、无必需配对,以及“当前形态(v1.17 必需、v1.15 optional)得到 v1.17”;验证:该测试全部通过。
- [x] 1.5 在 `package.json` 增加运行上述测试的脚本(例如 `version:default:test`),不改动任何现有脚本;验证:`pnpm run version:default:test` 通过,且 `package.json` 中现有脚本的值与改动前相同。

## 2. `zh:data:sync`

- [x] 2.1 在 `sync_source_documents.ts` 删除 `'v1.17'`、`'repos/v1.17'`、`'repos/v1.17_zh'` 三类字面默认值;`--version` 缺省时才调用解析器;`--source-repo`、`--zh-repo` 缺省时由版本推导;`--hugo-config` 的默认值在两者确定之后再计算,并把参数解析导出供测试使用;验证:`rg "v1\.17" scripts/zh-data/sync_source_documents.ts` 没有匹配。
- [x] 2.2 在 `scripts/zh-data/tests/test_sync_source_documents.ts` 增加用例:不传任何参数时得到 `v1.17`、`repos/v1.17`、`repos/v1.17_zh` 与 `repos/v1.17/hugo.yaml`;`--version v1.15` 时三者都按 v1.15 推导;`--version v1.15 --zh-repo <path>` 时 zh 仓库取 `<path>`、源仓库仍取 `repos/v1.15`;显式 `--version` 时不读取 monospecs(用缺失或无可用版本的临时 monospecs 证明);验证:`pnpm run zh:data:test` 通过。

## 3. `zh:data:repair`

- [x] 3.1 在 `repair_translation_integrity.ts` 删除 `version` 的字面默认值,缺省时调用解析器;`--repo` 的默认值改为 `repos/<version>_zh`,取代 `path.join('..', ...)`;显式 `--repo` 与 `--version` 的行为不变;验证:`rg "v1\.17|'\.\.'" scripts/zh-data/repair_translation_integrity.ts` 没有匹配。
- [x] 3.2 在 `zh:data:test` 的测试文件里增加用例:无参数时默认仓库是 `repos/v1.17_zh`,且解析后的绝对路径位于 mono 根之内;显式 `--repo repos/v1.17_zh --version v1.17` 的结果与改动前一致;monospecs 无可用版本且未传 `--version` 时,命令以非零退出并输出明确错误,没有写任何文件;验证:`pnpm run zh:data:test` 通过。

## 4. `docs:verify`

- [x] 4.1 在 `start-local-docs-verification.ts` 去掉 `version: 'v1.17'` 的初值:参数解析完成后,若没有 `--version`,以 `--workspace-root`(默认值是 mono 根)为根调用解析器;让 `main` 仅在作为入口运行时执行,并导出参数解析;验证:`rg "v1\.17" scripts/docs-verify/start-local-docs-verification.ts` 没有匹配。
- [x] 4.2 在 `scripts/docs-verify/tests/validate-local-docs-verification.ts` 增加用例:无 `--version` 时,临时工作区(monospecs 里 v1.17 必需、v1.15 optional)解析到 `repos/v1.17` 与 `repos/v1.17_zh`;显式 `--version v1.15` 优先;显式 `--source-repo`/`--zh-repo` 优先;临时工作区的 monospecs 无可用版本时给出明确错误;现有用例保持不变;验证:`pnpm run docs:verify:test` 通过。

## 5. README

- [x] 5.1 重写“Translate with the skill”:保留引擎的 `tr.mjs` 循环,并增加四个 skill 的顺序 `bootstrap -> translate-incremental -> verify -> upstream-pr`,用一张表给出每个 skill 的入口命令(`bootstrap.mjs plan`、`incremental.mjs plan` 与 `run`/`commit`、`gate.mjs plan` 与 `run`、`upstream-pr.mjs plan` 与 `apply`)、默认 dry-run 行为和确认规则;验证:逐项对照四个 `repos/agent-skills/*/SKILL.md`,表中每条命令与规则都能在对应文件中找到。
- [x] 5.2 用准确的“写入与推送边界”取代“The skill writes only `translations/` and `translated_content/`, and it never pushes”:引擎只写 profile 的写入范围且从不推送;incremental 只提交 `translations/` 与 `translated_content/` 下的改动、不推送、不建分支;verify 只读;bootstrap 与 upstream-pr 只在每次推送都单独确认后才推送,且从不强制推送;验证:`rg "never pushes" README.md` 只出现在对引擎或 incremental 的限定语境中,没有无限定的说法。
- [x] 5.3 重写“Upstream pull requests through fork-docs”:先说明需要 verify 给出通过且新鲜的结论,再按 `dapr-docs-upstream-pr` 的阶段 A 与阶段 B 说明,明确 B4(推送 fork)与 B5(创建 PR)各自单独确认,并保留四步手动等价命令;不引用 `repos/fork-docs` 的 README;验证:文中的每条命令都能在 `dapr-docs-upstream-pr/SKILL.md` 或原有手动步骤中找到,且没有任何步骤要求 `repos/dapr-docs-copilot`。
- [x] 5.4 更新仓库角色表:`repos/agent-skills` 一行列出五个 skill 与“不携带仓库事实”;`repos/v1.17_zh`、`repos/v1.17`、`repos/v1.15` 的只读与目标角色保持;表中不出现 `repos/dapr-docs-copilot`;验证:`rg "dapr-docs-copilot" README.md` 在角色表里没有匹配。
- [x] 5.5 更新 `zh:data:*` 与 `docs:verify` 的说明:默认版本取自 monospecs 的必需配对,显式 `--version` 优先并推导仓库;`zh:data:repair` 的 `--repo` 默认是 `repos/<version>_zh`,删除“从 mono 根运行要传 `--repo`”的提示;`docs:verify` 的“Defaults”一句不再把 `v1.17` 当作固定值;并说明 `check-zh-data-workspace.mjs` 目前仍检查 v1.17;验证:`rg "defaults to \`\.\./" README.md` 没有匹配,README 里的示例命令在 mono 根可以照抄运行。

## 6. `.hagicode/monospecs.yaml`

- [x] 6.1 只修改 `repos/agent-skills` 的 `note`,列出 `dapr-docs-translation`、`dapr-docs-translate-incremental`、`dapr-docs-translation-verify`、`dapr-docs-version-bootstrap`、`dapr-docs-upstream-pr`;验证:`git diff` 显示该文件只有这一条 `note` 变化,文件里没有 `repos/v1.18` 与 `repos/v1.18_zh`,且 `pnpm run zh:data:check:test` 与 `pnpm run sync:repos:test` 仍然通过。

## 7. `repos/agent-skills` 的 bootstrap S4 文案

- [x] 7.1 在 `dapr-docs-version-bootstrap/scripts/bootstrap.mjs` 把 S4 步骤标题改为插入具体版本的 `register repos/${V} and repos/${V}_zh in monospecs`;其他步骤、完成判定与命令不变;验证:`rg "repos/V " repos/agent-skills/dapr-docs-version-bootstrap/scripts/bootstrap.mjs` 没有匹配。
- [x] 7.2 在 `repos/agent-skills/tests/dapr-docs-version-bootstrap/plan.test.mjs` 增加断言:对 `v1.18` 的 plan 全文既不含字面 `repos/V ` 也不含 `repos/V_zh`,并且 S4 的标题含 `repos/v1.18 ` 与 `repos/v1.18_zh`;验证:在 `repos/agent-skills` 目录执行 `npm test` 全部通过。

## 8. 集成验收

- [x] 8.1 运行 `pnpm run zh:data:test`、`pnpm run docs:verify:test`、`pnpm run zh:data:check:test`、`pnpm run sync:repos:test`、`pnpm run version:default:test`;验证:五个命令全部通过。
- [x] 8.2 运行 `pnpm run zh:data:check`,以及 `pnpm run docs:verify --dry-run`(参数直接跟在脚本名之后);验证:前者仍报告 ready,后者输出与 1.1 的基线逐字一致,差异只允许出现在时间戳之类的本来就会变化的字段。
- [x] 8.3 在 `repos/agent-skills` 运行 `npm test`;验证:通过,且 `git -C repos/agent-skills status --short` 显示改动只有 `dapr-docs-version-bootstrap/scripts/bootstrap.mjs` 与 `tests/dapr-docs-version-bootstrap/plan.test.mjs`,`dapr-docs-translation/` 下没有任何改动。
- [x] 8.4 核对范围约束;验证:`.hagicode/monospecs.yaml` 里没有 `repos/v1.18`、`repos/v1.18_zh`;`repos/` 下没有新建 `v1.18` 目录;没有执行过 `bootstrap.mjs apply`;没有推送,也没有创建远端分支。

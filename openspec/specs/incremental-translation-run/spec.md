# Incremental Translation Run

## Purpose

规定 `dapr-docs-translate-incremental` 技能的行为:按固定顺序同步源文、盘点、调用翻译引擎、核对完成度,最后只提交译文目录;不推送也不建分支。

## Requirements

### Requirement: 固定的执行顺序
技能 SHALL 依次执行 `pnpm run sync:repos`、`pnpm run zh:data:sync`、`tr.mjs scan`、翻译引擎工作流、`tr.mjs status`。每条命令 SHALL 带上由配置解析出的版本与仓库参数。

#### Scenario: 为某个版本生成计划
- **WHEN** 对版本 `v1.18` 运行 `plan`
- **THEN** 输出按上述顺序列出五个步骤,其中 `zh:data:sync` 与 `scan` 带有 `v1.18` 对应的版本和路径

### Requirement: 步骤失败即停止
某一步以非零退出码结束时,技能 SHALL 不再执行后续步骤,并报告失败的步骤。

#### Scenario: 同步源文失败
- **WHEN** `zh:data:sync` 失败
- **THEN** 不运行 `scan` 和翻译引擎,输出指出失败的步骤与退出码,也不提交

### Requirement: 没有待办时跳过翻译
`scan` 报告没有待办文档时,技能 SHALL 跳过翻译引擎工作流,仍然运行 `status`,并如实报告「无待办」。

#### Scenario: 全部文档都是 fresh
- **WHEN** `scan` 的待办清单为空
- **THEN** 不派发任何翻译任务,输出 `status` 的完成度与「无待办」

### Requirement: 只提交译文目录
结束时技能 SHALL 只提交 `translations/` 与 `translated_content/` 下有改动的路径,使用 `git commit -- <path>`,提交信息使用 profile 的 `commit.messagePrefix`。没有改动时 SHALL NOT 创建空提交。

#### Scenario: 提交范围
- **WHEN** 运行结束时 `translated_content/` 与 `data/` 都有改动
- **THEN** 提交只含 `translated_content/`(及 `translations/` 的改动),`data/` 保持未提交并在输出中提示需要人工单独提交

#### Scenario: 默认 dry-run 的提交
- **WHEN** 调用提交步骤但没有执行标志
- **THEN** 只输出将要提交的路径与提交命令,不创建提交

### Requirement: 不推送、不建分支、不改历史
技能 SHALL NOT 执行 `git push`、创建分支、`git stash`、`git reset`、`git checkout` 或使用 `--no-verify`。

#### Scenario: 计划里没有被禁止的命令
- **WHEN** 检查 `plan` 生成的全部命令
- **THEN** 其中不包含 `git push`、`git branch`、`git switch -c`、`git checkout`、`git stash`、`git reset` 和 `--no-verify`

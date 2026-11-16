# Upstream PR Submission

## Purpose

规定 `dapr-docs-upstream-pr` 如何把译文提交到上游:要求验证闸门通过,默认只出计划,并分两个单独确认的阶段(推送到 `dapr/docs-zh`、在 `repos/fork-docs` 准备面向 `dapr/docs` 的 PR)执行。

## Requirements

### Requirement: 闸门是前置条件
技能 SHALL 要求一份新鲜且通过的闸门结论:`canOpenPr` 为 true、`headCommit` 等于目标仓库当前 `HEAD`、`statusDigest` 与当前工作区状态一致、`generatedAt` 在允许的时限内。任一条件不满足时 SHALL 拒绝出计划之外的任何动作。

#### Scenario: 闸门结论已过期
- **WHEN** 结论生成之后目标分支多了一个提交
- **THEN** 因 `headCommit` 不一致而拒绝,并提示重新运行闸门

#### Scenario: 闸门未通过
- **WHEN** 结论里 `canOpenPr` 为 false
- **THEN** 只输出拒绝原因,不输出可执行的确认值

### Requirement: 默认只出计划
默认调用 SHALL 只输出两个阶段的完整计划,包括每条命令、目标远端与分支、涉及的提交和各阶段的确认值,不产生副作用。

#### Scenario: 计划内容
- **WHEN** 为 `v1.18` 运行计划
- **THEN** 输出阶段 A 与阶段 B 的步骤列表和各自的计划哈希,没有远端或本地引用被改变

### Requirement: 阶段 A 推送翻译分支
阶段 A SHALL 把 `vX.Y_content` 推送到由 monospecs 中该仓库条目的 URL 所指向的 `dapr/docs-zh` 远端,只使用普通推送,MUST NOT 使用强制推送。需要时可以为该分支创建 PR,创建 PR 同样需要单独确认。

#### Scenario: 确认阶段 A
- **WHEN** 带着与阶段 A 计划匹配的确认值执行
- **THEN** 执行普通的 `git push` 到计划里的远端与分支

#### Scenario: 远端已有不同的历史
- **WHEN** 远端分支不是本地分支的祖先
- **THEN** 推送被拒绝并报告,不尝试强制推送

### Requirement: 阶段 B 准备面向 dapr/docs 的 PR
阶段 B SHALL 依次:在 `repos/fork-docs` 确认存在指向上游的 remote 并只做快进;把 `translations/docs-zh` 子模块切到阶段 A 推送的目标提交;运行 `npm ci && npm run build`;准备面向 `dapr/docs` 的 PR(本地分支、提交与 PR 描述草稿)。四个步骤由技能自身定义,MUST NOT 依赖 `fork-docs` README 中的文字。阶段 B 开始前 SHALL 确认目标提交已在 `dapr/docs-zh` 远端存在。

#### Scenario: 目标提交尚未推送
- **WHEN** 阶段 A 没有执行,`dapr/docs-zh` 上还没有目标提交
- **THEN** 阶段 B 拒绝执行并提示先完成阶段 A

#### Scenario: 上游无法快进
- **WHEN** `repos/fork-docs` 的分支与上游分叉
- **THEN** 阶段 B 停止并报告,不合并、不重置

#### Scenario: 构建失败
- **WHEN** `npm run build` 以非零退出
- **THEN** 不创建 PR 草稿,也不推送,输出构建日志的位置

### Requirement: 推送与开 PR 需要单独确认
阶段 A、阶段 B 的本地步骤、阶段 B 中 `repos/fork-docs` 分支的推送以及 `dapr/docs` 的 PR 创建 SHALL 各自需要当次调用的确认。一个确认 MUST NOT 覆盖另一个动作。

#### Scenario: 只确认了阶段 A
- **WHEN** 阶段 A 完成后没有给出阶段 B 的确认值
- **THEN** 阶段 B 不会运行,也不会有 PR 被创建

#### Scenario: 阶段 B 本地步骤完成后
- **WHEN** 本地分支与 PR 草稿已准备好,但没有对推送与创建 PR 给出确认
- **THEN** 输出推送与创建 PR 的计划,不执行

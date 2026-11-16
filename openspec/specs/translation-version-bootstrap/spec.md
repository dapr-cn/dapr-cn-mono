# Translation Version Bootstrap

## Purpose

规定 `dapr-docs-version-bootstrap` 如何引导一个新的 `vX.Y` 版本:探测分支、登记仓库、从上一版带入译文与状态、写入新 profile,并报告初始的 fresh / stale / new 数量;默认 dry-run,逐步确认。

## Requirements

### Requirement: 分支探测
技能 SHALL 从远端分支列表中只识别符合 `^v(\d+)\.(\d+)$` 的上游文档分支和符合 `^v(\d+)\.(\d+)_content$` 的翻译分支,按主、次版本号的数值排序。`new_content_vX.Y` 等旧命名 SHALL 被忽略。「上一版」SHALL 是比目标小且实际存在翻译分支的最大版本。

#### Scenario: 数值排序
- **WHEN** 上游分支包含 `v1.2`、`v1.13`、`v1.20`
- **THEN** 排序结果为 `v1.2`、`v1.13`、`v1.20`

#### Scenario: 选择上一版并跳过空缺
- **WHEN** 翻译分支只有 `v1.15_content` 与 `v1.17_content`,目标是 `v1.18`
- **THEN** 上一版是 `v1.17`;目标是 `v1.16` 时上一版是 `v1.15`

#### Scenario: 目标的上游分支不存在
- **WHEN** 目标 `v1.99` 在上游没有对应分支
- **THEN** 技能停止并报告,不建任何分支也不改 monospecs

### Requirement: 登记到 monospecs
技能 SHALL 在 `.hagicode/monospecs.yaml` 中新增 `repos/vX.Y`(分支 `vX.Y`)和`repos/vX.Y_zh`(分支 `vX.Y_content`)两个条目,均为 `optional: true`,URL 取自上一版对应条目。写入 SHALL 保留文件里已有的注释和其他条目的原文,且 SHALL NOT 产生重复条目。

#### Scenario: 首次登记
- **WHEN** monospecs 中没有 `repos/v1.18` 与 `repos/v1.18_zh`
- **THEN** 追加两条 `optional: true` 的条目,原有内容逐字保持不变

#### Scenario: 重复运行
- **WHEN** 两个条目已存在
- **THEN** 不做修改,报告「已登记」

### Requirement: 从上一版带入状态且不使用 adopt
新版本的翻译分支 SHALL 由上一版的 `_content` 分支切出,以便带入 `translations/`(含台账与术语表)、基线源文副本和 `translated_content/`。技能 MUST NOT 使用 `tr.mjs adopt`,因为被采纳的文档没有基线源文副本,以后只能整篇重译。

#### Scenario: 带入内容
- **WHEN** 从 `v1.17_content` 引导 `v1.18`
- **THEN** 新分支的 `translations/` 含上一版的台账、术语表与基线副本,`translated_content/` 含已有译文

#### Scenario: 计划中没有 adopt
- **WHEN** 检查引导计划的全部命令
- **THEN** 其中不包含 `adopt`

### Requirement: 写入新的 profile
技能 SHALL 为新版本更新 `profile.yaml` 中与版本相关的字段(如 `repo`、`sources.description`),保持 schema 不变,其余人工设置原样保留;并 SHALL 生成新版本的 `release.yaml`(不覆盖已存在的)。

#### Scenario: profile 更新范围
- **WHEN** 从 v1.17 的 profile 引导 v1.18
- **THEN** 只有版本相关字段变化,`priority`、`budgets`、`rules` 等原样保留

### Requirement: 报告初始状态
引导完成后技能 SHALL 运行 `zh:data:sync` 与 `tr.mjs scan`(均显式带版本),并报告 fresh、stale、new 三类文档的数量。

#### Scenario: 报告数量
- **WHEN** `scan --json` 返回各类计数
- **THEN** 报告包含 `fresh`、`stale`、`new` 三个数字,与 `scan` 输出一致

### Requirement: 默认 dry-run 与逐步确认
默认调用 SHALL 只输出计划与每一步的编号和命令。克隆仓库、创建分支、写 monospecs、写 profile、推送 SHALL 是各自独立的步骤,每一步都要当次调用的确认。技能默认 SHALL NOT 推送;推送由 `dapr-docs-upstream-pr` 的阶段 A 负责,引导中的推送步骤仅在单独确认后执行。

#### Scenario: 默认调用
- **WHEN** 运行引导但没有执行标志
- **THEN** 输出带步骤编号的计划,仓库、分支、monospecs 和 profile 全部不变

#### Scenario: 只确认了建分支
- **WHEN** 只对「创建分支」步骤给出了确认
- **THEN** 只有该步骤被执行,登记 monospecs 与推送仍未发生

#### Scenario: 中断后继续
- **WHEN** 分支已创建但 monospecs 尚未登记,重新运行
- **THEN** 计划中已完成的步骤标记为 `done`,只剩未完成的步骤

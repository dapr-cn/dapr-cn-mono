# Translation Release Gate

## Purpose

规定 `dapr-docs-translation-verify` 的只读闸门:运行三项检查,核对工作区只含 `writeScope` 内的改动,并明确给出「能否开 PR」的结论和原因,供上游提交技能使用。

## Requirements

### Requirement: 三项检查
闸门 SHALL 运行 `tr.mjs status --verify --fail-on stale,failed,blocked,orphan,drift,glossary`、`zh:data:repair --mode audit` 和 `docs:verify --dry-run`,每条命令显式带版本与仓库参数,并记录各自的退出码与摘要。

#### Scenario: 三项都通过
- **WHEN** 三条命令都以 0 退出且工作区干净
- **THEN** 结论为 `canOpenPr: true`,并列出三项的结果

#### Scenario: 其中一项失败
- **WHEN** `status --verify` 因存在 `stale` 文档退出 1
- **THEN** 结论为 `canOpenPr: false`,原因里包含该检查名与退出码,其余检查仍然运行并被记录

### Requirement: 无法运行即不通过
任何检查因命令不存在、超时或无法启动而没有得到退出码时,闸门 SHALL 视为未通过。

#### Scenario: docs:verify 无法启动
- **WHEN** `docs:verify --dry-run` 因缺少依赖无法启动
- **THEN** 结论为 `canOpenPr: false`,原因标明该检查未能运行

### Requirement: 改动范围检查
闸门 SHALL 读取 git 的未提交、已暂存和未跟踪路径(重命名同时检查新旧路径),并与 profile 的 `writeScope` 比较。`writeScope` 之外且不属于 `release.yaml` 的 `syncOutputPaths` 的路径判为 `fail`;属于 `syncOutputPaths` 的路径判为 `blocked`,原因为「同步产物需单独人工提交」。两种情况下 `canOpenPr` 均为 false。

#### Scenario: 译文之外的文件被改
- **WHEN** `scripts/` 下有未提交的改动
- **THEN** 判为 `fail`,输出列出该路径,`canOpenPr: false`

#### Scenario: 同步产物未提交
- **WHEN** 只有 `data/` 下有未提交的改动
- **THEN** 判为 `blocked`,原因说明需要单独人工提交,`canOpenPr: false`

#### Scenario: 已暂存的越界文件
- **WHEN** 已暂存的路径中有 `site/` 下的文件
- **THEN** 同样判为 `fail`,暂存区不被改动

### Requirement: 闸门保持只读
闸门 SHALL NOT 修改工作区、索引或引用。闸门 SHALL 在运行检查前后各取一次状态快照;若检查期间状态发生变化,结论 SHALL 为 `blocked`,原因说明某个检查写了文件。

#### Scenario: 检查命令意外写了文件
- **WHEN** 某条检查运行后工作区多出一个新文件
- **THEN** 结论为 `blocked`,输出列出新增路径,并建议人工确认该命令是否仍是只读

### Requirement: 结论可被下游校验
闸门 SHALL 输出机器可读的结论,含 `canOpenPr`、各项结果、被检查仓库的 `HEAD` 提交、工作区状态摘要和生成时间,供上游提交技能校验新鲜度。

#### Scenario: 结论包含新鲜度字段
- **WHEN** 闸门完成
- **THEN** 结论里有 `headCommit`、`generatedAt` 和 `statusDigest` 三个字段

# Translation Release Config

## Purpose

规定翻译编排技能如何获得版本、分支和 URL:只来自命令参数、`.hagicode/monospecs.yaml` 和人工维护的 `translations/release.yaml`,不在技能里写死任何仓库事实,也不改 `profile.yaml` 的 schema。

## Requirements

### Requirement: 版本相关的值只来自配置与参数
每个技能 SHALL 只从命令参数、`.hagicode/monospecs.yaml` 和 `translations/release.yaml` 得到版本号、分支名和仓库 URL。技能的脚本和 `SKILL.md` MUST NOT 把某个具体版本(例如 `v1.17`)当作默认值。优先级为:命令参数,其次 `release.yaml`,再次由 monospecs 条目推导。

#### Scenario: 参数优先于 release.yaml
- **WHEN** 调用时传入 `--version v1.18`,而 `release.yaml` 写的是 `v1.17`
- **THEN** 技能使用 `v1.18`,并在输出里标明该值来自命令参数

#### Scenario: 没有任何来源提供版本
- **WHEN** 没有传 `--version`,也找不到 `release.yaml`
- **THEN** 技能以非零退出码结束并说明缺少版本,不会退回到某个内置版本

### Requirement: 定位 mono 根与引擎
技能 SHALL 从当前目录向上查找 `.hagicode/monospecs.yaml` 来确定 mono 根,不依赖固定的绝对路径。引擎 `tr.mjs` 的位置 SHALL 相对于技能所在的 `agent-skills` 目录解析,并允许用参数覆盖。

#### Scenario: 从子目录调用
- **WHEN** 在 `repos/v1.17_zh/translations` 下调用技能脚本
- **THEN** 脚本向上找到包含 `.hagicode/monospecs.yaml` 的目录并把它当作 mono 根

#### Scenario: 找不到 mono 根
- **WHEN** 向上一路都没有 `.hagicode/monospecs.yaml`
- **THEN** 脚本报错退出,不猜测路径,也不写任何文件

### Requirement: 向根仓库命令显式传参
调用 mono 根的 `zh:data:sync`、`zh:data:repair`、`docs:verify` 时,技能 SHALL 显式传入版本和仓库路径(如 `--version`、`--repo`、`--source-repo`、`--zh-repo`),不依赖这些命令自身的默认值。

#### Scenario: 为新版本生成修复审计命令
- **WHEN** 目标版本是 `v1.18`
- **THEN** 生成的审计命令带 `--mode audit --version v1.18 --repo repos/v1.18_zh`,仓库路径相对 mono 根而不是 `../v1.18_zh`

### Requirement: release.yaml 的字段约定与模板
`release.yaml` SHALL 由人工维护,位于 `<zh 仓库>/translations/`。它至少声明 `schema`、`version`、`syncOutputPaths`、`upstreamPr.forkDocs`(`path`、`submodulePath`、`upstreamUrl`、`upstreamBranch`),并可声明 `previousVersion`。`repos/agent-skills/release.example.yaml` SHALL 给出同样的结构并逐字段注释。技能 MUST NOT 修改 `profile.yaml` 的 schema,也 MUST NOT 自动改写已有的 `release.yaml`。

#### Scenario: 模板与实例通过同一校验
- **WHEN** 用同一个配置校验器分别读取 `release.example.yaml` 和 v1.17 的 `release.yaml`
- **THEN** 两者都通过结构校验,且 `release.yaml` 里 v1.17 的 URL 与分支能在 `.hagicode/monospecs.yaml` 里找到对应条目

#### Scenario: release.yaml 缺少必填字段
- **WHEN** `release.yaml` 缺少 `version`
- **THEN** 校验失败并列出缺失的字段名,不用默认值补上

### Requirement: 额外文件不影响翻译引擎
`translations/release.yaml` 的存在 SHALL NOT 改变 `tr.mjs scan` 与 `tr.mjs status` 的分类和计数。

#### Scenario: 添加 release.yaml 前后对比
- **WHEN** 在同一状态下分别在有无 `release.yaml` 时运行 `scan --json`
- **THEN** 两次输出的分类计数一致

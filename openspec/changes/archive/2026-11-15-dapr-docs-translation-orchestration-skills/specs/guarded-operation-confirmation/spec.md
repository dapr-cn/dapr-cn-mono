# Spec Delta

## Purpose

规定四个技能共同遵守的守卫:公开或不可逆的操作默认只出计划,只有当次调用里显式给出与当前计划匹配的确认才会执行;提交与写入始终限制在 profile 的 `writeScope` 之内。

## ADDED Requirements

### Requirement: 公开与不可逆操作默认 dry-run
推送、创建 PR、创建分支(仅引导与上游提交技能允许)等操作 SHALL 默认只输出计划(将执行的命令、目标仓库、分支、提交),而不产生任何副作用。只有显式给出执行标志才会真正执行。

#### Scenario: 不带执行标志
- **WHEN** 调用一个会推送的步骤但没有执行标志
- **THEN** 输出包含该步骤的完整命令与目标,退出码为 0,远端与本地的引用都不变

### Requirement: 确认必须与当前计划绑定
执行 SHALL 要求调用方传入的确认值等于脚本按当前仓库状态重新计算出的计划哈希。哈希 MUST 覆盖步骤编号、目标远端、分支和提交。确认值不匹配时脚本 SHALL 拒绝执行并说明原因。

#### Scenario: 计划生成后仓库状态变了
- **WHEN** 用户看过计划后,目标分支的提交发生变化,再带着旧的确认值执行
- **THEN** 脚本重新计算的哈希与确认值不同,拒绝执行,没有任何步骤被运行

#### Scenario: 确认只对一个步骤有效
- **WHEN** 用阶段 A 步骤的确认值去执行阶段 B 的步骤
- **THEN** 因为哈希包含步骤编号而不匹配,拒绝执行

### Requirement: 历史记录与旧授权不算确认
脚本 MUST NOT 把台账、运行记录、环境变量、配置文件、先前的计划输出或上一次调用的结果当作确认。确认值只能来自本次调用的命令行参数。

#### Scenario: 运行记录里有过一次成功推送
- **WHEN** 运行记录显示同一分支此前被推送过,而本次调用没有给出确认值
- **THEN** 脚本仍然只输出计划,不执行推送

### Requirement: dry-run 不写文件
任何 dry-run 调用 SHALL NOT 创建、修改或删除工作区文件、git 索引、引用和配置。

#### Scenario: 对前后快照做比较
- **WHEN** 在临时仓库里运行任一技能脚本的 dry-run,并比较运行前后的文件树与 `git status`
- **THEN** 两者完全一致

### Requirement: 提交与写入限制在 writeScope
技能提交的路径 SHALL 是 profile 的 `writeScope` 的子集,并且每次提交 SHALL 使用 `git commit -- <path>`。只有 `zh:data:sync` 可以写 `data/`;技能 MUST NOT 提交 `data/`、`site/`、`scripts/` 下的文件。

#### Scenario: 工作区里有 writeScope 之外的改动
- **WHEN** `translations/`、`translated_content/` 和 `data/` 都有改动
- **THEN** 提交只包含前两者,`data/` 的改动保持未提交并在输出中列出

## MODIFIED Requirements

### Requirement: Primary navigation matches the Hugo menu
The header SHALL show the community entries 介绍, 活动, 博客, 翻译, 源码, 会议, 案例, 出版 and 成员 in that order, each linking to a page this site builds, and SHALL keep the separate 了解 Dapr group of official-content pages. The footer SHALL list the same community entries.

#### Scenario: Navigation entries
- **WHEN** any page is rendered
- **THEN** the header lists the nine community entries in order with the links `/`, `/event/`, `/post/`, `/tag/translation/`, `/source/`, `/tag/meeting/`, `/case/`, `/publication/` and `/authors/`

#### Scenario: Current section highlighted
- **WHEN** a visitor is on a page under `/post/`
- **THEN** the 博客 entry is marked as the current section

#### Scenario: Section pages highlight their entry
- **WHEN** a visitor is on `/source/join/target/` or `/case/join/pr/`
- **THEN** the 源码 entry or the 案例 entry, respectively, is marked as the current section

#### Scenario: Entries fit the narrow viewport
- **WHEN** a visitor opens any page at 360 px width
- **THEN** all nine entries and the 了解 Dapr group are reachable through the menu control without horizontal scrolling

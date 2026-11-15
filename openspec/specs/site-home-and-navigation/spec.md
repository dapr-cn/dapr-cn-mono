
## Purpose

Defines what visitors see on the home page and in the shared header and footer of the Dapr Chinese community site, so the Dapr-branded redesign keeps every section and navigation entry of the Hugo site.

## Requirements

### Requirement: Home page presents the community introduction
The home page SHALL show the site name "Dapr 中国社区", the community introduction text, and calls to action that lead to the blog and to the translation page.

#### Scenario: Hero content
- **WHEN** a visitor opens `/`
- **THEN** the page shows the title "Dapr 中国社区", the Dapr and community description, and links to `/post/` and `/translation/`

### Requirement: Home page keeps its content sections
The home page SHALL show, in this order, the community activities, upcoming events, past event reviews, featured posts, recent posts and a tag cloud, and a section SHALL be omitted when it has no entries.

#### Scenario: All sections populated
- **WHEN** a visitor opens `/` and each section has content
- **THEN** the sections appear in the order above

#### Scenario: Section without entries
- **GIVEN** no event is upcoming
- **WHEN** a visitor opens `/`
- **THEN** the upcoming events section is not shown and no empty heading remains

### Requirement: Event sections are split by date
The site SHALL list an event under upcoming events when its start date is in the future at build time, and under event reviews otherwise.

#### Scenario: Past event
- **GIVEN** an event dated 2022-09-03
- **WHEN** the home page is built after that date
- **THEN** the event appears under event reviews

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

### Requirement: Layout adapts to small screens
The header, navigation and home sections SHALL remain usable at a viewport width of 360 px without horizontal scrolling.

#### Scenario: Narrow viewport
- **WHEN** a visitor opens any page at 360 px width
- **THEN** the navigation is reachable through a menu control and the page does not scroll horizontally

### Requirement: Visitors can switch between light and dark themes
The site SHALL offer a light and a dark theme, follow the visitor's system preference by default, and remember an explicit choice across pages and visits.

#### Scenario: System preference followed
- **GIVEN** a visitor with no saved choice and a dark system preference
- **WHEN** the visitor opens the site
- **THEN** the dark theme is shown

#### Scenario: Explicit choice remembered
- **WHEN** a visitor selects the light theme and opens another page
- **THEN** the light theme remains active

### Requirement: Footer carries copyright and community links
Every page SHALL end with a footer that shows "© {current year}. Dapr 中国社区版权所有" and a link to the community GitHub organisation.

#### Scenario: Footer on any page
- **WHEN** any page is rendered
- **THEN** the footer shows the copyright notice with the build year and the GitHub link

### Requirement: Pages are readable without scripting
Content pages SHALL render their text, images and navigation links without client-side scripting, except for the theme toggle and search.

#### Scenario: Scripting disabled
- **WHEN** a visitor opens a post with scripting disabled
- **THEN** the full post text, images and navigation links are present

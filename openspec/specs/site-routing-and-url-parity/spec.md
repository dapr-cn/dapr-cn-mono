
## Purpose

Guarantees that the migrated site serves the same public URLs as the live Hugo site at `cn.dapr.io`, so existing links, bookmarks and search-engine results keep working after the move to Astro.

## Requirements

### Requirement: Existing content URLs keep resolving
The site SHALL serve every page that the Hugo site published, at the same path with a trailing slash: `/post/<slug>/`, `/event/<slug>/`, `/publication/<slug>/`, `/author/<slug>/`, `/tour/`, `/people/`, `/meeting/` and `/translation/`.

#### Scenario: Post URL is unchanged
- **GIVEN** the Hugo site served `/post/202306-dapr-release-111/`
- **WHEN** the migrated site is built
- **THEN** a page exists at `/post/202306-dapr-release-111/`

#### Scenario: Section index pages exist
- **WHEN** the migrated site is built
- **THEN** list pages exist at `/post/`, `/event/` and `/publication/`

### Requirement: Tag archives keep their URLs
The site SHALL provide one archive page per tag at `/tag/<slug>/`, including tags written in Chinese, and the page SHALL list every entry carrying that tag.

#### Scenario: Chinese tag archive
- **GIVEN** a post tagged `翻译`
- **WHEN** a visitor opens `/tag/翻译/` or its percent-encoded form `/tag/%E7%BF%BB%E8%AF%91/`
- **THEN** the page lists that post

#### Scenario: Empty tag value ignored
- **WHEN** an entry has an empty tag list or a tag value of `""`
- **THEN** no tag page is produced for it

### Requirement: Route parity is verified against the Hugo sitemap
The build SHALL be accompanied by a check that compares the migrated route set with the Hugo site's published sitemap and reports any URL that the Hugo site served but the migrated site does not.

#### Scenario: Missing route detected
- **GIVEN** the Hugo sitemap lists a URL that the migrated build does not produce
- **WHEN** the parity check runs
- **THEN** it exits with a failure and prints the missing URL

#### Scenario: Full parity
- **WHEN** every Hugo URL is present in the migrated build
- **THEN** the parity check exits successfully

### Requirement: Relative links inside content keep working
Links written in Markdown bodies, such as `../../tag/翻译/`, `../../translation/` and `./meeting-minutes/`, SHALL resolve to existing pages on the migrated site.

#### Scenario: Internal link resolves
- **WHEN** the link check runs over migrated content
- **THEN** every internal link resolves to a built page

### Requirement: Source and case sections remain reachable
The `/source` and `/case` sections, which used to be served by separate sites, SHALL be served by this site at their existing URLs, and the route parity check SHALL list their pages so that a missing page fails the check.

#### Scenario: Navigation links to section pages
- **WHEN** a visitor selects 源码 or 案例 in the navigation
- **THEN** the browser opens the `/source/` or `/case/` landing page built by this site, not a redirect to another deployment and not a not-found page

#### Scenario: Section page missing from the build
- **GIVEN** the parity list names `/source/join/target/`
- **WHEN** the build does not produce that page and the parity check runs
- **THEN** the check exits with a failure and prints the missing URL

#### Scenario: Links into the sections are checked
- **WHEN** an entry links to `/case/` or `/source/` pages and the link check runs
- **THEN** each link is verified against the built pages like any other internal link

### Requirement: Unknown paths return a not-found page
The site SHALL return a branded not-found page for any path it does not serve.

#### Scenario: Missing page
- **WHEN** a visitor requests `/post/does-not-exist/`
- **THEN** the site returns a not-found page with a link back to the home page

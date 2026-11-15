## Purpose

Defines the routes and content behavior for the transferred case and source-study sections.

## Requirements

### Requirement: Case pages are served under /case/
The site SHALL serve the pages of the former user-case site at the URLs the separate site used: `/case/`, `/case/china/`, `/case/global/`, `/case/join/`, `/case/join/pr/`, `/case/join/manual/` and `/case/join/report/`, each with a trailing slash.

#### Scenario: Every former case URL exists
- **WHEN** the site is built
- **THEN** a page exists at each of the seven `/case/` URLs listed above

#### Scenario: Case landing links to its sections
- **WHEN** a visitor opens `/case/`
- **THEN** the page offers links to the Chinese cases, the global cases and the participation pages

### Requirement: Source-study pages are served under /source/
The site SHALL serve the pages of the former source-study site at the URLs the separate site used: `/source/`, `/source/process/`, `/source/design/`, `/source/detail/`, `/source/detail/runtime/`, `/source/detail/component/`, `/source/detail/control-plane/`, `/source/detail/sdk/`, `/source/join/`, `/source/join/target/`, `/source/join/how-to-study/`, `/source/join/meetings/`, `/source/join/knowledge-graph/` and `/source/join/workitems/`, each with a trailing slash.

#### Scenario: Every former source URL exists
- **WHEN** the site is built
- **THEN** a page exists at each of the fourteen `/source/` URLs listed above

#### Scenario: Meeting notes keep their content
- **WHEN** a visitor opens `/source/join/meetings/`
- **THEN** the page lists the biweekly meeting schedule and every dated meeting note, with its topics and replay links

### Requirement: Page text is preserved
The transferred pages SHALL keep the title and body text of the original pages. Hugo-only constructs SHALL be replaced by equivalent plain content, and no sentence of the original body SHALL be dropped except text that referred to Hugo itself, to the old repository location, or to the English official testimonials page that this site now carries in Chinese.

#### Scenario: Body text carried over
- **GIVEN** the original page `join/target` contains the headings 浅层目标, 深层目标 and 终极目标
- **WHEN** a visitor opens `/source/join/target/`
- **THEN** all three headings and their paragraphs are shown

#### Scenario: Hugo shortcode replaced
- **GIVEN** an original page opens with a `pageinfo` callout
- **WHEN** the page is rendered on this site
- **THEN** the callout text appears as visible text and no shortcode markup is shown

### Requirement: Pages without body text keep their URL
A page whose original had a title but no body text SHALL still be served at its original URL, and SHALL show its title and one sentence stating that its content is being prepared, without inventing any other content.

#### Scenario: Empty source page
- **GIVEN** the original `detail/sdk` page has a title and no body
- **WHEN** a visitor opens `/source/detail/sdk/`
- **THEN** the page shows its title, the placeholder sentence and the links of its section, and does not return a not-found page

#### Scenario: Empty case page
- **WHEN** a visitor opens `/case/china/`
- **THEN** the page shows its title and the placeholder sentence

### Requirement: Relative links and images keep working
Links between transferred pages SHALL resolve to pages of this site, and every image a transferred page references locally SHALL be present in the build. External images MAY stay hotlinked.

#### Scenario: Cross-page link
- **GIVEN** the meetings page links to the work-division page
- **WHEN** a visitor follows that link
- **THEN** the browser opens `/source/join/workitems/`

#### Scenario: Missing local image
- **WHEN** a transferred page references a local image that does not exist
- **THEN** the build fails and names the file and the image

### Requirement: Mind-map downloads keep their URLs
The two mind-map files SHALL stay downloadable at `/source/join/knowledge-graph/dapr-knowledge-graph.xmind` and `/source/join/workitems/workitems.xmind`, and the pages that offer them SHALL link to those URLs.

#### Scenario: Download link
- **WHEN** a visitor selects the download link on `/source/join/workitems/`
- **THEN** the browser receives `workitems.xmind` from `/source/join/workitems/workitems.xmind`

### Requirement: Case submission instructions point at the official site repository
The pages that explain how to submit a case SHALL name the official site repository as the place to open pull requests and issues, SHALL give the content path of this site for Chinese cases, and SHALL NOT mention Hugo or the old case repository as the place to contribute.

#### Scenario: Pull-request instructions
- **WHEN** a visitor opens `/case/join/pr/`
- **THEN** the page names `dapr-cn-site` as the repository to fork and `src/content/case/china/` as the location for a Chinese case

#### Scenario: Tip-off instructions
- **WHEN** a visitor opens `/case/join/report/`
- **THEN** the page links to the issue tracker of `dapr-cn-site`

### Requirement: Section pages are navigable
Each page in a section SHALL show a breadcrumb back to the home page and the section landing page, and the list of pages of its section with the current page marked. Pages with a successor or predecessor in the section order SHALL link to them.

#### Scenario: Breadcrumb and section list
- **WHEN** a visitor opens `/source/join/how-to-study/`
- **THEN** the page shows a breadcrumb ending in the page title and a list of the pages under `/source/join/` with this page marked as current

#### Scenario: Narrow viewport
- **WHEN** a visitor opens any section page at 360 px width
- **THEN** the section list sits above the body and the page does not scroll horizontally

### Requirement: Section pages are community-authored and say so accurately
Section pages SHALL NOT carry the notice that a page was translated from the official Dapr site. The case and source landing pages SHALL identify the section as part of the Dapr Chinese community site.

#### Scenario: No translation notice
- **WHEN** a visitor opens `/case/join/pr/`
- **THEN** the page does not state that it was translated from the official Dapr website

### Requirement: Retired search pages are mapped
The Hugo search pages `/case/search/` and `/source/search/` SHALL NOT be built. Each SHALL be recorded in the retired URL list with the section landing page as its replacement, and the header search SHALL cover the section pages.

#### Scenario: Retired URL recorded
- **WHEN** the retired URL list is read
- **THEN** it maps `/case/search/` to `/case/` and `/source/search/` to `/source/`

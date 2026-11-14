
## Purpose

Specifies how visitors and crawlers discover content on the migrated site: full-text search, the RSS feed, the sitemap, crawler rules and usage analytics, replacing the equivalents that the Hugo theme generated.

## Requirements

### Requirement: Visitors can search site content
The site SHALL provide full-text search over posts, events and publications that works with Chinese text and runs without an external service.

#### Scenario: Chinese query
- **GIVEN** a post whose body contains "服务调用"
- **WHEN** a visitor searches for "服务调用"
- **THEN** the results include that post with its title and a link

#### Scenario: No results
- **WHEN** a visitor searches for a term that appears in no entry
- **THEN** the search shows a message that nothing was found

### Requirement: Search is reachable from every page
The header SHALL expose the search on every page, and the search SHALL be operable from the keyboard.

#### Scenario: Open search by keyboard
- **WHEN** a visitor focuses the search control and presses Enter
- **THEN** the search input opens and receives focus

### Requirement: The site publishes an RSS feed for posts
The site SHALL publish an RSS feed at `/index.xml` listing posts newest first with title, link, publication date and summary, and the HTML head of every page SHALL advertise it.

#### Scenario: Feed contents
- **WHEN** a reader fetches `/index.xml`
- **THEN** the feed contains the 15 posts ordered by date, newest first

#### Scenario: Feed discovery
- **WHEN** any page is rendered
- **THEN** its head includes an alternate link pointing to the feed

### Requirement: The site publishes a sitemap and crawler rules
The site SHALL publish a sitemap listing every public page with its absolute `https://cn.dapr.io/` URL, and a `robots.txt` that allows crawling and points to the sitemap.

#### Scenario: Sitemap lists pages
- **WHEN** a crawler fetches `/sitemap.xml`, the path the Hugo site used
- **THEN** the sitemap contains every post, event, publication, author and tag page

#### Scenario: Robots file
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the file allows crawling and names the sitemap URL

### Requirement: Pages carry search-engine metadata
Every page SHALL have a title, description, canonical URL and social sharing metadata, and a post SHALL use its summary as the description.

#### Scenario: Post metadata
- **WHEN** a post page is rendered
- **THEN** its head has a title, a description equal to the post summary, and a canonical URL of `https://cn.dapr.io/post/<slug>/`

### Requirement: Usage analytics keep the existing property
The site SHALL report page views to the Google Analytics property `G-J4DYYVC8KL` on production builds, and SHALL NOT report from local development.

#### Scenario: Production build
- **WHEN** a visitor opens any page of a production build
- **THEN** the page loads the analytics tag for `G-J4DYYVC8KL`

#### Scenario: Development server
- **WHEN** a contributor opens a page on the development server
- **THEN** no analytics tag is loaded

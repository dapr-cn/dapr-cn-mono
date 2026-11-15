## MODIFIED Requirements

### Requirement: Visitors can search site content
The site SHALL provide full-text search over posts, events, publications and the pages of the `/case/` and `/source/` sections that works with Chinese text and runs without an external service.

#### Scenario: Chinese query
- **GIVEN** a post whose body contains "服务调用"
- **WHEN** a visitor searches for "服务调用"
- **THEN** the results include that post with its title and a link

#### Scenario: Section page found
- **GIVEN** the page `/source/join/how-to-study/` contains "构建块"
- **WHEN** a visitor searches for "构建块"
- **THEN** the results include that page with its title and a link

#### Scenario: No results
- **WHEN** a visitor searches for a term that appears in no entry
- **THEN** the search shows a message that nothing was found

### Requirement: The site publishes a sitemap and crawler rules
The site SHALL publish a sitemap listing every public page with its absolute `https://cn.dapr.io/` URL, and a `robots.txt` that allows crawling and points to the sitemap.

#### Scenario: Sitemap lists pages
- **WHEN** a crawler fetches `/sitemap.xml`, the path the Hugo site used
- **THEN** the sitemap contains every post, event, publication, author and tag page

#### Scenario: Sitemap lists section pages
- **WHEN** a crawler fetches `/sitemap.xml`
- **THEN** the sitemap contains every page under `/case/` and `/source/`

#### Scenario: Robots file
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the file allows crawling and names the sitemap URL

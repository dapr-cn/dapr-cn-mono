## MODIFIED Requirements

### Requirement: Source and case sections remain reachable
The `/source` and `/case` sections, which used to be served by separate sites, SHALL be served by this site at their existing URLs, and the route parity check SHALL list their pages so that a missing page fails the check.

#### Scenario: Navigation links to external sections
- **WHEN** a visitor selects 源码 or 案例 in the navigation
- **THEN** the browser opens the `/source/` or `/case/` landing page built by this site, not a redirect to another deployment and not a not-found page

#### Scenario: Section page missing from the build
- **GIVEN** the parity list names `/source/join/target/`
- **WHEN** the build does not produce that page and the parity check runs
- **THEN** the check exits with a failure and prints the missing URL

#### Scenario: Links into the sections are checked
- **WHEN** an entry links to `/case/` or `/source/` pages and the link check runs
- **THEN** each link is verified against the built pages like any other internal link

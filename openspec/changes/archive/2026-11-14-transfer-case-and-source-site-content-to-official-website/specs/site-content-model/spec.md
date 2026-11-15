## MODIFIED Requirements

### Requirement: Content is organised into typed collections
The site SHALL expose posts, events, publications, authors, case pages and source-study pages as separate content collections, each with a declared set of required and optional fields. Case and source-study entries SHALL take their URL from their path inside the collection.

#### Scenario: Entry matches its collection schema
- **WHEN** the site is built and every entry satisfies its collection's schema
- **THEN** the build succeeds and each entry is available to pages

#### Scenario: Entry violates its schema
- **WHEN** an entry omits a required field such as `title` or has a malformed date
- **THEN** the build fails and reports the offending file and field

#### Scenario: Section entry takes its URL from its path
- **GIVEN** a source-study entry at `join/how-to-study`
- **WHEN** the site is built
- **THEN** the page is served at `/source/join/how-to-study/`

#### Scenario: Directory index entry
- **GIVEN** a case entry at `join/index.md`
- **WHEN** the site is built
- **THEN** the page is served at `/case/join/`

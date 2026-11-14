# Spec Delta

## Purpose

Defines how the Dapr Chinese community site stores and validates its posts, events, publications, authors and static pages, so that every migrated entry has one predictable shape and no content is lost in the move away from Hugo.

## ADDED Requirements

### Requirement: Content is organised into typed collections
The site SHALL expose posts, events, publications and authors as separate content collections, each with a declared set of required and optional fields.

#### Scenario: Entry matches its collection schema
- **WHEN** the site is built and every entry satisfies its collection's schema
- **THEN** the build succeeds and each entry is available to pages

#### Scenario: Entry violates its schema
- **WHEN** an entry omits a required field such as `title` or has a malformed date
- **THEN** the build fails and reports the offending file and field

### Requirement: Front matter uses one format
All migrated entries SHALL use YAML front matter. Entries that used TOML front matter or had no front matter in Hugo SHALL be converted without changing their title, date, tags, authors or summary values.

#### Scenario: TOML entry is converted
- **GIVEN** a post whose Hugo front matter was TOML with `date = 2023-06-14` and `tags = ["Dapr", "微服务"]`
- **WHEN** the entry is migrated
- **THEN** it has YAML front matter with the same date and the same two tags

#### Scenario: Entry without front matter
- **GIVEN** a Hugo content file with no front matter
- **WHEN** the entry is migrated
- **THEN** it has YAML front matter with a title taken from the original page title or its first heading

### Requirement: Content and body text are preserved
The migration SHALL NOT alter the Markdown body text of any entry, and the migrated site SHALL contain the same number of posts (15), events (5), publications (5) and authors (11) as the Hugo site.

#### Scenario: Entry counts match
- **WHEN** the collections are counted after migration
- **THEN** they contain 15 posts, 5 events, 5 publications and 11 authors

#### Scenario: Body text is unchanged
- **WHEN** the body of a migrated post is compared with its Hugo source
- **THEN** the text is identical, except for the image path rewrites required to keep images resolving

### Requirement: Images stay attached to their entries
Every local image referenced by an entry, including featured images and author avatars, SHALL still resolve after migration, and an image that cannot be found SHALL fail the build.

#### Scenario: Body image resolves
- **GIVEN** a post that references `images/cases.png`
- **WHEN** the site is built
- **THEN** the page renders the image from the migrated asset

#### Scenario: Missing image
- **WHEN** an entry references a local image that does not exist
- **THEN** the build fails and names the entry and the missing path

### Requirement: Author profiles are linked from entries
Each entry SHALL link to its authors by identifier, and every author identifier used by an entry SHALL match an existing author profile.

#### Scenario: Known author
- **WHEN** a post lists the author `zhangshanyou`
- **THEN** the post page shows that author's name and avatar and links to the author page

#### Scenario: Unknown author
- **WHEN** an entry lists an author with no profile
- **THEN** the build fails and names the entry and the author identifier

### Requirement: Obsolete Hugo-only content is dropped
The migration SHALL NOT carry over the Wowchemy CMS stub (`content/admin`) or inactive home widgets (`cta`, `image`), and SHALL record each dropped item in the migration notes.

#### Scenario: CMS stub removed
- **WHEN** the migrated site is built
- **THEN** no `/admin/` route is produced

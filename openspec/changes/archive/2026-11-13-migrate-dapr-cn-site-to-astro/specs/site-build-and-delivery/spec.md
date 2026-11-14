# Spec Delta

## Purpose

Defines how contributors build, check and preview the migrated Dapr Chinese community site, and what the continuous-integration workflows must produce, so the site no longer depends on Go or Hugo.

## ADDED Requirements

### Requirement: The site builds with Node and pnpm only
A contributor SHALL be able to install dependencies and produce the static site using Node.js and pnpm alone, without Go, Hugo or access to theme repositories.

#### Scenario: Clean build
- **GIVEN** a fresh checkout with Node.js and pnpm installed
- **WHEN** the contributor runs the documented install and build commands
- **THEN** the build succeeds and writes the static site to `dist/`

#### Scenario: Local preview
- **WHEN** the contributor runs the documented development command
- **THEN** the site is served locally and shows content changes without a restart

### Requirement: Verification commands guard the migration
The project SHALL provide commands that check route parity with the Hugo site, internal links, local image references and the front matter of all entries, and each SHALL exit non-zero when it finds a problem.

#### Scenario: Broken internal link
- **WHEN** an entry links to a page that the build does not produce and the link check runs
- **THEN** the command fails and prints the entry and the link

#### Scenario: All checks pass
- **WHEN** the content and routes are valid
- **THEN** every verification command exits with status zero

### Requirement: CI builds the site on every change to main and on pull requests
The continuous-integration workflows SHALL install dependencies with pnpm, build the site, run the verification commands, and fail when any step fails. They SHALL NOT install Go or Hugo.

#### Scenario: Pull request build
- **WHEN** a pull request targets `main`
- **THEN** the workflow builds the site, runs the checks and reports failure if any check fails

#### Scenario: No Hugo toolchain
- **WHEN** the workflow definitions are inspected
- **THEN** none of them references Go, Hugo or `public/` as the build output

### Requirement: The published artifact is the Astro output
The workflow SHALL hand the contents of `dist/` to the existing Azure Static Web Apps upload step, with the upload configured to skip a remote build, and SHALL report the output size.

#### Scenario: Upload source
- **WHEN** the workflow reaches the upload step
- **THEN** its application location is `dist` and remote building is skipped

### Requirement: Hugo files and settings are removed
The repository SHALL NOT contain Hugo module files, theme descriptors, Hugo configuration or Hugo version pins after the migration, and its README SHALL describe the Astro workflow.

#### Scenario: Leftover Hugo files
- **WHEN** the repository root is listed after the migration
- **THEN** `go.mod`, `go.sum`, `theme.toml`, `netlify.toml`, `HUGO_VERSION.md` and `config/` are absent

#### Scenario: README
- **WHEN** a contributor reads `README.md`
- **THEN** it explains how to install, run, build and check the Astro site

### Requirement: Build output and generated files are not committed
The repository SHALL ignore the build output, caches and installed dependencies so that they are never tracked.

#### Scenario: Ignored directories
- **WHEN** the site has been built locally
- **THEN** `dist/`, `.astro/` and `node_modules/` do not appear as untracked files

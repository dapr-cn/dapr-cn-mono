# Tasks

All paths are relative to `repos/dapr-cn-site/`. Hugo files stay in place until group 7.

## 1. Scaffold and baseline

- [x] 1.1 Add `package.json` (scripts `dev`, `build`, `postbuild`, `preview`, `verify`, `packageManager`), `pnpm-workspace.yaml`, `tsconfig.json` and `astro.config.mjs` (`site: https://cn.dapr.io`, `trailingSlash: 'always'`, `build.format: 'directory'`); verify `pnpm install` succeeds and `pnpm exec astro check` runs without config errors.
- [x] 1.2 Add `.gitignore` entries for `dist/`, `.astro/` and `node_modules/`; verify `git status` shows none of them as untracked after an install and a build.
- [x] 1.3 Record every URL the Hugo site publishes into `scripts/hugo-urls.txt` (from a local Hugo build if Hugo is available, otherwise from the live `https://cn.dapr.io/sitemap.xml` cross-checked against the content tree); verify the file lists the 15 post, 5 event, 5 publication and 11 author URLs plus `/tour/`, `/people/`, `/meeting/`, `/translation/` and the tag URLs.
- [x] 1.4 Add `src/config/site.ts` (title, description, base URL, GA id `G-J4DYYVC8KL`, copyright text, GitHub URL) and `src/config/nav.ts` (the nine entries from `config/_default/menus.yaml`); verify a unit test asserts the nine entries, their order and their URLs.

## 2. Content migration

- [x] 2.1 Write `scripts/convert-front-matter.mjs` (parse TOML and YAML, add a title for files without front matter, emit YAML, leave the body untouched, strip empty-string tags); verify its test covers a TOML post, a YAML event and a file without front matter, and that the body bytes are identical before and after.
- [x] 2.2 Run the converter to move `content/post`, `event`, `publication` into `src/content/` with images alongside, and `content/authors/*/_index.md` to `src/content/authors/*/index.md`; verify the counts are 15 posts, 5 events, 5 publications and 11 authors.
- [x] 2.3 Move `tour`, `people`, `meeting` and `translation` (with `translation/docs/images`) into `src/content/pages/`; drop `content/admin` and the inactive `cta` and `image` home widgets; verify no `admin` route appears in the build.
- [x] 2.4 Write `src/content.config.ts` with collections `post`, `event`, `publication`, `authors` and `pages`, a `generateId` that returns the folder name, an `image()` schema for covers and avatars, a tag transform and an author reference check; verify `astro sync` passes and a deliberately broken fixture (missing `title`) fails with the file and field named.
- [x] 2.5 Move `assets/media` and `static` files into `public/` and `src/assets/` as needed; verify every local image referenced by an entry resolves and a deliberately missing image fails the build.

## 3. Routes

- [x] 3.1 Add `src/lib/tags.ts` with `tagSlug()` equal to Hugo `urlize` (lower-case, spaces to `-`, CJK kept) and tag counts; verify unit tests for `翻译`, `Release Notes`, `name resolution` and an empty tag.
- [x] 3.2 Add `src/pages/post/index.astro`, `post/[id].astro` and the matching `event` and `publication` pages; verify the built output contains `/post/202306-dapr-release-111/` and the other 24 entry URLs.
- [x] 3.3 Add `src/pages/author/[id].astro` and `src/pages/tag/[tag].astro`; verify `/tag/翻译/` lists the posts tagged `翻译` and that the page for an unknown tag is not produced.
- [x] 3.4 Add the four static pages (`/tour/`, `/people/`, `/meeting/`, `/translation/`) and `src/pages/404.astro`; verify each exists in `dist/` and that an unknown path serves the not-found page in `astro preview`.
- [x] 3.5 Check the three relative links found in content (`../../tag/翻译/`, `../../translation/`, `./meeting-minutes/`); fix the target or the link so each resolves, and verify with the link check from 6.2.

## 4. Layout, home and navigation

- [x] 4.1 Add `src/styles/tokens.css` and `global.css` with light and dark tokens, plus `BaseLayout.astro` with metadata, canonical URL, feed link, production-only analytics and the pre-paint theme script; verify a production build contains the `G-J4DYYVC8KL` tag and a development page does not.
- [x] 4.2 Add `Header.astro` (nine nav entries, current-section highlight, mobile menu), `Footer.astro` (copyright with year, GitHub link) and `ThemeToggle.astro`; verify with a browser check at 360 px (no horizontal scroll, menu reachable) and that the stored theme survives a page change.
- [x] 4.3 Add `ArticleLayout.astro` and the card components (`PostCard`, `EventCard`, `PublicationCard`, `AuthorBadge`); verify a post page shows title, date, author name, avatar link and tags, and that an unknown author fails the build.
- [x] 4.4 Add `src/lib/events.ts` (upcoming versus past by build-time date) and a unit test for a past, a future and a same-day event.
- [x] 4.5 Build `src/pages/index.astro` and the home components (hero, activities, event list used for upcoming and review, featured posts, recent posts, tag cloud) in the order from the spec; verify the home page shows the sections in order and hides an empty section without a leftover heading.
- [x] 4.6 Check the pages with scripting disabled; verify a post still shows its full text, images and navigation links.

## 5. Search and feeds

- [x] 5.1 Add `data-pagefind-body` to article content, run `pagefind --site dist` in `postbuild`, and add `Search.astro` (keyboard operable, "nothing found" message); verify searching `服务调用` and `翻译` returns the expected posts in `astro preview`.
- [x] 5.2 Add `src/pages/index.xml.ts` with `@astrojs/rss`; verify `/index.xml` holds the 15 posts newest first and that every page head has the alternate feed link.
- [x] 5.3 Add `src/pages/sitemap.xml.ts` and `public/robots.txt`; verify the sitemap contains every post, event, publication, author and tag URL with the `https://cn.dapr.io/` prefix and that `robots.txt` names it.
- [x] 5.4 Add per-page title, description and social metadata, with the post summary as the description; verify a post page head matches the summary and canonical `https://cn.dapr.io/post/<slug>/`.

## 6. Verification scripts

- [x] 6.1 Write `scripts/verify-url-parity.mjs` comparing `dist/` routes with `scripts/hugo-urls.txt`; verify it exits non-zero and prints the URL when one route is removed, and exits zero on the full build.
- [x] 6.2 Write `scripts/verify-content.mjs` (front matter, author references, local images, internal links, list of external images) with a fixture test for each failure; verify all four fail on the fixtures and pass on the real content.
- [x] 6.3 Wire `pnpm run verify` to run both scripts after a build; verify one command runs build, checks and Pagefind and exits zero on the migrated site.

## 7. CI and Hugo removal

- [x] 7.1 Rewrite `.github/workflows/hugo-build.yml` (rename the job to build and check) with Node 24, pnpm, `pnpm run build` and `pnpm run verify`, no Go or Hugo; verify with a workflow lint or a dry read that no step references Go, Hugo or `public/`.
- [x] 7.2 Rewrite `.github/workflows/release.yml` to the same steps, report the `dist/` size, and set the existing Azure step to `app_location: "/dist"` with `skip_app_build: true`; verify the Azure step inputs are otherwise unchanged and the build step order is install, build, verify, upload.
- [x] 7.3 Update `.devcontainer/**`, `.gitpod.yml` and `.vscode/settings.json` to Node and pnpm; verify none of them mentions Hugo or Go.
- [x] 7.4 Delete `go.mod`, `go.sum`, `theme.toml`, `netlify.toml`, `HUGO_VERSION.md`, `preview.png`, `config/`, `content/`, `assets/` and `static/` only after 6.1 passes; verify `pnpm run verify` still exits zero and the repository root lists none of them.
- [x] 7.5 Replace the placeholder `README.md` with install, dev, build, verify and content-authoring instructions; verify each documented command runs as written from a clean checkout.
- [x] 7.6 Final integration check: run `pnpm install --frozen-lockfile && pnpm run build && pnpm run verify` from a clean clone; verify it succeeds with no Go or Hugo installed and the output size is reported.

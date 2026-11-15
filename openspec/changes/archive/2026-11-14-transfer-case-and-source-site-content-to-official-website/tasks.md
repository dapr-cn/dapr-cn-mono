# Tasks

All paths are relative to `repos/dapr-cn-site` unless a task names another repository. Commands run there with pnpm.

## 1. Content model, routes and layout

- [x] 1.1 Declare the `case` and `source` collections in `src/content.config.ts` (shared `sectionPage` schema with `title`, `summary`, `weight`, `lead`, `groups`, `draft`; glob `**/*.md`; ids are paths with `.md` and `/index.md` stripped, root id `index`) and export them. Verify with `pnpm run check` exiting 0 and a build that lists both collections.
- [x] 1.2 Add `caseSection(id?)` and `sourceSection(id?)` to `src/lib/urls.ts` and create `src/lib/sections.ts` (ordering by `weight` then title, sibling list, breadcrumb, previous and next, root-id mapping), with `tests/sections.test.ts` covering ids, ordering, breadcrumb, previous or next at the ends, and the root mapping. Verify with `node --test tests/sections.test.ts` passing.
- [x] 1.3 Create `src/layouts/SectionLayout.astro` on top of `BaseLayout`: breadcrumb and section list outside the Pagefind body, `.prose` body with `data-pagefind-body` in the 780px column, previous and next links, `aria-current='page'` in the section list, token-only styling with no shadow, no new colour and no hard-coded hex. Verify with `grep -n "#[0-9a-fA-F]\{3,6\}" src/layouts/SectionLayout.astro` returning nothing and by viewing a built page in light and dark themes with the focus ring visible.
- [x] 1.4 Render landing `lead` and `groups` as bordered cards in `SectionLayout.astro` (a card without `href` is plain text, a card with `href` is one link). Verify with a landing fixture that shows two groups and one link-less card, with no translation notice printed.
- [x] 1.5 Add `src/pages/case/[...id].astro` and `src/pages/source/[...id].astro` (`getStaticPaths` from the collection, `index` mapped to an undefined id, drafts excluded). Verify that `pnpm run build` produces `dist/case/index.html` and a nested page such as `dist/case/join/index.html`, and that no route collides with `src/pages/[...id].astro`.

## 2. Content conversion

- [x] 2.1 Copy and convert the case landing page and the `join` index into `src/content/case/` (`_index.md` becomes `index.md`; `_index.html` becomes front matter `lead` and `groups`; the card 官网客户案例资料 links to `/testimonials/` with text that says it is the Chinese adaptation). Verify that `dist/case/` and `dist/case/join/` exist and the landing shows two groups of three cards.
- [x] 2.2 Convert `join/pr`, `join/manual` and `join/report` into `src/content/case/join/`, rewriting `pr` and `report` so they name `dapr-cn-site`, `src/content/case/china/` and the `dapr-cn-site` issue tracker. Verify with `grep -rniE "hugo|dapr-cn-site-case" src/content/case` returning nothing and the three pages present in `dist/case/join/`.
- [x] 2.3 Convert the source landing, `process`, `design` and `detail` pages into `src/content/source/`, and create the four body-less pages `detail/{runtime,component,control-plane,sdk}` and the two body-less case pages `china` and `global` with the sentence "本页内容正在整理中，暂无正文。". Verify that all six files contain exactly that body sentence and that the six URLs exist in `dist/`.
- [x] 2.4 Convert `join/index`, `join/target`, `join/how-to-study` and `join/meetings` into `src/content/source/join/`, turning `pageinfo` into blockquotes and `relref` into relative links. Verify with `grep -rn "{{" src/content/source src/content/case` returning nothing and the meetings page showing every dated note.
- [x] 2.5 Copy `join/knowledge-graph` and `join/workitems` with their `images/` folders into `src/content/source/join/`, and place the two `.xmind` files in `public/source/join/knowledge-graph/` and `public/source/join/workitems/`. Verify that the build succeeds with the images resolved and that `dist/source/join/workitems/workitems.xmind` and `dist/source/join/knowledge-graph/dapr-knowledge-graph.xmind` exist.
- [x] 2.6 Compare every converted page with its original (`git diff --no-index --word-diff` per pair) and list any difference that is not a Hugo construct, a front-matter change, an old-repository reference or the testimonials card. Verify that the list is empty or each remaining difference is justified in a short note in the review.
- [x] 2.7 Add `case/` and `source/` rows to the content table in `README.md` and describe how to add a section page, including the path-as-URL rule and the `weight` field. Verify that the documented paths exist and match the URLs the build produces.

## 3. Navigation, sitemap and search

- [x] 3.1 Add 源码 (after 翻译) and 案例 (after 会议) to `src/config/nav.ts`, and update `tests/nav.test.ts` to expect nine entries in order, the new hrefs, `currentNavItem` highlighting for `/source/join/target/` and `/case/join/pr/`, and to drop the "does not link to /source/ or /case/" test. Verify with `node --test tests/nav.test.ts` passing.
- [x] 3.2 Check the masthead in a built preview at 1280px, 1200px, 960px and 360px: nine entries plus 了解 Dapr must not wrap, clip or scroll horizontally, and the mobile menu must list all of them. Adjust the breakpoint in `src/components/Header.astro` only if a check fails. Verify with `document.documentElement.scrollWidth <= window.innerWidth` at each width and a look at the header.
- [x] 3.3 Add the two collections to `src/pages/sitemap.xml.ts` using the new URL helpers. Verify that `dist/sitemap.xml` contains all 21 section URLs.
- [x] 3.4 Confirm the section pages are indexed by search. Verify that every built section page has exactly one `data-pagefind-body`, that the breadcrumb and section list are outside it, and that the Pagefind postbuild reports at least 21 more pages than before the change.
- [x] 3.5 Replace the sentence in `PRODUCT.md` that says the navigation does not link to `/source/` or `/case/`, and update the navigation line to list nine entries. Verify with `grep -n "does not link" PRODUCT.md` returning nothing.

## 4. Verification scripts and URL lists

- [x] 4.1 In `scripts/verify-content.mjs`, empty `EXTERNAL_SECTIONS` and remove its skip, load the `case` and `source` collections in `loadEntries` with path-based ids, and map `<collection>/index` to `/<collection>/` in `baseRouteOf`. Update `tests/verify-content.test.mjs` (the `/source/` link in the fixture is now checked) and add cases for a link into a section that is built, one that is not, and a relative link on a landing page. Verify with `node --test tests/verify-content.test.mjs` passing.
- [x] 4.2 Append the 21 section URLs to `scripts/hugo-urls.txt` under a comment naming the two former sites, and add `/case/search/ /case/` and `/source/search/ /source/` to `scripts/retired-urls.txt`. Verify that `pnpm run verify:parity` passes and counts the new URLs, and that none of the retired URLs is built.
- [x] 4.3 Run the full project checks once the content and scripts are in place. Verify that `pnpm run verify`, `pnpm run check` and `pnpm test` all exit 0.

## 5. Old repositories and integration

- [x] 5.1 Update `repos/dapr-cn-site-case/README.md` to say the content now lives in `dapr-cn-site` under `src/content/case/` and that contributions go there, keeping the public URL. Verify that the README names both paths and that no other file in that repository changed.
- [x] 5.2 Update `repos/dapr-cn-site-source/README.md` the same way for `src/content/source/`. Verify the same two points.
- [x] 5.3 Walk the built site once: serve `dist/` with `pnpm run preview`, request the 21 section URLs and the two `.xmind` downloads, and open `/case/` and `/source/` in the browser at 360px and 1280px in both themes. Verify that every URL returns 200, there is no horizontal scroll, the section list marks the current page, and the keyboard focus ring is visible on the section list and the cards.

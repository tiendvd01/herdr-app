# Tasks: Pull requests list pages like Issues, count first

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/gh-calls.md](contracts/gh-calls.md)

## Phase 1: Foundational (gh calls)

- [x] T001 Add `viewQuery(repo, state, logins)`, change `count(repo, state, logins)` to one REST search call with OR'd `author:` qualifiers, and add `page(repo, state, logins, after, first = 20)` (GraphQL search, cursor, row fields per contracts/gh-calls.md, run as the repo's account) in lib/pr-gh.js
- [x] T002 Run scripts/sync-github-lib.sh so mods/pr-flow/gh.js and mods/inbox/gh.js get the new copy

## Phase 2: User Story 1 + 2 — count first, then pages (P1) 🎯 MVP

**Independent test**: All · Open in a repo with >20 open PRs shows `20 / N`, appends 20 per scroll to N; a view with 0 shows the empty state with no page call.

- [x] T003 [US1] Replace `discoverView`/`limits`/`full`/`listed` with views keyed `repo|state|scope` (`urls`, `cursor`, `next`, `pages`, `at`, `loading`, `error`) and counts keyed the same (`n`, `at`, `busy`, fresh 60 s) in mods/pr-flow/tracker.js
- [x] T004 [US2] In mods/pr-flow/tracker.js `loadView`: await count first; 0 → empty view, no page call; else fetch page 1..`pages` by cursor; store each node into `live` with `partial: true` and into `tracked`; a page with fewer rows than asked sets `next = false`
- [x] T005 [US1] In mods/pr-flow/tracker.js: `hasMore()` = `next && (total == null || urls.length < total)`; `loadMore()` fetches the next page by `cursor` and resolves when done; `tick` reloads the shown view when older than 2 min; listed rows are no longer polled one by one (agent-branch PRs still are); `prune()` keeps PRs any view lists; merged rows merged within 24 h are queued for `refreshFlow`, 8 per tick in the background
- [x] T006 [US2] Expose `setView({repo,state,scope})`, `total(state)`, `ensureCount(state)`, `countStale(state)`, `viewState()`, `viewStale()`, `focus(url)`, `isPartial(url)` in mods/pr-flow/tracker.js; `me` logins resolved before counting Mine
- [x] T007 [US1] In mods/pr-flow/main.js: pass the space repo into `setView` whenever repo, state or scope changes; chips use `tracker.total`/`ensureCount` (drop the local `counts` map); header shows `shown / total`; empty state when total is 0; loading spinner while the first page loads; `loadMore` awaits `tracker.loadMore()`
- [x] T008 [US1] In mods/pr-flow/main.js `openPr`: refresh the PR fully when its data is `partial` (files, body, thread comments)

## Phase 3: User Story 3 — instant switch back (P2)

- [x] T009 [US3] Keep views across `setView` in mods/pr-flow/tracker.js so switching back shows loaded rows at once and reloads in the background when stale; Refresh (`refreshAll`) reloads count and the view's loaded pages

## Phase 4: Polish

- [x] T010 Run `herdr-app check mods/pr-flow` and `herdr-app check mods/inbox`; open the Pull requests dialog and `herdr-app shot` per quickstart.md
- [x] T011 Add a short note on pr-flow paging (count first, 20 per page by cursor, full refresh on open) to CLAUDE.md

## Dependencies

T001 → T002 → T003 → T004/T005/T006 → T007/T008 → T009 → T010 → T011. One file per phase mostly, so little runs in parallel; T008 and T011 are independent of each other.

## Strategy

MVP = Phase 1 + 2 (US1 and US2 are one change in the tracker). US3 is mostly free from keeping views in memory.

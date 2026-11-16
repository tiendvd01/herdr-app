# Implementation Plan: Pull requests list pages like Issues, count first

**Branch**: `019-pr-list-paging` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

## Summary

The Pull requests list (`pr-flow`) loads the space repo's PRs of the shown view a page (20) at a time from
one GitHub search call per page, after first asking the view's total count. Scrolling to the end fetches the
next page by cursor until the total is reached. Per-PR fetches remain only for the opened PR and PRs on an
agent's branch. See [research.md](research.md).

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), Node-free runtime inside Herdr
**Primary Dependencies**: `gh` CLI (REST search for counts, GraphQL search for pages), `lib/gh-account.js`
**Storage**: in memory (tracker views/counts); existing `localStorage` per-space view state
**Testing**: `herdr-app check mods/pr-flow`, `mods/inbox`; manual run per [quickstart.md](quickstart.md)
**Target Platform**: Herdr desktop app (macOS)
**Project Type**: mod in a config repo
**Performance Goals**: first page in one call; N rows cost 1 count + ceil(N/20) page calls
**Constraints**: no `cx.notify()` in render; `cx.spawn` for work; shared code in `lib/`, synced copies
**Scale/Scope**: `lib/pr-gh.js`, `mods/pr-flow/tracker.js`, `mods/pr-flow/main.js`, inbox's `gh.js` copy

## Constitution Check

- I. No shipped mod edited (pr-flow is personal) ✅
- II. gh calls change in `lib/pr-gh.js`, synced to `pr-flow/gh.js` and `inbox/gh.js` ✅ (inbox does not use `count`; check it still loads)
- III. `herdr-app check` gate for pr-flow and inbox ✅
- IV. Count/page work spawned; render only reads tracker state and spawns ✅
- V. Loading row and chips keep the existing kit pieces ✅
- VI. CLAUDE.md note on pr-flow paging ✅

Post-design re-check: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/019-pr-list-paging/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/gh-calls.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/pr-gh.js                # viewQuery, count(repo,state,logins), page(...)
mods/pr-flow/gh.js          # synced copy
mods/inbox/gh.js            # synced copy
mods/pr-flow/tracker.js     # views by repo|state|scope, count first, cursor pages, prune keeps listed
mods/pr-flow/main.js        # setView with repo, chips/header totals, loading row, refresh on open
CLAUDE.md                   # short note
```

## Complexity Tracking

None.

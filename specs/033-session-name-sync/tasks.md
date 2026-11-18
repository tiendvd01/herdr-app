# Tasks: One session name in agents, tabs and Sessions

**Input**: Design documents from `/specs/033-session-name-sync/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/session-name.md

**Tests**: unit tests for `lib/tab-title.js` (project convention, spec 025).

## Phase 1: Setup

- [X] T001 Add `mods/processes/tab-title.js` to the `sync lib/tab-title.js` line in scripts/sync-github-lib.sh

## Phase 2: Foundational (the rule)

- [X] T002 Add `TITLES_JQ` (moved verbatim from `scan()` in mods/my-agents/main.js) and `parseTitles(stdout)` → `{ custom, ai, first, all }` (last C, last A, first F, every C/A value, each `clean()`ed) to lib/tab-title.js
- [X] T003 Add `isChosen(tab, panes, titles)` to lib/tab-title.js: false when `!tab.named`, `tab.name === program.name`, or the whitespace-collapsed name equals the first 28 chars (whitespace-collapsed) of any of `titles.all`, `titles.first` or the cleaned live title; else true
- [X] T004 Change `tabTitle(tab, panes, titles)` in lib/tab-title.js to the order: chosen name → `titles.custom` → `titles.ai` → telling live title → `titles.first` → `tab.name`; add `titlesFor(tab, panes, map)`; update the header comment to spec 033
- [X] T005 Extend tests/tab-title.test.mjs: parseTitles, order of sources, chosen name wins, thread-cut name counts as automatic and follows a later rename, no titles = spec 032 behaviour
- [X] T006 Run `bash scripts/sync-github-lib.sh` and the unit tests

## Phase 3: User Story 1 + 2 — same name everywhere, chosen name wins (P1)

**Independent Test**: quickstart steps 3–6.

- [X] T007 [US1] In mods/my-agents/main.js `scan()`: use `TITLES_JQ`/`parseTitles`, build address → titles for live agents, and `setShared("session.titles", map)` only when `JSON.stringify` differs from the current shared value; drop `this.first` and the pid cache; re-read `sessions/<pid>.json` each round (/clear changes the session) and keep old titles with `mergeTitles`
- [X] T008 [US1] In mods/my-agents/main.js `label(a)`: `tabTitle(tab, panes(), shared("session.titles")?.[a.address])`, falling back (no tab) to cleaned titles custom/ai/live/first/program name
- [X] T009 [P] [US1] In mods/my-tabs/main.js: `tabTitle(c, panes(), titlesFor(c, panes(), shared("session.titles") ?? {}))`
- [X] T010 [P] [US1] In mods/processes/main.js: shown name = `tabTitle(tab, panes(), titles)` for the session's tab (found in `spaces()`), else cleaned `se.title`

## Phase 4: User Story 3 — Sessions second line (P2)

- [X] T011 [US3] In mods/processes/main.js: second line = the space's name only (a chosen name is already the shown name)

## Phase 5: Polish

- [X] T012 `herdr-app check mods/my-agents`, `mods/my-tabs`, `mods/processes`; `node scripts/check-dialog-frames.mjs`; check `herdr-app status` for errors
- [X] T013 Update the "Tab labels" bullet in CLAUDE.md to spec 033 (one rule in tab bar, sidebar, Sessions; titles shared by my-agents as `session.titles`)

## Dependencies

T001 → T002–T006 → T007 → T008–T011 → T012–T013. T009 and T010 are parallel (different files).

## Implementation Strategy

All P1 work is one increment (the shared rule plus three readers); US3 is a small follow-up in the same file.

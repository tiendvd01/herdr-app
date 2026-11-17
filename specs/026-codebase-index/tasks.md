# Tasks: Codebase index in Project Settings

**Input**: `specs/026-codebase-index/` (plan.md, spec.md, research.md, data-model.md, contracts/codegraph-lib.md, quickstart.md)

**Tests**: requested by FR-014 (exclude-list logic) — unit tests in `tests/codegraph.test.mjs`.

## Phase 1: Setup

- [X] T001 Add `sync lib/codegraph.js mods/project-settings/codegraph.js` to `scripts/sync-github-lib.sh` (next to the `lib/ports.js` line)

## Phase 2: Foundational (blocks all stories)

- [X] T002 Create `lib/codegraph.js` header + pure helpers `hasEntry(text)` / `addEntry(text)` per contracts/codegraph-lib.md (accepted spellings `.codegraph`, `.codegraph/`, `/.codegraph`, `/.codegraph/`; skip `#` lines; null text; no trailing newline)
- [X] T003 Add `findTool(exec, home)` to `lib/codegraph.js`: `codegraph --version` → `<home>/.local/bin/codegraph --version` → `zsh -ilc 'command -v codegraph'`; cache only a found path (research R5)
- [X] T004 [P] Unit tests for T002–T003 in `tests/codegraph.test.mjs` (fake exec as in `tests/ports.test.mjs`)

## Phase 3: User Story 1 — see state and index (P1) 🎯 MVP

**Independent test**: unindexed repo → tab Index → Index codebase → `.codegraph/` exists, counts shown.

- [X] T005 [US1] `indexState(main, exec, home)` in `lib/codegraph.js` returning IndexState (data-model.md: `tool`, `indexed`, `files`, `symbols`, `lastIndexed`, `pending`, `tracked`, `ignored`, `excludeFile`, `blocked`); `blocked` when main is home or `/`
- [X] T006 [US1] `runIndex(main, exec, io, home, mode)` + `running(main)` in `lib/codegraph.js`: one promise per main, `init` runs `ensureExcluded` first, errors = last 3 non-empty lines without ANSI
- [X] T007 [US1] Run `bash scripts/sync-github-lib.sh`; in `mods/project-settings/main.js` import from `./codegraph.js`, add chip `["index", "Index"]`, state `this.cg`, `loadIndex(cx)` on tab open / project pick, and `indexView(t)` with states missing tool / blocked / not indexed / indexing / indexed (files, symbols, last index, pending) / failed, button `Index codebase` (kitBtn primary, busy while running)
- [X] T008 [P] [US1] Tests for `indexState` and `runIndex` (one run at a time, failure message) in `tests/codegraph.test.mjs`

## Phase 4: User Story 2 — never in git (P1)

**Independent test**: after indexing, `git status --short` is empty; exclude has one `.codegraph/` line.

- [X] T009 [US2] `excludeFile(main, exec)` and `ensureExcluded(main, exec, io)` in `lib/codegraph.js` (`git rev-parse --path-format=absolute --git-path info/exclude`, `mkdir -p` its folder, write with expected text)
- [X] T010 [US2] In `indexView` of `mods/project-settings/main.js`: when `indexed && !ignored && !tracked` show "Not ignored by git" + `Ignore in git` button (calls `ensureExcluded`); when `tracked` show "Tracked in git — left as is"
- [X] T011 [P] [US2] Tests for `excludeFile` / `ensureExcluded` (missing file, no trailing newline, each spelling, no duplicate) in `tests/codegraph.test.mjs`

## Phase 5: User Story 3 — update index (P3)

- [X] T012 [US3] `Update index` button in `indexView` (`runIndex(..., "sync")`), then reload state, in `mods/project-settings/main.js`

## Phase 6: Polish

- [X] T013 Run unit tests, `herdr-app check mods/project-settings`, `node scripts/check-dialog-frames.mjs`, `herdr-app shot` of the tab
- [X] T014 Short note in `CLAUDE.md` (Project Settings › Index, `lib/codegraph.js`, spec 026)

## Dependencies

T001 → T002/T003 → US1 (T005–T008) → US2 (T009–T011; T006 uses `ensureExcluded`, so T009 lands with T006) → US3 (T012) → Polish. Test tasks [P] run beside their implementation.

## Strategy

MVP = US1 + US2 together (indexing without the exclude entry would dirty `git status`, so both P1 ship as one). US3 is a small add-on.

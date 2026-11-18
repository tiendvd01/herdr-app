# Tasks: Claude Threads per Space

**Input**: `specs/031-claude-threads/` (spec, plan, research, data-model, contracts)

## Phase 1: Setup

- [x] T001 Create `lib/claude-threads.js` skeleton per `contracts/claude-threads-lib.md`
- [x] T002 Add sync entries for `claude-threads.js`, `project-skills.js`, `space-folder.js`, `panel-ui.js` into `mods/threads/` in `scripts/sync-github-lib.sh`
- [x] T003 Create `mods/threads/mod.json` (`{ "place": "none" }`)

## Phase 2: Foundational

- [x] T004 Implement `slugOf`, `threadsDir`, `validId`, `cleanPrompt`, `parseLines`, `ago` in `lib/claude-threads.js`
- [x] T005 Implement `listFiles`, `summarize` (one `rg` call), `ThreadCache` in `lib/claude-threads.js`
- [x] T006 [P] Unit tests for T004/T005 in `tests/claude-threads.test.mjs`

## Phase 3: US1 — resume an old thread (P1) 🎯 MVP

- [x] T007 [US1] Panel view `mods/threads/main.js`: folder from `activePlace()`, periodic load via `cx.timer`, header with count, virtual list rows (title, ago, prompts, branch)
- [x] T008 [US1] Row click → `tab.new` in the space with `agentArgv` + `--resume <id>`
- [x] T009 [US1] Add `threads` block to `panel-body` in `layouts/tiendvd-layout.json`
- [x] T010 [US1] Threads button in `mods/my-tabs/main.js` trailing group; `threads` allowed as remembered panel

## Phase 4: US2 — running threads (P2)

- [x] T011 [US2] `liveMap` in lib + test; mod reads agent terminals' foreground pids via `hc get` (read each refresh while shown, no cache)
- [x] T012 [US2] Running mark on rows; click a running thread → `agent.focus`

## Phase 5: US3 — search and new thread (P3)

- [x] T013 [US3] `filterThreads` + test; search input with per-space query in `localStorage`; `shown / total`; no-match empty state with Clear
- [x] T014 [US3] New thread button → `tab.new` with `agentArgv` in the space folder

## Phase 6: US4 — delete (P3)

- [x] T015 [US4] `deleteThread` + test; two-step confirm on idle rows, none on running rows

## Phase 7: Polish

- [x] T016 Edge states: no folder, remote space, empty folder, Claude not found warning
- [x] T017 Run sync script, unit tests, `herdr-app check mods/threads`, `mods/my-tabs`, check `layout.error`, `node scripts/check-dialog-frames.mjs`, `herdr-app shot`
- [x] T018 Short Threads note in `CLAUDE.md` (layout list + personal mods)

## Dependencies

T001–T006 before US phases; US1 before US2–US4; US2–US4 independent of each other.

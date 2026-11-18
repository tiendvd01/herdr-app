# Tasks: Project Claude Memory

**Input**: Design documents from `specs/029-project-claude-memory/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/claude-memory-lib.md, quickstart.md

**Tests**: unit tests for `lib/claude-memory.js` (repo rule since spec 025: a new `lib/` file gets `tests/*.test.mjs`).

## Phase 1: Setup

- [X] T001 Add the sync line `sync lib/claude-memory.js mods/project-settings/claude-memory.js` (with a comment naming spec 029) to scripts/sync-github-lib.sh

## Phase 2: Foundational

- [X] T002 Create lib/claude-memory.js with `slugOf`, `memoryDir`, `safeFile` (`^[A-Za-z0-9][A-Za-z0-9._-]*\.md$`, false for `MEMORY.md`), `parseNote` (header with top-level or `metadata:` `type`; no header → name = stem, type `unknown`), `parseIndex`, `loadMemory(dir, exec, io)` (find+stat list, newest first, `unlisted`, `dead`, `stamp`) per contracts/claude-memory-lib.md
- [X] T003 [P] Create tests/claude-memory.test.mjs covering slug, safeFile, parseNote (both header styles, no header), parseIndex, loadMemory (missing folder, unlisted, dead) with fake exec + in-memory io

## Phase 3: User Story 1 - See what Claude remembers (P1) 🎯 MVP

**Independent Test**: Memory tab on `herdr-app` lists its 2 notes and the index.

- [X] T004 [US1] Add the `memory` tab chip and state (`mem`, `memFor`, `memSel`, `memType`, search InputState, markdown EditorState) to mods/project-settings/main.js; load in `cx.spawn` on tab show and on project pick
- [X] T005 [US1] Render `memoryView(t)` in mods/project-settings/main.js: header (path, count), type chips (All/user/feedback/project/reference), search, note list (name, description, type, age), empty state, selected note in the editor
- [X] T006 [US1] Refresh the list from the existing 5 s timer only while the Memory tab is shown, rereading only when `stamp` changed; reload the open note when it is not dirty (mods/project-settings/main.js)

## Phase 4: User Story 2 - Edit or delete a note (P1)

**Independent Test**: edit + Save changes the file; stale save refused; Delete removes file and index lines.

- [X] T007 [P] [US2] Add `saveNote` (expected text, unsafe file throws) and `deleteNote` (rm file, rewrite index via `withoutFile`) plus `withoutFile` to lib/claude-memory.js, with tests in tests/claude-memory.test.mjs
- [X] T008 [US2] Save / Revert / Delete (two-step confirm) buttons and messages in mods/project-settings/main.js; stale save → "Changed on disk" message + Reload button
- [X] T009 [US2] Guard unsaved edits: selecting another note / project / tab while dirty asks once (two-step "Discard changes?") in mods/project-settings/main.js

## Phase 5: User Story 3 - Keep the index healthy (P2)

**Independent Test**: an unlisted note and a dead line are both flagged and each fix resolves exactly one.

- [X] T010 [P] [US3] Add `indexLine`, `withLine`, `addToIndex(dir, file, exec, io)`, `dropDead(dir, file, io)` to lib/claude-memory.js with tests
- [X] T011 [US3] Show a warning card listing unlisted notes ("Add to index") and dead lines ("Remove line"), plus a "not in index" tag on list rows, in mods/project-settings/main.js

## Phase 6: User Story 4 - Add a note by hand (P3)

**Independent Test**: adding `probe-note` creates the file in Claude's format and one index line.

- [X] T012 [P] [US4] Add `validName` (`^[a-z0-9][a-z0-9_-]*$`, ≤ 64, not existing), `noteText`, `addNote(dir, note, exec, io)` (mkdir, create with expected null, append index line; creates index) to lib/claude-memory.js with tests
- [X] T013 [US4] "New note" form (name, description, type chips, body editor) with Create/Cancel in mods/project-settings/main.js

## Phase 7: Polish

- [X] T014 Run `sh scripts/sync-github-lib.sh`, unit tests, `herdr-app check mods/project-settings`, `node scripts/check-dialog-frames.mjs`
- [X] T015 Verify with `herdr-app shot` and the quickstart scratch scenario (temp folder memory, cleaned up afterwards)
- [X] T016 Update CLAUDE.md: Memory tab note (files, spec 029) and narrow "Nothing in Herdr ever writes to … `~/.claude/`" to the project's memory folder on explicit user action

## Dependencies

T001 → T002 → (T003, T004) → T005 → T006; US2–US4 lib tasks (T007, T010, T012) are parallel after T002; UI tasks follow their lib task; Polish last.

## Parallel Example

T007, T010, T012 touch only `lib/claude-memory.js` sections and tests — can be written together; UI tasks share `main.js` so run in order.

## Implementation Strategy

MVP = Phase 1–3 (read-only view). Then US2 (edit/delete), US3 (index health), US4 (add).

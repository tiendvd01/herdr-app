# Tasks: Project Settings Section Sidebar

**Input**: specs/030-settings-section-sidebar/ (spec.md, plan.md)

## Phase 1: User Story 1 - Pick a section from a second sidebar (P1) 🎯 MVP

- [X] T001 [US1] Add a `SECTIONS` table (key, label, hint) and a `selectSection(k, cx)` method holding the old chip handler (memGuard, refreshSkills, loadIndex, loadMem) in mods/project-settings/main.js
- [X] T002 [US1] Render the second column (≈200 px, chrome background, border_r) between the projects column and the content; rows highlighted with `t.selected`; remove the chip row in mods/project-settings/main.js

## Phase 2: User Story 2 - Know where you are (P2)

- [X] T003 [US2] Move the project name + short path to the top of the second column, drop the content's title block, hide the column when no project is selected in mods/project-settings/main.js

## Phase 3: Polish

- [X] T004 Run `herdr-app check mods/project-settings`, `node scripts/check-dialog-frames.mjs`, unit tests; `herdr-app shot` of the dialog
- [X] T005 Update the Project Settings description in CLAUDE.md (sections in a second sidebar)

## Dependencies

T001 → T002 → T003 → T004 → T005 (same file).

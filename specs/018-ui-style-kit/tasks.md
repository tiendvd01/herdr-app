# Tasks: Shared UI style kit

**Input**: `specs/018-ui-style-kit/` (plan, spec, research, contracts/ui-kit.md, quickstart)
**Tests**: not requested; `herdr-app check` + gallery/screen shots.

## Phase 1: Setup

- [X] T001 Read the current callers of `lib/panel-ui.js` exports (`rg "iconButton|backButton|chip\(|button\(|textButton" mods/*/main.js`) to keep wrapper signatures intact

## Phase 2: Foundational (blocks all stories)

- [X] T002 Add tokens `UI` (heights, radius, text, space, row, motion) to `lib/panel-ui.js` per contracts/ui-kit.md
- [X] T003 Add `btn(id, opts)` in `lib/panel-ui.js`: kinds primary/secondary/ghost/danger/icon/chip, sizes sm 22 / md 26 / lg 32, states hover/pressed/on/disabled/busy/attention (research R2)

## Phase 3: User Story 1 - One button set (P1) 🎯 MVP

- [X] T004 [US1] Rewrite `iconButton`, `backButton`, `chip`, `button`, `textButton` in `lib/panel-ui.js` as wrappers over `btn()` with unchanged signatures
- [X] T005 [US1] Create `mods/ui-gallery/mod.json` (`place: "none"`, dialog 0.75 × 0.8, `frame: "none"`) and `mods/ui-gallery/main.js` showing kinds × sizes × states
- [X] T006 [US1] Add `mods/ui-gallery/panel-ui.js` to the panel-ui line of `scripts/sync-github-lib.sh`; run the script; `herdr-app check` all panel-ui consumers + gallery

## Phase 4: User Story 2 - Motion (P1)

- [X] T007 [US2] Gallery motion row: busy toggle and attention toggle demos in `mods/ui-gallery/main.js`
- [ ] T008 [US2] Verify hover fade / press dip in the app (shot + by hand) — needs a hand check: no pointer control from the shell; if `transition` does not animate hover, note it in research R2 and keep the instant highlight

## Phase 5: User Story 3 - Common styles (P2)

- [X] T009 [US3] Add surfaces `dialogFrame`, `card`, `inputFrame`, `divider`, `sectionTitle`, `headerRow`, `emptyState` to `lib/panel-ui.js`; show them in the gallery
- [X] T010 [US3] Use `dialogFrame` in `mods/reviewer/main.js` and `mods/pr-flow/main.js` (dialog roots)

## Phase 6: User Story 4 - Adopt in screens (P2)

- [X] T011 [US4] Add `mods/my-tabs/panel-ui.js`, `mods/project-settings/panel-ui.js`, `mods/inbox/panel-ui.js`, `mods/status-usage/panel-ui.js`, `mods/branch-switch/panel-ui.js` to the sync script; run it
- [X] T012 [P] [US4] `mods/my-tabs/main.js`: trailing Files/Changes/Issues/Git/Pull requests buttons → `btn` kind icon (on state, Changes keeps its +/- counts as `extra`)
- [X] T013 [P] [US4] `mods/project-settings/main.js`: local `btn`/`link` helpers, tabs, Close → kit (`button`/`textButton`/`chip`/`btn`); root → `dialogFrame` when a dialog
- [X] T014 [P] [US4] `mods/inbox/main.js`: clickable buttons → kit
- [X] T015 [P] [US4] `mods/status-usage/main.js`: clickable buttons → kit (keep status-bar density: size sm)
- [X] T016 [P] [US4] `mods/branch-switch/main.js`: no buttons, only list rows (kept, per spec); removed from the sync list
- [X] T017 [US4] `herdr-app check` each adopter; shots of tab bar, Project Settings, gallery

## Phase 7: Polish

- [X] T018 Update CLAUDE.md (kit rule, gallery) and `.specify/memory/constitution.md` principle V wording (all screens, MINOR bump 2.0.0 → 2.1.0: guidance widened)
- [ ] T019 `herdr-app status` clean ✓; gallery screenshot in a light theme for readability (SC-006) — not done: switching the theme would change the user's live app

## Dependencies

T001 → T002 → T003 → everything. T004–T006 before adopters. T011 before T012–T016 (they are parallel, different files). Polish last.

## Implementation Strategy

MVP: kit + wrappers + gallery (T002–T006). Then motion check, surfaces, adopters.

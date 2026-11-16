# Tasks: Pull requests and Git graph as dialogs

**Input**: Design documents from `specs/016-pr-git-dialogs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dialog-contract.md, quickstart.md

**Tests**: Not requested. Verification is `herdr-app check` / `status` / `shot` (constitution III).

## Phase 1: Setup

- [X] T001 Re-read the reference dialog in `mods/reviewer/main.js` (init / `close()` / root frame) and `mods/reviewer/mod.json` overlay block; it is the pattern for every task below (contracts/dialog-contract.md)

## Phase 2: Foundational

None: each dialog is independent; no shared code is added.

## Phase 3: User Story 1 - Pull requests as a dialog (P1) 🎯 MVP

**Goal**: Tab bar Pull requests button and inbox open `pr-flow` as a 0.75×0.8 dialog.
**Independent Test**: quickstart scenarios 1, 5, 6.

- [X] T002 [US1] Set `mods/pr-flow/mod.json` to `{ "place": "none", "title": "Pull requests", "overlay": { "kind": "dialog", "width": 0.75, "height": 0.8, "frame": "none" } }`
- [X] T003 [US1] In `mods/pr-flow/main.js` `init`: when not viewer and `props().overlay != null`, store `this.overlay` and `setShared("pr-flow.dialog", overlay)`; add `async close()` that clears `pr-flow.dialog` only if it equals its own id
- [X] T004 [US1] In `mods/pr-flow/main.js` `openViewer`: when `this.overlay` is set, `setShared("pr-flow.goto", { url: this.url, at: Date.now() })` (if a PR is open) and `closeOverlay(this.overlay)` after opening the viewer (research R5)
- [X] T005 [P] [US1] In `mods/my-tabs/main.js`: replace the `prs` panelButton with a dialog button (on = `shared("pr-flow.dialog") != null`, click = `run("mod.open", { name: "pr-flow" })`), and drop `"prs"` from `enabled`
- [X] T006 [P] [US1] In `mods/inbox/main.js` `show()`: replace the `layout.select`/`layout.show` of `prs` with `setShared("pr-flow.goto", …)` then `run("mod.open", { name: "pr-flow" })` only if `shared("pr-flow.dialog") == null` (research R6)

## Phase 4: User Story 2 - Git graph as a dialog (P1)

**Goal**: Tab bar Git button opens `git-graph` as a dialog; its menus and confirm dialogs work above it.
**Independent Test**: quickstart scenario 2.

- [X] T007 [US2] Add `"overlay": { "kind": "dialog", "width": 0.75, "height": 0.8, "frame": "none" }` to `mods/git-graph/mod.json`
- [X] T008 [US2] In `mods/git-graph/graph.js` Graph `init`: when `props()?.overlay != null` (role-less copy), store `this.overlay` and `setShared("git-graph.dialog", overlay)`; in `mods/git-graph/main.js` add `async close()` that, for the Graph part, clears `git-graph.dialog` if it equals its id
- [X] T009 [P] [US2] In `mods/my-tabs/main.js`: replace the `graph` panelButton with a dialog button (on = `shared("git-graph.dialog") != null`, click = `run("mod.open", { name: "git-graph" })`), and drop `"graph"` from `enabled`

## Phase 5: User Story 3 - Dialog border (P1)

**Goal**: One frame per dialog, same as Changes: `rounded(10)`, `border_1`, `t.border`, `shadow_lg`, clipped.
**Independent Test**: quickstart scenario 3.

- [X] T010 [P] [US3] In `mods/pr-flow/main.js` `render`: when `this.overlay` is set, add `.shadow_lg()` to `shell` (radius 10 + border + overflow_hidden already there); viewer stays frameless
- [X] T011 [P] [US3] In `mods/git-graph/graph.js` render root: when `this.overlay` is set, use `rounded(10)` and add `.shadow_lg()`; panel/pane copy keeps `paneFrame(layout())` radius
- [X] T012 [US3] Take `herdr-app shot` of Changes, Pull requests, Git dialogs and compare edges; also open a git-graph confirm dialog and a menu popup and check they draw their normal Herdr frame above the graph dialog

## Phase 6: User Story 4 - Panel without Git / Pull requests (P2)

**Goal**: Right panel holds only Files and Issues.
**Independent Test**: quickstart scenario 4.

- [X] T013 [US4] Remove the `graph` and `prs` children from `panel-body` in `layouts/tiendvd-layout.json`; check `layout.error`
- [X] T014 [US4] Confirm `syncPanel` in `mods/my-tabs/main.js` hides the panel for spaces that remembered `graph`/`prs` (no code change expected)

## Phase 7: Polish

- [X] T015 Run `herdr-app check` for `mods/pr-flow`, `mods/git-graph`, `mods/my-tabs`, `mods/inbox`; `herdr-app status` shows no errors
- [X] T016 Update `CLAUDE.md`: layout section (panel-body = files / issues; Git and Pull requests open as dialogs from the tab bar like Changes), inbox note, and a note that `git-graph` carries a local dialog patch (mod.json overlay, `close()`, dialog flag + frame in graph.js) to re-apply after upstream updates

## Dependencies

- T001 → all. US1 (T002–T006) and US2 (T007–T009) are independent; T005 and T009 touch the same file (do sequentially).
- US3 depends on T003 (pr-flow `this.overlay`) and T008 (git-graph `this.overlay`).
- US4 (T013) after T005 + T009 so the buttons no longer target panel children.
- Polish last.

## Parallel examples

- After T001: T002–T004 (pr-flow) ‖ T007–T008 (git-graph) ‖ T006 (inbox).
- T010 ‖ T011.

## Implementation Strategy

MVP = US1 + its frame (T010). Then US2 + T011, then US4 cleanup, then CLAUDE.md.

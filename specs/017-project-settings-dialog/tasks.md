# Tasks: Project Settings as a dialog

**Input**: `specs/017-project-settings-dialog/` (plan.md, spec.md, research.md, quickstart.md)
**Tests**: not requested; verify with `herdr-app check` / `status` / `shot`.

## Phase 1: Setup

- [X] T001 Re-read the dialog contract in `specs/016-pr-git-dialogs/contracts/dialog-contract.md`

## Phase 2: Foundational

None.

## Phase 3: User Story 1 - Open as a dialog (P1) 🎯 MVP

- [X] T002 [US1] Set `mods/project-settings/mod.json` to `{ "place": "none", "title": "Project Settings page", "overlay": { "kind": "dialog", "width": 0.75, "height": 0.8, "frame": "none" } }`
- [X] T003 [US1] In `mods/project-settings/main.js`: in `init` store `this.overlay = props()?.overlay ?? null` and `setShared("project-settings.dialog", …)` when set; add `async close()` clearing it if it is its own id; import `props`, `setShared`, `closeOverlay`
- [X] T004 [US1] In `mods/project-settings/main.js` render: "Back" becomes "Close" with `closeOverlay(this.overlay)` when in a dialog (research R3)
- [X] T005 [P] [US1] In `mods/my-chrome/main.js` footer: row on = `shared("project-settings.dialog") != null`, click = `run("mod.open", { name: "project-settings" })`; remove the space-switch reset of the content stack (research R4)
- [X] T006 [US1] Remove the `project-settings` child from the `content` stack in `layouts/tiendvd-layout.json`; check `layout.error`

## Phase 4: User Story 2 - Other entry points (P1)

- [X] T007 [P] [US2] In `mods/my-new-menu/main.js` `openSkillsTab`: keep the `project-settings.tab` request, then `run("mod.open", { name: "project-settings" })` only if `shared("project-settings.dialog") == null`
- [X] T008 [US2] In `mods/project-settings/main.js` `gotoTerminal`: close the overlay when in a dialog instead of selecting `main`

## Phase 5: User Story 3 - Frame (P2)

- [X] T009 [US3] In `mods/project-settings/main.js` render root: add `shadow_lg()` when `this.overlay != null`
- [X] T010 [US3] `herdr-app shot` Project Settings and Changes dialogs; compare size and edges

## Phase 6: Polish

- [X] T011 `herdr-app check` the three mods; `herdr-app status` no errors
- [X] T012 Update `CLAUDE.md` (layout line: content stack is tab panes only; Project Settings is a dialog from the sidebar footer and + menu)

## Dependencies

T001 → all. T003 before T004/T008/T009 (same file, sequential). T005, T007 parallel with project-settings work. T006 after T005 and T007 (no entry point selects the child any more). Polish last.

## Implementation Strategy

MVP = US1 (T002–T006) + T009; then US2; then docs.

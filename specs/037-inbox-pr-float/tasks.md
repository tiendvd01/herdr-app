# Tasks: PR inbox in a dialog, opened from a floating button

**Input**: specs/037-inbox-pr-float/ (plan, spec, research, data-model, contracts/ui.md, quickstart)
**Tests**: not requested; gate is `herdr-app check`, `check-dialog-frames`, `herdr-app shot`.

## Phase 1: Setup

- [x] T001 Set dialog overlay in mods/inbox/mod.json: `{ "place": "none", "title": "Inbox", "overlay": { "kind": "dialog", "width": 560, "height": 620, "frame": "none" } }`

## Phase 2: Foundational

- [x] T002 In mods/inbox/main.js move the entry list to `shared("inbox.items")` (read via an `items` getter, write via `setShared` in `save()`); the floating copy seeds it once from its localStorage `items`; every load drops entries with `kind !== "pr"`; keep KEEP=150 and the 7-day Done limit
- [x] T003 In mods/inbox/main.js tell the copies apart: dialog = `props()?.overlay` set; only the non-dialog copy polls PRs, runs the minute timer and handles `nextCommand()` (`open-latest`, `done-all`)

## Phase 3: US3 — PR news only (P1)

- [x] T004 [US3] Remove agent tracking (`trackAgents`, `this.prev`, agent branches of `open()`/`mark()`, `agents` import) and the narrow-rail render from mods/inbox/main.js
- [x] T005 [US3] Remove the `inbox` block from `sidebar-lists` in layouts/tiendvd-layout.json

## Phase 4: US1 — button + dialog (P1)

- [x] T006 [US1] Add floating block `{ "id": "inbox-fab", "content": { "mod": "inbox" }, "edge": "bottom", "align": "end" }` to the `content` stack in layouts/tiendvd-layout.json
- [x] T007 [US1] Floating copy render in mods/inbox/main.js: inbox icon `btn` + unread pill (`99+` cap), dim at 0, lit while `shared("inbox.dialog")`; click runs `mod.open {name:"inbox"}`
- [x] T008 [US1] Dialog copy in mods/inbox/main.js: init sets `inbox.dialog` = overlay id, `close()` clears it; root wrapped in `dialogFrame`; header (title, unread pill, Mark all as done, ✕), Esc closes, list + Done group + Clear, PR empty state per contracts/ui.md
- [x] T009 [US1] Row click in the dialog: mark read, `closeOverlay`, then open Pull requests on the PR (existing `open()` path)

## Phase 5: US2 — move the button (P2)

- [ ] T010 [US2] Verify drag + restart keeps the spot (Herdr floating behaviour, no code); note result in quickstart run

## Phase 6: Polish

- [x] T011 Run `herdr-app check mods/inbox`, check `layout.error`, `node scripts/check-dialog-frames.mjs`, `herdr-app shot` of window and open dialog
- [x] T012 Update CLAUDE.md: sidebar list without `inbox`, Inbox as floating button + dialog, PR-only, `inbox.items`/`inbox.dialog` shared keys, spec 037

## Dependencies

T001 → T002 → T003 → (T004, T005) → T006–T009 → T010 → T011 → T012. All tasks touch main.js or the layout, so little runs in parallel (T005/T006 layout vs. main.js tasks can).

## Strategy

MVP = US3 + US1 together (the sidebar block goes away only once the button exists); US2 is free from Herdr.

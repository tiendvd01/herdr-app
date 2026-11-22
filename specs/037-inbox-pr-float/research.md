# Research: 037 inbox PR float

## R1. Floating, draggable button
- **Decision**: a layout floating block on the `content` stack: `{ "id": "inbox-fab", "content": { "mod": "inbox" }, "edge": "bottom", "align": "end" }`.
- **Rationale**: AGENTS.md "Floating blocks": sits 12 px in from the edge, sizes to content, users drag it, it springs to the nearest edge and third on release and Herdr saves the spot. Covers FR-004/FR-006 with no code. `content` spans tab bar to status bar between sidebar and right panel, the red box area.
- **Alternatives**: `kind: "window"` overlay (stays where dropped, `key` remembers) — but it sits over everything incl. sidebar and needs our own open-at-start logic; rejected.

## R2. Two copies, one list
- **Decision**: entries in `shared("inbox.items")`; the floating copy (no `props().overlay`) is the only one that polls and posts toasts; the dialog copy (`props().overlay` set) reads and edits the same shared list.
- **Rationale**: localStorage is per mod copy (AGENTS.md), shared state is seen by every mod and re-renders them, and Herdr persists it (`shared.json`). Copies run in one JS runtime, so read-modify-`setShared` has no race.
- **Alternatives**: dialog sends requests to the floating copy (extra protocol); a separate `inbox-fab` mod (two folders of the same logic). Rejected.

## R3. Opening/closing the dialog
- **Decision**: button runs `mod.open {name:"inbox"}` (toggles); `mod.json` overlay `{ kind: dialog, width 560, height 620, frame none }`; dialog sets `inbox.dialog` = overlay id in init, clears it in `close()`. Button lights while open. Entry click: dialog does the PR open and `closeOverlay`.
- **Rationale**: same pattern as Changes/Git/Pull requests (spec 016) and the dialog border rule (spec 024).

## R4. Migration
- **Decision**: on first run of the floating copy with no shared list, seed from its localStorage `items` if any (copy may differ from the old sidebar copy's storage, then it starts empty), and always drop `kind !== "pr"` entries.
- **Rationale**: FR-002. Losing old PR entries is harmless: PR snapshots rebuild silently on first look.

## R5. Toast click (`inbox.open-latest`)
- **Decision**: handled only by the floating copy: opens the newest live PR entry the same way an entry click does.

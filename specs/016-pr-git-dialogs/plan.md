# Implementation Plan: Pull requests and Git graph as dialogs

**Branch**: `016-pr-git-dialogs` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-pr-git-dialogs/spec.md`

## Summary

Move the Git (`git-graph`) and Pull requests (`pr-flow`) views out of the right panel stack and open them
as dialogs, the same way Changes (`reviewer`) already works: `mod.json` declares an `overlay`
(`kind: dialog`, 0.75 × 0.8, `frame: "none"`), the tab bar toggles it with `mod.open`, the mod writes its
overlay id to a shared key while open (cleared in `close()`), and the tab bar reads that key for the "on"
state. Because `frame: "none"` drops Herdr's frame, each mod draws exactly one frame of its own:
`rounded(10)`, `border_1` in `t.border`, `shadow_lg`, `overflow_hidden` — identical to the Changes dialog.
The inbox opens the Pull requests dialog (if not open) instead of selecting the panel child.

## Technical Context

**Language/Version**: Plain JavaScript ES modules, loaded by Herdr (gpui-kit), no build

**Primary Dependencies**: Herdr mod API (`herdr`: `openOverlay`, `closeOverlay`, `props`, `shared`/`setShared`, `run("mod.open")`), gpui-kit / gpui-base

**Storage**: Herdr shared state (`pr-flow.dialog`, `git-graph.dialog`, existing `pr-flow.goto`); per-space panel choice in `my-tabs` localStorage (unchanged)

**Testing**: `herdr-app check mods/<name>`, `herdr-app status`, `herdr-app shot` (no test suite, per constitution III)

**Target Platform**: Herdr desktop app on macOS

**Project Type**: Desktop app configuration (mods + layout)

**Performance Goals**: Dialog opens in one click, no extra `gh`/`git` calls compared with the panel

**Constraints**: No `cx.notify()` in render; shipped mods/layouts untouched; `git-graph` is upstream (rabeeh-ta/herdr-git-graph) → keep its diff minimal and documented

**Scale/Scope**: 5 files touched in mods (`pr-flow/main.js`, `pr-flow/mod.json`, `git-graph/main.js`, `git-graph/graph.js`, `git-graph/mod.json`), plus `my-tabs/main.js`, `inbox/main.js`, the personal layout and CLAUDE.md

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|---|---|---|
| I. Shipped mods read-only | PASS | `tabs`, `main.json` layout not touched; `my-tabs` is the personal clone. `git-graph` is third-party, not shipped by Herdr; edited in place with a minimal, documented diff (research R3). |
| II. Single source in `lib/` | PASS | No shared code added; no synced copy edited (`panel-ui.js`, `space-folder.js` stay as is). |
| III. Plain JS + `herdr-app check` gate | PASS | Check every touched mod and `layout.error`. |
| IV. Runtime conventions | PASS | `setShared` happens in `init`/`close`, not in render notify loops; timers stay `cx.timer`. |
| V. Consistent panel UI | PASS | Buttons unchanged; both views still follow the focused terminal's folder. |
| VI. Intent in CLAUDE.md and specs | PASS | CLAUDE.md layout + mod notes updated (FR-013). |

Post-design re-check: PASS (no new violations).

## Project Structure

### Documentation (this feature)

```text
specs/016-pr-git-dialogs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dialog-contract.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
layouts/tiendvd-layout.json   # drop "graph" and "prs" from panel-body
mods/
├── pr-flow/
│   ├── mod.json              # place none + overlay dialog 0.75×0.8 frame none
│   └── main.js               # dialog flag in init/close, frame with shadow, viewer closes the dialog
├── git-graph/
│   ├── mod.json              # overlay dialog 0.75×0.8 frame none
│   ├── main.js               # close(): clear git-graph.dialog
│   └── graph.js              # set git-graph.dialog in init; radius 10 + shadow in a dialog
├── my-tabs/main.js           # Git / Pull requests buttons → mod.open toggles; drop from panel list
└── inbox/main.js             # PR entry → open pr-flow dialog + pr-flow.goto
CLAUDE.md                     # new placement
```

**Structure Decision**: Reuse the Changes dialog mechanism verbatim; no new mod, no new shared library.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| In-place edit of upstream `git-graph` | The graph draws its own border; only the mod can match the dialog frame | Opening it with Herdr's frame gives a double border; a personal clone would stop receiving upstream updates and needs rewiring of all its self-opened overlays (`mod: "git-graph"`) |

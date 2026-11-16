# Implementation Plan: Project Settings as a dialog

**Branch**: `017-project-settings-dialog` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-project-settings-dialog/spec.md`

## Summary

Same mechanism as spec 016 (see `specs/016-pr-git-dialogs/contracts/dialog-contract.md`): `project-settings`
gets a `mod.json` overlay (`dialog`, 0.75 × 0.8, `frame: "none"`), is toggled with `mod.open`, writes
`project-settings.dialog` while open, and draws the one frame (`rounded(10)`, `border(1)`, `shadow_lg`). The
`project-settings` child leaves the `content` stack. Entry points change from `layout.select` to `mod.open`:
sidebar footer (`my-chrome`), + menu (`my-new-menu`), and the page's own Back / go-to-terminal close the overlay.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit), no build

**Primary Dependencies**: Herdr mod API (`mod.open`, `closeOverlay`, `props`, `shared`/`setShared`)

**Storage**: shared `project-settings.dialog` (overlay id while open), existing `project-settings.tab` request

**Testing**: `herdr-app check`, `status`, `shot`

**Target Platform**: Herdr desktop, macOS

**Project Type**: Desktop app configuration

**Performance Goals**: N/A (same timers as today; they run only while the dialog exists)

**Constraints**: constitution IV (no notify in render); `lib/project-skills.js` copies untouched

**Scale/Scope**: `mods/project-settings/{mod.json,main.js}`, `mods/my-chrome/main.js`, `mods/my-new-menu/main.js`, layout, CLAUDE.md

## Constitution Check

| Principle | Status | Note |
|---|---|---|
| I. Shipped mods read-only | PASS | All touched mods are personal (`my-chrome`, `my-new-menu` are clones). |
| II. Single source in `lib/` | PASS | Synced copies (`project-skills.js`, `ports.js`, `space-folder.js`) not edited. |
| III. `herdr-app check` gate | PASS | Check all three mods + `layout.error`. |
| IV. Runtime conventions | PASS | `setShared` in init/close only. |
| V. Panel UI | N/A | Not one of the right panels. |
| VI. CLAUDE.md | PASS | Update layout + Project Settings notes. |

Post-design: PASS.

## Project Structure

```text
specs/017-project-settings-dialog/  plan.md research.md quickstart.md tasks.md
layouts/tiendvd-layout.json         # content stack: drop project-settings child
mods/project-settings/mod.json      # overlay
mods/project-settings/main.js       # dialog flag, close(), frame, Back → Close, gotoTerminal closes
mods/my-chrome/main.js              # footer row: mod.open, on = shared flag; drop space-switch reset
mods/my-new-menu/main.js            # openSkillsTab: request + mod.open if not open
CLAUDE.md
```

**Structure Decision**: Reuse the 016 dialog contract; no data-model or new contract (no new entities/interfaces).

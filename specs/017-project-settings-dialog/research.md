# Research: Project Settings as a dialog

## R1. Mechanism
- **Decision**: reuse the spec 016 dialog contract (`mod.json` overlay 0.75 × 0.8, `frame: "none"`, `mod.open` toggle, shared `<mod>.dialog`).
- **Rationale**: one behaviour for every dialog; footer row needs an "on" state that survives Esc.

## R2. + menu "Project skills…"
- **Finding**: `my-new-menu.openSkillsTab` sets `project-settings.tab` and selects the content child; `openRequest` (called in render) consumes the request if < 10 s old.
- **Decision**: keep the request, then `mod.open project-settings` only if `shared("project-settings.dialog") == null`. A fresh copy reads the request on first render.

## R3. Back and go-to-terminal
- **Decision**: in a dialog, "Back" becomes "Close" (`closeOverlay`); `gotoTerminal` closes the overlay instead of selecting `main`. Outside a dialog (should not happen any more) keep the old `layout.select` so a stale layout still works.

## R4. Space switch
- **Finding**: `my-chrome` footer resets the content stack to `main` when the active space changes.
- **Decision**: drop it; nothing else selects `project-settings` in the stack any more.

## R5. Frame
- **Finding**: root already has `rounded(10).border(1).border_color(t.border).overflow_hidden()` and `bg(t.surface)`.
- **Decision**: add `shadow_lg()` in a dialog. Background stays `t.surface` (the page's look); border/radius match the other dialogs.

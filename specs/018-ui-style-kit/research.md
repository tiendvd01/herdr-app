# Research: Shared UI style kit

## R1. Where the kit lives
- **Decision**: extend `lib/panel-ui.js` (already the shared button file, synced into 6 mods) into the app's UI kit; keep every existing export with the same signature. New consumers are added to `scripts/sync-github-lib.sh`.
- **Rationale**: constitution II (one source in `lib/`, synced copies); no churn for current callers (FR-012).
- **Alternatives**: a new `lib/ui-kit.js` plus a wrapper — two files to sync per mod for no gain.

## R2. Motion available natively
- **Finding** (`gpui-kit.d.ts`): `transition(property, {duration, easing})`, `spring`, `loop`, `spin`, `frames`; properties are only opacity, width, height, left, top. Style states: `hover(...)`, `active(...)` (pressed), `focus(...)`. No group-hover, no scale, no color transition.
- **Decision**:
  - Hover fade: an absolute highlight layer (`inset_0`, same radius, hover color) at opacity 0, `.hover(opacity 1)`, `.transition("opacity", 120 ms ease-out)`. The layer has no handlers, the button's click bubbles as before.
  - Press: `.active(opacity 0.75)` on the button with `.transition("opacity", 80 ms)`; the action runs on click as before (no delay).
  - Busy: content kept (opacity 0, holds the width) and a spinner (`lib/icons/spinner.svg`, `.spin(900)`) centered on top; clicks ignored.
  - Attention: an accent ring layer with `.loop("opacity", {from 0.2, to 1, period 1400})`.
  - All native: nothing runs while not drawn (FR-008).
- **Risk**: whether `transition` animates a hover-style change. Verified in the gallery; if not, hover stays an instant highlight (still consistent).

## R3. Tokens (from today's most used values)
- Heights: sm 22, md 26, lg 32. Radius: sm 4, md 6, lg 8, xl 10 (dialogs). Text: caption 11, small 12, body 13, title 14, heading 16. Space: 2, 4, 6, 8, 10, 12, 14, 16. Header row 42, toolbar 36.
- Colors: theme only. primary = `solid`/`solid_foreground`; secondary = `raised` + `input` border; ghost/icon/chip = transparent, `muted`/`dim` text, `hover` layer, `selected` when on; danger = `ansi1` text/border with an `ansi1` tint layer (hex + alpha, as reviewer already does with `surface + "eb"`).

## R4. Gallery
- **Decision**: personal mod `ui-gallery`, `place: "none"` (never docked), dialog overlay like the others; opened with `herdr-app do mod.open '{"name":"ui-gallery"}'`.

## R5. Adoption scope
- Panels: automatic through the synced kit (Files, Changes, Issues, Git, Pull requests, Mermaid board).
- Hand-migrated: `my-tabs` trailing buttons, `project-settings`, `inbox`, `status-usage`, `branch-switch`; dialog frame helper used by `reviewer`, `pr-flow`, `project-settings` (git-graph keeps its inline frame with the same values: upstream diff stays small).

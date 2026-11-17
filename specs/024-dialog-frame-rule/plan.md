# Plan: One rule for dialog borders (spec 024)

## Approach

- **Rule** (CLAUDE.md, dialog paragraph; one doc line on `dialogFrame` in `lib/panel-ui.js`):
  self-framed dialog = `mod.json` `overlay.frame: "none"` + root wrapped in `dialogFrame` (the only frame helper).
  Open another mod's dialog with `run("mod.open", {name})`; an explicit `openOverlay` does not read `mod.json`.
- **Check**: `scripts/check-dialog-frames.mjs` (Node, no deps, `[root]` arg default repo). Personal mods only
  (shipped list skipped). Rules:
  1. code calls `dialogFrame(` → `mod.json` has `overlay.frame: "none"`;
  2. `overlay.frame: "none"` → code calls `dialogFrame(`;
  3. `openOverlay({... mod: "X" ...})` from another mod where X is self-framed → the call passes `frame: "none"` (better: `mod.open`).
- **Unify**: Processes from status bar and `tmux-prefix` → `mod.open`; git-graph's hand-built dialog frame → `dialogFrame`.

## Constitution

I (shipped untouched), II (`panel-ui.js` edited in `lib/`, synced by `scripts/sync-github-lib.sh`), III (`herdr-app check` on touched mods), V (one kit frame). Pass.

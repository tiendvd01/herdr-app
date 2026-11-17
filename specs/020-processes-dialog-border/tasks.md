# Tasks: Processes dialog with one border

- [x] T001 Add `mods/processes/panel-ui.js` to the panel-ui line in scripts/sync-github-lib.sh and run it
- [x] T002 [US1] Add `overlay` with `frame: "none"` (920 × 720 dialog) to mods/processes/mod.json
- [x] T003 [US1] Pass `frame: "none"` in the process badge's `openOverlay` in mods/status-usage/main.js
- [x] T004 [US1] Wrap the root of mods/processes/main.js render in `dialogFrame` (import from ./panel-ui.js)
- [x] T005 `herdr-app check mods/processes` and `mods/status-usage`; open the dialog; `herdr-app shot`; note in CLAUDE.md

# Implementation Plan: Git Graph Panel (as-built)

**Branch**: `005-git-graph-panel` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-git-graph-panel/spec.md`

## Summary

Document the existing `git-graph` mod: one mod with several roles (graph panel/pane, right-click menu, action dialog, update window, Manygit settings) selected by `props.role`. The graph reads `git log`/`status` through `exec`, lays commits on lanes, and runs git actions after verifying the repository snapshot. No new code is planned; this plan records the design as built and its gaps against the constitution.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) on Herdr's gpui-kit / gpui-base runtime; no TypeScript.

**Primary Dependencies**: `gpui-kit`, `gpui-base`, `herdr` module (`exec`, `watchFolder`, `readTextFile`, `shared`/`setShared`, `openOverlay`, `notify`, `panes`, `spaces`, `knownAgents`, `updates`); system `git` and `find`/`env`; GitHub releases API for the update check.

**Storage**: Herdr shared state (`git-graph.columns`, `.depth`, `.tags`, `.update`, `.changed`, `.fetched`); `localStorage` key `detailsH`. No files written.

**Testing**: None in repo. Gate is `herdr-app check mods/git-graph`, the `.error` files and manual scenarios. `execute.js` is kept separate from the UI so actions can be tried against disposable repos.

**Target Platform**: Herdr desktop app on macOS; local and remote-machine spaces.

**Project Type**: Herdr mod (docked panel block `graph` in `layouts/tiendvd-layout.json`, also usable as a pane with `props.folder`).

**Performance Goals**: Redraw on ref change within about a second; virtual list for rows; at most 8 concurrent git processes for Manygit; history paged by 300.

**Constraints**: `render()` must not notify; no timers other than `cx.timer`; reads use `--no-optional-locks`; fetch never prompts; actions refuse on stale HEAD.

**Scale/Scope**: Up to 500 repositories per Manygit scan (depth 1 to 5), 24 remembered folders, 200 cached commit details, 500 files per details view.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Shipped mods read-only**: PASS with note. `git-graph` is a third-party mod, not a shipped one; it is edited in place and updated by asking an agent (prompt in the update window). It is not in the shipped list, so no clone is required.
- **II. Single source in `lib/`**: PASS. `panel-ui.js` and `space-folder.js` in the mod are copies produced by `scripts/sync-github-lib.sh` and are not edited here. `space-folder.js` is registered in the script; confirm `panel-ui.js` is too (see research R6).
- **III. Plain JS and `herdr-app check`**: PASS. No build or tests; gate is `herdr-app check mods/git-graph` plus `.error` files.
- **IV. Runtime conventions**: PASS by design. Work uses `cx.spawn`/`cx.timer`; `render()` triggers `refresh` only when the folder key or shared tokens changed (it spawns, never notifies directly). Per-view state is in the instance, `localStorage` only holds `detailsH`; cross-copy settings use shared state, which is a documented deviation from "per-space in localStorage" (research R3).
- **V. Consistent panel UI**: PASS. Buttons/chips come from `panel-ui.js` with icons from `mods/git-graph/icons/`; panel follows the focused folder through `space-folder.js`. Note: icons are the mod's own set, not `lib/icons/`.
- **VI. Documentation tracks behaviour**: GAP. No `docs/mods/git-graph.md` exists; adding one is the follow-up this spec enables.

Re-check after design: no new violations; the one gap is VI.

## Project Structure

### Documentation (this feature)

```text
specs/005-git-graph-panel/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No `contracts/`: the only external interface is the public GitHub releases GET.

### Source Code (repository root)

```text
mods/git-graph/
├── main.js          # role switch: graph | menu | dialog | update | settings
├── graph.js         # panel/pane: state, refresh, watch, Manygit, table, details, diff
├── lanes.js         # commit-to-lane layout and segments
├── git.js           # git args, log/status parsing, menus, dialogs, validation, commands
├── execute.js       # action execution with HEAD/branch snapshot checks
├── act.js           # perform/openDialog/showChanges, toasts, shared change token
├── menu.js          # right-click popup
├── dialog.js        # action dialog
├── repos.js         # Manygit: find, status, fetch, remotes, sync wording
├── settings.js      # depth and tags popup
├── update.js        # release check and update window
├── panel-ui.js      # GENERATED copy of lib/panel-ui.js
├── space-folder.js  # GENERATED copy of lib/space-folder.js
└── icons/           # the mod's SVG glyphs

layouts/tiendvd-layout.json   # block id "graph" -> mod git-graph
docs/mods/                    # git-graph.md missing (gap)
```

**Structure Decision**: one mod, role-switched in `main.js`, so popups and dialogs are separate overlay instances of the same mod.

## Complexity Tracking

No constitution violations to justify. The documentation gap (VI) is tracked in research R7.

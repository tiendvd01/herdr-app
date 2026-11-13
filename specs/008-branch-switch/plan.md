# Implementation Plan: Branch Switch Popup

**Branch**: `008-branch-switch` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-branch-switch/spec.md` (as-built; this plan records the existing design).

## Summary

A popup mod lists the repository's branches for the active space's folder and switches, tracks or creates a branch with `git switch`. It is opened from the status bar branch (`mods/status-usage`), reuses the shared folder rule, and tells the status bar to refresh through a shared key.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) on gpui-kit / gpui-base, hot-loaded by Herdr

**Primary Dependencies**: `herdr` API (`exec`, `spaces`, `props`, `closeOverlay`, `notify`, `setShared`, `theme`), `gpui-kit`, `gpui-base` (`InputState`, `Input`, `Scrollbar`), system `git`

**Storage**: None (no `localStorage`); one transient shared key `branch.switched`

**Testing**: None in repo; gate is `herdr-app check mods/branch-switch`, `herdr-app status`, `herdr-app shot`

**Target Platform**: Herdr desktop app on macOS (and remote machines via `exec` `on`)

**Project Type**: Desktop app mod (popup overlay, `place: none`, 380x420)

**Performance Goals**: List and worktree queries run in parallel on open; list height capped at 300px

**Constraints**: Hot-reload on save; `render()` must not notify; work via `cx.spawn`; no timers except `cx.timer`

**Scale/Scope**: One mod file (~185 lines), one synced lib file

## Constitution Check

- **I. Shipped mods read-only**: PASS. `branch-switch` is a personal mod, not a shipped one; no shipped file edited.
- **II. Single source in `lib/`**: PASS. `space-folder.js` in the mod is a synced copy of `lib/space-folder.js`, registered in `scripts/sync-github-lib.sh`; not edited by hand.
- **III. Plain JS and `herdr-app check`**: PASS. No build or tests; check is the gate.
- **IV. Runtime conventions**: PASS. Work in `cx.spawn`, `cx.notify()` after completion, no kept `cx`, only `cx.timer.after` for refocus, spinner is native `.spin`. No per-space state is stored, so the localStorage rule is not triggered.
- **V. Consistent panel UI**: PASS (N/A for panel buttons: this is a popup, not one of the five panels); it follows the focused terminal's folder via `space-folder.js`.
- **VI. Documentation tracks behaviour**: PASS. Behaviour is documented in `docs/mods/status-usage.md` ("Đổi branch") and `docs/space-folder.md`; any change must update them.

## Project Structure

### Documentation (this feature)

```text
specs/008-branch-switch/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (repository root)

```text
mods/branch-switch/
├── main.js            # popup view: list, filter, switch/create, errors
├── mod.json           # place none, overlay 380x420
├── space-folder.js    # GENERATED copy of lib/space-folder.js (do not edit)
├── gpui-kit.d.ts      # generated
└── jsconfig.json      # generated
lib/space-folder.js    # single source of the folder rule
scripts/sync-github-lib.sh   # copies space-folder.js into the mod
mods/status-usage/main.js    # opens the popup, polls branch, watches branch.switched
docs/mods/status-usage.md    # behaviour notes
docs/space-folder.md         # folder rule
```

**Structure Decision**: a single self-contained mod plus one synced shared file; no new `lib/` code.

## Complexity Tracking

No constitution violations.

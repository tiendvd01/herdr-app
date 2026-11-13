# Implementation Plan: Port Manager (as-built)

**Branch**: `010-port-manager` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-port-manager/spec.md`

## Summary

Document the existing Ports tab of Project Settings: per git project, list listening TCP ports grouped by worktree with Terminal / Open / Stop actions. Built from `git worktree list`, `lsof` and `ps` in one mod; no change is proposed.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mod), hot-reloaded by Herdr; no TypeScript or bundler

**Primary Dependencies**: `gpui-kit`, `gpui-base`, `herdr` mod API (`exec`, `spaces`, `terminals`, `panes`, `run`, `theme`, `home`); external tools `git`, `lsof`, `ps`, `open`, `kill`

**Storage**: none for ports (live scan, in-memory only); the same mod also reads/writes files under `projects/<repo>/` for other tabs

**Testing**: none; gate is `herdr-app check mods/project-settings` plus manual scenarios

**Target Platform**: Herdr desktop app on macOS (Linux where `lsof` exists)

**Project Type**: desktop-app mod (page in the layout's `content` stack)

**Performance Goals**: refresh every 3 s on the Ports tab without blocking render; project rescan every 5 s

**Constraints**: `render()` must not notify; work via `cx.spawn`; timers via `cx.timer`; one scan at a time

**Scale/Scope**: a handful of worktrees and tens of listeners per project

## Constitution Check

- I. Shipped mods read-only: PASS. `project-settings` is a personal mod; no shipped mod or generated `.d.ts` touched.
- II. Single source in `lib/`: PASS. The Ports tab uses no shared `lib/` file; `lib/space-folder.js` is not used because the project list is derived from every space's folder, not from the focused terminal (see research).
- III. Plain JS and `herdr-app check`: PASS. No build or test setup; check is the gate and `projects/` errors are not involved.
- IV. Runtime conventions: PASS. Scans run in `cx.spawn` and notify on completion; `cx.timer.every` for both refreshes; no `setTimeout`; `render()` is pure. Note: `refreshPorts` calls `cx.notify()` to show "Reloading…" before spawning, from a timer/click handler, not from render.
- V. Consistent panel UI: N/A with a note. Project Settings is a content page, not one of the five right-side panels, so it uses its own local `link` chips rather than `lib/panel-ui.js`.
- VI. Documentation tracks behaviour: PASS. `docs/mods/project-settings.md` describes the Ports tab; update it with any behaviour change.

No violations; Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/010-port-manager/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code (repository root)

```text
mods/project-settings/
├── main.js              # loadPorts(), refreshPorts(), portsView(), gotoTerminal(), scan(), pick()
├── mod.json
├── chevron-left.svg
├── gpui-kit.d.ts        # generated, do not edit
└── jsconfig.json        # generated
layouts/tiendvd-layout.json   # block "project-settings" in the content stack
mods/my-chrome/main.js        # sidebar entry "Project Settings" toggling the page
docs/mods/project-settings.md # behaviour notes
```

**Structure Decision**: single mod, single file; ports logic lives beside the other Project Settings tabs. No other mod handles ports.

## Complexity Tracking

None.

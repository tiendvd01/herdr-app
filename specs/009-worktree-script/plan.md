# Implementation Plan: Worktree Script

**Branch**: `009-worktree-script` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-worktree-script/spec.md`

## Summary

Per-project shell script, edited in Project Settings and run once by the status bar mod in every new worktree created under `~/.herdr/worktrees/`. This plan records the as-built design; no code change is proposed.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) gpui-kit mods loaded and hot-reloaded by Herdr; no TypeScript

**Primary Dependencies**: `gpui-kit`, `gpui-base` (`EditorState`, `Editor`, `InputState`), `herdr` API (`spaces`, `exec`, `readTextFile`, `writeTextFile`, `notify`, `run`, `home`, `localStorage`), system `git` and `sh`

**Storage**: file `~/.config/herdr-app/projects/<repo>/post-create.sh` (gitignored); `localStorage` key `ps.done`

**Testing**: none; gate is `herdr-app check mods/<name>`, `.error` files, `herdr-app status`, `herdr-app shot`

**Target Platform**: Herdr desktop app on macOS/Linux

**Project Type**: desktop-app mods (no build)

**Performance Goals**: runner polls every 3 s without overlap; editor stays responsive

**Constraints**: `render()` must not call `cx.notify()`; use `cx.spawn`/`cx.timer`; no timeouts on the script itself

**Scale/Scope**: a handful of projects, tens of worktrees; handled list capped at 200

## Constitution Check

- **I. Shipped mods read-only**: PASS. `my-worktree` is a clone of shipped `worktree`; `project-settings`, `project-scripts` and `status-usage` are personal mods; no shipped mod or generated file edited.
- **II. Single source in `lib/`**: PARTIAL. `my-worktree/space-folder.js` is a synced copy. The `slug` function and script template are duplicated in `project-settings`, `project-scripts` and `status-usage/postscripts.js` (they are not shared panel code); drift is a known risk noted in research.md, not a violation of the copy rule.
- **III. Plain JS and `herdr-app check`**: PASS. No build or tests; the quickstart runs the check per mod.
- **IV. Runtime conventions**: PASS. Work is in `cx.spawn`; the runner uses `cx.timer.every`, no `setTimeout`/`setInterval`; no stored `cx`; state in `localStorage`.
- **V. Consistent panel UI**: N/A. Project Settings is a content page, not one of the five right-side panels; follows the focused folder only for choosing the first project.
- **VI. Documentation tracks behaviour**: PASS. `docs/mods/project-settings.md` and `docs/mods/status-usage.md` already describe it; update them with any change.

Re-check after design: no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-worktree-script/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code (repository root)

```text
mods/
├── project-settings/main.js      # Worktree script tab (editor, save, revert, legacy fallback)
├── project-scripts/main.js       # older standalone dialog, same file and template
├── my-worktree/main.js           # New worktree dialog (git worktree add, opens space)
├── my-worktree/space-folder.js   # synced copy of lib/space-folder.js
├── status-usage/main.js          # 3 s timer calling checkPostScripts
└── status-usage/postscripts.js   # runner: detect, resolve script, exec, toast, ps.done
projects/<repo>/post-create.sh    # runtime, gitignored
docs/mods/project-settings.md
docs/mods/status-usage.md
layouts/tiendvd-layout.json       # project-settings child of stack "content"
```

**Structure Decision**: no new code; documentation only.

## Complexity Tracking

No constitution violations to justify.

# Implementation Plan: One Shared Skills Folder per Project

**Branch**: `013-shared-project-skills` (no branch created) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-shared-project-skills/spec.md`

## Summary

Replace feature 012's per-launch folders with one folder per project, `projects/<slug>/claude-plugin/`, kept in sync in place from `skills.json` and the library (research D1): on every switch flip, on Refresh, and before every + menu launch. Launches always pass that same folder to `claude --plugin-dir`. Leftover `claude-sessions/<stamp>` folders are removed once no running process uses them (D3). Changes are confined to `lib/project-skills.js` and one call site plus a message in `mods/project-settings/main.js`; `mods/my-new-menu/main.js` keeps calling `launchArgs`.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), no build

**Primary Dependencies**: Herdr mod API (`exec`, `readTextFile`, `writeTextFile`); `find`, `ln`, `rm`, `rmdir`, `mkdir`, `ps` via `exec`; Claude CLI `--plugin-dir`

**Storage**: `projects/<slug>/skills.json` (unchanged), `projects/<slug>/claude-plugin/` (gitignored, derived)

**Testing**: `herdr-app check` + [quickstart.md](quickstart.md); Node run of the lib with a `herdr` shim (as in feature 012)

**Target Platform**: Herdr desktop app on macOS, local machine

**Project Type**: desktop app configuration (shared lib + two mods)

**Performance Goals**: a flip reaches the folder within 1 s (SC-002); launch sync ≤ feature 012's 137 ms

**Constraints**: never write to `skills/`, `mcp/`, `~/.claude/`; only symlinks in `claude-plugin/skills/` are removed

**Scale/Scope**: tens of skills per project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Shipped mods read-only | Only personal mods `project-settings`, `my-new-menu` (unchanged) touched. | Pass |
| II. Single source in `lib/` | Edit `lib/project-skills.js`, re-run `scripts/sync-github-lib.sh`. | Pass |
| III. Plain JS + `herdr-app check` | Both mods checked after the change. | Pass |
| IV. Runtime conventions | Sync runs in `cx.spawn`; nothing in `render`. | Pass |
| V. Consistent panel UI | N/A (Project Settings). | Pass |
| VI. Intent in CLAUDE.md and specs | Update CLAUDE.md's "Per-project Claude skills" note and mark feature 012's per-launch design as superseded. | Pass |
| Runtime state untracked | `projects/` gitignored. | Pass |

Re-check after Phase 1: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/013-shared-project-skills/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/project-skills-lib.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/project-skills.js                      # buildBundle/pruneBundles → syncBundle/pruneLegacy; launchArgs uses them
mods/project-settings/project-skills.js    # GENERATED copy
mods/my-new-menu/project-skills.js         # GENERATED copy
mods/project-settings/main.js              # flip + Refresh call syncBundle/pruneLegacy; new status text
CLAUDE.md                                  # describe the shared folder
specs/012-space-skillsets/                 # note in spec/research/data-model that 013 supersedes per-launch folders
```

**Structure Decision**: no new files besides this spec folder; same two consumers of the lib.

## Complexity Tracking

No violations.

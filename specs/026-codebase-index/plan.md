# Implementation Plan: Codebase index in Project Settings

**Branch**: `026-codebase-index` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-codebase-index/spec.md`

## Summary

Project Settings gets a fifth tab, **Index**, for the selected git project. It shows whether `<main>/.codegraph/` exists and, if so, CodeGraph's own status (files, symbols, last index). One button runs `codegraph init <main>` in the background; before that it adds `.codegraph/` to the repository's local exclude list (`git rev-parse --git-path info/exclude`, shared by every worktree) when no equivalent line is there. An indexed project whose folder is untracked but not excluded gets an "Ignore in git" action; an indexed project gets "Update index" (`codegraph sync <main>`). The logic is a new single source `lib/codegraph.js` (injected `exec` and file io, like `lib/ports.js`), synced into `mods/project-settings/`, unit tested with `node:test`.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit mods), Node built-in test runner for `lib/`

**Primary Dependencies**: `herdr` module (`exec`, `readTextFile`, `writeTextFile`, `home`); external `git` and `codegraph` (1.0.x) CLIs

**Storage**: Files only: `<repo>/.codegraph/` (made by CodeGraph), the repo's `info/exclude` (one appended line)

**Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` (new `tests/codegraph.test.mjs`); `herdr-app check mods/project-settings`; `herdr-app shot`

**Target Platform**: macOS Herdr desktop app

**Project Type**: Desktop app mod (personal mod `project-settings`)

**Performance Goals**: state shown < 2 s after opening the tab (`codegraph status --json` ~0.5 s on a 300-file repo)

**Constraints**: no `setTimeout`; work in `cx.spawn`; one run per project; never touch tracked files; index only on click

**Scale/Scope**: one new lib file (~100 lines), one new tab in one mod, one test file, one sync line

## Constitution Check

| Principle | Status |
|---|---|
| I. Shipped mods read-only | ✅ only `project-settings` (personal) changes |
| II. Single source in `lib/` | ✅ `lib/codegraph.js` + line in `scripts/sync-github-lib.sh` |
| III. Plain JS, `herdr-app check` gate | ✅ no build; check + unit tests run |
| IV. Runtime conventions | ✅ `cx.spawn` for status/init/sync, no timers added, no stored `cx` |
| V. One UI kit | ✅ tab chip and buttons via `kitBtn`, `card`-style box like other tabs |
| VI. Intent in CLAUDE.md/specs | ✅ short CLAUDE.md note + this spec folder |
| Operational: no probe mods, runtime state untracked | ✅ nothing new under `mods/` except the synced copy |

Post-design re-check: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/026-codebase-index/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/codegraph-lib.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/codegraph.js                    # NEW single source: state, exclude entry, init/sync runner
mods/project-settings/codegraph.js  # NEW synced copy (GENERATED header)
mods/project-settings/main.js       # Index tab
scripts/sync-github-lib.sh          # sync line for lib/codegraph.js
tests/codegraph.test.mjs            # NEW unit tests (fake exec + in-memory files)
CLAUDE.md                           # short note
```

**Structure Decision**: Same shape as Ports (spec 014): logic without a `herdr` import in `lib/`, the mod passes `exec` and file io in.

## Complexity Tracking

None.

# Implementation Plan: Project Claude Memory

**Branch**: `029-project-claude-memory` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-project-claude-memory/spec.md`

## Summary

Project Settings gets a sixth tab, **Memory**, for the selected git project. It reads Claude Code's
auto-memory folder of the project's main checkout (`~/.claude/projects/<slug>/memory/`, slug = path
with every non-alphanumeric character turned into `-`), lists the notes (name, description, type,
age) with a type filter and search, shows the selected note in an editor (Save with a stale check,
Revert, Delete with a confirm step that also drops its index lines), flags index problems (note not
in `MEMORY.md`, `MEMORY.md` line to a missing note) with one-click fixes, and adds new notes in
Claude's format plus one index line. The logic is a new single source `lib/claude-memory.js`
(injected `exec` + file io, no `herdr` import, like `lib/codegraph.js`), synced into
`mods/project-settings/`, unit tested with `node:test`.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit mods); Node built-in test runner for `lib/`

**Primary Dependencies**: `herdr` (`exec`, `readTextFile`, `writeTextFile`, `home`); gpui-base `EditorState`/`Editor`, `InputState`/`Input`; macOS `find` + `stat`, `rm`, `mkdir`

**Storage**: Files only: `~/.claude/projects/<slug>/memory/*.md` and its `MEMORY.md`

**Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` (new `tests/claude-memory.test.mjs`); `herdr-app check mods/project-settings`; `herdr-app shot`

**Target Platform**: macOS Herdr desktop app

**Project Type**: Desktop app mod (personal mod `project-settings`)

**Performance Goals**: list shown < 1 s for ~50 notes; on-disk change seen ≤ 5 s (SC-004 asks 10 s)

**Constraints**: no `setTimeout`; work in `cx.spawn`; poll only while the tab is shown; every write goes through a path check that keeps it inside the selected memory folder; `writeTextFile` with expected text for every update (stale = refused)

**Scale/Scope**: one new lib file (~150 lines), one new tab in one mod (~200 lines), one test file, one sync line, CLAUDE.md note

## Constitution Check

| Principle | Status |
|---|---|
| I. Shipped mods read-only | ✅ only `project-settings` (personal) changes |
| II. Single source in `lib/` | ✅ `lib/claude-memory.js` + line in `scripts/sync-github-lib.sh` |
| III. Plain JS, `herdr-app check` gate | ✅ no build; check + unit tests run |
| IV. Runtime conventions | ✅ reads/writes in `cx.spawn`; refresh via the mod's existing `cx.timer.every`; no stored `cx` |
| V. One UI kit | ✅ tab chip, buttons (`kitBtn` kinds), `card`, `inputFrame`-style search like the Skills tab |
| VI. Intent in CLAUDE.md/specs | ✅ CLAUDE.md note; the "nothing writes to `~/.claude/`" sentence narrowed to this tab's memory folder |
| Operational | ✅ no probe mods; no new tracked runtime state |

Post-design re-check: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/029-project-claude-memory/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/claude-memory-lib.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/claude-memory.js                    # NEW single source: folder, parse, index fixes, add/save/delete
mods/project-settings/claude-memory.js  # NEW synced copy (GENERATED header)
mods/project-settings/main.js           # Memory tab
scripts/sync-github-lib.sh              # sync line
tests/claude-memory.test.mjs            # NEW unit tests (fake exec + in-memory files)
CLAUDE.md                               # short note + narrowed ~/.claude rule
```

**Structure Decision**: same shape as Index (spec 026): logic without a `herdr` import in `lib/`, the
mod passes `exec`, `home` and file io in.

## Complexity Tracking

None.

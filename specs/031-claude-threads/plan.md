# Implementation Plan: Claude Threads per Space

**Branch**: `031-claude-threads` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/031-claude-threads/spec.md`

## Summary

A new personal panel mod `threads` joins the right side panel stack (`panel-body`, next to `files`
and `issues`) and gets a button in `my-tabs`' trailing button group. It lists Claude Code's saved
conversations of the space's current folder (`~/.claude/projects/<slug>/*.jsonl`), newest first,
marks the ones live in a Herdr terminal (Claude's `~/.claude/sessions/<pid>.json` matched to each
terminal's foreground pid), and resumes a thread with `tab.new` in the same space running
`claude … --resume <id>` (argv from `agentArgv`, so project skills stay attached). Logic lives in
`lib/claude-threads.js` (injected `exec`/io, unit tested), synced into the mod.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), Node 22 `node:test` for unit tests
**Primary Dependencies**: Herdr mod API (`herdr`, `gpui-kit`, `gpui-base`), `rg`, `find`/`stat`, `rm`
**Storage**: reads `~/.claude/projects/<slug>/*.jsonl` and `~/.claude/sessions/*.json`; per-space search text in the mod's `localStorage` (key `spaces`)
**Testing**: `tests/claude-threads.test.mjs` (fake `exec`), `herdr-app check mods/threads`, `herdr-app shot`
**Target Platform**: Herdr desktop app on macOS, local spaces only
**Project Type**: Herdr home-folder mod + shared lib
**Performance Goals**: list of 200 threads < 1 s on reopen (summary cache by mtime+size), < 3 s cold
**Constraints**: `render()` never notifies; `cx.timer` only; no writes except explicit delete
**Scale/Scope**: one mod (~350 lines), one lib (~200 lines), small edits to `my-tabs`, layout, sync script, CLAUDE.md

## Constitution Check

| Principle | Status |
|---|---|
| I. Shipped mods read-only | ✅ new mod `threads`; only personal `my-tabs` and personal layout edited |
| II. Single source in `lib/` | ✅ `lib/claude-threads.js` + sync entry; `project-skills.js`, `space-folder.js`, `panel-ui.js` synced copies added to the new mod |
| III. Plain JS, `herdr-app check` gate | ✅ no build; check + unit tests |
| IV. Runtime conventions | ✅ refresh via `cx.timer.every`, work in `cx.spawn`, per-space state in `localStorage` |
| V. Personal screens use the UI kit | ✅ `btn`, `inputFrame`, `emptyState`, `headerRow` |
| VI. Intent in CLAUDE.md and specs | ✅ CLAUDE.md gets a short Threads note |

No violations; re-checked after design: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/031-claude-threads/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/claude-threads-lib.md
└── tasks.md
```

### Source Code

```text
lib/claude-threads.js              # single source: list, summarize, live map, delete, filter
mods/threads/
├── mod.json                       # { "place": "none" } (panel stack child)
├── main.js                        # the panel view
├── claude-threads.js              # synced
├── project-skills.js              # synced
├── space-folder.js                # synced
└── panel-ui.js                    # synced
mods/my-tabs/main.js               # Threads button in the trailing group
layouts/tiendvd-layout.json        # panel-body gets a `threads` block
scripts/sync-github-lib.sh         # new copies
tests/claude-threads.test.mjs
```

**Structure Decision**: one new personal mod plus a lib file, following the Memory tab (spec 029) pattern.

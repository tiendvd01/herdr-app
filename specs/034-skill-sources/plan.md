# Implementation Plan: Skill sources outside the Herdr home folder

**Branch**: `034-skill-sources` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/034-skill-sources/spec.md`

## Summary

The skill library becomes an ordered list of sources: Herdr's own `.agents/skills/` (fixed, first) plus the folders listed in a new tracked file `skill-sources.json`. `scanLibrary()` in `lib/project-skills.js` scans every source, the first source wins a name, later ones are reported as hidden. Selections stay by name and `syncBundle()` links to whichever folder provides the name, so nothing else in the launch path changes. Project Settings › Skills shows the sources (add by path, remove, missing state) and each skill's source. A one-time Node script `scripts/move-skill-set.mjs` moves the SoraTech set to `~/Documents/SoraTech/skills-set/`, rewrites absolute paths inside it, registers the source and re-points every project's links.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), Node ≥ 20 for scripts and tests

**Primary Dependencies**: Herdr mod API (`exec`, `readTextFile`, `writeTextFile`, `home`); no packages

**Storage**: `skill-sources.json` at the repo root (tracked); per-project `projects/<slug>/skills.json` and `claude-plugin/` unchanged

**Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` with `tests/herdr-stub.mjs`; `herdr-app check mods/project-settings`; `herdr-app shot`

**Target Platform**: macOS, Herdr desktop app

**Project Type**: desktop-app configuration (mods + shared lib)

**Performance Goals**: library scan stays one `find` per source plus one `test -d` per extra source; Skills tab opens without visible delay with ~50 skills

**Constraints**: lib code never writes into any source folder, `mcp/` or `~/.claude/` (invariant of spec 012 widened to every source); only the move script moves skill folders

**Scale/Scope**: 1–3 sources, ~50 skills, 4 projects

## Constitution Check

| Principle | Status |
|---|---|
| I. Shipped mods read-only | ✅ only `project-settings` (personal) and `lib/` change |
| II. Single source in `lib/` | ✅ logic in `lib/project-skills.js`, synced by `scripts/sync-github-lib.sh` (consumers unchanged) |
| III. Plain JS, `herdr-app check` gate | ✅ no build; check `project-settings` and every mod that syncs `project-skills.js` |
| IV. Runtime conventions | ✅ add/remove run in `cx.spawn`, notify at the end |
| V. One UI kit | ✅ buttons via `btn`, input via the tab's existing `Input` look |
| VI. Intent in CLAUDE.md and specs | ✅ CLAUDE.md "Per-project Claude skills" updated |
| Runtime state untracked | ✅ `skill-sources.json` is setup (paths only), tracked like `keys.json` |

Post-design re-check: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/034-skill-sources/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── skill-sources.md
│   └── move-skill-set.md
└── tasks.md
```

### Source Code (repository root)

```text
skill-sources.json                 # new, tracked: extra skill source folders
lib/project-skills.js              # sources, multi-source scan, add/remove source
mods/*/project-skills.js           # synced copies (sync-github-lib.sh)
mods/project-settings/main.js      # Skills tab: sources block, source per skill, hidden rows
scripts/move-skill-set.mjs         # one-time move of the SoraTech set (exports helpers for tests)
tests/skill-sources.test.mjs       # scan/dedupe/missing/add validation + move helpers
CLAUDE.md                          # behaviour note
```

**Structure Decision**: same layout as specs 013/015: shared logic in `lib/`, UI in `project-settings`, one-time migration in `scripts/`.

## Complexity Tracking

None.

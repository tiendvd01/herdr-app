# Implementation Plan: Per-Project Skills for Claude Sessions

> **Superseded in part by `specs/013-shared-project-skills/`**: one shared folder per project (`projects/<slug>/claude-plugin/`) synced in place on every switch and launch; per-launch `claude-sessions/` folders are no longer made, and FR-010 (running sessions unaffected) is relaxed.

**Branch**: `012-space-skillsets` (no branch created) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-space-skillsets/spec.md`

## Summary

Keep a flat skill library (`skills/<name>/SKILL.md`) and MCP library (`mcp/<name>.json`) in the Herdr home folder. Project Settings gets a **Skills** tab where each project turns single skills and MCP servers on or off; the choice is saved in `projects/<slug>/skills.json`. The + menu gets a `Claude · N skills` row that builds a fresh plugin folder for that launch, `projects/<slug>/claude-sessions/<stamp>/` (symlinks to the library + generated `.mcp.json`), starts `claude --plugin-dir <that folder>`, and removes old launch folders no running process uses. A probe confirmed Claude loads symlinked skills and plugin MCP servers (research R1, R3). Shared logic lives once in `lib/project-skills.js`.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), no build

**Primary Dependencies**: Herdr mod API (`exec`, `readTextFile`, `writeTextFile`, `home`, `run`, `notify`, `shared`/`setShared`, `knownAgents`); `git`, `find`, `ln`, `rm`, `mkdir` via `exec`; Claude CLI `--plugin-dir`

**Storage**: files — `skills/`, `mcp/` (tracked), `projects/<slug>/skills.json` and `projects/<slug>/claude-sessions/<stamp>/` (gitignored)

**Testing**: `herdr-app check` per mod + manual scenarios in [quickstart.md](quickstart.md); no test suite (constitution III)

**Target Platform**: Herdr desktop app on macOS, local machine only

**Project Type**: desktop app configuration (mods + shared lib)

**Performance Goals**: Skills tab lists ≤ 200 skills in under 1 s; + menu launch adds < 300 ms for building the launch folder (target, not measured; see analysis G1)

**Constraints**: never write to `skills/`, `mcp/`, `~/.claude/`; no `cx.notify()` in `render()`; no timers other than `cx.timer`

**Scale/Scope**: tens of skills, a few MCP servers, a handful of projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Shipped mods read-only | Edits only `project-settings` and `my-new-menu` (personal mods). | Pass |
| II. Single source in `lib/` | Shared code in `lib/project-skills.js`, two consumers added to `scripts/sync-github-lib.sh`. | Pass |
| III. Plain JS + `herdr-app check` | No build; both mods checked; `.error` files checked. | Pass |
| IV. Runtime conventions | File work in `cx.spawn`; status refresh via `cx.timer` only if needed; no stored `cx`. | Pass |
| V. Consistent panel UI | Project Settings is not one of the five right panels; it keeps its own `btn`/tab style. | Pass (N/A) |
| VI. Intent lives in CLAUDE.md and specs (2.0.0) | Feature note in `CLAUDE.md`; detail in this `specs/012-space-skillsets/` folder. No `docs/`. | Pass |
| Operational: runtime state untracked | `projects/` already gitignored; `skills/`, `mcp/` tracked by design; MCP secrets only as `${VAR}`. | Pass |
| Operational: no probe mods | Probe ran in the scratchpad, no mod created. | Pass |

Re-check after Phase 1: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/012-space-skillsets/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── project-skills-lib.md
│   └── ui.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/project-skills.js                  # NEW single source (contract: contracts/project-skills-lib.md)
scripts/sync-github-lib.sh             # + sync lib/project-skills.js to the two mods
mods/project-settings/
├── main.js                            # + Skills tab, + reads shared "project-settings.tab"
└── project-skills.js                  # GENERATED copy
mods/my-new-menu/
├── main.js                            # + "Claude · N skills" / "Project skills…" row, height
└── project-skills.js                  # GENERATED copy
skills/                                # NEW library (empty, .gitkeep), tracked
mcp/                                   # NEW library (empty, .gitkeep), tracked
CLAUDE.md                              # mention skills/, mcp/ and the Skills tab
```

**Structure Decision**: one shared lib + two existing personal mods; no new mod (a new mod would be docked into the layout and adds nothing). `projectOf` in the lib reuses the slug rule of `project-settings`; `project-settings` switches its own `repoOf`/`slug` to the lib's to keep one rule.

## Implementation notes

1. **Lib first**: `projectOf`, `scanLibrary` (`find -L … -name SKILL.md`, frontmatter parse of `name`/`description`), `readSelection`/`writeSelection`, `buildBundle` (fresh `claude-sessions/<stamp>/` per launch: links, `plugin.json`, `.mcp.json`), `pruneBundles` (remove launch folders not named in `ps` args and older than 2 min), `launchArgs`, `estimate`.
2. **Skills tab**: state `this.lib`, `this.selSkills`, `this.query`, `this.skMsg`; load on tab open and on Refresh; switch → update → `writeSelection` in `cx.spawn` (no folder is built until a launch).
3. **+ menu**: in `init`'s spawn, after agents load: `projectOf(spaceFolder(space))` + `readSelection` + `scanLibrary` to compute N; row added after the agent list; height formula + `new-menu.rows` include it; click calls `launchArgs` then `tab.new`; `notify` for skipped.
4. **Open folder**: `exec("code", [libraryDir])` falling back to `open` (same as `open-vscode`).
5. **CLAUDE.md** note, then quickstart scenarios.

## Complexity Tracking

No violations.

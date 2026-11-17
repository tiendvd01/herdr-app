# Implementation Plan: Project skills in worktrees

**Branch**: `023-worktree-project-skills` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/023-worktree-project-skills/spec.md`

## Summary

Every place Herdr starts Claude in a folder should attach that folder's project skills, and worktrees already resolve to their main project (`projectOf` reads `--git-common-dir`). Today only the + menu does it. Plan: one shared helper `agentArgv(agent, folder, machine)` in `lib/project-skills.js` that turns an agent's argv into the skill-carrying argv (or leaves it alone), then use it in the New worktree dialog (`my-worktree`, new "Start Claude" chip), the git graph's "New Claude tab" (`git-graph`), and the reviewer's Ask (`reviewer`). The + menu keeps its own path (it already works in worktrees; only verified).

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) on Herdr's gpui-kit runtime

**Primary Dependencies**: `herdr` module (`exec`, `knownAgents`, `run`, `notify`, `spaces`), `gpui-kit`, `gpui-base`, `lib/project-skills.js`, `lib/panel-ui.js`

**Storage**: `projects/<slug>/skills.json` + `projects/<slug>/claude-plugin/` (existing, gitignored); dialog choice in the mod's `localStorage` (`my-worktree`, key `startClaude`)

**Testing**: no test setup; `herdr-app check mods/<name>`, `.error` files, manual quickstart scenarios

**Target Platform**: Herdr desktop app on macOS (local machine; remote spaces keep plain Claude)

**Project Type**: desktop app configuration (mods)

**Performance Goals**: skill set refresh before a start stays as today (< 1 s for a typical selection)

**Constraints**: no writes into project folders, worktrees, `.agents/skills/`, `mcp/`, `~/.claude/`; mod runtime rules (no `cx.notify()` in render, no timers)

**Scale/Scope**: 3 mods changed (`my-worktree`, `git-graph`, `reviewer`), 1 lib file, sync script, CLAUDE.md

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|-----------|--------|------|
| I. Shipped mods read-only | PASS | `my-worktree` is a clone; `reviewer` personal; `git-graph` is vendored upstream with a documented local patch, extended here and noted in CLAUDE.md. Shipped `worktree`, `new-menu`, `menu` untouched. |
| II. Single source in `lib/` | PASS | Helper lives in `lib/project-skills.js`; sync script gains `my-worktree`, `git-graph`, `reviewer` for it and `my-worktree` for `panel-ui.js`. |
| III. Plain JS + `herdr-app check` | PASS | Each touched mod checked. |
| IV. Runtime conventions | PASS | Async work in `cx.spawn`; no timers; no kept `cx`. |
| V. UI kit | PASS | The new dialog control is a `btn` chip from `lib/panel-ui.js`. |
| VI. Intent in CLAUDE.md/specs | PASS | CLAUDE.md Per-project skills section + git-graph patch note updated. |

Post-design re-check: PASS (no new violations).

## Project Structure

### Documentation (this feature)

```text
specs/023-worktree-project-skills/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── agent-argv.md
│   └── worktree-dialog.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/project-skills.js            # + agentArgv(agent, folder, machine)
scripts/sync-github-lib.sh       # project-skills → my-worktree, git-graph, reviewer; panel-ui → my-worktree
mods/my-worktree/main.js         # "Start Claude" chip; space.new with Claude argv
mods/git-graph/menu.js           # newTab with argv: resolve via agentArgv
mods/reviewer/dialog.js          # Ask: resolve via agentArgv
mods/my-new-menu/main.js         # unchanged (verify only)
CLAUDE.md                        # behaviour notes
```

**Structure Decision**: existing mods-and-lib layout; no new mod.

## Complexity Tracking

No violations.

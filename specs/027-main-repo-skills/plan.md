# Implementation Plan: Project skills for Claude started in the main checkout

**Branch**: `027-main-repo-skills` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

## Summary

The + menu (`mods/my-new-menu`) picks "with skills or plain" from `this.project` / `this.skillCount`,
filled by a spawned task after `knownAgents` resolves (`projectOf` + `readSelection` + `scanLibrary`).
A digit pressed in that window, or one queued in `this.pending` (launched before the lookup even
starts), takes the plain branch. Worktree launches go through `agentArgv` (spec 023), decided at launch
time, so they never miss.

Fix: every agent start from the + menu goes through one step, `agentTab(agent, space, folder)` in a new
mod-local file `mods/my-new-menu/launch.js`, which asks `agentArgv` at that moment and returns the
`tab.new` arguments. The menu keeps the popup open while the step runs (as git graph does), then closes
it and opens the tab. The menu's own project/count lookup and `launchSkills` / `withSkills` go away.

## Technical Context

**Language/Version**: plain JavaScript mods (gpui-kit), Node `node:test` for unit tests

**Primary Dependencies**: `lib/project-skills.js` (`agentArgv`, synced copy in the mod)

**Storage**: none new

**Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` with `tests/herdr-stub.mjs`; `herdr-app check mods/my-new-menu`

**Project Type**: desktop app home folder (mods)

**Scale/Scope**: one mod file + one new mod-local file + tests

## Constitution Check

- I Shipped mods read-only: `my-new-menu` is a personal clone ✅
- II Single source in `lib/`: `agentArgv` stays in `lib/project-skills.js`; `launch.js` is the mod's own unsynced logic file (allowed to be imported by tests) ✅
- Tests live in `tests/`, never under `mods/` ✅
- Intent in CLAUDE.md: update the + menu sentence in "Per-project Claude skills" ✅

## Design

- `mods/my-new-menu/launch.js`:
  `export async function agentTab(agent, space, folder)` → `{ name, space: space?.id, folder, argv }` where
  `argv = await agentArgv(agent, folder, space?.machine ?? null)`. Never throws (agentArgv never throws).
- `mods/my-new-menu/main.js`: `start(agent, cx)` sets `this.starting`, `cx.spawn` → `agentTab` →
  `closeOverlay` → `run("tab.new", tab)`. Used by click and digit; the queued digit (`this.pending`) runs
  the same step. Agent rows keep the popup open on click (`keepOpen`), disabled while starting.
  Init drops the project lookup (only `knownAgents` and the `new-menu.rows` size remain).
- Non-Claude agents: `agentArgv` returns `agent.run` at once, so behaviour is unchanged.

## Tests (`tests/project-skills.test.mjs`)

1. One project with a valid skill on: `agentArgv` for the main checkout `/p`, a subfolder `/p/src` and a
   worktree `/wt/p-feature` (git answers `/p/.git` for all) each return
   `["claude", "--plugin-dir", "/h/.config/herdr-app/projects/p/claude-plugin"]`.
2. `agentTab` from `mods/my-new-menu/launch.js` for Claude in the main checkout returns that argv and the
   folder/space; for another agent returns its plain `run`.

## Project Structure

```text
mods/my-new-menu/main.js     # launch through agentTab, no early lookup
mods/my-new-menu/launch.js   # new: agentTab
tests/project-skills.test.mjs
CLAUDE.md                    # + menu line
```

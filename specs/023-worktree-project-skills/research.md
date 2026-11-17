# Research: Project skills in worktrees

## R1. Do worktrees already map to their project?

- **Decision**: Yes; keep `projectOf(folder)` as the one resolver.
- **Rationale**: it reads `git rev-parse --path-format=absolute --git-common-dir`, which is the main repo's `.git` for every linked worktree, so slug, `skills.json` and `claude-plugin/` are shared. Project Settings and the + menu both call it with the focused terminal's folder, so US1 and US4 already hold; they become verification steps, not code.
- **Alternatives**: a per-worktree selection (rejected: spec asks for one per project).

## R2. Which entry points start Claude without skills?

Found by searching `argv` / `tab.new` / `space.new` in personal mods:

| Entry point | File | Today |
|-------------|------|-------|
| + menu Claude row | `mods/my-new-menu/main.js` | skills attached (`launchArgs`) |
| New worktree dialog | `mods/my-worktree/main.js` `create()` | `space.new` with only `props.argv` (no caller passes one), so a plain space |
| Open worktree (existing checkout) | `mods/my-worktree/main.js` `open()` | plain space; out of scope (spec: New only) |
| git graph row "New Claude tab" | `mods/git-graph/menu.js` `choose()` / `git.js` `repoMenu` | `a.run` plain |
| Reviewer Ask | `mods/reviewer/dialog.js` `start()` | first installed agent's `run` + `task` |
| Shipped `new-menu`, `menu`, `worktree` | shipped | not changed (constitution I) |

- **Decision**: cover the three gaps (dialog, git graph, reviewer) with one helper.

## R3. Shape of the shared helper

- **Decision**: `agentArgv(agent, folder, machine)` in `lib/project-skills.js` returns the argv to run: `agent.run` unchanged unless the agent is Claude, local, in a git project, and the project has ≥1 valid skill or MCP on; then `launchArgs(project, agent.run).argv`. Skipped items and failures produce one `notify` warning; failures fall back to `agent.run` (FR-008).
- **Rationale**: one place for the rule; callers stay one line. The + menu keeps `launchArgs` since it needs counts for its row label.
- **Alternatives**: copy the + menu logic into each mod (rejected: principle II).

## R4. Concurrent starts in one project

- **Decision**: one retry of `syncBundle` inside the helper when it throws.
- **Rationale**: links use `ln -sfn` (safe to repeat); `putFile` writes with an expected old text and can lose a race against a parallel start writing the same text. A second pass sees the text already in place and writes nothing.

## R5. Dialog control and its default

- **Decision**: a `btn` chip "Start Claude" (with ` · N skills` when the project has some on) between the branch list and the footer, shown only when Claude is installed for that machine. Clicking toggles; the value is kept in `localStorage` key `startClaude` (default on). On create: `space.new { folder, machine, tab: claude.name, argv }`.
- **Rationale**: `space.new` already takes `tab`/`argv` (AGENTS.md). A chip is the kit's on/off control. `props.argv`, when a caller gives one, still wins.
- **Alternatives**: a separate "Create + Claude" key (rejected: harder to discover; chip shows the state).

## R6. Post-create script ordering

- **Decision**: no change. `status-usage` runs `post-create.sh` when it sees the new space under `~/.herdr/worktrees/`, independent of its first tab. Claude may start before the script ends; documented in quickstart. Waiting for the script is out of scope.

## R7. git-graph upstream patch

- **Decision**: change only `menu.js` `choose()` for `newTab` with an `argv`: close the menu, then `cx.spawn` resolve `agentArgv` and run `tab.new`. The agent object needs `key`; pass `key: a.key` in `repoMenu`'s item. Add `project-skills.js` to the sync list. Note it in CLAUDE.md's git-graph patch line so it is re-applied after an upstream update.

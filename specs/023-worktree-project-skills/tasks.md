# Tasks: Project skills in worktrees

**Input**: Design documents from `/specs/023-worktree-project-skills/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: not requested (no test setup); each story ends with `herdr-app check` and a quickstart scenario.

## Phase 1: Setup

- [X] T001 Add `mods/my-worktree/project-skills.js`, `mods/git-graph/project-skills.js`, `mods/reviewer/project-skills.js` to the `lib/project-skills.js` sync line, and `mods/my-worktree/panel-ui.js` to the `lib/panel-ui.js` sync line, in `scripts/sync-github-lib.sh`

## Phase 2: Foundational

- [X] T002 Add `export async function agentArgv(agent, folder, machine)` to `lib/project-skills.js` per `contracts/agent-argv.md`: return `agent.run` when `agent?.key !== "claude"`, `machine` set, no folder, `projectOf` null, or 0 valid skills+MCP on; otherwise `launchArgs(project, agent.run)` (retry once if it throws, R4) and return its `argv ?? agent.run`; one `notify` warning "Skills skipped" listing skipped items, or "Project skills not attached" with the reason on failure; never throws (import `notify` from `herdr`)
- [X] T003 Run `scripts/sync-github-lib.sh` and confirm the new copies exist with the GENERATED header

## Phase 3: User Story 1 - + menu in an existing worktree (P1)

**Goal**: same skills in a worktree as in the main checkout via the + menu. **Independent test**: quickstart A.

- [X] T004 [US1] Verify `mods/my-new-menu/main.js` resolves the project with `projectOf(spaceFolder(space))` in a worktree space (row `Claude · N skills`, start carries `--plugin-dir projects/<slug>/claude-plugin`); no code change unless it differs; `herdr-app check mods/my-new-menu`

## Phase 4: User Story 2 - New worktree starts Claude with skills (P1)

**Goal**: dialog chip "Start Claude" creates the space with a skill-carrying Claude tab. **Independent test**: quickstart B.

- [X] T005 [US2] In `mods/my-worktree/main.js` `init`: read `localStorage.startClaude` in try/catch ("0" = off, missing = on); for `action: "new"` on a local or remote space load `knownAgents({ on: this.on })` in the spawned task, keep `this.claude` (installed `key === "claude"`), and for a local repo compute `this.skillCount` (valid selected skills+MCP via `projectOf`, `readSelection`, `scanLibrary`)
- [X] T006 [US2] In `mods/my-worktree/main.js` `render`: for `action: "new"` with a repo and `this.claude`, add a `btn("wt-claude", { kind: "chip", on: this.startClaude, label: this.skillCount ? \`Start Claude · ${this.skillCount} skills\` : "Start Claude", ... })` row above the footer (import `btn` from `./panel-ui.js`); toggle writes `localStorage.startClaude` in try/catch; footer hint `↵ create + Claude` when on
- [X] T007 [US2] In `mods/my-worktree/main.js` `create()`: when chip on, Claude known and no `props.argv`, call `space.new { folder: path, machine: this.on, tab: this.claude.name, argv: await agentArgv(this.claude, path, this.on) }`; otherwise keep today's call
- [X] T008 [US2] `herdr-app check mods/my-worktree`; `herdr-app do mod.open` the dialog is not possible with props, so open it from + › New worktree… and `herdr-app shot` to check the chip — check passed; screenshot not possible from the shell (`mod.open` takes no props), chip to be checked by hand

## Phase 5: User Story 3 - git graph and reviewer (P2)

**Goal**: other entry points attach skills. **Independent test**: quickstart C.

- [X] T009 [P] [US3] In `mods/git-graph/git.js` `repoMenu`: add `key: a.key` to the `newTab` action; in `mods/git-graph/menu.js` `choose()` for `newTab` with `argv`: close the menu, then `cx.spawn` → `argv = await agentArgv({ key: a.key, run: a.argv }, a.folder, null)` → `run("tab.new", { folder, name, argv })` (import from `./project-skills.js`)
- [X] T010 [P] [US3] In `mods/reviewer/dialog.js` `start()`: replace `argv: agent.run` with `argv: await agentArgv(agent, spaceFolder(space), space.machine)` (import `agentArgv` from `./project-skills.js`, `spaceFolder` from `./space-folder.js` if not already)
- [X] T011 [US3] `herdr-app check mods/git-graph` and `herdr-app check mods/reviewer`

## Phase 6: User Story 4 - shared selection (P3)

**Goal**: one selection per project from any checkout. **Independent test**: quickstart D.

- [X] T012 [US4] Verify `mods/project-settings/main.js` opens on the worktree's project (it uses `projectOf` on the focused terminal's folder); no code change unless it differs

## Phase 7: Polish

- [X] T013 Update CLAUDE.md: Per-project Claude skills section (worktrees share the project's set; entry points + menu, New worktree chip `startClaude`, git graph New Claude tab, reviewer Ask, all via `agentArgv`; spec 023) and the git-graph local patch line (adds `agentArgv` in `menu.js`/`git.js` and synced `project-skills.js`)
- [X] T014 Run `herdr-app status` and check all `.error` files; walk quickstart E (fallbacks, no new files in project folders)

## Dependencies

- T001 → T002 → T003 → all stories. US1 and US4 are verification only. US2 (T005→T006→T007→T008) and US3 (T009 ∥ T010 → T011) are independent of each other. Polish last.

## Parallel example

After T003: T005–T008 (my-worktree) in one stream, T009 and T010 in parallel in another.

## Implementation strategy

MVP = Phases 1–4 (helper + New worktree chip; + menu already works). Then US3, US4 checks, polish.

## Review fixes (2026-11-17)

- [X] T015 `agentArgv`: reads only `skills.json` to decide; nothing selected → plain without scanning or writing; otherwise one scan in `launchArgs` (no `enabledCount` pass)
- [X] T016 Reviewer Ask passes `folder` (the same `spaceFolder(space)` the skills were picked for) to `tab.new`
- [X] T017 New worktree dialog: a caller's `props.tab` wins over Start Claude, like `props.argv`
- [X] T018 `tests/project-skills.test.mjs` (plain cases, no writes when nothing selected, one library scan)

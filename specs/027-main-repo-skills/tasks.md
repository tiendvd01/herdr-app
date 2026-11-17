# Tasks: Project skills for Claude started in the main checkout

**Input**: [spec.md](spec.md), [plan.md](plan.md)

**Tests**: requested (unit tests in `tests/project-skills.test.mjs`).

## Phase 1: Tests first

- [X] T001 [US2] In `tests/project-skills.test.mjs` extend `world()` with a library holding one valid skill and add a test: `agentArgv` for main checkout `/p`, subfolder `/p/src` and worktree `/wt/p-feature` all return the same `--plugin-dir /h/.config/herdr-app/projects/p/claude-plugin`
- [X] T002 [US1] Add a test for `agentTab` (`mods/my-new-menu/launch.js`): Claude in the main checkout gets the skills folder; another agent gets its plain `run`; space id and folder are passed through

## Phase 2: Fix

- [X] T003 [US1] Create `mods/my-new-menu/launch.js` with `agentTab(agent, space, folder)` over `agentArgv`
- [X] T004 [US1] In `mods/my-new-menu/main.js` replace `launchSkills` / `withSkills` / init project lookup with one `start(agent, cx)` through `agentTab`, used by click, digit and the queued digit; popup stays open until the tab command is ready
- [X] T005 Run the unit tests and `herdr-app check mods/my-new-menu`; check `herdr-app status` has no mod error

## Phase 3: Polish

- [X] T006 Update the + menu sentence in `CLAUDE.md` (decision at launch time via `agentTab`/`agentArgv`, spec 027)
- [ ] T007 Live check: open the + menu in a main checkout with skills on, press 1 at once; the new Claude's command line has `--plugin-dir`

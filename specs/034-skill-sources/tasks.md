# Tasks: Skill sources outside the Herdr home folder

**Input**: `specs/034-skill-sources/` (plan, spec, research, data-model, contracts, quickstart)

## Phase 1: Setup

- [X] T001 Add `skill-sources.json` contract helpers `sourcesFile()`, `expand(path)`, `readSources()`, `writeSources(list, expectedRaw)` in lib/project-skills.js (format `{ "version": 1, "sources": [...] }`, missing/bad file = no sources)

## Phase 2: Foundational

- [X] T002 Make `scanLibrary()` in lib/project-skills.js scan every source (own `.agents/skills/` first, then `skill-sources.json` order; `test -d` per extra source → `missing`), tag each skill with `source`, put later same-name skills in `lib.hidden` with `hiddenBy`, return `{ sources, skills, hidden, mcp, global }`
- [X] T003 Update the header comment/invariant in lib/project-skills.js (no writes into any source folder) and run `bash scripts/sync-github-lib.sh`

## Phase 3: User Story 1 - Turn on skills from another folder (P1)

**Independent test**: a registered folder's skill is listed, switches on, and is linked into the project's plugin folder.

- [X] T004 [P] [US1] Tests in tests/skill-sources.test.mjs: two sources, first wins, hidden list, missing source, syncBundle links the skill from the extra source
- [X] T005 [US1] Skills tab in mods/project-settings/main.js: show each skill's source (dim tag when more than one source), list hidden skills with "hidden by <source>" and no switch

## Phase 4: User Story 2 - Move the SoraTech set (P1)

**Independent test**: quickstart steps 2–6.

- [X] T006 [US2] Write scripts/move-skill-set.mjs per contracts/move-skill-set.md (TEAM_MATCH, rewritePaths exported; preflight clash exit 2; `--dry-run`; move; rewrite paths; register source; relink projects; idempotent)
- [X] T007 [P] [US2] Tests for `TEAM_MATCH` and `rewritePaths` in tests/skill-sources.test.mjs
- [X] T008 [US2] Run dry run, then the move; verify quickstart steps 3–6

## Phase 5: User Story 3 - Manage sources from the Skills tab (P2)

**Independent test**: quickstart step 8.

- [X] T009 [US3] `addSource(path)` / `removeSource(path)` in lib/project-skills.js (realpath compare, refuse missing / duplicate / inside own library; remove reports projects whose selection names any of its skills); sync
- [X] T010 [P] [US3] Tests for addSource/removeSource validation in tests/skill-sources.test.mjs
- [X] T011 [US3] Sources block in mods/project-settings/main.js: rows (path, count or missing, Open, remove for extra sources), path input + Add, messages

## Phase 6: Polish

- [X] T012 Update CLAUDE.md "Per-project Claude skills" (sources, `skill-sources.json`, move script, team set location)
- [X] T013 `herdr-app check` for project-settings, my-new-menu, my-worktree, git-graph, reviewer, threads; run all unit tests; `node scripts/check-dialog-frames.mjs`; `herdr-app shot` of the Skills tab

## Dependencies

T001 → T002 → (US1, US2, US3). US2's relink relies on T002 only for the launch path; the script itself is independent. T009 before T011.

## Parallel

T004, T007, T010 (same test file, write together); T006 alongside T005.

## MVP

US1 + US2 (the move needs the multi-source scan, or team skills vanish from projects).

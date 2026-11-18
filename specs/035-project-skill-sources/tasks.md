# Tasks: Skill folders per project

## Phase 1: Foundational
- [X] T001 Per-project sources in lib/project-skills.js: readSelection/writeSelection v2, scanLibrary(project), syncBundle/enabledCount pass project, addSource/removeSource(project, …), drop skill-sources.json helpers; run scripts/sync-github-lib.sh

## Phase 2: User Story 1 (P1)
- [X] T002 [US1] mods/project-settings/main.js: loadSkills uses scanLibrary(r), this.sk keeps sources, editSource passes the project, remove message uses `on`
- [X] T003 [P] [US1] tests/skill-sources.test.mjs: per-project scan, writeSelection keeps sources, add/remove per project

## Phase 3: User Story 2 (P1)
- [X] T004 [US2] scripts/project-skill-sources.mjs one-time carry-over (exports `carryOver(selection, sourcesWithNames, ownNames)` for tests); step 4 of scripts/move-skill-set.mjs per project
- [X] T005 [US2] Run carry-over, verify quickstart 2–3

## Phase 4: Polish
- [X] T006 CLAUDE.md skill sources paragraph; spec 034 note superseded
- [X] T007 herdr-app check (6 mods), unit tests, screenshot

## Phase 5: Convergence
- [X] T008 In editSource (mods/project-settings/main.js), when addSource/removeSource fails, reload the tab with loadSkills(r) as the switch save does, so a settings file changed elsewhere refuses the save and the tab reloads, per spec Edge Cases (partial)
- [X] T009 Fix the header comment of scripts/move-skill-set.mjs: it still says the folder is listed in skill-sources.json; say it is added to each project's skills.json that has a team skill on, per FR-007 (partial)

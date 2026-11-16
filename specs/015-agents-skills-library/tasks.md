---
description: "Task list for 015 — skill library moves to .agents/skills/"
---

# Tasks: Skill Library Moves to `.agents/skills/`

**Input**: Design documents from `specs/015-agents-skills-library/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: no automated tests (constitution III: no test setup). Verification = `herdr-app check` + the runnable checks in `quickstart.md`, listed as explicit tasks.

**Organization**: by user story. Both P1 stories touch the same move; US2 (move existing data) runs before US1 (install with `-a universal`) because US1 can only be verified once the library lives in `.agents/skills/`.

`<app>` = `/Users/tiendvd/.config/herdr-app`. All commands run from `<app>`. Snapshots go to `$TMPDIR/015/`, never into the repo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2, US3 from spec.md

---

## Phase 1: Setup (snapshot of the current state)

**Purpose**: record what must be identical after the move (SC-001, SC-002).

- [X] T001 Snapshot the library: `mkdir -p $TMPDIR/015 && ls -A skills | sort > $TMPDIR/015/lib-before.txt && (cd skills && find . -type f -exec shasum {} + | sort -k2) > $TMPDIR/015/sum-before.txt`; confirm 41 skill folders + `.gitkeep`
- [X] T002 [P] Snapshot selections and links: `for f in projects/*/skills.json; do echo "$f"; cat "$f"; done > $TMPDIR/015/sel-before.txt` and `for l in projects/*/claude-plugin/skills/*; do echo "$l -> $(readlink "$l")"; done > $TMPDIR/015/links-before.txt`
- [X] T003 [P] Confirm `.agents/skills/` is empty or absent (`ls -A .agents/skills`) and record `git status --short` to `$TMPDIR/015/git-before.txt`

---

## Phase 2: Foundational (blocking)

**Purpose**: code that every story relies on. Safe to land before the move: the lib is not loaded directly, and the UI fix is correct for both layouts.

- [X] T004 In `lib/project-skills.js` change `skillsDir()` from `` `${appDir()}/skills` `` to `` `${appDir()}/.agents/skills` ``; leave `mcpDir()` (`${appDir()}/mcp`) and `globalSkillsDir()` unchanged. Do NOT run `scripts/sync-github-lib.sh` yet (the migration script runs it, T010).
- [X] T005 In `lib/project-skills.js` rewrite the header comment: library is `~/.config/herdr-app/.agents/skills/<name>/SKILL.md` (hand-made or installed with `npx skills add <repo> -a universal`) and `mcp/<name>.json`; invariant becomes "nothing here ever writes under .agents/skills/, mcp/ or ~/.claude/".
- [X] T006 [P] In `mods/project-settings/main.js`: add `mcpDir` to the `./project-skills.js` import (line 9); replace both `skillsDir().replace(home(), "~").replace(/skills$/, "mcp")` (path line ~267 and empty-state hint ~277) with `mcpDir().replace(home(), "~")`. Run `herdr-app check mods/project-settings` (the current synced copy already exports `mcpDir`).

**Checkpoint**: lib edited, Skills tab text no longer derives the MCP path from the skills path.

---

## Phase 3: User Story 2 — Existing skills move without breaking anything (Priority: P1) 🎯 MVP

**Goal**: all 41 folders live in `.agents/skills/`, `skills/` is gone, every project keeps its skills, running sessions recover.

**Independent Test**: quickstart §2, §3 and §6: same names and checksums, selections identical, 0 broken links, all links point into `/.agents/skills/`, second run is a no-op.

- [X] T007 [US2] Create `scripts/migrate-agents-skills.mjs` (dependency-free Node ESM, only `node:fs`, `node:path`, `node:os`, `node:child_process`), app dir = `path.join(os.homedir(), ".config/herdr-app")`, flags `--dry-run` and `--sync`. Preflight per `contracts/migrate-script.md`: list entries of `skills/` (including dot-files) and `.agents/skills/`; any name in both → print `clash: a, b, ...`, exit 2, change nothing. Missing/empty `skills/` → print `nothing to move` and continue to link repair.
- [X] T008 [US2] In `scripts/migrate-agents-skills.mjs` implement the move: `mkdirSync(".agents/skills", {recursive:true})`, `renameSync` each entry of `skills/` into it (same filesystem; on any error print the path and exit 1), then `rmdirSync("skills")`. In `--dry-run` only print `move <name>`.
- [X] T009 [US2] In `scripts/migrate-agents-skills.mjs` implement link repair for every `projects/*/claude-plugin/skills/` (data-model.md table): for each entry use `lstatSync`; not a symlink → keep; target `=== <app>/skills/<n>` → if `<app>/.agents/skills/<n>/SKILL.md` exists, replace with a link to exactly `<app>/.agents/skills/<n>` (absolute, no trailing slash, the same string `listSkills` builds) else `unlinkSync`; any other target → keep. Then read `projects/<slug>/skills.json` (read only, never write) and, for each name in `skills` matching `^[A-Za-z0-9._-]+$` with no entry yet and `<app>/.agents/skills/<name>/SKILL.md` present, create the link. Print `<slug>: relinked N, removed N, created N, kept N`.
- [X] T010 [US2] In `scripts/migrate-agents-skills.mjs` after link repair: if something was moved or `--sync` was given, run `bash scripts/sync-github-lib.sh` (cwd `<app>`, inherit stdio); exit 1 if it fails. Final line `moved N skills`. Exit 0.
- [X] T011 [US2] Dry run: `node scripts/migrate-agents-skills.mjs --dry-run`; expect 42 `move` lines (41 + `.gitkeep`), per-project counts matching `$TMPDIR/015/links-before.txt`, no clash, and `git status --short` identical to `$TMPDIR/015/git-before.txt`.
- [X] T012 [US2] Real run: `node scripts/migrate-agents-skills.mjs`; expect exit 0 and `moved 42`. Then `herdr-app check mods/project-settings`, `herdr-app check mods/my-new-menu`, and check `herdr-app status` has no mod errors.
- [X] T013 [US2] Verify library (quickstart §2): `test ! -e skills`; `diff <(ls -A .agents/skills | sort) $TMPDIR/015/lib-before.txt`; checksum diff against `$TMPDIR/015/sum-before.txt` empty; `git add -A skills .agents/skills && git diff --cached -M --stat` shows renames only.
- [X] T014 [US2] Verify projects (quickstart §3): selections diff against `$TMPDIR/015/sel-before.txt` empty; `find projects/*/claude-plugin/skills -type l ! -exec test -e {} \; -print` prints nothing; every `readlink` contains `/.agents/skills/`. In a Claude session started before the run (167-yahagi-sekisan), confirm a `delivery-*` skill still loads.
- [X] T015 [US2] Repeat run (quickstart §6): `node scripts/migrate-agents-skills.mjs` prints `nothing to move` and `relinked 0, removed 0, created 0` for every project; `git status --short` unchanged by it.

**Checkpoint**: data migrated; Herdr reads the new folder.

---

## Phase 4: User Story 1 — Install a skill with the standard target (Priority: P1)

**Goal**: `npx skills add <repo> -a universal` from `<app>` lands in the library and shows in the Skills tab.

**Independent Test**: quickstart §4.

- [X] T016 [US1] `npx skills ls -a universal` lists the 6 ponytail skills under `./.agents/skills/`; `npx skills update -p -y` reports them up to date; `skills-lock.json` unchanged (`git diff skills-lock.json` empty vs before the run).
- [X] T017 [US1] Install a throwaway skill: `npx skills add <small public skill repo> -s <one skill> -a universal -y`; confirm only `.agents/skills/<name>/` and `skills-lock.json` changed (`git status --short`); Refresh the Skills tab, the skill is listed and switchable; switch it on for a project, start `Claude · N skills` from the + menu, the skill is available.
- [X] T018 [US1] Clean up: switch it off, `npx skills remove <name> -y` (no `-a`; `-a universal` silently does nothing, research R2); confirm folder and lock entry are gone and `git status --short` is back to the state after T015.

---

## Phase 5: User Story 3 — Settings and notes point at the new place (Priority: P2)

**Goal**: every visible path and note names `.agents/skills/`.

**Independent Test**: quickstart §5.

- [ ] T019 [US3] `herdr-app shot $TMPDIR/015/skills-tab.png` with Project Settings › Skills open: path line reads `~/.config/herdr-app/.agents/skills  ·  ~/.config/herdr-app/mcp`; press "Open folder", `.agents/skills` opens.
- [X] T020 [P] [US3] Update `CLAUDE.md` "Per-project Claude skills": library is `.agents/skills/<name>/SKILL.md`; install third-party skills from the repo root with `npx skills add <owner/repo> -s '*' -a universal -y`; update with `npx skills update`; remove with `npx skills remove <name> -y` (without `-a`); `skills-lock.json` records CLI installs; delete the `openclaw` sentence. Keep "Nothing ever writes to `.agents/skills/`, `mcp/` or `~/.claude/`" (Herdr itself), and mention `scripts/migrate-agents-skills.mjs` + spec 015 in one line.
- [X] T021 [US3] `rg -n 'herdr-app/skills|openclaw|replace\(/skills' CLAUDE.md lib mods/project-settings mods/my-new-menu scripts` returns nothing (specs 012/013 are history and excluded).

---

## Phase 6: Polish & cross-cutting

- [X] T022 [P] Add a line under spec 015 in `specs/015-agents-skills-library/spec.md` Status: `Implemented` once T001–T021 pass.
- [ ] T023 Final `herdr-app status` (no errors), check `*.error` files are absent, and stage: `git add -A skills .agents/skills skills-lock.json lib/project-skills.js mods/project-settings mods/my-new-menu scripts/migrate-agents-skills.mjs CLAUDE.md specs/015-agents-skills-library`. Commit only when the user asks (terse message, no AI trailer).

---

## Dependencies & execution order

- Phase 1 → Phase 2 → Phase 3 (US2) → Phase 4 (US1) and Phase 5 (US3) → Phase 6.
- T004/T005 are the same file: do in order. T006 is a different file: parallel with T004/T005.
- T007 → T008 → T009 → T010 (same file), then T011 → T012 → T013/T014 → T015.
- US1 (Phase 4) needs T012 done. US3: T020 can be written any time after T012; T019 needs T012.

## Parallel examples

```text
Phase 1:  T002 and T003 alongside T001
Phase 2:  T006 (mods/project-settings/main.js) alongside T004+T005 (lib/project-skills.js)
After T015: Phase 4 (T016–T018) alongside T020 (CLAUDE.md)
```

## Implementation strategy

- **MVP** = Phases 1–3 (US2): the library is in `.agents/skills/`, nothing lost, Herdr reads it. From that point `-a universal` already works; Phase 4 only proves it.
- Then US1 verification, then US3 notes and polish.
- Rollback before commit (by hand, not automated): `mv .agents/skills skills`, `git checkout lib/project-skills.js`, `bash scripts/sync-github-lib.sh`, then open each project in Project Settings › Skills so `syncBundle` re-points its links. The clash check and `--dry-run` are the safety net before that is ever needed.

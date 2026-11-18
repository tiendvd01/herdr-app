# Implementation Plan: Skill folders per project

**Branch**: `035-project-skill-sources` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

## Summary

Move the extra-source list from the shared `skill-sources.json` (spec 034) into each project's `projects/<slug>/skills.json` (`version: 2`, new `sources` array, order kept). `scanLibrary(project)` reads that project's sources; `syncBundle`, `enabledCount` and the Skills tab pass the project. `addSource(project, path)` / `removeSource(project, path)` edit that file through the same raw-text guard as the switches, and `writeSelection` always writes all three lists. A one-time script `scripts/project-skill-sources.mjs` carries the shared list over and deletes the file; `scripts/move-skill-set.mjs` step 4 writes per project.

## Technical Context

**Language/Version**: plain JavaScript mods, Node ≥ 20 scripts/tests · **Dependencies**: Herdr mod API · **Storage**: `projects/<slug>/skills.json` (untracked) · **Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'`, `herdr-app check`, `herdr-app shot` · **Scale**: 4 projects, 1–3 sources each

## Constitution Check

I ✅ (personal mods + lib only) · II ✅ (`lib/project-skills.js`, synced) · III ✅ (check the 6 users) · IV ✅ (spawn + notify) · V ✅ (kit buttons) · VI ✅ (CLAUDE.md paragraph rewritten) · runtime state untracked ✅ (the list now lives in `projects/`). No violations.

## Project Structure

```text
lib/project-skills.js                 # per-project sources in skills.json; scanLibrary(project)
mods/project-settings/main.js         # pass the project; keep sources in this.sk
scripts/project-skill-sources.mjs     # one-time carry-over, deletes skill-sources.json
scripts/move-skill-set.mjs            # step 4 per project
tests/skill-sources.test.mjs          # per-project scan, add/remove, carry-over helper
CLAUDE.md
```

## Complexity Tracking

None.

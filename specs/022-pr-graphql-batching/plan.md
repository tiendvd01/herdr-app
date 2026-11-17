# Implementation Plan: Fewer, combined GitHub calls for pull requests

**Branch**: `022-pr-graphql-batching` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

## Summary

`lib/pr-gh.js` gets three combined GraphQL reads that replace per-item calls: `discoverMany` (all due agent
branches of one repo, aliases `b0..b19`), `readPrs` (full data of up to 10 PRs of one repo, aliases
`p0..p9`, replacing `gh pr view` + `THREADS_QUERY`), and `counts` (Open and Merged `issueCount` of a view in
one query, replacing the REST `search/issues` count). The tracker (`pr-flow`) and the inbox call them per
repo; discovery only tracks, and the round's batched refresh fetches the new PRs. Partial answers
(`data` + `errors`, `gh` exit 1) are read per alias. See [research.md](research.md).

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods)
**Primary Dependencies**: `gh api graphql`, `lib/gh-account.js` (account per repo owner)
**Storage**: in memory (tracker live/count maps, inbox snapshots); unchanged
**Testing**: `herdr-app check mods/pr-flow`, `mods/inbox`; shape diff and timing per [quickstart.md](quickstart.md)
**Target Platform**: Herdr desktop app (macOS)
**Project Type**: mods in a config repo
**Performance Goals**: lookups 1 call per repo per round; PR reads ⌈K/10⌉ calls per repo; counts 1 call per view
**Constraints**: same data shape as `gh pr view --json PR_FIELDS`; variables only, never interpolated values
**Scale/Scope**: `lib/pr-gh.js` (synced to `mods/pr-flow/gh.js`, `mods/inbox/gh.js`), `mods/pr-flow/tracker.js`, `mods/inbox/main.js`, CLAUDE.md

## Constitution Check

- I. Only personal mods and `lib/` touched ✅
- II. All gh changes in `lib/pr-gh.js`, copies via `scripts/sync-github-lib.sh` ✅
- III. `herdr-app check` for pr-flow and inbox ✅
- IV. Work stays in the existing spawned tracker/inbox rounds; no timers, no notify in render ✅
- V. No UI change ✅
- VI. CLAUDE.md pr-flow note updated (counts no longer REST; one read per PR, batched) ✅

Post-design re-check: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/022-pr-graphql-batching/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/pr-gh.md   # new/changed functions of lib/pr-gh.js
```

### Source Code (repository root)

```text
lib/pr-gh.js                  # graphql helper, discoverMany, readPrs, counts; drop discover*, count, fetchPr
mods/pr-flow/gh.js            # synced copy
mods/inbox/gh.js              # synced copy
mods/pr-flow/tracker.js       # batched discovery, refreshMany, shared counts
mods/inbox/main.js            # pollPrs uses readPrs per repo
```

**Structure Decision**: no new files in mods; all request logic stays in the shared library.

## Complexity Tracking

None.

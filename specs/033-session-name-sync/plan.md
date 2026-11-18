# Implementation Plan: One session name in agents, tabs and Sessions

**Branch**: `033-session-name-sync` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/033-session-name-sync/spec.md`

## Summary

Widen spec 032's shared rule (`lib/tab-title.js`) so it also takes the session's saved titles (rename title, Claude's title, first message) and use it in three places: tab bar (`my-tabs`), agents sidebar (`my-agents`) and Sessions dialog (`processes`). `my-agents` already reads every Claude transcript every 5 s; it keeps doing that, but publishes what it reads once as shared `session.titles` (address → titles) instead of keeping a private `first` map. The other two screens read that shared value. Chosen tab name wins everywhere; a tab name that equals any title the session ever had (the Threads panel names tabs that way) counts as automatic.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mods), Node `node:test` for `lib/` tests

**Primary Dependencies**: Herdr mod API (`panes()`, `spaces()`, `agents()`, `shared`/`setShared`), `jq` (already used by `my-agents`)

**Storage**: none new; shared in-memory value `session.titles`

**Testing**: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'`, `herdr-app check mods/<name>`, `herdr-app shot`

**Target Platform**: Herdr desktop app on macOS

**Project Type**: desktop-app config (mods)

**Performance Goals**: one transcript read per session per 5 s round (as today); `setShared` only when the map changes (it re-renders every mod)

**Constraints**: constitution IV (no `cx.notify()` in render, `cx.timer` only); display-only, never rename stored tabs

**Scale/Scope**: a handful of sessions; 1 lib file, 3 mods, 1 test file

## Constitution Check

- I. Shipped mods read-only: only personal mods (`my-tabs`, `my-agents`, `processes`) change. ✅
- II. Single source in `lib/`: rule stays in `lib/tab-title.js`; `processes` added as a consumer in `scripts/sync-github-lib.sh`. ✅
- III. `herdr-app check` gate for the three mods. ✅
- IV. Transcript reads stay in `my-agents`' `cx.spawn` on its 5 s timer; `setShared` from inside the spawn, only on change. ✅
- V. No new buttons/surfaces. ✅
- VI. CLAUDE.md "Tab labels" note updated to spec 033. ✅

Re-check after design: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/033-session-name-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/session-name.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/tab-title.js              # rule + transcript title parsing (single source)
tests/tab-title.test.mjs      # extended
scripts/sync-github-lib.sh    # + mods/processes/tab-title.js
mods/my-agents/main.js        # publishes session.titles; label via tabTitle with titles
mods/my-tabs/main.js          # tabTitle with shared titles
mods/processes/main.js        # row name + "where" line via the rule
```

**Structure Decision**: extend the existing spec 032 file rather than add a new lib; the rule is the same concept with one more input.

## Complexity Tracking

None.

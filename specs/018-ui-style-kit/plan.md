# Implementation Plan: Shared UI style kit

**Branch**: `018-ui-style-kit` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-ui-style-kit/spec.md`

## Summary

Extend `lib/panel-ui.js` into the app's UI kit: tokens (`UI`: heights, radius, text, space, motion), one
button core `btn()` with kinds (primary, secondary, ghost, danger, icon, chip, back), sizes (sm/md/lg) and
states (hover, pressed, on, disabled, busy, attention) using native motion (hover highlight layer with an
opacity transition, press opacity dip, spinner, pulse ring), and surfaces (`dialogFrame`, `card`,
`inputFrame`, `divider`, `sectionTitle`, `headerRow`, `emptyState`). Old exports (`iconButton`, `backButton`,
`chip`, `button`, `textButton`, `icon`) become thin wrappers over `btn()`. A `ui-gallery` dialog mod shows
everything. Personal screens adopt the kit; the sync script gains the new consumers.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit), no build

**Primary Dependencies**: gpui-kit / gpui-base elements; `transition`, `active`, `hover`, `loop`, `spin`

**Storage**: none (gallery demo toggles in memory)

**Testing**: `herdr-app check`, `herdr-app shot` of the gallery and each adopted screen

**Target Platform**: Herdr desktop, macOS

**Project Type**: Desktop app configuration (mods + shared lib)

**Performance Goals**: no timers; all motion native and only while drawn

**Constraints**: constitution II (edit `lib/`, run sync), IV (no timers for motion), I (no shipped mod edits)

**Scale/Scope**: `lib/panel-ui.js`, `scripts/sync-github-lib.sh`, new `mods/ui-gallery/`, adopters `my-tabs`, `project-settings`, `inbox`, `status-usage`, `branch-switch`, dialog frames in `reviewer`, `pr-flow`, `project-settings`; CLAUDE.md + constitution V wording

## Constitution Check

| Principle | Status | Note |
|---|---|---|
| I. Shipped mods read-only | PASS | Only personal mods and the synced copy in `git-graph`. |
| II. Single source in `lib/` | PASS | Kit is `lib/panel-ui.js`; new consumers added to the sync script. |
| III. Check gate | PASS | Check every consumer after sync. |
| IV. Runtime conventions | PASS | Motion is native (`transition`/`loop`/`spin`); no timers. |
| V. Consistent Panel UI | PASS (amend wording) | The rule now covers all screens; constitution V and CLAUDE.md updated (MINOR 2.1.0: rule widened to all screens). |
| VI. CLAUDE.md | PASS | Rule added. |

## Project Structure

```text
specs/018-ui-style-kit/      plan.md research.md quickstart.md contracts/ui-kit.md tasks.md
lib/panel-ui.js              # the kit
scripts/sync-github-lib.sh   # + ui-gallery, my-tabs, project-settings, inbox, status-usage, branch-switch
mods/ui-gallery/             # mod.json (place none, dialog), main.js
mods/{my-tabs,project-settings,inbox,status-usage,branch-switch}/main.js   # adopt
mods/{reviewer,pr-flow}/main.js                                             # dialogFrame
```

**Structure Decision**: extend the existing shared file; wrappers keep old callers working.

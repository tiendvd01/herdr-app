# Implementation Plan: Project Settings Section Sidebar

**Branch**: `030-settings-section-sidebar` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

## Summary

In `mods/project-settings/main.js` `render()`, replace the project title block and the chip row with a
second fixed column (≈200 px, `t.chrome` background, `border_r`) between the projects column and the
content. Its top shows the project name + short path; below, one row per section (label + muted
hint), highlighted with `t.selected` like project rows. Clicking a row runs the same handler the chip
ran (wrapped in `memGuard`). One `SECTIONS` table holds key, label and hint. The projects column keeps
its `rounded_l(9)`; the new column has square corners (it is inside the frame).

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit) · **Dependencies**: gpui-base `v_flex`/`h_flex`, kit `dialogFrame`
**Testing**: `herdr-app check mods/project-settings`, `node scripts/check-dialog-frames.mjs`, unit tests unchanged, `herdr-app shot`
**Project Type**: personal mod · **Scale**: one file, ~40 lines changed

## Constitution Check

| Principle | Status |
|---|---|
| I. Shipped mods read-only | ✅ personal mod only |
| II. Single source in `lib/` | ✅ no shared logic involved |
| III. `herdr-app check` gate | ✅ |
| IV. Runtime conventions | ✅ no new async work |
| V. One UI kit | ✅ list rows keep their own look (kit rule: "List rows, tabs and tree items keep their own look"); dialog frame unchanged |
| VI. Intent in CLAUDE.md/specs | ✅ one CLAUDE.md line |

## Project Structure

```text
mods/project-settings/main.js   # SECTIONS table, second column, content header removed
CLAUDE.md                       # mention the section sidebar
```

No research, data model or contracts needed (layout change only); quickstart = the checks above plus a shot of each section.

## Complexity Tracking

None.

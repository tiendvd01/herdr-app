# Implementation Plan: Session resource totals (used / machine total)

**Branch**: `028-session-resource-totals` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

## Summary

The Sessions dialog (mod `processes`) header gets machine totals next to the sessions' CPU and RAM: `CPU 120% / 800% · RAM 2.1 / 16 GB`. Totals are read once per dialog open with `sysctl -n hw.ncpu hw.memsize` in `cx.spawn`; a figure at ≥ 80% of its total is drawn in `t.blocked`. Logic (parse + format) lives in a small file of the mod, `mods/processes/totals.js`, tested with `node:test`.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit mod), Node `node:test` for unit tests
**Primary Dependencies**: Herdr `exec`, `theme`; macOS `sysctl`
**Storage**: none (totals kept on the view instance)
**Testing**: `tests/session-totals.test.mjs` (fake `exec`), `herdr-app check mods/processes`, `herdr-app shot`
**Target Platform**: macOS (Herdr desktop app)
**Project Type**: desktop app mod
**Performance Goals**: no visible delay; one `sysctl` call per open, off the render path
**Constraints**: constitution IV (no notify in render, spawn work), V (kit look; header text only)
**Scale/Scope**: one mod, header line only

## Constitution Check

- I Shipped mods read-only: `processes` is personal. ✅
- II Single source in `lib/`: logic is used by one mod only, so it stays in the mod (`mods/processes/totals.js`, its own unsynced file, importable by tests per CLAUDE.md). ✅
- III `herdr-app check` gate: run on `mods/processes`. ✅
- IV Runtime: `sysctl` in `cx.spawn` from `init`, `cx.notify()` on finish. ✅
- V UI kit: text only, theme colors. ✅
- VI Intent: CLAUDE.md note + this spec folder. ✅

Post-design re-check: unchanged, all pass.

## Project Structure

```text
specs/028-session-resource-totals/  spec, plan, research, data-model, quickstart, tasks
mods/processes/totals.js            readTotals(exec), share(used,total), cpuText, ramText
mods/processes/main.js              init: read totals; render: header line uses them
tests/session-totals.test.mjs       parse + format + fallback
```

**Structure Decision**: one new logic file in the mod plus a test; no `lib/` file, no sync change.

# Tasks: Session resource totals (used / machine total)

**Input**: specs/028-session-resource-totals/ (spec, plan, research, data-model, quickstart)

## Phase 1: Setup

(none — existing mod)

## Phase 2: Foundational

- [x] T001 Create `mods/processes/totals.js`: `readTotals(exec)` runs `sysctl -n hw.ncpu hw.memsize`, returns `{ cores, mem }` (bytes) or `null` ("Both must be positive integers or the whole value is null"); `cpuText(cpu, totals)` → `CPU x%` or `CPU x% / N%`; `ramText(rss, totals)` → `RAM y` or `RAM y / Z GB`; `hot(used, total)` → `used / total ≥ 0.8`
- [x] T002 [P] Unit tests in `tests/session-totals.test.mjs` (fake `exec`: good output, failure, garbage; formatting with and without totals; 80% threshold)

## Phase 3: User Story 1 - See how much of the machine the sessions use (P1) 🎯 MVP

**Independent test**: open the dialog; header totals match `sysctl`; used figures as before.

- [x] T003 [US1] In `mods/processes/main.js` `init`: `cx.spawn` → `this.totals = await readTotals(exec)` then `cx.notify()`
- [x] T004 [US1] In `mods/processes/main.js` `render`: header line built from `cpuText`/`ramText`, each figure in `t.blocked` when `hot(...)`, else `t.muted`

## Phase 4: Polish

- [x] T005 Run unit tests, `herdr-app check mods/processes`, open the dialog and `herdr-app shot` (quickstart.md)
- [x] T006 Short note in `CLAUDE.md` (Processes dialog header shows used / machine totals, `mods/processes/totals.js`, spec 028)

- [x] T007 [US1] Progress bars under CPU and RAM in `mods/processes/main.js` (`meter()`, `pct()` in `totals.js`, test in `tests/session-totals.test.mjs`)
- [x] T008 [US1] Whole-machine use: `machine: { cpu, mem }` in `collect()` of `mods/status-usage/procs.js` (`vmUsed()`), shown in `meter()` of `mods/processes/main.js`; tests `tests/machine-usage.test.mjs`, `agents`/`terminals` in `tests/herdr-stub.mjs`

## Dependencies

T001 → T002, T003 → T004 → T005 → T006. T002 can run beside T003/T004.

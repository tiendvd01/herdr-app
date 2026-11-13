# Implementation Plan: Sessions Manager (as-built)

**Branch**: `001-sessions-manager` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-sessions-manager/spec.md`

## Summary

Document and keep stable the existing Sessions dialog (mod `processes`): a read-mostly view over the
`procs` snapshot that `status-usage` publishes every 4 seconds, with per-session actions (go, restart,
stop all, delete) and per-process pause/resume. No new behaviour is planned; this plan records the
current design so later changes can be checked against it.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) running in Herdr's gpui-kit mod runtime

**Primary Dependencies**: `gpui-kit`, `gpui-base`, `herdr` host API (`shared`, `setShared`, `exec`, `run`, `terminals`, `closeOverlay`, `props`, `notify`); shell tools `ps`, `kill`, `nohup`, `hc`

**Storage**: Shared in-memory state (`procs`, `procs.refresh`, `procs.killed`); restart log at `data/restart-session.log`; no localStorage

**Testing**: None (no test setup by design). Gate is `herdr-app check mods/processes` plus manual scenarios in quickstart.md

**Target Platform**: macOS and Linux desktop with Herdr

**Project Type**: desktop-app mod (hot-reloaded)

**Performance Goals**: Data at most ~5 s old; refresh request picked up within ~0.5 s

**Constraints**: `render()` must not call `cx.notify()`; no timers; poll must recover if a previous one hangs over 20 s (`ps` timeout 10 s)

**Scale/Scope**: Tens of sessions, each with a handful of child processes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|-----------|--------|------|
| I. Shipped mods read-only | Pass | `processes` is a personal mod; it reads svg from `workspace-chrome` but does not edit it |
| II. Single source in `lib/` | Pass | Mod imports nothing from `lib/`; data collection lives in `status-usage/procs.js` |
| III. Plain JS and `herdr-app check` | Pass | Verified via quickstart |
| IV. Runtime conventions | Pass | `render()` only reads; work uses `cx.spawn`; spinner uses `.spin`; the 8 s spinner wait uses `exec("sleep")` rather than a timer (worth revisiting for `cx.timer`) |
| V. Consistent panel UI | N/A | A dialog, not one of the five right-side panels; has its own button style |
| VI. Documentation tracks behaviour | Pass | `docs/mods/processes.md` exists and matches the code |

Post-design re-check: no change; one follow-up noted under Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-sessions-manager/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

No `contracts/`: the only interface is the shared `procs` snapshot, described in data-model.md.

### Source Code (repository root)

```text
mods/processes/
├── main.js            # the dialog (View class)
├── mod.json
└── *.svg              # rotate-cw, arrow-up-right, square, trash icons
mods/status-usage/
├── main.js            # polls and writes shared "procs"; opens the dialog from the badge
└── procs.js           # collect(): ps snapshot -> sessions
docs/mods/processes.md
```

**Structure Decision**: Keep the dialog as one mod reading shared state; collection stays in
`status-usage` so the badge and dialog share one poll.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `exec("sleep", ["8"])` as a spinner delay (soft tension with Principle IV) | Spinner must outlast the detached job's start without tracking it | `cx.timer` would be the cleaner fit; not changed here because this plan is documentation-only |

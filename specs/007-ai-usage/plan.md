# Implementation Plan: AI Usage Limits in the Status Bar

**Branch**: `007-ai-usage` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-ai-usage/spec.md` (as-built; no code change planned)

## Summary

Document the existing "Used" section of the status bar: a periodic and hover-triggered fetch of `quota-axi`, a compact per-provider figure, and a hover card with per-window bars and reset times. Any future change stays inside the `status-usage` mod and its doc.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit mod, ES modules) loaded and hot-reloaded by Herdr

**Primary Dependencies**: `gpui-kit`, `gpui-base` (`HoverCard`, `h_flex`, `v_flex`), `herdr` API (`exec`, `theme`, `spaces`); external CLI `quota-axi`

**Storage**: N/A (in-memory view state only)

**Testing**: None in repo; gate is `herdr-app check mods/status-usage` plus manual scenarios

**Target Platform**: Herdr desktop app on macOS (login shell `/bin/zsh`)

**Project Type**: desktop-app mod

**Performance Goals**: fetch must never block rendering; at most one fetch in flight; refresh every 120 s, hover refresh throttled to 30 s

**Constraints**: no `cx.notify()` in `render()`; no `setTimeout`/`setInterval` (use `cx.timer`); no kept `cx`

**Scale/Scope**: 5 providers, a handful of windows each; one file section (`refresh`, `card`, `render` in `mods/status-usage/main.js`)

## Constitution Check

- I. Shipped mods read-only: PASS. `status-usage` is a personal clone of `workspace-status` (`mod.json` `cloned_from`).
- II. Single source in `lib/`: PASS. Feature uses no shared `lib/` file; nothing copied.
- III. Plain JS + `herdr-app check`: PASS. No build or test tooling.
- IV. Runtime conventions: PASS. Fetch via `cx.spawn` then `cx.notify()`; periodic work via `cx.timer.every`; no timers or kept `cx`; no animation. State is view-local (not per-space), which is acceptable as usage is account-wide.
- V. Consistent panel UI: N/A. The status bar and hover card are not one of the five panels.
- VI. Documentation tracks behaviour: PASS with note. `docs/mods/status-usage.md` hover throttle ("5 s / 30 s") differs from code (30 s); fix the doc on the next edit.

Re-check after design: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/007-ai-usage/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code (repository root)

```text
mods/status-usage/
├── main.js            # refresh(), card(), render() usage section
├── mod.json           # place: none, cloned from workspace-status
└── gpui-kit.d.ts      # generated, do not edit
icons/                 # <provider>.svg (claude, codex, copilot, antigravity, gemini)
docs/mods/status-usage.md   # behaviour notes to update on change
```

**Structure Decision**: single mod, single file section; no new files. No `contracts/` since the only external interface is the read-only JSON of `quota-axi`, described in data-model.md.

## Complexity Tracking

No violations.

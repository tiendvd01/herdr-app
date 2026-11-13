# Implementation Plan: Inbox (as-built)

**Branch**: `011-inbox` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-inbox/spec.md`

## Summary

A single gpui-kit mod (`inbox`) in the left sidebar. Agent events come from the app's `agents()` on each render; PR events come from background polling of the user's open PRs through the shared `gh` code, diffed against persisted snapshots. Entries persist in `localStorage`; clicks use app commands and a shared `pr-flow.goto` value.

## Technical Context

**Language/Version**: Plain JavaScript (gpui-kit mod, ES modules), hot-reloaded by Herdr

**Primary Dependencies**: `gpui-kit`, `gpui-base`, `herdr` (`agents`, `spaces`, `run`, `exec`, `notify`, `setShared`, `nextCommand`, `layout`, `theme`); `gh` CLI; synced copies of `lib/pr-gh.js`, `lib/pr-status.js`, `lib/github.js`, `lib/gh-account.js`, `lib/space-folder.js`

**Storage**: `localStorage` keys `items` and `prs`; shared value `pr-flow.goto` (write only)

**Testing**: None (repo has no test setup); gate is `herdr-app check mods/inbox`

**Target Platform**: Herdr desktop app (macOS)

**Project Type**: desktop-app mod

**Performance Goals**: polls never block render; at most 4 concurrent PR reads

**Constraints**: no `cx.notify()` in `render()`; no `setTimeout`/`setInterval`; read-only against GitHub

**Scale/Scope**: tens of open PRs, up to 150 entries; one mod of about 400 lines

## Constitution Check

- I. Shipped mods read-only: PASS. `inbox` is a personal mod; no shipped mod is edited.
- II. Single source in `lib/`: PASS. PR code is synced from `lib/` via `scripts/sync-github-lib.sh`; the copies in `mods/inbox/` are not hand-edited.
- III. Plain JS + `herdr-app check`: PASS. No build or tests; check and `.error` files are the gate.
- IV. Runtime conventions: PASS. Agent tracking runs in `render()` without notify; fetching is in `cx.spawn`, then `cx.notify()`; `cx.timer.every` used for polling and the age refresh; no `cx` kept.
- V. Consistent panel UI: N/A / PASS. Inbox is a sidebar mod, not one of the five right-side panels; it uses its own small icons.
- VI. Documentation tracks behaviour: PASS. `docs/mods/inbox.md` exists and matches; update it with any behaviour change.

## Project Structure

### Documentation (this feature)

```text
specs/011-inbox/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (repository root)

```text
mods/inbox/
├── mod.json            # place: none, title: Inbox
├── main.js             # the View: tracking, polling, click, drawing
├── gh.js               # synced from lib/pr-gh.js
├── status.js           # synced from lib/pr-status.js
├── github.js           # synced from lib/github.js
├── gh-account.js       # synced from lib/gh-account.js
├── space-folder.js     # synced from lib/space-folder.js
└── *.svg               # inbox, pull-request, check, cross, comment, x, chevrons, terminal
lib/pr-gh.js
lib/pr-status.js
scripts/sync-github-lib.sh
docs/mods/inbox.md
mods/pr-flow/main.js    # consumes pr-flow.goto
```

**Structure Decision**: one self-contained mod plus shared `lib/` code; no new layout nodes beyond the sidebar block.

## Complexity Tracking

No constitution violations.

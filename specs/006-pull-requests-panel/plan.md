# Implementation Plan: Pull requests panel

**Branch**: `006-pull-requests-panel` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-pull-requests-panel/spec.md`

## Summary

As-built documentation of the Pull requests panel: a right-side mod (`pr-flow`) that tracks PRs of the focused folder's repo through the `gh` CLI, derives one status fact per PR, shows detail, post-merge Actions runs, diffs with inline comments in a viewer pane, and an optional guarded merge. Shared `gh` and status code lives in `lib/` and is synced into mods.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules), gpui-kit, hot-reloaded by Herdr

**Primary Dependencies**: `herdr` and `gpui-kit`/`gpui-base` APIs; `gh` and `git` CLIs

**Storage**: localStorage (`tracked`, `spaces`, `lang`); shared state (`pr-flow.view`, `pr-flow.lang`, `pr-flow.goto`)

**Testing**: None; `herdr-app check mods/pr-flow` is the gate, plus manual scenarios in quickstart.md

**Target Platform**: Herdr desktop app (macOS), local or remote machines

**Project Type**: desktop-app mod (panel plus viewer pane of the same mod)

**Performance Goals**: UI refresh on a 5 s tick; PR poll 30 s default (10 s floor); settled PRs 4x slower; concurrency 4

**Constraints**: no `cx.notify()` in `render()`; no `setTimeout`/`setInterval`; `gh` token never in process list; reads only except comment and merge

**Scale/Scope**: tens of PRs per repo, 20 per page

## Constitution Check

- **I. Shipped mods read-only**: PASS. `pr-flow` is a personal mod; no shipped mod or generated file is edited.
- **II. Single source in `lib/`**: PASS. `gh.js`, `status.js`, `github.js`, `gh-account.js`, `panel-ui.js`, `space-folder.js` in the mod are generated copies from `lib/` via `scripts/sync-github-lib.sh`. `flow.js`, `diff.js`, `present.js`, `tracker.js`, `text.js`, `i18n.js` are pr-flow-only.
- **III. Plain JS and check gate**: PASS. No build or tests; gate is `herdr-app check mods/pr-flow` and `.error` files.
- **IV. Runtime conventions**: PASS. State work is spawned (`cx.spawn`), timers use `cx.timer.every/after`, spinner uses `.spin`, per-space state in localStorage `spaces`. `render()` calls `syncSpace`/`takeGoto` that only spawn and never notify.
- **V. Consistent panel UI**: PASS. Buttons come from `panel-ui.js`; panel follows the focused terminal's folder via `space-folder.js`. Local icon SVGs (`check`, `merge`, `spinner`, ...) sit in the mod folder.
- **VI. Documentation tracks behaviour**: GAP. `docs/mods/pr-flow.md` does not exist; `docs/gh-account.md` covers accounts. Follow-up: add the mod note. Also the header comment "only reads" is stale (comment and merge write).

No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/006-pull-requests-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

No `contracts/`: the only external interface is the `gh` CLI, whose output is read as-is.

### Source Code (repository root)

```text
mods/pr-flow/
├── mod.json            # place right, size 340, title "Pull requests"
├── main.js             # View: list, detail, viewer pane, settings, keys, merge
├── tracker.js          # discovery, polling, cards, pruning
├── present.js          # facts, steps, flow rows for display
├── flow.js             # post-merge Actions run state
├── diff.js             # diff parsing, comment targets, inline threads
├── text.js, i18n.js    # sanitising, durations, strings
├── gh.js, status.js, github.js, gh-account.js, panel-ui.js, space-folder.js  # generated copies
└── *.svg               # local icons
lib/pr-gh.js            # -> mods/pr-flow/gh.js, mods/inbox/gh.js
lib/pr-status.js        # -> mods/pr-flow/status.js, mods/inbox/status.js
lib/github.js, lib/gh-account.js, lib/panel-ui.js, lib/space-folder.js
scripts/sync-github-lib.sh
layouts/tiendvd-layout.json   # block id "prs" in the right panel-body stack
docs/gh-account.md
```

**Structure Decision**: one mod folder that renders both the panel and (with `screen: "viewer"`) the diff/log pane; shared GitHub logic in `lib/` and synced.

## Complexity Tracking

None.

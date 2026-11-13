# Implementation Plan: Changes Panel (as-built)

**Branch**: `003-changes-panel` (documentation only) | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-changes-panel/spec.md`

## Summary

Document the existing Changes panel (mod `reviewer`): a dialog that shows the focused repo's diff by scope, lets the user comment inline and send the review (or a question) to the space's agent, and commit. The plan records how the current plain JavaScript mod meets the constitution; no code change is proposed.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules) on the Herdr gpui-kit runtime; no TypeScript.

**Primary Dependencies**: `gpui-kit`, `gpui-base`, `herdr` host API (`exec`, `watchFolder`, `readTextFile`, `shared`/`setShared`, `openOverlay`, `hc`, `run`), the `git` CLI, and `hc send`.

**Storage**: `localStorage` key `view`; shared keys `reviewer.drafts`, `reviewer.scope`, `reviewer.sent`, `reviewer.open`, `reviewer.dialog`; the repo itself (Commit). See [data-model.md](./data-model.md).

**Testing**: None; gate is `herdr-app check mods/reviewer`, the `.error` files, `herdr-app status`, `herdr-app shot`, and the manual scenarios in [quickstart.md](./quickstart.md).

**Target Platform**: Herdr desktop app on macOS (local and remote-machine repos).

**Project Type**: Herdr mod (desktop UI dialog); `place: none`, overlay dialog at 90% of the window.

**Performance Goals**: first diff in about 2 s; refresh on file change and every 10 s without blocking the UI (virtual list for diff rows).

**Constraints**: automatic git reads take no index lock; no `setTimeout`/`setInterval`; at most 1,000 files, 1,500 diff lines, 4,000 chars per line.

**Scale/Scope**: five source files (about 1,200 lines), one overlay kind plus the send dialog.

## Constitution Check

*GATE: passed before research; re-checked after design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Shipped mods read-only, clone to customize | Pass | `mod.json` has `cloned_from: changes 0.1.8`; the layout and keys call `mod.open:reviewer`. |
| II. Single source in `lib/`, synced copies | Pass | `panel-ui.js` and `space-folder.js` in the mod are GENERATED headers, listed in `scripts/sync-github-lib.sh`. Mod-only code (`highlight.js`, `palette.js`, `ask.js`, `dialog.js`) has no second consumer. |
| III. Plain JS and `herdr-app check` gate | Pass | No build or tests; `herdr-app check mods/reviewer` is the gate. |
| IV. Runtime conventions | Pass | Work via `cx.spawn`, refresh timer via `cx.timer.every`, no `setTimeout`/`setInterval`; `render()` only schedules a refresh with `cx.timer.after` / `refresh()`, which spawns. A `cx` is passed in, never stored. Per-repo state is keyed by machine, root and scope. |
| V. Consistent panel UI | Pass | Buttons and icons come from the synced `panel-ui.js`; the panel follows the focused folder through `space-folder.js`. One local asset (`comment.svg`, `changes.svg`) is used for the comment bubble. |
| VI. Documentation tracks behaviour | Pass | `docs/mods/reviewer.md` describes scopes, comments, keys, props and open requests. |

Gaps noted (not violations): `docs/mods/reviewer.md` does not mention the Commit field, Neovim edit icon or per-scope drafts' migration detail; update it when next touched. `render()` calls `refresh()` when the folder changes, which is guarded and spawns the work.

## Project Structure

### Documentation (this feature)

```text
specs/003-changes-panel/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No `contracts/`: the only external interface is the shared `reviewer.open` key, described in data-model.md. `tasks.md` is not created (as-built documentation).

### Source Code (repository root)

```text
mods/reviewer/
├── mod.json            # overlay dialog 0.9 x 0.9, cloned_from changes 0.1.8
├── main.js             # panel: git reads, scopes, diff list, comments, commit, send hand-off
├── dialog.js           # send dialog (agent pick, busy confirm, start agent)
├── ask.js              # opens the send dialog, or sends directly with hc send
├── highlight.js        # tokenizer and language detection
├── palette.js          # diff colour palettes
├── panel-ui.js         # GENERATED from lib/panel-ui.js
├── space-folder.js     # GENERATED from lib/space-folder.js
├── comment.svg
├── changes.svg
└── gpui-kit.d.ts       # generated, not edited
docs/mods/reviewer.md
keys.json               # cmd-shift-g -> mod.open:reviewer
scripts/sync-github-lib.sh
lib/panel-ui.js
lib/space-folder.js
```

**Structure Decision**: a single mod folder serves both the panel and the send overlay; shared UI and folder logic stay in `lib/`.

## Complexity Tracking

No constitution violations to justify.

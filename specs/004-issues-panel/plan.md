# Implementation Plan: Issues Panel (as-built)

**Branch**: `004-issues-panel` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-issues-panel/spec.md`

## Summary

Read-only GitHub issues browser in the right column. Repo comes from the focused terminal's folder; lists and issues are fetched with `gh` (account chosen by repo owner), cached stale-while-revalidate, rendered as markdown with mermaid and highlighted code, with an optional on-demand AI summary. Documents existing code; no new work.

## Technical Context

**Language/Version**: Plain JavaScript (ES modules, gpui-kit) loaded and hot-reloaded by Herdr
**Primary Dependencies**: gpui-kit / gpui-base, `herdr` API, `gh` CLI, `mmdc`, `claude` CLI, vendored highlight.js 11.11.1
**Storage**: `localStorage` key `spaces`; `data/issues/cache.json`; `~/.herdr/issue-summaries/`; `mods/issues/.diagrams/`
**Testing**: None; gate is `herdr-app check mods/issues`, `.error` files, `herdr-app status`, `herdr-app shot`
**Target Platform**: Herdr desktop app on macOS
**Project Type**: Herdr mod (desktop panel)
**Performance Goals**: Instant display from cache; lists of 30 rows per page in a virtual list
**Constraints**: no `cx.notify()` in render; no timers except `cx.timer`; `gh` timeout 30 s; mods import only from their own folder
**Scale/Scope**: one mod (`main.js` about 460 lines) plus synced copies of shared lib files

## Constitution Check

- I. Shipped mods read-only: PASS. `issues` is a personal mod.
- II. Single source in `lib/`: PASS. `gh-account.js`, `markdown.js`, `code-highlight.js`, `diagram-viewer.js`, `panel-ui.js`, `space-folder.js`, `hljs.js` are synced copies listed in `scripts/sync-github-lib.sh`.
- III. Plain JS and `herdr-app check`: PASS.
- IV. Runtime conventions: PASS. Work is spawned then notified; `cx.timer` for the cache save and width debounce; native `.spin`; per-space state in `localStorage`. (Summary polling uses `exec sleep` inside a spawned task, not a timer.)
- V. Consistent panel UI: PASS. Buttons from `panel-ui.js`; follows focused folder.
- VI. Documentation tracks behaviour: PASS with note. `docs/mods/issues.md` is current; its "up to 100 issues" line differs from the 30-per-page paging section and should be reconciled.

## Project Structure

### Documentation (this feature)

```text
specs/004-issues-panel/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No `contracts/`: the only external interface is the `gh` CLI.

### Source Code (repository root)

```text
mods/issues/
├── main.js            # the panel
├── mod.json
├── gh-account.js      # synced from lib/
├── markdown.js        # synced from lib/
├── code-highlight.js  # synced from lib/
├── hljs.js            # synced from lib/vendor/highlight.min.js
├── diagram-viewer.js  # synced from lib/
├── panel-ui.js        # synced from lib/
└── space-folder.js    # synced from lib/
lib/{github.js,gh-account.js,markdown.js,...}
scripts/sync-github-lib.sh
docs/mods/issues.md
docs/gh-account.md
layouts/tiendvd-layout.json   # block "issues" in panel-body
```

**Structure Decision**: single mod folder; shared code kept in `lib/` and copied by script.

## Complexity Tracking

No violations.

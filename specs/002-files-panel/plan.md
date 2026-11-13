# Implementation Plan: Files Panel (as-built)

**Branch**: `002-files-panel` (documentation only) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

## Summary

Document the existing Files panel: a Herdr mod (`file-icons`, a clone of the shipped `files`) giving a lazy folder tree, search, git marks and a pinned single-file viewer tab with rendered Markdown, plus the `open-file` cmd-p dialog. No new code is planned; this records design intent.

## Technical Context

**Language/Version**: plain JavaScript ES modules (gpui-kit / gpui-base, Herdr mod API); no TypeScript

**Primary Dependencies**: `herdr` API (`exec`, `readTextFile`, `watchFolder`, `run`, `props`, `theme`, `settings`), Material Icon Theme SVGs, vendored highlight.js, `mmdc` for diagrams (via `lib/markdown.js`); external `git`, `rg`, `fzf`, `nvim`

**Storage**: none for this mod (all state in memory; no `localStorage`)

**Testing**: none; gate is `herdr-app check mods/file-icons` and `mods/open-file`

**Target Platform**: Herdr desktop app (macOS/Linux; Windows listing via PowerShell), local and remote (`on`) machines

**Project Type**: desktop-app mod

**Performance Goals**: 10 s reload timer; 150 ms resize debounce; folder watch for instant refresh

**Constraints**: 500 entries per folder, 5,000 total, 100,000 search paths (200 shown), 400,000 chars previewed

**Scale/Scope**: one mod (~330 lines main) + one dialog mod + shared lib copies

## Constitution Check

- I. Shipped mods read-only: PASS. `file-icons` is a clone of shipped `files`; shipped copy untouched.
- II. Single source in `lib/`: PASS. `markdown.js`, `code-highlight.js`, `hljs.js`, `diagram-viewer.js`, `panel-ui.js`, `space-folder.js` are synced copies listed in `scripts/sync-github-lib.sh`.
- III. Plain JS and `herdr-app check`: PASS. No build or tests.
- IV. Runtime conventions: PASS. Work uses `cx.spawn`, `cx.timer.every/after`; no `setTimeout`; `render()` only calls `refresh`, which spawns. No per-space `localStorage` needed.
- V. Consistent panel UI: PASS. Buttons and chips come from `panel-ui.js`; folder follows `space-folder.js`.
- VI. Documentation tracks behaviour: PARTIAL. `docs/mods/open-file.md` covers the viewer and dialog; no `docs/mods/file-icons.md` for the tree/search/git marks (follow-up, not a violation of current code).

## Project Structure

### Documentation (this feature)

```text
specs/002-files-panel/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (repository root)

```text
mods/file-icons/
├── main.js            # panel + pinned viewer (class Files)
├── mod.json
├── icons.js           # Material Icon Theme lookup tables
├── icons/             # SVG icons
├── chevron-down.svg, chevron-right.svg
├── markdown.js, code-highlight.js, hljs.js, diagram-viewer.js   # synced from lib/
├── panel-ui.js, space-folder.js                                 # synced from lib/
mods/open-file/
├── main.js            # cmd-p dialog
├── mod.json, space-folder.js
lib/                   # sources of the synced files
scripts/sync-github-lib.sh
docs/mods/open-file.md
keys.json              # cmd-p -> mod.open:open-file
layouts/tiendvd-layout.json  # block mod "file-icons" in panel-body
```

**Structure Decision**: two mods; the viewer is the same mod as the panel, switched by `props.file`, so Markdown and highlighting code exist once.

## Complexity Tracking

No violations.

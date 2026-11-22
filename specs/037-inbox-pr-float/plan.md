# Implementation Plan: PR inbox in a dialog, opened from a floating button

**Branch**: `037-inbox-pr-float` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

## Summary

The `inbox` mod stops tracking agents and leaves the sidebar. One copy of it runs as a floating block over the layout's `content` node (bottom edge, end): it draws a small Inbox button with the unread count, polls PRs, and posts toasts. Clicking the button runs `mod.open {name:"inbox"}`, which opens a second copy as a `frame: "none"` dialog wrapped in the kit's `dialogFrame`; that copy draws the list. The entries live in `shared("inbox.items")`, so both copies (each has its own localStorage) see and change the same list.

## Technical Context

**Language/Version**: plain JavaScript (gpui-kit), loaded by Herdr
**Primary Dependencies**: Herdr mod API (`placement`, `shared`/`setShared`, `mod.open`, `closeOverlay`), `gh` via `lib/pr-gh.js`
**Storage**: `shared("inbox.items")` (Herdr persists shared state in `shared.json`); PR snapshots in the floating copy's localStorage
**Testing**: `herdr-app check mods/inbox`, `node scripts/check-dialog-frames.mjs`, `herdr-app shot`; no lib/ change, so no new unit tests
**Target Platform**: Herdr desktop (macOS)
**Project Type**: personal mod + layout change
**Constraints**: constitution IV (no notify in render, cx.timer), dialog border rule (spec 024)
**Scale/Scope**: one mod (`mods/inbox`), `layouts/tiendvd-layout.json`, `CLAUDE.md`

## Constitution Check

- I. Shipped mods read-only: `inbox` is personal. ✅
- II. lib/ single source: synced copies untouched; logic stays mod-local. ✅
- III. `herdr-app check` gate + `layout.error`. ✅ (in tasks)
- IV. Runtime conventions: polling via `cx.spawn`/`cx.timer`; render only reads. ✅
- V. UI kit: button via `btn()`, dialog via `dialogFrame`. ✅
- VI. CLAUDE.md updated (Inbox line in layout + personal mods list). ✅

Post-design re-check: same, no violations.

## Project Structure

```text
specs/037-inbox-pr-float/   spec, plan, research, data-model, contracts/ui.md, quickstart, tasks
mods/inbox/main.js          floating button copy + dialog copy, agent tracking removed
mods/inbox/mod.json         overlay: dialog, frame none
layouts/tiendvd-layout.json inbox block removed from sidebar-lists; floating block on "content"
CLAUDE.md                   layout notes
```

**Structure Decision**: keep everything in the existing `inbox` mod; no new mod, no new lib file.

## Complexity Tracking

None.

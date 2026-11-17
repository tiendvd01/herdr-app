# Implementation Plan: Processes dialog with one border

**Branch**: `020-processes-dialog-border` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

## Summary

Same fix as specs 016/017: the dialog is opened with `frame: "none"` (in `mod.json` `overlay` and in the
status bar's `openOverlay` call), and `processes` draws the only frame with the kit's `dialogFrame`
(`lib/panel-ui.js`, synced into the mod).

## Technical Context

Plain JS gpui-kit mod; gate `herdr-app check mods/processes`, `mods/status-usage`; `herdr-app shot`.

## Constitution Check

I ✅ (personal mods) · II ✅ (panel-ui synced, processes added to `scripts/sync-github-lib.sh`) · III ✅ · IV ✅ · V ✅ (`dialogFrame`) · VI ✅ (CLAUDE.md line).

## Files

- `mods/processes/mod.json` — `overlay` `{ kind: "dialog", width: 920, height: 720, frame: "none" }`
- `mods/processes/main.js` — root wrapped in `dialogFrame` (its own background kept inside)
- `mods/status-usage/main.js` — `openOverlay({ …, frame: "none" })`
- `scripts/sync-github-lib.sh` — add `mods/processes/panel-ui.js`

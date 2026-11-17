# Implementation Plan: Every dialog has one clean border

**Branch**: `021-dialog-border-audit` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

## Summary

Audited every dialog and popup the personal mods open, by every way they are opened ([research.md](research.md)).
One broken edge found: Ctrl+B › p (`tmux-prefix`) opens Processes with an explicit `openOverlay` that has no
`frame: "none"`, so Herdr's frame is drawn around the dialog's own `dialogFrame` (double border). Fix: pass
`frame: "none"` there, like the status bar badge does (spec 020). Note the rule in CLAUDE.md so a new opener
does not bring the bug back.

## Technical Context

Plain JS gpui-kit mods; gate `herdr-app check mods/tmux-prefix`; verify with `herdr-app shot`.

## Constitution Check

I ✅ (personal mod only; shipped dialogs untouched) · II ✅ (no shared code changes) · III ✅ · IV ✅ · V ✅ (`dialogFrame` stays the only mod-drawn frame) · VI ✅ (CLAUDE.md line).

## Files

- `mods/tmux-prefix/main.js` — `overlay.processes`: `openOverlay({ …, frame: "none" })`
- `CLAUDE.md` — rule: an explicit `openOverlay` of a `frame: "none"` mod must pass `frame: "none"` too

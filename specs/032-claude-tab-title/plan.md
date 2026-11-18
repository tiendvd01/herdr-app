# Implementation Plan: Claude tab named after its session title

**Branch**: `032-claude-tab-title` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

## Summary

The sidebar (`my-agents`) already labels a tab with its agent's live terminal title when the tab is
named after the program ("Claude Code"). The tab bar (`my-tabs`) shows only the stored name. Move the
rule into `lib/tab-title.js` (pure: `clean`, `lead(tab, panes)`, `tabTitle(tab, panes)`), sync it into
both mods, and use it in both. Display only; the stored tab name is never changed (FR-006).

## Technical Context

Plain JS gpui-kit mods, no build. Data: `spaces()[].tabs[]` (`name`, `named`; unnamed name is its
position "2") and `panes()` (`tab`, `terminal`, `focused`, `title`, `program {name, key, agent}`).
Claude Code sets the terminal title to the session title, and panes re-render on title change, so
no polling is needed (SC-002). Tests: `node:test` on `lib/tab-title.js`.

## Rule

`tabTitle(tab, panes)`: lead = agent pane, else focused, else first terminal pane of the tab.
`live = clean(lead.title)`. If (`!tab.named` or `tab.name === program.name`) and `live` is telling
(FR-002), return `live`; else `tab.name`. Widened from the sidebar rule by the `!tab.named` case
(an unnamed tab running Claude showed "2").

## Constitution Check

I clone-not-edit: only personal mods touched ✅. II single source in `lib/`, synced ✅. III `herdr-app
check` both mods ✅. IV no timers, no notify in render ✅. Tests live in `tests/`, import `lib/` ✅.

## Files

- `lib/tab-title.js` (new), `scripts/sync-github-lib.sh` (+ my-tabs, my-agents)
- `mods/my-tabs/main.js` (label), `mods/my-agents/main.js` (drop local copy, import)
- `tests/tab-title.test.mjs`, `CLAUDE.md` (one line)

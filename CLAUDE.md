# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the Herdr desktop app's home folder (`~/.config/herdr-app`) under git, not an application codebase. The running app redraws itself from these files within a second of a change. **`AGENTS.md` is the authoritative manual** (layouts, keys, commands, mod API); read it before changing anything structural. Don't edit `AGENTS.md`, `herdr.d.ts` or any `gpui-kit.d.ts`: the app rewrites them on every start.

There is no build, lint or test setup. Mods are plain JavaScript (gpui-kit) that Herdr loads and hot-reloads directly; TypeScript and bundling are not part of the workflow.

## Commands

```sh
herdr-app check mods/<name>     # load + render a mod once; must pass before calling a mod done
herdr-app status                # layout, focus, overlays, and errors from files/mods
herdr-app shot [file.png]       # PNG of the last rendered window frame, for checking UI
herdr-app commands              # every app command and its arguments
herdr-app do <command> '{json}' # run an app command from the shell
```

After each edit, check the matching `<name>.error` file (`layout.error`, `keys.error`, `settings.error`, `programs.error`): an invalid file is ignored and the last good version keeps running.

## Layout of the setup

The window is `layouts/tiendvd-layout.json`, a tree of `row`/`column`/`stack`/`block` nodes. Each block names a mod. The pieces wired together:

- Left sidebar: `my-chrome` (brand and footer), `better-sidebar`, `my-agents`, `inbox`.
- Work column: `my-tabs` (tab bar), then `content` (tab panes, with `project-settings` as the other stack child), then a right `panel-body` stack of `files` (mod `file-icons`) / `reviewer` (the Changes panel) / `issues`, then `status-usage` as the status bar.
- Keys live in `keys.json` (macOS `cmd-*` bindings; `tmux-prefix` mod adds a prefix mode).

## Mods: what is yours and what isn't

- **Shipped mods are Herdr's and are overwritten on update** (`spaces`, `files`, `tabs`, `menu`, `pane`, `picker`, `worktree`, ...). Never edit them in place: `herdr-app do mod.clone '{"name":"x","as":"my-x"}'`, edit the clone, and point the layout's `content.mod` at it.
- **Personal mods**: `my-tabs`, `my-agents`, `my-chrome`, `my-new-menu`, `my-worktree` (clones of shipped ones), plus `issues`, `reviewer`, `processes`, `project-scripts`, `project-settings`, `status-usage`, `branch-switch` (popup đổi branch, mở từ status bar), `tmux-prefix`, `open-vscode`, `inbox` (hòm thư: agent cần bạn / chạy xong, review và CI trên PR của bạn; bấm để nhảy tới agent hoặc PR trong `pr-flow`).
- Layouts `main`, `terminals` and `win98` are shipped; `tiendvd-layout` is the personal one.
- Each mod folder has its own copy of `gpui-kit.d.ts` and a generated `jsconfig.json` (`checkJs`, `strict`). Expect many editor type errors that are not runtime bugs: `herdr.d.ts` types `theme()` as `Record<string,string>` while gpui-kit colors want `` `#${string}` ``, and `layout()` / `shared()` return `unknown`. `herdr-app check` is the real gate.

## Mod conventions worth knowing

- `render()` must not call `cx.notify()`; spawn the work (`cx.spawn`) and notify when it finishes. Never keep a `cx` for later use. No `setTimeout`/`setInterval`: use `cx.timer`. Animate natively (`.frames`, `.spin`, `.loop`), never with a timer.
- `issues` keeps per-space state (repo, filters, search, open issue) in `localStorage` key `spaces`, and fetches through the `gh` CLI. New spaces default to state Open and Mine (`fresh()` in `mods/issues/main.js`). `mods/issues/.diagrams/` is a gitignored render cache.
- `reviewer` is split into `main.js`, `dialog.js`, `highlight.js`, `ask.js`, `palette.js`; `issues` and `file-icons` share `lib/markdown.js` (markdown + mermaid diagrams drawn by `mmdc`) and `lib/diagram-viewer.js` (zoomable dialog overlay of the same mod), synced by `scripts/sync-github-lib.sh`.

## Mod docs

The panels follow the focused terminal's folder (`lib/space-folder.js`, copied into mods by `scripts/sync-github-lib.sh`); there is no pinned per-space folder any more. See `docs/space-folder.md`. `gh` calls in `pr-flow`, `better-sidebar` and `issues` pick the gh account by repo owner (`lib/gh-account.js`, `docs/gh-account.md`); keep the work account active.


Buttons in the five right-side panels (Files, Changes, Issues, Git, Pull requests) come from `lib/panel-ui.js` with icons in `lib/icons/` (synced by the same script): icon + tooltip for well-known actions, arrow + label for Back, text chips for filters, text buttons for actions. See `docs/panel-ui.md`.

Per-mod behaviour notes live in `docs/mods/` (kept outside `mods/` because saving any file under a mod folder hot-reloads it): `mermaid-board` (dán + preview + lưu sơ đồ mermaid), `processes` (Sessions dialog), `status-usage` (status bar, AI usage limits, post-create runner), `project-settings` (Ports + Worktree script), `issues`, `reviewer` (Changes), `inbox`. Update the matching file when changing a mod's behaviour.

## Git

Commits so far are all terse messages (`update`). `.gitignore` excludes runtime state (`view.json`, `shared.json`, `data/`, `projects/`, `*.error`, sockets); layout, keys, settings, themes and mods are tracked.

## Agent skills

### Issue tracker

Issues và spec lưu dạng markdown trong `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Năm nhãn mặc định (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), ghi ở dòng `Status:` của file issue. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: một `GLOSSARY.md` + `docs/adr/` ở gốc repo. See `docs/agents/domain.md`.

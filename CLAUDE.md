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
- Work column: `my-tabs` (tab bar), then `content` (tab panes), then a right `panel-body` stack of `files` (mod `file-icons`) / `issues`, then `status-usage` as the status bar. Changes (`reviewer`), Git (`git-graph`) and Pull requests (`pr-flow`) are not in the panel: the tab bar opens each as a 0.75×0.8 dialog with `mod.open` (again closes it; `mod.json` `overlay` with `frame: "none"`, so the mod draws the only frame: `rounded(10)`, `border_1`, `shadow_lg`). While open, shared `reviewer.dialog` / `git-graph.dialog` / `pr-flow.dialog` holds the overlay id (set in `init`, cleared in `close()`) and lights the tab bar button. Spec: `specs/016-pr-git-dialogs/`. Project Settings (`project-settings`) is the same kind of dialog, opened from the sidebar footer row (`my-chrome`) and the + menu's `Project skills…` (`my-new-menu`, which also sets `project-settings.tab`); its Close and Ports' go-to-terminal close the dialog; flag `project-settings.dialog`. Spec: `specs/017-project-settings-dialog/`.
- Keys live in `keys.json` (macOS `cmd-*` bindings; `tmux-prefix` mod adds a prefix mode).

## Mods: what is yours and what isn't

- **Shipped mods are Herdr's and are overwritten on update** (`spaces`, `files`, `tabs`, `menu`, `pane`, `picker`, `worktree`, ...). Never edit them in place: `herdr-app do mod.clone '{"name":"x","as":"my-x"}'`, edit the clone, and point the layout's `content.mod` at it.
- **Personal mods**: `my-tabs`, `my-agents`, `my-chrome`, `my-new-menu`, `my-worktree` (clones of shipped ones), plus `issues`, `reviewer`, `processes`, `project-scripts`, `project-settings`, `status-usage`, `branch-switch` (popup đổi branch, mở từ status bar), `tmux-prefix`, `open-vscode`, `ui-gallery` (UI kit gallery dialog), `inbox` (hòm thư: agent cần bạn / chạy xong, review và CI trên PR của bạn; bấm để nhảy tới agent hoặc mở dialog Pull requests (`pr-flow`) đúng PR đó).
- Layouts `main`, `terminals` and `win98` are shipped; `tiendvd-layout` is the personal one.
- Each mod folder has its own copy of `gpui-kit.d.ts` and a generated `jsconfig.json` (`checkJs`, `strict`). Expect many editor type errors that are not runtime bugs: `herdr.d.ts` types `theme()` as `Record<string,string>` while gpui-kit colors want `` `#${string}` ``, and `layout()` / `shared()` return `unknown`. `herdr-app check` is the real gate.

## Mod conventions worth knowing

- `render()` must not call `cx.notify()`; spawn the work (`cx.spawn`) and notify when it finishes. Never keep a `cx` for later use. No `setTimeout`/`setInterval`: use `cx.timer`. Animate natively (`.frames`, `.spin`, `.loop`), never with a timer.
- `issues` keeps per-space state (repo, filters, search, open issue) in `localStorage` key `spaces`, and fetches through the `gh` CLI. New spaces default to state Open and Mine (`fresh()` in `mods/issues/main.js`). `mods/issues/.diagrams/` is a gitignored render cache.
- `git-graph` comes from upstream (rabeeh-ta/herdr-git-graph; `update.js` offers updates) and carries a local dialog patch: `overlay` in `mod.json`, `close()` in `main.js`, the `git-graph.dialog` flag and dialog frame in `graph.js`. Re-apply it after an upstream update.
- `pr-flow` as a dialog closes itself when it opens its viewer pane (the pane would sit under the dialog).
- `pr-flow`'s list is the space repo's PRs of the chosen view, count first (one REST search, chips and header `shown / total`; 0 = empty state, no list call), then 20 rows per page from one GraphQL search by cursor (`page()` in `lib/pr-gh.js`), more on scrolling to the end; Mine ORs every logged-in login as `author:`. Rows from a page are `partial` (no files, body, thread comments): opening a PR fetches it in full. Only the opened PR and agents' branches are polled one by one; a shown view reloads every 2 min. Spec: `specs/019-pr-list-paging/`.
- `reviewer` is split into `main.js`, `dialog.js`, `highlight.js`, `ask.js`, `palette.js`; `issues` and `file-icons` share `lib/markdown.js` (markdown + mermaid diagrams drawn by `mmdc` + fenced code colored by highlight.js via `lib/code-highlight.js` and `lib/vendor/highlight.min.js`) and `lib/diagram-viewer.js` (zoomable dialog overlay of the same mod), synced by `scripts/sync-github-lib.sh`.

## Per-project Claude skills

`.agents/skills/<name>/SKILL.md` and `mcp/<name>.json` (one server config per file, secrets only as `${VAR}`) are a tracked library, not loaded globally (Claude Code does not read `.agents/skills/` by itself). Hand-made skills are put there by hand; third-party ones come from the `skills` CLI run in the repo root: `npx skills add <owner/repo> -s '*' -a universal -y` (the `universal` target writes only `.agents/skills/`), `npx skills update`, and `npx skills remove <name> -y` (without `-a`: `-a universal` prints Done but removes nothing). `skills-lock.json` records CLI installs (ponytail so far). The library moved there from `skills/` with `scripts/migrate-agents-skills.mjs` (spec 015; safe to rerun, it only re-points project links). Project Settings › Skills turns single items on per git project: it saves `projects/<slug>/skills.json` and at once syncs the project's one shared plugin folder `projects/<slug>/claude-plugin/` in place (symlinks into `.agents/skills/`, merged `.mcp.json`, generated `plugin.json`; only changed links are added or removed). The + menu row `Claude · N skills` syncs that folder again and starts `claude --plugin-dir <that folder>` (skills appear as `herdr-<repo>:<skill>`); all sessions and worktrees of a project share it, so a switch can reach running sessions. Leftover per-launch `claude-sessions/<stamp>` folders from spec 012 are removed once no process's command line names them. With nothing on, the row is `Project skills…` and opens the tab. Names outside `[A-Za-z0-9._-]` are listed as invalid. Logic: `lib/project-skills.js` (synced into `project-settings` and `my-new-menu`). Nothing in Herdr ever writes to `.agents/skills/`, `mcp/` or `~/.claude/`. Specs: `specs/012-space-skillsets/`, `specs/013-shared-project-skills/`, `specs/015-agents-skills-library/`.

## MCP servers in this repo

Servers whose code lives here go in `mcp-servers/<name>/` (outside `mods/`, so nothing hot-reloads or docks; outside `mcp/`, which only holds library config files the Skills tab lists). `mcp-servers/herdr-ports/server.mjs` is a dependency-free Node stdio server (hand-written JSON-RPC, no `npm install`) with read-only tools `project_ports` (worktrees and listening ports of a project; default = the session's folder, or a folder / project name) and `port_lookup` (free, or who holds a port). It is registered as `mcp/herdr-ports.json` and turned on per project in Project Settings › Skills. Port discovery has one source, `lib/ports.js` (injected `exec`, no `herdr` import): the Ports tab uses its synced copy, the server imports it directly. Herdr terminal names come from `hc ls` / `hc get`; project names from `hc ls` folders. Spec: `specs/014-ports-mcp/`.

## Shared behaviour

The panels follow the focused terminal's folder (`lib/space-folder.js`, copied into mods by `scripts/sync-github-lib.sh`); there is no pinned per-space folder any more. Project Settings lists the git projects of every terminal's live folder in local spaces (Herdr's `space.folder` only for a space with no terminal yet, since it is where the space started and goes stale), and opens on the focused terminal's project. `gh` calls in `pr-flow`, `better-sidebar` and `issues` pick the gh account by repo owner (`lib/gh-account.js`); keep the work account active.


UI kit (spec 018): every personal screen takes its buttons and common surfaces from `lib/panel-ui.js` (synced into each user; add new users to `scripts/sync-github-lib.sh`). `btn(id, {kind, size, label, icon, extra, on, disabled, busy, attention, tip, color, action})` with kinds primary / secondary / ghost / danger / icon / chip and sizes sm 22 / md 26 / lg 32; hover is a highlight layer fading in (120 ms), press an opacity dip (80 ms), busy a spinner, attention a slow accent pulse, all native. The old helpers (`iconButton`, `backButton`, `chip`, `button`, `textButton`) are wrappers over `btn`. Tokens in `UI` (heights, radius, text, space, motion); surfaces `dialogFrame`, `card`, `inputFrame`, `divider`, `sectionTitle`, `headerRow`, `emptyState`. Icons: names in `lib/icons/` or an svg path. List rows, tabs and tree items keep their own look. See everything in the gallery: `herdr-app do mod.open '{"name":"ui-gallery"}'` (`mods/ui-gallery`, never docked).

There is no `docs/` folder (removed on purpose). Behaviour notes for a mod go in this file, short, and a spec-kit feature keeps its detail in `specs/<nnn>-<feature>/`. Never write notes under `mods/` (saving there hot-reloads the mod).

## Git

Commits so far are all terse messages (`update`). `.gitignore` excludes runtime state (`view.json`, `shared.json`, `data/`, `projects/`, `*.error`, sockets); layout, keys, settings, themes and mods are tracked.

## Agent skills

### Issue tracker

Issues và spec lưu dạng markdown trong `.scratch/<feature>/`.

### Triage labels

Năm nhãn mặc định (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), ghi ở dòng `Status:` của file issue.

### Domain docs

Single-context: một `GLOSSARY.md` ở gốc repo khi cần; không có `docs/adr/`.

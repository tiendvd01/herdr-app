<!--
Sync Impact Report (temporary review scratch; remove before commit)
- Version change: (unfilled template) → 1.0.0
- Modified principles: none renamed; all five principle slots filled for the first time
- Added sections: Core Principles I–VI, Operational Constraints, Development Workflow, Governance
- Removed sections: none
- Deferred TODOs: none. RATIFICATION_DATE set to the date of this first adoption (2026-11-13).
- Sources: CLAUDE.md, scripts/sync-github-lib.sh, docs/*.md, .gitignore
-->
# Herdr App Home Constitution

## Core Principles

### I. Shipped Mods Are Read-Only; Clone to Customize
Shipped mods (`spaces`, `files`, `tabs`, `menu`, `pane`, `picker`, `worktree`, ...) MUST NOT be edited
in place. Customization MUST go through `herdr-app do mod.clone '{"name":"x","as":"my-x"}'`, and the
layout MUST be pointed at the clone. `AGENTS.md`, `herdr.d.ts` and every `gpui-kit.d.ts` MUST NOT be
edited by hand.
Rationale: the app overwrites shipped mods and those files on update and on every start, so in-place
edits are silently lost.

### II. Single Source in `lib/`, Synced Copies in Mods
A mod can only import files inside its own folder. Shared code MUST therefore live once in `lib/` and
be copied into mods by `scripts/sync-github-lib.sh`. Copies carry a GENERATED header and MUST NOT be
edited; changes are made in `lib/` and the script is re-run. A new consumer of a shared file MUST be
added to the script.
Rationale: duplicated logic across mods drifts; one source plus a mechanical copy keeps the five
right-hand panels and `gh` handling consistent.

### III. Plain JavaScript, Hot-Reload, and `herdr-app check` as the Gate
Mods MUST be plain JavaScript (gpui-kit) loaded directly by Herdr; no TypeScript, bundler, build, lint
or test setup is introduced. A mod is not done until `herdr-app check mods/<name>` passes. After each
edit the matching `<name>.error` file (`layout.error`, `keys.error`, `settings.error`,
`programs.error`) MUST be checked, because an invalid file is ignored and the last good version keeps
running. Editor type errors from generated `jsconfig.json` are not defects; `herdr-app check` is.
Rationale: the running app redraws within a second of a change, so failures are quiet unless looked
for.

### IV. Mod Runtime Conventions (NON-NEGOTIABLE)
- `render()` MUST NOT call `cx.notify()`; work is started with `cx.spawn` and `cx.notify()` is called
  when it finishes.
- A `cx` MUST NOT be kept for later use.
- `setTimeout` / `setInterval` MUST NOT be used; use `cx.timer`.
- Animation MUST be native (`.frames`, `.spin`, `.loop`), never timer-driven.
- Per-space state lives in `localStorage` (for example key `spaces`), not in shared global state.
Rationale: these are the rules of the gpui-kit render model; breaking them causes render loops or
stale handles.

### V. Consistent Panel UI
Buttons in the Files, Changes, Issues, Git and Pull requests panels MUST come from `lib/panel-ui.js`
with icons from `lib/icons/` (Lucide, stroke `currentColor`): icon + tooltip for well-known actions,
arrow + label for Back, text chips for filters, text buttons for actions. Panels MUST follow the
focused terminal's folder via `lib/space-folder.js`; no pinned per-space folder.
Rationale: one look and one folder rule across panels keeps behaviour predictable.

### VI. Documentation Tracks Behaviour
Per-mod behaviour notes live in `docs/mods/` (outside `mods/`, because saving any file under a mod
folder hot-reloads it). A change to a mod's behaviour MUST update the matching `docs/mods/<mod>.md`;
cross-cutting rules live in `docs/` (`space-folder.md`, `gh-account.md`, `panel-ui.md`). Never leave a
doc describing removed behaviour.
Rationale: the docs are the only record of intent, since the repo has no tests.

## Operational Constraints

- **GitHub accounts**: `gh` calls pick the account by repo owner through `lib/gh-account.js`; the work
  account (`tien-sora`) MUST stay the active `gh` account. Tokens MUST be read inside the shell
  (`GH_TOKEN="$(gh auth token --user <login>)"`) so they never appear in process lists.
- **Runtime state stays untracked**: `view.json`, `shared.json`, `data/`, `projects/`, `*.error`,
  sockets, render caches (`mods/*/.diagrams/`) and `.scratch/` MUST remain in `.gitignore`; layout,
  keys, settings, themes and mods are tracked. Secrets (`.env*`) MUST NOT be committed.
- **No leftover probe mods**: a temporary mod under `mods/` is docked into the layout automatically;
  it MUST be removed when the experiment ends.
- **Layout**: the window is a tree of `row`/`column`/`stack`/`block` nodes in
  `layouts/tiendvd-layout.json`; shipped layouts (`main`, `terminals`, `win98`) are not edited.

## Development Workflow

- Read `AGENTS.md` (authoritative manual) before structural changes.
- Edit, then verify with `herdr-app check`, the `.error` files, `herdr-app status`, and
  `herdr-app shot` for UI changes.
- Issues and specs are local markdown in `.scratch/<feature>/` with a `Status:` line using the five
  triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`).
- Commit messages are terse. Commits and PRs MUST NOT carry AI attribution lines.

## Governance

This constitution supersedes ad-hoc practice in this repository. Amendments are made by editing this
file with a rationale and a version bump, and MUST update any affected `docs/` file in the same
change. Versioning follows semantic versioning: MAJOR for removed or redefined principles, MINOR for a
new principle or materially expanded guidance, PATCH for clarifications. Compliance is checked
whenever a mod, layout or shared `lib/` file changes: the reviewer verifies the principles above,
especially I, II and IV. Runtime guidance lives in `CLAUDE.md` and `AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13

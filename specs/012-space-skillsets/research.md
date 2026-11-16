# Research: Per-Project Skills for Claude Sessions

> **Superseded in part by `specs/013-shared-project-skills/`**: one shared folder per project (`projects/<slug>/claude-plugin/`) synced in place on every switch and launch; per-launch `claude-sessions/` folders are no longer made, and FR-010 (running sessions unaffected) is relaxed.

All unknowns from the Technical Context are resolved below.

## R1. Does Claude load symlinked skill folders from `--plugin-dir`?

- **Decision**: Yes. Use symlinks; no copy fallback needed.
- **Evidence** (probe run 2026-11-16, local Claude CLI): a bundle with `.claude-plugin/plugin.json` (`name: herdr-probe`) and `skills/zz-probe-skill -> <elsewhere>/zz-probe-skill` started with `claude -p --plugin-dir <bundle> --output-format stream-json --verbose`. The `init` event listed skill `herdr-probe:zz-probe-skill` and plugin `herdr-probe@inline`.
- **Rationale**: edits in the library apply everywhere, nothing is duplicated, turning off only removes a link.
- **Alternatives considered**: copy (duplicates, stale copies, deleting can lose edits); one `--plugin-dir` per skill (each skill would need its own plugin manifest, so the library would not be plain skill folders).

## R2. Skill names inside a session

- **Decision**: plugin name is `herdr-<repo-name>` (sanitised); skills appear as `herdr-<repo>:<skill>`.
- **Rationale**: confirmed by R1. The prefix tells the user in `/skills` which ones come from the project. Name collisions with global skills are still possible (the bare name), so the UI warns (Story 3, scenario 4).

## R3. MCP servers in a plugin

- **Decision**: the bundle's root `.mcp.json` is `{"mcpServers": {<name>: <config>, ...}}`, merged from `mcp/<name>.json` files, each holding one server's config object. Secrets use `${VAR}` placeholders.
- **Evidence**: same probe; a `.mcp.json` server `probe-echo` with `"command": "${PROBE_CMD}"` was listed as `plugin:herdr-probe:probe-echo` (status `failed` only because the probe command is not an MCP server).
- **Alternatives considered**: symlink `.mcp.json` (impossible to pick single servers from one file); write servers into the project's own `.mcp.json` (touches the user's repo, rejected by spec).

## R4. Project key and where per-project files live

- **Decision**: reuse Project Settings' key: `slug(main)` where `main` is the repo's main worktree (`git rev-parse --path-format=absolute --git-common-dir`, minus `/.git`). Files under `~/.config/herdr-app/projects/<slug>/`.
- **Rationale**: same folder already holds `post-create.sh` and `summary-prompt.md`, is gitignored, and is shared by all worktrees.
- **Consequence**: folders outside git are not projects (Project Settings already lists git projects only). The spec edge case is updated: for a non-git folder the + menu shows no skills entry.

## R5. Sharing code between `project-settings` and `my-new-menu`

- **Decision**: new `lib/project-skills.js`, copied into both mods by `scripts/sync-github-lib.sh` (constitution II).
- **Contents**: repo lookup, library scan, selection read/write, per-launch folder build + cleanup, launch argv. See `contracts/project-skills-lib.md`.
- **Alternatives considered**: duplicate code in both mods (drift); `my-new-menu` reading a file written by `project-settings` only (the menu would launch with a stale or broken bundle when the library changed).

## R6. File system access from a mod

- **Decision**: `readTextFile` / `writeTextFile` for text; `exec` for listing (`find -L <dir> -mindepth 2 -maxdepth 2 -name SKILL.md`), `mkdir -p`, `ln -sfn`, `rm`.
- **Rationale**: these are the only file APIs in `herdr.d.ts`; `project-settings` already uses the same pattern.
- **Notes**: `find -L` follows symlinks because many global skills under `~/.claude/skills` are symlinks themselves.

## R7. Build strategy (revised after /speckit-analyze, finding I1)

- **Decision**: one fresh plugin folder per launch, `projects/<slug>/claude-sessions/<YYYYMMDD-HHMMSS-xxxx>/`, never modified after creation. Switch flips only write `skills.json`. At each launch, older launch folders are removed when no process's command line (`ps -axww -o args=`) contains their path and they are over 2 minutes old.
- **Rationale**: the first design rebuilt one shared `claude-plugin/` folder on every flip, so turning a skill off removed a link a running session might still read, breaking FR-010. Frozen per-launch folders keep each session's skills stable. Checked 2026-11-16: a running `claude --plugin-dir <path>` shows the full path in `ps`.
- **Safety**: only folders matching the stamp pattern directly under `claude-sessions/` are removed; `rm -rf` removes the symlinks, never their targets. If `ps` fails, nothing is removed.
- **Alternatives considered**: shared folder rebuilt on change (breaks FR-010); copy per launch (duplicates files; edits to the library would not reach sessions); never cleaning up (folders pile up).

## R8. Approximate size

- **Decision**: tokens ≈ (length of `name` + `description` from SKILL.md frontmatter) / 4, summed; MCP servers counted, not sized (their tool lists are only known at run time).
- **Rationale**: skill descriptions are what each conversation carries up front; the spec asks for an estimate only.

## R9. Global set shown read-only

- **Decision**: list `~/.claude/skills/*/SKILL.md`. Skills from globally installed plugins are out of scope (they are managed with `/plugin`), noted in the UI as "plus installed plugins".

## R10. Opening the Skills tab from the + menu

- **Decision** (as built): the menu sets shared key `project-settings.tab = { tab: "skills", folder, at: Date.now() }` then runs `layout.select {stack: "content", child: "project-settings"}`. `project-settings` reads it in `render`, acts once per `at` value and ignores requests older than 10 s; it never clears the key, so `render` makes no `setShared` call. The `folder` picks that folder's project.
- **Alternatives considered**: new app command (not available to mods).

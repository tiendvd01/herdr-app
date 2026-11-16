# Data Model: One Shared Skills Folder per Project

Paths are relative to `~/.config/herdr-app/`. Skill, MCP server, global skill, project and selection (`projects/<slug>/skills.json`) are unchanged from `specs/012-space-skillsets/data-model.md`.

## Project skills folder — `projects/<slug>/claude-plugin/` (derived, one per project)

```
.claude-plugin/plugin.json   {"name": "herdr-<repo>", "version": "1.0.0", "description": "Herdr per-project skills for <main>"}
skills/<name>                symlink -> skills/<name> in the library   (one per enabled, valid skill)
.mcp.json                    {"mcpServers": {<name>: config, ...}}    (absent when no server is on)
```

- Shared by all worktrees and all Claude sessions of the project.
- Synced in place from `skills.json` + library on: switch flip, Skills tab Refresh, + menu launch.
- Only links inside `skills/`, `plugin.json` and `.mcp.json` are ever written or removed.

## Leftover launch folder — `projects/<slug>/claude-sessions/<YYYYMMDD-HHMMSS-xxxx>/` (feature 012)

- Never created any more.
- Removed after a sync when no running process's command line contains its path; `claude-sessions/` itself removed when empty.

## State transitions (one skill, one project)

```
off ──turn on──▶ on   (skills.json saved, link added to claude-plugin/skills/)
on  ──turn off─▶ off  (skills.json saved, link removed; library untouched)
on  ──removed from library──▶ dangling (link dropped at next sync; shown missing; reported at launch)
dangling ──back in library──▶ on (link added at next sync)
```

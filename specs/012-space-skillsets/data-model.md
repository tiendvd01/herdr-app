# Data Model: Per-Project Skills

> **Superseded in part by `specs/013-shared-project-skills/`**: one shared folder per project (`projects/<slug>/claude-plugin/`) synced in place on every switch and launch; per-launch `claude-sessions/` folders are no longer made, and FR-010 (running sessions unaffected) is relaxed.

Paths are relative to `~/.config/herdr-app/` unless absolute.

## Skill (library item)

| Field | Source | Rule |
|---|---|---|
| `name` | folder name `skills/<name>/` (the frontmatter `name` is not used as the key) | unique (flat folder); `[A-Za-z0-9._-]+`, other names are invalid (`bad name`) |
| `description` | `description:` in SKILL.md frontmatter | required; missing → invalid |
| `path` | absolute path of the folder | |
| `size` | `(name + description).length / 4` | estimate (research R8) |
| `invalid` | reason string or null | `no SKILL.md`, `no description`, `bad name` |
| `globalDuplicate` | a global skill with the same `name` exists | warning only |

## MCP server (library item)

| Field | Source | Rule |
|---|---|---|
| `name` | file name `mcp/<name>.json` | `[A-Za-z0-9._-]+` |
| `config` | file content, a JSON object (`command`/`args`/`env` or `type`/`url`) | must parse to an object; otherwise invalid |
| `invalid` | reason or null | `bad JSON`, `not an object` |

## Global skill (read-only)

`~/.claude/skills/<name>/SKILL.md` → `{ name, description, size }`.

## Project

| Field | Source |
|---|---|
| `main` | main worktree path from `git rev-parse --git-common-dir` |
| `slug` | `main` with non `[A-Za-z0-9._-]` runs → `_` (same as Project Settings) |
| `dir` | `projects/<slug>/` |
| `plugin` | `herdr-<basename(main)>` sanitised to `[a-z0-9-]` |

## Project selection — `projects/<slug>/skills.json`

```json
{ "version": 1, "skills": ["api-design", "db-migration"], "mcp": ["postgres"] }
```

- Missing file = nothing on.
- Names only; order not meaningful (kept sorted when written).
- A name not found in the library stays in the file (so it comes back if the skill returns) but is skipped when a launch folder is built and reported.
- Written with `writeTextFile(path, text, expected)` so concurrent edits from two windows fail instead of overwriting.

## Launch folder — `projects/<slug>/claude-sessions/<YYYYMMDD-HHMMSS-xxxx>/` (derived, one per launch)

```
.claude-plugin/plugin.json   {"name": plugin, "version": "1.0.0", "description": "Herdr per-project skills for <main>"}
skills/<name>                symlink -> <library>/skills/<name>   (one per enabled, valid skill)
.mcp.json                    {"mcpServers": {<name>: config, ...}}   (absent when no server is on)
```

- Created by a + menu launch, never modified afterwards.
- Removed at a later launch when no running process names it in its command line and it is over 2 minutes old.

## State transitions (one skill, one project)

```
off ──turn on──▶ on   (skills.json only; linked in the next launch folder)
on  ──turn off─▶ off  (skills.json only; library untouched)
off ⇄ on changes skills.json only; sessions already running keep their own launch folder
on  ──skill removed from library──▶ dangling: stays in skills.json, skipped and reported at the next launch
dangling ──skill back in library──▶ on (linked again at the next launch)
```

# Data Model: Skill Library Moves to `.agents/skills/`

`<app>` = `~/.config/herdr-app` (absolute `/Users/<u>/.config/herdr-app` wherever a link target is written).

## Library skill

| | Before | After |
|---|---|---|
| Location | `<app>/skills/<name>/` | `<app>/.agents/skills/<name>/` |
| Contents | `SKILL.md` + any files | unchanged, byte for byte |
| Tracked | yes (hand-made) / untracked (ponytail, not committed yet) | yes, all |

- `name` matches `^[A-Za-z0-9._-]+$`; dot-names (`.gitkeep`) are not skills.
- Valid = `SKILL.md` exists and its frontmatter has a `description` (rules unchanged from 012).

## Install record — `<app>/skills-lock.json`

Unchanged by the migration. Fields per skill: `source`, `sourceType`, `skillPath` (path inside the **source** repo), `computedHash`. No local path or agent is stored, so a move does not stale it (research R2).

## Project selection — `<app>/projects/<slug>/skills.json`

`{ "version": 1, "skills": [names], "mcp": [names] }`. **Never written** by this feature.

## Project plugin folder — `<app>/projects/<slug>/claude-plugin/skills/<name>`

Each entry is a symlink with an absolute target.

| State before | Action | State after |
|---|---|---|
| link → `<app>/skills/<n>`, `<app>/.agents/skills/<n>/SKILL.md` exists | re-point | link → `<app>/.agents/skills/<n>` |
| link → `<app>/skills/<n>`, no new folder | remove | (absent) |
| link → anything else (already new, or foreign) | none | unchanged |
| not a link | none (feature 013 rule) | unchanged |
| absent, `<n>` in selection, valid library folder | create | link → `<app>/.agents/skills/<n>` |

## Migration run (state transitions)

```
start ─▶ preflight ─┬─ clash (same name in both folders) ─▶ abort, list names, nothing changed
                    ├─ no skills/ (or empty) ─▶ "nothing to move" ─▶ repair links only ─▶ done
                    └─ ok ─▶ move all ─▶ rmdir skills/ ─▶ repair links (all projects) ─▶ sync lib into mods ─▶ done
```

Repairing links is idempotent, so the "nothing to move" path also fixes a half-finished earlier run.

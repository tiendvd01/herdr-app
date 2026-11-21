# Plan: Open a skill in Zed

**Spec**: [spec.md](spec.md)

## Approach

All in `mods/project-settings/main.js` (no lib change, no test: screen code; gate is `herdr-app check` + `herdr-app shot`).

- `openInZed(...paths)` (module helper, already used by Sources › Open and Memory › Open folder): `zed <paths>`; failing that `open -a Zed <paths>`; failing that `open <first path>`.
- Skill rows: `zed <folder> <folder>/SKILL.md` (folder as the workspace, SKILL.md open). No SKILL.md (`invalid === "no SKILL.md"`): folder only.
- MCP rows: `zed <file>`.
- `row()` in `skillsView` gets a small ghost `Open` button (kit `btn`, size sm) before the switch, shown also for invalid and hidden rows. Global rows (plain text today) get the same button.
- Library items already carry `path` (folder for skills, file for MCP) from `listSkills` / `listMcp`.

## Risk

Herdr's `exec` PATH may lack `/opt/homebrew/bin`; the `open -a Zed` fallback covers it.

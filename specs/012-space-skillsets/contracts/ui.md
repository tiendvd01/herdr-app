# Contract: UI

## Project Settings › Skills tab (`mods/project-settings`)

Fourth tab after Ports, Worktree script, Summary prompt: label **Skills**.

```
Skills                                   [Open folder] [Refresh]
Library: ~/.config/herdr-app/skills · mcp
On for this project: 4 skills · 1 MCP · ~620 tokens    Global: 41 skills · ~5,900 tokens
[ search…                                  ]

SKILLS (12)
  ● api-design        Design REST endpoints …                 [on ]
  ○ react-forms       Build forms with …                       [off]
  ⚠ db-migration      also in global — loaded twice if on       [off]
  ✕ broken-skill      invalid: no description                  (no switch)

MCP SERVERS (2)
  ● postgres                                                    [on ]

GLOBAL (read-only, loaded everywhere; plus installed plugins)
    translate-requirement   Dịch và giải thích requirement …
```

- Switch click: update selection → `writeSelection`; status line shows "Saved · applies to the next Claude session" or the error. Running sessions are not changed.
- Search filters skills, MCP and global by name or description (case-insensitive).
- Empty library: text "Put skill folders in ~/.config/herdr-app/skills/ (each with SKILL.md)" + Open folder.
- Opening with shared key `project-settings.tab = { tab: "skills", folder, at }` selects this tab and the folder's project, once per `at`, ignoring requests older than 10 s; the key is not cleared.

## + menu (`mods/my-new-menu`)

- New row under the agent list, only when Claude is installed, the active space has a local git folder, and the project has ≥ 1 valid item on:
  `Claude · N skills` (icon: Claude's), no digit shortcut, so agent numbers are unchanged.
- When the project has nothing on (or no library): row `Project skills…` that opens the Skills tab.
- Click: `launchArgs(project, claude.run)` → `run("tab.new", { name: "Claude", space, folder, argv })`; if `skipped` is non-empty, `notify({ level: "warning", title: "Skills skipped", body: names + reasons })`.
- Popup height accounts for the extra row (`new-menu.rows` shared count and the height formula).

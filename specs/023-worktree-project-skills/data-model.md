# Data Model: Project skills in worktrees

No new stored data except one dialog preference.

| Entity | Where | Fields | Notes |
|--------|-------|--------|-------|
| Project | `projectOf(folder)` result (in memory) | `main`, `name`, `slug`, `dir`, `plugin` | Same object for the main checkout and every worktree (`--git-common-dir`). |
| Skill selection | `projects/<slug>/skills.json` | `skills[]`, `mcp[]` | Unchanged; edited in Project Settings. |
| Shared skill set | `projects/<slug>/claude-plugin/` | `skills/<name>` links, `.mcp.json`, `.claude-plugin/plugin.json` | Refreshed before every start (`syncBundle`). |
| Agent | `knownAgents()` row | `key`, `name`, `run`, `installed` | Only `key === "claude"` gets skills. |
| Start-Claude preference | `my-worktree` localStorage `startClaude` | `"1"` / `"0"` | Missing = on. Read in `init`, written on toggle; reads/writes in try/catch. |

## Rules

- A folder outside git, or a space with a `machine`, → agent argv unchanged.
- Valid count = selected skills and MCP that exist and are valid in the library; 0 → argv unchanged, no notification.
- Refresh failure → argv unchanged + one warning notification.

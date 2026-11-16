# Contract: `lib/project-skills.js` (changes from feature 012)

Unchanged: `projectOf`, `scanLibrary`, `readSelection`, `writeSelection`, `estimate`, `skillsDir`, `mcpDir`.

Removed: `buildBundle`, `pruneBundles`.

```js
// Bring projects/<slug>/claude-plugin/ in line with skills.json and the library, in place.
syncBundle(project, library?) -> {
  path,                          // projects/<slug>/claude-plugin
  skills: string[],              // linked after the sync
  mcp: string[],                 // in .mcp.json after the sync
  skipped: { name, reason }[],   // "missing from library", invalid reason, "not a link, left alone", link error
  changed: boolean,              // anything added, removed or rewritten
}

// Remove feature 012 launch folders no running process uses; rmdir claude-sessions/ when empty.
pruneLegacy(project) -> string[]   // removed folder names

// Argv for the + menu: syncBundle, pruneLegacy, then the command (same folder every time).
launchArgs(project, baseArgv) -> {
  argv: [...baseArgv, "--plugin-dir", path] | null,   // null when nothing is on after skipping
  count, skills, mcp, skipped, path,
}
```

## Invariants

- No function writes under `skills/`, `mcp/` or `~/.claude/`.
- `syncBundle` removes only symlinks inside `claude-plugin/skills/`, and `.mcp.json` when no server is on; it is idempotent (a second run reports `changed: false`).
- `pruneLegacy` removes only `claude-sessions/<stamp>` folders; when `ps` fails it removes nothing.

## Callers

- `mods/project-settings/main.js`: after a successful `writeSelection` and on Refresh → `syncBundle(r, this.lib)` then `pruneLegacy(r)`; status "Saved · applies to Claude sessions of this project".
- `mods/my-new-menu/main.js`: unchanged call to `launchArgs`.

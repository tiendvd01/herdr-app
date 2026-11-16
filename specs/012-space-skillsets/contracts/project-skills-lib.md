# Contract: `lib/project-skills.js`

> **Superseded in part by `specs/013-shared-project-skills/`**: one shared folder per project (`projects/<slug>/claude-plugin/`) synced in place on every switch and launch; per-launch `claude-sessions/` folders are no longer made, and FR-010 (running sessions unaffected) is relaxed.

Single source, copied into `mods/project-settings/project-skills.js` and `mods/my-new-menu/project-skills.js` by `scripts/sync-github-lib.sh`. Only uses `exec`, `readTextFile`, `writeTextFile`, `home` from `herdr`. All functions are async and never throw for expected cases (missing files, empty library); they return values carrying the problem instead.

```js
// Repository of a folder, or null outside git.
projectOf(folder) -> { main, name, slug, dir, plugin } | null

// Library + global, scanned fresh each call.
scanLibrary() -> {
  skills: Skill[],        // sorted by name, invalid ones included with .invalid
  mcp: McpServer[],
  global: GlobalSkill[],
}

// Selection of a project.
readSelection(project) -> { skills: string[], mcp: string[], raw: string | null }
writeSelection(project, sel, expectedRaw) -> { ok: true, raw } | { ok: false, error }

// Build a fresh, frozen plugin folder for ONE launch from the selection and library.
buildBundle(project, library?) -> {
  path,                    // projects/<slug>/claude-sessions/<YYYYMMDD-HHMMSS-xxxx>
  skills: string[],        // linked
  mcp: string[],           // written to .mcp.json
  skipped: { name, reason }[],   // missing / invalid in library
}

// Remove launch folders not named by any running process (ps args) and over 2 min old, except keep.
pruneBundles(project, keep) -> string[]   // removed folder names

// Argv for the + menu: buildBundle, then pruneBundles, then the command.
launchArgs(project, baseArgv /* e.g. ["claude"] */) -> {
  argv: [...baseArgv, "--plugin-dir", path] | null,   // null when nothing is on after skipping
  count, skills, mcp, skipped, path,
}

// Estimate shown in the Skills tab.
estimate(items) -> { count, tokens }
```

## Invariants

- No function writes under `skills/`, `mcp/` or `~/.claude/`.
- A launch folder is never modified after `buildBundle` returns; only `pruneBundles` removes it, and only when no process uses it.
- `pruneBundles` removes only `claude-sessions/<stamp>` folders; when `ps` fails it removes nothing.
- Paths are passed to `exec` as separate argv items (no shell), so names with spaces work.

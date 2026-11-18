# Contract: `scripts/move-skill-set.mjs`

```
node scripts/move-skill-set.mjs [--dry-run] [--to <folder>]
```
- Default target `~/Documents/SoraTech/skills-set`.
- Exit 0: done or nothing to do; prints `moved N`, `rewrote N files`, `source added|already listed`, one line per project with relinked counts.
- Exit 2: a name to move already exists in the target; nothing changed.
- Exit 1: an I/O failure; what was done so far is printed; rerun completes.
- Never touches skills outside the team set, `mcp/`, `skills.json`, `~/.claude/`.
- Exports for tests: `TEAM_MATCH(name)`, `rewritePaths(text, home, target)`.

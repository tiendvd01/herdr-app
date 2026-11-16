# Contract: `scripts/migrate-agents-skills.mjs`

Run from anywhere: `node scripts/migrate-agents-skills.mjs [--dry-run]`. Works on `~/.config/herdr-app` (from `$HOME`), not on the cwd.

## Behaviour

1. **Preflight**
   - List entries of `skills/` (including dot-files) and `.agents/skills/`.
   - Any name in both → print `clash: <a>, <b>, ...`, exit **2**, change nothing.
2. **Move** (skipped with message `nothing to move` when `skills/` is missing or empty)
   - `mkdir -p .agents/skills`; rename each entry of `skills/` into it (same filesystem, so a rename, not a copy); `rmdir skills`.
3. **Repair links** for every `projects/*/claude-plugin/skills/` (rules in [data-model.md](../data-model.md#project-plugin-folder--appprojectsslugclaude-pluginskillsname)). Selection files are read, never written.
4. **Sync**: run `scripts/sync-github-lib.sh` (only when step 2 moved something or `--sync` is given).
5. **Report**: one line per project: `<slug>: relinked N, removed N, created N, kept N`; final line `moved N skills`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | done, or nothing to do |
| 1 | an I/O step failed (message names the path); later steps not run |
| 2 | preflight clash; nothing changed |

## Guarantees

- Never writes into `~/.claude/`, `mcp/`, or any `skills.json`.
- Never deletes a library folder; never follows links when removing (`unlink` on the link only).
- `--dry-run` prints the same report and changes nothing.
- A second run after success: `nothing to move`, all projects `relinked 0, removed 0, created 0`, exit 0.

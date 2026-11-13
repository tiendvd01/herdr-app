# Data Model: Worktree Script (as-built)

## Entities

### Project
- `main`: main checkout path (from the git common dir, trailing `/.git` removed)
- `name`: last path segment of `main`
- `file`: `~/.config/herdr-app/projects/<slug(main)>/post-create.sh`
- `legacy`: `<main>/.herdr/post-create.sh`
- `slug(main)`: replace runs of chars outside `[A-Za-z0-9._-]` with `_`, trim leading/trailing `_`
- Source: derived from each local space's folder; deduplicated by `main`, sorted by `name`.

### Worktree script (file)
- Plain text, run as `sh <file>`. Starter template: shebang, "runs once in each new worktree (cwd = the worktree)", commented env-copy and install examples.
- Editor state: `saved` (disk content or none), current text, `msg` (empty, "Saved", "Failed: ...").
- Status line: dirty when text differs from `saved` (or the template when none exists).
- Resolution order at run time: new file, if non-blank; else legacy file, if non-blank; else skip.

### Worktree space
- A non-remote space whose `folder` starts with `~/.herdr/worktrees/`; checkouts are `<root>/<repo name>/<branch, non-`[A-Za-z0-9._-]` runs as `-`>`.

### Handled record
- localStorage key `ps.done` (owned by `status-usage`): JSON array of worktree folder paths, last 200 kept. Missing or invalid value means "first start".

## State transitions (a worktree folder)
`unseen` -> (first start) `handled, no run`
`unseen` -> (later, git checkout found) `handled` -> script resolved -> `ran: success toast | failed toast | skipped (no script)`
Non-git folder: recorded as handled, skipped.
Runner has a busy flag so polls never overlap.

## Files
- `projects/<slug>/post-create.sh` (gitignored, created on first Save).
- `projects/<slug>/summary-prompt.md` belongs to a different tab (not covered).

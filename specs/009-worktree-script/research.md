# Research: Worktree Script (as-built)

No NEEDS CLARIFICATION items remain; each decision below was read from the code.

## Where the script lives
- **Decision**: `~/.config/herdr-app/projects/<repo>/post-create.sh`, `<repo>` = main checkout path with runs of characters outside `[A-Za-z0-9._-]` turned into `_`, edges trimmed.
- **Rationale**: per-machine setup (env copies, installs) should not be committed; `projects/` is already gitignored (Constitution, runtime state).
- **Alternatives**: `<repo>/.herdr/post-create.sh` (the earlier location) is kept as a read-only fallback for editing and running; committing it would share machine-specific steps.

## Who triggers the run
- **Decision**: a 3-second poll in the status bar mod looks for local spaces under `~/.herdr/worktrees/` not yet recorded.
- **Rationale**: the worktree dialog only opens a space; a watcher decouples creation from setup, so worktrees created by any path into that folder are covered, and shipped mods need no changes.
- **Alternatives**: run from the dialog right after `git worktree add` (misses other creators, blocks the dialog); a git hook (not per-project editable here).

## First start
- **Decision**: when no record exists, mark all current worktree spaces handled and run nothing.
- **Rationale**: avoids retroactive runs over existing checkouts.

## Record of handled folders
- **Decision**: localStorage key `ps.done`, JSON array of folders, last 200 kept; a folder is added before its script runs.
- **Rationale**: simple and per-app; marking first guarantees run-once even on failure or crash.
- **Trade-off**: failed scripts are not retried automatically; accepted and noted in the spec.

## Execution
- **Decision**: run `sh <file>` with the worktree as cwd, wait for exit, toast by exit code; failure body = last 3 lines of stderr (or stdout).
- **Rationale**: no streaming UI needed; toast is enough feedback. No timeout because installs can be long.
- **Alternatives**: run in a visible terminal tab (more transparent but intrusive; not built).

## Project identity
- **Decision**: main checkout path from `git rev-parse --path-format=absolute --git-common-dir`, stripping a trailing `/.git`.
- **Rationale**: all worktrees of a repo resolve to the same project, including from a worktree folder.

## Safe save
- **Decision**: write with the previously loaded text as the expected old content so external edits are detected; creating the folder first.
- **Rationale**: avoids clobbering a script edited elsewhere.

## Two editors
- **Decision**: Project Settings tab is the live editor; `project-scripts` (standalone dialog, same file and template) is retained but unused by the layout.
- **Rationale**: Project Settings groups all per-project settings. The template and slug logic are duplicated in `project-settings`, `project-scripts` and `status-usage/postscripts.js`; keeping them aligned is a manual duty (they are mod-local, not in `lib/`).

## Remote machines
- **Decision**: spaces on other machines are skipped by both the editor project list and the runner.
- **Rationale**: the script file and shell are local to this machine.

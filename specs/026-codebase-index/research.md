# Research: Codebase index in Project Settings

## R1. How to create the index

- **Decision**: `codegraph init <main>` (exec, cwd = main, long timeout). Refresh with `codegraph sync <main>`.
- **Rationale**: user asked for `codegraph init` creating `.codegraph/` inside the project. Probed: on a fresh repo it creates `.codegraph/{.gitignore,codegraph.db}`, builds the index and exits 0 (0.7 s for a tiny repo); it does not touch the project's `.gitignore`.
- **Alternatives**: `codegraph index` (needs an initialized folder); running it in a Herdr terminal (visible progress but leaves a tab behind, harder to read the result).

## R2. Why the exclude entry is needed

- **Decision**: append `.codegraph/` to the repo's local exclude list before `init`.
- **Rationale**: CodeGraph's inner `.gitignore` is `*` + `!.gitignore`, so after init `git status` shows `?? .codegraph/` (probed). One line in the local exclude list hides it; the tracked `.gitignore` stays untouched.
- **Already present** = any non-comment line that, trimmed, is `.codegraph`, `.codegraph/`, `/.codegraph` or `/.codegraph/`.
- **Alternatives**: editing the project `.gitignore` (shared, must be committed — rejected by the user).

## R3. Which exclude file (worktrees)

- **Decision**: `git rev-parse --path-format=absolute --git-path info/exclude` run in the project main folder.
- **Rationale**: returns the common dir's `info/exclude` (probed: same path from the main checkout and a worktree), so one entry covers all worktrees. Folder `info/` may be missing: `mkdir -p` it first.

## R4. State read

- **Decision**: `.codegraph/` presence via `test -d`; details via `codegraph status --json <main>` (`initialized`, `fileCount`, `nodeCount`, `lastIndexed`, `pendingChanges`). Tracked check: `git ls-files -- .codegraph` non-empty. Ignored check: the exclude list has the entry, or `git check-ignore -q .codegraph/` exits 0 (covers a project `.gitignore` that already lists it).
- **Rationale**: `status --json` is ~0.1–0.5 s; parse failure falls back to "indexed, details unknown".

## R5. Finding the `codegraph` command

- **Decision**: try `codegraph --version`; else `~/.local/bin/codegraph --version`; else `zsh -ilc 'command -v codegraph'`. Cache the found path for the mod's life; "missing" is not cached (re-checked on tab open).
- **Rationale**: Herdr's `exec` may not have the login shell's PATH (`lib/markdown.js` uses `zsh -ilc` for `mmdc` for the same reason). Installer puts it in `~/.local/bin`.

## R6. Runs and concurrency

- **Decision**: a module-level `Map(main → Promise)` in `lib/codegraph.js`; a second click while running returns the same promise. The dialog closing does not cancel (exec keeps running); reopening reads the map and shows "Indexing…".
- **Guard**: no action when `main` is `home()` or `/` (CodeGraph refuses them without `--force`).
- **Errors**: show the last non-empty lines of stderr/stdout (ANSI stripped, max 3 lines).

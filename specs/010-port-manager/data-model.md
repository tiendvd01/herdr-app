# Data Model: Port Manager

Nothing is persisted for ports; everything is rebuilt from live system state.

## Entities (in memory, `mods/project-settings/main.js`)

- **Project (`repos[]`, `sel`)**: `{ main, name, file, promptFile, legacy }`. `main` = main checkout path (from `git rev-parse --git-common-dir`), `name` = its folder name. Only `main` and `name` matter for ports.
- **Worktree (`trees[]`)**: `{ path, branch ("(detached)" if none), main: bool, items: Listener[] }`. Sorted main first, then by branch.
- **Listener (`items[]`)**: `{ pid, cmd, port, args, dir, rel, terminal }`. `args` = full command line with home as `~`; `dir` = process working folder; `rel` = folder relative to the worktree ("./" at root); `terminal` = address of the matching app terminal or null. Unique per `pid:port`; sorted by port.

## State

- `tab` ("ports" default), `busy` (scan in flight), `loaded` (first project scan done), `known` (signature of spaces: id, folder, active).
- No `localStorage` key is used by the Ports tab.

## Files

- None read or written by the Ports tab. The same mod uses `~/.config/herdr-app/projects/<repo>/post-create.sh` (spec 009) and `summary-prompt.md` (Summary prompt tab); `projects/` is gitignored.

## Relationships

Project 1..n Worktree 1..n Listener; Listener 0..1 app Terminal (by controlling tty).

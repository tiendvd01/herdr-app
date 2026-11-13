# Research: Port Manager

All unknowns resolved from `mods/project-settings/main.js`.

## Decisions

- **Worktree list from `git worktree list --porcelain`, run in the main checkout.** Rationale: authoritative, includes branch and detached state. Alternative: scanning `~/.herdr/worktrees/`; rejected because it misses worktrees elsewhere.
- **Listeners from `lsof -nP -iTCP -sTCP:LISTEN`; owner folder from `lsof -d cwd`.** Rationale: one tool gives port, pid and cwd; cwd maps a process to a worktree without knowing how it was started. Alternative: matching by command text; unreliable.
- **Worktree match = longest path prefix.** Rationale: handles worktrees nested inside the main checkout.
- **Drop listeners outside all worktrees.** Rationale: the tab is per project; unrelated system ports would be noise.
- **Terminal lookup by controlling tty.** The listener's tty (from `ps`) is compared to the tty of each app terminal's foreground process. Rationale: works for servers started in a terminal, including children. Limitation: servers started detached or elsewhere get no Terminal button.
- **Stop = `kill <pid>` (SIGTERM), no confirmation.** Rationale: graceful and the common intent; the user sees the row vanish. Alternative: SIGKILL or kill process group; rejected as too destructive.
- **Open = `open http://localhost:<port>`.** Rationale: simplest; assumes HTTP.
- **Refresh 3 s only while the tab is shown, plus manual Reload, single in-flight scan (`busy`).** Rationale: avoids running `lsof` constantly when the tab is hidden and avoids overlapping scans.
- **Stale result guard (`this.sel === r`) and swallow errors.** Rationale: switching project mid-scan must not show wrong rows; a transient `lsof` failure should not flash an error.
- **Project list from every local space's folder, rescanned every 5 s but only re-resolved when spaces change.** Rationale: Project Settings is a cross-project page, so it intentionally does not follow only the focused terminal (`lib/space-folder.js`). Spaces on another machine are skipped (no local git/lsof).
- **Home path abbreviated to `~` in commands.** Rationale: shorter, and avoids showing the user name.

## Open questions

None for the as-built spec. Possible future improvement (not specified): a confirmation or force-kill option for Stop.

# Quickstart: Validate the Git Graph Panel

## Automated gate

```sh
cd ~/.config/herdr-app
herdr-app check mods/git-graph      # must pass
herdr-app status                    # layout/focus/overlays/errors
ls layouts/*.error keys.error settings.error programs.error 2>/dev/null   # expect none
herdr-app shot /tmp/git-graph.png   # inspect the Git panel
rg -n "git-graph" scripts/sync-github-lib.sh   # space-folder listed; add panel-ui if missing
```

## Manual scenarios

1. **History**: focus a terminal in a repo with branches; table, labels, branch chip show. Edit a file: dashed top row appears.
2. **Scopes**: toggle All branches / Current and Remotes; list re-reads.
3. **Details and diff**: click a commit, click a file; Esc closes diff, then details.
4. **Create branch**: right-click commit, Create branch, enter `x y` (error), then `x-y` (works, toast, label appears).
5. **Stale guard**: open Delete branch dialog, switch branch in a terminal, confirm; expect the refresh-and-review message.
6. **Checkout**: double-click a branch label; HEAD moves. Double-click a remote-only label; asked for a local name.
7. **Uncommitted**: right-click dashed row; Commit, Stash, Reset, Show in Changes panel (opens Changes).
8. **Manygit**: focus a folder holding several repos; list, dirty counts, Fetch all progress, open a row, back, dropdown switch, row right-click menu.
9. **Settings**: gear; set depth to 9 (box red, unchanged) then 2 (applies); toggle Show tags.
10. **Layout**: drag column edges and details divider; restart; widths persist; panel under 600 wide hides hash.
11. **Update**: in shared state set `git-graph.update.latest.tag` to a higher version; badge appears; Later hides; Stop checking disables.
12. **Cleanup**: no leftover probe mods under `mods/`; `git status` shows no stray files.

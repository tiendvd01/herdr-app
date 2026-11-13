# Quickstart: validate Port Manager

## Automated gate

```sh
herdr-app check mods/project-settings   # must pass
herdr-app status                        # no errors for layout/mods
cat layout.error 2>/dev/null            # should not exist or be empty
herdr-app shot /tmp/ports.png           # PNG of the window for UI review
```

## Manual scenarios

1. Open a git project in a space, create a second worktree (`git worktree add ../wt-b -b b`).
2. In the main checkout run `python3 -m http.server 8801`; in `wt-b` run `python3 -m http.server 8802` (both from an app terminal).
3. Sidebar > Project Settings > Ports. Expect: main card (marked "main", green dot) with 8801, `wt-b` card with 8802; header counts 2 ports across 2 worktrees.
4. Click Terminal on 8802: main view returns and that pane is focused.
5. Click Open on 8801: browser opens http://localhost:8801.
6. Click Stop on 8802: row disappears within 3 s; card shows "No port in use".
7. Start a server in `/tmp` : it must not appear.
8. Switch project in the left column: list resets; with spaces closed expect "No git projects open".
9. Click Reload: label shows "Reloading…" then returns to "Reload".
10. Switch to another tab: scanning stops (no `lsof` runs); return to Ports: list refreshes.

# Quickstart: Validate Branch Switch Popup

## Automated gate

```sh
herdr-app check mods/branch-switch   # must pass
herdr-app status                     # no errors for mods/layout
herdr-app do mod.open '{"name":"branch-switch"}'
herdr-app shot /tmp/branch-switch.png   # inspect the popup
```

Check that no `*.error` file is reported by `herdr-app status`. If `lib/space-folder.js` changed, run `scripts/sync-github-lib.sh` first.

## Manual scenarios (use a scratch git repo with 2+ branches)

1. Click the branch in the status bar: popup opens, input focused, current branch first with a check mark (US1.1).
2. Type part of a name: list filters; Up/Down wraps; Enter switches; toast and status bar update (US1.2, 1.3, 1.6).
3. Pick the current branch: popup closes, nothing changes (US1.4).
4. Add a remote-only branch (`git branch -r` shows it): pick it, a tracking local branch is created (US1.5).
5. Type a new name: Create row appears; Enter creates it from HEAD (US2).
6. Make an uncommitted change that conflicts with another branch, try to switch: red message, popup stays open; edit the filter to clear it (US3.1, 3.4).
7. `git worktree add ../wt other`: `other` is dimmed "other worktree"; picking shows the path (US3.2).
8. Space in a non-git folder or without a folder: message shown, list empty (edge cases).
9. Esc closes the popup at any point.

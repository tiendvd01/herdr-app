# Quickstart: validate the Sessions dialog

## Prerequisites

- Herdr running with at least two Claude Code sessions in different spaces
- `ps` and `hc` on PATH

## Gate

```sh
herdr-app check mods/processes
herdr-app check mods/status-usage
ls mods/processes/*.error mods/status-usage/*.error 2>/dev/null   # expect none
```

## Scenarios

1. **List (US1)**: click the `N proc · CPU% · RAM` badge. Expect all sessions, header totals matching the sum of rows. `herdr-app shot` to capture.
2. **Go (US2)**: click Go on a session in another space; expect focus to move and the dialog to close.
3. **Pause/Stop (US3)**: in a session run `sleep 300`, expand the session, Pause (shows "paused"), Resume, then Stop all; Claude stays open.
4. **Restart (US4)**: click Restart; same conversation returns, then `/compact` is sent. Check `data/restart-session.log` stays empty.
5. **Delete (US5)**: click Delete; row disappears at once and the pane closes.
6. **Empty/Loading**: close all Claude sessions; expect "No Claude sessions running".

## Expected outcomes

Match the acceptance scenarios in [spec.md](spec.md); no `*.error` files appear.

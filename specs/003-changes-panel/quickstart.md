# Quickstart: Validate the Changes Panel

Run from `/Users/tiendvd/.config/herdr-app`. There are no automated tests; the gate is `herdr-app check`.

## Gate

```sh
herdr-app check mods/reviewer     # must pass
herdr-app status                  # layout, overlays, errors
herdr-app shot /tmp/changes.png   # after opening the dialog
```

Then confirm `layout.error`, `keys.error` and `settings.error` do not exist or are empty.

## Manual scenarios

Prepare a scratch git repo with one modified, one new (untracked) and one deleted file, focus a terminal in it, and an agent in the same space.

1. **Open (US1)**: press `cmd-shift-g` or the tab bar Changes button; the 3 files list with A / M / D and counts; first diff is coloured. Press again or Esc to close.
2. **Live refresh**: edit the file in another terminal; the list updates within a second.
3. **Scopes (US2)**: commit on a feature branch; use the scope menu: Uncommitted, Last commit, vs base, a single commit; reopen and confirm the choice is remembered. Check the base branch is disabled on `main`.
4. **Comments (US3)**: click a line, click another to widen, Enter to add; comment on a hunk header; use the file speech-bubble; close and reopen the dialog to confirm drafts persist; switch scope to confirm drafts are per scope; Discard clears.
5. **Submit**: click Submit review; confirm the read-only context, the busy-agent confirmation, delivery to the agent, and that drafts clear.
6. **Ask (US4)**: right-click a line; send; confirm the lines arrive with numbers. With no agent, confirm Start agent.
7. **View (US6)**: toggle Tree, collapse a folder, toggle Split, collapse the diff section; reopen to confirm they persist.
8. **Commit (US7)**: with an empty message Commit is disabled; with a message it commits all including untracked files, clears the field and collapses the diff. Break it (for example a failing hook) to see the error.
9. **Neovim**: click the edit icon; a tab opens at the first changed line; clicking again selects that tab.
10. **Other-mod open (US8)**: `herdr-app do` cannot set shared keys; use the Git panel's file open or an equivalent mod call and confirm the file is selected; a request older than 30 s is ignored.
11. **Edge**: a non-repo folder shows "Not a git repository"; a repo with no commits lists files as added; a repo with over 1,000 changes shows the limit note.

## Docs check

`docs/mods/reviewer.md` must still describe the behaviour (Constitution VI).

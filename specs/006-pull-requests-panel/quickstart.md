# Quickstart: validate the Pull requests panel

## Automated gate

```sh
herdr-app check mods/pr-flow     # must pass
herdr-app status                 # layout, focus, errors
cat layout.error settings.error  # should be absent/empty
herdr-app shot /tmp/pr.png       # PNG of the window for a visual check
herdr-app commands | rg pr-flow  # confirm named commands
```

After editing `lib/` files, run `scripts/sync-github-lib.sh` and re-check `mods/pr-flow` and `mods/inbox`.

## Manual scenarios

Prerequisite: `gh auth status` OK, work account active (`gh auth switch --user tien-sora`).

1. **List (US1)**: focus a terminal in a GitHub repo with your open PRs; open the Pull requests tab. Expect the PR list with status facts. Toggle Merged / Everyone and check counts. Scroll to the end for paging.
2. **Detail (US2)**: Enter on a PR. Check timeline, comments, linked issues, files, description. Escape returns. `o` opens GitHub.
3. **Failed CI**: open a PR with failing CI; log tail shows; click opens the viewer pane with the full log.
4. **Diff and comment (US3)**: click a changed file; click an added line; send a comment; verify on GitHub. Click a hunk row: nothing happens.
5. **Agent (US4)**: with an agent on the PR branch, `g` or Go focuses its terminal.
6. **Post-merge (US5)**: open a recently merged PR; runs appear; expand one.
7. **Merge (US6)**: add `"merge":"squash"` to the block props, press once and wait 4 s (disarms), press twice on a ready PR (merges).
8. **Per-space (US7)**: switch spaces on different repos; each restores its own state. `r` refreshes. Log out of gh and refresh: "GitHub CLI is not ready".
9. **Goto**: from the inbox, click a PR item; the panel opens it.

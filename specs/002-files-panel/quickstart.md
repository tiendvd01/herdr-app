# Quickstart: Validate the Files Panel

## Automated gate

```sh
cd ~/.config/herdr-app
herdr-app check mods/file-icons
herdr-app check mods/open-file
herdr-app status        # no layout/mod errors
ls *.error 2>/dev/null  # none expected
herdr-app shot /tmp/files.png   # inspect the panel
```

## Manual scenarios (from spec.md)

1. Focus a terminal in a git repo: tree shows folders first, icons, M/A/D/U marks, dimmed ignored files (US1).
2. Expand and collapse a nested folder; focus another terminal and confirm the tree switches (US1).
3. Click a file: new tab opens, stays on the file after focus moves; edit it elsewhere and wait about 10 s for the update (US2).
4. Open a binary file and a huge file: message / truncation note (US2).
5. Type two words in "Search files…": matches, "No matching files", clear query returns tree (US3).
6. Open a `.md` with a diagram: Preview/Source chips, scroll, switch tabs, scroll kept; open diagram zoom (US4).
7. Click the pencil on a row: Neovim tab opens, no viewer tab (US5).
8. cmd-p: type a name, arrows, Enter; type `~/` and Tab into a folder; type a bad path for "No such folder"; Esc closes (US6).
9. In a remote space, repeat 1 to 3 to confirm listing and reading on the remote machine.

## Clean-up
Remove any probe mod created while testing (Constitution: no leftover probe mods).

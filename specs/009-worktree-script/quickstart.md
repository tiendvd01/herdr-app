# Quickstart: Worktree Script validation

## Gates
```sh
herdr-app check mods/project-settings
herdr-app check mods/my-worktree
herdr-app check mods/project-scripts
herdr-app check mods/status-usage
herdr-app status          # no errors for the mods above
herdr-app shot /tmp/pset.png   # Project Settings > Worktree script tab open
```
Also confirm `projects/` is still in `.gitignore` and `layout.error` is absent.

## Manual scenarios
1. **Edit + save**: open Project Settings (sidebar), pick a project, tab "Worktree script". Template and "No script yet" show. Type `touch .post-create-ran`, Save: "Saved". Revert after another edit restores the saved text. File exists at `~/.config/herdr-app/projects/<repo>/post-create.sh`.
2. **Conflict**: edit the file in another editor, then Save here: "Failed: ..." in red, file untouched.
3. **Run once**: open the New worktree dialog on a project space, type `test/ps-check`, Enter. A space opens at `~/.herdr/worktrees/<repo>/test-ps-check`; within a few seconds `.post-create-ran` exists there and a "Post-create script done" toast shows. Restart the app: it does not run again.
4. **Failure**: change the script to `echo boom; exit 1`, create another worktree: error toast with the last lines.
5. **No script / blank**: empty the file, create a worktree: no toast.
6. **Legacy fallback**: delete the new file, put a script at `<repo>/.herdr/post-create.sh`: editor shows it; a new worktree runs it.
7. **First start**: remove `ps.done` from the status-usage localStorage and restart: no toasts for existing worktrees.
8. **Refusals**: pick a branch already checked out: dialog message, nothing created.

Cleanup: remove test worktrees (`Remove worktree` dialog) and test branches.

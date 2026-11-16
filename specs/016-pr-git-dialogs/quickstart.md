# Quickstart: verify Pull requests and Git graph dialogs

## Gate

```sh
herdr-app check mods/pr-flow
herdr-app check mods/git-graph
herdr-app check mods/my-tabs
herdr-app check mods/inbox
cat layout.error 2>/dev/null   # must not exist / be empty
herdr-app status               # no mod errors
```

## Scenarios

1. **Pull requests dialog** — `herdr-app do mod.open '{"name":"pr-flow"}'` (or click the tab bar button). Expect a 75%×80% dialog, right panel width unchanged, button "on". `herdr-app shot /tmp/…/prs.png`. Run `mod.open` again → closed, button off.
2. **Git dialog** — same with `git-graph`. Right-click a commit → menu popup above the dialog; pick an action needing confirm → confirm dialog above. Esc closes only the top one.
3. **Border** — shots of Changes (`reviewer`), Pull requests and Git dialogs: one border line, radius 10, shadow; corners clipped. Repeat after switching to a light/dark theme.
4. **Panel** — Files and Issues still open in the right panel; no Git / Pull requests children (`herdr-app status` layout).
5. **Inbox** — click a PR entry → Pull requests dialog opens on that PR; click another PR while open → stays open, switches PR.
6. **Viewer** — in the Pull requests dialog open a file diff → dialog closes, viewer pane visible; reopen Pull requests → same PR shown.

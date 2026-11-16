# Quickstart: verify the UI kit

```sh
sh scripts/sync-github-lib.sh
for m in ui-gallery file-icons reviewer issues git-graph pr-flow mermaid-board my-tabs project-settings inbox status-usage branch-switch; do herdr-app check mods/$m; done
herdr-app status
```

1. `herdr-app do mod.open '{"name":"ui-gallery"}'` → shot: every kind × size × state, surfaces, motion demos.
2. Hover / press buttons in the gallery: highlight fades in, press dips; disabled does nothing; busy spins.
3. Switch to a light theme and shot the gallery again: all states readable.
4. Shot the tab bar, a right panel, Project Settings, inbox, status bar, branch switcher: buttons match the gallery.
5. Click through each adopted screen's actions: nothing lost.

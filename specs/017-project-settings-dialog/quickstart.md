# Quickstart: verify Project Settings dialog

```sh
herdr-app check mods/project-settings
herdr-app check mods/my-chrome
herdr-app check mods/my-new-menu
herdr-app status          # no errors; layout content stack has no project-settings child
```

1. `herdr-app do mod.open '{"name":"project-settings"}'` → dialog 75%×80%, tab behind unchanged; shot; again → closed.
2. Sidebar footer Project Settings row: click → open, row "on"; Esc → closed, row off.
3. + menu → "Project skills…" → dialog on Skills for the current project.
4. Ports tab → click a terminal → dialog closes, that terminal focused.
5. Shot next to the Changes dialog: same size, radius, one border, shadow.

# Quickstart: validate One Shared Skills Folder per Project

## Gate

```sh
cd ~/.config/herdr-app
sh scripts/sync-github-lib.sh
herdr-app check mods/project-settings
herdr-app check mods/my-new-menu
herdr-app status
```

## Scenarios

1. **Flip updates the folder (US1)**: in Project Settings › Skills turn on a skill. `ls -l projects/<slug>/claude-plugin/skills/` shows its link within a second; turn it off → link gone; `git status skills/ mcp/` unchanged.
2. **Same folder every launch (US2)**: start `Claude · N skills` twice. `ps -axww -o args= | rg plugin-dir` shows the same `projects/<slug>/claude-plugin` path for both; no `claude-sessions/<new stamp>` appears.
3. **Self-heal at launch**: `rm -rf projects/<slug>/claude-plugin`, launch from the + menu → folder recreated, session lists the skills that are on.
4. **Dangling skill**: move a turned-on skill out of `skills/`, press Refresh → its link is gone and it shows missing; launch → warning toast names it.
5. **Leftover clean-up (US3)**: with an old `claude-sessions/<stamp>` folder and no session using it, flip any switch → folder removed (and `claude-sessions/` when empty). With a session still started from it, it stays.
6. **Non-link kept**: `mkdir projects/<slug>/claude-plugin/skills/handmade`, flip a switch → `handmade` still there, status reports it.

# Quickstart: validate Per-Project Skills

No test suite in this repo; validation is `herdr-app check` plus the manual scenarios below.

## Gate

```sh
cd ~/.config/herdr-app
sh scripts/sync-github-lib.sh
herdr-app check mods/project-settings
herdr-app check mods/my-new-menu
herdr-app status            # no errors from files/mods
```

## Setup

```sh
mkdir -p ~/.config/herdr-app/skills/qs-alpha ~/.config/herdr-app/skills/qs-beta ~/.config/herdr-app/mcp
printf -- '---\nname: qs-alpha\ndescription: Quickstart skill alpha.\n---\nSay ALPHA.\n' > ~/.config/herdr-app/skills/qs-alpha/SKILL.md
printf -- '---\nname: qs-beta\ndescription: Quickstart skill beta.\n---\nSay BETA.\n' > ~/.config/herdr-app/skills/qs-beta/SKILL.md
```

## Scenarios

1. **Toggle (Story 1)**: open Project Settings › Skills for a repo; both skills listed, off. Turn on `qs-alpha`. Expect `projects/<slug>/skills.json` lists it; no launch folder is created yet.
2. **Persistence**: restart Herdr; `qs-alpha` still on; another repo shows it off.
3. **Launch (Story 2)**: open + menu → `Claude · 1 skill`. Expect a new `projects/<slug>/claude-sessions/<stamp>/skills/qs-alpha` symlink; in the session run `/skills`: `herdr-<repo>:qs-alpha` present, `qs-beta` absent.
3b. **Running session unchanged (FR-010)**: with that session open, turn `qs-alpha` off; its launch folder still has the link. Start a second session: no `qs-alpha`. Close the first session, launch again after 2 min: the first launch folder is gone.
4. **Library untouched (SC-005)**: `git status skills/ mcp/` and `ls -l ~/.claude/skills` unchanged after flipping switches.
5. **Dangling skill**: `mv skills/qs-alpha /tmp/`, start from + menu → warning toast names `qs-alpha`; session starts. Move it back → next launch includes it.
6. **Plain Claude & shortcuts (FR-006)**: + menu digit `1..n` still start the same agents; plain Claude has no `--plugin-dir` (`ps -o args= -p <pid>`).
7. **Open Skills tab from menu**: in a repo with nothing on, + menu shows `Project skills…` and opens the tab.

## Cleanup

```sh
rm -rf ~/.config/herdr-app/skills/qs-alpha ~/.config/herdr-app/skills/qs-beta
```

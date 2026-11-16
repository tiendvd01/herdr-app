# Quickstart: validate the move to `.agents/skills/`

Run from `~/.config/herdr-app`. `APP=$HOME/.config/herdr-app`.

## 0. Snapshot before

```sh
ls skills | sort > /tmp/lib-before.txt             # 41 entries + .gitkeep is hidden
for f in projects/*/skills.json; do echo "$f"; cat "$f"; done > /tmp/sel-before.txt
(cd skills && find . -type f -exec shasum {} + | sort -k2) > /tmp/sum-before.txt
```

## 1. Dry run, then run

```sh
node scripts/migrate-agents-skills.mjs --dry-run   # report only, git status unchanged
node scripts/migrate-agents-skills.mjs             # exit 0, "moved 41 skills"
```

## 2. Library (US2, SC-001)

```sh
test ! -e skills && echo "old folder gone"
diff <(ls .agents/skills | sort) /tmp/lib-before.txt
diff <(cd .agents/skills && find . -type f -exec shasum {} + | sort -k2) /tmp/sum-before.txt
git add -A skills .agents/skills && git diff --cached -M --stat | tail -1   # renames only, 0 insertions/deletions for moved files
```

## 3. Projects (US2, SC-002)

```sh
diff <(for f in projects/*/skills.json; do echo "$f"; cat "$f"; done) /tmp/sel-before.txt   # no output
find projects/*/claude-plugin/skills -type l ! -exec test -e {} \; -print                     # no broken links
find projects/*/claude-plugin/skills -type l -exec readlink {} \; | rg -v '/\.agents/skills/'  # no output
```

A Claude session started before the run: ask it to list its skills; the `delivery-*` ones are still there.

## 4. CLI (US1, SC-003/004)

```sh
npx skills ls -a universal          # 6 ponytail skills under ./.agents/skills
npx skills add <some/small-skill-repo> -s '*' -a universal -y
```
Open Project Settings › Skills: the new skill is listed; switch it on; start `Claude · N skills` from the + menu; it is available. Remove it with `npx skills remove <name> -y` (no `-a`).

## 5. UI and notes (US3, SC-006)

- Skills tab path line reads `~/.config/herdr-app/.agents/skills  ·  ~/.config/herdr-app/mcp`; "Open folder" opens `.agents/skills`.
- `herdr-app check mods/project-settings` and `herdr-app check mods/my-new-menu` pass; `herdr-app status` shows no mod errors.
- `rg -n 'herdr-app/skills|openclaw' CLAUDE.md lib mods/project-settings mods/my-new-menu` → no output.

## 6. Repeat (SC-005)

```sh
node scripts/migrate-agents-skills.mjs   # "nothing to move", every project relinked 0 / removed 0 / created 0
git status --short                       # unchanged by this run
```

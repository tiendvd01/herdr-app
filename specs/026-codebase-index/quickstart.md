# Quickstart: verify the codebase index tab

1. `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` → all pass (incl. `codegraph.test.mjs`).
2. `bash scripts/sync-github-lib.sh` then `herdr-app check mods/project-settings` → ok; `node scripts/check-dialog-frames.mjs` → `dialog frames ok`.
3. Make a test repo: `git init` a folder with one JS file, open a Herdr terminal in it.
4. `herdr-app do mod.open '{"name":"project-settings"}'`, pick the repo, tab **Index** → "Not indexed" + **Index codebase**. `herdr-app shot`.
5. Press it → "Indexing…", then counts + last index time. In the repo: `ls .codegraph` exists, `git status --short` is empty, `tail -1 .git/info/exclude` is `.codegraph/`.
6. Press **Update index** → time moves. Exclude still has one `.codegraph` line.
7. Delete the exclude line → tab shows "Not ignored by git" + **Ignore in git**; press it → line back.
8. Open this repo (`~/.config/herdr-app`, already indexed): tab shows its counts, no create button.

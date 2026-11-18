# Quickstart: Project Claude Memory

1. `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` — all pass (incl. `claude-memory`).
2. `herdr-app check mods/project-settings` — passes; `node scripts/check-dialog-frames.mjs` → `dialog frames ok`.
3. Open Project Settings (sidebar footer), pick `herdr-app`, tab **Memory**: 2 notes listed
   (`no-probe-mods`, `speckit-run-through`), path `~/.claude/projects/-Users-…-herdr-app/memory`,
   no index warning. `herdr-app shot` to look.
4. Scratch test on a throwaway project folder's memory (e.g. a temp git repo opened in a space):
   add note `probe-note` → file + one `MEMORY.md` line; edit + Save → file changes; append text to the
   file from a shell then Save in the tab → refused as changed; Delete → file and line gone.
5. Create `x.md` by hand in that folder → flagged "not in index", Add to index fixes it; add a
   `MEMORY.md` line to `gone.md` → flagged dead, Remove line fixes it.
6. Remove the temp repo's memory folder afterwards.

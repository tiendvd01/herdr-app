# Quickstart: Claude Threads per Space

1. `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` — all pass, including `claude-threads`.
2. `herdr-app check mods/threads` and `herdr-app check mods/my-tabs` — pass; `cat layout.error` empty.
3. `herdr-app do layout.select '{"stack":"panel-body","child":"threads"}'; herdr-app do layout.show '{"id":"panel"}'`,
   then `herdr-app shot` — the panel lists this folder's threads, newest first, the current session marked running.
4. Click the Threads button in the tab bar twice — the panel shows, then hides.
5. Click an idle thread — a new tab in the same space runs `claude --resume <id>` in that folder.
6. Click the running thread — focus moves to its tab, no new tab.
7. Type in search — list narrows, header shows `shown / total`.
8. `node scripts/check-dialog-frames.mjs` — `dialog frames ok` (no dialog added).

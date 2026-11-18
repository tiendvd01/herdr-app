# Quickstart: check the feature

1. `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` — all pass.
2. `herdr-app check mods/my-agents`, `mods/my-tabs`, `mods/processes` — all pass; `node scripts/check-dialog-frames.mjs` prints `dialog frames ok`.
3. Open two Claude tabs from the + menu, ask each something different. After the answer: sidebar row, tab label and Sessions dialog (status bar proc badge) show the same name per session (`herdr-app shot`).
4. In one session run `/rename Auth refactor`; within ~5 s all three show "Auth refactor".
5. Double-click a tab, rename to "review PR 12"; all three show it. Rename to empty; all three return to the session title.
6. Resume a thread from the Threads panel, then `/rename` it; the tab follows the new name.
7. Sessions dialog second line shows only the space for unnamed tabs.

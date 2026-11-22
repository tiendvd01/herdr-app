# Quickstart: 037

1. `herdr-app check mods/inbox` passes; `layout.error` absent; `node scripts/check-dialog-frames.mjs` prints `dialog frames ok`.
2. `herdr-app shot`: the sidebar has Spaces + Agents only; a small Inbox button at the bottom-right of the terminal area.
3. `herdr-app do mod.open '{"name":"inbox"}'` → dialog with the list (or empty state); shot shows one frame. Run again → closes.
4. Let an agent finish: no new entry, count unchanged.
5. Drag the button to the top edge; restart the app; it is still there.

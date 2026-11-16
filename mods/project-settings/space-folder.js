// GENERATED from lib/space-folder.js by scripts/sync-github-lib.sh. Do not edit here.
// The folder a space's panels read: the focused terminal's folder when it is in
// that space, else its first terminal's folder, else Herdr's space.folder. It
// follows a terminal's `cd`; nothing is pinned.
import { spaces, panes, focused } from "herdr";

// The first terminal's live folder in a space. Pass a panes() snapshot when calling in a loop.
export function firstTerminalFolder(space, paneList = panes()) {
  const tabs = new Set((space?.tabs ?? []).map((t) => t.id));
  return paneList.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || null;
}

/** The folder of a space (object or id), or null. */
export function spaceFolder(space, paneList = panes()) {
  if (typeof space === "string") space = spaces().find((s) => s.id === space);
  if (!space) return null;
  const tabs = new Set((space.tabs ?? []).map((t) => t.id));
  const here = paneList.find((p) => p.focused && tabs.has(p.tab))?.cwd;
  return here || firstTerminalFolder(space, paneList) || space.folder || null;
}

// The last terminal place seen in each space: a focused mod pane (a file viewer tab, ...)
// has no folder of its own (focused().cwd is then Herdr's home), so it keeps this one.
const lastPlace = new Map();

/** The shown space and the focused terminal's folder, on its machine: { space, cwd, on }.
 *  While a mod pane is focused it stays on the space's last focused terminal. */
export function activePlace() {
  const space = spaces().find((s) => s.active) ?? null, f = focused();
  const list = panes(), pane = f?.pane ? list.find((p) => p.pane === f.pane) : null;
  if (pane && !pane.terminal) {
    const last = space && lastPlace.get(space.id);
    if (last) return { space, ...last };
    const term = space && list.find((p) => p.terminal && p.cwd && (space.tabs ?? []).some((t) => t.id === p.tab));
    return { space, cwd: term?.cwd || space?.folder || null, on: space?.machine ?? null };
  }
  const on = f?.pane === null ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null) : space?.machine ?? null;
  const cwd = pane?.cwd || f?.cwd || space?.folder || null;
  if (space && pane?.cwd) lastPlace.set(space.id, { cwd, on });
  return { space, cwd, on };
}

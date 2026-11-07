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

/** The shown space and the focused pane's folder, on its machine: { space, cwd, on }. */
export function activePlace() {
  const space = spaces().find((s) => s.active) ?? null, f = focused();
  const pane = f?.pane ? panes().find((p) => p.pane === f.pane) : null;
  const on = f?.pane === null ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null) : space?.machine ?? null;
  return { space, cwd: pane?.cwd || f?.cwd || space?.folder || null, on };
}

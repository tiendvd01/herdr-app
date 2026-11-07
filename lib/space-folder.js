// A space's fixed folder. Herdr's own idea of where a space is follows its
// terminals' `cd`; this one is pinned once and stays, so the panels (Files,
// Changes, Issues, Git, Pull requests) keep showing the same project whatever
// a tab has cd'd into. Kept in shared("space.folders"): { [space id]: folder }.
//
// Pinned the first time a space shows a terminal folder: its first terminal's
// folder then (what Herdr names an unnamed space after). Until then, and for
// spaces with no terminal, the same live guess is used. Change it from the
// space's right-click menu (my-menu: "Use this folder" / "Choose folder…").
import { shared, setShared, spaces, panes } from "herdr";

export const SPACE_FOLDERS = "space.folders";

const pinned = () => /** @type {Record<string, string>} */ (shared(SPACE_FOLDERS) ?? {});

// The first terminal's live folder in a space. Pass a panes() snapshot when calling in a loop.
export function firstTerminalFolder(space, paneList = panes()) {
  const tabs = new Set((space?.tabs ?? []).map((t) => t.id));
  return paneList.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || null;
}

/** The fixed folder of a space (object or id), or null. */
export function spaceFolder(space, paneList) {
  if (typeof space === "string") space = spaces().find((s) => s.id === space);
  if (!space) return null;
  return pinned()[space.id] || firstTerminalFolder(space, paneList) || space.folder || null;
}

/** The shown space and its fixed folder: { space, cwd, on }. */
export function activePlace() {
  const space = spaces().find((s) => s.active) ?? null;
  return { space, cwd: spaceFolder(space), on: space?.machine ?? null };
}

/** Pins (or with a falsy folder, unpins) a space's folder. */
export function setSpaceFolder(id, folder) {
  const next = { ...pinned() };
  if (folder) next[id] = folder.replace(/(.)[/\\]+$/, "$1");
  else delete next[id];
  setShared(SPACE_FOLDERS, next);
}

/** Pins every space that shows a terminal folder and has none yet. Call from a timer, never from render. */
export function pinSpaceFolders() {
  const map = pinned(), ps = panes();
  let next = null;
  for (const s of spaces()) {
    if (map[s.id]) continue;
    const f = firstTerminalFolder(s, ps);
    if (f) (next ??= { ...map })[s.id] = f;
  }
  if (next) setShared(SPACE_FOLDERS, next);
}

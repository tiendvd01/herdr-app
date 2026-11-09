// Keep the selected terminal's live folder, including layout terminal blocks.
export function folderContext(focus, allPanes, allSpaces, userHome) {
  const space = allSpaces.find(space => space.id === focus?.space) || allSpaces.find(space => space.active);
  const terminal = allPanes.find(pane => pane.tab === focus?.tab && pane.terminal && pane.cwd && pane.focused)
    || allPanes.find(pane => pane.tab === focus?.tab && pane.terminal && pane.cwd);
  const address = focus?.shown || focus?.terminal;
  const on = address ? (address.includes("/") ? address.split("/")[0] : null) : space?.machine || null;
  return { cwd: focus?.cwd || terminal?.cwd || space?.folder || userHome, on };
}

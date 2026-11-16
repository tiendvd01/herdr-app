# Research: Pull requests and Git graph as dialogs

## R1. How to open a mod as a toggleable dialog

- **Decision**: `mod.json` → `"overlay": { "kind": "dialog", "width": 0.75, "height": 0.8, "frame": "none" }`, opened with `run("mod.open", { name })`.
- **Rationale**: `mod.open {name}` opens the overlay described in `mod.json` and closes it when called again (AGENTS.md). Width/height up to 1 are a share of the window. This is exactly how `reviewer` (Changes) works, so the three dialogs look and behave the same.
- **Alternatives**: `openOverlay()` from `my-tabs` — needs its own toggle bookkeeping and the tab bar can't see an Esc close.

## R2. Knowing whether a dialog is open (tab bar "on" state)

- **Decision**: the mod sets `setShared("<mod>.dialog", props().overlay)` in `init` when it has an overlay id (and is the main view, not a sub-role), and clears it in `async close()` if the stored id is its own. `my-tabs` reads `shared("<mod>.dialog") != null`.
- **Rationale**: Herdr has no "list overlays" API; `close()` runs for overlay ends including Esc. Same as `reviewer.dialog`.
- **Stale value**: if the app is killed while open, the key stays set; the next `mod.open` creates a new copy which overwrites it, and its close clears it. Accepted (same as Changes).

## R3. Border in a dialog ("check border")

- **Findings**:
  - Changes: `frame: "none"` + root `rounded(10).overflow_hidden().border_1().border_color(t.border).shadow_lg()`.
  - Pull requests root: `rounded(10).overflow_hidden().border_1().border_color(t.border)` — no shadow; with Herdr's default dialog frame this would be a double border.
  - Git graph root: `rounded(paneFrame(layout())?.radius ?? 0)…border_1()` — radius comes from the window layout's pane frame, not from the dialog; no shadow.
- **Decision**: both dialogs use `frame: "none"`; when `props().overlay != null` the root adds `shadow_lg()` and (git-graph) uses radius 10. One border line, same radius/shadow as Changes, content clipped by `overflow_hidden`.
- **Alternatives**: Herdr frame + remove the mod's border — the panel copy needs the border, and corners would still differ from Changes.

## R4. Git graph sub-overlays

- **Finding**: `git-graph` opens itself again for `role: menu | dialog | update | settings` with explicit `openOverlay` sizes; `main.js` dispatches on `props().role`.
- **Decision**: only the role-less copy (the Graph) sets `git-graph.dialog` / draws the dialog frame. Explicit `openOverlay` specs keep their own kind/size; confirm with `herdr-app shot` that a confirm dialog shows above the graph dialog with Herdr's frame (it passes no `frame`).
- **Upstream note**: the diff to `git-graph` is: overlay block in `mod.json`, `close()` in `main.js`, the dialog flag + frame in `graph.js`. Re-apply after an upstream update (`update.js` prompts an agent to update from github.com/rabeeh-ta/herdr-git-graph).

## R5. Pull requests viewer pane opened from the dialog

- **Finding**: `openViewer()` splits a pane / opens a tab with `screen: "viewer"`. Behind a dimming dialog it would be invisible.
- **Decision**: when the copy is the dialog, opening the viewer also remembers the open PR in `pr-flow.goto` and closes the dialog, so the viewer is visible and reopening Pull requests lands on the same PR.
- **Alternatives**: keep the dialog open (viewer hidden — bad); render the diff inside the dialog (scope creep).

## R6. Inbox → PR

- **Decision**: `setShared("pr-flow.goto", …)`, then `run("mod.open", { name: "pr-flow" })` only when `shared("pr-flow.dialog") == null` (a second `mod.open` would close it). The new copy's `takeGoto` picks the goto up on first render.

## R7. Panel memory per space

- **Finding**: `my-tabs.syncPanel` restores a stored panel only if it's in the `enabled` list, else hides the panel.
- **Decision**: drop `graph` and `prs` from `enabled`; spaces that remembered them fall back to a hidden panel (FR-010) with no migration.

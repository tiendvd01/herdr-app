# Research: Git Graph Panel

No NEEDS CLARIFICATION remain; each decision below was read from the code.

## R1. One mod, many roles
- **Decision**: a single mod serves graph, menu, dialog, update and settings, chosen by `props.role`.
- **Rationale**: overlays are opened as `{ mod: "git-graph", props }`, sharing code with the panel.
- **Alternatives**: separate mods per role (more folders, duplicated helpers); rejected.

## R2. Actions run only against the snapshot the user saw
- **Decision**: before every mutating command, compare HEAD and current branch to the menu's snapshot; refuse on mismatch or if git cannot tell. Conflict check before "stage everything".
- **Rationale**: git has no transaction across terminals; this detects an already changed context.
- **Alternatives**: lock the repo (impossible), or run blind (unsafe).

## R3. State location
- **Decision**: cross-copy settings and tokens in Herdr shared state (`git-graph.*`); per-view state in the instance; only the details-pane height in `localStorage`.
- **Rationale**: several copies (panel, pane) and popups must see settings and change events at once; `localStorage` is per-mod-instance.
- **Alternatives**: all in `localStorage` per the constitution's per-space guidance; rejected because popups/dialogs are separate instances that need to notify graphs.

## R4. Staying fresh
- **Decision**: folder watch on git refs for local folders, 15-second poll for remote spaces and the Manygit list, a shared `git-graph.changed` token after each action, read-ahead of other spaces' folders, 24 remembered folders.
- **Rationale**: remote folders cannot be watched; working-tree edits do not touch git's folder.
- **Alternatives**: poll everywhere (wasteful), manual refresh only (stale).

## R5. Safe reads and fetches
- **Decision**: reads use `--no-optional-locks`, no fsmonitor, no index auto refresh; fetch runs with credential prompts disabled; pull is fast-forward only.
- **Rationale**: the panel must never block or surprise the user's own git.
- **Alternatives**: default git flags; rejected.

## R6. Shared files
- **Decision**: `space-folder.js` and `panel-ui.js` are synced copies; `space-folder.js` is listed in `scripts/sync-github-lib.sh`. Whether `panel-ui.js` for git-graph is listed was not confirmed in the script; verify in the quickstart and add if missing.
- **Rationale**: Constitution II.

## R7. Documentation gap
- **Decision**: create `docs/mods/git-graph.md` as the follow-up (Principle VI); not done in this feature's documentation pass.

## R8. Update check
- **Decision**: one unauthenticated GET per day to the releases API of the upstream repo, result saved in shared state, off switch persisted.
- **Rationale**: third-party mod needs a nudge; privacy preserved (nothing about the user sent).
- **Alternatives**: no check (users miss updates); auto-update (violates "ask an agent").

## R9. Zoom handling
- **Decision**: detect Herdr 0.1.12 or newer once and scale rows/lines accordingly.
- **Rationale**: newer Herdr zooms lists itself; older needs manual pixel scaling.

# Research: One Shared Skills Folder per Project

No open unknowns. Decisions below build on feature 012's research (`specs/012-space-skillsets/research.md`), which stays valid for R1–R6, R8–R10; R7 (per-launch folders) is replaced here.

## D1. Update the shared folder in place, not by wiping it

- **Decision**: `syncBundle` compares what is in `projects/<slug>/claude-plugin/skills/` with the selection: removes only links that are no longer wanted or point elsewhere, adds only missing links (`ln -sfn`), leaves untouched links alone. `plugin.json` and `.mcp.json` are written only when their text changes; `.mcp.json` is removed when no server is on.
- **Rationale**: running sessions share the folder (accepted in the spec), so a full wipe-and-recreate would make every skill vanish for a moment in every session on each flip. An in-place diff touches only what changed.
- **Alternatives considered**: full rebuild (simpler, but the momentary gap above); per-launch folders (feature 012, what this feature removes).

## D2. When the folder is synced

- **Decision**: on every switch flip (after the selection is saved), on Refresh in the Skills tab, and right before every + menu launch.
- **Rationale**: flip = FR-002; launch = Story 2 scenario 2 (folder deleted by hand or library changed since); Refresh = Story 1 scenario 5 (drop links to skills gone from the library).

## D3. Clean up feature 012 leftovers

- **Decision**: `pruneLegacy(project)` runs after every sync: for each `claude-sessions/<stamp>` folder, remove it with `rm -rf` when no line of `ps -axww -o args=` contains its path; then `rmdir claude-sessions` if empty. If `ps` fails, remove nothing.
- **Rationale**: same in-use test feature 012 already relied on (verified: a running `claude --plugin-dir <path>` shows the path). No new folders are created, so the 2-minute "launch in flight" guard is no longer needed.
- **Note**: once no machine has `claude-sessions/` left, this step is dead code and can be deleted in a later change.

## D4. Non-link entries inside `skills/`

- **Decision**: entries that are not symlinks (found with `find … -type l` vs all entries) are never removed; they are reported as skipped with reason "not a link, left alone", and a wanted skill with that name is not linked.
- **Rationale**: FR-007; the folder is generated, but a hand-made folder there must never be deleted.

## D5. Messages

- **Decision**: tab status after a flip: "Saved · applies to Claude sessions of this project", plus "; skipped …" when the toggled item could not be linked. Launch keeps feature 012's warning toast for skipped items.

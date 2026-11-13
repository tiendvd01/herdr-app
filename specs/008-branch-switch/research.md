# Research: Branch Switch Popup

No NEEDS CLARIFICATION remain; decisions below are read from the code.

## Folder to act on
- **Decision**: `spaceFolder(activeSpace)` (focused terminal's folder, else first terminal, else `space.folder`); git runs on the space's machine.
- **Rationale**: matches status bar and panels, so the branch shown is the branch switched.
- **Alternatives**: a pinned per-space folder (removed repo-wide); Herdr's `space.folder` only (ignores `cd`).

## Listing branches
- **Decision**: one `git for-each-ref --sort=-committerdate` over `refs/heads` and `refs/remotes`; local first, remote-only deduplicated by name, `*/HEAD` dropped; current branch sorted to the top.
- **Rationale**: single fast call, newest-first matches what users want; showing the current branch first anchors the list.
- **Alternatives**: `git branch -a` parsing (fragile, no dates); fetching first (slow, network).

## Switching
- **Decision**: `git switch <name>`, `git switch --track <remote>/<name>`, `git switch -c <name>`.
- **Rationale**: `switch` is the narrow, safe command; git's own refusals (dirty tree) are surfaced verbatim, so no custom conflict logic.
- **Alternatives**: `checkout` (overloaded semantics); auto-stash (hidden side effects).

## Other-worktree branches
- **Decision**: parse `git worktree list --porcelain`, excluding the current top-level, and block those branches in the UI with the path.
- **Rationale**: git would refuse anyway; a pre-check gives a clearer message and dims the row.
- **Alternatives**: let git error (works but noisier, no dimming).

## Refreshing the status bar
- **Decision**: `setShared("branch.switched", Date.now())`; status-usage polls that key every 500 ms and re-reads the branch.
- **Rationale**: decouples the mods; per-3s polling alone would feel laggy.
- **Alternatives**: direct mod-to-mod call (not available); waiting for the poll.

## Persistence
- **Decision**: none. The popup is stateless and rebuilt on every open.
- **Rationale**: nothing to remember; avoids stale lists.

## Focus
- **Decision**: focus the input on open and again after 300 ms (`cx.timer.after`).
- **Rationale**: overlay focus can be taken after mount.

# Data Model: Git Graph Panel

## Entities

- **Commit**: `hash`, `parents[]`, `subject`, `author`, date, `refs`/labels, `uncommitted?`. The uncommitted commit uses the marker `*` and parent HEAD.
- **Row layout**: lane index, `segments [fromLane, fromY, toLane, toY, colorLane, dashed]`, colour = lane mod 12 palette.
- **Label**: `kind` (head, branch, remote, tag), `name`; width estimated for hit-testing double-clicks.
- **Repository context (ctx)**: `root`, `on` (machine or null), `head`, `current` (branch or null), `branches[]`, `remotes[]`. Passed to menus, dialogs and executor.
- **Action**: `{ type, ...target }` (checkout, checkoutRemote, checkoutCommit, createBranch, addTag, renameBranch, deleteBranch, deleteRemoteBranch, deleteTag, merge, rebase, cherryPick, revert, reset, push, pushTag, commit, pull, stash, resetUncommitted, fetch, plus non-git: newTab, openUrl, copy, showChanges).
- **Dialog spec**: title, detail, inputs, choice (radio), checks, confirm, `danger`.
- **Manygit workspace**: `root`, `repos[{path,name,group}]`, per-repo status (`branch`, `detached`, `upstream`, `ahead`, `behind`, `dirty`, `staged`, `gone`, `tag`, `hasRemote`, `error`), fetch errors, fetch-all run `{root, done, total, failed}`.
- **Commit details**: author, email, committer, committed time, message, files `{path,status,added,removed,staged,untracked}` (max 500, plus `more` count).
- **Folder view**: kept per folder key `{cwd,on}` (max 24).

## State and persistence

| Where | Key | Content | Notes |
|---|---|---|---|
| localStorage | `detailsH` | details pane height (default 320) | try/catch guarded |
| shared | `git-graph.columns` | widths for graph/date/author/hash | all copies sync |
| shared | `git-graph.depth` | Manygit scan depth 1 to 5 (default 3) | invalid falls back to 3 |
| shared | `git-graph.tags` | show newest tag | boolean |
| shared | `git-graph.update` | `{repo, checked, latest{tag,notes,url}, dismissed, off}` | once a day |
| shared | `git-graph.changed` | timestamp after any action | refresh trigger |
| shared | `git-graph.fetched` | `{root, at}` | clears a row's fetch error |
| shared (read) | `reviewer.dialog`, `new-menu.agents` | owned by other mods | read only |
| memory | `seen` (24), `commitDetails` (200), `statuses`, `fetchErrors` | caches | lost on reload |

## Relationships and transitions

- Panel states: `nofolder` -> `norepo` / `workspace` / `empty` / `ready` / `error`, with `loading` between.
- Selecting a commit: none -> details -> diff; Esc steps back in reverse, then back to Manygit.
- Action: menu -> (dialog) -> executor (snapshot check -> commands) -> toast -> `changed` token -> refresh.

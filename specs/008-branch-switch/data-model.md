# Data Model: Branch Switch Popup

No persisted state: no `localStorage` keys, no files. State lives in the view while the popup is open.

## Entities

- **Branch**: `{ name, ref, remote, at }`. `name` is the short name; `ref` is what git needs (`origin/foo` for remote); `remote` true when no local branch of that name exists; `at` is last commit time (unix seconds, 0 if unknown).
- **Create choice**: `{ name, create: true }`, appended when typed text matches no branch exactly.
- **Other-worktree map**: branch name to worktree path, for branches checked out elsewhere (current worktree excluded).

## View state

| Field | Meaning |
|---|---|
| `folder`, `on` | space folder and machine git runs on |
| `branches` | undefined while loading, array after |
| `current` | current branch (`rev-parse --abbrev-ref HEAD`) |
| `used` | other-worktree map |
| `text` | filter / new-name input |
| `at` | highlighted row index (reset to 0 on typing; wraps) |
| `busy` | a switch is running |
| `err` | message shown in red, up to 6 lines |

## Transitions

- open: loading -> (folder missing / not a repo: `err`, empty list) or loaded.
- type: `text` changes, `at = 0`, `err` cleared.
- pick: current -> close; other-worktree -> `err`; else `busy` -> success (shared key, toast, close) or failure (`err`).

## Shared

- `branch.switched` (shared state, written with `setShared`, value `Date.now()`): read by `mods/status-usage` to refresh its branch.

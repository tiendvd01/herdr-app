# Data Model: Changes Panel

All state is in memory except the keys below. No database or files are written by the mod (git itself is written only by Commit).

## Persistent state

| Store | Key | Shape | Purpose |
|---|---|---|---|
| `localStorage` (this mod) | `view` | `{ wrap, split, tree, diff }` | List/tree, side-by-side, diff section shown (`diff` false means collapsed). `wrap` is always on. Reads tolerate bad JSON. |
| shared | `reviewer.drafts` | `{ "<machine>:<root>:<scope>": Comment[] }` | Draft comments per repo and scope. Old keys without a scope move to `:work`. |
| shared | `reviewer.scope` | `{ "<machine>:<root>": scopeName }` | Last scope per repo (`work`, `last`, `branch`, `commit:<sha>`). |
| shared | `reviewer.sent` | timestamp | Set by the send dialog when a message went out; the panel clears drafts. |
| shared | `reviewer.open` | `{ id, at, path, on }` | Request from another mod to show a file; cleared when handled; ignored after 30 s. |
| shared | `reviewer.dialog` | overlay id or null | Open marker so the tab-bar button lights up. |

## Entities

- **Context**: focused pane's folder and machine (`cwd`, `on`); a change resets file, comments, composer and commit message.
- **Scope info**: `branch`, `base`, `merge` (merge base or null), `last` (short HEAD or null), `subject`, `commits[30]` (`sha`, `short`, `subject`, `when`), `commit` (chosen one).
- **Changed file**: `path`, `status` (A, M, D, U), `fresh` (untracked), `add`, `del`, `binary`. Max 1,000, sorted by path.
- **Diff row**: `kind` (`@`, `+`, `-`, space), `number`, `text`, `spans` (class, text), `hunk` (index of its header).
- **Comment**: `id`, `path`, `whole` (file comment) or `from` / `to` (row descriptors: kind, number, text), `text`, `quote` (lines captured at creation). Validity: from-row before or equal to to-row in the current diff, otherwise only sent, not shown.
- **Composer**: `{ path, from, to | whole, editing }`; at most one at a time.
- **Send dialog**: `title`, `context`, `note`, picked agent address, flags (confirm, sending, closed). Target: picked, else focused, else idle, else first.

## State transitions

- Scope change: swap comments to that scope's drafts, close composer, clear lines, refresh.
- Submit: mark `submitting`; on `reviewer.sent >= submitting` (or direct send) clear drafts.
- Commit: busy, `add -A`, `commit -m`; success clears message and collapses diff; always refresh.
- Open file: pick toggles; picking while collapsed re-expands.

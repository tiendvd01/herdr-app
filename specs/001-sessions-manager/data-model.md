# Data Model: Sessions Manager (as-built)

## Shared state (written by `status-usage`, read by the dialog)

| Key | Meaning |
|-----|---------|
| `procs` | Latest snapshot: `{ sessions: Session[] }` |
| `procs.refresh` | Timestamp written by Refresh/Delete to force an early poll |
| `procs.killed` | pids stopped via Stop all, so they are not reported as "Process finished" |

## Session

| Field | Notes |
|-------|-------|
| `address` | Terminal address; identity of the session |
| `title`, `where` | Display title and `space › tab` |
| `space`, `tab`, `pane` | Used by Go to focus |
| `status` | blocked / working / done / idle |
| `age` | Seconds, optional |
| `root` | Foreground pid of the terminal (the Claude process) |
| `busyCpu` | CPU delta between polls; at least 10 means "Running" |
| `items` | Child processes |

## Child process (item)

`pid`, `pids` (whole group), `cmd`, `age`, `cpu`, `rss`, `n` (sub-process count), `paused`.

## Dialog-local state (not persisted)

- `expanded`: addresses of expanded sessions
- `restarting`: addresses with the spinner on (8 s)
- `removed`: addresses deleted this time the dialog was open

## Rules

- A session is shown only if its terminal still exists and it is not in `removed`.
- Sorted by item count, descending.
- Header totals are sums over the visible sessions.

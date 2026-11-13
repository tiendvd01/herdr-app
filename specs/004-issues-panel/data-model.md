# Data Model: Issues Panel

## Persistent state

| Location | Shape | Notes |
|----------|-------|-------|
| `localStorage["spaces"]` | `{ <spaceId>: { state, mine, query, open } }` | `state` = open/closed/all; `mine` bool (default true); `query` string; `open` = `{repo, number}` or null |
| `data/issues/cache.json` | `{ lists: {key: {at, data}}, issues: {key: {at, data}} }` | list key = JSON of `[repo, state, mine, query]`; issue key = `owner/repo#n`; trimmed to 60 lists / 300 issues; written every 5 s when dirty |
| `~/.herdr/issue-summaries/summaries.json` | `{ "owner/repo#n": { text, version, model, at } }` | outside the project; `jobs/` holds temp files of a running job; `system.txt` is the prompt |
| `projects/<slug>/summary-prompt.md` | text | optional per-project summary prompt |
| `mods/issues/.diagrams/<hash>.png` | image | diagram cache, gitignored |

## In-memory entities

- **Space state** (`ws[spaceId]`): state, mine, query, open, list, listKey, listAt, loading, error, detail, detailAt, detailLoading, collapsed (set of comment ids).
- **Issue list entry**: number, title, state, labels, assignees, updatedAt, author.
- **Issue detail**: number, title, body, state, author, labels, assignees, comments (id, author, body, createdAt, isMinimized), url, createdAt.
- **Fetch bookkeeping**: `inflight` (id -> start time; stale after 45 s), `tried` (id -> last fetch time; fresh for 60 s), `limits` (list key -> requested page size, grows by 30).
- **Repo per folder** (`autoRepo`): folder -> owner/repo or null.
- **Summary run** (`sumRun[key]`): `{error}` while running or failed.

## Rules

- Summary `version` = hash of body + `id:body` of each non-minimized comment.
- A list result is written to every space whose list key matches.

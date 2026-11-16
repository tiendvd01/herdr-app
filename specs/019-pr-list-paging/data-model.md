# Data model

## View (tracker, in memory; key `repo|state|scope`)

| Field | Meaning |
|---|---|
| `urls` | PR urls in page order, no duplicates |
| `cursor` | `endCursor` of the last loaded page |
| `next` | `hasNextPage` of the last page |
| `pages` | pages loaded (a reload fetches this many again) |
| `at` | when the view last loaded (ms) |
| `loading` | a count / page call is running |
| `error` | last error text, rows kept |

`hasMore(view)` = `next && (total == null || urls.length < total)`.

## Count (tracker; key `repo|state|scope`)

`{ n: number | null, at, busy }`, fresh for 60 s. Shown on the chips and as header total.

## Row data (existing `live` map)

A page node is stored like today's refresh result: `{ pr, threads, issues, fetchedAt, partial: true }`.
`partial` means `files`, `body` and thread comments are missing; opening the PR refreshes it fully.

## State flow

`setView` / stale / Refresh → count → (0: empty, done) → page 1 … page `pages` → idle.
Scroll to end and `hasMore` → next page with `cursor` → idle.

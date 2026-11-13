# Data Model: Inbox

## Entry (`localStorage` key `items`, array, newest first)

- `key`: `agent:<address>` or `pr:<url>` (unique)
- `kind`: `attention` | `done` (agents) | `pr`
- `title`, `body`, `sub` (repo, PRs), `tone`: `bad` | `warn` | `ok`
- `events`: PR only, list of `{ text, badge }`; `badge`: `changes` | `ci` | `conflict` | `comment` | `approved`
- `badge`: worst event's badge (PR)
- `pic`: agent only, `{ icon, tint }` from the program
- `target`: `{ kind: "agent", address, pane }` or `{ kind: "pr", url, repo }`
- `at` (ms, last event), `read`, `done`

Rules: upsert sets `at=now`, `read=false`, `done=false` and moves to top. Save drops done entries older than 7 days and keeps at most 150.

## PR snapshot (`localStorage` key `prs`, map url to snapshot)

- `title`, `number`, `state`
- `reviews`: login to `STATE@submittedAt`
- `comments` (others' comments in unresolved, non-outdated threads), `open` (unresolved thread count)
- `ci`: kind from the status summary, `failed`: check names
- `conflict`: boolean
- `headSeenAt`: when the current head was first seen (for CI wait logic)

Removed when the PR leaves the open list.

## In-memory state

`prev` (address to status from last render), `urls`, `listedAt`, `fetchedAt` per URL, `repos` cache, `me` (user logins), `busy`, `hovered`, `showDone`.

## Shared / commands

- Writes shared `pr-flow.goto = { url, at }`.
- Commands: `inbox.open-latest`, `inbox.done-all`.

## State transitions

Agent: status to blocked creates `attention`; to done creates `done`; focus sets read; back to working marks an `attention` entry done.
Entry: live (unread) to live (read) on open; to done on mark/expiry; to live again on a new event; removed from Done by Remove/Clear.

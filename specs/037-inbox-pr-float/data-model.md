# Data Model: 037

## Inbox entry (`shared("inbox.items")`, array, newest first, ≤150)
| field | meaning |
|---|---|
| key | `pr:<url>`, one per PR |
| kind | always `"pr"` (others dropped on load) |
| title | `#<n> <title>` |
| body, events[], badge, tone, sub | what changed; worst-event mark; repo |
| target | `{ kind: "pr", url, repo }` |
| at | ms of last event |
| read, done | unread dot / Done group |

Transitions: new event → upsert on top, `read=false, done=false`; click → `read=true`; mark done → `done=true, read=true`; PR leaves your open list → done; done older than 7 days or removed → dropped.

## PR snapshot (floating copy localStorage `prs`)
Unchanged from today: `{ title, number, state, reviews, comments, open, ci, failed, conflict, headSeenAt }` per URL.

## Shared flags
- `inbox.dialog`: overlay id while the dialog is open, else null.

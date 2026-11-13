# Data Model: Pull requests panel

## Entities

- **Tracked entry** (`tracked`): `{url, repo, number, branch, headSha, headSeenAt}`. Persisted. Pruned when closed, or merged more than 30 days ago with no active flow.
- **Live data** (memory, per url): `{pr, threads, issues, fetchedAt, error}`. `pr` carries number, title, body, state, isDraft, head/base refs, checks rollup, reviewDecision, latestReviews, mergeStateStatus, mergeable, author, change counts, files, timestamps, mergeCommit. `threads` are review threads (resolved/outdated, path, line, side, comments). `issues` are closing-issue references.
- **Status fact** (derived): `{name, tone, count?, ci:{kind, checks, ai, failed, passed, total}, review, comments}`. `name` in merged, closed, draft, conflict, ci_failed, ci_running, changes, comments, ai_running, review_wait, behind, blocked, ready.
- **Flow** (memory, merged PRs): `{runs[], jobs:{runId:{jobs, final}}, checkedAt, active}`; run state ok / bad / running / queued / waiting / cancelled / skipped.
- **Card**: entry + live data + status + owning agent (same repo and branch, working agent preferred) + `mine` flag + flow. Sorted: unmerged-or-active first, then by updated time.
- **View**: `{state: "open"|"merged", scope: "mine"|"all"}`; per-view memory of list urls, page limit, "may have more".
- **Agent** (from app): address, status, cwd, branch, machine, resolved repo (cached 60 s).
- **Viewer target**: `{kind:"diff"|"log", ...}` with `at` stamp.

## State and storage

| Where | Key | Content |
|-------|-----|---------|
| localStorage | `tracked` | map url -> tracked entry |
| localStorage | `spaces` | map space id -> `{view, url, selectedUrl, issueUrl}` |
| localStorage | `lang` | detected system language |
| shared | `pr-flow.view` | viewer target `{..., at}` (panel to viewer pane) |
| shared | `pr-flow.lang` | language choice |
| shared | `pr-flow.goto` | `{url, at}` request from another mod |
| props | `poll_seconds`, `ci_wait`, `ai_checks`, `merge`, `lang`, `screen` | layout settings; `screen:"viewer"` marks a viewer pane |

Transient UI state (not persisted): open timeline rows, files fold choice per PR, loaded logs per run, issue cache, merge armed/merging/error, composer state in the viewer.

## Transitions

- Merge: card `ready` -> press (armed 4 s) -> press (merging) -> refresh -> `merged` (flow tracking starts).
- PR lifecycle: tracked -> live (fetched) -> merged (kept 30 d) or closed (dropped).

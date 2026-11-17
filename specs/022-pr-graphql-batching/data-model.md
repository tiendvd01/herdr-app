# Data Model: 022

Shapes are unchanged for consumers; only how they are fetched changes.

- **PrRead** (per PR, from `readPrs`): `{ pr, threads, issues, headCommittedAt }` or `{ error }`.
  - `pr`: `gh pr view --json PR_FIELDS` shape: number, title, body, url, state, isDraft, headRefName, headRefOid, baseRefName, statusCheckRollup[] (CheckRun | StatusContext with `__typename`), reviewDecision, latestReviews[] {author{login}, state, submittedAt}, mergeStateStatus, mergeable, author{login}, additions, deletions, changedFiles, files[] {path, additions, deletions, changeType}, createdAt, mergedAt, closedAt, updatedAt, mergeCommit{oid}.
  - `threads[]`: {isResolved, isOutdated, path, line, diffSide, comments{nodes[{author{login}, body}]}}.
  - `issues[]`: closing issues {number, title, state, stateReason, url, repository{nameWithOwner}}.
- **Discovery** (from `discoverMany`): `{ found: Map<branch, url>, failed: Map<branch, error> }`; per branch the open PR (alias `oN`) or the newest merged one after `since` (alias `mN`).
- **Counts** (from `counts`): `{ open, merged }` (numbers).
- Tracker state transitions unchanged: tracked → live (partial from page, full from read) → pruned.
- Tracker `refreshing`: url → number of reads in flight (tick and Refresh can overlap); released once PR data is in, before merged PRs' Actions reads. `lastError` after a read round is its first error, else '' if any PR read fine.

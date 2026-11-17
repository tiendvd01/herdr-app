# Research: 022 PR GraphQL batching

## R1. Partial answers from `gh api graphql`

- **Decision**: a `graphql(repo, query, vars)` helper parses stdout whatever the exit code; it throws only when there is no JSON or `data` is null; `errors` are mapped to aliases by `path[1]` (path `["repository","p3"]`).
- **Rationale**: verified on cli/cli: one alias asking a missing PR returns `{"data":{"repository":{"p0":{…},"p1":null}},"errors":[{"type":"NOT_FOUND","path":["repository","p1"],…}]}` on stdout and `gh` exits 1. The existing `json2` would throw and lose the good PRs.
- **Alternatives**: one request per PR (today; the cost we remove).

## R2. Matching `gh pr view --json PR_FIELDS`

- **Decision**: the full read uses the list page's node fields plus `body`, `files(first:100){path additions deletions changeType}`, threads with `comments(first:20){author{login} body}`, `statusCheckRollup.contexts(first:100)`; mapped by the existing `pageNode` and extended.
- **Rationale**: compared a real `gh pr view` (cli/cli#15064). Fields `gh` adds on top (`workflowName` on checks, `author.is_bot`, `app/` login prefix for bots, review `id/body/reactionGroups`) are not read anywhere in pr-flow, inbox or `lib/pr-status.js` (searched). The list page already feeds cards in this shape.
- **Alternatives**: keep `gh pr view` and only fold threads in: still 2 calls; no batching.

## R3. Branch lookup

- **Decision**: per branch two aliases, `oN: pullRequests(headRefName:$bN, states:[OPEN], first:1){nodes{url}}` and `mN: pullRequests(headRefName:$bN, states:[MERGED], first:5, orderBy:{field:UPDATED_AT,direction:DESC}){nodes{url mergedAt}}`, 20 branches per request; pick the OPEN one, else the newest MERGED with `mergedAt` after the 30-day window.
- **Review fix**: the first version asked `states:[OPEN,MERGED], first:5` in one alias; on a long-lived branch name (`dev`, `release`) five recently updated merged PRs pushed the open one out. Asking open apart restores what `gh pr list --head --state open` gave. A failed request or alias marks only its branches failed; the tracker asks those again after the short (working) wait, not the idle one.
- **Rationale**: same filter as `gh pr list --head <branch>`; one request for all of a repo's branches. Discovery no longer refreshes on its own: a newly tracked entry has no live data, so it is due in the same round's batched refresh.
- **Alternatives**: return the full PR in the lookup: larger query on every lookup though most find nothing new.

## R4. Counts

- **Decision**: `o: search(query:$qo,type:ISSUE,first:0){issueCount} m: search(query:$qm,type:ISSUE,first:0){issueCount}`; the tracker shares one in-flight promise per repo|scope and fills both state keys.
- **Rationale**: both chips need both numbers; REST search has its own 30/min limit. Count-first and 0 → no list call (spec 019) stay.
- **Alternatives**: take the total from the first page only: the other state's chip would still need a call.

## R5. Batch sizes

- **Decision**: 10 PRs per read, 20 branches per lookup; requests of different repos run in parallel (CONCURRENCY 4 as today).
- **Rationale**: a full PR node with 100 files/threads/checks is a heavy query; 10 keeps the point cost and response size moderate. Branch lookups are tiny.

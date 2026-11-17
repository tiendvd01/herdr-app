# Feature Specification: Fewer, combined GitHub calls for pull requests

**Feature Branch**: `022-pr-graphql-batching`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: User description: "Làm theo như m đề xuất đi" (do what you proposed): combine the Pull requests
calls so fewer requests go out: (1) one call for all agent branches, (2) one call per PR refresh instead of
two, batched per repo, (3) drop the separate REST count in favour of a combined count.

## User Scenarios & Testing *(mandatory)*

The Pull requests dialog (`pr-flow`) and the inbox (`inbox`) already read most data in GitHub's query
language, but they ask piece by piece: per agent branch one or two lookups for its PR, per PR two reads
(the PR, then its review threads), and per Open/Merged chip a separate count from a different API. Each
request is a separate `gh` process and a network round trip, so a round with several agents means many
calls, slower updates and faster use of the GitHub quota. This feature asks for the same data in fewer,
combined requests. What the user sees stays the same.

### User Story 1 - Agent branches are checked in one go (Priority: P1)

The user has several agents working on branches of the same repo. Each round, Herdr looks for a pull
request on every branch with one request per repo instead of one or two per branch, so a newly opened PR
shows up just as soon (or sooner) and the quota lasts longer.

**Why this priority**: This is the largest repeated cost: it runs every round for every agent.

**Independent Test**: With 4 agents on 4 branches of one repo (2 with an open PR, 1 with a PR merged last
week, 1 with none), one round makes one lookup request for that repo and the three PRs appear as before.

**Acceptance Scenarios**:

1. **Given** N agents on N distinct branches of one repo, all due for a check, **When** a round runs, **Then** one lookup request is made for that repo and every branch with an open PR gets its card.
2. **Given** a branch has no open PR but one merged within the last 30 days, **When** it is checked, **Then** the merged PR is shown, as today.
3. **Given** a branch has only a PR merged more than 30 days ago, or none, **When** it is checked, **Then** nothing is added.
4. **Given** agents on branches of two repos, **When** a round runs, **Then** one lookup request is made per repo, each as that repo's GitHub account.

---

### User Story 2 - A pull request is read in one request, several at once (Priority: P1)

When a PR's data is refreshed (the opened PR, an agent's PR, the inbox's PRs), its details, review threads
with comments, linked issues and latest commit time come back in a single request. PRs of one repo that are
due at the same time are read together, a few per request.

**Why this priority**: Opening or refreshing a PR is the second most frequent cost and halves at once.

**Independent Test**: Open a PR in the dialog: one request returns everything the detail view shows (body,
files, checks, reviews, threads with comments, linked issues). The view looks exactly as before.

**Acceptance Scenarios**:

1. **Given** the user opens a PR, **When** its full data loads, **Then** one request is made and the detail view shows the same title, body, files, checks, reviews, open threads and linked issues as before.
2. **Given** 6 PRs of one repo are due in the same round, **When** they refresh, **Then** they are read in one request (at most 10 PRs per request).
3. **Given** one PR in a combined request can no longer be read (deleted, no access), **When** the answer comes back, **Then** only that PR shows an error and the others update normally.
4. **Given** the whole request fails (network, rate limit), **When** the round ends, **Then** each PR in it keeps its last data and shows the error, as a single failed refresh does today.
5. **Given** the inbox polls your open PRs, **When** several are due, **Then** they are read in combined requests per repo and the inbox entries (reviews, comments, CI, conflicts) are the same as before.

---

### User Story 3 - Open and Merged counts in one request (Priority: P2)

The Open and Merged chips of the list get their numbers from one combined request per repo and scope,
in the same query language as the list, instead of two separate counts from another API. The list still
asks for the count first and skips the list call when it is 0 (spec 019).

**Why this priority**: Smaller gain (one call less per view refresh), but it removes the only search call on
GitHub's separate, low search limit (30 per minute).

**Independent Test**: Open the list: both chips show their numbers after one count request; switching
Open ↔ Merged within a minute makes no new count request.

**Acceptance Scenarios**:

1. **Given** the user opens the list for a repo, **When** the counts load, **Then** one request returns both the Open and the Merged count for the chosen scope.
2. **Given** the count for the shown view is 0, **When** the view opens, **Then** the empty state shows and no list request is made (unchanged).
3. **Given** the count request fails, **When** the list loads, **Then** it falls back as today (pages load, header shows only the shown number).

### Edge Cases

- A branch name with quotes or unusual characters must not break the combined request (values are passed as variables, never pasted into the query text).
- More than 10 PRs due in one repo: they are split into several requests of at most 10.
- More than 20 agent branches in one repo: lookups are split into requests of at most 20 branches.
- A PR with more than 100 changed files: the files list shows the first 100, as `gh pr view` does today; the count of changed files stays exact.
- A repo whose owner maps to a different gh account: every combined request runs as that repo's account.
- Partial answers (data plus errors) are normal for combined requests and must be read per PR, not treated as a total failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The PR lookup for agent branches MUST be made once per repo per round for all due branches of that repo (at most 20 branches per request), returning for each branch its newest open PR, or else its newest merged PR.
- **FR-002**: A merged PR found for a branch MUST only be tracked if merged within the last 30 days (unchanged rule).
- **FR-003**: A full PR read MUST return, in one request, every field the dialog and inbox use today: details, body, files, checks, reviews, mergeability, review threads with their comments, linked issues and the head commit time.
- **FR-004**: PRs of the same repo due in the same round MUST be read together, at most 10 per request; the inbox MUST use the same combined read.
- **FR-005**: A failure for one PR inside a combined request MUST affect only that PR; a failed request MUST mark each of its PRs as failed without dropping their last data.
- **FR-006**: The Open and Merged counts of a view (repo + scope) MUST come from one combined request in the same query language as the list; the separate search count MUST no longer be used.
- **FR-007**: The data handed to the rest of the mods MUST keep its current shape, so cards, statuses, detail view, inbox and spec 019 paging behave the same.
- **FR-008**: User-supplied values (branch names, search words, logins) MUST be sent as request variables, never inserted into the query text.
- **FR-009**: Actions runs and jobs, failed logs, diffs, merging and posting comments are out of scope and keep their current calls.

### Key Entities

- **Branch lookup**: repo, list of branch names → per branch: open PR link, or merged PR link with merge time, or nothing.
- **PR batch read**: repo, list of PR numbers → per PR: the full PR record (today's shape) plus threads, linked issues and head commit time, or an error.
- **View counts**: repo, scope (logins or everyone) → Open count and Merged count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With N agents on N branches of one repo, a round's PR lookups take 1 request (N ≤ 20) instead of N to 2N.
- **SC-002**: Opening or refreshing one PR takes 1 request instead of 2; refreshing K due PRs of one repo takes ⌈K/10⌉ requests instead of 2K.
- **SC-003**: Loading both chip counts takes 1 request instead of 2, and no request goes to the search API with its 30-per-minute limit.
- **SC-004**: The detail view, the cards and the inbox show identical content before and after the change for the same PRs.
- **SC-005**: Time until an opened PR's full data shows is not longer than before.

## Assumptions

- GitHub's query API is available to every logged-in account (it requires a token, which `gh` already has).
- Fewer, larger requests cost about the same quota points as the smaller ones they replace; the gain is in process starts, round trips and the separate search limit.
- 100 files, 100 review threads with 20 comments each, 50 checks and 20 reviews per PR are enough (the same limits the list page and today's calls already use).
- The branch lookup asks GitHub's per-repo PR list filtered by head branch name, which matches today's `--head <branch>` lookup (no extra fork filtering is added or removed).
- Actions (runs, jobs, logs) stay on their current calls; moving them is a possible later step.

# Feature Specification: Pull requests panel (as-built)

**Feature Branch**: `006-pull-requests-panel` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Pull requests panel (mod `pr-flow`) as it behaves today. Describe what it does and why, not how."

> Scope note: this repo has no tests; scenarios come from `mods/pr-flow/` and the shared `lib/pr-gh.js`, `lib/pr-status.js`, `lib/github.js`, `lib/gh-account.js`, plus `docs/gh-account.md`. There is no `docs/mods/pr-flow.md` yet. The Changes dialog (`reviewer`) and the inbox (which only asks this panel to open a PR) are separate features.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See my PRs and where each one stands (Priority: P1)

A user whose agents open pull requests opens the right-side Pull requests panel. It lists the PRs of the repo of the focused terminal's folder, newest activity first, each with a one-line fact about where it stands (merged, closed, draft, conflict, CI failed, CI running, changes requested, open comments, AI reviewing, waiting for review, behind base, blocked, ready to merge).

**Why this priority**: knowing which PR needs attention, without opening GitHub, is the whole point.

**Independent Test**: in a space whose folder is a GitHub repo with open PRs by the user, open the panel and confirm each PR shows with the correct status fact.

**Acceptance Scenarios**:

1. **Given** the focused terminal is in a GitHub repo, **When** the panel is shown, **Then** only that repo's PRs are listed; with state Open and scope Mine by default.
2. **Given** the user picks Merged or Everyone, **Then** the list switches (with counts on the chips) and a PR still loading shows a loading row, not a wrong status.
3. **Given** several blocking facts, **Then** the most blocking one is shown (conflict, then CI failed, CI running, changes requested, open comments, AI reviewing, review wait, behind, blocked, ready).
4. **Given** the list reaches the end and GitHub may have more, **Then** the next page loads on scrolling.
5. **Given** no PRs match or the folder is not a GitHub repo, **Then** an empty state says so; if `gh` is not logged in, a "GitHub CLI is not ready" notice asks the user to log in and refresh.

---

### User Story 2 - Open a PR and read its progress (Priority: P1)

Selecting a PR opens a detail view in the same panel: title, repo and number, branch to base, a progress timeline (PR opened, CI, review, merge), open review comments, linked issues, changed files and description. A failed CI shows the tail of the failed log.

**Why this priority**: the list says what is wrong; the detail says why.

**Independent Test**: open a PR with failing CI and open comments; confirm timeline, failed log tail, comments and linked issues appear, and Back returns to the list.

**Acceptance Scenarios**:

1. **Given** a PR with failing CI, **Then** the failed job's log tail shows once per run; clicking it opens the full log in a viewer pane; if the log is unavailable, it offers opening on GitHub.
2. **Given** a PR with more than 10 changed files, **Then** the file list starts folded.
3. **Given** a linked issue, **When** clicked, **Then** its content opens in the panel and Back/Escape returns.
4. **Given** the user presses Escape or Backspace in the detail, **Then** the list returns; `o` opens the PR on GitHub.

---

### User Story 3 - Read the diff and comment on a line (Priority: P2)

Clicking a changed file opens a viewer pane beside the terminal showing that file's diff with line numbers and open review threads under their lines. Clicking a line composes a review comment, sent to GitHub on that line.

**Why this priority**: review feedback without leaving the workspace.

**Independent Test**: click a file, click an added line, send a comment, and confirm it appears on GitHub on that line.

**Acceptance Scenarios**:

1. **Given** a file click, **Then** a viewer pane opens (or the existing one is reused and re-pointed); the panel and the viewer follow each other.
2. **Given** a header or hunk row, **When** clicked, **Then** nothing is composed (only code lines accept comments).
3. **Given** a comment is sent, **Then** it is posted against the head commit that was shown; failure shows an error and keeps the text.
4. **Given** the diff cannot load, **Then** a message suggests opening the PR on GitHub.

---

### User Story 4 - Jump to the agent that owns the PR (Priority: P2)

A PR whose branch is checked out by a live agent shows that agent's status. One click (or Enter/`g`) focuses its terminal.

**Why this priority**: closes the loop between a PR needing work and the agent who can do it.

**Independent Test**: with an agent on the PR's branch, click Go and confirm its terminal is focused.

**Acceptance Scenarios**:

1. **Given** an agent on the PR's repo and branch, **Then** its status (working, idle, finished, needs input) shows and Go focuses it.
2. **Given** no agent is on the branch, **Then** no agent row is offered.

---

### User Story 5 - Watch what happens after a merge (Priority: P2)

For a merged PR, the detail shows the repo's GitHub Actions runs on the merge commit (running, failed, waiting, done), each expandable to jobs and steps, with a failed run's log openable.

**Why this priority**: "merged" is not "shipped"; this shows whether the follow-up workflows succeed, without guessing what a workflow means.

**Independent Test**: open a just-merged PR, see runs appear within a few minutes, expand one, and confirm jobs and the current step show.

**Acceptance Scenarios**:

1. **Given** a merge just happened, **Then** the panel keeps checking for runs for a grace period, since runs appear late and can start others.
2. **Given** all runs finished, **Then** it shows done; any failed run shows failed with the first failure named and "+N more".
3. **Given** skipped runs, **Then** they are not listed.

---

### User Story 6 - Merge a ready PR safely (Priority: P3)

When the panel is configured with a merge method, a PR that is open, not draft, mergeable and "ready" shows a Merge button. The first press arms it for 4 seconds ("Press again to merge"); the second merges exactly the commit that was shown.

**Why this priority**: optional convenience; off unless configured.

**Independent Test**: set a merge method, press once and wait (button disarms), press twice quickly (PR merges).

**Acceptance Scenarios**:

1. **Given** no merge method configured, **Then** no button is shown.
2. **Given** a commit pushed after the PR was shown, **When** merge is confirmed, **Then** GitHub refuses and the error is shown.
3. **Given** the PR is not ready, **Then** no button is shown.

---

### User Story 7 - Panel follows the space; keys and language (Priority: P3)

Each space remembers its own filters, open PR and open issue. Keys: `j`/`k`/arrows, Enter, `g`, `o`, `r`; named commands (`pr-flow.next`, `.prev`, `.open`, `.back`, `.agent`, `.github`, `.refresh`, ...) are bindable. Another mod can ask the panel to open one PR. A Settings screen picks language (follow system or English).

**Why this priority**: makes it quick to use but does not add capability.

**Independent Test**: switch spaces and confirm each restores its own list state; press `r` and confirm a refresh.

**Acceptance Scenarios**:

1. **Given** two spaces on different repos, **Then** switching shows each one's own state.
2. **Given** another mod requests a PR within 30 seconds, **Then** the panel opens that PR (and tracks it even if not listed).

---

### Edge Cases

- A PR closed without merging is dropped from the tracked set; a merged PR is kept 30 days (longer while its runs are active).
- A PR is only polled while an agent is on its branch or the shown view lists it; settled PRs poll 4 times slower than agent-branch ones.
- CI missing right after a new commit counts as "running" for a wait window (default 2 minutes), then as "No CI"; absent checks are never reported as passed.
- AI review checks (by name pattern or configured names) are separated from CI so they do not count as build failures.
- Fetch errors show under the list and on the card; the last good data is kept.
- A repo's owner can pick a different `gh` account from the active one (personal vs org); Mine merges results across accounts and matches authors by each account's real GitHub login.
- Remote machines: repo lookup and agent matching honour the space's machine.
- Merge and comment are the only writes to GitHub; everything else reads.
- PR titles/bodies are sanitised before display.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show, in the right-hand panel, the PRs of the repo of the focused terminal's folder, filterable by state (Open, Merged) and scope (Mine, Everyone), with counts and paged loading.
- **FR-002**: Each PR MUST show a single most-blocking status fact, derived from draft/closed/merged, conflicts, CI, review decision, open comments, behind/blocked.
- **FR-003**: The system MUST separate AI-review checks from CI and MUST NOT report a missing check as passed.
- **FR-004**: The system MUST discover PRs from live agents' branches and from the chosen view's GitHub list, and refresh them periodically (faster for agent branches).
- **FR-005**: The detail view MUST show timeline, open review comments, linked issues, changed files (folded above 10) and description.
- **FR-006**: For failed CI the system MUST show the log tail (once per run) and open the full log in a viewer pane.
- **FR-007**: The system MUST show a file's diff in a viewer pane with open threads inline, and MUST let the user post a review comment on a code line.
- **FR-008**: Users MUST be able to open a linked issue inside the panel.
- **FR-009**: Users MUST be able to focus the agent owning the PR's branch, and open the PR on GitHub.
- **FR-010**: For merged PRs the system MUST show post-merge Actions runs with expandable jobs and steps, with a grace period for late runs.
- **FR-011**: A Merge button MUST appear only when a merge method is configured and the PR is open, not draft, mergeable and ready; it MUST need two presses within 4 seconds and MUST merge only the shown head commit.
- **FR-012**: Per-space state (filters, open PR, selection, open issue) MUST be remembered per space.
- **FR-013**: `gh` calls MUST run as the account matching the repo owner, without changing the active account.
- **FR-014**: The panel MUST support keyboard use and named commands, accept a "go to this PR" request from another mod, and offer a manual refresh.
- **FR-015**: The system MUST show a clear notice when `gh` is not logged in, and an empty state when nothing matches.
- **FR-016**: Optional settings (poll interval, CI wait, AI check names, merge method, language) MUST come from the layout block's props; poll interval has a 10 s floor.

### Key Entities

- **Tracked PR**: a PR the panel follows (url, repo, number, branch, last head commit, when that head was first seen).
- **PR card**: tracked PR plus live data, status fact, owner agent, linked issues, post-merge flow.
- **Status fact**: name, tone and counts for the one thing blocking or finishing the PR.
- **Flow run**: a post-merge Actions run with jobs and steps.
- **View**: state (Open/Merged) and scope (Mine/Everyone), per space.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can tell which of their PRs needs action within 5 seconds of opening the panel.
- **SC-002**: A PR on an agent's branch reflects GitHub changes within about one poll interval (default 30 s).
- **SC-003**: From a failing PR, the failed log is one click away with no terminal command.
- **SC-004**: Posting a review comment takes at most 3 interactions (click file, click line, send).
- **SC-005**: A merge cannot land a commit the user did not see.

## Assumptions

- `gh` is installed and logged in; the work account stays active.
- Only GitHub repos are supported; other remotes give an empty state.
- English is the only language table today; the language setting exists for future ones.
- No automated tests exist; behaviour was read from code.
- The panel's header comment says it "only reads", but comment and merge write; the spec follows the code.
- Missing `docs/mods/pr-flow.md` is a known documentation gap (constitution VI).

# Feature Specification: Inbox (as-built)

**Feature Branch**: `011-inbox` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the Inbox: agent needs you / finished, review and CI on your PRs; click jumps to the agent or the PR in pr-flow."

> Scope note: this repo has no tests. Acceptance scenarios come from the observed behaviour of `mods/inbox/` (with `lib/pr-gh.js` and `lib/pr-status.js`) and `docs/mods/inbox.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Be told when an agent needs me or has finished (Priority: P1)

A user runs several coding agents in different spaces. A shared list in the left sidebar (under Agents) gets an entry when an agent becomes blocked ("Needs you") or finishes ("Finished"), so they do not have to watch every pane.

**Why this priority**: waiting on a blocked agent unnoticed is the costliest wasted time; this is the core reason for the inbox.

**Independent Test**: run an agent in a space you are not looking at, let it ask for permission, and confirm an unread "Needs you" entry appears with a red marker; let another finish and confirm a "Finished" entry.

**Acceptance Scenarios**:

1. **Given** an agent changes to blocked, **When** the inbox next draws, **Then** one entry "Needs you · space · program" appears on top, unread, with the agent's program icon and a red `!` corner.
2. **Given** an agent changes to done, **Then** a "Finished" entry appears with a done-coloured dot corner.
3. **Given** the same agent raises a new event, **Then** its single entry is rewritten, moved to the top and made unread (never duplicated).
4. **Given** the user focuses that agent, **Then** its entry becomes read; **Given** a "Needs you" agent goes back to working, **Then** the entry moves to Done.
5. **Given** the app has just started, **Then** agents already blocked or done produce no entries; only later changes do.

---

### User Story 2 - Be told what happened on my open PRs (Priority: P1)

The user's open PRs (on any signed-in GitHub account) are watched in the background. New reviews by others, new unresolved-thread comments, CI turning red and merge conflicts each create an entry and a toast.

**Why this priority**: review and CI feedback arrives while the user is elsewhere; surfacing it shortens PR turnaround.

**Independent Test**: have a reviewer request changes on one of your open PRs and confirm an entry "login requested changes" with a red cross corner and a toast, within a few minutes.

**Acceptance Scenarios**:

1. **Given** another person newly requests changes, approves or reviews, **Then** an entry lists that event (red cross / green check / yellow comment mark).
2. **Given** new comments appear in unresolved threads from others, **Then** the entry says "N new comments · M unresolved"; the user's own comments are not counted.
3. **Given** CI turns failed (it was not failed before), **Then** the entry says "CI failed: <check names>"; **Given** the PR becomes conflicting, **Then** "Conflicts with base".
4. **Given** several events at once, **Then** one entry shows every event on its second line, and the corner mark is the worst one (bad > warning > ok).
5. **Given** the PR is first seen, **Then** only a snapshot is taken and nothing is reported; restarting the app does not re-report old events.
6. **Given** a PR leaves the open list (merged/closed), **Then** its entry moves to Done and its snapshot is dropped.
7. **Given** an event, **Then** a toast with the same text appears; clicking it opens the newest unfinished entry.

---

### User Story 3 - Click an entry to go to it (Priority: P1)

Clicking an entry takes the user where the work is: an agent entry focuses that agent's terminal; a PR entry switches to the space whose repo matches, opens the Pull requests panel and shows that PR.

**Why this priority**: an alert without a one-click path forces the user to search for it.

**Independent Test**: click a PR entry while in an unrelated space and confirm the matching space is selected and pr-flow shows that PR.

**Acceptance Scenarios**:

1. **Given** an agent entry whose terminal exists, **When** clicked, **Then** that terminal is focused; **Given** it has closed, **Then** a short "That agent has closed" notice appears.
2. **Given** a PR entry, **When** clicked, **Then** the space with that repo (current space first) is selected, the Pull requests panel is shown, and that PR is opened.
3. **Given** no space matches the repo, **Then** the current space is kept and the PR is still shown there.
4. **Given** the entry was opened, **Then** it becomes read but stays in the list.

---

### User Story 4 - Tidy the list with Done (Priority: P2)

The user marks entries done one by one or all at once, and can delete from a folded Done group.

**Why this priority**: keeps the inbox a to-do list instead of a log.

**Independent Test**: hover an entry, click the check; it moves to the folded Done group; remove it with the x; use Clear.

**Acceptance Scenarios**:

1. **Given** an entry, **When** hovered, **Then** a "Mark as done" check replaces its age; clicking it moves it to Done.
2. **Given** live entries, **When** the header check (or `inbox.done-all`) is used, **Then** all move to Done.
3. **Given** the Done group is opened, **Then** each entry offers "Remove" and the group offers "Clear".
4. **Given** a new event for an entry in Done, **Then** it returns to the live list, on top, unread.
5. **Given** an entry in Done for over 7 days, or more than 150 entries, **Then** the oldest are dropped.

---

### User Story 5 - Use it in a narrow sidebar (Priority: P3)

When the sidebar is narrower than about 160 px, the inbox shrinks to one inbox icon with an unread count badge; clicking opens the newest live entry.

**Why this priority**: the sidebar can be collapsed; alerts must stay visible.

**Independent Test**: narrow the sidebar and confirm the icon shows the unread count and a click jumps to the top entry.

**Acceptance Scenarios**:

1. **Given** a narrow sidebar with 3 unread, **Then** the icon shows a red count badge of 3 and a tooltip "Inbox · 3 unread".
2. **Given** no live entries, **When** the icon is clicked, **Then** nothing happens.

---

### Edge Cases

- Empty inbox shows a "Nothing yet" hint line.
- If listing or reading PRs fails (offline, gh not signed in), the attempt is skipped silently and retried on the next poll; the PR snapshot is kept.
- A PR is re-read at most every 2 minutes and the PR list re-fetched every 5 minutes, so events can lag by minutes.
- Only one poll runs at a time; PRs are read four at a time.
- If the PR's repo has no matching space (including remote machines), the current space is used.
- A "go to PR" request older than 30 seconds is ignored by Pull requests.
- Entries saved before per-event marks existed fall back to a mark guessed from their tone.
- `done` for an agent only occurs when the user is not looking at it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a single inbox list in the left sidebar under Agents.
- **FR-002**: The system MUST create an entry when an agent becomes blocked ("Needs you") or done ("Finished"), and MUST NOT create entries for states present at startup.
- **FR-003**: The system MUST keep one entry per agent and one per PR; a new event rewrites it, moves it to the top and marks it unread.
- **FR-004**: Focusing an agent MUST mark its entry read; an agent returning to work MUST move its "Needs you" entry to Done.
- **FR-005**: The system MUST watch the user's open PRs across all signed-in GitHub accounts, re-listing every 5 minutes and re-reading each PR at most every 2 minutes.
- **FR-006**: The system MUST report, per PR, new reviews by others (changes requested, approved, reviewed), new comments in unresolved threads from others, CI becoming failed, and a new conflict.
- **FR-007**: The system MUST NOT report on the first sighting of a PR, and MUST persist PR snapshots so a restart does not re-report.
- **FR-008**: Each PR event MUST carry its own mark and tone; the entry's corner MUST show the worst event, and all events MUST be listed on the second line.
- **FR-009**: Each PR event MUST also raise a toast whose click opens the newest unfinished entry (`inbox.open-latest`).
- **FR-010**: When a PR leaves the open list, its entry MUST move to Done and its snapshot MUST be dropped.
- **FR-011**: Clicking an agent entry MUST focus its terminal, or notify when it no longer exists.
- **FR-012**: Clicking a PR entry MUST select the space whose repo matches (current space first), show the Pull requests panel and request that PR, waiting briefly after a space switch.
- **FR-013**: Opening an entry MUST mark it read without removing it.
- **FR-014**: Users MUST be able to mark one entry done, mark all done (`inbox.done-all`), remove one Done entry, and clear Done.
- **FR-015**: Done entries MUST expire after 7 days and the list MUST be capped at 150 entries; the list MUST persist across restarts.
- **FR-016**: Each row MUST show title, detail line, age and an unread dot; the header MUST show an unread count.
- **FR-017**: A narrow sidebar MUST collapse the inbox to an icon with an unread badge.
- **FR-018**: The inbox MUST only read from GitHub and MUST NOT modify any PR.

### Key Entities

- **Entry**: one agent or PR with kind, title, detail, tone, events, read/done flags and time.
- **PR snapshot**: last known reviews, comment counts, CI state and conflict flag of a PR.
- **Agent target / PR target**: where a click goes.

## Success Criteria *(mandatory)*

- **SC-001**: A blocked or finished agent appears in the inbox on the next redraw (within about a second).
- **SC-002**: A PR event appears within about 5 minutes (2 for an already-listed PR) of occurring.
- **SC-003**: From any space, one click reaches the agent's pane or the PR in the Pull requests panel.
- **SC-004**: Restarting the app produces no duplicate or stale entries.
- **SC-005**: A GitHub failure never shows an error; the inbox keeps working with what it has.

## Assumptions

- `gh` is signed in for the user's accounts, and the work account stays active (see `docs/gh-account.md`).
- Spaces follow the focused terminal's folder, whose `origin` remote identifies the repo.
- The Pull requests panel (`pr-flow`) honours the "go to PR" request.
- Agents report status values blocked / working / done through the app.

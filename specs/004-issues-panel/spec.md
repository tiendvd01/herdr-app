# Feature Specification: Issues Panel (as-built)

**Feature Branch**: `004-issues-panel` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Issues panel (mod `issues`) as it behaves today. Describe what it does and why, not how."

> Scope note: this repo has no automated tests. Acceptance scenarios come from `mods/issues/main.js`, `lib/gh-account.js`, `lib/markdown.js`, `docs/mods/issues.md` and `docs/gh-account.md`. The panel is read-only for issues: it never creates, edits, closes or reopens them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the issues of the repo I am working in (Priority: P1)

A user working in a terminal opens the Issues panel in the right column. It shows the GitHub repo of the focused terminal's folder and lists its issues (number, title, state, author, age, up to three labels). By default it shows issues that are Open and assigned to the user.

**Why this priority**: without a list tied to the current repo, nothing else in the panel is reachable.

**Independent Test**: focus a terminal inside a GitHub repo, open the panel, and confirm the repo name appears in the header and the list shows open issues assigned to you.

**Acceptance Scenarios**:

1. **Given** a terminal in a GitHub repo, **When** the panel is open, **Then** the header shows the repo name and the list shows issues with state mark, title, `#number`, author, age and labels.
2. **Given** a new space, **Then** the filters default to Open + Mine; a space that was used before keeps its previous choice.
3. **Given** the user switches Open / Closed / All or toggles Mine, **Then** the list reloads for that combination.
4. **Given** the focused folder is not a GitHub repo, **Then** the panel says "This folder is not a GitHub repo." and shows no list.
5. **Given** a filter result with no issues, **Then** the panel says "No issues".
6. **Given** the focused terminal changes folder or the user focuses another space, **Then** the panel follows to that repo and that space's own state.

---

### User Story 2 - Read an issue and its discussion (Priority: P1)

The user clicks an issue and reads its description and comments as formatted text, including diagrams and highlighted code, without leaving the app.

**Why this priority**: reading context before coding is the main reason to have the panel.

**Independent Test**: open an issue with comments, a mermaid block and a fenced code block; confirm all render, then use Back.

**Acceptance Scenarios**:

1. **Given** a list, **When** the user clicks an issue, **Then** the detail shows title, state, number, author, age, assignees, labels, description and every comment as cards.
2. **Given** a comment or description with a mermaid block, **Then** it is shown as a picture; a click opens a zoomable viewer; a broken diagram shows the renderer's error plus its source.
3. **Given** a fenced code block, **Then** it is colored by language with a language header and copy button; unknown or missing language shows plain text in the same frame.
4. **Given** the user clicks a comment header, **Then** that comment folds to its header plus the first 80 characters; "Collapse comments" / "Expand comments" folds or opens all.
5. **Given** the user clicks the external button ("Open on GitHub"), **Then** the issue opens in the browser.
6. **Given** the user clicks Back, **Then** the list returns; links in text open externally.
7. **Given** the app is reloaded or the user returns to a space, **Then** the issue that space had open is reopened.

---

### User Story 3 - Search and page through a long list (Priority: P2)

The user types a keyword in the search box at the bottom and presses Enter (or Search). Long lists load 30 at a time; scrolling to the end loads more.

**Why this priority**: repos can have far more issues than fit one screen.

**Independent Test**: search a word, confirm the list narrows; clear and scroll to the end of a repo with more than 30 matches and confirm "Loading more…" appears and more rows arrive.

**Acceptance Scenarios**:

1. **Given** text in the search box, **When** Enter or Search is pressed, **Then** the list is fetched with that query together with the current filters, and the query is remembered per space.
2. **Given** the end row scrolls into view and more issues may exist, **Then** the next 30 are requested once and "Loading more…" shows meanwhile.
3. **Given** fewer results than the page size, **Then** no further loading is attempted.

---

### User Story 4 - Fast, always-available display via cache (Priority: P2)

Reopening the panel, switching spaces or restarting the app shows the last known list and issue at once, with an "updated … ago" label, and fresh data replaces it quietly.

**Why this priority**: GitHub calls take seconds; the panel must feel instant.

**Independent Test**: open a list, restart the app, reopen the panel and confirm the old list shows immediately with an "updated" label, then refreshes.

**Acceptance Scenarios**:

1. **Given** a cached list or issue younger than one minute, **Then** it is used without a new fetch; an older one is shown while a new fetch runs.
2. **Given** a list never fetched for the current filters, **Then** the list area shows a centered spinner with "Loading issues…"; with a cache, the old list stays and only a small spinner shows in the filter bar.
3. **Given** an issue never opened, **Then** "Loading issue #N…" shows; with a cache the old content stays and a small spinner shows in the top bar.
4. **Given** the user presses Reload, **Then** the current list or issue is always fetched again.
5. **Given** two spaces on the same repo (for example main and a worktree), **Then** a result fetched for one updates the other too.

---

### User Story 5 - Summarize an issue with AI on demand (Priority: P3)

In an issue's detail the user clicks Summarize to get a short Vietnamese summary (goal, state, decisions, open items). The summary is kept and flagged when the issue has since changed.

**Why this priority**: helps the user regain context on a long thread quickly; optional.

**Independent Test**: click Summarize on an issue with comments, wait for the summary card, add a comment on GitHub, reload the issue and confirm the card is marked outdated.

**Acceptance Scenarios**:

1. **Given** an open issue, **When** the user clicks Summarize, **Then** the button reads "Summarizing…", a hint says it may take tens of seconds, and nothing runs until clicked.
2. **Given** the summary finishes, **Then** a highlighted Summary card appears above the description with its age, and the button becomes Re-summarize.
3. **Given** the description or any visible comment changed since the summary, **Then** the card title says "OUTDATED (issue changed since)"; changes to labels, assignees or state do not count, and hidden comments are ignored.
4. **Given** it fails or takes over 180 seconds, **Then** an error toast and an inline "Summary failed" line appear.
5. **Given** the issue has more than 50 comments, **Then** the first 20 and last 30 are used and the omission is noted.
6. **Given** the project has its own summary prompt, **Then** it is used instead of the default.

---

### Edge Cases

- A remote machine space does not detect a repo.
- A `gh` failure shows its message (trimmed) in the list or detail; a failure while an older copy is shown keeps the older copy.
- A fetch that never returns stops blocking its list or issue after about 45 seconds.
- Personal repos run as the matching logged-in GitHub account; org repos run as the active work account; the active account is never switched.
- Diagram rendering needs the mermaid tool on the machine; without it the diagram shows an error.
- Code blocks over 400 lines show uncolored.
- Panel width changes re-render diagrams only after dragging settles.
- Hidden (minimized) comments are excluded from summary and its outdated check but still shown in the discussion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The panel MUST determine the repo from the focused terminal's folder and follow folder or space changes; there MUST be no manual repo entry.
- **FR-002**: The panel MUST say "This folder is not a GitHub repo." when the folder has no GitHub repo.
- **FR-003**: Each space MUST keep its own state: state filter, Mine, search text, open issue; this MUST survive restart.
- **FR-004**: New spaces MUST default to Open + Mine.
- **FR-005**: Users MUST be able to filter by Open / Closed / All and Mine, and search by keyword submitted with Enter or the Search button.
- **FR-006**: The list MUST show number, title, state mark, author, age and up to three labels per issue, and MUST load 30 at a time with more on scrolling to the end.
- **FR-007**: The header MUST show the issue count (with "+" at 100 or more) and the repo, plus a Reload button that always refetches.
- **FR-008**: The detail MUST show title, state, number, author, age, assignees, labels, description and comments as markdown.
- **FR-009**: Mermaid blocks MUST render as pictures with a zoomable viewer; failures MUST show the error and source.
- **FR-010**: Fenced code MUST be color-highlighted with language header and copy button.
- **FR-011**: Users MUST be able to fold single comments and all comments; fold state is per open issue and not saved.
- **FR-012**: Users MUST be able to open the issue on GitHub in the browser; the panel MUST NOT create, edit, close or reopen issues.
- **FR-013**: Lists and issues MUST be cached in memory and on disk, shown immediately, refreshed after one minute of age or on Reload, and labelled "updated … ago".
- **FR-014**: Spaces viewing the same list or issue MUST all receive a fetched result.
- **FR-015**: A stuck fetch MUST not block the panel permanently.
- **FR-016**: Loading MUST show a full-area spinner when nothing is cached and a small spinner when a cached copy is shown.
- **FR-017**: AI summary MUST run only on click, MUST be stored outside the repo, MUST flag outdated summaries, and MUST report failures.
- **FR-018**: GitHub calls MUST use the account matching the repo owner without changing the active account.
- **FR-019**: GitHub errors MUST be shown to the user without breaking the panel.

## Key Entities *(include if feature involves data)*

- **Space state**: per space filters, search text and open issue.
- **Issue list entry / Issue detail**: summary row and full issue with comments.
- **Cache entry**: list or issue data with fetch time.
- **Summary**: AI text for an issue with the version it was made from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sees their assigned open issues for the current repo with zero configuration.
- **SC-002**: A previously viewed list or issue appears immediately on reopen, including after an app restart.
- **SC-003**: A user can read any issue with its diagrams and code without leaving the app.
- **SC-004**: The panel never stays in a loading state indefinitely.
- **SC-005**: A summary never silently describes an outdated issue.
- **SC-006**: No issue is modified by the panel.

## Assumptions

- `gh` is installed and logged in; the work account stays active.
- The mermaid tool (`mmdc`) and `claude` are available through the user's login shell; without them diagrams or summaries fail with a message.
- Only GitHub is supported; the list is limited to what `gh` returns.
- Issue creation and editing are out of scope.

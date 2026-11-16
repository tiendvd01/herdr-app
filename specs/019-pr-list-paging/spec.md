# Feature Specification: Pull requests list pages like Issues, count first

**Feature Branch**: `019-pr-list-paging`

**Created**: 2026-11-16

**Status**: Implemented

**Input**: User description: "PR manager nên làm infinite scroll như issue , và nên gọi api count trước"

## User Scenarios & Testing *(mandatory)*

Today the Pull requests list (dialog `pr-flow`) fills slowly: it first collects PR links (yours across every
repo, or every PR of the repos your terminals sit in), then fetches each PR one by one and only draws a row
once that PR's details arrive. "Load more" asks for a bigger batch of links, which may hold no PR of the
shown repo at all. The Open / Merged numbers are asked for in parallel and play no part in when the list
stops. The Issues panel, by contrast, shows a page of rows from one request, adds the next page when you
scroll to the end, and stops cleanly.

This feature makes the Pull requests list work the same way, for the repo of the space's folder: ask how
many PRs the view has first, then load and draw them a page at a time as the user scrolls.

### User Story 1 - The list appears a page at a time (Priority: P1)

The user opens Pull requests. The rows of the first page (newest activity first) appear together, each with
title, number, author, time, and the facts the row shows today. Scrolling to the bottom shows a
"Loading more…" row and then the next page below it, without moving what is already on screen.

**Why this priority**: This is the reported pain: a long wait and rows trickling in one by one.

**Independent Test**: In a repo with more than one page of open PRs, open Pull requests with view All · Open;
one page of rows appears at once; scroll to the end; the next page appends.

**Acceptance Scenarios**:

1. **Given** a repo with 75 open PRs and page size 20, **When** the user opens the list (All · Open), **Then** 20 rows appear from one load, not one by one.
2. **Given** 20 rows are shown, **When** the user scrolls to the last row, **Then** a "Loading more…" row appears and rows 21–40 are appended, and the scroll position stays.
3. **Given** 60 of 75 are shown, **When** the user scrolls to the end again, **Then** rows 61–75 are appended and no "Loading more…" row appears afterwards.
4. **Given** view Mine, **When** the list loads, **Then** only the repo's PRs authored by any of the user's logged-in accounts are listed, a page at a time, with no PR of another repo taking up a page.

---

### User Story 2 - The total is known first (Priority: P1)

Before any row is fetched, the list asks how many PRs the current view (repo, Open/Merged, Mine/All) has. The
number shows at once on the chip and in the header as "shown / total" (e.g. `20 / 75`). The list knows
from it whether there is more to load, and a view with 0 PRs shows the empty state straight away without
loading a list.

**Why this priority**: The user asked for it explicitly; it is what lets the list stop at the right place
and show progress.

**Independent Test**: Switch to a view with 0 merged PRs: empty state appears without a list load. Switch to a
view with 75: header shows `20 / 75` after the first page.

**Acceptance Scenarios**:

1. **Given** a view is opened, **When** its count arrives, **Then** the chip shows the total and the list requests only as many pages as needed to reach it.
2. **Given** the count is 0, **When** the view opens, **Then** the empty state shows and no list request is made.
3. **Given** the count fails (network, rate limit), **When** the list loads, **Then** it still loads pages and falls back to "a full page means there may be more", and the header shows only the shown number.
4. **Given** the count says 75 but GitHub returns fewer rows in the end (PRs merged or closed meanwhile), **When** a page returns fewer rows than asked, **Then** loading stops and no endless "Loading more…" remains.

---

### User Story 3 - Switching views and coming back is instant (Priority: P2)

Switching Open ↔ Merged or Mine ↔ All shows that view's last loaded rows and total at once (if loaded in the
last minutes), then refreshes them in the background. Pages already loaded stay loaded.

**Why this priority**: Comfort; matches Issues' cache behaviour.

**Independent Test**: Load two pages of Open, switch to Merged, switch back: two pages of Open appear at once.

**Acceptance Scenarios**:

1. **Given** Open was loaded to 60 rows, **When** the user goes to Merged and back, **Then** 60 rows show immediately and refresh without collapsing to one page.
2. **Given** Refresh is pressed, **When** the view reloads, **Then** the count is asked again first, then the loaded pages.

### Edge Cases

- Space folder is not a GitHub repo, or the repo is still being looked up: no count or list request; the existing messages show.
- A PR an agent is working on (its branch has a terminal) but outside the loaded pages: it still appears in the list as today.
- Opening a PR from the inbox that is not in the loaded pages: it opens as today.
- PRs change between pages (a new PR pushes rows down): a row already shown is not shown twice.
- Page fetch fails: the error line shows, the rows already loaded stay, scrolling to the end tries again.
- Several logged-in gh accounts (Mine): count and list include the PRs of every account's login, each request run as the repo's account.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The list MUST show PRs of the space's repo only, in the chosen view (Open or Merged, Mine or All), newest activity first.
- **FR-002**: On opening a view, the system MUST request the view's total count before requesting the first page.
- **FR-003**: When the total is 0, the system MUST show the empty state without a list request.
- **FR-004**: Each page MUST be fetched in one request that returns everything a row needs to be drawn; rows of a page MUST appear together.
- **FR-005**: Scrolling to the end MUST load the next page while shown < total (or, with no total, while the last page came back full), showing a "Loading more…" row during the load.
- **FR-006**: The header MUST show `shown / total` when the total is known and larger than shown, else the shown number; the Open and Merged chips MUST show their totals.
- **FR-007**: Details needed only by the opened PR (review threads, linked issues, CI runs, diff) MUST be fetched when the PR is opened or is on an agent's branch, not for every listed row.
- **FR-008**: A view's loaded rows, how many pages, and total MUST be kept per view for some minutes so switching back shows them at once and refreshes in the background.
- **FR-009**: A refresh MUST ask for the count again, then reload the loaded number of rows.
- **FR-010**: PRs found from agents' branches (current behaviour) MUST keep appearing, merged into the list without duplicates.
- **FR-011**: Failures MUST NOT clear rows already shown; the error line shows and the next scroll to the end retries.

### Key Entities

- **View**: repo + state (open/merged) + scope (mine/all). Has a total (or unknown), loaded rows, page count, last loaded time, loading flag, error.
- **Row**: one PR with the fields the list row shows (title, number, author, updated time, state, draft, review decision, checks summary, size).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The first page of rows appears in about the time of one request (typically under 3 s), instead of growing row by row.
- **SC-002**: A view's total is visible before or together with its first page in 100% of loads where the count succeeds.
- **SC-003**: Scrolling a 75-PR view to the end shows all 75 rows exactly once, then no further loading row.
- **SC-004**: Opening the list of N rows costs about one count plus ceil(N / page) list requests, not 2 × N per-PR requests.
- **SC-005**: Switching back to a view loaded in the last 5 minutes shows its rows with no visible wait.

## Assumptions

- Page size is 20 rows (a PR row carries more data than an issue row).
- "Mine" means authored by any of the logged-in gh accounts' logins; "All" means every author.
- The list covers the repo of the space's folder only (what the dialog already filters to); PRs of other repos are out of scope for the list.
- Row facts that need per-PR data the list request cannot return (unresolved review thread count) may appear after the row, or only on PRs that are opened / on an agent's branch.
- Merged PRs keep today's window rules for what counts as recent only where the current list applies them; the Merged view lists merged PRs newest first, paged.
- No change to the PR detail, diff, comments, or merge screens.

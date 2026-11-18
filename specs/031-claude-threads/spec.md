# Feature Specification: Claude Threads per Space

**Feature Branch**: `031-claude-threads`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Làm chức năng quản lí thread của claude theo từng space, lúc ấn thread cũ thì mở ra ở tab mới ngay trong space đấy, threads sẽ mở được từ nhóm button ở góc bên phải, và mở lên side panel ở bên phải như các mod files"

## Context

Every Claude conversation (a "thread") is saved on disk, grouped by the folder it was started in.
Today, getting back to an older thread means opening a terminal in the right folder, starting
Claude's resume picker and scrolling a plain list. Nothing in the window shows which threads a
space has, which of them are still running in a tab, or what each one was about.

This feature adds a **Threads** panel to the right-hand side panel (next to Files and Issues),
opened from the same button group at the right end of the tab bar. It lists the Claude threads of
the space's folder, newest first, and clicking one resumes it in a new tab of that same space.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resume an old thread in the current space (Priority: P1)

The user is working in a space and wants to continue yesterday's Claude conversation. They click
the Threads button in the tab bar's right button group; the right side panel opens on Threads and
lists the threads of the space's folder, newest first, each with its title, when it was last
active and how long it is. They click one; a new tab opens in the same space, in the thread's
folder, with that conversation resumed.

**Why this priority**: this is the whole reason for the feature; listing alone has little value
without resuming.

**Independent Test**: in a space whose folder has older threads, open the Threads panel, click a
thread, and check that a new tab appears in that space running Claude with that conversation's
history.

**Acceptance Scenarios**:

1. **Given** a space whose folder has 12 saved threads, **When** the user opens the Threads panel,
   **Then** 12 rows show, newest activity first, each with a title, relative time and message count.
2. **Given** the Threads panel is open, **When** the user clicks a thread that is not running,
   **Then** a new tab opens in the current space, in that thread's folder, resuming that thread,
   and the new tab gets focus.
3. **Given** the Threads panel is open, **When** the user clicks the Threads button again,
   **Then** the side panel hides (same toggle as Files and Issues).
4. **Given** the user switches to another space (or focuses a terminal in another folder),
   **When** the panel redraws, **Then** it lists the threads of the new folder.

---

### User Story 2 - Don't open a thread twice (Priority: P2)

A thread that is already running in a tab of the window is marked as running in the list.
Clicking it brings that tab (and its space) to the front instead of starting a second copy.

**Why this priority**: two live copies of one thread write over each other's history; the mark
also tells the user at a glance which threads are still live.

**Independent Test**: resume a thread from the panel, go back to the panel, check the thread is
marked running, click it, and check focus moves to the existing tab and no new tab appears.

**Acceptance Scenarios**:

1. **Given** a thread is running in a tab, **When** the list shows, **Then** its row carries a
   running mark.
2. **Given** a running thread, **When** the user clicks it, **Then** its tab is focused and no
   new tab is created.
3. **Given** the running tab is closed, **When** the list refreshes, **Then** the mark is gone
   and clicking resumes it in a new tab again.

---

### User Story 3 - Find a thread and start a new one (Priority: P3)

A search box filters the list by title and first prompt. A "New thread" button starts a fresh
Claude tab in the space's folder (with the project's skills, like the + menu's Claude row).

**Why this priority**: useful once a folder has dozens of threads, but resuming works without it.

**Independent Test**: type part of an old prompt in the search box and check only matching
threads stay; click New thread and check a new Claude tab opens in the space's folder.

**Acceptance Scenarios**:

1. **Given** 40 threads, **When** the user types "migration", **Then** only threads whose title or
   first prompt contains it (case-insensitive) stay listed, with a "shown / total" count.
2. **Given** no thread matches, **When** the search is active, **Then** an empty state says so
   and offers to clear the search.
3. **Given** the panel is open, **When** the user clicks New thread, **Then** a new tab running a
   fresh Claude session opens in the space's folder.

---

### User Story 4 - Remove a thread (Priority: P3)

The user can delete a thread they no longer want from the list, with a two-step confirm. A
running thread cannot be deleted.

**Why this priority**: housekeeping; the list stays useful without it.

**Independent Test**: delete a test thread with the two-step confirm and check it disappears from
the list and from the folder's saved threads.

**Acceptance Scenarios**:

1. **Given** a thread that is not running, **When** the user right-clicks it, **Then** the row
   turns red and asks for confirmation; a click on it removes the thread; Esc, another row or 4 s cancels.
2. **Given** a running thread, **When** the user right-clicks it, **Then** nothing is armed.

### Edge Cases

- The space's folder has no saved threads: an empty state with a New thread button.
- The space has no terminal yet: the panel uses the space's starting folder.
- A thread file is unreadable or half-written (Claude is writing to it right now): it is still
  listed with whatever could be read, never crashes the panel.
- A thread whose first message is a command or tool output, not a typed prompt: the title falls
  back to the first real typed prompt, then to "Untitled thread".
- Hundreds of threads in one folder: the list stays responsive; only the visible part is drawn and
  the per-thread summary is cached by file change time.
- A remote (SSH) space: threads live on the other machine; the panel says threads are only listed
  for local spaces.
- Claude is not installed / not on the path: resuming shows one warning instead of an empty tab.
- Sub-agent conversations stored next to the threads are not listed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tab bar's right button group MUST have a Threads button that opens the right
  side panel on Threads, and hides it when Threads is already shown, exactly like Files and Issues.
- **FR-002**: The panel MUST list the saved Claude threads of the space's current folder (the
  focused terminal's folder, following the same rule as the other panels), newest activity first.
- **FR-003**: Each row MUST show the thread's title (Claude's own title if it has one, else the
  first typed prompt, shortened), the relative time of the last activity, and the number of
  messages; the branch it was started on MAY be shown when known.
- **FR-004**: Clicking a thread that is not running MUST open a new tab in the current space, in
  the thread's folder, that resumes the thread, and focus it.
- **FR-005**: Resuming MUST start Claude the same way the + menu's Claude row does, so the
  project's selected skills stay attached.
- **FR-006**: A thread already running in a tab MUST be marked as running; clicking it MUST focus
  that tab instead of starting another copy.
- **FR-007**: The panel MUST offer a search box that filters by title and first prompt,
  case-insensitively, with a "shown / total" count.
- **FR-008**: The panel MUST offer a New thread action that starts a fresh Claude tab in the
  space's folder.
- **FR-009**: Users MUST be able to delete a thread that is not running, with a two-step confirm.
- **FR-010**: The list MUST refresh on its own while shown (new threads and new activity appear
  within a few seconds) and when the space or focused folder changes.
- **FR-011**: The search text MUST be kept per space, so switching spaces and back restores it.
- **FR-012**: The panel MUST follow the personal UI kit (buttons, empty state, header, input
  frame) like the other personal panels.
- **FR-013**: Nothing in the panel writes to Claude's saved threads except the explicit delete.

### Key Entities

- **Thread**: one saved Claude conversation. Attributes: id, folder it ran in, title, first
  prompt, last activity time, message count, branch (optional), running or not.
- **Space folder**: the folder whose threads are listed; follows the focused terminal.
- **Running thread**: a thread whose id a live tab's Claude process is using.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any space, the user resumes an old thread in at most 2 clicks (button, row).
- **SC-002**: The thread list of a folder with 200 threads appears in under 1 second on second
  open, and under 3 seconds on first open.
- **SC-003**: Clicking a running thread never creates a second copy (0 duplicates in testing).
- **SC-004**: A newly started thread appears in the list within 5 seconds while the panel is shown.
- **SC-005**: A thread's title in the list matches what the user would recognise (Claude's title or
  their first prompt) for at least 9 of 10 threads checked by hand.

## Assumptions

- "Theo từng space" (per space) means the threads of the space's current folder, the folder the
  focused terminal is in, as the other side panels already do. A worktree is a different folder
  and so has its own threads (Claude saves them that way).
- "Thread" means a Claude Code conversation saved on this machine; other agents are out of scope.
- The panel is a new personal panel in the right side panel stack, next to Files and Issues, not a
  dialog.
- Rename, export and merging threads are out of scope for this version.
- Remote spaces are out of scope; they get a short note instead of a list.

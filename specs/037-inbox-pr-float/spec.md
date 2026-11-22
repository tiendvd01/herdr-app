# Feature Specification: PR inbox in a dialog, opened from a floating button

**Feature Branch**: `037-inbox-pr-float`

**Created**: 2026-11-22

**Status**: Implemented

**Input**: User description: "Tôi muốn update tính năng inbox thành chỉ nhận thông báo của PR. Và inbox sẽ chuyển lên hiển thị trên dialog và được mở từ 1 float button ở trên màn hình có thể kéo thả di chuyển được; nó nên được nằm ở vùng khoanh đỏ này" (screenshot: bottom-right corner of the terminal area, just above the status bar)

## Context

Today the Inbox is a third list in the left sidebar, under Spaces and Agents. It collects two kinds of entries: agents that need the user or finished, and news on the user's open PRs (reviews, new comments, failed CI, conflicts). Agent news already shows in the Agents list right above it, so the Inbox repeats it, and the block takes a third of the sidebar's height even when it is empty. The user wants the Inbox to be about PRs only, out of the sidebar, in a dialog that a small floating button opens. The button sits by default at the bottom-right of the terminal area and can be dragged elsewhere.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See PR news from a floating button (Priority: P1)

A small Inbox button floats over the bottom-right corner of the terminal area. It shows how many unread PR entries there are. Clicking it opens the Inbox as a dialog with the list of PR entries (newest first, each with its events: review, approve, comments, CI failed, conflict). Clicking an entry opens Pull requests on that PR, as today. Clicking the button again, or Esc, closes the dialog.

**Why this priority**: it is the request: PR news reachable without a sidebar block.

**Independent Test**: with a PR entry in the inbox, the button shows a count of 1; click it, the dialog lists the entry; click the entry, Pull requests opens on that PR.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the terminal area, **Then** an Inbox button floats at its bottom-right corner, above the status bar.
2. **Given** unread PR entries, **Then** the button shows their number; with none, it shows no number and looks quiet.
3. **Given** the dialog is closed, **When** the user clicks the button, **Then** the Inbox dialog opens; **When** they click it again or press Esc, **Then** it closes.
4. **Given** an entry in the dialog, **When** the user clicks it, **Then** the dialog closes and Pull requests opens on that PR (switching to that repo's space first when another space holds it), and the entry counts as read.
5. **Given** entries in the dialog, **Then** "Mark as done", "Mark all as done", the folded Done group and its Clear still work as today.

---

### User Story 2 - Move the button out of the way (Priority: P2)

The user drags the button to another place over the terminal area. It settles there and stays there after the app restarts.

**Why this priority**: the default spot can cover terminal text; the user must be able to move it.

**Independent Test**: drag the button to the top-right; it stays there; restart the app; it is still at the top-right.

**Acceptance Scenarios**:

1. **Given** the button, **When** the user drags and drops it elsewhere over the terminal area, **Then** it settles near where it was dropped and keeps working.
2. **Given** a moved button, **When** the app restarts, **Then** the button is where the user left it.
3. **Given** a drag, **Then** releasing it does not open the dialog.

---

### User Story 3 - Only PR news in the Inbox (Priority: P1)

The Inbox no longer gets entries for agents that need the user or finished. Only the user's open PRs make entries. The sidebar no longer has an Inbox block, so Spaces and Agents share its height.

**Why this priority**: the other half of the request; agents already show in the Agents list.

**Independent Test**: let an agent finish: no Inbox entry and no count change. Get a review on an open PR: an entry appears and the count goes up.

**Acceptance Scenarios**:

1. **Given** an agent goes to "needs you" or finishes, **Then** no Inbox entry is made and the button's count does not change.
2. **Given** a new review, comment, failed CI or conflict on one of the user's open PRs, **Then** an entry for that PR appears (or its entry moves to the top, unread) and a notification is posted, as today.
3. **Given** agent entries saved from before this change, **When** the Inbox first loads, **Then** they are gone; PR entries are kept.
4. **Given** the left sidebar, **Then** it has no Inbox block.
5. **Given** a PR notification toast, **When** the user clicks it, **Then** Pull requests opens on the newest PR entry, as today.

### Edge Cases

- No GitHub login or no open PRs: the button stays, with no count; the dialog shows an empty state that says PR news shows up here.
- Many unread entries: the count shows up to 99, then "99+".
- The dialog is open and new PR news arrives: the list updates in place.
- Pull requests is already open when an entry is clicked: it moves to that PR instead of closing.
- The button never covers the status bar, the tab bar or the sidebar; it lives over the terminal area only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Inbox MUST make entries only for the user's open PRs (reviews, approvals, new comments, failed CI, conflicts); it MUST NOT make entries for agent states.
- **FR-002**: Saved agent entries MUST be dropped on load; saved PR entries and PR snapshots MUST be kept.
- **FR-003**: The sidebar MUST NOT show the Inbox block.
- **FR-004**: A floating Inbox button MUST be shown over the terminal area, by default at its bottom-right corner.
- **FR-005**: The button MUST show the number of unread PR entries when there are any (capped as "99+"), and no number otherwise.
- **FR-006**: The user MUST be able to drag the button to another spot over the terminal area; the spot MUST be kept across restarts.
- **FR-007**: Clicking the button MUST open the Inbox dialog when it is closed and close it when it is open; Esc MUST close it.
- **FR-008**: The dialog MUST list PR entries with the same content and actions as today's Inbox (events with marks, age, unread dot, mark as done, mark all as done, Done group, remove, clear).
- **FR-009**: Clicking an entry MUST close the dialog and open Pull requests on that PR, as today.
- **FR-010**: PR polling and notifications MUST keep running while the dialog is closed.
- **FR-011**: The dialog MUST follow the dialog border rule (one frame, drawn by the mod).

### Key Entities

- **Inbox entry**: one per PR: title (`#number title`), repo, list of events, worst-event mark, time, read/done.
- **PR snapshot**: the last look at each open PR, used to tell what is new.

## Success Criteria *(mandatory)*

- **SC-001**: PR news is one click away from anywhere in the app (button, then the list).
- **SC-002**: The sidebar gains back the Inbox block's height for Spaces and Agents.
- **SC-003**: 0 Inbox entries come from agent state changes.
- **SC-004**: A moved button is in the same spot after a restart in 100% of tries.

## Assumptions

- "The terminal area" is the tab content area between the tab bar and the status bar; the right panel, when shown, is not part of it.
- The button settles near the drop point (snapping to the closest edge and third), not at the exact pixel; that is enough to move it off text.
- The button stays shown when there is nothing unread (quiet look), so the Inbox is always reachable.
- Agent notifications (toasts) that Herdr itself posts are not touched; only the Inbox's agent entries go.
- Dialog size follows the other dialogs' style but smaller (a list, not a workspace).

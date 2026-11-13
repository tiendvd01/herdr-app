# Feature Specification: Sessions Manager (as-built)

**Feature Branch**: `001-sessions-manager` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing session manager as it behaves today, based on the code in src/ and its tests. Describe what it does and why, not how."

> Scope note: this repo has no `src/` and no tests. The "session manager" was confirmed with the user to be the Sessions dialog (mod `processes`), documented from `mods/processes/main.js` and `docs/mods/processes.md`. There are no automated tests, so acceptance scenarios below come from the observed behaviour of the code.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See every running Claude session and what it costs (Priority: P1)

A user running several Claude Code sessions across spaces opens the Sessions dialog from the status bar badge. They see each session with its status, title, location (space › tab), age, number of processes, CPU and memory, plus totals for all sessions at the top.

**Why this priority**: without visibility, the user cannot tell which session is hogging the machine or is stuck. Everything else builds on this.

**Independent Test**: start two Claude Code sessions in different spaces, open the dialog, and confirm both appear with correct location and resource figures and that the header totals add up.

**Acceptance Scenarios**:

1. **Given** Claude sessions are running, **When** the user opens the dialog, **Then** every live session is listed, sorted by number of running processes (most first), with a status dot (blocked / working / done / idle).
2. **Given** a session's CPU is actually rising between two refreshes (at least 10%), **When** the dialog shows it, **Then** it carries a "Running" label; a session whose CPU only looks high from a decaying average does not.
3. **Given** no Claude sessions exist, **When** the dialog is open, **Then** it says "No Claude sessions running"; before the first data arrives it says "Loading…".
4. **Given** the user presses Escape or Close, **Then** the dialog closes.

---

### User Story 2 - Jump to a session (Priority: P2)

From the list, the user goes straight to the session's pane.

**Why this priority**: finding the right terminal among many spaces and tabs is the main reason to look at the list.

**Independent Test**: click Go on a session in another space and confirm that space, tab and pane become focused and the dialog closes.

**Acceptance Scenarios**:

1. **Given** a session in a different space, **When** the user clicks Go, **Then** its space, tab and pane are selected and the dialog closes.

---

### User Story 3 - Pause, resume or stop a session's child processes (Priority: P2)

A session spawns child processes (builds, servers, tests). The user expands a session to see them and can pause or resume each one, or stop all of a session's children at once, without touching Claude itself.

**Why this priority**: lets the user reclaim CPU or end runaway work while keeping the conversation alive.

**Independent Test**: expand a session with a running child, Pause it and confirm it shows "paused" and stops consuming CPU; Resume and confirm it continues; Stop all and confirm children end while Claude stays open.

**Acceptance Scenarios**:

1. **Given** an expanded session with children, **When** the user clicks Pause on a child, **Then** it (and its sub-processes) is suspended and labelled "paused"; Resume reverses this.
2. **Given** a session with children, **When** the user clicks Stop all, **Then** every child is asked to terminate and Claude is left running; these terminations are not reported as "Process finished".
3. **Given** a session with no children, **When** expanded, **Then** it shows "No running processes", and the Stop all button is not offered.
4. **Given** the user uses Expand all / Collapse all, **Then** every session expands or collapses together.

---

### User Story 4 - Restart a session to shed context (Priority: P3)

The user restarts a long session: Claude exits, the same conversation is resumed in the same terminal, and the conversation is compacted.

**Why this priority**: long sessions slow down and use memory; this frees them without losing the conversation and without manual typing.

**Independent Test**: click Restart on an idle session and confirm the same conversation returns in the same terminal and a compact is issued; close the dialog mid-way and confirm it still completes.

**Acceptance Scenarios**:

1. **Given** a running session, **When** the user clicks Restart, **Then** Claude is exited, the previous conversation is resumed (by its id if found, otherwise by continuing the latest), and once the Claude interface is ready a compact is sent.
2. **Given** a restart is in progress, **When** the user closes the dialog, **Then** the restart still finishes.
3. **Given** Claude does not exit in time, or the interface is not recognised as ready in time, **When** the wait expires, **Then** the problem is written to a log file and no compact is sent.
4. **Given** a restart was just started, **Then** the session shows a spinner for a short fixed time and cannot be restarted again during it.

---

### User Story 5 - Delete a session (Priority: P3)

The user removes a session they no longer want, which closes its terminal and pane.

**Why this priority**: cleans up finished or abandoned sessions.

**Independent Test**: click Delete and confirm the row disappears at once and the terminal is closed.

**Acceptance Scenarios**:

1. **Given** a session, **When** the user clicks Delete, **Then** its row disappears immediately and its terminal and pane are closed.
2. **Given** a session already deleted, **When** Delete is triggered again, **Then** nothing further happens and no error is shown.

---

### Edge Cases

- A session whose terminal has since closed never appears, even if the latest snapshot still contains it.
- Only Claude Code sessions are listed; other agents (codex, gemini, ...) are not.
- If a data refresh hangs, a later refresh is still allowed after about 20 seconds so the list does not freeze.
- Refresh forces an immediate update; otherwise data updates every few seconds on its own.
- Restart depends on recognising Claude's on-screen interface; if Claude's interface changes, the compact step is skipped and logged.
- Pause/Resume/Stop apply to all processes in a child's group, not just the top one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dialog, opened from the status bar process badge, that lists all running Claude Code sessions across all spaces.
- **FR-002**: For each session, the system MUST show status, title, space › tab, age, process count, total CPU and memory.
- **FR-003**: The system MUST show header totals: sessions, processes, CPU and RAM.
- **FR-004**: The system MUST mark a session "Running" only when its CPU use is actually increasing (at least 10% between refreshes).
- **FR-005**: The system MUST list only sessions whose terminal still exists and exclude ones the user just deleted.
- **FR-006**: Users MUST be able to jump to a session's space, tab and pane, closing the dialog.
- **FR-007**: Users MUST be able to expand/collapse a session, and all sessions at once, to see its child processes.
- **FR-008**: Users MUST be able to pause and resume each child process, including its sub-processes.
- **FR-009**: Users MUST be able to stop all children of a session without ending Claude, and such stops MUST NOT trigger "Process finished" notices.
- **FR-010**: Users MUST be able to restart a session: exit Claude, resume the same conversation in the same terminal, then compact it; the job MUST continue if the dialog is closed.
- **FR-011**: Restart failures MUST be recorded in a log file rather than shown as blocking errors.
- **FR-012**: Users MUST be able to delete a session, which closes its terminal and pane, hides the row at once, and is safe to repeat.
- **FR-013**: Users MUST be able to force a refresh and to close the dialog with Escape or Close.
- **FR-014**: The system MUST show "Loading…" before data arrives and "No Claude sessions running" when there are none.

### Key Entities

- **Session**: one Claude Code instance in a terminal; has a status, title, location (space, tab, pane), age, and a set of child processes.
- **Child process**: a task started by a session (with its own sub-processes); has age, CPU, memory and a paused/running state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can identify which session uses the most CPU and memory within 5 seconds of opening the dialog.
- **SC-002**: A user can reach any session's terminal in one click from the dialog.
- **SC-003**: Session data on screen is no more than about 5 seconds old without manual action, and a manual refresh updates it within about 1 second.
- **SC-004**: A deleted session disappears from the list immediately (no visible delay).
- **SC-005**: A restart completes with no further user input in the normal case, and a failed restart always leaves a log entry.

## Assumptions

- The user is on macOS or Linux with the process tools and Herdr command-line tool available.
- Only Claude Code sessions are in scope; other agents are intentionally excluded.
- "Session manager" means the Sessions dialog; the status bar badge that opens it is part of a separate feature and is not specified here.
- No automated tests exist; behaviour was read from the code and the existing mod notes.
- The restart spinner is a fixed-length indicator and does not reflect the real job state.

# Feature Specification: Port Manager (as-built)

**Feature Branch**: `010-port-manager` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Ports tab of Project Settings as it behaves today. Describe what it does and why, not how."

> Scope note: this repo has no tests. The Ports tab is the first tab of the Project Settings page (mod `project-settings`, `mods/project-settings/main.js`, `docs/mods/project-settings.md`). The Worktree script tab is spec 009 and the Summary prompt tab is out of scope. No other mod (`status-usage`, `my-worktree`, `project-scripts`) handles ports. Acceptance scenarios come from the observed behaviour of the code.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See which ports each worktree is using (Priority: P1)

A user works on a project with several git worktrees, each running dev servers. In Project Settings, on the Ports tab, they see every listening TCP port grouped under the worktree that owns it, so they know which branch is holding which port.

**Why this priority**: port clashes between worktrees are the main pain; knowing who owns a port is the base of everything else.

**Independent Test**: start a server in the main checkout and another in a second worktree, open Project Settings > Ports, and confirm each port appears under the right worktree.

**Acceptance Scenarios**:

1. **Given** a project with worktrees, **When** the user opens the Ports tab, **Then** each worktree is a card showing branch (or "(detached)"), a "main" marker for the main checkout, and its path; the main checkout is listed first, the others alphabetically by branch.
2. **Given** a listening server whose working folder is inside a worktree (or a sub-folder), **When** the list loads, **Then** its port is shown in that worktree; when worktrees are nested, the deepest matching one wins.
3. **Given** a worktree with no listeners, **Then** its card shows "No port in use" and a dim status dot; with listeners the dot is green.
4. **Given** a listener outside every worktree of the project, **Then** it is not shown.
5. **Given** the header, **Then** it states the total number of listening ports and worktrees and that the list auto-refreshes every 3 seconds.

---

### User Story 2 - Know what is behind a port (Priority: P2)

Each row shows the port number, the full command line with the process id, and the folder (relative to the worktree) the process runs in.

**Why this priority**: a bare number is not enough to tell a dev server from a stale process.

**Independent Test**: start a server from a sub-folder and confirm the row shows its command, pid and relative folder ("./" at the worktree root).

**Acceptance Scenarios**:

1. **Given** a listener, **Then** its row shows the port, the command with arguments and pid, and its folder relative to the worktree; the user's home path in the command is abbreviated to "~".
2. **Given** a process listening on several ports, **Then** each port gets its own row; the same pid and port pair never appears twice.
3. **Given** ports are sorted, **Then** rows within a worktree are in ascending port order.

---

### User Story 3 - Jump to the terminal running it (Priority: P2)

When the server was started in one of the app's terminals, a Terminal button takes the user to that pane.

**Why this priority**: the quickest way to read logs or press Ctrl-C is to be in that terminal.

**Independent Test**: start a server in a terminal pane in another space, click Terminal on its row, and confirm that space, tab and pane are focused and the main work view is shown.

**Acceptance Scenarios**:

1. **Given** a listener sharing a controlling terminal with an app terminal's foreground process, **When** the user clicks Terminal, **Then** the page returns to the main work view and that space, tab and pane become selected.
2. **Given** no app terminal is found for the listener (started elsewhere, or detached), **Then** no Terminal button is shown.

---

### User Story 4 - Open or stop a port (Priority: P2)

The user opens the service in a browser or stops the process holding the port.

**Why this priority**: the usual follow-ups are "look at it" and "free the port".

**Independent Test**: click Open on a web server row and confirm the browser loads localhost on that port; click Stop and confirm the row disappears on the next refresh.

**Acceptance Scenarios**:

1. **Given** a row, **When** the user clicks Open, **Then** the default browser opens `http://localhost:<port>`.
2. **Given** a row, **When** the user clicks Stop, **Then** the process is sent a normal termination signal (not a forced kill); the row goes away on the next refresh if it exits.
3. **Given** the Stop action, **Then** no confirmation is asked.

---

### User Story 5 - Choose the project and refresh on demand (Priority: P3)

The left column lists the git projects of all open spaces; the user picks one, and can force a reload.

**Why this priority**: the user often works in several repos.

**Independent Test**: open spaces in two repos, switch between them, and confirm the lists change; click Reload and confirm it shows "Reloading…" then updates.

**Acceptance Scenarios**:

1. **Given** open spaces, **Then** the project list contains each distinct git repository (worktrees of one repo count once), sorted by name; spaces on another machine are ignored.
2. **Given** the page opens, **Then** the project of the active space is selected; otherwise the first one.
3. **Given** the user picks another project, **Then** the previous list is cleared and the new one loads immediately.
4. **Given** no git projects are open, **Then** the page says "No git projects open" and "Open a git project to configure it.".
5. **Given** the user clicks Reload, **Then** the button reads "Reloading…" until done, and a reload already in progress is not duplicated.

---

### Edge Cases

- Auto-refresh runs only while the Ports tab is shown; Reload works regardless of tab state of the timer but only forces one scan.
- Every 5 seconds the project list is rescanned, but only re-read when the spaces (id, folder, active) changed; a selected project that disappears is replaced by the active one.
- A failed scan keeps the previous list and does not show an error.
- A result that arrives after the user switched project is discarded.
- Processes whose working folder cannot be read are skipped.
- Only TCP listeners are covered; UDP and outgoing connections are not.
- Stop only signals the single pid shown; children of that process are not touched.
- Works only where the standard process tools exist (macOS/Linux).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Ports tab in Project Settings listing listening TCP ports of the selected project, grouped by git worktree.
- **FR-002**: The system MUST assign a listener to the worktree containing its working folder, choosing the deepest match, and MUST omit listeners outside all worktrees.
- **FR-003**: The system MUST show for each worktree its branch (or detached), a main marker, its path (home abbreviated) and an activity dot.
- **FR-004**: For each listener the system MUST show port, command line, pid and folder relative to the worktree, sorted by port, without duplicate pid/port pairs.
- **FR-005**: The system MUST show the number of listening ports and worktrees, and refresh automatically every 3 seconds only while the tab is visible.
- **FR-006**: Users MUST be able to force a reload; while loading, the button MUST say "Reloading…" and overlapping loads MUST NOT start.
- **FR-007**: The system MUST offer a Terminal action only when the listener's controlling terminal matches an app terminal, and it MUST focus that space, tab and pane.
- **FR-008**: Users MUST be able to open `http://localhost:<port>` in the default browser.
- **FR-009**: Users MUST be able to stop a listener with a normal termination signal to its pid.
- **FR-010**: The system MUST list all distinct git projects of the open local spaces, preselect the active space's project, and let the user switch.
- **FR-011**: The system MUST discard scan results that belong to a project no longer selected, and keep the previous list if a scan fails.
- **FR-012**: The system MUST show "No port in use" for empty worktrees and "No git projects open" when no project exists.

### Key Entities

- **Project**: a git repository (identified by its main checkout) from one or more open spaces.
- **Worktree**: a checkout of the project with a path, a branch and a main flag; owns the listeners inside it.
- **Listener**: a process with a pid, command line, port, working folder and optionally the terminal that runs it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can find which worktree holds a given port within 5 seconds of opening the tab.
- **SC-002**: A user can reach the owning terminal, open the page, or free the port in one click.
- **SC-003**: Port data is at most about 3 seconds old while the tab is shown; Reload updates it within about 1 second.
- **SC-004**: Switching project shows the new project's ports with no stale rows from the previous one.

## Assumptions

- macOS or Linux with `git`, `lsof` and `ps` available.
- Ports do not persist anything; the tab is read-only except for Stop and Open.
- The Worktree script and Summary prompt tabs are separate features.
- Stop sends SIGTERM only; a process that ignores it stays until stopped manually.
- No automated tests exist; behaviour was read from the code and the mod notes.

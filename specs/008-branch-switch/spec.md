# Feature Specification: Branch Switch Popup (as-built)

**Feature Branch**: `008-branch-switch` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the branch switch popup, opened from the status bar, that changes the branch of the space's folder. Describe what it does and why, not how."

> Scope note: this repo has no tests. Scenarios come from the observed behaviour of `mods/branch-switch/main.js`, `lib/space-folder.js`, `docs/space-folder.md` and `docs/mods/status-usage.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch to an existing branch (Priority: P1)

The user clicks the branch name in the status bar. A popup lists the branches of the repository in the space's folder, with a filter box. They pick one by click, or with arrows and Enter, and the folder moves to that branch.

**Why this priority**: changing branch without leaving the app or typing git commands is the whole point.

**Independent Test**: open the popup in a git space, pick another local branch, and confirm the status bar shows it and a success toast appears.

**Acceptance Scenarios**:

1. **Given** a space whose folder is a git repository, **When** the user opens the popup, **Then** it lists local branches (newest commit first, the current one on top with a check mark), then branches that exist only on the remote, each with a short note (age, "current" or "remote").
2. **Given** the list, **When** the user types in the filter, **Then** only branches whose name contains the text (case-insensitive) remain and the highlight returns to the first row.
3. **Given** a highlighted row, **When** the user presses Enter or clicks it, **Then** the branch is switched, a "Switched branch" toast shows, and the popup closes.
4. **Given** the user picks the branch that is already current, **Then** the popup simply closes.
5. **Given** a remote-only branch, **When** picked, **Then** a local branch tracking it is created and checked out.
6. **Given** a switch succeeded, **Then** the status bar branch refreshes at once rather than waiting for its next poll.

---

### User Story 2 - Create a new branch (Priority: P2)

The user types a name that matches no existing branch. A "Create branch" row appears at the end of the list; picking it creates the branch from the current HEAD and switches to it.

**Why this priority**: starting work on a new branch is the next most common need, and it saves leaving to a terminal.

**Independent Test**: type a unique name, press Down to the Create row, press Enter, and confirm the branch exists and is checked out with a "Branch created" toast.

**Acceptance Scenarios**:

1. **Given** typed text that is not an exact branch name, **Then** a row `Create branch "<text>"` marked "new · from HEAD" is added after the matches.
2. **Given** typed text equal to an existing branch name, **Then** no Create row is offered.
3. **Given** the Create row is picked, **Then** the branch is created from HEAD, checked out, and a "Branch created" toast shows.

---

### User Story 3 - Understand why a switch fails (Priority: P2)

Git can refuse a switch. The user sees the reason inside the popup and can fix it without losing their place.

**Why this priority**: silent failure would leave the user unsure which branch they are on.

**Independent Test**: edit a file that differs between two branches without committing, try to switch, and confirm a red message appears and the popup stays open.

**Acceptance Scenarios**:

1. **Given** git rejects the switch (for example uncommitted changes would be overwritten), **Then** a red message with the first lines of git's error shows in the popup, which stays open.
2. **Given** a branch is checked out in another worktree, **Then** its row is dimmed with "other worktree", and picking it shows which path holds it instead of running git.
3. **Given** a switch is running, **Then** a spinner shows in the header and further picks are ignored.
4. **Given** the user edits the filter after an error, **Then** the error clears.

---

### Edge Cases

- A space with no folder shows "This space has no folder."; a folder that is not a git repository shows "Not a git repository."; the list is then empty.
- While branches load, the list shows a placeholder; with nothing to show it says "No branches."
- A remote branch with the same name as a local one is listed once (the local one); duplicates across remotes are listed once; remote HEAD pointers are hidden.
- Enter with no rows does nothing; arrows wrap around at both ends.
- The folder is the focused terminal's folder in that space (first terminal otherwise), so `cd` in a terminal changes which repository the popup acts on.
- Works on a remote machine's space: git runs on that machine.
- Escape closes the popup at any time; the filter box takes focus on open (and again shortly after, in case focus was lost).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a popup, opened by clicking the branch in the status bar (or by opening the mod by name), that acts on the active space's folder.
- **FR-002**: The popup MUST list local branches newest-commit first with the current branch first, followed by remote-only branches, without duplicates or remote HEAD entries.
- **FR-003**: Users MUST be able to filter by name (case-insensitive substring) and move the highlight with Up/Down (wrapping) and confirm with Enter or a click.
- **FR-004**: Switching to a local branch MUST check it out; to a remote-only branch MUST create and check out a local tracking branch; to the current branch MUST only close the popup.
- **FR-005**: When the typed text is not an exact existing name, the system MUST offer a Create row that creates the branch from HEAD and switches to it.
- **FR-006**: Branches checked out in another worktree MUST be shown dimmed with "other worktree" and MUST NOT be switchable; the message names the worktree path.
- **FR-007**: Git errors MUST appear in the popup (up to six lines, red) without closing it; the error MUST clear when the filter changes.
- **FR-008**: The system MUST ignore further picks while a switch is running and show a spinner.
- **FR-009**: On success the system MUST show a success toast, notify the status bar so it re-reads the branch immediately, and close the popup.
- **FR-010**: The system MUST report a missing folder or a non-git folder inside the popup instead of listing branches.
- **FR-011**: Escape MUST close the popup; the filter MUST be focused on open.
- **FR-012**: The system MUST NOT keep any persisted state of its own.

## Success Criteria *(mandatory)*

- **SC-001**: A user can change branch in two actions (click the status bar branch, pick a row).
- **SC-002**: After a successful switch the status bar shows the new branch within about one second.
- **SC-003**: Every git refusal is visible in the popup; no failed switch closes it silently.
- **SC-004**: A branch in another worktree is never passed to git.

## Assumptions

- Git is installed on the machine the space runs on.
- The popup does not stash, commit or fetch; remote branches shown are those already fetched locally.
- Creating a branch always starts from the current HEAD, not from a chosen base.
- Opened only for the active space.

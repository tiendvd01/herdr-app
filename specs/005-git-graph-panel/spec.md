# Feature Specification: Git Graph Panel (as-built)

**Feature Branch**: `005-git-graph-panel` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Git Graph panel (mod `git-graph`) as it behaves today, from the code in mods/git-graph/. Describe what it does and why, not how."

> Scope note: there are no automated tests; acceptance scenarios come from the observed behaviour of the code. `panel-ui.js` and `space-folder.js` inside the mod are synced copies of shared files (see 001/constitution) and are not specified here. The mod is a third-party one (upstream `rabeeh-ta/herdr-git-graph`, version 0.3.1) that is docked in the right-hand `panel-body` stack as "Git"; there is no `docs/mods/git-graph.md` yet.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the commit history of the repository I am working in (Priority: P1)

A user focuses a terminal in a git repository. The Git panel shows that repository's history as a table: a coloured lane graph, commit subject with branch/tag labels, date, author and (when wide) short hash. Uncommitted changes appear as a dashed row at the top. The header shows the current branch (or "detached at <hash>").

**Why this priority**: seeing how branches fork and merge, without leaving the app, is the reason the panel exists.

**Independent Test**: focus a terminal in a repo with branches and local edits; confirm the table, labels, dashed uncommitted row and branch chip appear, and that moving focus to a terminal in another repo switches the panel.

**Acceptance Scenarios**:

1. **Given** a focused terminal inside a repository, **When** the panel renders, **Then** commits are listed newest first with lanes that bend only where branches fork or merge.
2. **Given** the working tree has changes, **Then** a top row for uncommitted changes is drawn with a dashed line to its parent.
3. **Given** more history than one page (300 commits), **Then** a "more" row loads the next page.
4. **Given** the user picks "Current" instead of "All branches", or turns "Remotes" off, **Then** the history is re-read for that scope.
5. **Given** a commit in the list, **When** the user clicks it, **Then** a details pane shows author, email, committer, date, full message and changed files with +/- counts; clicking it again (or Esc) closes the pane.
6. **Given** a file in the details pane, **When** the user clicks it, **Then** its diff is shown; Esc closes the diff first, then the details.
7. **Given** a repository on a remote machine, **Then** history is read there and refreshed by gentle polling.

---

### User Story 2 - Act on branches, tags and commits from the graph (Priority: P1)

Right-clicking a branch label, remote label, tag label, commit or the uncommitted row opens a menu of git actions. Actions that need input or are risky ask in a dialog first; others run at once. Double-clicking a branch or remote label checks it out.

**Why this priority**: turns the graph from a viewer into a working tool and avoids terminal typing.

**Independent Test**: right-click a commit, choose Create branch, type a name, confirm; confirm the toast, the new label on the graph and no change to other repos.

**Acceptance Scenarios**:

1. **Given** a commit, **When** right-clicked, **Then** the menu offers add tag, create branch, checkout, cherry pick, revert, merge, rebase, reset, copy hash/subject (checkout, cherry pick, merge, rebase hidden for the current HEAD commit).
2. **Given** a local branch label, **Then** the menu offers checkout, rename, delete, merge into / rebase current on it, push (only if a remote exists) and copy name; checkout, delete, merge, rebase are hidden for the current branch.
3. **Given** a remote branch or tag label, **Then** the menu offers the matching checkout/merge/delete/push/copy actions.
4. **Given** the uncommitted row, **Then** the menu offers commit, stash, reset uncommitted changes and "Show in Changes panel" (opens the Changes dialog unless already open).
5. **Given** a dialog action, **When** the user confirms with an empty name, a name starting with "-" or containing spaces, **Then** the dialog shows an error and runs nothing.
6. **Given** a destructive action (delete, hard reset), **Then** its confirm button is red and a "force" or mode choice is explicit.
7. **Given** an action fails, **Then** git's message stays in the dialog (or a toast for no-dialog actions); on success a toast names what was done and every graph refreshes.
8. **Given** the repository's branch or HEAD changed after the menu was opened, **When** the user confirms, **Then** nothing runs and the user is told to refresh and review again.
9. **Given** "Stage every change" is ticked on Commit and unresolved merge conflicts exist, **Then** the commit is refused.
10. **Given** the user double-clicks a branch label (or a remote label), **Then** it is checked out; a remote branch with no local twin first asks for a local branch name.

---

### User Story 3 - Manage many repositories from one list ("Manygit") (Priority: P2)

When the focused folder is not itself a repository but contains some, the panel lists them instead, grouped by sub-folder. Each row shows name, uncommitted count, ahead/behind or "not pushed"/"error", optional newest tag and branch. Clicking a row opens its graph; a back button returns; the repository name drops down a picker to hop to another.

**Why this priority**: workspaces that hold several repos are common; one glance shows which need attention.

**Independent Test**: focus a terminal in a folder containing 3 repos; confirm the list, open one, go back, and use "Fetch all".

**Acceptance Scenarios**:

1. **Given** a folder that is not a repository, **Then** it is searched down to the configured depth (default 3, range 1 to 5), up to 500 repositories; very large folders such as the home directory are not searched and say so.
2. **Given** the list, **When** the user clicks "Fetch all", **Then** every repository with a remote is fetched (8 at a time), each row updates as it finishes, and a final toast reports successes and failures; failures show git's last line on the row and fetching continues if a repository is opened.
3. **Given** a row, **When** right-clicked, **Then** a menu offers new agent tab (up to three known agents) and new terminal tab in that repository, pull/push/fetch ordered by what the row needs, commit/stash/reset when dirty, open on the web host, copy path, copy branch.
4. **Given** the settings gear, **Then** scan depth (1 to 5) applies as it is typed and a bad value only turns the box red; "Show tags" toggles the newest-tag column.
5. **Given** the list is shown, **Then** it re-reads every 15 seconds because edits in a working tree do not touch git's own folder.

---

### User Story 4 - Stay current without manual refresh (Priority: P2)

The panel follows the focused terminal, redraws when git's refs change, can fetch, and remembers where you were.

**Why this priority**: a stale graph is worse than none.

**Independent Test**: commit in a terminal and watch the graph update within about a second; switch between two repos and see the earlier one return at once.

**Acceptance Scenarios**:

1. **Given** a local folder, **When** a commit, checkout or ref change happens in any terminal, **Then** the graph reads again without user action.
2. **Given** the user switches focus to another folder and back, **Then** the previous view (up to 24 folders) shows at once while it re-reads.
3. **Given** folders open in other spaces, **Then** they are read ahead one at a time, remote machines last.
4. **Given** a repository with a remote, **When** the user clicks Fetch, **Then** a spinner shows and the graph updates; Refresh forces a re-read.
5. **Given** no terminal is focused or the folder is unreadable, **Then** the panel says "No folder", "Not a git repository", "No commits yet", "Can't read the history" or "Loading history…" as appropriate.

---

### User Story 5 - Make the table fit my panel (Priority: P3)

The user resizes the date, author, hash and graph columns by dragging, and the height of the details pane. Narrow panels hide the hash column.

**Why this priority**: the panel is narrow; layout must be adjustable.

**Independent Test**: drag the date column edge, restart the app, confirm widths persist; drag the details divider and confirm height persists.

**Acceptance Scenarios**:

1. **Given** a column drag, **Then** it respects a minimum and maximum width and is saved for every copy of the panel.
2. **Given** the panel width under 600, **Then** the hash column is hidden.
3. **Given** the app is zoomed, **Then** rows and lane lines scale correctly on both older and newer Herdr versions.

---

### User Story 6 - Learn when a newer release exists (Priority: P3)

At most once a day the mod asks GitHub's public releases API for the latest version; when newer, the header shows "Update Graph". The window shows release notes and offers a prompt to give an agent, "Release page", "Later" (skip that version) or "Stop checking".

**Why this priority**: the mod is third-party and not auto-updated.

**Independent Test**: set the stored release to a newer tag and confirm the badge and window appear; "Stop checking" removes it for good.

**Acceptance Scenarios**:

1. **Given** a newer tag, **Then** the badge shows; "Later" hides that tag only; "Stop checking" disables checks.
2. **Given** the check fails or is rate-limited, **Then** nothing is shown and nothing breaks.

---

### Edge Cases

- A repository with no commits shows "No commits yet" and still lets git operate.
- A detached HEAD hides branch-only actions and shows "detached at <hash>"; a commit made there warns it belongs to no branch.
- Merge commits used for cherry pick/revert use the first parent and the dialog says so.
- Git preflight reads use no optional locks so the panel never blocks the user's own git.
- Pull is fast-forward only: a pull that cannot fast-forward changes nothing.
- Fetch for Manygit never prompts for credentials.
- Two copies of the panel (panel and pane) share settings and refresh together after any action.
- A late result for a folder the user already left is dropped.
- Binary or unreadable untracked files show "Binary or unreadable file" instead of a diff; file lists cap at 500 with a "more" count.
- Pointer position decides whether a right-click targets a label or the commit; the HEAD marker has no menu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show the history of the repository of the focused terminal's folder (or a given folder when opened as a pane) as a lane graph table with subject, labels, date, author and short hash.
- **FR-002**: The system MUST draw uncommitted changes as a dashed top row and show the current branch or detached HEAD in the header.
- **FR-003**: The system MUST page history 300 commits at a time and support All branches / Current and Remotes on/off scopes.
- **FR-004**: Users MUST be able to open a commit's details and a file's diff, and close them with a second click or Esc.
- **FR-005**: The system MUST offer context menus for commits, local/remote branches, tags, the uncommitted row and Manygit rows, hiding actions that do not apply.
- **FR-006**: Risky or input-needing actions MUST ask in a dialog with validation (non-empty, no leading "-", no spaces), explicit modes, and a red confirm for destructive ones.
- **FR-007**: Before any mutating action the system MUST verify HEAD and branch still match the menu's snapshot and refuse otherwise; unresolved conflicts MUST block "stage everything" commits.
- **FR-008**: The system MUST show git's error in the dialog or a toast on failure and a success toast on success, then refresh all graph copies.
- **FR-009**: Double-clicking a branch or remote label MUST check it out (asking for a local name when none exists).
- **FR-010**: When the folder holds no repository but contains some, the system MUST list them (Manygit) grouped by sub-folder with dirty count, ahead/behind, branch and optional newest tag, to a configurable depth of 1 to 5.
- **FR-011**: Users MUST be able to fetch all Manygit repositories (8 at a time) with per-row progress and errors, without credential prompts.
- **FR-012**: Users MUST be able to open a Manygit row, return, and switch repository from a dropdown.
- **FR-013**: The system MUST refresh on ref changes, on a 15-second poll for remote spaces and the Manygit list, and on user Refresh/Fetch.
- **FR-014**: The system MUST remember up to 24 recently viewed folders and read other spaces' folders ahead.
- **FR-015**: Column widths and the details pane height MUST be resizable within bounds and persisted; the hash column MUST hide below 600 wide.
- **FR-016**: The system MUST show distinct empty states: No folder, Not a git repository, No commits yet, Can't read the history, Loading history.
- **FR-017**: The system MUST check for a newer release at most once a day and allow Later and Stop checking.
- **FR-018**: Remote-machine spaces MUST be supported for reads and actions.

### Key Entities

- **Commit**: hash, parents, subject, author, date, labels; may be the synthetic "uncommitted" commit.
- **Label**: a branch, remote branch, tag or HEAD marker attached to a commit.
- **Repository context**: root, machine, current branch, HEAD, remotes, branch list.
- **Manygit workspace**: a folder and the repositories found in it, each with a status.
- **Action**: a named git operation with optional dialog values.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sees the focused repository's graph within about 2 seconds of focusing its terminal; a recently viewed folder appears immediately.
- **SC-002**: After a commit or checkout in any local terminal the graph reflects it within about 2 seconds without action.
- **SC-003**: Any listed git action can be done in at most one menu pick plus one confirm.
- **SC-004**: An action started on a stale snapshot never changes the repository.
- **SC-005**: In a folder with 20 repositories, a user can tell which have uncommitted or unpushed work in one glance, and fetch them all in one click.

## Assumptions

- `git` is installed on the local machine and on any remote machine used.
- The user is on macOS with the Herdr app; `gh` is not used by this mod.
- Only git history and common local actions are in scope; pull requests and issues belong to other panels.
- Conflict resolution, interactive rebase, amend and stash apply/pop are intentionally absent.
- The release check calls only GitHub's public API without identifying the user.

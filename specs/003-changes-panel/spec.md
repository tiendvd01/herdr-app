# Feature Specification: Changes Panel (as-built)

**Feature Branch**: `003-changes-panel` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Changes panel (diff review, opens as a dialog from the tab bar) as it behaves today. Describe what it does and why, not how."

> Scope note: documented from `mods/reviewer/` (`main.js`, `dialog.js`, `highlight.js`, `ask.js`, `palette.js`) and `docs/mods/reviewer.md`. There are no automated tests, so acceptance scenarios come from the observed behaviour of the code. The tab-bar button and the key binding that open the dialog belong to other features and are only referred to.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what changed in the focused repo (Priority: P1)

A user working with an agent opens the Changes dialog and sees the repo of the focused terminal's folder: a list of changed files with status letter (A / M / D / U), added and removed line counts, totals in the header, and the diff of the selected file with syntax colouring. The first file's diff shows until another is picked.

**Why this priority**: without seeing the diff, nothing else (review, ask, commit) is possible.

**Independent Test**: edit a file in a git repo, open the dialog, and confirm the file is listed with correct counts and its coloured diff is shown.

**Acceptance Scenarios**:

1. **Given** uncommitted changes (including new untracked files), **When** the dialog opens, **Then** each changed file is listed with its status and +/- counts, and the first file's diff is displayed.
2. **Given** the dialog is open, **When** a file changes on disk, **Then** the list and the open diff refresh by themselves (immediately on file change, and at least every 10 seconds).
3. **Given** the focused terminal is not in a git repository, **Then** the dialog says "Not a git repository"; with no folder it says "No folder"; with nothing changed it says there are no changes in the scope; while reading it says "Loading changes…".
4. **Given** the focus moves to a terminal in another folder, **Then** the panel switches to that repo and drops the previous repo's open file, comments in progress and commit message.
5. **Given** a binary file or a file with no text diff, **Then** the diff area says so instead of showing lines.

---

### User Story 2 - Choose what to review (Priority: P1)

The user picks the review scope from a header menu: uncommitted changes, the last commit plus uncommitted changes, everything on the branch since it left its base (like a pull request's Files changed), or one single commit from the 30 most recent.

**Why this priority**: reviewing an agent's finished commits or a whole branch is as common as reviewing the working tree.

**Independent Test**: on a feature branch with commits, switch among the scopes and confirm the file list and diff change accordingly; reopen and confirm the choice is remembered for that repo.

**Acceptance Scenarios**:

1. **Given** a repo with history, **When** the user opens the scope menu, **Then** it offers Uncommitted, Last commit, "vs <base>" and a Commits list (newest first, with hash, subject and age), with a check on the current one.
2. **Given** the repo is on its base branch or HEAD has no parent, **Then** the branch / last-commit options are disabled with an explanation.
3. **Given** a single commit is chosen, **Then** only that commit's diff against its parent is shown (the empty tree for a root commit), without uncommitted changes.
4. **Given** a scope was chosen for a repo, **Then** it is remembered for that repo (per machine); a first visit to a branch with a merge base starts on the branch scope, otherwise on Uncommitted.
5. **Given** a remembered scope is no longer valid (for example the branch now equals base), **Then** the panel falls back to Uncommitted.
6. **Given** the scope key is pressed, **Then** the scope cycles among Uncommitted, Last commit and branch (only those available).

---

### User Story 3 - Comment on lines and submit a review to the agent (Priority: P1)

The user clicks a diff line (two clicks for a range, a hunk header for the whole hunk) to open a floating comment box, writes a comment, and it sits inline under those lines. Comments can span several files and each scope keeps its own drafts. A speech-bubble on a file row comments on the whole file (images, deleted files). "Submit review" sends all comments, with their lines, as one message to the space's agent.

**Why this priority**: this is the purpose of the dialog: reviewing like a pull request and handing the feedback to the agent.

**Independent Test**: add comments on two files, close and reopen the dialog (drafts persist), click Submit review, and confirm the agent receives one message listing each file, lines and comment, and drafts clear after sending.

**Acceptance Scenarios**:

1. **Given** a diff row, **When** the user clicks it, **Then** a comment box appears over the top-right of the diff (docked under the diff when narrow) naming the file and lines; Enter adds, Esc or the close button cancels.
2. **Given** a highlighted range, **When** the user clicks another row, **Then** the range widens; clicking inside the range clears it.
3. **Given** an existing comment, **When** the user clicks it, **Then** it opens for editing and can be saved, retargeted or deleted.
4. **Given** drafts exist, **Then** the header shows "Submit review · N" and Discard; file rows show a draft count badge.
5. **Given** the user clicks Submit review, **Then** a send dialog opens with the formatted review (read-only, with line count and copy button) and an optional note, and after it is sent the drafts are cleared.
6. **Given** a comment whose lines are no longer in the diff, **Then** it is not shown inline but is still sent with the text captured when it was written.
7. **Given** the user switches scope, **Then** the comments of that scope are shown; those of the other scopes are kept.

---

### User Story 4 - Ask the agent a question about the diff (Priority: P2)

Without collecting comments, the user right-clicks a line (or uses "Ask about diff" for the whole open file diff) to ask the agent about it immediately.

**Why this priority**: quick questions are faster than formal review comments.

**Independent Test**: right-click a line, type a note, send, and confirm the agent gets the note followed by the lines with numbers.

**Acceptance Scenarios**:

1. **Given** a diff line, **When** the user right-clicks it, **Then** the send dialog opens with a title of file and line(s) and the quoted lines as context.
2. **Given** no drafts exist and a diff is shown, **Then** an "Ask about diff" button is offered in the header.
3. **Given** more than 400 rows would be quoted, **Then** only the first 400 are included.

---

### User Story 5 - Send dialog picks the right agent (Priority: P2)

The send dialog sends the text to an agent of the current space: the focused one, else an idle one, else the first; a dropdown picks another. If no agent runs, Send becomes "Start agent" and starts the most-used installed agent in a new tab with the text.

**Why this priority**: feedback is only useful if it reaches the right agent safely.

**Independent Test**: with a busy agent, press Send and confirm a warning appears first; confirm and see the message delivered and that agent focused.

**Acceptance Scenarios**:

1. **Given** the agent is working or blocked, **When** the user clicks Send, **Then** the dialog asks "Send anyway?" before typing into its input.
2. **Given** an empty note and no context, **Then** it shows "Type a note first".
3. **Given** the text is larger than 8 KB, **Then** a warning explains it may be slow or cut short.
4. **Given** Cmd/Ctrl-Enter or Enter, **Then** it sends; Esc or Cancel closes; a failure shows the error and keeps the dialog.
5. **Given** the dialog cannot open at all, **Then** the text is sent straight to the space's agent, or a warning says no agent exists.
6. **Given** Cancel during the lookup of an installed agent, **Then** nothing is started.

---

### User Story 6 - Browse the file list as a flat list or a tree, split or unified diff (Priority: P3)

The user switches the file list between flat and folder tree (folders collapse and expand), toggles side-by-side diff, collapses the diff section to give the list all the space, and drags the divider to resize. Long lines always wrap.

**Why this priority**: comfort options for large changes.

**Independent Test**: toggle Tree, collapse a folder, toggle Split, collapse the diff section, close and reopen: Tree, Split and collapsed state are remembered.

**Acceptance Scenarios**:

1. **Given** Tree is on, **Then** files are grouped under folders with file counts, and a collapsed folder hides its files.
2. **Given** Split is on and the diff area is wide enough, **Then** removed lines face added lines; narrower areas stay one column and the tooltip says why.
3. **Given** the diff section is collapsed, **When** the user picks a file, **Then** it expands again.

---

### User Story 7 - Commit and edit from the dialog (Priority: P3)

The user types a message and clicks Commit to stage everything and commit; a file can be opened in Neovim in a new tab (at its first changed line).

**Why this priority**: closes the loop after review without leaving the dialog.

**Independent Test**: type a message, click Commit, and confirm the repo gets a commit including untracked files, the field clears and the diff section collapses.

**Acceptance Scenarios**:

1. **Given** an empty message, **Then** Commit is disabled.
2. **Given** a message, **When** Commit is clicked, **Then** all changes are staged and committed, the message clears and the diff section collapses.
3. **Given** the commit fails, **Then** the error is shown in the dialog and the message stays.
4. **Given** an Edit icon on a non-deleted file, **When** clicked, **Then** an existing tab already editing that file is selected, otherwise a new tab opens Neovim in the repo.

---

### User Story 8 - Other mods open a file's diff (Priority: P3)

Another panel can ask the Changes dialog to show a given file's diff.

**Why this priority**: lets Git and other panels link into review.

**Independent Test**: with the dialog open, issue an open request for a changed file and confirm it is selected.

**Acceptance Scenarios**:

1. **Given** a fresh request for a file in the shown repo and machine, **Then** that file is selected and the request is cleared.
2. **Given** the file has no diff in the current scope, **Then** a note says so.
3. **Given** a request older than 30 seconds or for another repo or machine, **Then** it is ignored.

---

### Edge Cases

- Only the first 1,000 changed files are listed, with a note; diffs show at most 1,500 lines and lines over 4,000 characters are truncated.
- Untracked files are shown as additions read from disk; binary or unreadable ones say so.
- A repo with no commits lists staged and untracked files as added.
- Automatic reads never take the git index lock, so an agent's concurrent commit is not blocked; clicked actions such as commit run normally.
- A refresh result for a repo the user already left is discarded.
- A file touched without content change is not listed.
- Remote-machine repos are supported but are not watched live (only the periodic refresh).
- Drafts saved before scopes existed are moved to the Uncommitted scope.
- Comment boxes never move rows: they float over the diff.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show, as a dialog, the changed files of the repo at the focused terminal's folder, with status, +/- counts and header totals, and the selected file's syntax-coloured diff.
- **FR-002**: The system MUST refresh on file changes and periodically, and MUST show clear messages for no folder, not a repo, no changes and loading.
- **FR-003**: Users MUST be able to choose the scope: uncommitted, last commit plus uncommitted, whole branch since base, or one of the 30 latest commits; the choice MUST be remembered per repo and fall back safely when invalid.
- **FR-004**: The base branch MUST come from a configured value, else the remote default, else main, else master.
- **FR-005**: Users MUST be able to comment on one line, a range, a hunk or a whole file, edit and delete comments, with drafts kept per repo and per scope and surviving closing the dialog.
- **FR-006**: Users MUST be able to submit all drafts as one message to the space's agent and drafts MUST clear once sent; discard MUST clear them without sending.
- **FR-007**: Users MUST be able to ask the agent about a line or the open diff without drafting comments.
- **FR-008**: The send dialog MUST target the focused agent by default, allow choosing another, warn before typing into a busy agent, start an agent when none runs, show the context read-only with a copy action, and warn for text over 8 KB.
- **FR-009**: Users MUST be able to toggle flat/tree list, split/unified diff and the collapsed diff section; these MUST be remembered.
- **FR-010**: Users MUST be able to commit all changes with a message from the dialog, with errors shown and the message preserved on failure.
- **FR-011**: Users MUST be able to open a changed file in Neovim in a new or existing tab.
- **FR-012**: The system MUST accept another mod's request to open a file's diff, ignoring stale (over 30 seconds) or mismatched requests.
- **FR-013**: Automatic git reads MUST NOT hold the index lock or rewrite the index.
- **FR-014**: The dialog MUST open and close from the tab bar button and its key, and close with Esc; Esc first leaves the commit field, then the comment box.
- **FR-015**: Diff colouring MUST follow a selectable palette and the terminal's font and size.
- **FR-016**: The system MUST limit work on very large changes (1,000 files, 1,500 lines per diff) and say so.

### Key Entities

- **Scope**: what is being reviewed (uncommitted, last commit, branch, single commit); remembered per repo and machine.
- **Changed file**: path, status, added and removed counts, binary flag.
- **Diff row**: a line of a hunk, with kind (context, added, removed, header), number and coloured parts.
- **Comment (draft)**: a note on a line range or a whole file, with the quoted lines.
- **Review message**: the formatted text of all comments sent to an agent.
- **Open request**: a short-lived request from another mod to show a file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the dialog and see the first changed file's coloured diff within about 2 seconds for a typical repo.
- **SC-002**: A user can send a review of several comments to the agent in at most 3 interactions after the last comment (Submit, optional note, Send).
- **SC-003**: Edits on disk appear in the list without manual action within about 10 seconds (usually within 1 second for local repos).
- **SC-004**: Drafts are never lost by closing the dialog, switching scope or refreshing; they clear only after a confirmed send or Discard.
- **SC-005**: An agent's concurrent commit never fails because of the panel's reads.

## Assumptions

- The user has git available locally (or on the remote machine) and Herdr agents run in the space.
- The panel follows the focused terminal's folder; there is no pinned folder.
- The mod is a clone of the shipped `changes` mod, personally customised.
- No automated tests exist; behaviour was read from the code and the existing mod notes.
- Opening the dialog (tab-bar button, `cmd-shift-g`, other mods' calls) is specified elsewhere.

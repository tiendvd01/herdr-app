# Feature Specification: Codebase index in Project Settings

**Feature Branch**: `026-codebase-index`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Triển khai tính năng index codebase cho repo, triển khai trong project settings, nó sẽ kiểm tra xem project có .codegraph hay chưa, nếu chưa thì tạo, nhưng phải thêm vào .git/info/exclude vào local để ignore .codegraph" + "nó sẽ chạy codegraph init để tạo .codegraph folder ở ngay trong project luôn" (add a codebase index feature to Project Settings: check whether the project has `.codegraph`, create it with `codegraph init` inside the project when missing, and add `.codegraph` to the local `.git/info/exclude` so git ignores it)

## Context

CodeGraph keeps a code index of a project in a `.codegraph/` folder at the project root. Agents use it before grep and file reads, but only in projects that already have that folder: indexing is the user's decision, never done by itself. Today the user has to open a terminal in each project, run `codegraph init` by hand, and then make sure the new folder never shows up in `git status` (CodeGraph puts its own ignore file inside the folder, and that file itself shows as an untracked change). Project Settings already lists every git project the user works in, so it is the natural place to see which projects are indexed and to index one in a click, keeping the ignore rule local to the user's machine (never a change to the project's shared ignore file).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See whether a project is indexed and index it (Priority: P1)

The user opens Project Settings on a project and goes to the codebase index section. It says plainly whether the project has a code index. When it has none, a button creates it: CodeGraph is run in the project's root, the `.codegraph/` folder appears there, and the section shows the result (indexed, with file and symbol counts and when it was last indexed).

**Why this priority**: This is the feature: one place to check and create the index without leaving Herdr.

**Independent Test**: Pick a git project with no `.codegraph/`, open Project Settings on it, press the index button, wait for it to finish: the folder exists at the project root and the section shows it as indexed with counts.

**Acceptance Scenarios**:

1. **Given** a project with no `.codegraph/` folder, **When** the user opens the index section, **Then** it says the project is not indexed and offers one button to index it.
2. **Given** that state, **When** the user presses the button, **Then** the button shows it is working, the rest of Project Settings stays usable, and when indexing finishes the section shows the project as indexed with the number of files and symbols and the time of the last index.
3. **Given** a project that already has `.codegraph/`, **When** the user opens the index section, **Then** it shows the project as indexed with its counts and last index time, and offers no "create" button.
4. **Given** the user switches Project Settings to another project, **When** the section is shown, **Then** it reflects that project's state, not the previous one's.

---

### User Story 2 - The index never shows up in git (Priority: P1)

Whenever Project Settings creates an index, or finds one, it makes sure the project's local git exclude list has an entry for `.codegraph`, so neither the folder nor anything inside it appears as an untracked change. The project's tracked ignore file is never touched, so nothing has to be committed and teammates are not affected.

**Why this priority**: Without it, indexing dirties every project's `git status` and risks the index being committed; the user called this out as a must.

**Independent Test**: Index a project from Project Settings, then run `git status` in it: no `.codegraph` entry appears, the tracked ignore file is unchanged, and the local exclude list holds exactly one `.codegraph` line.

**Acceptance Scenarios**:

1. **Given** a project whose local exclude list has no `.codegraph` entry, **When** the user indexes it, **Then** a `.codegraph/` entry is added to the local exclude list before the index is created, and `git status` shows nothing new afterwards.
2. **Given** the entry is already there, **When** the user indexes again or reopens the section, **Then** no second entry is added.
3. **Given** a project already indexed but whose `.codegraph/` shows as untracked (indexed before this feature), **When** the user opens the index section, **Then** it reports that the index is not ignored and offers one action to add the local exclude entry.
4. **Given** a project the user opened through a worktree, **When** the entry is added, **Then** it goes into the exclude list shared by the main checkout and all its worktrees (git has one local exclude list per repository).

---

### User Story 3 - Bring an existing index up to date (Priority: P3)

For an indexed project, the section offers an action to refresh the index (pick up files changed since the last index), showing progress and the new counts when done.

**Why this priority**: CodeGraph mostly keeps itself up to date while an agent uses it; a manual refresh is a convenience for projects left idle.

**Independent Test**: In an indexed project, change a file, press refresh: the last-index time moves to now.

**Acceptance Scenarios**:

1. **Given** an indexed project, **When** the user presses refresh, **Then** the action shows it is working and, on success, the last-index time and counts update.

---

### Edge Cases

- **CodeGraph not installed**: the section says the `codegraph` command was not found and how to get it; no button that would fail is offered.
- **Indexing fails** (error exit, lock held by another run, disk full): the section shows a short error with the first lines of the tool's message, the button becomes available again, and no exclude entry is removed.
- **Project folder is the home folder or a filesystem root**: the index button is not offered (CodeGraph itself refuses these without a force flag).
- **No local exclude file yet** (`info/` folder or file missing): it is created with the entry.
- **Exclude file has no trailing newline**: the entry is added on its own line, the existing last line is left intact.
- **Entry written differently** (`.codegraph`, `/.codegraph/`, `.codegraph/`): any of these counts as already present.
- **The project tracks `.codegraph` on purpose** (folder already committed): the section reports it as tracked and does not add an exclude entry (excluding a tracked path has no effect and would mislead).
- **Large project, long indexing**: the run is in the background; closing Project Settings does not cancel it, and reopening shows it still running or its result.
- **The user presses the button twice**: only one index run per project at a time.
- **Remote (non-local) spaces**: out of scope; only projects on this machine are listed, as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project Settings MUST have a codebase index section for the selected git project.
- **FR-002**: The section MUST show one of these states for the project: not indexed; indexing in progress; indexed (with number of files, number of symbols, last index time); failed (with a short error); tool missing.
- **FR-003**: The section MUST decide "indexed" by the presence of a `.codegraph/` folder at the project root, and read counts and last index time from CodeGraph's own status report.
- **FR-004**: When the project is not indexed, the section MUST offer one action that runs `codegraph init` in the project root, creating `.codegraph/` inside the project.
- **FR-005**: Before running the index, the feature MUST make sure the repository's local git exclude list (`.git/info/exclude`, or the common one for a worktree) contains a `.codegraph/` entry, adding it only when no equivalent entry exists.
- **FR-006**: The feature MUST NOT modify the project's tracked `.gitignore` or any other tracked file.
- **FR-007**: For a project that has `.codegraph/` but no exclude entry and does not track the folder, the section MUST say so and offer an action that adds only the exclude entry.
- **FR-008**: Indexing MUST run without blocking Project Settings or the rest of Herdr, and only one run per project MUST be active at a time.
- **FR-009**: For an indexed project, the section SHOULD offer a refresh action that updates the existing index and then shows the new counts and time.
- **FR-010**: When the `codegraph` command is not available, the section MUST say so and offer no index action.
- **FR-011**: The index action MUST NOT be offered for a project whose root is the home folder or a filesystem root.
- **FR-012**: Indexing MUST only ever happen on the user's explicit action; opening Project Settings or the section MUST NOT create an index.
- **FR-013**: The section MUST use the shared UI kit's buttons and surfaces like the other Project Settings tabs.
- **FR-014**: The exclude-list logic (check and add entry) MUST be unit tested, including missing file, missing trailing newline, and each equivalent spelling of the entry.

### Key Entities

- **Project**: a git project shown in Project Settings; has a root folder and a repository (shared with its worktrees).
- **Code index**: the `.codegraph/` folder at a project root; has a file count, symbol count and last index time.
- **Local exclude list**: the repository's untracked, per-machine list of ignored paths; holds at most one `.codegraph` entry added by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can index an unindexed project from Project Settings in 2 clicks or fewer (open the section, press the button), with no terminal.
- **SC-002**: After indexing from Project Settings, `git status` in that project shows 0 new entries, and the tracked ignore file has 0 changes.
- **SC-003**: Indexing the same project any number of times leaves exactly 1 `.codegraph` entry in its local exclude list.
- **SC-004**: The section shows the correct state for a project within 2 seconds of opening it (excluding the time of an index run).
- **SC-005**: While an index runs, Project Settings stays responsive: switching tabs or projects works without waiting for it.

## Assumptions

- CodeGraph is installed as the `codegraph` command on the user's PATH (as on this machine); installing it is not part of this feature.
- `codegraph init` both creates `.codegraph/` and builds the first index, and `codegraph status --json` reports counts and last index time; both run in the project root.
- The project root is the folder Project Settings already uses for the project (the main checkout for a worktree, per `projectOf`); a worktree is not indexed separately.
- Removing an index (uninit) is out of scope; the user can still do it in a terminal.
- Registering CodeGraph's MCP server for a project stays in Project Settings › Skills (existing `mcp/` library); this feature only creates the index.
- Only local projects are in scope, like the rest of Project Settings.

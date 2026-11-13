# Feature Specification: Files Panel (as-built)

**Feature Branch**: `002-files-panel` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the existing Files panel (mod `file-icons`, plus the single-file viewer tab and the cmd-p open-file dialog) as it behaves today. Describe what it does and why, not how."

> Scope note: no tests exist; behaviour is read from `mods/file-icons/`, `mods/open-file/`, the shared markdown renderer and `docs/mods/open-file.md`. The cmd-p dialog is included only as the entry point to the viewer tab.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the focused terminal's folder (Priority: P1)

The right-hand Files panel shows a lazy folder tree of the focused terminal's working folder, with file-type icons, expandable folders, git status marks and dimmed ignored paths.

**Why this priority**: it is the primary way to look around a project without leaving the window.

**Independent Test**: focus a terminal in a git repo, expand folders, edit and create files, and confirm the tree, marks and dimming match.

**Acceptance Scenarios**:

1. **Given** a focused terminal, **When** the panel is shown, **Then** it lists that folder's entries, folders first, then names alphabetically, each with an icon chosen by path, name or extension (longest extension wins, light/dark aware).
2. **Given** a folder row, **When** the user clicks it, **Then** it expands (children load on demand) or collapses, collapsing its open sub-folders too.
3. **Given** a git repository, **When** files are modified, added/untracked, deleted or conflicted, **Then** their rows carry M, A, D or U marks, and git-ignored paths are dimmed.
4. **Given** the user focuses another terminal, space or machine, **Then** the panel switches to that folder and resets its tree; focusing a non-terminal pane keeps the space's last terminal folder.
5. **Given** files change on disk, **Then** the tree and marks refresh by themselves (on folder change locally, and every 10 seconds).
6. **Given** no folder or an unreadable folder, **Then** the panel says "No folder", "No files" or shows the error; "Loading files…" while loading.

---

### User Story 2 - Open a file in its own tab (Priority: P1)

Clicking a file row, a search result, or choosing a file in cmd-p opens it in a new tab with a read-only, syntax-highlighted view.

**Why this priority**: reading a file next to the terminals is the point of the panel.

**Independent Test**: click a file and confirm a new tab named after the file shows its content, and stays on that file when focus moves elsewhere.

**Acceptance Scenarios**:

1. **Given** a file row, **When** clicked, **Then** a new tab opens showing the file with highlighting; it does not follow later focus or space changes.
2. **Given** the open file changes on disk, **Then** the view updates within about 10 seconds, only when content changed (scroll is kept).
3. **Given** a binary file, **Then** "Binary file · no text preview"; an unreadable or deleted file shows a message ("Cannot preview…" / "no longer available").
4. **Given** a very large file, **Then** only the first 400,000 characters show, with a truncation note.

---

### User Story 3 - Search every file in the folder (Priority: P2)

A search box above the tree filters all files under the folder (not only expanded ones).

**Why this priority**: finding a file in a deep tree by clicking is slow.

**Independent Test**: type two words and confirm only paths containing both appear, with name and folder, and that clicking opens the tab.

**Acceptance Scenarios**:

1. **Given** a typed query, **Then** results list files whose path contains every word (case-insensitive), at most 200, each with icon, name and dimmed folder; tracked and untracked files count, ignored ones do not (outside git, `.git` and `node_modules` are skipped).
2. **Given** no match, **Then** "No matching files"; while the list is still being gathered, "Searching…".
3. **Given** the query is cleared, **Then** the tree returns.

---

### User Story 4 - Read Markdown rendered (Priority: P2)

For `.md` files the viewer shows rendered Markdown (headings, code with colours, diagrams) with a Preview/Source switch.

**Why this priority**: specs and notes are mostly Markdown.

**Independent Test**: open a `.md` file with a diagram; toggle Source and back, scroll, switch tabs, and confirm scroll position survives.

**Acceptance Scenarios**:

1. **Given** a Markdown file, **Then** it opens as Preview by default with Preview and Source chips; Source shows the raw text.
2. **Given** the user scrolls and leaves the tab then returns, **Then** the scroll position is kept.
3. **Given** a diagram in the file, **Then** it can be opened zoomable in a dialog.

---

### User Story 5 - Edit a file in Neovim (Priority: P3)

An edit button on file rows, search results and the viewer header opens the file in Neovim in a new tab.

**Why this priority**: the viewer is read-only; editing is one click away.

**Independent Test**: click the edit button and confirm a terminal tab runs `nvim` on that file, without also opening the viewer.

**Acceptance Scenarios**:

1. **Given** a file row, **When** its edit button is clicked, **Then** a tab opens with `nvim` on the file, in the folder, and the row's own click does not fire.

---

### User Story 6 - Open any file with cmd-p (Priority: P2)

cmd-p opens a dialog: typing searches files under the focused terminal's folder; typing a path (`/`, `~`, `./`, `../`) browses that folder. Choosing a file opens the viewer tab.

**Why this priority**: quick jump without touching the tree, including files outside the folder.

**Independent Test**: press cmd-p, type part of a name, arrow down, Enter; then type `~/` and browse.

**Acceptance Scenarios**:

1. **Given** plain text, **Then** up to 30 fuzzy-ranked matches (ranked when `fzf` exists, plain list otherwise; `.git` and `node_modules` skipped).
2. **Given** a path, **Then** that folder's entries are listed, filtered by the part after the last `/`; folders end with `/` and Enter or Tab enters them; unknown folder shows "No such folder".
3. **Given** arrows, Enter, click, Esc, **Then** they select, open, open, close.
4. **Given** no focused folder, **Then** the dialog says "No folder: focus a terminal first."

---

### Edge Cases

- Per folder at most 500 entries and 5,000 in total are listed; a note says so. Search keeps at most 100,000 paths and shows 200.
- Remote (non-local) spaces list, search and read files on the remote machine; live folder watching is local only, so remote refreshes rely on the 10-second timer.
- `.git` is never listed. Symlinks to folders are shown as files.
- A stale answer for a folder the user already left is discarded.
- The viewer tab keeps its file and machine for its lifetime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a Files panel with a lazy tree of the focused terminal's folder, following focus and space changes via the shared folder rule.
- **FR-002**: Entries MUST be sorted folders first, then by name, limited to 500 per folder and 5,000 total, with a notice when limited.
- **FR-003**: Each row MUST show a file or folder icon by path, name, extension rules, with open/closed folder variants and light/dark variants.
- **FR-004**: The panel MUST mark modified, added/untracked, deleted and conflicted files, and dim git-ignored paths.
- **FR-005**: The panel MUST refresh itself on local folder changes and every 10 seconds.
- **FR-006**: The panel MUST provide a search box listing up to 200 files matching all typed words.
- **FR-007**: Clicking a file MUST open it in a new tab showing a read-only highlighted view that does not follow focus.
- **FR-008**: A file tab MUST re-read its file every 10 seconds and redraw only on change.
- **FR-009**: The viewer MUST handle binary, missing, unreadable and over-400,000-character files with clear messages or truncation.
- **FR-010**: Markdown files MUST open rendered, with a Preview/Source switch, kept scroll position, and zoomable diagrams.
- **FR-011**: File rows, results and the viewer header MUST offer an edit action opening Neovim in a new tab.
- **FR-012**: cmd-p MUST open a dialog for fuzzy file search and path browsing, opening the chosen file in a viewer tab.
- **FR-013**: Panel buttons MUST follow the shared panel UI rules.

### Key Entities

- **Folder context**: the (folder, machine) pair the panel currently shows.
- **Entry**: a file or folder in a listed folder, with a git mark and ignored flag.
- **Viewer tab**: a tab pinned to one absolute file path and machine.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user reaches any file's content in at most two clicks from the panel, or one cmd-p search.
- **SC-002**: Search results appear while typing with no manual refresh; a changed file shows new content within about 10 seconds.
- **SC-003**: Switching focus to another terminal updates the panel's folder within about 1 second.
- **SC-004**: Markdown preview keeps scroll position across tab switches in 100% of cases.

## Assumptions

- `git`, `rg` and (optionally) `fzf` are installed on the machine being browsed.
- Previews are read-only by design; editing is delegated to Neovim.
- Layout placement of the panel in the right stack is outside this spec.
- No automated tests exist; behaviour was read from the code.

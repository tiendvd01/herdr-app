# Feature Specification: Project Claude Memory

**Feature Branch**: `029-project-claude-memory`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Triển khai tính năng quản lí memory claude cho từng project"

## Context

Claude keeps an automatic, file-based memory per project: a folder of small notes (one fact per
note, each with a name, a one-line description and a type: user, feedback, project, reference) plus
an index note that lists them, one line each. The index is what Claude loads at the start of every
session. Today the only way to see or fix what Claude remembers about a project is to find the
hidden folder by hand. Over time notes go stale, contradict each other, or fall out of the index
(a note the index does not list is never recalled; an index line whose note is gone points at
nothing).

This feature adds a **Memory** tab to Project Settings that shows, per git project, what Claude
remembers and lets the user correct it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what Claude remembers about a project (Priority: P1)

The user opens Project Settings, picks a project and opens the Memory tab. They see every memory
note of that project: its name, one-line description, type, and when it last changed, plus the
index. Clicking a note shows its full text.

**Why this priority**: seeing is the base of everything else, and on its own already answers
"why does Claude keep doing X in this repo?".

**Independent Test**: open the Memory tab on a project that has notes; the list matches the files
in that project's memory folder and each note's text can be read.

**Acceptance Scenarios**:

1. **Given** a project with 7 notes and an index, **When** the Memory tab opens, **Then** 7 notes
   are listed with name, description, type and age, and the index is shown separately.
2. **Given** a project with no memory yet, **When** the Memory tab opens, **Then** an empty state
   says Claude has no memory for this project yet.
3. **Given** a worktree of a project is focused, **When** the Memory tab opens, **Then** it shows
   the main checkout's memory (a worktree shares its project's memory).
4. **Given** notes of several types, **When** the user filters by a type or types text in search,
   **Then** only matching notes stay listed.

---

### User Story 2 - Edit or delete a note (Priority: P1)

The user corrects a wrong or stale note in place, or deletes it. Deleting a note also removes its
line from the index, so the index never points at a missing note.

**Why this priority**: "manage" means fixing what is wrong; a read-only view leaves the user to
edit hidden files by hand.

**Independent Test**: edit a note's text and save; the file on disk changes. Delete a note,
confirm; the file and its index line are gone.

**Acceptance Scenarios**:

1. **Given** an open note, **When** the user changes its text and saves, **Then** the note on disk
   holds the new text and the list shows the new description and age.
2. **Given** unsaved edits, **When** the user switches note, project or tab, **Then** the edits are
   not silently lost (the user is warned / can revert).
3. **Given** a note listed in the index, **When** the user deletes it and confirms, **Then** the
   note file and its index line are both removed; other index lines are untouched.
4. **Given** the note changed on disk since it was opened (Claude wrote to it), **When** the user
   saves, **Then** the save is refused with a message and the newer text is offered instead of
   being overwritten.

---

### User Story 3 - Keep the index healthy (Priority: P2)

The tab flags notes that the index does not list (Claude will never recall them) and index lines
whose note is missing, and fixes each with one click: add the missing line (built from the note's
name and description) or drop the dead line.

**Why this priority**: broken index entries are the silent failure of file memory; fixing them by
hand is fiddly, but the view alone (Story 1) is usable without it.

**Independent Test**: create a note not in the index and an index line with no note; the tab shows
both problems; each fix button resolves exactly one.

**Acceptance Scenarios**:

1. **Given** a note not in the index, **When** the tab opens, **Then** it is marked "not in index"
   and an "Add to index" action appends one line for it.
2. **Given** an index line naming a missing note, **When** the tab opens, **Then** it is listed as
   a dead entry with a "Remove line" action.
3. **Given** a healthy memory, **Then** no warning is shown.

---

### User Story 4 - Add a note by hand (Priority: P3)

The user writes a new note (name, description, type, body) and it is saved as a new note file and
added to the index in the same format Claude uses.

**Why this priority**: most notes are written by Claude itself; hand-adding is a convenience.

**Independent Test**: add a note; a new file appears with the standard header and one index line
points at it; a new Claude session in that project recalls it.

**Acceptance Scenarios**:

1. **Given** the Memory tab, **When** the user adds a note named "deploy-steps", **Then** a note
   file with that name and the standard header is created and the index gains one line for it.
2. **Given** a name that already exists or holds unsafe characters, **When** the user saves,
   **Then** the save is refused with the reason.

---

### Edge Cases

- The memory folder or index does not exist yet: adding the first note creates both.
- A note without the standard header (hand-written or old format): listed by file name, type
  "unknown", still readable, editable and deletable.
- The project folder path contains characters that are not letters or digits: the memory folder
  is found by the same naming rule Claude uses for that path.
- Claude writes to the memory while the tab is open: the list refreshes on its own within a few
  seconds; an open, unedited note reloads; an edited one is protected by the save check (US2-4).
- Files in the memory folder that are not notes (non-markdown): ignored.
- Very large notes: shown and editable; the list stays responsive.
- Remote (machine) spaces: not covered; only local projects are listed, as on the other tabs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project Settings MUST have a Memory tab, next to the other tabs, that works on the
  selected git project like the other tabs do (worktrees map to their main checkout).
- **FR-002**: The tab MUST locate the project's Claude memory folder from the main checkout's path
  using the same naming rule Claude uses, and show the folder path.
- **FR-003**: The tab MUST list every note in the folder (except the index) with name, description,
  type and last-change time, newest first, and show a count.
- **FR-004**: The tab MUST offer a filter by type and a text search over name, description and body.
- **FR-005**: Selecting a note MUST show its full text in an editor; Save writes it back; Revert
  restores the text on disk.
- **FR-006**: Save MUST refuse to overwrite a note that changed on disk since it was loaded, and say so.
- **FR-007**: Delete MUST ask for confirmation, then remove the note file and every index line that
  links to it, leaving other lines as they were.
- **FR-008**: The tab MUST show the index text and flag (a) notes the index does not link to and
  (b) index links to missing notes, each with a one-click fix.
- **FR-009**: The user MUST be able to add a note with name, description, type and body; the file
  MUST use Claude's note format (header with name, description, type; then the body) and one index
  line `- [Title](file.md) — description` MUST be added.
- **FR-010**: Note names MUST be limited to safe characters (letters, digits, `-`, `_`) and MUST
  NOT collide with an existing note.
- **FR-011**: Writes MUST stay inside the selected project's memory folder; nothing else under the
  user's Claude folder is changed (global instructions, settings, other projects).
- **FR-012**: The list MUST refresh on its own while the tab is shown (a few seconds), so notes
  Claude writes during a session appear without reopening the dialog.
- **FR-013**: Errors (unreadable folder, failed write) MUST show as a short message in the tab;
  the tab MUST NOT crash the dialog.

### Key Entities

- **Project memory**: the folder of notes Claude keeps for one project (keyed by the main
  checkout's path); has an index note and zero or more notes.
- **Note**: one fact; file name, name, description, type (user / feedback / project / reference /
  unknown), body, last-change time.
- **Index**: the note Claude loads each session; one line per note, each linking a note file with a
  short hook.
- **Index problem**: a note missing from the index, or an index line with no note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From an open Project Settings, the user sees a project's notes in at most 2 clicks.
- **SC-002**: Fixing a wrong note (open, edit, save) takes under 30 seconds and needs no terminal or
  file browser.
- **SC-003**: After any delete or add done in the tab, the index has zero dead lines and zero
  unlisted notes caused by that action.
- **SC-004**: A note Claude writes during a running session shows up in the open tab within 10 seconds.
- **SC-005**: No action in the tab changes any file outside the selected project's memory folder.

## Assumptions

- "Memory claude" means Claude Code's automatic memory folder per project
  (`~/.claude/projects/<path-slug>/memory/`, index `MEMORY.md`), not the CLAUDE.md files of the
  repo or the user's global instructions; those are out of scope.
- Claude names the folder after the main checkout's absolute path with every character that is not
  a letter or digit replaced by `-`; worktrees share the main checkout's memory (observed: no
  worktree folder holds notes).
- The repo rule "nothing in Herdr writes to `~/.claude/`" is narrowed to: Herdr writes only inside a
  project's `memory/` folder, only on an explicit user action in this tab. CLAUDE.md is updated.
- The tab lists projects the same way the other Project Settings tabs do (local spaces only).
- No undo/trash: delete is final after confirmation (files are small and Claude can re-learn).

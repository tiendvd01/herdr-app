# Feature Specification: Project Settings Section Sidebar

**Feature Branch**: `030-settings-section-sidebar`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "[Image: the Ports / Worktree script / Summary prompt / Skills / Index / Memory tab row] Chuyển những cái này thành layout sidebar thứ 2" (turn these into a second sidebar)

## Context

Project Settings shows its sections (Ports, Worktree script, Summary prompt, Skills, Index, Memory)
as a horizontal row of chips under the project title. With six sections the row is crowded, has no
room to grow, and takes vertical space from every section. The dialog already has a left sidebar of
projects; the sections become a second sidebar next to it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a section from a second sidebar (Priority: P1)

The user opens Project Settings and sees three columns: projects, the sections of the selected
project, and the selected section's content. Clicking a section shows it.

**Why this priority**: it is the whole request.

**Independent Test**: open the dialog; the sections are listed top to bottom in a column between
the projects and the content; clicking each one shows the same content the old tab showed.

**Acceptance Scenarios**:

1. **Given** the dialog is open on a project, **Then** a second sidebar lists Ports, Worktree script,
   Summary prompt, Skills, Index and Memory in that order, and the chip row is gone.
2. **Given** a section is shown, **Then** its row in the second sidebar is highlighted like the
   selected project in the first sidebar.
3. **Given** the user clicks another section, **Then** that section's content is shown, with the same
   side effects as the old tab (Skills refreshes, Index and Memory load).
4. **Given** the Memory section has unsaved edits, **When** the user clicks another section, **Then**
   the same "click again to discard" guard applies.
5. **Given** the + menu's "Project skills…" opens the dialog, **Then** Skills is the highlighted section.

---

### User Story 2 - Know where you are (Priority: P2)

The project name and folder stay visible above the content; each section row carries a short hint
so the user knows what it holds without opening it.

**Independent Test**: each section row shows a label and a one-line muted hint; the content header
shows project name and path.

**Acceptance Scenarios**:

1. **Given** the dialog, **Then** the second sidebar's top shows the selected project's name, and the
   content area starts directly with the section (no duplicated project title row).
2. **Given** no git project is open, **Then** the second sidebar is not shown and the content says
   "Open a git project to configure it." as today.

### Edge Cases

- Narrow dialog: the second sidebar keeps a fixed width; the content shrinks; hints truncate.
- The page variant (not a dialog) keeps the same three-column layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The section chips MUST be replaced by a vertical second sidebar between the project list
  and the content.
- **FR-002**: The second sidebar MUST list the six sections in the current order, each with a label
  and a one-line hint; the selected one MUST look like the selected project row.
- **FR-003**: Selecting a section MUST behave exactly like selecting the old tab (same loads, same
  unsaved-edits guard).
- **FR-004**: The second sidebar MUST show the selected project's name (and folder) at its top; the
  content area MUST NOT repeat the big project title.
- **FR-005**: The dialog frame rule (spec 024) and the UI kit (spec 018) MUST still hold; the change
  MUST NOT add a second border or a hand-made frame.

### Key Entities

- **Section**: key, label, hint (Ports, Worktree script, Summary prompt, Skills, Index, Memory).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any section is reachable in one click from any other section.
- **SC-002**: The content area gains the height of the removed title + chip rows (about 80 px).
- **SC-003**: Every behaviour of the six sections works as before (no regression in the existing
  tests or in `herdr-app check`).

## Assumptions

- "Sidebar thứ 2" means a second fixed column inside the Project Settings dialog, styled like the
  first (chrome background, row highlight), not a new docked panel in the window layout.
- Text rows with hints, no icons (the kit has no matching icons yet).
- Width about 200 px; the projects sidebar stays 210 px.

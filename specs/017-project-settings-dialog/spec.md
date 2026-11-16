# Feature Specification: Project Settings as a dialog

**Feature Branch**: `017-project-settings-dialog`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Project settings cũng cho lên dialog thay vì hiện giữa tab"

## User Scenarios & Testing *(mandatory)*

Today Project Settings (Ports, Worktree script, Summary prompt, Skills per git project) replaces the terminal
tabs in the middle of the window until the user clicks Back. Changes, Git and Pull requests already open as
dialogs over the work area (spec 016). This feature makes Project Settings open the same way: a dialog over the
window, with the terminals left in place behind it.

### User Story 1 - Open Project Settings as a dialog (Priority: P1)

The user clicks Project Settings in the sidebar footer. A dialog opens over the window with the same page
(project list on the left, tabs on the right). The terminal tabs stay where they were. Clicking Project Settings
again, pressing Esc, or the dialog's close control closes it.

**Why this priority**: This is the whole request.

**Independent Test**: Click Project Settings; a dialog opens and the tab content behind it is unchanged;
switch tabs inside it, edit a value, close with Esc; the terminal tab that was shown before is still shown.

**Acceptance Scenarios**:

1. **Given** no dialog is open, **When** the user clicks Project Settings in the sidebar footer, **Then** a dialog with the Project Settings page opens and the terminal tabs are not replaced.
2. **Given** the dialog is open, **When** the user clicks Project Settings again, presses Esc, or clicks the close control, **Then** the dialog closes.
3. **Given** the dialog is open, **When** the user looks at the sidebar footer, **Then** the Project Settings row shows its "on" state.

---

### User Story 2 - Other entry points open the dialog (Priority: P1)

The + menu row "Project skills…" opens Project Settings on the Skills tab of the current project. It now opens
the dialog on that tab instead of switching the middle area. Ports' "go to terminal" closes the dialog and jumps
to that terminal.

**Why this priority**: Without it these paths would switch to a page that no longer exists.

**Independent Test**: From the + menu choose "Project skills…" → dialog opens on Skills for the current project;
in Ports click a terminal link → dialog closes and that terminal is focused.

**Acceptance Scenarios**:

1. **Given** the dialog is closed, **When** the user picks "Project skills…" in the + menu, **Then** the dialog opens on the Skills tab of the current project.
2. **Given** the dialog is already open, **When** the same request comes again, **Then** it stays open and shows the Skills tab.
3. **Given** the dialog is open on Ports, **When** the user clicks a terminal link, **Then** the dialog closes and that terminal is focused.

---

### User Story 3 - Dialog looks like the other dialogs (Priority: P2)

The dialog has the same size and frame as Changes, Git and Pull requests: one rounded border line, shadow,
content clipped to the corners, no double border.

**Why this priority**: Consistency, and the earlier request asked to check borders on every move to a dialog.

**Independent Test**: Screenshot the Project Settings and Changes dialogs; compare size, corners, border, shadow.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **When** the user looks at its edge, **Then** there is one border line with the same radius and shadow as the Changes dialog.
2. **Given** the dialog is open, **When** compared with the Changes dialog, **Then** both take the same share of the window.

### Edge Cases

- The user switches space while the dialog is open (keyboard): the dialog stays open; it is not tied to a space.
- The Summary prompt or Worktree script editor has unsaved text and the dialog closes: same behaviour as leaving the page today (no new prompt).
- Another dialog is already open: Project Settings opens on top; Esc closes the top one first.
- Esc inside a text editor of the dialog: closes the dialog as other dialogs do (same as Herdr's default for dialogs).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sidebar footer's Project Settings row MUST open Project Settings as a dialog, and close it when clicked while open.
- **FR-002**: The terminal tabs MUST NOT be replaced or hidden by Project Settings; the middle area always shows the tabs.
- **FR-003**: The Project Settings row MUST show its "on" state while the dialog is open.
- **FR-004**: The + menu's request to open the Skills tab MUST open the dialog (or keep it open) on the Skills tab of the current project.
- **FR-005**: Ports' "go to terminal" MUST close the dialog and focus that terminal.
- **FR-006**: The page's "Back" control MUST become a close control for the dialog.
- **FR-007**: The dialog MUST have the same size and single frame (rounded corners, one border line, shadow) as the Changes, Git and Pull requests dialogs.
- **FR-008**: Everything the page offered (project list, Ports, Worktree script, Summary prompt, Skills) MUST work the same in the dialog.
- **FR-009**: CLAUDE.md MUST describe Project Settings as a dialog.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening and closing Project Settings leaves the shown terminal tab unchanged in 100% of tries.
- **SC-002**: Opening or closing takes one click or one key press.
- **SC-003**: A screenshot comparison with the Changes dialog shows the same size, corner radius, border and shadow.
- **SC-004**: All four tabs of Project Settings can be used from the dialog with the same results as before.

## Assumptions

- Size: same as the other dialogs (75% of window width, 80% of height).
- Project Settings no longer needs a place in the middle area; it is removed from there.
- No new keyboard shortcut is needed.

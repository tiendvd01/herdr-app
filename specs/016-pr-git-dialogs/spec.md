# Feature Specification: Pull requests and Git graph as dialogs

**Feature Branch**: `016-pr-git-dialogs`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Chuyển pr mods, và git graph mods cho lên hiển thị trên dialog thay vì panels, nhớ check border khi chuyển sang dialog"

## User Scenarios & Testing *(mandatory)*

Today the tab bar has buttons for Files, Changes, Issues, Git and Pull requests. Changes already opens as a
large centered dialog; Git (commit graph) and Pull requests still open in the narrow right-side panel, which
squeezes the terminal and leaves both views cramped. This feature makes Git and Pull requests behave like
Changes: a large dialog over the work area, with a frame that looks the same as the Changes dialog.

### User Story 1 - Open Pull requests as a dialog (Priority: P1)

From the tab bar, the user clicks Pull requests. A large dialog opens over the work area showing the same
Pull requests view (list, detail, diff, comments) that the panel showed. The terminals keep their full width.
Clicking the button again, pressing Esc, or the dialog's close control closes it.

**Why this priority**: Pull requests is the view with the most content (PR detail, files, diff, comments) and
suffers most from the narrow panel; the inbox also jumps into it.

**Independent Test**: Click the Pull requests button; a dialog opens, the right panel stays closed, the
terminal width does not change; open a PR, view its diff, close with Esc.

**Acceptance Scenarios**:

1. **Given** no dialog is open, **When** the user clicks Pull requests in the tab bar, **Then** a dialog with the Pull requests view opens and the right panel does not open.
2. **Given** the Pull requests dialog is open, **When** the user clicks the same button again or presses Esc, **Then** the dialog closes.
3. **Given** the Pull requests dialog is open, **When** the user looks at the tab bar, **Then** the Pull requests button shows its "on" state, as Changes does while its dialog is open.
4. **Given** an inbox entry for a PR, **When** the user clicks it, **Then** the Pull requests dialog opens on that PR (instead of the right panel).

---

### User Story 2 - Open Git graph as a dialog (Priority: P1)

From the tab bar, the user clicks Git. A large dialog opens with the commit graph of the focused terminal's
repository, with all actions the panel had (details, context menu actions, their own confirm dialogs).

**Why this priority**: Same value as Story 1; the commit graph needs width for lanes, messages and details.

**Independent Test**: Click Git; a dialog with the commit graph opens; select a commit, open details, run a
context-menu action that asks for confirmation; the confirmation shows above the graph dialog; close with Esc.

**Acceptance Scenarios**:

1. **Given** no dialog is open, **When** the user clicks Git, **Then** a dialog with the commit graph of the focused terminal's repo opens and the right panel does not open.
2. **Given** the Git dialog is open, **When** an action opens its own confirm/input dialog, **Then** that dialog appears above the Git dialog, and Esc closes only the top one.
3. **Given** the Git dialog is open, **When** the user clicks Git again or presses Esc, **Then** the dialog closes.

---

### User Story 3 - Dialog frame looks right (Priority: P1)

Each dialog (Pull requests, Git) has exactly one clean border: rounded corners, a single 1px border line in the
theme's border color and a shadow, matching the Changes dialog. No double border (Herdr frame + the mod's own
border), no missing border, no square content corners poking out of a rounded frame, no content clipped at
the edges.

**Why this priority**: The user explicitly asked to check the border; the panel views draw their own border
sized for a panel, which is the likely source of a double or mismatched frame in a dialog.

**Independent Test**: Open Changes, Pull requests and Git dialogs one after another and take a screenshot of
each; compare corners, border line and shadow in both a light and a dark theme.

**Acceptance Scenarios**:

1. **Given** the Pull requests dialog is open, **When** the user looks at its edge, **Then** they see one rounded border line, the same radius, color and shadow as the Changes dialog.
2. **Given** the Git dialog is open, **When** the user looks at its corners, **Then** the content is clipped to the rounded corners (no square corners inside a rounded frame).
3. **Given** the theme changes, **When** a dialog is open, **Then** its border follows the new theme's border color.

---

### User Story 4 - Panel stops offering Git and Pull requests (Priority: P2)

The right panel keeps only Files and Issues. A space whose remembered panel was Git or Pull requests shows no
panel after this change instead of an empty or broken one.

**Why this priority**: Clean-up so the old placement does not linger; low risk once Stories 1–3 work.

**Independent Test**: In a space that last had Git open in the panel, switch to it; the right panel is hidden
and Files/Issues still open in the panel.

**Acceptance Scenarios**:

1. **Given** a space remembered "Git" or "Pull requests" as its open panel, **When** the user switches to that space, **Then** the right panel stays hidden.
2. **Given** any space, **When** the user clicks Files or Issues, **Then** they still open in the right panel as before.

### Edge Cases

- Another dialog (e.g. Changes) is already open when the user clicks Git or Pull requests: the new dialog opens on top; Esc closes the top one first. Only one copy of each of Git and Pull requests is open at a time.
- The focused terminal changes while the Git or Pull requests dialog is open: the dialog keeps following the focused terminal's folder, as the panel did.
- The focused folder is not a git repo / has no GitHub remote: the dialog shows the same empty state the panel showed, inside the same frame.
- Small window: the dialog scales with the window (same share of the window as Changes) and its content stays scrollable, not clipped.
- Pull requests' "viewer" mode (a PR opened inside a terminal pane, which already has Herdr's own frame) keeps its current frameless look; only the dialog gets the dialog frame.
- The Git graph mod comes from upstream and may be updated: the dialog behaviour must not be lost silently when the mod is updated (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tab bar's Pull requests button MUST open the Pull requests view as a dialog over the work area instead of in the right panel, and close it when clicked while open.
- **FR-002**: The tab bar's Git button MUST open the commit graph as a dialog instead of in the right panel, and close it when clicked while open.
- **FR-003**: The tab bar buttons for Git and Pull requests MUST show their "on" state while their dialog is open, consistent with the Changes button.
- **FR-004**: Esc MUST close the topmost dialog; a confirm/input dialog opened from the Git dialog MUST appear above it and close first.
- **FR-005**: Each of the two dialogs MUST have the same size relative to the window as the Changes dialog (75% of width and 80% of height).
- **FR-006**: Each dialog MUST show exactly one border: rounded corners, 1px line in the theme border color, and shadow, matching the Changes dialog; content MUST be clipped to the rounded corners, with no double border and no missing border.
- **FR-007**: All features the panels offered (PR list, PR detail, diff, comments, settings; graph, details, actions, fetch) MUST work the same inside the dialogs.
- **FR-008**: Clicking a PR entry in the inbox MUST open the Pull requests dialog on that PR.
- **FR-009**: The right panel MUST no longer contain Git and Pull requests; Files and Issues MUST keep working in the panel unchanged.
- **FR-010**: A space whose remembered panel was Git or Pull requests MUST fall back to a hidden panel without errors.
- **FR-011**: The dialogs MUST keep following the focused terminal's folder, as the panels did.
- **FR-012**: Only one Git dialog and one Pull requests dialog may be open at a time; opening again while open closes (toggles) it.
- **FR-013**: CLAUDE.md MUST describe the new placement (Git and Pull requests as dialogs from the tab bar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening Git or Pull requests changes the terminal area width by 0 px (the right panel no longer opens for them).
- **SC-002**: In side-by-side screenshots of the Changes, Git and Pull requests dialogs, all three show one border line with identical corner radius and shadow, in both a light and a dark theme.
- **SC-003**: 100% of the actions available in the old Git and Pull requests panels can be completed from the dialogs.
- **SC-004**: Opening or closing either dialog takes one click or one key press, the same as Changes.
- **SC-005**: Both mods load and render without errors in the app's mod check and status report after the change.

## Assumptions

- "Dialog" means the same kind of overlay Changes uses: centered over the window, 75% of width and 80% of height, closed with Esc, with the mod drawing its own frame (so Herdr adds no second frame). This is the reference look for "check border".
- No new keyboard shortcuts are required; Changes keeps its shortcut. Shortcuts for Git and Pull requests may be added later.
- The Pull requests mod is personal and can be changed in place. The Git graph mod is taken from upstream (it has its own update path); the change must be kept small and noted so it can be re-applied after an upstream update, or done in a personal copy if in-place changes would be lost.
- The right panel itself stays (Files, Issues); removing the panel entirely is out of scope.
- Shipped layouts (`main`, `terminals`, `win98`) and the shipped `tabs` mod are not changed; only the personal layout and personal mods are.

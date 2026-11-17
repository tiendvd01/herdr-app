# Feature Specification: Every dialog has one clean border

**Feature Branch**: `021-dialog-border-audit`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: User description: "kiểm tra tất cả dialog trong app, kiểm tra những chỗ nào bị lỗi border và fix"

## User Scenarios & Testing *(mandatory)*

Specs 016, 017 and 020 fixed a double border on single dialogs (Changes, Git, Pull requests, Project
Settings, Processes) one at a time. This feature checks every dialog and popup the user's own screens open,
by every way they can be opened, and fixes each one whose edge is wrong, so no dialog is left with a doubled,
missing, clipped or mismatched border.

### User Story 1 - No dialog shows a double or broken border (Priority: P1)

Whatever dialog the user opens (from the tab bar, status bar, sidebar, + menu, a keyboard prefix, a link in
a panel), its edge is one thin line in the theme's border color with rounded corners and a shadow. There is
no second frame inside it, no gap between two frames, no square corner poking out of a rounded one, and no
content painted over the edge.

**Why this priority**: It is the whole request.

**Independent Test**: Open each dialog in the audit list, by each way it can be opened, take a screenshot,
and look at the edge and corners.

**Acceptance Scenarios**:

1. **Given** any personal dialog, **When** it opens, **Then** exactly one border line surrounds it and its corners are rounded and not clipped.
2. **Given** a dialog that can be opened in two ways (for example a status bar button and a keyboard prefix), **When** it is opened either way, **Then** the frame looks the same.
3. **Given** light and dark themes, **When** a dialog is open, **Then** its border and background use the theme's colors in both.

### User Story 2 - Dialogs look like one family (Priority: P2)

Large dialogs (Changes, Git, Pull requests, Project Settings, Processes, UI gallery) and small ones (Open
in VS Code / Zed, Project scripts, worktree, Git's action and update dialogs, the diagram viewer, the
reviewer's ask dialog) and popups (branch switch, + menu, sort menu, tmux prefix) share the same edge: same
line weight, same color, rounded corners of the kind's size, a shadow.

**Why this priority**: Matches the UI kit rule of one look; less important than removing broken edges.

**Independent Test**: Put screenshots of the dialogs side by side and compare the edges.

**Acceptance Scenarios**:

1. **Given** two dialogs open one after the other, **When** their edges are compared, **Then** border width and color match, and corners are rounded.

### Edge Cases

- Content boxes inside a dialog (cards, inputs, list rows, headers with a bottom divider) keep their own lines; only the outer frame is in scope.
- A dialog's inner header/footer divider must not touch or double the outer border at the top or bottom.
- A dialog opened in a size smaller than its content still clips content inside the rounded frame, never over it.
- Shipped Herdr dialogs (picker, open-file, machine-add, mermaid board, shipped worktree and menu, win98) are Herdr's and are not changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every dialog and popup opened by a personal mod MUST show exactly one outer frame: one border line, rounded corners, a shadow.
- **FR-002**: A dialog MUST look the same whichever way it is opened (button, menu, keyboard prefix, command).
- **FR-003**: Content MUST be clipped inside the frame; no background or child may paint over the border or past the rounded corners.
- **FR-004**: Outer frames MUST use the theme's border and background colors so they work in light and dark themes.
- **FR-005**: The audit MUST record each dialog checked, how it opens, what was wrong (if anything) and what was done, in the feature folder.
- **FR-006**: Size, content and behaviour (Esc, Close, actions) of every dialog MUST stay as today.

### Key Entities

- **Dialog**: a screen opened over the layout by a personal mod; has a way (or ways) to open, a size, and a frame drawn either by Herdr or by the mod itself.
- **Audit entry**: dialog name, ways to open, finding, fix.

## Success Criteria *(mandatory)*

- **SC-001**: 100% of personal dialogs in the audit list have a screenshot showing one clean border after the fix.
- **SC-002**: Zero dialogs show a different frame depending on how they were opened.
- **SC-003**: No behaviour of any dialog changes (same size, same keys, same actions).

## Assumptions

- "Dialog" covers dialogs and popups opened by personal mods (`kind: "dialog"` and `kind: "popup"`), not floating windows or toasts.
- "Lỗi border" (border bug) means a doubled frame, a missing frame, square or clipped corners, content over the edge, or an edge that does not match the others.
- The look to match is the existing one: Herdr's own dialog frame, or the UI kit's `dialogFrame` for dialogs that draw their own (same line, radius, shadow).
- Shipped mods are out of scope (constitution I); if one shows a bug, it is noted, not fixed.

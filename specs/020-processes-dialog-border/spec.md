# Feature Specification: Processes dialog with one border

**Feature Branch**: `020-processes-dialog-border`

**Created**: 2026-11-16

**Status**: Implemented

**Input**: User description: "Process manager cũng đang bị thừa border"

## User Scenarios & Testing *(mandatory)*

The Processes dialog (Claude sessions and their processes, opened from the status bar's `N proc · CPU · RAM`
badge) is drawn inside Herdr's own dialog frame while its content paints its own background edge to edge, so
the user sees an extra border / double edge around it. Changes, Git, Pull requests and Project Settings were
fixed the same way before (specs 016, 017): one frame, drawn by the dialog itself.

### User Story 1 - Processes dialog has exactly one frame (Priority: P1)

The user clicks the process badge in the status bar. The Processes dialog opens with a single clean frame:
rounded corners, one 1px line in the theme's border color and a shadow, the same as the Pull requests dialog.

**Why this priority**: It is the whole request.

**Independent Test**: Open Processes from the status bar; look at the edge: one line, rounded, no second
frame or gap; compare with the Pull requests dialog.

**Acceptance Scenarios**:

1. **Given** no dialog is open, **When** the user clicks the process badge, **Then** the Processes dialog opens with one border and rounded corners matching the other dialogs.
2. **Given** the Processes dialog is open, **When** the user presses Esc or Close, **Then** it closes as before.
3. **Given** light and dark themes, **When** the dialog is open, **Then** the frame uses the theme's border and background colors in both.

### Edge Cases

- Session cards inside the dialog keep their own borders (they are content, not the frame).
- Opening Processes any other way (command palette, `mod.open`) shows the same single frame.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Processes dialog MUST show exactly one outer frame (one border line, rounded corners, shadow), with no frame drawn around it by the app.
- **FR-002**: The frame MUST look the same as the other personal dialogs (Changes, Git, Pull requests, Project Settings).
- **FR-003**: Size, content, Esc / Close and go-to-terminal behaviour MUST stay as today.

## Success Criteria *(mandatory)*

- **SC-001**: A screenshot of the open dialog shows one border line around it, and its edge matches the Pull requests dialog.
- **SC-002**: No other behaviour of the dialog changes.

## Assumptions

- "Process manager" is the `processes` dialog opened from the status bar badge.
- Size stays 920 × 720.

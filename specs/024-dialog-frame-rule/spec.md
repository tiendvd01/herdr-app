# Feature Specification: One rule for dialog borders, checked automatically

**Feature Branch**: `024-dialog-frame-rule`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: User description: "Đồng bộ cách dùng border với dialog, tránh tình trạng lặp lại lỗi border mỗi khi tạo module mới"

## User Scenarios & Testing *(mandatory)*

Specs 016, 017, 020 and 021 each fixed a doubled dialog border after it showed up. The cause was always the
same: two parties drew the frame (Herdr and the screen itself), or the frame setting was lost on one of the
ways the dialog opens. This feature makes one rule for who draws a dialog's border and adds a check that
catches a break of the rule before anyone sees it.

### User Story 1 - A new dialog gets one border without trial and error (Priority: P1)

Whoever builds a new screen that opens as a dialog follows one written rule and runs one check. If the
screen would end up with a doubled or missing border on any way it opens, the check says so and names the
file and the fix.

**Why this priority**: It is the request: stop the same bug from coming back with each new screen.

**Independent Test**: Break the rule on purpose in a copy of the setup (a screen that draws its own frame but
lets Herdr draw one too; an opening that loses the frame setting); the check fails and names it. On the real
setup the check passes.

**Acceptance Scenarios**:

1. **Given** a screen that draws its own dialog frame but does not tell Herdr to skip its frame, **When** the check runs, **Then** it fails naming that screen.
2. **Given** a screen that tells Herdr to skip the frame but draws none itself, **When** the check runs, **Then** it fails naming that screen.
3. **Given** another screen opens that dialog in a way that loses the "no Herdr frame" setting, **When** the check runs, **Then** it fails naming the file and line.
4. **Given** the current setup, **When** the check runs, **Then** it passes.

### User Story 2 - Every dialog is opened the same way (Priority: P2)

Every screen that opens another screen's self-framed dialog does it the same way, so the frame setting lives
in one place (the dialog's own settings) and the open behaves the same from everywhere (again: closes it).

**Why this priority**: Removes the root cause; the check (US1) is the safety net.

**Independent Test**: Open Processes from the status bar and from Ctrl+B › p; both show one border, and a
second press closes it.

**Acceptance Scenarios**:

1. **Given** Processes, **When** opened from the status bar or the keyboard prefix, **Then** it has one border both ways.

### Edge Cases

- A self-framed screen may open small sub-dialogs or menus of itself (reviewer's Ask, Git's action dialogs and row menus); those use Herdr's frame and their content draws none. They are allowed.
- Screens shipped with Herdr are not changed (constitution I).
- Dialogs built from a layout (the sub-agent peek) describe their frame in the layout itself and are out of the check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The rule MUST be written once where builders of screens read it: a dialog's frame is drawn either by Herdr or by the screen with the kit's dialog frame, never both and never neither; a self-framed screen says so in its own settings; other screens open it by its name (which reads those settings).
- **FR-002**: A check MUST fail when a screen draws the kit's dialog frame but its settings do not turn Herdr's frame off.
- **FR-003**: The check MUST fail when a screen's settings turn Herdr's frame off but the screen draws no frame.
- **FR-004**: The check MUST fail when one screen opens another screen's self-framed dialog explicitly without turning Herdr's frame off, naming file and line.
- **FR-005**: All self-framed dialogs MUST draw their frame with the kit's one frame helper.
- **FR-006**: Existing openings of another screen's self-framed dialog MUST go through the open-by-name path.
- **FR-007**: The check MUST pass on the current setup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each of the three ways to break the rule (FR-002..004) is caught by the check in a test copy.
- **SC-002**: Zero dialogs with a doubled or missing border after the change (Processes checked both ways by screenshot).
- **SC-003**: Building a new dialog needs one rule and one command, both in the main guidance file.

## Assumptions

- The check is a static read of the screens' files, run by hand (or by an agent) after building or changing a dialog, like `herdr-app check`; there is no CI in this repo.
- Sub-dialogs a screen opens of itself are trusted to follow the rule (their content is not read by the check).

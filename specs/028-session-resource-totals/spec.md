# Feature Specification: Session resource totals (used / machine total)

**Feature Branch**: `028-session-resource-totals` (no branch created)

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Thêm tính năng số lượng ram và cpu đã dùng trên tổng số ở trong session manager"

> Scope note: the "session manager" is the Sessions dialog (mod `processes`, spec 001), opened from the status bar's proc badge. Its header today reads `N sessions · M processes · CPU x% · RAM y`, with no sense of how much of the machine that is.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how much of the machine the sessions use (Priority: P1)

A user running several Claude sessions opens the Sessions dialog. In the header they read the CPU and RAM the sessions use next to the machine's total, e.g. `CPU 120% / 800% · RAM 2.1 / 16 GB`, so they can tell at a glance whether the sessions are a small or a large share of the machine.

**Why this priority**: a raw `RAM 2.1 GB` means little without the total; the share is what tells the user whether to stop something.

**Independent Test**: open the dialog on a machine with known core count and memory and confirm the totals shown match the machine and the used figures match today's header.

**Acceptance Scenarios**:

1. **Given** sessions are running, **When** the user opens the dialog, **Then** the header shows CPU as `used% / total%` where total is 100% per logical core, and RAM as `used / total` with the machine's physical memory.
2. **Given** the machine total cannot be read, **When** the dialog renders, **Then** the header falls back to the used figures alone, as today, with no error shown.
3. **Given** no sessions are running, **When** the dialog is open, **Then** the header shows `0%` and `0 MB` against the machine totals.
4. **Given** the share of RAM or CPU used by sessions is high (at least 80% of the total), **When** the header renders, **Then** that figure is drawn in the warning color.

### Edge Cases

- Used CPU above the total (decaying `ps` average on a short burst): shown as is, not clamped; it is still a warning.
- Used RAM with mixed units (`512 MB / 16 GB`): used is shown in the unit that suits it, total always in GB.
- The machine total does not change while the app runs; reading it once per dialog open is enough.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Sessions dialog header MUST show the sessions' CPU use next to the machine's CPU capacity (100% × logical cores).
- **FR-002**: The header MUST show the sessions' RAM use next to the machine's physical memory.
- **FR-003**: The used figures MUST be the same ones the header shows today (sum of the sessions' processes); only the totals are new.
- **FR-004**: If the totals cannot be read, the header MUST show the used figures alone and nothing breaks.
- **FR-005**: A used figure at 80% or more of its total MUST be drawn in the warning color.
- **FR-007**: Each of CPU and RAM MUST also be shown as a progress bar filled to used / total (clamped to full), in the warning color at 80% and above; no bars when the totals are unknown.
- **FR-008**: Next to the sessions' use, the header MUST show the whole machine's CPU and RAM use against the same totals, as a fainter fill under the sessions' fill; the warning color then follows the machine's use. If machine use can't be read, only the sessions' use is shown.
- **FR-006**: Reading the totals MUST NOT slow the dialog's opening or its refresh.

### Key Entities

- **Machine totals**: logical core count and physical memory size of the local machine.
- **Session usage**: CPU percent and resident memory summed over the listed sessions' processes (existing).

## Success Criteria *(mandatory)*

- **SC-001**: On opening the dialog the user can read both the share of CPU and of RAM used by sessions without leaving it or doing arithmetic beyond one glance.
- **SC-002**: The totals shown equal the machine's actual core count × 100% and physical memory (checked against system info) in 100% of opens.
- **SC-003**: The dialog opens and refreshes as fast as before (no visible delay added).

## Assumptions

- "Used" is shown twice: by the Claude sessions listed (the existing header sum) and by the whole machine (added on request). Machine RAM counts app memory + wired + compressed, as Activity Monitor's "Memory Used".
- CPU total uses the common "100% per core" scale so it matches the per-process CPU figures already shown.
- Only the dialog header changes; the per-session lines and the status bar proc badge stay as they are.
- Local machine only (the dialog lists local sessions).

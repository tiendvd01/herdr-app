# Feature Specification: Shared UI style kit (buttons, motion, common styles)

**Feature Branch**: `018-ui-style-kit`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Design 1 bộ style button, và animation của button, và các style chung để dùng trong application cho đồng bộ"

## User Scenarios & Testing *(mandatory)*

The app's own screens (tab bar, side panels, dialogs, sidebar footer, status bar, menus) are built by many
separate mods. The right panels share one small button set, but everything else draws its buttons by hand:
heights, corner radius, hover color, pressed feedback and disabled look differ from screen to screen, and no
button gives feedback while pressed or while working. This feature defines one style kit: a set of button
kinds with their states and motion, plus the common styles (sizes, spacing, radius, text sizes, surfaces such
as dialog frame, card, input, divider, section title, empty state), and moves the app's personal screens onto it.

### User Story 1 - One button set with clear states (Priority: P1)

Anyone using the app sees buttons that look and react the same everywhere: the same kinds (primary,
secondary, ghost/text, danger, icon-only, toggle chip, back), the same sizes (small, normal, large), and the
same states (normal, hover, pressed, on/selected, disabled, busy).

**Why this priority**: The core of the request: consistency.

**Independent Test**: Open the style gallery; every kind × size × state is shown side by side; hover and press
each one and see the documented reaction.

**Acceptance Scenarios**:

1. **Given** any button of the kit, **When** the pointer rests on it, **Then** it shows the hover look of its kind.
2. **Given** any enabled button, **When** it is pressed, **Then** it shows a pressed look until released.
3. **Given** a disabled button, **When** the user hovers or clicks it, **Then** nothing changes and no action runs; it is visibly dimmed.
4. **Given** a busy button (its action is running), **When** shown, **Then** it shows a spinning indicator, keeps its width, and ignores clicks.
5. **Given** a toggle chip or icon button that is "on", **When** shown, **Then** it has the selected look, distinct from hover.

---

### User Story 2 - Button motion (Priority: P1)

Buttons move a little to confirm what is happening: the hover highlight fades in rather than snapping, a press
gives a short visible response, a busy button spins, and a button that needs attention (e.g. an update ready,
an unsent review) can pulse gently. Motion is short and subtle and never delays the action.

**Why this priority**: Explicitly requested ("animation của button").

**Independent Test**: In the gallery, hover/press each kind and watch the motion; toggle "busy" and
"attention" demos; motion stops when the gallery closes.

**Acceptance Scenarios**:

1. **Given** a button, **When** the pointer enters, **Then** the hover highlight appears within about 120 ms with a smooth fade.
2. **Given** a button, **When** pressed, **Then** a visible press response starts immediately and the action is not delayed.
3. **Given** an attention button, **When** shown, **Then** it pulses slowly (about once per 1.2–1.6 s) and stops pulsing when no longer marked.
4. **Given** any animated button, **When** it is not on screen, **Then** it causes no ongoing work (no battery cost).

---

### User Story 3 - Common styles for screens (Priority: P2)

Screens share one set of common styles: size and spacing steps, corner radius steps, text sizes (title,
body, small, caption), and ready-made surfaces: dialog frame, card, input field frame, divider, section
title, empty state (icon + title + hint), toolbar/header row.

**Why this priority**: Buttons alone don't make screens look the same; the surrounding surfaces must match.

**Independent Test**: The gallery shows each surface; the Changes, Git, Pull requests and Project Settings
dialogs use the same dialog frame.

**Acceptance Scenarios**:

1. **Given** the four dialogs, **When** compared, **Then** they use one frame definition (same radius, border, shadow).
2. **Given** a new screen built from the kit, **When** placed next to an existing one, **Then** header height, paddings and text sizes match.

---

### User Story 4 - Existing screens use the kit (Priority: P2)

The personal screens move onto the kit: the right panels (Files, Changes, Issues, Git, Pull requests,
Mermaid board) through their shared button set, plus the tab bar's trailing buttons, Project Settings, the
inbox, the status bar and the branch switcher.

**Why this priority**: The kit only pays off once screens use it.

**Independent Test**: Screenshots before/after of each listed screen: buttons use kit kinds/sizes; hover and
press behave as in the gallery; no screen lost a function.

**Acceptance Scenarios**:

1. **Given** each listed screen, **When** the user hovers and presses its buttons, **Then** they behave as the gallery shows for that kind.
2. **Given** each listed screen, **When** used after the change, **Then** every action available before still works.

### Edge Cases

- Light and dark themes: every kind and state stays readable (text vs. background) in both, colors come only from the active theme.
- Long labels: buttons truncate instead of growing past their container; icon-only buttons always have a tooltip.
- A busy button whose action fails: it returns to normal and the screen shows the error as today.
- Rapid repeated clicks: a busy button ignores clicks until done; a normal button fires once per click.
- Keyboard-only use is unchanged (no new focus rules in this feature).
- Upstream / shipped mods (Herdr's own and `git-graph`): not hand-edited; `git-graph` gets the kit only through its synced shared button file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The kit MUST define button kinds: primary (filled), secondary (outlined), ghost (text, no box), danger, icon-only, toggle chip, back.
- **FR-002**: The kit MUST define three sizes (small, normal, large) with fixed heights, paddings, radius and text size per size.
- **FR-003**: Every kind MUST define the states normal, hover, pressed, on/selected (where meaningful), disabled and busy.
- **FR-004**: Disabled and busy buttons MUST NOT run their action; busy MUST show a spinning indicator without changing the button's width.
- **FR-005**: Icon-only buttons MUST always carry a tooltip / accessible label.
- **FR-006**: Hover highlight MUST fade in and out (about 100–150 ms); press MUST show an immediate response; neither may delay the action.
- **FR-007**: The kit MUST offer an attention pulse for a button, slow and subtle, that can be turned on and off.
- **FR-008**: All motion MUST stop costing work when the element is not drawn.
- **FR-009**: The kit MUST define common styles: spacing steps, radius steps, text size steps, and surfaces: dialog frame, card, input frame, divider, section title, header row, empty state.
- **FR-010**: All colors MUST come from the active theme; nothing hard-coded except transparency.
- **FR-011**: A style gallery screen MUST show every kind × size × state, the motion demos, and each surface, in the current theme; it opens as a dialog and is not docked anywhere by default.
- **FR-012**: The existing panel button functions MUST keep working for their current callers (no breaking change for the panels).
- **FR-013**: The screens listed in User Story 4 MUST use the kit for their buttons, and the four dialogs MUST use the kit's dialog frame.
- **FR-014**: CLAUDE.md MUST state the rule: new or changed buttons and surfaces come from the kit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the listed screens, 100% of clickable buttons use a kit kind (checked by review of each screen).
- **SC-002**: Button heights in the listed screens take only the three kit sizes.
- **SC-003**: Hover feedback appears within 150 ms and a press response is visible immediately, with no added delay before the action.
- **SC-004**: With the gallery closed and no busy/attention buttons visible, the app shows no extra ongoing redraw work.
- **SC-005**: All listed screens keep every action they had (0 regressions found in a click-through).
- **SC-006**: Every kind and state is readable in both a light and a dark theme (checked on gallery screenshots).

## Assumptions

- The kit lives in the shared library already used for panel buttons, extended rather than replaced, and is copied into each mod that uses it the same way the panel buttons are today.
- Herdr-shipped mods and layouts are not touched; `git-graph` (upstream) only gets the kit through its synced shared file.
- Not every element is a "button": list rows, tabs in the tab bar and tree items keep their own look in this feature; only buttons, chips, and the listed surfaces move.
- Motion is limited to what the app can animate natively (opacity, size, position, spin, pulse); color itself does not animate, so a fade is done with opacity.
- No new keyboard behaviour and no new icons beyond the existing icon set (plus a spinner already present).

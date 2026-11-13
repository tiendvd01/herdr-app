# Feature Specification: AI Usage Limits in the Status Bar (as-built)

**Feature Branch**: `007-ai-usage` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the AI usage display of the status bar (mod `status-usage`) as it behaves today. Describe what it does and why, not how."

> Scope note: covers only the "Used" section of the status bar and its hover card. The process badge / Sessions dialog (spec 001), the branch popup (spec 008) and the post-create script runner (spec 009) are out of scope. Source: `mods/status-usage/main.js` and `docs/mods/status-usage.md`. No automated tests exist; scenarios come from observed code behaviour.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how much of my AI quota I have used at a glance (Priority: P1)

A user working with several AI coding tools wants to know, without leaving the window, how close they are to their limits. The status bar shows "Used" followed by one compact figure per provider that has usage data.

**Why this priority**: hitting a limit mid-task is costly; a permanent glance-able figure lets the user pace their work.

**Independent Test**: with the usage CLI installed and at least one provider signed in, open the app and confirm "Used" appears in the status bar with a percentage next to each provider icon.

**Acceptance Scenarios**:

1. **Given** Claude has data, **When** the bar renders, **Then** Claude shows only its weekly window as "NN%" plus the time until that window resets (e.g. "42% 2d 3h").
2. **Given** another provider (codex, copilot, gemini, agy) has data, **When** the bar renders, **Then** it shows the single window with the highest used percentage, with a short label (e.g. "wk", "premium").
3. **Given** a provider's data is neither fresh nor stale, or the provider is not set up, **Then** it is hidden.
4. **Given** a provider has no window with a numeric remaining percentage, **Then** it is hidden.
5. **Given** no provider has data yet, **Then** only "Used" is shown.

---

### User Story 2 - Inspect every window of every provider (Priority: P2)

On hovering the usage section, a card opens with a bar per window, its percentage and when it resets, grouped by provider.

**Why this priority**: the compact figure hides other windows (e.g. a short session window) that can still block the user.

**Independent Test**: hover "Used" and confirm the card lists each provider with plan, each window with a progress bar and percentage, and a reset line.

**Acceptance Scenarios**:

1. **Given** the user hovers the section, **When** about 150 ms pass, **Then** a card titled "Usage" opens below-right with icon, name and plan per provider and a bar for every window.
2. **Given** a window at 70% or more used, **Then** its bar turns warning-coloured; at 90% or more, danger-coloured; below 70%, the accent colour.
3. **Given** a window has a reset time in the future, **Then** the card says "resets in ..." (days/hours, hours/minutes or minutes); if the time has passed, "reset pending"; if there is none, no line.
4. **Given** a provider's data is stale, **Then** its plan label is suffixed "· stale".
5. **Given** no data, **Then** the card says "No data yet".

---

### User Story 3 - Keep the figures current without effort (Priority: P2)

Figures refresh by themselves and when the user shows interest by hovering.

**Why this priority**: stale numbers defeat the purpose, but hammering the data source is wasteful.

**Independent Test**: leave the app idle for over 2 minutes and confirm a refresh occurred; hover repeatedly and confirm refreshes are throttled.

**Acceptance Scenarios**:

1. **Given** the app is running, **Then** usage is fetched at start and then every 120 seconds.
2. **Given** the user hovers the section, **Then** a refresh is requested, but skipped if the last fetch was under 30 seconds ago or one is already running.
3. **Given** the data source itself caches, **Then** it may answer with data up to 60 seconds old.

---

### User Story 4 - Understand why usage is missing (Priority: P3)

When fetching fails, the user sees a short red message in the bar instead of silent emptiness.

**Why this priority**: a missing tool or login problem is otherwise invisible.

**Independent Test**: make the CLI unavailable and confirm a red message appears in the bar.

**Acceptance Scenarios**:

1. **Given** the CLI exits with an error and no output, **Then** a red message (first 90 characters) is shown next to "Used".
2. **Given** the output cannot be parsed, **Then** the parse error is shown the same way.
3. **Given** a later fetch succeeds, **Then** the message disappears.

---

### Edge Cases

- Output may be preceded by noise from the login shell; everything before the first `{` is ignored.
- A failed refresh keeps showing the previous figures alongside the error message.
- Claude with no weekly window shows only its icon.
- Percentages are rounded; the bar never shows less than 2% width or more than 100%.
- A provider without a bundled icon falls back to an icon named after the provider id.
- Hover-triggered refresh cannot overlap an in-flight one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a "Used" section in the status bar with one entry per provider that has usable data.
- **FR-002**: The system MUST obtain usage from the external `quota-axi` command, run through the user's login shell so the user's PATH applies, and MUST derive "used" as 100 minus the percentage remaining.
- **FR-003**: The system MUST include only providers whose data is fresh or stale and that are set up, and only windows that carry a numeric percentage remaining.
- **FR-004**: For Claude the system MUST show only the weekly window with its time to reset; for other providers it MUST show the window with the highest used percentage and a shortened label.
- **FR-005**: The system MUST open a hover card with, per provider, icon, name, plan (marked stale when so) and, per window, label, percentage, progress bar and reset text.
- **FR-006**: Bar colour MUST be accent below 70%, warning from 70%, danger from 90%.
- **FR-007**: The system MUST refresh at start, every 120 seconds, and on hover (not more than once per 30 seconds, never concurrently).
- **FR-008**: On failure the system MUST display the first 90 characters of the error in red in the bar and clear it after a successful refresh.
- **FR-009**: The system MUST show "No data yet" in the card when no provider qualifies.
- **FR-010**: The usage section MUST NOT block the rest of the status bar while fetching.

### Key Entities

- **Provider**: an AI tool (claude, codex, copilot, gemini, agy) with a plan name, a freshness state and a set of windows.
- **Usage window**: a quota period of a provider (e.g. weekly) with label, kind, percentage used and reset time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sees their Claude weekly usage and time to reset without any click.
- **SC-002**: Any window's exact usage and reset time is reachable in one hover.
- **SC-003**: Figures are at most about 2 minutes old without action; a hover brings them up to date within a few seconds when older than 30 seconds.
- **SC-004**: A missing or failing data source always produces a visible message, never a blank or frozen bar.

## Assumptions

- `quota-axi` is installed and on the login-shell PATH; installing it is outside this feature.
- The user is signed in to the providers they want shown.
- The usage figures are only as accurate as `quota-axi` reports them.
- Provider list is fixed (claude, codex, copilot, gemini, agy); icons for them ship with the app.

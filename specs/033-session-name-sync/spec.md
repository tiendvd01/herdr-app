# Feature Specification: One session name in agents, tabs and Sessions

**Feature Branch**: `033-session-name-sync`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: User description: "Đồng bộ tên session ở agents, ở tab, ở session manager luôn"

## Context

Today one Claude session can carry three different names on screen:

- **Agents sidebar** (`my-agents`): the session's saved title from its transcript (title set with `/rename`, else Claude's own short title, else the first message), even over a tab name the user chose.
- **Tab bar** (`my-tabs`, spec 032): a chosen tab name, else the live terminal title.
- **Sessions dialog** (`processes`): the raw terminal title (status glyph included), with the stored tab name ("Claude Code") underneath.

The live terminal title lags the transcript (it is not set until Claude has answered, and does not follow a `/rename` the same way), so the three disagree for a while or for good.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The same name everywhere (Priority: P1)

A user has three Claude sessions open. Each session is called by one name, and the agents sidebar, the tab bar and the Sessions dialog all show that same name for it.

**Why this priority**: this is the whole request; two names for one session make the user stop and match them up.

**Independent Test**: open two Claude tabs on different tasks, then open the Sessions dialog; for each session the sidebar row, the tab label and the dialog row read the same text.

**Acceptance Scenarios**:

1. **Given** a session whose saved title is "Fix login", **Then** the sidebar, the tab bar and the Sessions dialog all show "Fix login".
2. **Given** a session renamed with `/rename "Auth refactor"`, **When** a few seconds pass, **Then** all three places show "Auth refactor".
3. **Given** a brand new session with no title and no message yet, **Then** all three show the same fallback ("Claude Code").

---

### User Story 2 - A name the user chose wins everywhere (Priority: P1)

A user renames a Claude tab to "review PR 12". The sidebar row and the Sessions dialog show "review PR 12" too, not the session's own title. Renaming the tab back to empty returns all three to the session's title.

**Why this priority**: a chosen name is the strongest signal of what the user wants to call the work; the sidebar ignoring it today is one of the mismatches.

**Independent Test**: rename a Claude tab; all three places show the chosen name; clear it; all three show the session title again.

**Acceptance Scenarios**:

1. **Given** a tab renamed to "review PR 12", **Then** sidebar, tab bar and Sessions dialog show "review PR 12".
2. **Given** that tab renamed to "", **Then** all three show the session's title.

---

### User Story 3 - The Sessions dialog says where, not the name again (Priority: P2)

In the Sessions dialog the second line under the name shows the space only.

**Why this priority**: today the line reads "space › Claude Code", which is noise next to a real name.

**Independent Test**: open Sessions with an unnamed Claude tab; the second line shows the space only.

**Acceptance Scenarios**:

1. **Given** a Claude tab with no chosen name in space "herdr-app", **Then** the second line reads "herdr-app".

### Edge Cases

- Title starts with a status glyph or spinner ("✳ Fix login"): only the words show, in all three places.
- Session is on another machine (no local transcript): the name falls back to the live terminal title, the same in all three places.
- A tab started from Threads gets the thread's title as its name; that counts as an automatic name, so it follows the session when the session is renamed later.
- Tab with a shell pane beside Claude: the name comes from the Claude pane.
- Several agents with the same name in one space: the sidebar keeps its current way of telling them apart; this feature does not change it.
- Non-Claude agents: they have no transcript title; they follow the chosen-name / terminal-title part of the rule, as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: There MUST be one rule that gives a session's display name, and the agents sidebar, the tab bar and the Sessions dialog MUST all use it.
- **FR-002**: The rule's order MUST be: a tab name the user chose; else the session's title set by rename; else Claude's own title for the session; else the live terminal title if telling (spec 032 meaning); else the session's first message; else the program name.
- **FR-003**: A tab name counts as chosen unless it is empty, the agent program's own name, or the name the app gave the tab when it opened it from a thread.
- **FR-004**: The session's saved titles MUST be read once per session in one place and shared, not read separately by each of the three screens.
- **FR-005**: A change of the session's title MUST show in all three places within the same refresh.
- **FR-006**: Leading glyphs and spaces MUST be removed from any title before it is shown.
- **FR-007**: The feature MUST NOT change any stored tab name; it only changes what is displayed.
- **FR-008**: The Sessions dialog's second line MUST show the space only (a chosen tab name is already the name shown; an automatic one adds nothing).

### Key Entities

- **Session**: one running Claude agent in a terminal; has a transcript with optional rename title, Claude's title and messages.
- **Tab**: holds the session; has a stored name that is chosen or automatic.
- **Session name**: the one display text derived by the rule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every running Claude session, the sidebar, tab bar and Sessions dialog show identical text (0 mismatches across 3+ sessions).
- **SC-002**: After `/rename`, all three places show the new name within 5 seconds.
- **SC-003**: 0 cases where a hand-chosen tab name is replaced in any of the three places.
- **SC-004**: Each session's transcript is read at most once per refresh round, however many screens show it.

## Assumptions

- "Session manager" means the Sessions dialog (`processes` mod, opened from the status bar's proc badge).
- The Threads panel lists saved conversations, not live sessions; it already uses the transcript title and stays as is.
- Chosen tab name wins over the session title everywhere (as in the tab bar today); the sidebar's current habit of preferring the transcript title over a chosen name is dropped.
- A thread-opened tab's name is treated as automatic because it was copied from the session's title, not typed by the user.
- Display-only, like spec 032: `hc ls` and other tools that print stored tab names are unchanged.
- Refresh cadence stays at the existing few-second polls; no new watcher is added.

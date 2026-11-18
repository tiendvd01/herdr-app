# Feature Specification: Claude tab named after its session title

**Feature Branch**: `032-claude-tab-title`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Làm chức năng rename tên của claude code theo title của session luôn nhé, thay vì tên tab sau khi chạy vẫn luôn để claude code"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tab bar shows what the Claude session is about (Priority: P1)

A user starts Claude Code from the + menu. The tab is labelled "Claude Code". Once the session has a title (Claude Code gives the conversation a short title such as "LLM trong flow Phân tích"), the tab in the tab bar shows that title instead of "Claude Code", and follows it when the title changes.

**Why this priority**: with several Claude tabs open, every tab reads "Claude Code" and the user cannot tell them apart without clicking each one. This is the whole request.

**Independent Test**: open two Claude tabs, give each a different task; after each answers, the tab bar shows two different titles, each matching its session.

**Acceptance Scenarios**:

1. **Given** a tab started as "Claude Code", **When** the session sets its title "Fix login", **Then** the tab bar shows "Fix login".
2. **Given** the tab shows "Fix login", **When** the session title changes to "Fix login redirect", **Then** the tab bar shows the new title.
3. **Given** a Claude tab whose session has no telling title yet (only the program name, a folder path or a host), **Then** the tab still shows "Claude Code".

---

### User Story 2 - A name the user chose is never overwritten (Priority: P1)

A user renames a Claude tab by hand ("review PR 12"). The tab keeps that name whatever the session title becomes. Renaming to empty goes back to following the session title.

**Why this priority**: an automatic label that fights a manual one makes renaming useless.

**Independent Test**: rename a Claude tab, let the session keep working; the tab keeps the chosen name.

**Acceptance Scenarios**:

1. **Given** a Claude tab renamed to "review PR 12", **When** the session title changes, **Then** the tab still shows "review PR 12".
2. **Given** that tab is renamed to "" (back to default), **Then** it shows the session title again.

---

### User Story 3 - Tab bar and sidebar agree (Priority: P2)

The agents list in the left sidebar already shows a Claude tab by its session title. The tab bar and the sidebar use the same rule, so one tab never has two different names on screen.

**Why this priority**: consistency; two different labels for the same tab is confusing.

**Independent Test**: for every Claude tab, the label in the tab bar equals the label in the sidebar's agent row.

**Acceptance Scenarios**:

1. **Given** any tab with a Claude session, **Then** its tab bar label and its sidebar label are the same text.

### Edge Cases

- Title starts with a status glyph or spinner (e.g. "✳ Fix login"): the glyph is dropped, only the words show.
- Long title: cut with an ellipsis at the tab's existing maximum width, full text not needed.
- Tab with several panes: the label comes from the pane running the agent, not the focused shell beside it.
- Session ends and the shell returns: the label follows the remaining pane's facts the same way it did before this feature (program name / tab name).
- Tabs started from Threads (named after the thread) or from other places with a chosen name: those names count as chosen and stay.
- Other agents (not Claude) whose tab is named after the program follow the same rule; no agent-specific special case.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tab bar MUST show a tab's live session title when the tab's name is the agent program's own name (as given at launch, e.g. "Claude Code") or the tab has no name, and the session has a telling title.
- **FR-002**: A title is telling only when it is non-empty after removing leading non-letter/non-digit characters, differs from the program's name and key, and is not a folder path or a `user@host` string.
- **FR-003**: Any other tab name (chosen by the user or by the place that opened the tab) MUST be shown unchanged.
- **FR-004**: The label MUST update when the session title changes, without user action.
- **FR-005**: The tab bar and the sidebar agents list MUST derive the label from one shared rule.
- **FR-006**: The feature MUST NOT change the tab's stored name; it only changes what is displayed, so renaming and "rename to empty" keep their current meaning.

### Key Entities

- **Tab**: has a name (possibly the program's name or none) and one or more panes.
- **Lead pane**: the pane of the tab running an agent, else the focused one, else the first; it carries the program and the live title.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With 3 Claude tabs on different tasks, all 3 tab labels are distinct and each matches its session title.
- **SC-002**: A title change shows in the tab bar within 2 seconds.
- **SC-003**: 0 cases where a hand-chosen tab name is replaced.
- **SC-004**: For every tab, tab bar label equals sidebar label.

## Assumptions

- Display-only (FR-006) is chosen over actually renaming the tab: it follows title changes live, never fights a manual rename, and needs no bookkeeping of which names were automatic. Trade-off: shell tools that print the stored tab name (`hc ls` "where") still say "Claude Code".
- Claude Code already sets the terminal title to the session's title; no change to how Claude is launched is needed.
- The sidebar's current rule (`my-agents`) is the reference behaviour; the tab bar adopts it.

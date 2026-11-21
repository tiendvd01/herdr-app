# Feature Specification: Open a skill in Zed

**Feature Branch**: `036-open-skill-in-zed`

**Created**: 2026-11-19

**Status**: Implemented

**Input**: User description: "Làm chức năng mở skills ở trong zed luôn cho nhanh"

## Context

Project Settings › Skills lists every skill (Herdr's library, the project's sources, hidden ones, global ones) and every MCP server, but only by name and description. To read what a skill actually says, the user has to find its folder by hand. The user wants one click from the row to the skill's files in Zed, the editor they already use (the Sources block's Open and the Memory tab's Open folder already go to Zed).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a skill from its row (Priority: P1)

Each skill row in the Skills tab has an Open button. Clicking it opens that skill's folder in Zed with its SKILL.md shown, so the user can read the instructions and the files next to it (references, scripts).

**Why this priority**: it is the whole request.

**Independent Test**: click Open on any skill row: Zed comes up with that skill's folder in its file tree and SKILL.md open.

**Acceptance Scenarios**:

1. **Given** a skill from any source (Herdr's library or a project source), **When** the user clicks its Open, **Then** Zed shows the skill's folder with SKILL.md open.
2. **Given** a skill listed as hidden (same name in an earlier source), **When** the user clicks Open, **Then** the hidden copy (the one in that row) opens, not the winning one.
3. **Given** a global skill row, **When** the user clicks Open, **Then** that global skill opens the same way.
4. **Given** an MCP server row, **When** the user clicks Open, **Then** its config file opens in Zed.
5. **Given** an invalid skill with no SKILL.md, **When** the user clicks Open, **Then** its folder opens (there is no file to show).
6. **Given** the click, **Then** the skill's on/off switch does not change.

### Edge Cases

- Zed's command line tool is not available: Zed is opened as an app with the same folder; with no Zed at all, the folder opens in Finder.
- The dialog stays open after the click, so the user can open several skills in a row.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every skill row (skills, hidden, global) MUST have an Open control that opens the skill's folder in Zed with its SKILL.md open when it exists.
- **FR-002**: Every MCP server row MUST have an Open control that opens its config file in Zed.
- **FR-003**: Open MUST NOT change any selection or the project's saved settings.
- **FR-004**: When Zed cannot be started from the command line, the system MUST fall back to opening Zed as an app, then to Finder.
- **FR-005**: Herdr MUST only open files; it never writes into a skill folder.

## Success Criteria *(mandatory)*

- **SC-001**: From the Skills tab, a skill's instructions are on screen in one click (today: find the folder by hand).
- **SC-002**: Every listed skill and MCP server row can be opened (100% of rows).

## Assumptions

- Zed is the user's editor; no setting to pick another one.
- Opening the folder (not only the file) is wanted, so the files around SKILL.md are one click away in Zed's tree.

# Feature Specification: Ports Tool for Claude (MCP)

**Feature Branch**: `014-ports-mcp` (no branch created)

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Thiết kế cái mcp trong project này để tạo cái tool để get thông tin ports ở trong project settings theo từng project"

> Context: Project Settings › Ports (spec 010) shows, for one git project, every listening TCP port grouped by worktree, with the command, pid and folder behind it. Only a person looking at the page can see this. A Claude session working in a repo often needs the same facts ("which port is the backend of this worktree on?", "is 3000 already taken, and by what?") and today has to guess or run `lsof` by hand. This feature gives Claude a tool that returns that same information for a project. It ships as an MCP server kept in this repo's MCP library (`mcp/`, spec 012/013), so it is turned on per project from Project Settings › Skills like any other server.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Claude lists the ports of the project it is working in (Priority: P1)

In a Claude session started for a project, the user asks "which ports are my servers on?". Claude calls the tool with no argument and gets, for the project of its working folder, each worktree (branch, main marker, path) and the ports listening in it, with command, pid and folder — the same content as the Ports tab.

**Why this priority**: it is the request: Ports information per project, available to Claude.

**Independent Test**: start a dev server in the main checkout and another in a worktree of the same repo; in a Claude session in that repo, call the tool with no argument and compare the result with Project Settings › Ports for that project.

**Acceptance Scenarios**:

1. **Given** a session whose working folder is inside a git repository, **When** the tool is called without a project, **Then** it returns that repository's worktrees (main first, then by branch) and, under each, its listening ports in ascending order.
2. **Given** a listener whose working folder is inside a worktree or one of its sub-folders, **Then** it is listed under that worktree; with nested worktrees the deepest match wins; listeners outside every worktree of the project are not returned.
3. **Given** a listener, **Then** its entry has port, pid, command with arguments (home path shortened to `~`), and folder relative to the worktree (`./` at its root).
4. **Given** a worktree with no listener, **Then** it is still returned with an empty port list.
5. **Given** the result, **Then** it states the total number of ports and worktrees, matching the Ports tab header for the same moment.

---

### User Story 2 - Ask about another project or a single port (Priority: P2)

Claude can name another project (by its folder, or by the name shown in Project Settings) and get that project's ports, or ask about one port number and learn whether it is free and, if not, which project, worktree and process holds it.

**Why this priority**: avoids port clashes between projects and worktrees, the main pain the Ports tab solves.

**Independent Test**: with a server on port 5173 in project A, from a session in project B ask about port 5173 and get project A, its worktree, command and pid; ask about an unused port and get "free".

**Acceptance Scenarios**:

1. **Given** a project folder (any path inside the repository), **When** the tool is called with it, **Then** it returns that project's ports as in Story 1.
2. **Given** a project name that matches exactly one git project known to Herdr's Project Settings, **Then** it is used; a name matching none or several returns an error listing the known names.
3. **Given** a port number, **When** the port lookup is called, **Then** it returns either "free" or the holder: project (if inside a git repository), worktree, folder, command and pid; a listener outside any repository is still reported, with no project.
4. **Given** a folder that is not inside a git repository, **Then** the tool returns a clear error, not an empty list.

---

### User Story 3 - Turn it on per project (Priority: P2)

The tool appears in Project Settings › Skills as an MCP server of the library, off by default; the user turns it on for the projects that need it, and it then loads in their `Claude · N skills` sessions.

**Why this priority**: keeps the global set small (the reason for specs 012/013).

**Independent Test**: turn it on for one repo, start `Claude · N skills` there and see the tool; start the same in another repo where it is off and see no tool.

**Acceptance Scenarios**:

1. **Given** the MCP library, **Then** the ports server is listed in the Skills tab with a short description.
2. **Given** it is on for a project, **When** a session is started from the + menu, **Then** the tool is available; when off, it is not.

---

### User Story 4 - Know which Herdr terminal runs a server (Priority: P3)

When a listener runs in a Herdr terminal, its entry names that terminal (its space and tab), so Claude can tell the user where the server is running.

**Why this priority**: helpful context; the Ports tab offers the same as a Terminal button.

**Independent Test**: start a server in a Herdr terminal and one in an outside terminal app; the first entry names the Herdr space and tab, the second has none.

**Acceptance Scenarios**:

1. **Given** a listener in a Herdr terminal, **Then** its entry includes the terminal's space and tab names.
2. **Given** a listener started elsewhere, **Then** no terminal is given and nothing fails.

### Edge Cases

- No listening ports at all: worktrees are returned with empty lists and a total of 0.
- A process listens on several ports: one entry per port; the same pid and port pair never appears twice.
- A process ends between discovery and detail lookup: it is skipped, not reported half-filled.
- Process details the user may not see (another user's process): the port is reported with what is known, missing fields marked as unknown.
- The tool is called many times in a row: each call reflects the moment it is made; there is no stale cache.
- IPv4 and IPv6 listeners on the same port by the same process count once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a tool returning, for one git project, its worktrees (branch or "(detached)", main marker, path) and the TCP ports listening in each, with the same grouping rules as Project Settings › Ports (deepest worktree match, listeners outside the project omitted, ports ascending, worktrees main first then by branch).
- **FR-002**: Each port entry MUST include port number, pid, command with arguments (home shortened to `~`) and folder relative to the worktree.
- **FR-003**: Without a project argument, the tool MUST use the project of the session's working folder; with one, it MUST accept a folder inside the repository or a project name known to Project Settings.
- **FR-004**: The system MUST provide a port lookup that reports a given port as free or names its holder (project if any, worktree, folder, command, pid).
- **FR-005**: The tools MUST be read-only: they MUST NOT stop, start or signal any process and MUST NOT change any file.
- **FR-006**: Errors (not a git repository, unknown or ambiguous project name, port out of range 1–65535) MUST return a clear message instead of an empty result.
- **FR-007**: The server MUST live in this repository and be registered in the MCP library (`mcp/`), so it is turned on per project from Project Settings › Skills; it MUST NOT be added to the global set.
- **FR-008**: When a listener runs in a Herdr terminal, its entry SHOULD name that terminal's space and tab; when unknown, the field is omitted.
- **FR-009**: The Ports tab and the tool MUST agree: for the same project at the same moment they list the same worktrees and ports.
- **FR-010**: The behaviour MUST be noted in `CLAUDE.md` (constitution VI).

### Key Entities

- **Project**: a git repository (all its worktrees), named as in Project Settings.
- **Worktree**: branch or detached, main marker, path; holds zero or more listeners.
- **Listener**: port, pid, command, folder (absolute and relative to the worktree), optional Herdr terminal (space, tab).
- **Port lookup result**: "free", or one or more holders (a port can be bound by several processes) each with project (optional), worktree, folder, command, pid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For the same project and moment, the tool and the Ports tab list 100% the same worktrees and ports.
- **SC-002**: A call returns in under 2 seconds on a machine with up to 50 listening ports.
- **SC-003**: Asking "what is on port N" is answered in one tool call, without the user or Claude running any command.
- **SC-004**: With the server turned off for a project, sessions of that project carry 0 extra tools.
- **SC-005**: No call ever stops a process or changes a file (read-only), verified by running every tool against live servers and checking they still run.

## Assumptions

- Local machine only; remote Herdr machines are out of scope.
- Read-only by design: stopping a port stays a Project Settings action (Stop button), because a tool that kills processes is too easy to trigger by mistake.
- Project names come from the projects Herdr knows (the per-project folders Project Settings keeps); a folder path always works even for a project Herdr has not seen.
- The "Herdr terminal" link uses what Herdr's terminal list exposes; if it cannot be determined, the field is left out (Story 4 is optional to the MVP).
- The server is plain code kept in this repo with no build step, matching the repo's no-build rule; it needs nothing installed beyond what the Ports tab already uses.

# Feature Specification: Skill folders per project

**Feature Branch**: `035-project-skill-sources`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: User description: "Quản lí thư mục skill theo từng project luôn thay vì chung"

## Context

Spec 034 added skill source folders, but as one list shared by every project (`skill-sources.json`). So the SoraTech set (`~/Documents/SoraTech/skills-set`, 43 skills) shows up in the Skills tab of every project, including `herdr-app` and `fastapi-example`, which never use it. The user wants each project to have its own list of skill folders.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Each project lists only its own folders (Priority: P1)

In Project Settings › Skills, the Sources block belongs to the selected project. Adding a folder adds it to this project only; other projects do not see its skills. Herdr's own library stays available to every project.

**Why this priority**: it is the whole request.

**Independent Test**: add a folder to project A, open project B: B's Sources block and skill list do not contain it; A's do.

**Acceptance Scenarios**:

1. **Given** project A has source S and project B does not, **When** the user opens B's Skills tab, **Then** neither S nor its skills are listed.
2. **Given** the user adds a folder while project A is selected, **Then** only A's list changes.
3. **Given** the user removes S from A, **Then** A's skills from S are no longer attached to A's new sessions, and the message says how many of A's turned-on skills came from S.
4. **Given** any project, **Then** Herdr's own library is listed first and cannot be removed.
5. **Given** a worktree of project A, **Then** it uses A's folders (a worktree is the same project, as before).

---

### User Story 2 - Today's setup carries over (Priority: P1)

The shared list from spec 034 is turned into per-project lists without the user doing anything: each project that has a skill from a shared folder turned on gets that folder; the others get none. The shared list then goes away.

**Why this priority**: without it, 167 and 168 would lose all their team skills.

**Independent Test**: after the change, 167 and 168 list `~/Documents/SoraTech/skills-set` and keep every skill on; `herdr-app` and `fastapi-example` list no extra folder; the shared list file is gone.

**Acceptance Scenarios**:

1. **Given** the shared list holds `skills-set` and 167/168 have its skills on, **When** the carry-over runs, **Then** 167 and 168 each list it, with the same skills on as before.
2. **Given** `herdr-app` has only ponytail on, **Then** it gets no extra folder.
3. **Given** the carry-over already ran, **When** it runs again, **Then** nothing changes.

### Edge Cases

- A project with no saved settings yet: no extra folders, only Herdr's own library.
- The same folder in several projects: allowed; each project keeps its own entry.
- Two of a project's folders have a skill with the same name: the earlier folder wins in that project (same rule as spec 034, now per project).
- Saving a turned-on switch must not drop the project's folder list, and adding a folder must not drop its switches.
- The settings file changed elsewhere since it was read: the save is refused and the tab reloads, as for switches today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each project MUST keep its own ordered list of extra skill folders, saved with its other skill settings.
- **FR-002**: A project's Skills tab, launch path and enabled count MUST use only Herdr's own library plus that project's folders.
- **FR-003**: Adding or removing a folder MUST change only the selected project; the add checks of spec 034 (existing folder, not already listed in this project, not inside Herdr's own library) apply per project.
- **FR-004**: Removing a folder MUST report how many of this project's turned-on skills it provided.
- **FR-005**: A save of switches MUST keep the folder list, and a save of the folder list MUST keep the switches.
- **FR-006**: The shared list of spec 034 MUST be carried over once: each project gets every shared folder that provides at least one of its turned-on skills; then the shared list is removed.
- **FR-007**: The move script of spec 034, if rerun, MUST add the target folder to the projects that use its skills instead of to a shared list.

### Key Entities

- **Project skill settings**: per project, the turned-on skills and MCP servers (as before) plus the ordered list of extra skill folders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the change, `herdr-app` and `fastapi-example` list 0 SoraTech skills; 167 and 168 list all 43.
- **SC-002**: For every project, the turned-on skills before and after are identical.
- **SC-003**: Adding a folder to one project changes the skill list of exactly one project.

## Assumptions

- Project skill settings stay in the untracked per-project area (`projects/<slug>/`), like the switches; the tracked shared list file is removed.
- Herdr's own library (`.agents/skills/`) stays common to all projects.
- MCP server configs stay common (`mcp/`), unchanged.

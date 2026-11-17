# Feature Specification: Project skills for Claude started in the main checkout

**Feature Branch**: `027-main-repo-skills`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Fix lỗi claude ở repo gốc lại không đọc được bộ skill, chỉ worktree đọc được, thêm test cho chỗ này"

## Observed problem

A project has skills and MCP servers turned on in Project Settings › Skills. Claude started in one of
the project's worktrees gets them (its process runs with the project's shared skills folder). Claude
started in the main checkout of the same project often starts plain: on 2026-11-17 three Claude tabs in
the main checkouts of `167-yahagi-sekisan` and `168-yahagi-panwall` ran without the folder, while the
worktree tab of `167-yahagi-sekisan` had it.

Claude in a main checkout is started from the + menu (cmd-n). The menu decides "with skills or plain"
from the project and skill count it looks up after it opens; picking Claude before that lookup has
finished (cmd-n then a digit typed quickly, or a digit typed before the agent list arrived) starts Claude
plain. A new worktree's Claude is started through the shared launch decision, made at the moment of the
launch, so it never has this gap.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Claude in the main checkout gets the project's skills (Priority: P1)

The user opens the + menu in a space whose folder is the main checkout of a project with skills on and
picks Claude, by click or by digit, however fast. Claude starts with the project's skills and MCP servers.

**Why this priority**: this is the bug; the main checkout is where most sessions start.

**Independent Test**: in a main checkout with skills on, press cmd-n then 1 at once; the new Claude's
command line names the project's skills folder and `/skills` lists the project skills.

**Acceptance Scenarios**:

1. **Given** a project with skills on and a space in its main checkout, **When** the user presses cmd-n and then the Claude digit immediately, **Then** Claude starts with the project's skills folder.
2. **Given** the same, **When** the user clicks the Claude row, **Then** Claude starts with the project's skills folder.
3. **Given** a digit typed before the agent list has loaded, **When** the list arrives and Claude is started, **Then** Claude starts with the project's skills folder.
4. **Given** a project with nothing turned on, **When** the user starts Claude, **Then** Claude starts plain with no warning and nothing is written.

---

### User Story 2 - Main checkout and worktree behave the same (Priority: P1)

Whatever folder of a project Claude is started in (main checkout, a subfolder of it, or a worktree), the
same set of skills is attached, and an automated test proves it.

**Why this priority**: the user asked for a test so this does not break again.

**Independent Test**: run the unit tests; a test starts Claude for a main checkout, a subfolder and a
worktree of one project and checks all three get the same skills folder.

**Acceptance Scenarios**:

1. **Given** one project with a skill on, **When** the launch is asked for its main checkout, a subfolder and a worktree, **Then** all three answers carry the same project skills folder.
2. **Given** the + menu's Claude launch, **When** the menu has not finished its own lookup, **Then** the launch still asks the shared decision and gets the skills folder (tested without the screen).

### Edge Cases

- Selected skills that are missing or invalid in the library: skipped with one warning; if nothing valid is left Claude starts plain (unchanged).
- A folder outside git, a remote machine, or another agent: started plain as today.
- The lookup fails (git or file error): Claude still starts, plain, with one warning (same as other launch places).
- The menu is closed while the launch is being prepared: the tab must still open (the popup stays open until the command line is ready, as today).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Starting Claude from the + menu MUST decide "with skills or plain" at the moment of the launch, from the space's current folder, not from a count gathered when the menu opened.
- **FR-002**: The + menu MUST use the same launch decision as the other places that start Claude in a folder (New worktree, git graph, reviewer Ask), so main checkout and worktree cannot differ.
- **FR-003**: A digit typed before the menu has finished loading MUST lead to the same result as a click made after loading.
- **FR-004**: The + menu's Claude row MAY still show how many items are on; that count MUST NOT decide the launch.
- **FR-005**: Other agents and the Terminal / btop rows MUST start exactly as today.
- **FR-006**: Unit tests MUST cover: main checkout, subfolder and worktree of one project giving the same skills folder; and the menu's launch step asking the shared decision even before its own lookup has finished.

### Key Entities

- **Project**: a git repository shared by its main checkout and worktrees; owns one selection and one shared skills folder.
- **Launch decision**: given an agent, a folder and a machine, the command line to start (with the skills folder or plain).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 10 out of 10 Claude starts from the + menu in a main checkout with skills on (fast keyboard and click) carry the project's skills folder.
- **SC-002**: A main checkout and a worktree of the same project always start Claude with the same skills folder.
- **SC-003**: The unit test suite includes the new cases and passes; a menu launch step that ignores the shared decision (the old behaviour) makes the menu test fail.

## Assumptions

- The cause is the + menu's early-launch gap described above; the shared decision itself (`projectOf` + selection) already handles a main checkout correctly, which the new tests confirm.
- Claude sessions already running plain are not restarted; the user starts new ones.
- The + menu keeps its popup open until the command line is ready, as the current with-skills path does.

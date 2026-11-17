# Feature Specification: Project skills in worktrees

**Feature Branch**: `023-worktree-project-skills`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Update cho worktree cũng dùng được các skills đã config trong project" (worktrees should also get the skills configured for their project)

## Context

Project Settings › Skills turns skills and MCP servers on per git project (specs 012, 013, 015). A worktree is a second checkout of the same project, so a Claude session started in a worktree should carry the same set as one started in the main checkout. Today only one entry point (the + menu's `Claude · N skills` row) attaches the project's set; the other ways Herdr starts Claude, and in particular the New worktree flow, start a plain Claude with nothing on, so working in a worktree silently loses the project's skills.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Claude in an existing worktree has the project's skills (Priority: P1)

The user has turned skills on for project X in Project Settings. They switch to a space that is a worktree of X and start Claude from the + menu. The session has exactly the skills and MCP servers that a session in X's main checkout has.

**Why this priority**: This is the core promise: one configuration per project, wherever the work happens.

**Independent Test**: Turn two skills on for a project, open a worktree space of it, start Claude from the + menu, and ask Claude to list its skills: both appear under the project's name.

**Acceptance Scenarios**:

1. **Given** project X has 2 skills and 1 MCP server on, **When** the user opens the + menu in a worktree space of X, **Then** the Claude row reads `Claude · 3 skills` (same count as in the main checkout).
2. **Given** the same setup, **When** the user starts Claude from that row, **Then** the session lists the same 2 skills and 1 MCP server as a session started in X's main checkout.
3. **Given** project X has nothing on, **When** the user opens the + menu in a worktree of X, **Then** the row reads `Project skills…` and opens Project Settings on project X (not on a separate "worktree project").

---

### User Story 2 - A new worktree can start straight into Claude with the project's skills (Priority: P1)

From the New worktree dialog the user creates a worktree for a branch and wants to start working with Claude right away. The dialog offers to start Claude in the new worktree, and that Claude carries the project's skills.

**Why this priority**: Creating a worktree to hand work to an agent is the main reason worktrees are made here; today the user must open the + menu again in the new space.

**Independent Test**: With skills on for a project, create a new worktree from the dialog with the "start Claude" choice on; the new space opens with a Claude tab whose skill list matches the project.

**Acceptance Scenarios**:

1. **Given** project X has skills on, **When** the user creates a worktree with "start Claude" chosen, **Then** the new space opens with one Claude tab that has the project's skills and MCP servers.
2. **Given** project X has nothing on, **When** the user creates a worktree with "start Claude" chosen, **Then** a plain Claude tab is started (no error, no empty skill folder passed).
3. **Given** the user does not choose "start Claude", **When** the worktree is created, **Then** the new space opens as it does today.
4. **Given** the project's post-create setup script exists, **When** a worktree is created with "start Claude", **Then** the setup script still runs once in the new worktree as today.

---

### User Story 3 - Other Herdr entry points that start Claude in a worktree carry the project's skills (Priority: P2)

Herdr has other places that start Claude in a folder: the git graph's "New Claude tab" on a checkout row, and the Changes reviewer's "Ask" that starts an agent with a question. When these start Claude inside a worktree (or the main checkout) of a project with skills on, the session gets the project's set too.

**Why this priority**: Consistency; without it the user cannot trust which sessions have skills, but these paths are used less often than the + menu and New worktree.

**Independent Test**: In a worktree of a project with skills on, start Claude from the git graph row menu and from the reviewer's Ask; both sessions list the project's skills.

**Acceptance Scenarios**:

1. **Given** project X has skills on, **When** the user picks "New Claude tab" on a worktree row in the git graph, **Then** the Claude tab has X's skills.
2. **Given** project X has skills on and the focused space is a worktree of X, **When** the reviewer's Ask starts Claude, **Then** that session has X's skills and still receives the question.
3. **Given** the agent these entry points pick is not Claude (another agent is the first installed), **When** they start it, **Then** it starts unchanged (skills apply only to Claude).

---

### User Story 4 - A change of project skills reaches worktree sessions (Priority: P3)

The user turns a skill on or off in Project Settings while viewing a worktree, or while sessions are running in several worktrees of the project. The change applies to the one project set shared by the main checkout and every worktree.

**Why this priority**: Already true by design (one shared set per project, spec 013); this story guards against regressions where a worktree would get its own separate set.

**Independent Test**: Open Project Settings from a worktree, turn a skill on, then start Claude in the main checkout: the skill is there.

**Acceptance Scenarios**:

1. **Given** Project Settings is opened from a worktree of X, **When** it opens, **Then** it shows project X with X's current selection.
2. **Given** the user turns a skill on there, **When** they later start Claude in X's main checkout or any other worktree of X, **Then** the skill is present.

### Edge Cases

- A worktree whose main checkout folder has been moved or deleted: the worktree still resolves to its project as long as git can find the shared repository; otherwise Claude starts plain and the user is told the project could not be found.
- A folder that is not in a git repository: entry points start Claude plain, as today.
- A worktree on a remote machine (space with a machine): project skills are not attached (the skill library lives on this machine), Claude starts plain, as the + menu does today.
- Two projects with the same folder name in different places: each keeps its own selection (projects are told apart by their full location, not their name).
- A selected skill that has been removed from the library: it is skipped and reported as today, the rest still load.
- Starting several Claude sessions in different worktrees of one project at about the same time: all get the same set; none fails because another is refreshing the shared set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A worktree MUST resolve to the same project as its main checkout everywhere project skills are read or edited (the + menu, Project Settings, and every entry point below), so there is exactly one skill selection per project.
- **FR-002**: The + menu in a worktree space MUST show the same skill count and start Claude with the same skills and MCP servers as in the project's main checkout.
- **FR-003**: The New worktree dialog MUST let the user choose to start Claude in the new worktree; when chosen, the new space MUST open with a Claude tab carrying the project's skills and MCP servers, or a plain Claude tab when the project has nothing on.
- **FR-004**: The New worktree dialog's "start Claude" choice MUST be remembered between uses of the dialog, and MUST be hidden or disabled when Claude is not installed.
- **FR-005**: The git graph's "New Claude tab" action and the Changes reviewer's Ask MUST start Claude with the project's skills and MCP servers when the target folder belongs to a git project with any of them on.
- **FR-006**: Entry points MUST leave non-Claude agents unchanged.
- **FR-007**: Before each such Claude start, the project's shared skill set MUST be brought up to date with the current selection (the same refresh the + menu does), so a worktree session never starts with a stale set.
- **FR-008**: When the project's set cannot be prepared (project not found, refresh failed), Claude MUST still start, plain, and the user MUST get one notification saying skills were not attached and why.
- **FR-009**: Nothing in this feature may write into the user's project folders or worktrees, the skill library, the MCP library, or the user's global Claude settings (same invariant as specs 012–015).
- **FR-010**: Behaviour for spaces on remote machines and for folders outside git MUST stay as today (plain Claude).
- **FR-011**: CLAUDE.md's Per-project Claude skills section MUST state that worktrees share their project's skills and list the entry points that attach them.

### Key Entities

- **Project**: a git repository, identified by its shared repository location; owns one skill selection and one shared skill set. Its main checkout and all worktrees map to it.
- **Worktree**: an additional checkout of a project in its own folder; has no selection of its own.
- **Skill selection**: the skills and MCP servers turned on for a project in Project Settings.
- **Claude entry point**: a place in Herdr that starts a Claude session in a folder (+ menu, New worktree dialog, git graph row action, reviewer Ask).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a worktree of a project with skills on, 100% of Claude sessions started from the four entry points list the same skills and MCP servers as a session started from the + menu in the main checkout.
- **SC-002**: From the New worktree dialog, the user goes from "create" to a Claude session with the project's skills in one action, with no extra menu step.
- **SC-003**: A skill toggled in Project Settings from any checkout of a project is present in the next Claude session started in any other checkout of that project.
- **SC-004**: No files appear or change inside the user's project folders, worktrees, the skill/MCP libraries or the global Claude settings after using any entry point.
- **SC-005**: When skills cannot be attached, the user still gets a working Claude session within the usual start time and sees exactly one explanation.

## Assumptions

- "Skills configured in the project" means the selection made in Project Settings › Skills (skills and MCP servers), shared per git project since spec 013; no new per-worktree selection is wanted.
- Worktrees are those made by `git worktree` (including Herdr's New worktree dialog under `~/.herdr/worktrees/`), not separate clones; a separate clone of the same remote is a different project.
- Claude typed by hand in a terminal (`claude` with no Herdr entry point) is out of scope: attaching skills there would mean writing into the project or the global Claude settings, which FR-009 forbids.
- Sessions already running are not restarted; they pick up changes the way spec 013 already allows (shared set updated in place).
- Herdr's shipped mods (shipped `worktree`, `new-menu`, `menu`) are not changed; only personal mods and the vendored git graph/reviewer are, per the constitution.
- The "start Claude" choice defaults to on the first time the dialog is used.

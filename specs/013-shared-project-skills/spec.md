# Feature Specification: One Shared Skills Folder per Project

**Feature Branch**: `013-shared-project-skills` (no branch created)

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Làm cơ chế đẩy skill đơn giản hơn, thay vì mỗi lần mở session mới và symlinks per sessions thì chỉ cần symlink vào thư mục skills chung của cả project luôn, không cần per claude session đâu"

> Context: feature 012 (`specs/012-space-skillsets/`) lets each project turn library skills and MCP servers on in Project Settings › Skills and start Claude with them from the + menu (`Claude · N skills`). Today every launch builds its own frozen folder (`projects/<slug>/claude-sessions/<stamp>/`) and old ones are cleaned up by looking at running processes. That is more machinery than the user wants. This feature replaces it with **one folder per project** that the switches keep up to date directly; every launch for that project uses the same folder.

## Clarifications

### Session 2026-11-16

- Q: Which shared folder do the switches link into? → A: One folder per project inside the Herdr home folder, `projects/<slug>/` (nothing written into the repo). Claude is still started with that folder from the + menu row.
- Q: Should a running session keep the skills it started with? → A: No longer required. Sessions of a project share one folder, so a switch flipped while a session runs may show up in it. This replaces FR-010 of feature 012.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A switch updates the project's skills folder at once (Priority: P1)

In Project Settings › Skills the user turns a skill on or off. The project's single skills folder is updated right away: the skill appears in it or disappears from it. Nothing else is created per session.

**Why this priority**: this is the simplification itself.

**Independent Test**: turn `qs-alpha` on for a repo and check the project's folder now holds `qs-alpha`; turn it off and check it is gone; the library copy of `qs-alpha` is untouched both times.

**Acceptance Scenarios**:

1. **Given** a skill turned on, **Then** within a second the project's folder contains that skill and the status line says it is saved.
2. **Given** a skill turned off, **Then** it is removed from the project's folder only; the skill in the library is unchanged.
3. **Given** an MCP server turned on or off, **Then** the project's folder lists exactly the servers that are on.
4. **Given** two worktrees of the same repo, **Then** they use the same folder.
5. **Given** a skill that was on but has since been removed from the library, **When** any switch is flipped or the tab is refreshed, **Then** the stale entry is dropped from the folder and the skill is shown as missing in the tab.

---

### User Story 2 - Every launch uses the same folder (Priority: P1)

The user starts Claude from the + menu row `Claude · N skills`. It starts at once with the project's folder; no new folder is made per launch, and no clean-up step runs.

**Why this priority**: removes the per-session folders and their clean-up.

**Independent Test**: start two sessions for one project from the + menu; both are given the same folder, and no new folder appears under the project.

**Acceptance Scenarios**:

1. **Given** a project with skills on, **When** the user picks `Claude · N skills`, **Then** Claude starts with the project's single folder and lists exactly the skills that are on.
2. **Given** the folder is missing or out of date (deleted by hand, library changed), **When** the user launches, **Then** the folder is brought up to date first, so the session gets what the switches say.
3. **Given** a skill that is on but missing or invalid in the library, **When** the user launches, **Then** the session starts without it and the user is told which skill was skipped and why (as in feature 012).
4. **Given** nothing is on, **Then** the + menu shows `Project skills…` as today.

---

### User Story 3 - Leftovers of the per-session mechanism are cleaned up (Priority: P2)

Folders made per launch by feature 012 are removed once no running Claude uses them, so the project folder ends up with just the one shared folder.

**Why this priority**: tidy-up after the switch; nothing breaks if it is late.

**Independent Test**: with an old per-launch folder and no session using it, flip any switch or launch once; the old folder is gone. With a session still using one, it stays until that session ends.

**Acceptance Scenarios**:

1. **Given** an old per-launch folder no running process uses, **When** the shared folder is next updated, **Then** the old folder is removed (its links only, never the library).
2. **Given** an old per-launch folder a running session still uses, **Then** it is kept.

### Edge Cases

- A session is running while its project's skills change: the change may reach that session (accepted by the user). The tab says "applies to Claude sessions of this project".
- Two windows flip switches for the same project at once: the saved selection is protected as before; the folder is rebuilt from the saved selection, so the last save wins.
- Something that is not a link appears inside the folder's skills list (made by hand): it is left alone and reported, never deleted.
- The library folder of a skill is renamed: the old link is dropped, the skill shows as missing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each project MUST have exactly one skills folder for Claude, in the project's area of the Herdr home folder, shared by all its worktrees and all its sessions.
- **FR-002**: Turning a skill or MCP server on or off MUST update that folder immediately to match the saved selection.
- **FR-003**: Updating the folder MUST only add or remove links (and the generated server list) inside it; it MUST NOT modify, move or delete anything in the library or the global set.
- **FR-004**: The + menu row MUST start Claude with the project's folder; it MUST bring the folder up to date first and MUST NOT create a new folder per launch.
- **FR-005**: Skills that are on but missing or invalid MUST be skipped and reported at launch, and shown as such in the tab.
- **FR-006**: Folders left by the per-launch mechanism of feature 012 MUST be removed once no running process uses them, and kept while one does.
- **FR-007**: Anything inside the folder's skills list that is not a link MUST be left in place and reported.
- **FR-008**: The Skills tab MUST say that changes apply to the project's Claude sessions (including running ones), replacing "applies to the next Claude session".
- **FR-009**: Everything else from feature 012 stays as is: the library, the selection file, the tab's list, search, warnings and size estimate, the + menu rows and shortcuts.
- **FR-010**: `CLAUDE.md` and the feature 012 artifacts that describe the per-launch folders MUST be updated to describe the shared folder (constitution VI).

### Key Entities

- **Project skills folder**: one per project; holds a link per skill that is on, the list of MCP servers that are on, and the plugin description Claude needs. Derived from the selection; synced in place on every change and before every launch.
- **Selection**: unchanged from feature 012 (`skills.json`, the source of truth).
- **Leftover launch folder**: a per-launch folder made by feature 012; removed when unused.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any number of launches, each project has exactly 1 skills folder (0 per-launch folders once old sessions end).
- **SC-002**: A flipped switch is reflected in the project's folder within 1 second.
- **SC-003**: A session started from the + menu lists 100% of the skills that are on and 0 that are off.
- **SC-004**: Flipping switches and launching never change any file in the library or the global set.

## Assumptions

- The shared folder lives at `projects/<slug>/claude-plugin/` (the location feature 012 first planned), next to `skills.json`; `projects/` is gitignored.
- Claude reads skills from the folder it was started with; whether a running session picks up a change at once or only after a restart is Claude's behaviour and is acceptable either way.
- The clean-up of leftover per-launch folders uses the same "is a running process using it" test as feature 012 and can be dropped once no such folders remain.
- No change to what the user sees in the + menu besides launching without delay for folder creation.

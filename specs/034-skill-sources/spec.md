# Feature Specification: Skill sources outside the Herdr home folder

**Feature Branch**: `034-skill-sources`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: User description: "Plan để có thể lưu được path của những folder chứa skills để project có thể bật tắt, và tiến hành chuyển bộ skills trong .agent/skills ra bên ngoài ~/Documents/SoraTech/skills-set, thay vì lưu chung như thế sẽ làm lẫn với các skill được cài chỉ riêng cho herdr-app"

## Context

Project Settings › Skills (specs 012, 013, 015) turns skills on per git project, but it reads them from one folder only: the Herdr home's own library `.agents/skills/`. That folder now mixes two different kinds of skills:

- **Herdr's own / general skills**, installed for this setup: `ponytail*`, `playwright-cli`, `mermaid-diagrams`, `hunk-review` (skills CLI, `skills-lock.json`), plus hand-made general ones (`archify`, `trace-flow`).
- **The SoraTech team set**, which belongs to the team's work, not to Herdr: `delivery`, `delivery-*`, `devflow`, `sora-*`, `find-mockup-repo`, `issue-walkthrough`, `onboard-domain`, `translate-requirement`.

Mixing them makes the Herdr repo carry team content, and it already broke things: many team skills call their own scripts by the old absolute path `~/.config/herdr-app/skills/...`, which no longer exists since spec 015 moved the library.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Turn on skills from another folder (Priority: P1)

The user keeps a set of skills in a folder of their choice (for example `~/Documents/SoraTech/skills-set`). They register that folder once as a skill source. From then on, every project's Skills tab lists the skills of that folder next to Herdr's own, and the user turns them on or off per project exactly as before.

**Why this priority**: without it nothing can live outside the Herdr home; it is the base the move (story 2) needs.

**Independent Test**: create a folder with one valid skill, register it as a source, open Project Settings › Skills for a project, turn the skill on, start Claude from the + menu, and see the skill offered in that session.

**Acceptance Scenarios**:

1. **Given** a registered source folder with skill `x`, **When** the user opens the Skills tab of any project, **Then** `x` is listed and its source folder is visible next to it.
2. **Given** `x` is turned on for project P, **When** Claude starts for P from any place that attaches project skills (+ menu, New worktree, git graph row menu, reviewer Ask, Threads resume), **Then** the session has `x`.
3. **Given** the user edits `x` inside its source folder, **When** a new session starts, **Then** it sees the edited skill (the source is used in place, not copied).

---

### User Story 2 - Move the SoraTech set out of the Herdr home (Priority: P1)

The user runs one move. The team skills leave `.agents/skills/` for `~/Documents/SoraTech/skills-set/`, that folder is registered as a source, and every project keeps exactly the skills it had on.

**Why this priority**: it is the concrete goal of the request; it separates team content from Herdr's own.

**Independent Test**: note each project's enabled skills, run the move, then check that `.agents/skills/` holds only Herdr's own skills, the team skills are in `skills-set`, each project lists the same enabled skills, and a new Claude session in a SoraTech project can run `/delivery`.

**Acceptance Scenarios**:

1. **Given** the team skills in `.agents/skills/`, **When** the move runs, **Then** they are in `~/Documents/SoraTech/skills-set/` and no longer in `.agents/skills/`, and Herdr's own skills stayed where they were.
2. **Given** projects 167 and 168 had team skills on, **When** the move finishes, **Then** the same skills are still on for them and their sessions find them at the new place.
3. **Given** team skills that call their own scripts by an absolute path into the Herdr home (old `skills/` or `.agents/skills/`), **When** the move finishes, **Then** those paths point into `skills-set` and the scripts are found.
4. **Given** the move already ran, **When** it runs again, **Then** it changes nothing and says so.
5. **Given** `skills-set` already holds a folder with the same name as one to move, **When** the move runs, **Then** it stops before moving anything and names the clash.

---

### User Story 3 - Manage the list of sources (Priority: P2)

From the Skills tab the user sees the list of sources, adds a folder by path, and removes one they no longer want.

**Why this priority**: editing the list by hand works for the one-time move; adding and removing from the screen matters once there is more than one team set.

**Independent Test**: add a folder path in the Skills tab, see its skills appear; remove it, see them disappear and the projects that had them on flagged.

**Acceptance Scenarios**:

1. **Given** a path to an existing folder, **When** the user adds it, **Then** it is saved and its skills appear in every project's list.
2. **Given** a path that does not exist or is not a folder, **When** the user adds it, **Then** nothing is saved and the tab says why.
3. **Given** a source with skills on in some projects, **When** the user removes it, **Then** the source is gone from the list, its skills are no longer attached to new sessions, and the tab says how many projects had them on.
4. **Given** Herdr's own library, **Then** it is always listed first and cannot be removed.

### Edge Cases

- **Same skill name in two sources**: the earlier source in the list wins; the later one is listed as hidden by the winner and cannot be turned on. A project's selection stays by name, so it keeps working whichever source provides the name.
- **A registered source folder is missing** (moved, unmounted): the tab shows the source as missing; its skills count as gone (existing "missing from library" warning at launch); the source is not removed by itself.
- **The same folder added twice, or by a different spelling** (`~/x` and `/Users/.../x`, trailing slash): treated as one source; the second add is refused.
- **Adding Herdr's own library or a folder inside it as a source**: refused.
- **A source folder holds things that are not skills**: ignored, as today (only folders with `SKILL.md` count; invalid ones are listed as invalid).
- **Running sessions during the move**: their linked skills point at the new place right after the move; a session that read a skill before the move keeps its copy until restarted.
- **The move fails half-way** (disk error): it stops, reports what was moved, and a rerun finishes the rest.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST keep a saved, ordered list of skill source folders, the same list for all projects. Herdr's own library is always the first entry and is not stored in or removable from that list.
- **FR-002**: The Skills tab MUST list the skills of every source, and show for each skill which source it comes from.
- **FR-003**: Turning a skill on or off MUST work the same for any source, and every place that attaches project skills to a Claude session MUST attach skills from any source.
- **FR-004**: When two sources have a skill with the same name, the earlier source MUST win; the later one MUST be shown as hidden and MUST NOT be selectable.
- **FR-005**: A project's saved selection MUST stay keyed by skill name, so skills already on keep working after they move between sources.
- **FR-006**: Users MUST be able to add a source by folder path and remove a source from the Skills tab; an add MUST be refused (with the reason shown) when the path is not an existing folder, is already a source, or is or lies inside Herdr's own library.
- **FR-007**: A source whose folder is missing MUST stay in the list, be shown as missing, and contribute no skills.
- **FR-008**: The system MUST provide a one-time move that takes the SoraTech team set out of Herdr's own library into `~/Documents/SoraTech/skills-set/`, registers that folder as a source, re-points every project's attached skills, and leaves every project's selection unchanged.
- **FR-009**: The move MUST rewrite absolute paths inside the moved skills that point into the Herdr home's skill folders (old `skills/` and `.agents/skills/`) so they point into `skills-set`.
- **FR-010**: The move MUST stop before changing anything when a target name already exists in `skills-set`, MUST be safe to run again, and MUST offer a dry run that only reports what it would do.
- **FR-011**: The move MUST NOT change Herdr's own skills, `mcp/`, any `skills.json`, or anything under `~/.claude/`.
- **FR-012**: MCP server configs stay where they are today (`mcp/`); sources apply to skills only.

### Key Entities

- **Skill source**: a folder that holds skill folders. Attributes: path (as entered, home shown as `~`), position in the list, state (ok / missing). Herdr's own library is a fixed first source.
- **Skill**: a folder with `SKILL.md` inside a source. Attributes: name, description, source, state (valid / invalid / hidden by an earlier source).
- **Project selection**: per project, the names of skills and MCP servers turned on (unchanged from spec 013).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the move, Herdr's own library holds only Herdr's own and general skills (zero team skills), and `skills-set` holds all of the team set.
- **SC-002**: For every project, the list of enabled skills before and after the move is identical, and a new Claude session in a SoraTech project offers the same skills as before the move.
- **SC-003**: Zero team skills refer to a path inside the Herdr home after the move; the gate script and vault path helper used by `/devflow` and the `delivery-*` phases are found.
- **SC-004**: Registering a new source and turning one of its skills on for a project takes under one minute, with no file edited by hand.
- **SC-005**: Running the move a second time reports nothing to do and changes no file.

## Assumptions

- The team set is: `delivery`, every `delivery-*`, `devflow`, `sora-ask`, `sora-branch`, `sora-profile`, `find-mockup-repo`, `issue-walkthrough`, `onboard-domain`, `translate-requirement`, plus (confirmed by the user afterwards) `archify`, `trace-flow`, `hunk-review`, `mermaid-diagrams`, `playwright-cli`, whose skills CLI lock entries move to `skills-set/skills-lock.json`. Only `ponytail*` stays in Herdr's own library.
- The source list is personal setup and is tracked in the Herdr repo like `keys.json` and layouts; it holds paths, no secrets.
- `~/Documents/SoraTech/skills` (the older source of `delivery-*` from the global skills CLI) is left untouched; `skills-set` is a new folder and the place the team set lives from now on. Making `skills-set` a git repo is the user's choice, outside this feature.
- The team skills leave the Herdr repo's tracked files; committing that removal is the user's step.
- The "also in global" note and the token estimate keep working across sources.

> Superseded in part by spec 035: the source list is per project (projects/<slug>/skills.json), not the shared skill-sources.json.

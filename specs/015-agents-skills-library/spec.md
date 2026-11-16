# Feature Specification: Skill Library Moves to `.agents/skills/`

**Feature Branch**: `015-agents-skills-library` (no branch created)

**Created**: 2026-11-16

**Status**: Implemented (2026-11-16; Skills tab screenshot check T019 left to the user)

**Input**: User description: "Lên plan để migrate sang .agent/skills/ ngay trong project này đi, migrate các data cũ sang luôn"

> Context: features 012 and 013 keep the skill library in `~/.config/herdr-app/skills/<name>/SKILL.md`. Project Settings › Skills lists that folder, and each project's shared plugin folder (`projects/<slug>/claude-plugin/skills/`) holds symlinks into it. The user now installs third-party skills with the `skills` CLI (`npx skills add ...`). That CLI cannot write to an arbitrary folder. It only installs into fixed per-agent folders, and so far the `openclaw` agent name has been borrowed only because its folder happens to be `skills/`. The cross-agent standard folder is `.agents/skills/` (the CLI's `universal` target, which writes there and nowhere else). This feature makes `.agents/skills/` the one library folder and moves everything that exists today into it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install a skill with the standard target (Priority: P1)

From the Herdr home folder the user runs `npx skills add <owner/repo> -a universal`. The new skill shows up in Project Settings › Skills, ready to switch on, with no hand copying and no borrowed agent name.

**Why this priority**: this is the reason for the move.

**Independent Test**: install a small public skill package with `-a universal`, open Project Settings › Skills and see the new skills listed and switchable.

**Acceptance Scenarios**:

1. **Given** the migration is done, **When** the user installs a package with `-a universal` from the Herdr home folder, **Then** its skills appear in the Skills tab within one refresh and can be turned on for a project.
2. **Given** a skill installed this way is on for a project, **When** the user starts Claude from the + menu row for that project, **Then** the skill is available in that session.
3. **Given** the migration is done, **When** the user runs the CLI's list, update and remove commands with the `universal` target, **Then** they act on the library skills the CLI installed (ponytail today).

---

### User Story 2 - Existing skills move without breaking anything (Priority: P1)

All skill folders in the old `skills/` folder (the hand-made `archify`, `delivery-*` and others, plus the CLI-installed `ponytail*`) move to `.agents/skills/`. Every project keeps exactly the skills it had switched on, and sessions started afterwards see the same skills as before.

**Why this priority**: losing or silently dropping a switched-on skill would break the user's daily `delivery-*` workflow in the work projects.

**Independent Test**: record, before the move, the library list and each project's switched-on skills. Run the migration. Compare: same names in the library, same selection per project, and every link in each project's plugin folder resolves to a folder with a `SKILL.md`.

**Acceptance Scenarios**:

1. **Given** N skill folders in `skills/`, **When** the migration runs, **Then** `.agents/skills/` holds the same N folders with identical contents and `skills/` no longer exists.
2. **Given** a project with skills switched on, **When** the migration finishes, **Then** its selection is unchanged and every link in its plugin folder points into `.agents/skills/` and resolves.
3. **Given** a Claude session that was started before the migration, **When** the migration finishes, **Then** the session's skills folder resolves again (links repaired in place) without restarting the session.
4. **Given** skills refer to sibling skills by relative path (for example `../delivery-dev/...`), **When** they are moved together, **Then** those references still resolve.
5. **Given** the library is tracked in git, **When** the migration is committed, **Then** git records it as renames, so each skill keeps its history.

---

### User Story 3 - Settings and notes point at the new place (Priority: P2)

Everything that shows or describes the library location says `.agents/skills/`: the Skills tab's folder line, its empty-state hint, its "Open folder" button, `CLAUDE.md` and the shared library notes.

**Why this priority**: wrong hints are not a breakage but send the user (or an agent) to a folder that no longer exists.

**Independent Test**: open the Skills tab and read the folder line and hint; press "Open folder"; read the library section of `CLAUDE.md`.

**Acceptance Scenarios**:

1. **Given** the Skills tab is open, **When** the user reads the folder line, **Then** it shows `~/.config/herdr-app/.agents/skills` for skills and `~/.config/herdr-app/mcp` for MCP servers.
2. **Given** the Skills tab, **When** the user presses "Open folder", **Then** `.agents/skills/` opens.
3. **Given** `CLAUDE.md`, **When** a reader looks up how to add a skill, **Then** it names `.agents/skills/` and the `npx skills add <repo> -a universal` command, and no longer mentions the `openclaw` workaround.

---

### Edge Cases

- **A skill exists in both places** (for example one was installed into `.agents/skills/` before the migration): the migration stops and lists the clashing names, moving nothing, so no copy overwrites another.
- **Migration is run twice**: the second run finds `skills/` gone (or empty) and changes nothing.
- **A project's plugin folder contains something that is not a link** (a real folder put there by hand): it is left alone, as feature 013 already does.
- **A project selection names a skill no longer in the library**: it stays in the selection and is reported as missing, as today; the migration does not edit selections.
- **A project folder under `projects/` belongs to a repo that no longer exists on disk**: its plugin links are still repaired, so starting a session there later works.
- **Herdr is running during the migration**: the Skills tab may briefly show an empty library between the move and the next refresh; nothing is written to selections during that time.
- **An agent that loads `.agents/skills/` on its own (for example Codex) is started inside the Herdr home folder itself**: it would see the whole library as project skills. Accepted; see Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The skill library MUST be read from `~/.config/herdr-app/.agents/skills/<name>/SKILL.md`. The old `skills/` folder MUST NOT be read any more, and nothing falls back to it.
- **FR-002**: The MCP library location (`~/.config/herdr-app/mcp/`) MUST NOT change.
- **FR-003**: The migration MUST move every folder from `skills/` into `.agents/skills/` with contents unchanged, then remove the empty `skills/` folder. No compatibility link is left at the old path.
- **FR-004**: The migration MUST refuse to run, and change nothing, if any name already exists in both folders. It MUST list the clashing names.
- **FR-005**: The migration MUST carry the CLI's install record over so the `skills` CLI with the `universal` target still treats the moved CLI-installed skills (ponytail today) as installed: list, update and remove work on them.
- **FR-006**: After the move, the plugin folder of every project under `projects/` MUST be re-synced at once (not only the project currently open), so every link points into `.agents/skills/`. Selections (`skills.json`) MUST NOT be modified.
- **FR-007**: The migration MUST be repeatable: running it again after success changes nothing and reports that there is nothing to move.
- **FR-008**: The tracked library MUST move in git as renames, so per-file history is kept.
- **FR-009**: The Skills tab MUST show the new skills path and the unchanged MCP path, its "Open folder" button MUST open the new folder, and its empty-state hint MUST name the new folder.
- **FR-010**: `CLAUDE.md` and the header notes of the shared library code MUST describe `.agents/skills/` as the library and `npx skills add <repo> -a universal` as the way to install third-party skills. The `openclaw` workaround note MUST be removed.
- **FR-011**: The feature 013 invariant still holds for normal use: switching skills on or off and launching sessions never write into the library folder. Only the one-time migration moves library folders.
- **FR-012**: Herdr MUST keep working after the change: every mod that uses the library passes `herdr-app check`.

### Key Entities

- **Library skill**: a folder with a `SKILL.md` (name and description in its header), now under `.agents/skills/`. Either hand-made (tracked in git) or installed by the CLI (also tracked, plus recorded in the install record).
- **Install record** (`skills-lock.json`): the CLI's list of skills it installed, with their source repo and hash. Today it lists the six ponytail skills.
- **Project selection** (`projects/<slug>/skills.json`): the names a project has switched on. Not changed by this feature.
- **Project plugin folder** (`projects/<slug>/claude-plugin/skills/`): links from each switched-on name to its library folder. Rewritten by the migration to point at the new location.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the migration, 100% of the skill folders that were in `skills/` (41 today) are in `.agents/skills/`, byte-for-byte identical, and `skills/` is gone.
- **SC-002**: For every project under `projects/`, the set of switched-on skills is identical before and after, and 0 links in its plugin folder are broken.
- **SC-003**: Installing a new skill package takes one command, with no hand copying and no agent name that has nothing to do with the user's tools.
- **SC-004**: The CLI's list command with the `universal` target shows all 6 ponytail skills after the migration.
- **SC-005**: A second run of the migration reports nothing to do and leaves the git working tree unchanged.
- **SC-006**: No user-facing text or note in the repo (outside `specs/012-*` and `specs/013-*`, which are historical) points at the old `skills/` library path.

## Assumptions

- The user wrote `.agent/skills/`; this spec uses `.agents/skills/` (with an `s`), because that is the folder the `skills` CLI's `universal` target writes and the folder other agents read. The `universal` target writes only there (checked in a scratch folder).
- "Old data" means: the library skill folders, the CLI install record, and every project's plugin-folder links. Per-project selections hold only names, so they stay valid unchanged.
- `.agents/skills/` stays tracked in git, like `skills/` is today. `.agents/` already exists in the repo as an empty, untracked folder.
- Claude Code does not load `.agents/skills/` on its own, so working on the Herdr home repo with Claude Code is unaffected. Other agents that do load it (for example Codex) would see the library as project skills when started inside the Herdr home folder. This is accepted; the Herdr home repo is not where those agents are used.
- The repo's own Claude Code skills in `.claude/skills/` (spec-kit commands) are separate from the library and are not touched.
- Specs 012 and 013 are history and keep their old paths; only live notes (`CLAUDE.md`, code comments) are updated.
- The migration is run once by hand (a script or a short list of commands), not built into a mod's UI.

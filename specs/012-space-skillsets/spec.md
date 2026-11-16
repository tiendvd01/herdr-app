# Feature Specification: Per-Project Skills for Claude Sessions

> **Superseded in part by `specs/013-shared-project-skills/`**: one shared folder per project (`projects/<slug>/claude-plugin/`) synced in place on every switch and launch; per-launch `claude-sessions/` folders are no longer made, and FR-010 (running sessions unaffected) is relaxed.

**Feature Branch**: `012-space-skillsets` (no branch created)

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Tạo feature quản lí skills để khởi động claude với bộ skill tùy folder của space, dùng claude --plugin-dir ~/skillsets/backend, thay vì lưu tất cả skills và mcp ở claude global gây tốn token nếu dùng tất cả skill của global ở tất cả mọi space, rồi nối vào + menu để mở claude session với tham số --plugin-dir"

> Context: today every Claude session loads every skill and MCP server installed globally, whatever the project. Their descriptions are sent with every conversation, so a backend repo pays for frontend, delivery, slide and spreadsheet skills it never uses. The goal is to keep the global set small, keep the other skills in one flat library inside the Herdr home folder, and let each project turn on only the skills it needs. Claude accepts an extra skill folder at start-up (`--plugin-dir <path>`). The + menu (mod `my-new-menu`) already starts agents in the focused space's folder; Project Settings (mod `project-settings`) already holds per-project settings (Ports, Worktree script) under `projects/<repo>/`.

## Clarifications

### Session 2026-11-16

- Q: Does the app move or copy global skills into the library? → A: No. The user moves skills out of `~/.claude/skills` by hand. The app manages the library and per-project choices only.
- Q: Where is the management UI? → A: A new **Skills** tab in Project Settings.
- Q: Granularity of the choice? → A: Per skill, per project. No grouping into skillsets (frontend / backend): every skill in the library is listed on its own and turned on or off for the current project.
- Q: Where does the library live? → A: Inside the Herdr home folder (`~/.config/herdr-app/`), versioned with the rest of the setup, instead of `~/skillsets/` from the original request.
- Q: How is the per-project selection stored on disk? → A: Left to the design; decided below in **Storage layout**: one generated folder per project made of symlinks into the library.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Turn skills on and off for a project (Priority: P1)

In Project Settings, on the Skills tab, the user sees one flat list of every skill in the library, each with its name, description and a switch, and turns on the ones this project needs. MCP servers from the library are listed below the same way. Global skills are shown in a separate read-only section for reference. A search box filters the list by name or description.

**Why this priority**: the choice per project is the core of the feature; the + menu entry only applies it.

**Independent Test**: put three skills in the library, open Project Settings for a repo, turn on two, restart the app, and confirm the two switches are still on and another repo shows them off.

**Acceptance Scenarios**:

1. **Given** a library with 5 skills, **When** the user opens the Skills tab, **Then** all 5 are listed alphabetically with name, description and switch, and the header shows how many are on.
2. **Given** the user flips a switch, **Then** the change is saved at once and applies to the next Claude session started for this project; running sessions are not changed.
3. **Given** two worktrees of the same repo, **When** a skill is turned on in one, **Then** it is on in all worktrees of that repo and in their sub-folders.
4. **Given** the global section, **Then** its skills are shown with a "global, loaded everywhere" note and no switch.
5. **Given** a skill added to the library later, **Then** it appears in the list, off by default, for every project.
6. **Given** the user types in the search box, **Then** only skills and MCP servers whose name or description match are shown.

---

### User Story 2 - Start Claude with the project's skills from the + menu (Priority: P1)

The user focuses a space and opens the + menu. Besides the plain "Claude" entry, an entry "Claude · N skills" starts Claude in a new tab of the space folder with exactly the skills and MCP servers turned on for this project.

**Why this priority**: this is where the saving is realised, started in one step from where sessions already start.

**Independent Test**: turn on one skill for a repo, start "Claude · 1 skill" from the + menu, and in the session confirm that skill is listed and a skill that is off is not.

**Acceptance Scenarios**:

1. **Given** a project with skills turned on, **When** the user opens the + menu, **Then** the entry shows the number of skills on, and picking it starts Claude in a new tab of the current space and folder with those skills.
2. **Given** a project with nothing turned on, **Then** the entry is not shown and the menu looks as today, except a link to the Skills tab.
3. **Given** a turned-on skill that was removed or renamed in the library, **When** the session starts, **Then** it starts with the remaining skills and the user is told which skill was skipped.
4. **Given** the plain "Claude" entry, **Then** Claude starts exactly as today.
5. **Given** the + menu digit shortcuts, **Then** existing agents keep their numbers.

---

### User Story 3 - Keep the library tidy (Priority: P2)

From the Skills tab the user opens the library folder in the editor (to drop in skills moved by hand from global) and refreshes the list. Invalid skills and duplicates are flagged.

**Why this priority**: the user fills the library by hand; these shortcuts and warnings make it practical.

**Independent Test**: move one skill folder from global into the library by hand, press refresh, and confirm it appears and can be turned on.

**Acceptance Scenarios**:

1. **Given** the user presses "Open folder", **Then** the library folder opens in the editor.
2. **Given** the user presses refresh after adding a skill by hand, **Then** the new skill appears without restarting the app.
3. **Given** a skill folder without a valid description file, **Then** it is listed as invalid with the reason and cannot be turned on.
4. **Given** a skill with the same name as a global skill, **Then** it is marked with a duplicate warning, since turning it on would load it twice.

---

### User Story 4 - See the size saved (Priority: P3)

The tab shows, for the global set and for the project's current selection, the skill count, MCP server count and an approximate per-conversation size, so the user knows what moving a skill out of global gains.

**Why this priority**: helps deciding, not needed to use the feature.

**Independent Test**: note the global size, move a skill from global into the library by hand, refresh, and confirm the global size drops.

**Acceptance Scenarios**:

1. **Given** the Skills tab, **Then** a summary line shows global and project-selection counts and approximate sizes, updated when a switch is flipped.

### Edge Cases

- The focused space has no folder, or the folder is on another machine: the + menu entry is hidden.
- Claude is not installed: the entry is not shown, like other uninstalled agents.
- A folder that is not a git repo is not a project (Project Settings lists git projects only): the + menu shows no skills entry there.
- The library is empty or missing: the tab shows an empty state explaining where to put skills, with an "Open folder" action.
- A skill folder or MCP file whose name is not made of `A–Z a–z 0–9 . _ -` (spaces, non-ASCII) is listed as invalid with the reason `bad name` and cannot be turned on; the user renames it.
- A launch folder is deleted by hand: only that session loses its skills; the next launch builds a new one from the saved selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat every valid sub-folder of the skill library as one selectable skill, and every server file in the MCP library as one selectable MCP server. There is no grouping level.
- **FR-002**: Project Settings MUST have a Skills tab listing all library skills and MCP servers in one flat, searchable list with a switch each, and the global skills read-only.
- **FR-003**: The selection MUST be saved per project, survive app restarts, and apply to all worktrees and sub-folders of the project.
- **FR-004**: Turning an item on or off MUST NOT modify, move or delete anything in the library or in the global set.
- **FR-005**: The + menu MUST offer, when the project has at least one item on, an entry that starts Claude in a new tab of the current space and folder with exactly the items turned on.
- **FR-006**: Existing + menu entries and their shortcuts MUST behave exactly as before.
- **FR-007**: At launch, items whose source is missing or invalid MUST be skipped and reported to the user.
- **FR-008**: The user MUST be able to open the library folder and refresh the list from the Skills tab.
- **FR-009**: The tab MUST show counts and an approximate per-conversation size for global and for the project selection.
- **FR-010**: Changing a selection MUST NOT affect sessions already running: each launch gets its own folder that is never changed afterwards. (Editing a skill's own files in the library still reaches every session that has it on, by design.)
- **FR-011**: The behaviour MUST be noted in `CLAUDE.md` (constitution VI, 2.0.0); there is no `docs/` folder.

### Key Entities

- **Skill library**: one flat folder of skills in the Herdr home folder, tracked in git, filled by hand.
- **MCP library**: one flat folder with one file per MCP server, tracked in git, filled by hand.
- **Skill / MCP server**: the unit turned on or off; has a name and a description (skills) or a name (servers); valid or invalid with a reason.
- **Project selection**: the names of the skills and MCP servers turned on for one project; keyed by repository, so shared by its worktrees.
- **Launch folder**: the folder generated from a project selection for one Claude launch and given to it with `--plugin-dir`; frozen after creation, removed once no running process uses it.
- **Global set**: what Claude loads everywhere; shown read-only.

## Storage layout

Decided at the user's request ("nghĩ cách cấu trúc thư mục"). Details may be refined in `/speckit-plan`.

```text
~/.config/herdr-app/
├── skills/                           # skill library, flat, tracked in git, edited by hand
│   ├── api-design/SKILL.md
│   ├── db-migration/SKILL.md
│   └── react-forms/SKILL.md
├── mcp/                              # MCP library, one server per file, tracked in git
│   ├── postgres.json
│   └── playwright.json
└── projects/<repo-slug>/             # existing per-project folder (post-create.sh, summary-prompt.md), gitignored
    ├── skills.json                   # source of truth: enabled skill + MCP names
    └── claude-sessions/
        └── <YYYYMMDD-HHMMSS-xxxx>/   # one per launch = the --plugin-dir of that session, never changed after
            ├── .claude-plugin/plugin.json  # generated, name "herdr-<repo>"
            ├── skills/
            │   ├── api-design   -> ~/.config/herdr-app/skills/api-design     (symlink)
            │   └── db-migration -> ~/.config/herdr-app/skills/db-migration   (symlink)
            └── .mcp.json             # generated: the enabled servers merged into one file
```

- **Turn on / off** a skill = change `skills.json` only. Nothing else is written until a launch.
- **Each launch** builds a new folder under `claude-sessions/` with one symlink per enabled skill and a merged `.mcp.json`, and passes it with `--plugin-dir`. The folder is never modified afterwards, so a running session keeps exactly the skills it started with (FR-010).
- **Cleanup**: at each launch, older launch folders that no running process names on its command line (`ps`) and that are over 2 minutes old are removed. Removing a folder deletes its symlinks only, never the library.
- **Symlink, not copy**: edits to a skill in the library apply to every session at once, nothing is duplicated, and cleanup can never lose work (confirmed: Claude follows symlinked skill folders, research R1).
- **MCP servers are not symlinked**: Claude reads them from one `.mcp.json` per plugin, so each launch folder gets a `.mcp.json` merged from the enabled server files.
- **`skills.json` is the truth**; launch folders are derived from it, and skills missing from the library are skipped and reported at launch (Story 2, scenario 3).
- **Library folder names are unique** (flat folder), so link names are simply the skill names.
- **`<repo-slug>`** is the same key Project Settings already uses for `post-create.sh` (from the repo's main worktree path), so all worktrees share one selection and all per-project files stay in one place.
- **Launch** passes a single folder: `claude --plugin-dir ~/.config/herdr-app/projects/<repo-slug>/claude-sessions/<stamp>`.
- **Git**: `skills/` and `mcp/` are tracked like layouts and mods; `projects/` is already gitignored, so selections and launch folders (machine-specific absolute paths) stay out of git. Secrets in an MCP server file (tokens, keys) MUST come from environment variables, never be written in the file, since it is committed.
- `skills/` and `mcp/` sit at the repo root, not under `mods/`, so editing a skill never hot-reloads a mod. Nothing is written into the project's own repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a focused space, the user starts Claude with the project's skills in at most 2 actions (open + menu, pick entry).
- **SC-002**: A session started this way lists 100% of the skills turned on and 0 skills turned off.
- **SC-003**: After the user moves domain-specific skills out of global, the size shown for a typical project's session is at least 50% smaller than today's global-only set.
- **SC-004**: Turning a skill on or off takes one click and is reflected in the next session with no other step.
- **SC-005**: Flipping switches never changes any file in the library or the global set (checked by comparing the library before and after).
- **SC-006**: 100% of existing + menu entries and shortcuts keep working unchanged.

## Assumptions

- The user moves skills from `~/.claude/skills` (and MCP servers from global config) into the library by hand; the app never edits global.
- The generated bundle is a folder Claude accepts for `--plugin-dir`.
- Only Claude gets the new entry; other agents are out of scope.
- Library and bundles are on the local machine; remote machines are out of scope.
- The approximate size is estimated from description length, not an exact token count.
- MCP servers whose config needs a secret take it from environment variables, because the library is committed.

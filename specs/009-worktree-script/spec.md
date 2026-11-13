# Feature Specification: Worktree Script (as-built)

**Feature Branch**: `009-worktree-script` (documentation only; no branch created)

**Created**: 2026-11-13

**Status**: Draft (describes existing behaviour)

**Input**: User description: "Document the per-project post-create script that runs after a worktree is created, as it behaves today. Describe what it does and why, not how."

> Scope note: covers the "Worktree script" tab of Project Settings (mod `project-settings`), the New worktree dialog (mod `my-worktree`), the older standalone dialog (mod `project-scripts`) and the post-create runner inside the status bar (mod `status-usage`). The Ports tab is spec 010 and the Summary prompt tab is not covered. No automated tests exist; scenarios come from the code and `docs/mods/project-settings.md` / `docs/mods/status-usage.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set up each new worktree automatically (Priority: P1)

A user creates a new worktree for a branch and expects it to be ready to work in (env file copied, dependencies installed) without typing the same commands each time. The script saved for that project runs once, inside the new worktree, and the user gets a toast saying whether it worked.

**Why this priority**: this is the whole point of the feature; a fresh checkout is otherwise missing untracked files and installed dependencies.

**Independent Test**: save a script that writes a marker file, create a new worktree for that project from the New worktree dialog, and confirm the marker appears in the new worktree and a "Post-create script done" toast shows.

**Acceptance Scenarios**:

1. **Given** a project with a non-empty saved script, **When** a new worktree space appears under the worktrees folder, **Then** the script runs once with the worktree as its working folder and a success toast names the space.
2. **Given** the script exits with an error, **When** it finishes, **Then** an error toast "Post-create script failed" shows the space name and the last three lines of its output.
3. **Given** the project has no script, or the script is blank, **When** a worktree is created, **Then** nothing runs and no toast appears.
4. **Given** a worktree already handled once, **When** the same folder shows up again (reload, reopen), **Then** the script does not run again.

---

### User Story 2 - Write and save the script per project (Priority: P1)

In Project Settings the user picks a project, opens the Worktree script tab and edits a shell script in an editor. They save it, or revert to what is on disk.

**Why this priority**: without a way to author the script there is nothing to run.

**Independent Test**: open Project Settings, choose a project, edit, press Save, close and reopen the page, and confirm the text persists; press Revert after more edits and confirm the saved text returns.

**Acceptance Scenarios**:

1. **Given** the page is open, **When** it lists projects, **Then** every distinct git project among the spaces open on this machine appears once, sorted by name, and the active space's project is selected first; spaces on other machines are ignored.
2. **Given** a project with no script yet, **When** its tab opens, **Then** the editor shows a starter template (shebang, a comment, example env copy and install commands) and the status line says "No script yet".
3. **Given** unsaved edits, **Then** the status line says "Unsaved changes"; after Save it says "Saved"; Revert reloads the editor from disk.
4. **Given** the file changed on disk after it was loaded, **When** the user saves, **Then** the save is refused and "Failed: ..." shows in red instead of overwriting.
5. **Given** a project has an older script stored inside the repo and none in the new location, **When** its tab opens, **Then** the editor shows the older content; Save writes it to the new location.
6. **Given** no git project is open, **Then** the page says "No git projects open".

---

### User Story 3 - Create the worktree that triggers it (Priority: P2)

From the New worktree dialog the user picks an existing local or remote branch, or types a new name, and presses Enter. A checkout is made under the user-level worktrees folder (grouped by repo name, branch with slashes turned into dashes) and a new space opens on it.

**Why this priority**: it is what produces the worktrees the script runs in.

**Independent Test**: open the dialog on a space, type a new branch name, press Enter, and confirm a space opens on `~/.herdr/worktrees/<repo>/<branch>` and the script runs.

**Acceptance Scenarios**:

1. **Given** a typed name that matches no branch, **When** the user confirms, **Then** a new branch is created from the current HEAD and checked out in the new worktree.
2. **Given** a remote-only branch is picked, **Then** a local tracking branch is created for it.
3. **Given** the branch is already checked out in another worktree, **Then** the dialog refuses with a message and creates nothing.
4. **Given** the git command fails, **Then** its error message shows in the dialog and no space opens.
5. **Given** the dialog runs for a repo on another machine, **Then** the checkout is made there and the post-create script does not run (it only handles spaces on this machine).

---

### User Story 4 - No surprise runs on first start (Priority: P2)

The first time the runner ever starts, worktrees that already exist must not trigger the script; only worktrees created afterwards do.

**Why this priority**: running setup scripts (installs, copies) over existing checkouts would be destructive or noisy.

**Independent Test**: clear the stored "done" list, restart, and confirm no toast appears for existing worktrees; create a new worktree and confirm the script runs.

**Acceptance Scenarios**:

1. **Given** no record of handled worktrees, **When** the runner first sees existing worktree spaces, **Then** it records them as handled and runs nothing.
2. **Given** a record exists, **When** a space on a not-yet-recorded worktree folder appears, **Then** it is processed once.

---

### Edge Cases

- Only checkouts under the user-level worktrees folder are considered; a worktree created elsewhere by hand never triggers the script.
- A folder that is not a git checkout is skipped silently.
- The script runs through the system shell, to completion, with no time limit and no live output; only the final toast reports it.
- A folder is recorded as handled before the script runs, so a failed script is not retried automatically; the user must run it by hand.
- If the new-location script is blank, the older in-repo script is tried before giving up.
- Project identity is the main checkout path with unusual characters turned into `_`; two projects with the same normalised path would share a script.
- The record of handled folders keeps only the 200 most recent entries.
- The runner checks every few seconds, so the script starts shortly after the space appears, not instantly.
- A standalone Post-create script dialog exists (mod `project-scripts`) with the same file and template; the current layout uses the Project Settings tab instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let the user keep one shell script per git project, stored outside the repository in the user's herdr config area, keyed by the project's main checkout path.
- **FR-002**: Project Settings MUST list each distinct git project of the local spaces and select the active space's project first.
- **FR-003**: The Worktree script tab MUST show a starter template when no script exists, and the status line MUST distinguish "No script yet", "Unsaved changes", "Saved" and "Failed: ...".
- **FR-004**: Save MUST write the script (creating its folder) and MUST refuse to overwrite a file changed on disk since it was loaded; Revert MUST reload from disk.
- **FR-005**: When only an older in-repo script exists, the editor MUST show it, and Save MUST write to the new location.
- **FR-006**: The New worktree dialog MUST create a checkout under the user-level worktrees folder (`<repo>/<branch-with-dashes>`), from an existing, remote or newly named branch, and open a space on it.
- **FR-007**: The dialog MUST refuse a branch already checked out elsewhere and MUST show git errors without opening a space.
- **FR-008**: The status bar runner MUST detect new local spaces whose folder is under the worktrees folder and run the project's script once, in that folder.
- **FR-009**: The runner MUST fall back to the older in-repo script when the new one is missing or blank, and MUST do nothing when neither has content.
- **FR-010**: The runner MUST report success or failure by toast; failures MUST include the last three lines of output.
- **FR-011**: On first ever start the runner MUST mark all existing worktree spaces as handled without running anything.
- **FR-012**: Handled worktree folders MUST be remembered across restarts (most recent 200), and a handled folder MUST NOT run the script again.
- **FR-013**: The runner MUST ignore spaces on other machines and folders that are not git checkouts.
- **FR-014**: The script files MUST stay untracked by version control as machine-specific settings.

### Key Entities

- **Project**: a git repository identified by its main checkout path; owns at most one worktree script.
- **Worktree script**: shell text run once per new worktree with the worktree as working folder.
- **Worktree space**: a space whose folder is a checkout under the user-level worktrees folder.
- **Handled record**: the remembered list of worktree folders already processed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After creating a worktree, a project with a script has it executed with no further user input, and the outcome toast appears within about 5 seconds of the script ending.
- **SC-002**: A script runs at most once per worktree folder across restarts.
- **SC-003**: Starting the app never runs a script for a pre-existing worktree.
- **SC-004**: Saved script text is identical when reopened; a conflicting external edit is never silently overwritten.
- **SC-005**: A failed script always yields a visible error toast naming the worktree.

## Assumptions

- The user is on macOS or Linux with a POSIX shell and git installed.
- Worktrees meant to trigger the script are created through the New worktree dialog (the only supported route to the worktrees folder).
- Retrying a failed script is manual; no retry, timeout or cancel is provided.
- Ports and Summary prompt tabs of Project Settings are out of scope.
- No automated tests exist; behaviour was read from the code and mod notes.

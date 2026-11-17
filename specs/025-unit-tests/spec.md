# Feature Specification: Unit tests for the shared logic

**Feature Branch**: `025-unit-tests`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: User description: "Triển khai unit test cho repo này"

## User Scenarios & Testing *(mandatory)*

The repo has no automated tests. The shared logic used by several screens (reading git remotes and PR links,
choosing the GitHub account, PR status facts, ports of a project, the folder a space follows, the dialog
border check) is only verified by opening the app and looking. A change in one of these can break several
screens at once without anyone noticing until it is used.

### User Story 1 - One command tells whether the shared logic still works (Priority: P1)

After changing shared logic, the owner (or an agent) runs one command. It finishes in seconds, needs nothing
installed beyond what the machine already has, and either passes or names the failing case.

**Why this priority**: It is the request; everything else builds on it.

**Independent Test**: Run the command on the repo: it passes. Break one rule in a shared file on purpose: the
command fails and names the case.

**Acceptance Scenarios**:

1. **Given** the current repo, **When** the test command runs, **Then** every test passes.
2. **Given** a deliberate bug in a covered function, **When** the test command runs, **Then** it fails naming that function's case.
3. **Given** a fresh clone with only the usual tools, **When** the test command runs, **Then** nothing needs to be installed first.

### User Story 2 - Logic that talks to the app or the shell can be tested too (Priority: P2)

Shared files that ask the app for spaces and panes, or run shell commands, are tested with made-up answers,
so tests never touch the real app, network, GitHub or the machine's processes.

**Why this priority**: Half of the shared files depend on the app; without this they stay untested.

**Independent Test**: A test of the space-folder logic runs outside the app with made-up spaces and panes.

**Acceptance Scenarios**:

1. **Given** a file that reads the app's spaces, **When** its test runs outside the app, **Then** it uses made-up spaces and passes.
2. **Given** a file that runs shell commands, **When** its test runs, **Then** no real command runs.

### Edge Cases

- Screen drawing is not unit tested (it needs the running app); `herdr-app check` and screenshots stay the gate there.
- Copies of shared files inside each screen are not tested again; only the single source is.
- Tests must never write inside the screens' folders (saving there reloads the screen).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: One documented command MUST run every test and exit non-zero on any failure.
- **FR-002**: Running tests MUST need no package install and no build step.
- **FR-003**: Tests MUST live outside the screens' folders and never write into them.
- **FR-004**: Files that import the app's module MUST be testable with made-up app answers.
- **FR-005**: Tests MUST NOT run real shell commands, network or GitHub calls; command runners are replaced with made-up ones.
- **FR-006**: First coverage: remote/PR link parsing, GitHub account repo detection, PR list query words and run log cleanup, PR status facts, ports grouping, space folder choice, the dialog border check. Added later: PR GraphQL reads (`discoverMany`, `readPrs`, `counts`, `page`) with a fake gh, pr-flow's tracker (single source in `mods/pr-flow/tracker.js`, imported read-only), `agentArgv`.
- **FR-007**: The main guidance file MUST name the command and where tests go.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The whole suite runs in under 10 seconds.
- **SC-002**: Each of the 7 areas in FR-006 has at least one passing test and one edge case.
- **SC-003**: A deliberate one-line bug in a covered function makes the suite fail.

## Assumptions

- The machine's Node (v24) is the runner; no CI exists, tests are run by hand or by an agent before commit.
- `lib/project-skills.js` (file-system heavy) is left for a later round.

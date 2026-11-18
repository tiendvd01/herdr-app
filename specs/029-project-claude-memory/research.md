# Research: Project Claude Memory

## R1. Where Claude keeps a project's memory

- **Decision**: `~/.claude/projects/<slug>/memory/`, slug = main checkout's absolute path with every
  character outside `[A-Za-z0-9]` replaced by `-` (e.g. `/Users/x/.config/herdr-app` →
  `-Users-x--config-herdr-app`). Index file `MEMORY.md`.
- **Rationale**: matches every folder in `~/.claude/projects/` on this machine. Worktree folders
  (`-Users-…-herdr-worktrees-…`) exist for transcripts but none holds notes, while main checkouts do:
  Claude keys auto-memory by the repository root, so a worktree uses its main checkout's folder —
  the same project rule as `projectOf` (`--git-common-dir`).
- **Alternatives**: per-worktree memory (rejected: empty on disk); reading the transcripts (out of scope).

## R2. Note format

- **Decision**: parse a leading `---` … `---` header with `name:`, `description:` and `type:` either
  top-level or under `metadata:` (indented). Notes without a header get name = file stem, type
  `unknown`. New notes are written as:
  ```
  ---
  name: <name>
  description: <one line>
  metadata:
    type: <user|feedback|project|reference>
  ---

  <body>
  ```
- **Rationale**: the current Claude format (observed files carry `metadata.type`, plus extra keys such
  as `node_type`, `originSessionId`, which are kept untouched because edits save the whole text).
- **Alternatives**: a YAML library (rejected: no dependencies; the header is flat).

## R3. Index lines

- **Decision**: an index entry is any line containing a markdown link `[..](<file>.md)` whose target
  has no `/`. New line: `- [Title](file.md) — description`. Removing a note drops every line that
  links to that file; other lines (headings, blank, prose) are kept byte for byte.
- **Rationale**: matches the instruction Claude follows and the observed `MEMORY.md` files.

## R4. Listing and change detection

- **Decision**: one `find <dir> -maxdepth 1 -type f -name '*.md' -exec stat -f '%m %N' {} +` gives
  files and mtimes; texts are read with `readTextFile`. The tab refreshes from the mod's 5 s timer
  only while shown; it rereads texts only when the mtime list changed.
- **Rationale**: cheap (one process), no watcher lifetime to manage; `watchFolder` exists but its
  handle must be kept and cancelled per project — not worth it for a 5 s target.

## R5. Safe writes

- **Decision**: every write/delete path is built from the selected folder + a basename checked by
  `^[A-Za-z0-9][A-Za-z0-9._-]*\.md$`; `MEMORY.md` is written only by index operations. Updates use
  `writeTextFile(path, text, expected)` so a note Claude changed meanwhile is refused (FR-006).
  Delete: re-read note, `rm -f` the file, then rewrite the index with its lines removed (expected =
  index text just read).
- **Rationale**: FR-011 / SC-005; same stale-snapshot pattern as Skills (`writeSelection`).

## R6. Confirmation and unsaved edits

- **Decision**: in-tab two-step confirm (button turns into "Delete — confirm" for that note), like
  the reviewer Ask's "Send anyway". Switching to another note with unsaved edits shows a two-step
  "Discard changes?" the same way; no modal.
- **Rationale**: browser-style dialogs are not available; overlays on top of a dialog add frame rules.

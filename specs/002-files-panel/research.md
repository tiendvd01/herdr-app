# Research: Files Panel (as-built)

All unknowns resolved from the code; no NEEDS CLARIFICATION remain.

- **Decision**: Panel and viewer tab are one mod, switched by `props.file` (pinned) or `props.viewer` (diagram dialog).
  Rationale: share rendering and highlight code. Alternative: separate viewer mod (duplicates Markdown code, rejected).
- **Decision**: Follow the focused terminal's folder via `activePlace()`.
  Rationale: Constitution V; no per-space pin. Alternative: pinned folder (removed earlier).
- **Decision**: Files open in a new tab, not in the panel.
  Rationale: a narrow side panel is poor for reading; tab sits next to terminals. Alternative: inline preview with back arrow (code remains for the unpinned case but clicks go to tabs).
- **Decision**: Lazy per-folder listing via `sh` (`exec`, `on` for remote) with 500/5,000 caps.
  Rationale: big repos; remote support. Alternative: recursive walk (slow, unbounded).
- **Decision**: Git marks from `git status --porcelain` with `--no-optional-locks` and `core.fsmonitor=false`; ignored paths from `ls-files --ignored --directory`.
  Rationale: writing under `.git` would trigger the folder watch and loop.
- **Decision**: Refresh = `watchFolder` (local only) + 10 s timer.
  Rationale: remote has no watcher; timer is the fallback.
- **Decision**: Search by in-memory substring match over `git ls-files` (fallback `find`), loaded on first query; cmd-p uses `rg --files` + `fzf` instead.
  Rationale: panel search respects .gitignore and is instant after load; cmd-p must also browse arbitrary paths.
- **Decision**: Hand-kept Markdown scroll offset.
  Rationale: GPUI drops a scroll area's offset while the tab is hidden and no API reads it.
- **Decision**: Read-only view, edit via `nvim` tab.
  Rationale: avoids building an editor; Neovim exists.
- **Decision**: Icons follow VS Code Material Icon Theme precedence (path > name > longest extension).

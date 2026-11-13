# Research: Issues Panel

All unknowns resolved from the existing code; none remain.

## Decisions

1. **Repo detection from focused folder, no manual entry**
   - Decision: ask `gh repo view` in the space folder (trying each logged-in account); cache per folder.
   - Rationale: follows `cd` automatically, one rule shared by all panels (`docs/space-folder.md`).
   - Alternatives: typed `owner/repo` box (removed; error-prone), pinned per-space folder (removed).
2. **`gh` CLI as the only data source**
   - Rationale: reuses the user's auth; no token handling or HTTP client in a mod.
   - Alternatives: GitHub REST/GraphQL directly (needs tokens, more code).
3. **Account by repo owner (`lib/gh-account.js`)**
   - Rationale: personal repos need the personal login, org repos the work login; token read inside the shell so it stays out of process lists; never switch the active account.
   - Alternatives: `gh auth switch` (global side effect, races with other panels).
4. **Stale-while-revalidate cache** (memory + `data/issues/cache.json`, saved every 5 s when dirty, trimmed to 60 lists and 300 issues; FRESH 60 s)
   - Rationale: gh calls take seconds; instant display after restart.
   - Alternatives: no cache (slow), cache without revalidation (stale).
5. **Growing `--limit` paging (30 per page)**
   - Rationale: `gh issue list` has no cursor; a virtual list with fixed row height knows where the end is. Hover prefetch dropped because virtual rows cannot hold handlers.
6. **In-flight guard with STUCK timeout (45 s vs gh 30 s)**
   - Rationale: a lost task must not block a key forever.
7. **Shared list key across spaces**
   - Rationale: worktree spaces on one repo should update together.
8. **State per space in `localStorage` key `spaces`; fold state in memory only**
   - Rationale: matches the constitution's per-space rule; fold state is cheap to lose.
9. **Markdown, mermaid and code highlighting from shared `lib/`**
   - Rationale: one implementation for Issues, Files and Mermaid board (constitution II); mermaid drawn by `mmdc` through `zsh -ilc` to find nvm node; PNG cache in `mods/issues/.diagrams/` (gitignored).
10. **AI summary as detached `claude -p --model haiku` job**
    - Rationale: `exec` is limited to 30 s; a `nohup` job polled via a `.done` file (max 180 s) survives; flags (no tools, no session persistence, no settings) keep it cheap and isolated; issue text wrapped as data to resist prompt injection.
    - Storage outside the repo at `~/.herdr/issue-summaries/summaries.json`; version hash of body + visible comments detects outdated.
    - Alternatives: running in the foreground (times out), storing in the repo (pollution).
11. **Read-only**
    - Rationale: closing/editing is done on the web; keeps the panel simple and safe.

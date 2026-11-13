# Research: Changes Panel (as-built)

All unknowns resolved from `mods/reviewer/` and `docs/mods/reviewer.md`; no NEEDS CLARIFICATION remains.

## Decisions

**D1. Dialog clone of the shipped `changes` mod**
- Decision: keep `reviewer` as a personal clone (from `changes` 0.1.8), opened as an overlay dialog (90% of window, `place: none`).
- Rationale: Constitution I forbids editing shipped mods; a dialog gives room for list plus diff.
- Alternatives: dock as a right-panel stack child (the earlier layout; too narrow for diff review); edit the shipped mod (lost on update).

**D2. One mod, two overlays**
- Decision: the same mod also serves the send dialog (`dialog.js`) when opened with `props.dialog`.
- Rationale: a mod can only import its own folder; avoids a second mod and shares panel UI.
- Alternatives: separate mod (duplicate `panel-ui.js` sync); inline composer in the panel (cannot pick agents).

**D3. Git via `exec`, read-only flags**
- Decision: all automatic reads run `git` with `--no-optional-locks`, `core.fsmonitor=false`, `diff.autoRefreshIndex=false`; clicked actions (`add -A`, `commit`) run plain.
- Rationale: an agent's commit may need `index.lock` at the same moment.
- Alternatives: libgit bindings (not available to mods); polling `git status` normally (lock contention).

**D4. Scopes as refs**
- Decision: scope is mapped to a diff ref: `HEAD`, `HEAD~1`, merge base with the base branch, or `[parent, sha]` for a commit (empty tree for a root).
- Base: `props.base`, else `origin/HEAD`, else `main`, else `master`.
- Rationale: mirrors a PR's Files changed; unavailable scopes fall back to Uncommitted.
- Alternatives: user-typed refs (more UI, rarely needed).

**D5. Refresh strategy**
- Decision: initial refresh, a 10 s `cx.timer.every`, plus `watchFolder` on local repos; refreshes skip when one is running; results for an abandoned context are discarded.
- Rationale: Constitution IV forbids `setInterval`; remote repos cannot be watched.
- Alternatives: timer only (slow); render-driven refresh (render loops).

**D6. Drafts in shared state, view prefs in localStorage**
- Decision: drafts, sent marker and per-repo scope are shared keys (`reviewer.drafts`, `reviewer.sent`, `reviewer.scope`); Tree, Split and diff-collapsed are `localStorage` key `view`.
- Rationale: the send dialog is another view instance and must signal back through shared state; drafts must survive close and reopen.
- Alternatives: all in `localStorage` (the dialog copy cannot be notified); files on disk (needless).

**D7. Review as one message through `hc send`**
- Decision: all comments formatted into one text, shown read-only in the send dialog, sent with `hc send`, `--force` when the agent is busy after confirmation; with no agent a new tab starts the first installed known agent.
- Rationale: agents receive context in one turn; the person stays in control of a busy agent.
- Alternatives: one message per comment (noisy); writing a file (agent must be told to read it).

**D8. Comment box floats**
- Decision: a card over the diff's top-right (a strip when narrower than 600 px); list rows never hold inputs.
- Rationale: virtual list rows may not host input; floating avoids row jumps.

**D9. Limits**
- Decision: 1,000 files, 1,500 diff lines, 4,000 chars per line, 400 KB text for untracked files, 400 quoted rows, 30 commits.
- Rationale: keep the virtual list and git output responsive.

**D10. Shared code from `lib/`**
- Decision: `panel-ui.js` and `space-folder.js` in the mod are generated copies (Constitution II, V).
- Rationale: one look and one folder rule across panels.

## Open items

None. Noted but out of scope: `highlight.js` language coverage and `palette.js` colours were not audited line by line.

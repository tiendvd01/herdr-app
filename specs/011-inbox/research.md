# Research: Inbox

No NEEDS CLARIFICATION remain. Decisions reflect the as-built code.

- **Agent events from `agents()` at render time**. Rationale: the app already holds live status; no fetching, so no notify needed. Alternative: polling a CLI; rejected (slower, redundant). First render only records baseline so startup is quiet.
- **One entry per agent/PR (key `agent:<address>` / `pr:<url>`)**. Rationale: avoids a log of repeated noise; new events rewrite and resurface. Alternative: append-only feed; rejected as too noisy.
- **PR watching by polling `gh`** (list every 5 min, per-PR every 2 min, 4 in parallel). Rationale: no webhooks available locally; limits API use. Alternative: webhooks/notifications API; rejected (needs server or token scope).
- **Diff against persisted snapshots (`prs`)**. Rationale: restart must not re-report; first sighting is silent. Alternative: in-memory only; rejected (duplicates after restart).
- **Count only others' comments in unresolved, non-outdated threads, and others' latest reviews**. Rationale: own actions are not news.
- **Per-event `badge` stored explicitly**. Rationale: do not infer meaning from text. Legacy entries fall back to tone.
- **Go-to-PR via shared value `pr-flow.goto` after a 600 ms wait on space switch**. Rationale: `my-tabs` restores the space's own panel right after a switch; opening earlier would be overwritten. pr-flow ignores requests older than 30 s.
- **Repo to space matching via `git remote get-url origin` of each space's folder** (cached per machine:folder), current space first. Fallback: stay in the current space.
- **Reuse `pr-gh.js` and `pr-status.js` through sync**. Rationale: constitution II; same CI logic as pr-flow.
- **Narrow mode (sidebar < 160 px) collapses to an icon with badge**. Rationale: alerts must survive a collapsed sidebar.
- **Toasts for PR events only**; agents are already visible in the Agents sidebar.

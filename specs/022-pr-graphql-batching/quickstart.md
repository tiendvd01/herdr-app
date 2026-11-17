# Quickstart: verify 022

1. `bash scripts/sync-github-lib.sh`, then `herdr-app check mods/pr-flow` and `herdr-app check mods/inbox` pass.
2. Shape: in a scratch node script, import `lib/pr-gh.js` with a `child_process` exec, `readPrs` one PR and compare keys and values with `gh pr view <n> --json <PR_FIELDS>` (ignoring the gh-only extras of research R2).
3. Partial: `readPrs(repo, [real, 99999999])` returns data for the real one and `{error}` for the other.
4. Timing: `time` the old pair (`gh pr view` + threads query) against one `readPrs` of the same PR.
5. In the app: open Pull requests; chips show both counts; open a PR: detail view unchanged; `herdr-app shot` to look.
6. With an agent on a branch with an open PR: its card appears within a round.

## Results (2026-11-17, cli/cli)

- Checks pass for pr-flow and inbox.
- Shape: `readPrs` vs `gh pr view` on #15064: all fields equal except gh-only extras (`author.is_bot`, `app/` bot login prefix, review `id/body/...`, check `workflowName`), none read by the mods; 30/30 checks and reviews equal after normalising key order.
- Partial: `readPrs([15064, 99999999])` gives data for the first and `{ error: 'Could not resolve to a PullRequest…' }` for the second.
- Timing, one PR: old pair (in parallel) 1.3–1.7 s, new single query 1.6–2.5 s (first run cold); six PRs in one query 2.2–2.7 s (before: 12 gh processes).
- Tracker round, 5 agent branches (4 with PRs), no list view: 2 gh calls (one lookup, one read) instead of ~14. With the list view on the same repo: lookup + counts + page = 3 calls; the agents' PRs take the page's row data, and the full read follows when the PR is opened (spec 019's partial rule).
- App: Pull requests dialog shows Open 0 / Merged 1 from one count query; empty state for 0 without a list call.

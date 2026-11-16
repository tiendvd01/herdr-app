# Quickstart: verify

1. `scripts/sync-github-lib.sh` then `herdr-app check mods/pr-flow` and `herdr-app check mods/inbox` pass.
2. Focus a terminal in a repo with more than 20 open PRs. Open Pull requests (tab bar), pick All · Open.
   - Header shows `20 / N`, chip Open shows N; 20 rows appeared together.
   - Scroll to the end: "Loading more…", then 20 more; repeat until N; no loading row after.
3. Pick Merged with 0 merged PRs (or a fresh repo): empty state at once.
4. Pick Mine: only your PRs of this repo.
5. Open → Merged → Open: Open rows show at once.
6. Open a listed PR: detail shows files and comments (full refresh on open).
7. `herdr-app shot` to look at the list.

# Research: Pull requests list paging, count first

## R1. Where a page comes from

- **Decision**: one GraphQL `search(type: ISSUE)` call per page with cursor paging (`first`, `after`),
  query `repo:<repo> is:pr is:open|is:merged [author:a author:b …] sort:updated-desc`. Each node carries
  everything a row needs: PR fields (state, draft, review decision, mergeable, merge state, size, times,
  author, merge commit), `latestReviews`, the last commit's `statusCheckRollup` contexts and
  `committedDate`, `reviewThreads { isResolved isOutdated }` and `closingIssuesReferences`.
- **Rationale**: today a page costs 2 calls per PR (`gh pr view` + threads GraphQL). One search call
  returns a page with all row facts, so rows appear together. Cursor paging fetches only the new page
  (Issues re-asks a growing `--limit`).
- **Alternatives**: `gh pr list --limit N --json …` (no threads / linked issues, re-fetches all rows on each
  page, no cursor); keep per-PR fetch but draw placeholders (still 2 × N calls).
- **Measured**: `cli/cli` open PRs, 30 per page with check rollups: ~10 s. Page size set to **20**.

## R2. Count first

- **Decision**: REST `search/issues?q=<same query without sort>&per_page=1` → `total_count`, one call per
  view, cached 60 s per (repo, state, scope). The page loader awaits it before the first page; 0 skips the
  page call. A failed count leaves total unknown and paging falls back to `hasNextPage`.
- **Rationale**: user asked for it; cheapest call; the chips already use it.
- **Mine with several accounts**: GitHub search ORs repeated `author:` qualifiers (checked:
  `author:williammartin` 241 + `author:BagToad` 225 = both 466 on `cli/cli`). So Mine is one count call and
  one page query with every login, instead of one call per login.

## R3. What stays per-PR

- Opening a PR refreshes it fully (`fetchPr` + `fetchThreads`): the detail needs `files`, `body` and thread
  comments the page query leaves out.
- PRs on an agent's branch keep today's discovery and polling.
- Merged rows get Actions flow data only when merged in the last 24 hours, in the background, 8 per tick (a busy repo merged 38 PRs in 3 days; flow lines on older merges are
  "done" and cost 1–2 calls per row).

## R4. Freshness

- A view reloads (count, then the loaded pages again from the start) every 2 minutes while shown, on
  Refresh, and when picked after more than 2 minutes. Rows of listed PRs are no longer polled one by one.
- `prune()` keeps PRs the loaded view lists (merged ones older than 30 days used to be dropped).

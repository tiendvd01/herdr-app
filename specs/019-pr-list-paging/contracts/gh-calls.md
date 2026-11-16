# Contract: `lib/pr-gh.js` additions

## `viewQuery(repo, state, logins)` → string

`repo:<repo> is:pr is:open|is:merged` plus ` author:<login>` for each login (Mine), no sort.

## `count(repo, state, logins)` → Promise<number>

One REST search call, `total_count`. Replaces the old `count(repo, state, scope)` (which looked up logins
itself, one call per account). `logins` null/empty = everyone.

## `page(repo, state, logins, after, first = 20)` → Promise<{ total, cursor, next, prs }>

One GraphQL search call, query `viewQuery(...) sort:updated-desc`. Each of `prs` is
`{ url, pr, threads, issues, headCommittedAt }` where `pr` has the shape of `fetchPr` minus `files` and `body`
(`statusCheckRollup` is the contexts list, `latestReviews` a list), `threads` are `{ isResolved, isOutdated }`.

Run as the repo's gh account (`accounts.run` with `-R`-free args picks by owner from the query: the call
passes the repo explicitly).

## Tracker API changes (`mods/pr-flow/tracker.js`)

- `setView({ repo, state, scope })`
- `hasMore()`, `loadMore()` → Promise (fetch next page)
- `total(state)` → number | null, `ensureCount(state)` → Promise
- `viewState()` → `{ loading, loaded, error, total }`, `viewStale()`, `countStale(state)`, `focus(url)`, `isPartial(url)`

# Contract: lib/pr-gh.js (changes)

Added:
- `discoverMany(repo, branches: string[], since: ms) → Promise<{ found: Map<branch, url>, failed: Map<branch, error> }>` — open PR, else merged after `since`; a branch with neither is in no map. Never throws: a failed request fails only its chunk's branches, an alias error only its branch (review fix).
- `readPrs(repo, numbers: number[]) → Promise<Map<number, PrRead | { error: string }>>` — chunks of 10, run in sequence per repo.
- `counts(repo, logins | null) → Promise<{ open, merged }>`.

Changed:
- `page(...)` goes through the same `graphql` helper (one error path); throws only when `search` is missing.

Removed (no callers left): `discover`, `discoverMerged`, `count`, `fetchPr`, and after review `fetchThreads` / `THREADS_QUERY` (the diff view reads its threads with `readPrs`, as the repo's gh account) and `json2`.

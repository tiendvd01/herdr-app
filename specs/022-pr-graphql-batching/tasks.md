# Tasks: Fewer, combined GitHub calls for pull requests

**Input**: Design documents from `specs/022-pr-graphql-batching/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pr-gh.md

No automated tests (repo has none); verification per quickstart.md.

## Phase 1: Setup

- [X] T001 Capture a baseline: `gh pr view <n> --json <PR_FIELDS>` plus the threads query for one real PR, saved to the scratchpad, for the shape diff in T013

## Phase 2: Foundational

- [X] T002 Add `graphql(repo, query, vars)` to `lib/pr-gh.js`: runs `gh api graphql` as the repo's account (`accounts.gh`), strings with `-f`, numbers with `-F`; parses stdout whatever the exit code; throws when there is no JSON or `data` is null; returns `{ data, errors: Map<alias, message> }` keyed by `path[1]` (research R1)
- [X] T003 Add `fullNode(n)` to `lib/pr-gh.js`: `pageNode` plus `body`, `files.nodes`, threads with comments, in the `gh pr view --json PR_FIELDS` shape (data-model PrRead)

## Phase 3: User Story 1 - Agent branches checked in one go (P1)

**Independent test**: one round with several agents in one repo makes one lookup; their PRs appear.

- [X] T004 [US1] Add `discoverMany(repo, branches, since)` to `lib/pr-gh.js`: aliases `b0..b19` over `pullRequests(headRefName, states:[OPEN,MERGED], first:5, orderBy UPDATED_AT DESC)`, chunks of 20, returns `Map<branch, url>` (first OPEN, else newest MERGED with `mergedAt > since`); remove `discover` and `discoverMerged`
- [X] T005 [US1] In `mods/pr-flow/tracker.js`, replace per-agent `discover` with a per-repo pass: filter due branches (same wait rules), group by repo, one `gh.discoverMany` per repo (in batches of CONCURRENCY), `track(url, branch)` for hits; no refresh here (the round's batched refresh picks up new entries)

## Phase 4: User Story 2 - A PR read in one request, several at once (P1)

**Independent test**: open a PR: one request; detail view unchanged. Several due PRs: one request per 10.

- [X] T006 [US2] Add `readPrs(repo, numbers)` to `lib/pr-gh.js`: query with `$owner,$name,$n0..$n9` and aliases `p0..p9` of the full PR fields (checks first:100, files first:100, threads first:100 with comments first:20, reviews first:20, closing issues first:10, last commit time); chunks of 10 in sequence; returns `Map<number, {pr, threads, issues, headCommittedAt} | {error}>`; a failed request maps every number of its chunk to `{error}`; remove `fetchPr`
- [X] T007 [US2] In `mods/pr-flow/tracker.js`, add `refreshMany(urls)`: group by repo, `gh.readPrs` per repo (repos in batches of CONCURRENCY), `absorb` each hit, keep last data + set `error` for misses, `refreshFlow` for merged ones, then `prune` and save; `refresh(url)` becomes `refreshMany([url])`; `tick` and `refreshAll` call `refreshMany(due)`
- [X] T008 [US2] In `mods/inbox/main.js` `pollPrs`, read due URLs with `gh.readPrs` grouped by repo (via `parsePrUrl`) instead of `fetchPr` + `fetchThreads` per URL; `takePr(url, pr, extra)` unchanged

## Phase 5: User Story 3 - Open and Merged counts in one request (P2)

**Independent test**: open the list: both chips filled after one request.

- [X] T009 [US3] Add `counts(repo, logins)` to `lib/pr-gh.js`: `o`/`m` aliases of `search(query, type:ISSUE, first:0){issueCount}` with queries from `viewQuery` as variables; remove `count`
- [X] T010 [US3] In `mods/pr-flow/tracker.js` `ensureCount`, fetch through one shared in-flight promise per `repo|scope` that sets both the open and merged count entries

## Phase 6: Polish

- [X] T011 Run `bash scripts/sync-github-lib.sh`; `herdr-app check mods/pr-flow` and `herdr-app check mods/inbox` pass; no other consumer of the removed functions (`rg`)
- [X] T012 Update CLAUDE.md pr-flow note: counts are one GraphQL query for both chips; agent branches looked up per repo in one query; PR reads one query each, batched per repo (spec 022)
- [X] T013 Verify per quickstart.md: shape diff against T001, partial error, timing old vs new, app screenshot of list + detail; record results in quickstart.md; set spec Status to Implemented

## Dependencies

- T002, T003 before all stories. US1 (T004–T005), US2 (T006–T008), US3 (T009–T010) are independent of each other but all edit `lib/pr-gh.js` and US1/US2/US3 edit `tracker.js`, so run in sequence.
- T011–T013 last.

## Parallel opportunities

- T008 (inbox) can run alongside T007 (tracker) once T006 is done.

## Implementation strategy

MVP is US2 (largest, used by both mods), but the order US1 → US2 → US3 is kept since US1's "no refresh in discovery" relies on US2's batched refresh being in the same round (it also works with the old per-URL refresh).

## Phase 7: Review fixes (2026-11-17)

- [X] T014 `discoverMany`: open and merged as separate aliases (`oN`/`mN`); returns `{ found, failed }`, a failed chunk or alias fails only its branches
- [X] T015 Tracker `discoverAll`: failed branches set `lastError` and are retried after DISCOVER_WORKING_MS
- [X] T016 Tracker `refreshMany`: `refreshing` is a per-url counter released before `refreshFlow`; `lastError` = first error of the round (a later success no longer clears it)
- [X] T017 `page()` uses the `graphql` helper; `json2`, `fetchThreads`, `THREADS_QUERY` removed; pr-flow's diff view reads threads with `readPrs`
- [X] T018 Tests: `tests/pr-gh.test.mjs` (discoverMany, readPrs, counts, page with a fake gh), `tests/tracker.test.mjs` (retry, error kept, overlapping reads)

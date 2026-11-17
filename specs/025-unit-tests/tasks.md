# Tasks: Unit tests (spec 025)

- [x] T001 tests/setup.mjs + tests/herdr-stub.mjs
- [x] T002 [P] tests/github.test.mjs (parseRemoteUrl, githubRepo, repoFromRemote, parsePrUrl)
- [x] T003 [P] tests/gh-account.test.mjs (repoOfRef, repoInArgs)
- [x] T004 [P] tests/pr-gh.test.mjs (cleanRunLog, runIdFromUrl, viewQuery)
- [x] T005 [P] tests/pr-status.test.mjs (checkState, prState order)
- [x] T006 [P] tests/ports.test.mjs (listListeners/listWorktrees with fake exec, assign, shortHome)
- [x] T007 [US2] tests/space-folder.test.mjs (stubbed herdr)
- [x] T008 tests/check-dialog-frames.test.mjs (tmp fixtures)
- [x] T009 CLAUDE.md: command + rules; run suite, break one function on purpose, confirm failure
- [x] T010 tests/pr-gh.test.mjs: discoverMany, readPrs, counts, page (fake `gh api graphql`)
- [x] T011 tests/tracker.test.mjs: discovery retry, error kept across a round, overlapping refreshes
- [x] T012 tests/project-skills.test.mjs: agentArgv

## Phase 1: Convergence

- [x] T013 Correct plan.md's herdr stub line to the real mechanism (`stub({...})` exported by tests/herdr-stub.mjs, state kept in the module, not `globalThis.herdrStub`) per plan: herdr stub decision (contradicts)

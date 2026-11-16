---
name: delivery-dev-implement
description: "Phase 8 of delivery-dev — execute an approved implementation plan with minimal, in-scope changes, reusing existing repository patterns, then self-review the diff and run the tests, tracking progress, deviations, decisions and traceability in implementation.md. Also runs the fix loop after an AI code review returns CHANGES_REQUIRED. Use after the plan gate is READY, or when resuming a partially implemented issue task."
---

# Devflow · Phase 8 — Implementation (+ Self Review + Test)

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/supporting-artifacts.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** `plan.md` (`READY`) + `context.md` + `traceability.md` · **Out:** code + `10-implementation.md` (+ `08-traceability.md`, `90-decisions.md`, `17-learnings.md`) · **State:** `IMPLEMENTING → SELF_REVIEW → TESTING`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> implement` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Implement the approved plan — nothing more — then check your own diff and run the tests before handing it to `delivery-dev-review`.

Gate in: `plan.md` says `READY`; every risk flagged in §11 accepted; and if `HUMAN_APPROVAL` was routed, `status.md` says `APPROVAL_STATUS: APPROVED`. `PENDING` ⇒ do not write code.

**Resuming:** read `implementation.md` and continue from the first step that is not `DONE`. Do not redo finished steps, do not re-run finished investigation.

## Branch & commits

Before touching a file, make sure you are **not on a shared branch** — any branch in `context.md` Repo Facts → Shared branches (typically `main`/`master` **and** `develop`/`dev`), not just the default one:

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null   # upstream của nhánh hiện tại
git status --short
```

- On a shared branch, or the working tree already dirty with unrelated work ⇒ stop and sort that out first.
- **Upstream pointing at a shared branch** (`@{u}` = `origin/develop`/`origin/main`) ⇒ `git push` and GUI clients will default to pushing your commits straight onto it. Detach now: `git branch --unset-upstream`. First push is the developer's: `git push -u origin <feature-branch>`.
- Creating the branch yourself: `git switch -c <branch> --no-track <base>` (base = Repo Facts → Base branch).

Branch name follows the repo convention (`context.md`, `CONTRIBUTING.md`, `.claude/rules/git-commit.md`); the usual shape is `<type>/<issue-number>-<slug>` — `feature/1234-payment-retry`, `fix/1234-timeout`.

Commits go through the **`delivery-dev-commit` skill** — it creates the branch when needed, stages specific files, writes a Conventional Commit in English, and never pushes. Do not hand-roll commit messages here.

Commit rhythm: one commit per plan step, or per coherent group of steps. Never one bulk commit at the end, never a commit mixing a fix with an unrelated refactor. Fix-loop steps (`F1`, `F2`) get their own commits referencing the defect/finding id.

**Never `git push` in this phase**, never `--no-verify`, never `git add -A`.

## Rules

1. Follow the plan, step by step, in the stated order.
2. Reuse the existing pattern identified in `investigation.md`; obey the conventions in `context.md`.
3. Do not introduce unnecessary dependencies.
4. Do not refactor unrelated code.
5. Stay inside `plan.md` §2 Scope. Do not change behavior outside the issue scope unless the issue requires it.
6. Keep changes minimal.
7. Preserve backward compatibility unless the issue explicitly requires a break.
8. Implement against the **original** requirement, not the Vietnamese translation.
9. Update `traceability.md` as each step lands: fill `Code` with what actually changed and `Test` with the covering test → `TRACEABILITY_STATUS: UPDATED`.
10. **Update the docs the change makes stale** — see below.
11. Log a materially significant decision in `decisions.md` (id `D00x`) and reference the id from the step — do not re-argue it inline.

## Docs & ADR

A change that leaves the project's own documentation wrong is not done. Check what the repo actually keeps (recorded in `context.md`):

| Repo has | Update when |
|---|---|
| `docs/features/` or equivalent spec dir | the feature's behavior changed or a new one landed |
| `docs/decisions/` · `docs/adr/` (`NNNN-title.md`) | `solution.md` settled a material architecture decision — **promote it to an ADR** (use the repo's `write-adr` skill if it has one); the ADR is the durable home, the private vault task dir is not |
| `README` · `CLAUDE.md` · `AGENTS.md` architecture index | routes, models, tables, pages, commands, or config changed |
| API docs / OpenAPI | the contract changed |

Doc edits belong **in this PR**, in their own commit (`docs: …`). Nothing to update ⇒ say so once; do not invent a doc change to look thorough.

## Migration / seed xuất hiện giữa chừng

Một step cần thêm/sửa migration, seed, reference data hay state machine dùng chung mà plan §5 ghi `None` ⇒ **dừng trước khi commit step đó**: cập nhật plan §5, chạy lại `delivery-dev-classify` (sửa `## Roles` + `## Phases`, conventions §3), re-approve nếu route có human approval. Rồi mới commit. `delivery-dev-gate.sh test|review|verify|pr` sẽ fail nếu bỏ bước này.

## Out-of-Scope Discovery

Found an unrelated problem? **Do not silently fix it.**

```text
Phát hiện vấn đề ngoài scope: <what, where — file:line>.
Nằm ngoài phạm vi issue #<id>.
Đề xuất: tạo issue riêng.
```

Record it under `## Out of Scope Found`, then continue the current issue.

## When the plan turns out wrong

```text
STOP
↓ explain why, in Vietnamese, with the evidence that contradicts the plan
↓ update solution.md / plan.md + log the change in decisions.md
↓ re-approve if the change is material (architecture · DB · API · security · behavior)
↓ note it under Deviations
↓ continue only after that
```

Never diverge from the approved plan or solution silently.

## Frontend: xem mockup thật

Step nào làm UI ⇒ trước khi viết, mở mockup bằng skill `find-mockup-repo` (hoặc dùng đường dẫn đã ghi trong `05-investigation.md`) và code theo đúng layout, label, trạng thái đã duyệt. Khác mockup có chủ đích ⇒ ghi vào *Deviations from Plan*.

## Self Review (before tests)

Read your own diff — `git diff` / `git diff --staged` — and check:

```text
[ ] Every plan step actually implemented (no forgotten step)
[ ] Diff contains no file outside the plan
[ ] No debug print / commented-out code / leftover TODO
[ ] No secret, token or credential in the diff
[ ] Error paths handled, not just the happy path
[ ] Naming and layering match context.md
[ ] Comments follow the repo convention (context.md): the mandated language (e.g. English keeping only domain keywords verbatim), and NO bare requirement-ID citation — cite `<committed-path> (ID)` or spell the rule out, never a dangling `AC-007` / `AC-007〜010` (an ID resolving only to an external/wiki spec is still dangling — point to the committed mirror or spell it out); cite sparingly
[ ] Tests added or updated for each step that needs one
```

Fix what you find here — that is cheaper than the review loop. Record the outcome in `## Self Review`.

## Test Run (dev level only)

Run what a developer runs before handing over: the unit tests you wrote for these steps, the existing suite, plus lint / typecheck / build where the repo has them. Record the **actual** commands and results.

This is **not** the QC pass. Designing cases from the AC, test data, environment, defect log and regression belong to `delivery-dev-test` (phase 9) — do not duplicate them here, and do not skip that phase because "tests passed".

A test that cannot run is `NOT_RUN` **plus the reason**. Never write a result you did not observe.

## Template

```md
# Implementation

## Step 1 — <name>

Status: DONE | IN_PROGRESS | BLOCKED

Changes:
- ...

Files:
- `path/to/file`

Covers: AC-1 / R1
Decision: D001 (nếu có)

## Step 2 — <name>

Status: IN_PROGRESS
...

## Deviations from Plan
- <what changed vs plan.md, và vì sao> (hoặc: None)

## Out of Scope Found
- <vấn đề, file:line> → đề xuất issue riêng (hoặc: None)

## Self Review

- [x] Every plan step implemented
- [x] No file outside the plan
- [x] No debug code / secret
- [ ] <finding + đã fix thế nào>

## Test Run

- `<command>` → PASS (<n passed>)
- `<command>` → FAIL: <lỗi thật>
- `<command>` → NOT_RUN (reason)

## Notes
- ...

---

IMPLEMENTATION_STATUS: IN_PROGRESS | SELF_REVIEW | TESTING | DONE
```

Update the step status as you go, not in one batch at the end — this is what makes a resume correct.

## Fix Loop (test defect or review finding)

`tests.md` → `TEST_STATUS: FAILED` or `review.md` → `CHANGES_REQUIRED` puts state at `FIXING`. Then:

1. Add each fix as a new step (`Step F1 — fix D1` / `fix [C1]`), carrying the defect or finding id.
2. Fix only what was flagged plus what it breaks.
3. Re-run the dev-level tests on the new state.
4. Hand back: a **test defect** → `delivery-dev-test` retests it (`RETEST → CLOSED`) + regression, then review. A **review finding** whose fix changes behavior → `delivery-dev-test` re-runs the affected cases + regression first (update `TESTED_SHA`), **then** `delivery-dev-review` re-reads the delta. A fix that is comment/doc only → straight back to review.

Never mark a finding fixed without the code change to show for it.

**Any commit added after `review.md` is `APPROVED`** — a review fix, a polish pass, or a fresh developer request — makes everything after `REVIEWED_SHA` **unreviewed**. Re-run `delivery-dev-review` on that delta (`git range-diff` if you rebased) and update `REVIEWED_SHA`; the old `APPROVED` never blankets patches that came after it (`conventions.md` §3). This is the snapshot gap that lets an unreviewed change ride to the PR.

## Gate Out

All steps `DONE` · self review recorded · unit tests run (results recorded honestly) · deviations recorded · `traceability.md` updated · no unrelated file in the diff → `IMPLEMENTATION_STATUS: DONE`, continue to `delivery-dev-test` (or straight to `delivery-dev-review` when the route has no `test` — DOCUMENTATION/typo).

Never jump straight to `delivery-dev-verify` — the QC pass (phase 9) and the code review (phase 10) sit between them.

## Report

Phase summary: steps done, files changed, self-review findings, unit-test results as observed, deviations, out-of-scope discoveries, next = test design & execution.

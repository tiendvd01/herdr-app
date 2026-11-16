# Devflow — Shared Conventions

Rules every `delivery-dev-*` phase obeys. Read this before running any phase.
Templates for the cross-cutting artifacts (`traceability.md`, `decisions.md`, `learnings.md`) live in `supporting-artifacts.md` next to this file.

## 1. Task Workspace

One issue = one directory **in the SoraVaults Obsidian vault**, outside the repo (`../../delivery-start/references/luat-chung.md` §6):

```text
~/Documents/SoraTech/SoraVaults/<project>/issue <issue-number>/
```

```bash
T=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue 1234")   # resolves <project>, creates the dir
ls "$T"
```

- `<project>` = the vault folder whose name starts with the repo's project code (`168-yahagi-panwall` → `168-yahagi/`), else the repo directory name. Always resolve it with the script, never guess.
- The name contains a **space** — always quote the path in shell (`"$T"/*plan.md`).
- No slug in the name: exactly `issue <n>`. A PR with no linked issue uses `pr <n>/`.
- Never create task artifacts outside this directory unless the developer explicitly asks. Throwaway probe output and scratch scripts still go to the session scratchpad.
- Never create a second directory for an issue that already has one. Reuse `issue <n>/` if it exists.
- **Legacy in-repo directories** (`tasks/<n>-*/`, `tasks/#<n>/`) are read-only context: read them if present, keep writing in the vault, and say so. Move them into the vault only when the developer asks.
- The vault is private to this developer: never link or cite a vault file in a PR, issue or comment — put what reviewers need into the PR / comment / ADR itself.

## 2. Artifacts

**Filenames carry a two-digit workflow-order prefix** so the directory reads in the order the work happened, instead of alphabetically. Each file answers a different question — never duplicate content across them, reference instead (`xem 05-investigation.md §3`, `theo D002`, `AC-2`).

```text
~/Documents/SoraTech/SoraVaults/<project>/issue <issue-number>/
├── 00-original.md          # Issue nói gì?                    delivery-dev-intake
├── 01-context.md           # Rule/context nào của project?    delivery-dev-context
├── 02-status.md            # Route plan + state hiện tại      delivery-dev-classify (living)
├── 03-understanding.md     # Issue nghĩa là gì?               delivery-dev-understand
├── 04-baseline.md          # Hiện tại nó sai/chậm ra sao?     delivery-dev-investigate (conditional)
├── 05-investigation.md     # Hệ thống hiện chạy thế nào?      delivery-dev-investigate
├── 06-impact.md            # Thay đổi này đụng tới đâu?       delivery-dev-investigate (conditional)
├── 07-solution.md          # Nên giải thế nào?                delivery-dev-solution    (conditional)
├── 08-traceability.md      # Mọi requirement có code + test?  solution → implement → verify (living)
├── 09-plan.md              # Sẽ sửa chính xác cái gì?         delivery-dev-plan
├── 10-implementation.md    # Thực tế đã đổi gì?               delivery-dev-implement
├── 11-tests.md             # Chứng minh nó chạy đúng ra sao?  delivery-dev-test
├── 12-review.md            # Tìm thấy vấn đề gì?              delivery-dev-review
├── 13-verification.md      # Có thoả requirement không?       delivery-dev-verify
├── 14-operational-check.md # Deploy/vận hành có an toàn?      delivery-dev-operate     (conditional)
├── 15-pr.md                # Truyền đạt thay đổi thế nào?     delivery-dev-pr
├── 16-followup.md          # PR mở rồi thì xảy ra gì?         delivery-dev-followup    (conditional)
├── 17-learnings.md         # Dev nên nhớ gì?                  delivery-dev-learn       (conditional)
├── 18-feedback.md          # Rút ra rule dùng lại được nào?   delivery-dev-learn       (conditional)
└── 90-decisions.md         # Vì sao chọn cách này?            mọi phase (living)
```

### Naming rule

- Prefix is **workflow order**, not the phase index — one phase can produce several artifacts (investigate → `04`,`05`,`06`; solution → `07`,`08`).
- `90-` is for the cross-cutting living file that belongs to no single phase, so it sorts last.
- A number is **never reused or renumbered.** A phase that is routed out simply leaves a gap — the gap is information.
- **Throughout these skills an artifact is called by its bare name** (`plan.md`, `review.md`). On disk it carries the prefix. Resolve with a glob, never an exact bare path:

  ```bash
  ls "$T"/*plan.md                 # khớp cả 09-plan.md lẫn plan.md (task cũ)
  grep -H '_STATUS:' "$T"/*.md
  ```

- **Task directories created before this rule keep their unnumbered names.** Read both shapes; never rename someone's in-flight task directory on your own. Asked to renumber one, do it with `mv` per file against the table above, e.g.:

  ```bash
  cd "$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue 86")"
  mv original.md 00-original.md
  mv context.md  01-context.md
  mv status.md   02-status.md
  # …theo đúng bảng trên, chỉ những file thực sự tồn tại
  ```

Files are created progressively, when their phase starts. **Never create an empty or fake file to complete the structure.** A simple issue produces few files — that is correct, not sloppy.

**Evidence that is not a phase artifact** (HTTP transcripts, e2e logs, screenshots, wiki diffs, probe output) goes in `evidence/` inside the task directory — `evidence/e2e-http.md`, `evidence/wiki-delta.md` — and the artifact that relies on it links there. Never mint a new numbered file for it: `12-e2e-evidence.md` collides with `12-review.md` and breaks the glob `*review.md`.

## 3. State Machine

```text
ISSUE_RECEIVED → CONTEXT_LOADED → CLASSIFIED
 → UNDERSTANDING → UNDERSTANDING_GATE
 → REPRODUCING*                      → INVESTIGATING → ROOT_CAUSE_ANALYSIS*
 → IMPACT_ANALYSIS* → SOLUTION_DESIGN* → ROLE_REVIEW* → TRACEABILITY*
 → PLANNING → PLAN_GATE → HUMAN_APPROVAL*
 → IMPLEMENTING → SELF_REVIEW → TESTING
 → TEST_DESIGN → TEST_EXECUTION
 → SPECIALIST_REVIEW* → FIXING
 → FINAL_VERIFICATION → OPERATIONAL_CHECK*
 → PR_READY → PR_OPEN → [CI_FAILING | CHANGES_REQUESTED → FIXING] → MERGED → DONE
```

Exit without a change (`DUPLICATE` · `NOT_A_BUG` · `CANNOT_REPRODUCE` · `WONTFIX` · `NEEDS_PRODUCT_DECISION`) is a legitimate terminal state — see `delivery-dev-understand`. Closing the issue is the developer's action.

`*` = conditional; included only if `status.md` routed it in. Skipping a routed-out phase is fine and recorded. Skipping the **gate** of an included phase never is.

Blocked states: `NEED_CLARIFICATION` · `NEED_MORE_INVESTIGATION` · `NEED_SOLUTION_DECISION` · `NEED_PLAN_REVISION` · `CHANGES_REQUIRED` · `BLOCKED`.

### Status tokens

Each artifact ends with one status line so state is greppable on resume. **The line holds the bare token and nothing else** — `PLAN_STATUS: READY`, never `PLAN_STATUS: READY — QĐ-1..5 đã chốt`. Any note goes on the line **above** it. `delivery-dev-gate.sh` reads only the first word and warns on a suffix.

```text
INTAKE_STATUS: DONE
CONTEXT_STATUS: LOADED
ROUTE_STATUS: PLANNED
UNDERSTANDING_STATUS: READY | NEED_CLARIFICATION | NO_CHANGE
BASELINE_STATUS: REPRODUCED | NOT_REPRODUCED | PARTIAL
INVESTIGATION_STATUS: READY | NEED_MORE_INVESTIGATION | NO_CHANGE
ROOT_CAUSE_STATUS: CONFIRMED | HYPOTHESIS
IMPACT_STATUS: DONE
SOLUTION_STATUS: APPROVED | NEED_SOLUTION_DECISION | DRAFT
TRACEABILITY_STATUS: CREATED | UPDATED | COMPLETE
PLAN_STATUS: READY | NEED_PLAN_REVISION
APPROVAL_STATUS: APPROVED | PENDING          # chỉ ở 02-status.md
IMPLEMENTATION_STATUS: IN_PROGRESS | SELF_REVIEW | TESTING | DONE
TEST_STATUS: PASSED | FAILED | BLOCKED
TESTED_SHA: <git rev-parse HEAD lúc chạy test>
REVIEW_STATUS: APPROVED | CHANGES_REQUIRED
REVIEWED_SHA: <git rev-parse HEAD tại lúc review>
FINAL_STATUS: VERIFIED | NOT_VERIFIED
OPERATIONAL_STATUS: READY | NOT_READY
PR_STATUS: READY
FOLLOWUP_STATUS: OPEN | MERGED
```

`PLAN_STATUS: NEED_REVISION` written by an older run reads as `NEED_PLAN_REVISION`.

`NO_CHANGE` = the issue ends without code (`DUPLICATE` · `NOT_A_BUG` · `CANNOT_REPRODUCE` · `WONTFIX` · `NEEDS_PRODUCT_DECISION`); the outcome is written on the line above the token. It is **not** `NEED_CLARIFICATION` — that one waits for an answer and resumes, `NO_CHANGE` is terminal.

`status.md` holds the **route plan** (which phases and roles this issue needs) plus the current state — see `delivery-dev-classify`. The route plan is authoritative for *what was selected*; the artifacts stay authoritative for *what is done*.

**Re-routing means editing `## Roles` and `## Phases`**, not appending a note. A line saying "re-route: bật DBA" while `## Roles` still omits DBA is a stale route — `delivery-dev-gate.sh` reads the sections, not the notes, and fails the gate.

### 3b. Gate script — chạy, paste, rồi mới làm

Every phase from `classify` on starts with:

```bash
~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue-number> <phase>
```

Paste its **whole output** as the first block of the phase's artifact (under `## Gate-in`). `GATE: FAIL` ⇒ do not run the phase: fix the failing line (usually by running the missing phase) or stop and report it. A gate is never passed by reasoning around the script — if the script is wrong for this case, say so to the developer and let them decide.

What it checks mechanically: prerequisite artifacts + tokens · human approval · `HEAD == REVIEWED_SHA` (and whether a rebase broke the range) · clean working tree before review/verify/pr · **route freshness**: diff vs base touches migration/seed/schema ⇒ `## Roles` must contain DBA and `## Phases` must contain `operational check` · traceability once testing is routed. The checklist inside each phase skill covers the judgment the script cannot make.

### Review & verify are bound to a commit SHA

`review.md` records `REVIEWED_SHA` = the `git rev-parse HEAD` it ran on. **An `APPROVED` verdict covers that SHA and nothing after it.** Any commit added afterwards — a review fix, a polish pass, a new developer request, a rebase — leaves the change since then **unreviewed**. Before `delivery-dev-verify`, `delivery-dev-pr`, or a merge, if `git rev-parse HEAD` ≠ `REVIEWED_SHA`, re-run `delivery-dev-review` on the delta and update the SHA. A stale `APPROVED` is a snapshot of code that is no longer what ships — treat it as not-yet-reviewed, never as an approval.

Two cases decide what "the delta" is:

| `git merge-base --is-ancestor REVIEWED_SHA HEAD` | Delta | Review |
|---|---|---|
| true (commits added on top) | `REVIEWED_SHA..HEAD` | `git diff REVIEWED_SHA HEAD` + `git log REVIEWED_SHA..HEAD` |
| false (rebase, amend, squash, renumber) | `REVIEWED_SHA..HEAD` is **meaningless** — it lists every rewritten commit as new, so it neither isolates the real change nor shows what was already reviewed | `git range-diff REVIEWED_SHA...HEAD` — review every commit it marks changed (`!`) or new (`>`); a rebase that also edited content (renamed migration, conflict fix) is a real change |

**The SHA covers commits only.** Review runs on a clean working tree (`git status --short` empty — task artifacts live in the vault, not the repo); uncommitted edits are not covered by any SHA, so they are committed first, not "reviewed along".

## 4. Evidence-Based Reasoning

Every claim carries its epistemic label. Never present an assumption as a fact.

| Label | Means | Requires |
|---|---|---|
| `FACT` | Read in this repository or in the issue | `path/to/file.py:120`, or a quote from the issue |
| `INFERENCE` | Derived from facts | the facts it is derived from |
| `ASSUMPTION` | Believed, not verified | say what would confirm it |
| `UNKNOWN` | Not known | say whether it blocks the work |

```md
FACT: `PaymentService.create()` gọi `PaymentClient.request()` (payment/service.py:64).
INFERENCE: Retry nên đặt ở `PaymentClient` vì mọi caller đều đi qua đó.
ASSUMPTION: Mọi caller đều muốn cùng một retry policy. (Confirm: hỏi issue author.)
UNKNOWN: External API có đảm bảo idempotency không. (Blocking — ảnh hưởng thiết kế retry.)
```

Use the labels in `context.md`, `understanding.md`, `investigation.md`, `plan.md` and `review.md`, especially when the issue is incomplete.

Reading before concluding and the decision ladder are shared with the PoC-side skills: `../../delivery-start/references/luat-chung.md` §1 (read the whole issue thread, fetch the shared branch, name the SHA you read) and §3 (what to decide yourself, what to keep as the PR or mock already does, what becomes `NEEDS_PRODUCT_DECISION`).

## 5. Scope Control

`plan.md` defines the scope; every later phase respects it.

```md
## Scope

### In Scope
- ...

### Out of Scope
- ...

### Related but Not Required
- ...
```

An unrelated problem found along the way is **never fixed silently**. Report it:

```text
Phát hiện vấn đề ngoài scope: <what, where>.
Nằm ngoài phạm vi issue #<id>.
Đề xuất: tạo issue riêng.
```

Then keep going with the current issue.

## 5b. Context Priority

Sources conflict ⇒ the higher one wins, and the conflict is stated, not silently resolved:

```text
1. Original issue / Acceptance Criteria
2. Explicit instruction from the developer or team
3. Project instructions (AGENTS.md, CLAUDE.md, CONTRIBUTING.md)
4. Existing architecture and code conventions
5. AI inference
```

## 6. Language Policy

| Surface | Language |
|---|---|
| Analysis, explanation, chat with the developer | Vietnamese |
| Every artifact except `original.md` (context · status · understanding · baseline · investigation · impact · solution · traceability · plan · implementation · tests · review · verification · operational-check · followup · learnings · feedback · decisions) — prose | Vietnamese |
| `original.md` | Original Japanese/English, verbatim |
| Code, identifiers, commit messages | English |
| PR title/body, issue comments | Repository/team convention (Japanese issue → Japanese PR if that is the team's norm) |

English CS terms stay English (`retry`, `timeout`, `idempotency`). **Japanese/domain terms are the opposite case** — the developer cannot read them, so they are translated unless they are a literal identifier (UI label, screen or 帳票 name, DB column, quoted phrase), and even then Vietnamese leads with the original kept as a tag on first use in each document: `nhận đơn hàng (受注)`. Full rule: `writing-policy.md` §8; the task glossary lives in `01-context.md`.

Clarification questions are written **bilingual VI/EN** (plus JP when the team works in Japanese) — the VI half is for the developer and is never posted to the issue.

The translation is a working aid. **Implement against the original requirement, never against the translation.**

## 7. Learning Mode

The developer may know the keyword but not the concept. Explain a concept **only when it changes an implementation decision**, in this shape:

```text
Concept
→ giải thích tiếng Việt đơn giản
→ vì sao nó quan trọng ở task này
→ ví dụ cụ thể lấy từ repo này
```

Example:

```text
Idempotency
→ cùng một request gửi nhiều lần nhưng nghiệp vụ chỉ chạy một lần.
→ Payment API có thể timeout dù transaction đã thành công.
   Retry mà không idempotent ⇒ tạo payment transaction thứ hai.
→ `PaymentClient.request()` hiện chưa gửi idempotency key.
```

Do not turn an issue into a tutorial. Concepts that are worth keeping go into `learnings.md` (see `supporting-artifacts.md`).

## 8. Communication & Output Policy

`writing-policy.md`, next to this file, is **mandatory** and governs every artifact and every message: length, filler, repetition, evidence, formatting, Vietnamese style, per-output shapes, and the self-check before returning.

One line of it, because everything else follows from it: **write like a developer, not like an AI.**

`original.md` is the one exception — the original issue is never shortened or rewritten.

## 9. Phase Summary

End every phase with the phase-summary shape in `writing-policy.md` §10 — what happened · what matters · what's next. Never dump the artifact.

## 10. Safety Rules (HARD BLOCK)

Never:

1. Invent requirements. Unclear ⇒ write `UNKNOWN`.
2. Invent test results.
3. Claim code was tested when it was not — un-run tests are `NOT_RUN` plus the reason.
4. Review code without reading the actual diff.
5. Ignore repository conventions without saying why.
6. Change unrelated files, or fix an out-of-scope problem silently.
7. Skip requirement understanding, or skip a gate.
8. Implement ambiguous business logic without approval.
9. Remove or paraphrase the original Japanese/English context.
10. Treat the AI's interpretation as the authoritative requirement.
11. Present an `ASSUMPTION` as a `FACT`.
12. Make a large architectural change without flagging it and logging it in `decisions.md`.
13. Return AI-essay output — see `writing-policy.md` and its self-check.

## 11. Design Principle

The point is not to code faster. The point is that the developer understands the issue, understands the codebase, and owns the decisions.

```text
AI should reduce cognitive overload, not remove developer understanding.
```

Optimize for: understandability · traceability · correctness · minimal change · developer ownership.

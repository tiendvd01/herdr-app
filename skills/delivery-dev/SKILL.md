---
name: delivery-dev
description: "Orchestrate the adaptive GitHub Issue → PR engineering workflow for issues written in Japanese or English while the developer works in Vietnamese. Use when given an issue number or URL (\"/devflow issue #1234\", \"devflow #1234\", \"làm issue 1234\", \"resume #1234\"), or when asked to continue an interrupted issue task. Classifies the issue, routes only the phases and engineering roles it needs (BA/SA/DEV/QC/InfoSec/Performance/DBA/SRE), enforces understanding, solution, plan, human-approval and verification gates, and keeps the developer the decision owner."
---

# Devflow (Orchestrator)

## Năm điều không được phép quên

Nếu chỉ đọc lướt được một chỗ trong toàn bộ delivery-dev, đọc chỗ này.

1. **Không bịa.** Test result, line number, baseline, requirement — không kiểm chứng được thì ghi `UNKNOWN` / `NOT_RUN (lý do)`, không đoán cho tròn.
2. **`00-original.md` giữ nguyên văn** — bản dịch không bao giờ thay thế yêu cầu gốc JP/EN. Ngược lại, **mọi artifact khác viết cho người đọc tiếng Việt**: không để tiếng Nhật trần, tiếng Việt dẫn mọi chỗ, giữ nguyên gốc chỉ khi là nhãn/tên màn hình/tên 帳票/cột DB và để trong ngoặc làm nhãn ở lần đầu — `nhận đơn (受注)`.
3. **Không qua gate khi chưa đạt.** Quyết định material (architecture · DB · API · payment · security · concurrency · breaking) ⇒ dừng, hỏi người, không tự duyệt.
4. **Chỉ sửa trong scope.** Thấy lỗi ngoài scope ⇒ báo và đề xuất issue riêng, không sửa lặng.
   Hạ tầng: **mọi lệnh chạm cloud/state đều phải hỏi bạn trước — kể cả `plan`, kể cả lệnh read-only.** `apply`/`destroy`/sửa state thì không bao giờ. Không nới quyền IAM/SG để chạy được.
5. **Viết như dev, không như AI.** Ngắn, cụ thể, có evidence. Artifact > 40 dòng ⇒ mở đầu bằng TL;DR 3–5 gạch. **Luồng, thứ tự, trạng thái thì VẼ bằng mermaid, đừng tả bằng văn xuôi** (`writing-policy.md` §2b, §7b).

Conductor for one GitHub Issue. This skill decides **which phase runs next**; the phase skills do the work.

```text
WORKFLOW            ROLES                  GATES
state machine       BA · SA · DEV · QC     human approval
routing             InfoSec · Perf         quality control
artifacts           DBA · SRE · Reviewer   no silent skips
```

## Core Principle

Not `Issue → AI → Code`. The path is:

```text
Issue → Understand → Investigate → Root cause/Baseline (when relevant)
→ Design solution → Role review → Plan → Human approval
→ Implement (+ commit) → Test (STLC) → Review → Verify → Operate
→ PR → Follow-up (CI + review threads) → Learn
```

The developer stays the decision owner. AI does the analysis and the typing; it does not silently make engineering decisions or remove the developer's understanding.

The original Japanese/English issue is the **source of truth**. Vietnamese is the working language and never replaces it.

## Before Anything Else

Read these two now — they apply to every phase:

- `references/conventions.md` — workspace, artifacts, state machine + tokens, **gate script (§3b)**, evidence labels, context priority, scope control, language, safety rules.
- `references/writing-policy.md` — **mandatory** communication policy. Write like a developer, not like an AI.

The other four are loaded **only by the phases that need them** — each phase skill names its own at the top, do not preload them here:

- `references/roles.md` — classify · solution · review.
- `references/supporting-artifacts.md` — investigate · solution · plan · implement · verify · learn.
- `references/security.md` — only when INFOSEC is routed (solution · review · operate).
- `references/devops.md` — only when SRE/DEVOPS is routed or the change touches IaC (solution · review · operate).

Loading a reference a phase does not use costs ~1.7k tokens of attention for nothing.

## Adaptive Workflow

The workflow scales with the issue. `delivery-dev-classify` writes the route plan into `status.md`; this orchestrator follows it.

```text
INTAKE → CONTEXT → CLASSIFY → UNDERSTAND ─(G1)─→
INVESTIGATE ([baseline] → trace → [root cause] → [impact]) ─(G2)─→
[SOLUTION + ROLE REVIEW] ─(G3)─→ [TRACEABILITY] → PLAN ─(G4)─→ [HUMAN APPROVAL] →
IMPLEMENT → SELF REVIEW → unit test →
TEST: design → data/env → execute → defect → retest + regression ─(G5)─→
REVIEW (+ [SPECIALIST]) → VERIFY (test closure + AC) ─(G6)─→
[OPERATIONAL CHECK] → PR → FOLLOW-UP (CI · review threads · merge) → [LEARN]
```

`[…]` = conditional. Real shapes:

```text
(intake · context · classify chạy ở mọi shape — không liệt kê lại)
Typo (DOC/LOW/LOW/NONE)          understand → implement → review (nhẹ) → verify → pr
Simple bug (BUG/LOW/LOW/LOW)     understand → investigate (baseline+cause) → implement → test (regression) → review → verify → pr
Payment feature (HIGH/CRITICAL)  full chain, roles BA·SA·InfoSec·DBA·QC·SRE, human approval before implement
```

Review and PR are in every shape: G6 requires `review.md` APPROVED, so a shape without review can never verify.

**Do not force ceremony on a trivial issue, and do not skip design on a risky one.** Both failures are equally bad.

## Invocation

`/devflow <verb> #<id>` is the developer's interface (the `devflow` command dispatches here; the skill also answers to `/delivery-dev` and to plain language).

| Input | Action |
|---|---|
| `/devflow issue #1234`, `devflow #1234`, `làm issue 1234`, `<issue-url>` | Start or continue — run every routed phase still pending |
| `/devflow resume #1234` | Detect state from artifacts, continue; never redo finished work |
| `/devflow status #1234` | Report state only, run no phase |
| `/devflow <phase> #1234` | Run one phase (`context`, `classify`, `understand`, `investigate`, `solution`, `plan`, `implement`, `test`, `review`, `verify`, `operate`, `pr`, `followup`, `learn`) — only if its input gate passes |

```bash
gh issue view <number> --json number,title,url,body,labels,assignees,milestone,state,comments
```

No `gh` or ambiguous repo ⇒ ask for the issue URL. Never guess a repository.

## Step 1 — Locate the workspace

The workspace lives in the SoraVaults vault, not the repo (`references/conventions.md` §1):

```bash
P=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh)      # vault dir of this project
T="$P/issue <number>"; ls "$T" 2>/dev/null                           # the workspace
ls -d tasks/<number>-*/ tasks/#<number>*/ 2>/dev/null                # legacy in-repo dirs — read-only
```

`"$T"` exists → use it (never a second directory for the same issue). A legacy `tasks/…` dir in the repo → read it as context, keep writing in the vault, and say so. Neither → `delivery-dev-intake` creates `"$T"`.

## Step 2 — Detect state

```bash
ls "$T"                                                # thứ tự file = thứ tự công việc
grep -H '_STATUS:\|_SHA:' "$T"/*.md 2>/dev/null
sed -n '/## Roles/,/## State/p' "$T"/*status.md 2>/dev/null
gh issue view <number> --json updatedAt,comments --jq '.updatedAt, (.comments|length)'   # issue đổi sau intake?
```

**Issue drift.** `updatedAt` newer than `Fetched at` in `original.md`, or more comments than it recorded ⇒ the issue moved under you. Append the new comments/edits to `original.md` (verbatim, dated, marked `## Update <date>`), re-check `understanding.md` against them, and say so before continuing — an AC changed in a comment is still an AC.

Artifacts carry a two-digit workflow-order prefix (`00-original.md` … `90-decisions.md`, see `conventions.md` §2). The tables below use bare names; **match on disk with a glob** (`*plan.md`) so both the numbered and the older unnumbered task directories resolve.

| Evidence | State | Next |
|---|---|---|
| no `"$T"` (`issue <number>/` in the vault) | `ISSUE_RECEIVED` | `delivery-dev-intake` |
| `original.md`, no `context.md` | `ISSUE_RECEIVED` | `delivery-dev-context` |
| `context.md` → `LOADED`, no route plan | `CONTEXT_LOADED` | `delivery-dev-classify` |
| `status.md` → `ROUTE_STATUS: PLANNED`, no `understanding.md` | `CLASSIFIED` | `delivery-dev-understand` |
| `understanding.md` or `investigation.md` → `NO_CHANGE` | no-change exit | developer closes the issue; stop |
| `understanding.md` → `NEED_CLARIFICATION` | `NEED_CLARIFICATION` | stop, ask |
| `understanding.md` → `READY` | `UNDERSTANDING_GATE` passed | next routed phase |
| `baseline.md` → `NOT_REPRODUCED` | `REPRODUCING` | stop, gather evidence — do not guess a fix |
| `investigation.md` → `NEED_MORE_INVESTIGATION` | `INVESTIGATING` | `delivery-dev-investigate` |
| `investigation.md` → `READY` | `INVESTIGATION_GATE` passed | next routed phase |
| `impact.md` → `DONE` | `IMPACT_ANALYSIS` done | next routed phase |
| `solution.md` → `NEED_SOLUTION_DECISION` | `NEED_SOLUTION_DECISION` | stop, developer chooses |
| `solution.md` → `APPROVED` | `ROLE_REVIEW` done | `delivery-dev-plan` |
| `plan.md` → `NEED_PLAN_REVISION` | `PLANNING` | `delivery-dev-plan` |
| `plan.md` → `READY`, approval routed and `status.md` `APPROVAL_STATUS` ≠ `APPROVED` | `HUMAN_APPROVAL` | stop, ask |
| `plan.md` → `READY`, approval done or not required | `PLAN_GATE` passed | `delivery-dev-implement` |
| `implementation.md` → `IN_PROGRESS` / `SELF_REVIEW` / `TESTING` | same | `delivery-dev-implement` (continue) |
| `implementation.md` → `DONE`, no `tests.md` | `TEST_DESIGN` | `delivery-dev-test` |
| `tests.md` → `FAILED` | `FIXING` | `delivery-dev-implement`, then retest |
| `tests.md` → `BLOCKED` | `TEST_EXECUTION` | stop, say which AC is unproven and what is missing |
| `tests.md` → `PASSED`, no `review.md` | `SPECIALIST_REVIEW` | `delivery-dev-review` |
| `review.md` → `CHANGES_REQUIRED` | `FIXING` | `delivery-dev-implement`, then retest + re-review |
| `review.md` → `APPROVED`, `HEAD` ≠ its `REVIEWED_SHA` | `SPECIALIST_REVIEW` (delta chưa review) | `delivery-dev-review` on the delta — `REVIEWED_SHA..HEAD`, or `git range-diff` if a rebase broke ancestry (conventions §3) |
| `review.md` → `APPROVED`, `HEAD` = `REVIEWED_SHA` | `FINAL_VERIFICATION` | `delivery-dev-verify` |
| `verification.md` → `NOT_VERIFIED` | `FINAL_VERIFICATION` | fix, verify again |
| `verification.md` → `VERIFIED`, operational check routed | `OPERATIONAL_CHECK` | `delivery-dev-operate` |
| `verification.md` → `VERIFIED`, no `pr.md` | ready | `delivery-dev-pr` |
| `pr.md` exists, PR not opened | `PR_READY` | developer opens the PR (via `delivery-dev-open-pr`) |
| PR open, CI red or changes requested | `CI_FAILING` / `CHANGES_REQUESTED` | `delivery-dev-followup` |
| PR open, CI green, threads answered | `PR_OPEN` | developer merges |
| PR merged | `MERGED` | `delivery-dev-learn`, then `DONE` |

States the table abbreviates: `UNDERSTANDING` while `understanding.md` is being written · `ROOT_CAUSE_ANALYSIS` inside investigation for a bug/perf/security issue · `SOLUTION_DESIGN` while `solution.md` is `DRAFT` · `TRACEABILITY` while the matrix is being filled · `BLOCKED` for anything waiting on the developer or an external answer.

State is **derived from artifacts**. `status.md` is authoritative only for the route plan.

### Resume (`/devflow resume #1234`)

1. Find `issue 1234/` in the vault (`vault-path.sh "issue 1234"`). 2. Read what exists. 3. Read the route plan. 4. State what is done. 5. Name what is missing. 6. Continue from there.

```text
Existing:
00-original OK · 01-context OK · 02-status OK (route planned)
03-understanding READY · 05-investigation READY · 07-solution APPROVED
09-plan READY · 10-implementation IN_PROGRESS (Step 1,2 DONE)

Missing: 11-tests, 12-review, 13-verification, 15-pr
Routed but not started: operational check

Current State: IMPLEMENTING
Next: continue Step 3 of plan.md
```

Re-reading an artifact for context is fine. **Re-running the work behind it is not.**

## Step 3 — Run one phase

Run the gate first — every phase from `context` on:

```bash
~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <number> <phase>
```

`GATE: FAIL` ⇒ do not enter the phase; the failing line names what is missing. The script output goes into the artifact's `## Gate-in` block (conventions §3b). A state derived from the table above that the script rejects is wrong — trust the script, then fix the artifact.

Read only the phase you are entering:

| Phase | Skill | Artifact |
|---|---|---|
| Intake | `../delivery-dev-intake/SKILL.md` | `00-original.md` |
| Context | `../delivery-dev-context/SKILL.md` | `01-context.md` |
| Classify | `../delivery-dev-classify/SKILL.md` | `02-status.md` |
| Understand | `../delivery-dev-understand/SKILL.md` | `03-understanding.md` |
| Investigate (+ baseline*, root cause*, impact*) | `../delivery-dev-investigate/SKILL.md` | `05-investigation.md`, `04-baseline.md`*, `06-impact.md`* |
| Solution* | `../delivery-dev-solution/SKILL.md` | `07-solution.md`, `08-traceability.md` |
| Plan | `../delivery-dev-plan/SKILL.md` | `09-plan.md` |
| Implement | `../delivery-dev-implement/SKILL.md` | `10-implementation.md` |
| Test (STLC) | `../delivery-dev-test/SKILL.md` | `11-tests.md` |
| Review | `../delivery-dev-review/SKILL.md` | `12-review.md` |
| Verify | `../delivery-dev-verify/SKILL.md` | `13-verification.md` |
| Operate* | `../delivery-dev-operate/SKILL.md` | `14-operational-check.md` |
| PR | `../delivery-dev-pr/SKILL.md` | `15-pr.md` |
| Follow-up | `../delivery-dev-followup/SKILL.md` | `16-followup.md` |
| Learn* | `../delivery-dev-learn/SKILL.md` | `17-learnings.md`, `18-feedback.md` |

After a gate passes, continue to the next routed phase in the same turn unless a gate blocks or the developer asked to stop.

## Gates

Print the checklist with its result — a gate is shown, never asserted. Two layers, both required:

1. **Gate-in** — `delivery-dev-gate.sh` (mechanical: artifacts, tokens, approval, SHA, clean tree, route freshness).
2. **Gate-out checklist** — the judgment part, defined **once, in the phase skill**. This table only points there; it does not restate the items (restating them is how the two copies drifted).

| Gate | Defined in | Fail ⇒ |
|---|---|---|
| G1 Understanding | `delivery-dev-understand` §G1 | `NEED_CLARIFICATION` — or `NO_CHANGE` for a no-code exit. Stop. |
| G2 Investigation | `delivery-dev-investigate` §G2 | `NEED_MORE_INVESTIGATION`. Never guess the architecture. |
| G3 Solution (routed) | `delivery-dev-solution` §G3 | `NEED_SOLUTION_DECISION` — options + trade-offs + recommendation, **wait for the developer**. |
| G4 Plan | `delivery-dev-plan` §G4 | `NEED_PLAN_REVISION` |
| Human approval (routed) | `delivery-dev-plan` §Human approval | stop and ask; `APPROVAL_STATUS` lives in `status.md`. **Never self-approve a high-risk decision.** |
| G5 Test exit | `delivery-dev-test` §Exit criteria | `FAILED` (fix loop) or `BLOCKED` (never `PASS`) |
| Review gate | `delivery-dev-review` §Gate Out | `CHANGES_REQUIRED` |
| G6 Final verification | `delivery-dev-verify` §G6 | `NOT_VERIFIED` |

## Step 4 — Report

End every phase with the phase-summary shape in `writing-policy.md` §10 — what happened · what matters · what's next. Never dump the artifact. Run the self-check in §12 before returning anything substantial.

## Stop Conditions

1. A gate is blocked.
2. Implementation shows the plan or solution is wrong → explain, update `solution.md`/`plan.md`, log in `decisions.md`, re-approve if material.
3. An out-of-scope problem appears → report and recommend a separate issue; never fix it silently.
4. The same problem loops 3 times → escalate with what was tried and an alternative.
5. `pr.md` is ready — pushing and opening the PR is the developer's call (`delivery-dev-open-pr`).
6. Merging is the developer's call. So is closing an issue that needs no change.
7. `delivery-dev-gate.sh` says `GATE: FAIL` for the phase you were about to run.

## Skills reused, not reimplemented

| Job | Skill |
|---|---|
| Commit — branch-aware, Conventional Commits, never pushes | `delivery-dev-commit` → used by `delivery-dev-implement` |
| Check branch + upstream, then print the push + PR commands for the developer (never pushes) | `delivery-dev-open-pr` → used by `delivery-dev-pr` |
| Deep review methodology on a diff | `delivery-pr-review` → used by `delivery-dev-review` |
| ADR authoring · UI/UX guidance | the repo's own skills when present (`write-adr`, `design-ui-ux`) |
| Find the real mockup of a project by project code (frontend work) | `find-mockup-repo` → used when the FRONTEND / UX role is active (investigate, implement, verify) |

Devflow owns the workflow, the gates and the artifacts. It does not re-derive what these already do.

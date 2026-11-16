---
name: delivery-dev-plan
description: "Phase 7 of delivery-dev — turn the original issue, project context, Vietnamese understanding and codebase investigation into a concrete step-by-step implementation plan with explicit in/out scope, files, reasons, risks, tests and a Definition of Done. Use after investigation is READY and before writing code, or when asked how to implement an issue."
---

# Devflow · Phase 7 — Implementation Plan

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/supporting-artifacts.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** `understanding.md` + `investigation.md` + `impact.md`/`solution.md` (if routed) + `traceability.md` · **Out:** `SoraVaults/<project>/issue <n>/09-plan.md` · **State:** `PLANNING → PLAN_GATE → HUMAN_APPROVAL`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> plan` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Produce a plan another developer could execute **without re-analyzing the issue**.

Gate in: understanding `READY` and investigation `READY`. Otherwise go back — do not plan on top of an open question.

## Rules

- The plan is derived from `Requirement + Investigation + Solution design + Role reviews`. Nothing new is invented here; a solution phase that ran already settled *how* — this settles *which lines*.
- Comply with the coding and testing conventions in `context.md`. A deliberate deviation is stated and logged in `decisions.md`.
- Prefer the **smallest change** that correctly satisfies the requirement and follows the pattern found in the investigation.
- Do not over-engineer. No abstraction for a need that does not exist yet.
- Evaluate any implementation *suggestion* from the issue on its merits — adopt or reject it explicitly, and log that in `decisions.md`. A suggestion is not a requirement.
- Each step names real files from the investigation, not placeholders. Every step states its test.
- Every AC in `traceability.md` must be covered by at least one step.

## Template

```md
# Implementation Plan

## 1. Objective
...

## 2. Scope

### In Scope
- ...

### Out of Scope
- ...

### Related but Not Required
- ... (đề xuất issue riêng nếu cần)

## 3. Approach
<cách làm + vì sao chọn, tham chiếu Existing Pattern ở investigation.md và D00x ở decisions.md>

## 4. Changes

### Step 1 — <name>

Files:
- `path/to/file`

Changes:
- ...

Covers:
- AC-1 / R1

Reason:
- ...

Risk:
- ...

Tests:
- ...

### Step 2 — ...

## 5. Database Changes
<migration, index, backfill, seed/reference-data — hoặc: None>
<khác None mà status.md chưa có DBA + operational check ⇒ dừng, chạy lại delivery-dev-classify trước khi qua G4>

## 6. API Changes
<request/response, backward compatibility — hoặc: None>

## 7. Error Handling
...

## 8. Test Plan  (STLC 2 — thiết kế case là `delivery-dev-test`)

Scope in / out:
- Trong: <AC nào được test ở issue này>
- Ngoài: <cái gì cố ý không test, vì sao>

| Level | Có dùng? | Ai chạy | Lệnh |
|---|---|---|---|
| Unit | có | delivery-dev-implement | `pytest tests/unit` |
| Integration | có | delivery-dev-test | `pytest tests/integration` |
| System / E2E | không — không có môi trường | — | — |
| Acceptance | manual | delivery-dev-test | theo AC |

Types cần có: functional · negative · boundary · regression <bỏ cái không liên quan>

Entry criteria — được bắt đầu test khi:
- [ ] Implementation `DONE`, unit test của dev đã chạy
- [ ] Môi trường + test data sẵn sàng

Exit criteria — được coi là xong khi:
- [ ] Mọi AC có ít nhất 1 case
- [ ] Không còn defect CRITICAL/HIGH mở
- [ ] Regression trên flow + impact area PASS

Environment: <local / docker / staging; external service thật hay mock>
Test data: <fixture / factory / seed — KHÔNG dùng dữ liệu production thật>
Rủi ro test: <cái gì có thể không test được và hệ quả>

Bug ⇒ reproduction ở `baseline.md` thành failing test trước khi fix.
Distributed ⇒ timeout · retry · duplicate · concurrency · race · partial failure.

## 9. Rollback / Risk
...

## 10. Implementation Order
1. ...
2. ...

## 11. Flagged Risks (need developer approval)
- [ ] New architecture: ...
- [ ] New database structure: ...
- [ ] Breaking API change: ...
- [ ] Performance implication: ...
- [ ] Security implication: ...
- [ ] Complex business logic: ...
<hoặc: None>

## 12. Definition of Done
- [ ] <mỗi AC ở understanding.md>
- [ ] Tests pass
- [ ] review.md → APPROVED
- [ ] traceability.md → COMPLETE
- [ ] No unrelated changes

---

PLAN_STATUS: READY | NEED_PLAN_REVISION
```

## G4 — Plan Gate

```text
[ ] Plan maps to requirements (every AC covered by a step)
[ ] Files identified
[ ] Scope defined (in / out / related-but-not-required)
[ ] Implementation order defined
[ ] Tests defined
[ ] Risks understood
[ ] §5 Database Changes ≠ None ⇒ route có DBA + operational check (gate-in dòng route freshness PASS)
```

Anything in §11 that is checked must be **explicitly accepted by the developer** and logged in `decisions.md`. Until then: `NEED_PLAN_REVISION`.

### Human approval

`status.md` routed `HUMAN_APPROVAL` (Risk ≥ HIGH, or a material architecture/DB/API/payment/security/concurrency/breaking decision) ⇒ understanding, investigation, solution, plan and test strategy must all be complete, then **stop and ask**. Record the result by editing the `APPROVAL_STATUS:` line in `02-status.md` (the only place it lives — not in `plan.md`) to `APPROVED`, with `Approved by <developer>, <date>: <what was approved>` on the line above it. Approval given in chat but not written there does not exist for `delivery-dev-gate.sh implement`.

Never self-approve a high-risk decision, and never start coding while it is `PENDING`.

`READY` (+ approval when required) ⇒ continue to `delivery-dev-implement`.

## Report

Phase summary: approach in 2–3 lines, scope boundary (esp. what is out), number of steps, DB/API impact (or None), flagged risks needing approval, gate checklist result, next = implement.

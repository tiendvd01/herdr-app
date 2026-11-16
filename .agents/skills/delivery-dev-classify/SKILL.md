---
name: delivery-dev-classify
description: "Phase 3 of delivery-dev — classify a GitHub Issue by type, complexity, risk and production impact, then pick which workflow phases and engineering roles this issue actually needs, recording the route plan in SoraVaults/<project>/issue <n>/status.md. Use right after project context is loaded, or when asked how heavy a workflow an issue deserves."
---

# Devflow · Phase 3 — Classify & Route

Read `../delivery-dev/references/conventions.md`, `../delivery-dev/references/writing-policy.md` and `../delivery-dev/references/roles.md` first.

**In:** `original.md` + `context.md` · **Out:** `SoraVaults/<project>/issue <n>/02-status.md` (route plan) · **State:** `CONTEXT_LOADED → CLASSIFIED`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> classify` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Decide how heavy this issue's workflow should be. A typo fix and a payment migration must not cost the same.

## Classify

```text
Type:              BUG | FEATURE | REFACTOR | PERFORMANCE | SECURITY | DATABASE
                   INFRASTRUCTURE | MIGRATION | INVESTIGATION | DOCUMENTATION | OTHER
Complexity:        LOW | MEDIUM | HIGH
Risk:              LOW | MEDIUM | HIGH | CRITICAL
Production Impact: NONE | LOW | HIGH
```

Judge from the issue text + `context.md`, and say what drove the call in one line each. Uncertain ⇒ round **up**, and say so.

Risk is not complexity: a one-line change to payment rounding is `LOW` complexity, `CRITICAL` risk. Same for infrastructure — a one-variable Terraform edit that replaces an RDS instance is `LOW` complexity, `CRITICAL` risk. Type `INFRASTRUCTURE` or `MIGRATION` ⇒ Risk starts at `HIGH` unless you can show otherwise, and SRE/DEVOPS is always active.

## Route: phases

Always: `INTAKE · CONTEXT · CLASSIFY · UNDERSTAND · INVESTIGATE · PLAN · IMPLEMENT · SELF_REVIEW · REVIEW · VERIFY · PR` — với DOCUMENTATION/typo, `INVESTIGATE` + `PLAN` thu gọn thành vài dòng trong `implementation.md` (không file riêng), còn `TEST` bỏ (xem bảng dưới).

Conditional:

| Phase | Include when |
|---|---|
| `BASELINE` (step A of `delivery-dev-investigate`) | Type ∈ {BUG, PERFORMANCE} · regression · production incident |
| `ROOT_CAUSE` (step B of `delivery-dev-investigate`) | Type ∈ {BUG, PERFORMANCE, SECURITY} · unexplained behavior |
| `IMPACT` (step C of `delivery-dev-investigate`) | Complexity ≥ MEDIUM · Risk ≥ MEDIUM · Production Impact ≥ LOW · cross-module |
| `SOLUTION_DESIGN` (`delivery-dev-solution`) | Complexity ≥ MEDIUM · Risk ≥ HIGH · more than one sane approach · architecture/API/DB change · **`00-original.md` records an approved Solution** (then it runs in *Solution đã duyệt* mode: copy the decision in, no redesign) |
| `ROLE_REVIEW` (in `delivery-dev-solution`) | Any role beyond DEV/QC is active |
| `TRACEABILITY` | Mọi route có `TEST` (tức mọi thứ trừ DOCUMENTATION/typo). Nhỏ thì một bảng 1–2 dòng — nhưng phải có: plan, verify và gate script đều đọc nó |
| `HUMAN_APPROVAL` | Risk ≥ HIGH · architecture/API/DB/payment/security/concurrency/breaking change |
| `TEST` (`delivery-dev-test`) | Everything except DOCUMENTATION/typo. Depth scales: bug LOW = regression only · feature = AC + negative + boundary · CRITICAL = + concurrency/duplicate/partial failure |
| `SPECIALIST_REVIEW` (in `delivery-dev-review`) | Any specialist role active |
| `OPERATIONAL_CHECK` (`delivery-dev-operate`) | Production Impact ≥ LOW · migration · config/env change · **any IaC (Terraform/CFN/k8s/CI) change** |
| `FOLLOWUP` (`delivery-dev-followup`) | Always, once the PR is open — CI and reviewers do not care how the issue was classified |
| `DOCS_UPDATE` (in `delivery-dev-implement`) | Repo keeps specs/ADRs/architecture index and this change makes one stale |
| `LEARNING` (`delivery-dev-learn`) | A concept mattered, or PR feedback arrived |

Skipping a conditional phase is a decision — write the reason in the route plan. Skipping a **gate** of an included phase is never allowed.

### Shapes that fall out of this

```text
(intake · context · classify luôn chạy — không lặp lại ở dưới)

Fix typo (DOC, LOW/LOW/NONE):
  understand → implement → review (nhẹ: chỉ diff + hygiene) → verify → pr
  (investigate thu về một dòng "đổi ở file:line" trong implementation.md; test bỏ)

Simple bug (BUG, LOW/LOW/LOW):
  understand → investigate (baseline + root cause) → implement → test (regression) → review → verify → pr

Payment feature (FEATURE, HIGH/CRITICAL/HIGH):
  understand → investigate (+ impact) → solution(BA,SA,INFOSEC,DBA) → trace
  → plan → approval → implement → test → review(INFOSEC,QC,SRE) → verify
  → operational check → pr → followup → learn
```

Mọi shape đều có **review** và **pr**: G6 đòi `review.md` APPROVED, nên một route thiếu review thì verify không bao giờ qua. `status.md` `## Phases` phải liệt kê đúng những phase này — `delivery-dev-gate.sh` đọc nó.

## Route: roles

Pick from `roles.md` using its activation column. DEV + QC are the floor; everything else must be justified in one line. UI change ⇒ FRONTEND/UX is not optional. Type `INFRASTRUCTURE`/`MIGRATION` ⇒ SRE/DEVOPS always. **Do not activate a role you cannot give work to.**

## status.md

```md
# Status

## Classification
- Type: FEATURE
- Complexity: MEDIUM — chạm 3 module
- Risk: HIGH — đụng luồng payment
- Production Impact: HIGH — API đang chạy production

## Roles
BA, SA, DEV, QC, INFOSEC, SRE
- INFOSEC: nhận amount từ client
- SRE: đổi env var + có migration

## Phases
- [x] intake
- [x] context
- [x] classify
- [ ] understand
- [ ] investigate (baseline: bỏ · root cause: có · impact: có)
- [ ] solution (+ role review)
- [ ] traceability
- [ ] plan
- [ ] human approval
- [ ] implement / self review / unit test
- [ ] test — QC pass (AC + negative + boundary)
- [ ] review (INFOSEC, QC, SRE)
- [ ] verify
- [ ] operational check
- [ ] pr
- [ ] followup (CI + review threads)
- [ ] learn

Skipped: baseline (không phải bug, không có regression) · learn (chưa có concept nào đáng ghi).

## State
Current Phase: UNDERSTAND
Next Action: đọc original.md, viết understanding.md
Blocker: None
Last Updated: <date>

---

ROUTE_STATUS: PLANNED
APPROVAL_STATUS: PENDING
```

Dòng `APPROVAL_STATUS` chỉ có khi `human approval` nằm trong `## Phases`; `delivery-dev-plan` đổi nó thành `APPROVED` sau khi developer duyệt. Token luôn đứng trần — ghi chú đặt dòng trên, không bao giờ cùng dòng.

Viết `## Roles` với **dòng đầu là danh sách phẳng** (`BA, SA, DEV, QC, INFOSEC, SRE`) và `## Phases` dạng `- [ ] <tên phase>` đúng tên ở template — `delivery-dev-gate.sh` đọc hai chỗ đó, không đọc ghi chú.

`status.md` is the authority for **which phases were selected**; the artifacts remain the authority for which are done. Re-classify only if the issue turns out materially different — then say what changed and update the plan. **Fail-closed trigger:** if a later phase (investigate / solution / implement) uncovers a **migration, seed change, schema/DDL change, or an edit to a shared state machine / reference data** that this route did **not** include, you **must** re-run this phase — raise Risk on that axis, activate **DBA** and **OPERATIONAL_CHECK**, and update `status.md`. A `status.md` whose route no longer matches the actual diff is **stale = gate fail**: no downstream phase may pass its gate until the route is corrected. "Cột đã có nên không cần DBA" is exactly the misroute that ships a migration unreviewed.

**Re-route = sửa chính route, không phải ghi chú.** Thêm `DBA` vào dòng đầu của `## Roles`, thêm `- [ ] operational check` vào `## Phases`, bỏ nó khỏi `Skipped:`, nâng dòng Risk tương ứng, rồi ghi một dòng `Re-routed <date>: <lý do>` dưới `## State`. Chỉ viết "Re-route: bật DBA" ở cuối file mà không sửa hai section kia ⇒ `delivery-dev-gate.sh` vẫn đọc route cũ và fail mọi gate từ plan trở đi (đúng như vậy — đó là thứ đã xảy ra ở #192). Dòng đầu `## Roles` là danh sách role phẳng, phân cách bằng dấu phẩy — script đọc đúng dòng đó.

## Gate Out

`ROUTE_STATUS: PLANNED` → continue to `delivery-dev-understand`.

## Report

```text
Classified: FEATURE / MEDIUM / HIGH risk / HIGH prod impact.

Roles: BA, SA, DEV, QC, INFOSEC, SRE.
Bỏ qua: baseline (không phải bug).
Cần human approval trước khi implement.

Next: understand.
```

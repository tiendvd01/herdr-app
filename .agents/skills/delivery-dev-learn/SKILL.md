---
name: delivery-dev-learn
description: "Phase 15 of delivery-dev (final, conditional) — capture what the developer should remember from an issue in SoraVaults/<project>/issue <n>/learnings.md, and turn PR or review feedback into reusable project rules in feedback.md. Use after the PR is prepared or after review feedback arrives."
---

# Devflow · Phase 15 — Learning & Feedback (conditional)

Read `../delivery-dev/references/conventions.md`, `../delivery-dev/references/writing-policy.md` and `../delivery-dev/references/supporting-artifacts.md` first.

**In:** the finished task · **Out:** `17-learnings.md`, `18-feedback.md` · **State:** `DONE`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> learn` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

Runs when a concept actually mattered, or when PR/review feedback arrived. Nothing to record is a valid outcome — say so in one line and stop.

## Learnings

Concepts that changed a decision in **this** issue, anchored to this repository. Format and rules: `supporting-artifacts.md` §3.

Test before writing an entry: *would the developer be slower on the next issue without it?* No ⇒ do not write it.

Not learnings: what the code does (that is `implementation.md`), why the approach was chosen (that is `decisions.md`), general programming knowledge.

## Feedback

PR comments (`followup.md`), review findings and QA defects that say something reusable about **this project**, not about this issue.

```md
# Feedback

## F001 — Controller không gọi repository trực tiếp

Nguồn: PR #1240, comment của @reviewer.

Feedback:
`PaymentController` gọi thẳng `PaymentRepository`.

Rule rút ra:
Controller → Service → Repository. Controller không chạm repository.

Evidence rule này có thật:
- `OrderController`, `UserController` đều đi qua service.
- CONTRIBUTING.md §Layering.

Đề xuất: thêm vào project rules — cần bạn duyệt.
```

Rules:

- A rule needs **evidence it is a real project rule** (other code follows it, or a doc states it) — one reviewer's opinion is a data point, not a rule.
- **Never modify global rules, `CLAUDE.md`, `AGENTS.md` or skills automatically.** Propose; the developer approves.
- A one-off correction with no general lesson stays in `review.md`. Do not promote it.

## Knowledge Map

Repo has a knowledge map ⇒ update it and reference the node. No map ⇒ the `## Knowledge Map` section in `learnings.md` is the whole mechanism. Do not build a knowledge system.

## Report

```text
Learnings: 1 (idempotency — vì sao retry cần key).
Feedback: 1 rule đề xuất (controller không gọi repository trực tiếp) — cần bạn duyệt trước khi ghi vào project rules.
```

Or:

```text
Không có gì đáng ghi lại từ issue này.
```

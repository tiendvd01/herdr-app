---
name: delivery-dev-operate
description: "Phase 12 of delivery-dev (conditional) — check that a verified change can be deployed and operated safely: deployment and migration order, rollback, configuration, monitoring, logging, alerting, health checks, resource usage and backward compatibility, recorded in SoraVaults/<project>/issue <n>/operational-check.md. Use when the change has production impact, a migration, or config/env changes."
---

# Devflow · Phase 12 — Operational Check (conditional)

Read `../delivery-dev/references/conventions.md`, `../delivery-dev/references/writing-policy.md` and **`../delivery-dev/references/devops.md`** first. Secrets, IAM or exposure in play ⇒ also `../delivery-dev/references/security.md`.

**In:** `verification.md` (`VERIFIED`) + `impact.md` · **Out:** `SoraVaults/<project>/issue <n>/14-operational-check.md` · **State:** `OPERATIONAL_CHECK`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> operate` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

Runs when `status.md` routed it in: Production Impact ≥ LOW · migration · config/env change. This is the SRE/DBA lens on shipping, not on code.

## Checklist

Answer only the lines that apply; each answer is a fact or an explicit `UNKNOWN`.

```text
Deployment       — deploy được bằng quy trình hiện tại? cần bước thủ công nào?
Migration order  — migration chạy trước hay sau khi deploy code? code cũ có sống được với schema mới?
Rollback         — rollback bằng cách nào? khôi phục được ĐẾN ĐÂU? (revert commit KHÔNG dựng lại RDS/S3 đã xoá)
Configuration    — env var / secret / feature flag mới? đã có ở mọi môi trường chưa?
Monitoring       — nhìn vào đâu để biết nó chạy đúng?
Logging          — log đủ để debug production chưa? có log nhầm PII/secret không?
Alerting         — hỏng thì ai biết, bằng cách nào?
Health checks    — có ảnh hưởng readiness/liveness không?
Resource usage   — thêm memory/CPU/connection/thread không?
Scaling          — chạy nhiều instance song song có an toàn không?
Backward compat  — client/consumer cũ còn chạy trong lúc rollout không?
```

## Infrastructure change (IaC)

Change touches Terraform / CloudFormation / k8s / CI config ⇒ the readiness answer is the **plan**, per `devops.md`.

**Do not run infra commands on your own initiative.** Take the plan from CI, or ask the developer to run it and paste the output, or ask approval for the one exact command — the command policy in `devops.md` (Tier 1 / 2 / 3) applies here in full.

Record in `operational-check.md`: counts (`add / change / destroy`), every `must be replaced` on a stateful resource, every IAM / security-group / bucket-policy change, drift found on unchanged code, and the deployment strategy (rolling · blue/green · canary · flag).

**`apply` is the developer's, always.** This phase produces a reviewed plan and a go/no-go, never an applied change — and even `plan` waits for your approval.

Thứ tự deploy từ 3 bước trở lên ⇒ vẽ `flowchart LR` thay vì liệt kê bằng chữ (writing-policy §7b).

## Risky Migrations

Schema change on a live table, or any change where old and new code run at once, uses the expand/contract sequence:

```text
Expand   — thêm cột/bảng mới, nullable, không phá cái cũ
Deploy   — code ghi cả cũ lẫn mới, đọc cái cũ
Backfill — điền dữ liệu, đo thời gian chạy và lock
Verify   — dữ liệu khớp
Contract — chuyển sang đọc mới, gỡ cái cũ (deploy sau)
```

State which step this PR contains and which are follow-ups. A single PR that expands, backfills and contracts at once on a large table is a finding, not a plan.

## Template

```md
# Operational Check

## Deploy
Thứ tự: migration → deploy code. Migration additive, code cũ vẫn chạy.

## Rollback
Revert deploy. Migration không cần rollback (chỉ thêm cột nullable).
Không khôi phục được: <cái gì đã xoá/ghi đè, chỉ lấy lại từ backup — hoặc: không có>

## Terraform Plan
`add 3 / change 1 / destroy 0` — không resource stateful nào bị replace.
IAM: thêm `ssm:GetParameter` scope theo path `/payment/*`.

## Config
Thêm `PAYMENT_RETRY_MAX=3`. Chưa có ở staging/prod → cần set trước khi deploy.

## Monitoring / Alerting
...

## Resource / Scaling
...

## Backward Compatibility
...

## Findings
- [H] Env var chưa tồn tại ở prod — deploy trước khi set sẽ crash boot.

---

OPERATIONAL_STATUS: READY | NOT_READY
```

## Gate Out

`READY` → continue to `delivery-dev-pr`; the findings become the PR's `Risk` and deploy notes.
`NOT_READY` → report the blocking item; it is fixed before the PR, not after.

## Report

```text
Operational check: NOT_READY.

- `PAYMENT_RETRY_MAX` chưa set ở prod → phải set trước khi deploy.
- Migration additive, rollback = revert deploy.
- Chưa có alert cho retry exhausted → đề xuất thêm, không blocking.

Next: set env var, rồi pr.
```

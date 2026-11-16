# Devflow — Engineering Roles

Roles are **lenses**, not people. Apply only the ones the issue actually needs (`status.md` → Roles). A role that has nothing to say is not run — no empty section.

Repository defines matching agents (`.claude/agents/`, e.g. `business-analyst`, `tech-lead`, `infosec`, `qa-tester`, `code-reviewer`)? Delegate to them. Otherwise apply the lens inline.

Each role appears at most twice: **design time** (ROLE_REVIEW, on `solution.md`) and **post-implementation** (SPECIALIST_REVIEW, on the real diff).

| Role | Question | Activate when |
|---|---|---|
| BA | What? Why? Business rules? AC? | Business feature, requirement change, ambiguous rule, workflow change |
| SA | How does the system solve this? | Complexity ≥ MEDIUM, cross-module, architecture change, new integration, data-flow change |
| DEV | How do we implement it in code? | Always |
| QC | How do we prove it works? | Always except DOCUMENTATION — owns phase 9 `delivery-dev-test` |
| INFOSEC | How could this be abused? | Auth, user input, external I/O, payment, PII, file upload, new dependency, **IAM/network/bucket policy**, Risk ≥ HIGH |
| PERFORMANCE | Can it handle the workload? | Perf is in the requirement, hot path, high traffic, N+1 risk, large data |
| DBA | Is the DB change safe and efficient? | Schema/index/migration/query change, large table |
| SRE / DEVOPS | Can it be deployed and operated safely? | Production Impact ≥ LOW, migration, config/env change, **any IaC/Terraform/cloud change**, new external dependency |
| FRONTEND / UX | Does it work for the person using it? | Any UI change — component, page, style, copy, interaction |
| CODE REVIEWER | Is it correct and maintainable? | Always (this is `delivery-dev-review`) |
| PO | Is this the right thing to build? | Requirement conflicts with product direction, or scope is questioned |

## BA
Business rules · acceptance criteria · expected behavior · what is explicitly out.

## SA
Architecture · components · data flow · API · service boundaries · dependencies · trade-offs · backward compatibility.

## DEV
Files · classes · functions · existing patterns · implementation shape · refactoring actually needed.

## QC
Owns the STLC pass (`delivery-dev-test`, phase 9). Coverage: happy path · negative · boundary · invalid state · regression · concurrency · retry · timeout · duplicate request.

Design techniques — name the one behind each case: equivalence partitioning · boundary value analysis · decision table · state transition · pairwise · error guessing. Boundary values pay best: any range, limit, timeout or size gets min−1/min/min+1 and max−1/max/max+1.

Levels: unit · integration · system · acceptance. `BLOCKED` (no environment/data) is never `PASS`.

Defect: **severity ≠ priority** — severity is technical impact, priority is business urgency. A defect closes only on a passing retest, never on the fix being written.

## INFOSEC
Depth in **`security.md`** — load it when this role is active: threat model (STRIDE per trust boundary), the surface-by-surface hunting table, supply chain, data classification, hard rules.

Name the **actual attack and its impact**, not a checklist. "Input validation: OK" is not a review. `POST /payments nhận amount từ body — gửi -100 tạo payment âm (payment/api.py:41)` is.

## PERFORMANCE
Latency (p50/p95/p99) · throughput · CPU · memory · DB load · query count · cache · network · concurrency · connection pool · queue · scaling.

**Never claim an improvement without measurement.** Perf work needs a baseline (`baseline.md`) and an after-number. No numbers ⇒ say `NOT_MEASURED`.

## DBA
Schema · index · query · execution plan · lock · transaction · migration · data volume · backfill · rollback · data integrity.

## SRE / DEVOPS
Depth in **`devops.md`** — load it when this role is active: Terraform workflow and plan review, the AWS checklist (IAM · S3 · network · RDS · secrets/KMS · compute · observability/cost), deployment strategies, and what a rollback actually restores.

Deployment · configuration · env vars · migration order · rollback · monitoring · logging · alerting · health checks · resource usage · scaling · cost · production safety.

**Never `terraform apply`, never touch state, never widen a permission to unblock yourself.**

## FRONTEND / UX
Repo has its own UI skill or design system (`design-ui-ux`, `ui-ux-pro-max`, a token file, a component library) ⇒ **load and follow it**; this list is the default.

**Mockup thật trước khi code UI.** Issue có đụng frontend (màn hình, component, layout, copy) ⇒ gọi skill **`find-mockup-repo`** với mã dự án (số đầu của tên dự án/repo, vd `168`) để mở repo trong `~/Documents/SoraTech/mockup-ui/` và xem mockup thật (thường ở `07-UI設計`). Lý do: mockup là nguồn sự thật về giao diện khách đã duyệt; đoán từ text issue dễ làm sai layout, label, trạng thái. Ghi đường dẫn mockup đã xem vào `05-investigation.md` §10 Evidence (ở phase investigate) và đối chiếu lại ở implement + verify. Không tìm thấy mockup ⇒ ghi `UNKNOWN`, hỏi người dùng, đừng tự bịa giao diện.

**Yêu cầu "khớp demo/mockup" (px, weight, padding, độ rộng cột) ⇒ đo, đừng nhìn.** Dùng skill **`delivery-ui-measure`**: capture demo + app, diff, ra bảng lệch có số. Đo ở investigate (Today), test và verify; báo cáo đính vào `13-verification.md` và PR.

- **States**: loading · empty · error · partial · long content · slow network. A screen with only the happy state is unfinished.
- **Keyboard**: reachable by Tab, visible focus ring, Esc closes, Enter submits, no keyboard trap in a modal.
- **Accessibility**: semantic element before ARIA · label on every control · contrast on text and on state colors · target size · `prefers-reduced-motion`.
- **Theme**: dark and light both checked; no hardcoded color where the project has tokens.
- **i18n**: no string hardcoded in the component if the project has a translation layer · layout survives a long translation · date/number/currency formatted, not concatenated.
- **Responsive**: the breakpoints the project actually supports; no horizontal scroll on the narrowest one.
- **Interaction**: disabled state during submit (double-submit is a real bug, not a nit) · destructive action confirmed · error message says what to do next, not just what failed.

Verify by running the UI, not by reading the diff — a screenshot or a described interaction is the evidence.

## CODE REVIEWER
Correctness · security · performance · error handling · concurrency · maintainability · project conventions · test quality · scope creep.

## Output shape (any role)

```md
### INFOSEC

- [H] `payment/api.py:41` — amount lấy trực tiếp từ body, chưa validate > 0.
  → Tạo được payment âm. Fix: validate ở request schema.

Không có vấn đề khác ở surface này.
```

Findings only. No preamble, no "overall the design looks solid". Nothing to report ⇒ one line saying so.

---
name: delivery-dev-test
description: "Phase 9 of delivery-dev — the STLC pass: derive test conditions from acceptance criteria, design test cases with explicit techniques (equivalence partitioning, boundary value, decision table, state transition, pairwise, error guessing), prepare test data and environment, execute, log defects with severity and priority, retest and run regression, then check exit criteria. Produces SoraVaults/<project>/issue <n>/tests.md. Use after implementation, before code review, or when asked to design or run tests for an issue."
---

# Devflow · Phase 9 — Test Design & Execution (STLC)

Read `../delivery-dev/references/conventions.md`, `../delivery-dev/references/writing-policy.md` and `../delivery-dev/references/supporting-artifacts.md` first.

**In:** `plan.md` §8 test plan + `implementation.md` (`DONE`) + `understanding.md` (AC) · **Out:** `SoraVaults/<project>/issue <n>/11-tests.md` · **State:** `TEST_DESIGN → TEST_EXECUTION`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> test` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

The developer already ran their own unit tests in `delivery-dev-implement`. This phase is the **QC pass**: prove the AC hold, from the outside, with cases someone designed on purpose.

```text
STLC ở đây:  test conditions → test cases → test data → environment
             → execution → defect log → retest + regression → exit criteria
```

STLC 1 (testability of the AC) happened in `delivery-dev-understand`; STLC 2 (test plan) in `plan.md` §8; STLC 6 (closure report) is `delivery-dev-verify`. This phase owns 3–5.

**Adaptive.** `status.md` decides the depth:

```text
DOCUMENTATION / typo        bỏ phase này
Bug LOW                     regression test của reproduction + suite hiện có
Feature MEDIUM              test case theo AC + negative + boundary
Payment / CRITICAL          đủ 6 bước, kèm concurrency · duplicate · partial failure
```

## 1. Test conditions

One AC → one or more test conditions. A condition is *what must be true*, not yet *how to check it*. An AC that yields no testable condition is a testability defect — send it back to `delivery-dev-understand`, do not invent one.

**Conditions cũng đến từ CODE, không chỉ AC.** AC là mô hình của tác giả/spec — một **entry-path, state, guard, hay actor-multiplicity mà code có nhưng AC không nhắc** vẫn là một test condition, và đó đúng là chỗ bug ẩn (path thứ hai, actor thứ hai, DB đã-migrate, state không lối ra). Đọc state machine + guards + call-site của operation, đừng chỉ đọc danh sách AC. Cách enumerate: _Coverage matrix_ dưới.

## 2. Test case design — name the technique

Never write cases by intuition alone. Each case says which technique produced it:

| Technique | Use when | Gives you |
|---|---|---|
| Equivalence Partitioning | input has classes behaving the same | 1 case per class, not 20 per class |
| Boundary Value Analysis | any range, limit, size, timeout, quantity | min−1 · min · min+1 · max−1 · max · max+1 |
| Decision Table | several conditions combine into different outcomes | one rule per combination that matters |
| State Transition | entity has a status/workflow | valid transitions + the invalid ones people actually attempt — **vẽ `stateDiagram-v2` trước rồi mới liệt case** (writing-policy §7b) |
| Pairwise | many independent parameters | cover every pair instead of every combination |
| Error Guessing | known-fragile spots in this repo | null, empty, duplicate submit, huge payload, wrong type, timezone |

Boundary values are the highest-yield technique for most issues — if the change touches a limit, a range, a timeout or a size, the boundary cases are mandatory.

### Levels and types

| Level | Owns |
|---|---|
| Unit | logic branches — mostly already written in `delivery-dev-implement` |
| Integration | module ↔ module, service ↔ DB, service ↔ external API |
| System | the flow from the user's entry point |
| Acceptance | the AC as the issue author would check them |

Types to consider, keep the relevant ones: functional · negative · boundary · regression · smoke · concurrency · security · performance · compatibility · **fresh-vs-migrated parity** (khi PR có migration/seed sửa reference data: trạng thái sau seed-mới == sau migrate).

## Coverage matrix — enumerate theo CHIỀU, không chỉ theo AC

Suy case chỉ từ AC là **bỏ đúng chỗ AC im lặng**. Với PR đụng logic / state / RBAC / migration, dựng
ma trận theo các chiều dưới (đọc từ **code**, không chỉ AC; chiều không áp ⇒ ghi `N/A` + lý do). Một
ô còn trống trong chiều đang áp = case **còn thiếu**, không phải "đã đủ":

| Chiều | Enumerate (từ CODE) |
|---|---|
| **State machine** | Mỗi state → **mọi** exit hợp lệ + các exit **không hợp lệ** người dùng hay thử; và **dead-state check**: state nào giao task/việc cho actor X thì X phải có một move từ đó (không thì task treo vĩnh viễn). Vẽ `stateDiagram-v2` rồi liệt case từ đó. |
| **Entry-path** | operation × {HTTP route · queue/inbox consumer · batch/cron · CLI · caller nội bộ}. Một rule chứng minh ở một path **không** tự đúng ở path khác. |
| **Actor / role** | 0 / 1 / N participant; đúng role vs sai role; và **cùng role nhưng khác định danh** (identity ≠ role — "một actor có role R" ≠ "actor đã thực hiện hành động trước đó"). |
| **Data origin** | DB **seed-mới vs đã-migrate** (reference data lệch không?); rỗng / có dữ liệu / có row soft-deleted. |
| **Boundary** | min−1 · min · min+1 · max−1 · max · max+1 cho mọi giới hạn / độ dài / timeout / số lượng (kỹ thuật lợi nhất). |

**"Mỗi AC có 1 case" là sàn thấp nhất, KHÔNG phải đủ.** Một business rule một-dòng có thể cần hàng
chục case (mỗi state × mỗi actor × mỗi boundary). Số case ít hơn số ô ma trận đang áp = chưa xong.

## 3. Test data

State the data each case needs and where it comes from: fixture · factory · seed · staging record · anonymised copy.

**Never use real production data, real customer PII, or real payment credentials.** Need a production-like case ⇒ anonymise, and say so.

## 4. Environment

**AC dạng số đo UI** (px, weight, padding, độ rộng cột, "không bị cắt") ⇒ oracle là `delivery-ui-measure`: capture lại demo + app trên HEAD, `diff.mjs` phải exit 0 (màu thuộc task khác thì `--ignore-colors` và ghi rõ). Mỗi AC một dòng trong test case, dẫn tới dòng của `report.md`; ảnh/báo cáo để trong `evidence/`. Không đo được (chưa có seed, thiếu cookie phiên) ⇒ `BLOCKED` kèm lý do.

Record where the tests ran: local · docker · CI · staging, plus branch/commit, DB state, mocked vs real external services. A result without an environment is not reproducible and therefore not evidence.

Cannot get an environment ⇒ the case is `BLOCKED` with the reason. `BLOCKED` is not `PASS` and not a failure of the code.

## 5. Execution + defect log

Run them. Record `PASS` · `FAIL` · `BLOCKED (reason)` · `NOT_RUN (reason)` — **only what you actually observed**. No invented output, no invented count, no "should pass".

A `FAIL` becomes a defect entry. **Severity ≠ priority**:

| | Means | Set by |
|---|---|---|
| Severity | how badly it breaks (`CRITICAL`/`HIGH`/`MEDIUM`/`LOW`) | technical impact |
| Priority | how soon it must be fixed (`P1`/`P2`/`P3`) | business urgency |

A cosmetic typo on the checkout button is `LOW` severity, `P1` priority. A data-corruption bug in an unused admin tool is `CRITICAL` severity, `P3` priority. Do not collapse the two.

Lifecycle: `NEW → FIXED (delivery-dev-implement) → RETEST → CLOSED` or `REOPENED`. A defect is closed only by a retest that passed, never by the fix being written.

## 6. Retest + regression

After any fix: retest the failing case, then run the regression set — the flow traced in `investigation.md` §3 and the areas listed in `impact.md`. A fix that closes a defect and breaks a neighbour is a net loss; regression is what catches it.

## Template

```md
# Tests

## Environment
local docker · commit `abc1234` · Postgres seed `fixtures/payments.sql` · Payment API mocked

## Test Conditions

| AC | Condition |
|---|---|
| AC-1 | Timeout của external API phải được retry |

## Test Cases

| ID | AC | Technique | Level | Case | Data | Expected | Result |
|---|---|---|---|---|---|---|---|
| TC1 | AC-1 | Boundary | integration | timeout = 4.9s | mock delay 4.9s | không retry, trả 200 | PASS |
| TC2 | AC-1 | Boundary | integration | timeout = 5.1s | mock delay 5.1s | retry 1 lần | PASS |
| TC3 | AC-1 | Boundary | integration | retry lần 4 | mock luôn timeout | dừng ở 3, trả 504 | FAIL → D1 |
| TC4 | AC-2 | Error guessing | integration | double submit | 2 request cùng key | chỉ 1 payment | BLOCKED (thiếu staging) |

## Defects

### D1 — retry 4 lần thay vì 3
Severity: HIGH · Priority: P1 · Status: RETEST
Case: TC3
Evidence: `payment/client.py:91` — vòng lặp dùng `<=` thay vì `<`.
Fix: implementation.md Step F1.
Retest: TC3 → PASS (2026-09-08).

## Regression
- Luồng `POST /payments` (investigation.md §3) → PASS
- Order flow dùng chung `PaymentClient` (impact.md) → PASS

## Coverage
AC có test: 2/2 · State exits: 6/6 (+ invalid + dead-state OK) · Entry-paths: 2/2 · Actor: 0/1/N + wrong-role + same-role-diff-identity · Origin: fresh+migrated · Boundary: done · Test case: 14 (13 PASS · 1 BLOCKED) · Defect mở: 0

---

TEST_STATUS: PASSED | FAILED | BLOCKED
TESTED_SHA: <git rev-parse HEAD lúc chạy>
```

## Exit criteria — G5

```text
[ ] Mọi AC có ít nhất một test case  (sàn — chưa phải "đủ")
[ ] Coverage matrix điền cho mọi chiều đang áp: mọi state exit (hợp lệ + invalid) + dead-state check · mọi entry-path · actor 0/1/N + sai-role + same-role-khác-định-danh · fresh-vs-migrated · boundary
[ ] Mọi case đã chạy, hoặc BLOCKED/NOT_RUN kèm lý do
[ ] Không còn defect CRITICAL/HIGH đang mở
[ ] Defect đã fix đều được RETEST PASS
[ ] Regression đã chạy trên flow và impact area
```

`TEST_STATUS: PASSED` ⇒ continue to `delivery-dev-review`.
`FAILED` ⇒ defect quay lại `delivery-dev-implement` (fix loop), rồi chạy lại phase này.
`BLOCKED` ⇒ nói rõ thiếu gì (môi trường, dữ liệu, quyền) và AC nào vì thế chưa chứng minh được. **Không được coi `BLOCKED` là đã đạt.**

## Honesty (HARD BLOCK)

- Không bịa kết quả, số case, coverage, hay tên test.
- Không đánh `PASS` cho case chỉ đọc code mà không chạy — đó là `NOT_RUN (code review only)`.
- Không sửa case cho khớp hành vi sai của code. Case sai thì sửa vì nó *đọc sai requirement*, và nói rõ lý do.
- Không xoá case đang `FAIL`.

## Report

```text
Test: 4 case / 2 AC. 3 PASS · 1 BLOCKED.

- D1 (HIGH/P1) retry 4 lần thay vì 3 → đã fix, retest PASS.
- TC4 BLOCKED: chưa có credential staging → AC-2 chưa chứng minh được.
- Regression: PASS.

TEST_STATUS: BLOCKED — cần credential staging cho AC-2.
Next: bạn cấp credential, hoặc chấp nhận ship với AC-2 chưa verify (cần bạn quyết).
```

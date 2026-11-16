---
name: delivery-dev-verify
description: "Phase 11 of delivery-dev — final verification against the issue's acceptance criteria with actually executed tests on the final state, honest PASS/FAIL/NOT_RUN records, regression check, completed traceability and no unresolved review findings. Use after the AI code review is APPROVED, or when asked whether an issue's acceptance criteria are met."
---

# Devflow · Phase 11 — Final Verification

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/supporting-artifacts.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** `understanding.md` (AC) + `tests.md` (`PASSED`) + `review.md` (`APPROVED`) + `traceability.md` · **Out:** `13-verification.md` · **State:** `FINAL_VERIFICATION`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> verify` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Prove — or disprove — that each Acceptance Criterion is satisfied, on the **final** state of the code.

Gate in: `tests.md` says `TEST_STATUS: PASSED` **and** `review.md` says `REVIEW_STATUS: APPROVED`. Either failing ⇒ back to the fix loop; final verification does not run on untested or unreviewed code.

This phase is STLC 6 (test closure) plus the AC verdict. It does not design tests — `tests.md` holds the cases and results — it decides whether that evidence actually satisfies the requirement, and closes the cycle with metrics.

## Honesty Rules (HARD BLOCK)

- Never claim a test passed unless it was actually executed. Cite the real result.
- Never fabricate output, coverage or a test name.
- A test that could not run is `NOT_RUN` **plus the reason** (no environment, needs external service, needs credentials, needs a device…).
- A failing AC is `FAIL`. Do not soften it into "mostly works". Allowed states: `PASS` · `FAIL` · `NOT_RUN (reason)` · `BLOCKED (reason)`.
- No AC may be marked `PASS` from reading the code alone — that is `NOT_RUN (code review only)`.
- **Re-run on the final state.** Results recorded in `implementation.md` before the review fixes are stale — do not cite them as verification. Same for `tests.md`: `TESTED_SHA` ≠ HEAD ⇒ its results describe older code; re-run the affected cases here and say which.
- **Verify the FINAL HEAD, and `HEAD` must equal `review.md`'s `REVIEWED_SHA`.** If `git rev-parse HEAD` ≠ `REVIEWED_SHA`, commits landed after the review (fix, polish, new request, rebase) and the change since then is unreviewed ⇒ go back to `delivery-dev-review` on that delta first (`REVIEWED_SHA..HEAD`, or `git range-diff` after a rebase); verification does not pass over unreviewed code (`conventions.md` §3).
- **FE-touching change ⇒ run FE for real:** `npm run build` + `vitest`, and open the browser for any new screen/nav. Never leave FE at `NOT_RUN`/`UNKNOWN` while `npm` is runnable — a runtime 404 or a dead i18n key only shows when the screen actually renders.
- **Mỗi finding từng là bug thật ⇒ re-prove red→green trên final HEAD, KHÔNG tin nhãn `FIXED`.** Nếu finding được tìm bằng một repro chạy được (probe / request / case), **chạy lại chính repro đó trên HEAD** và quan sát nó **giờ pass** (lý tưởng: cho thấy nó vẫn fail trên commit trước fix). Cite `file:line FIXED` là mô tả, không phải bằng chứng đóng.
- **Behavior-touching ⇒ carry Behavior-proof sang final HEAD.** Không chỉ chạy assertion happy-path của AC: **chạy lại probe đối kháng (entry-path × negative/bypass) từ `tests.md` / Behavior-proof của review** trên HEAD, quan sát response **+ state**. Bảng AC **không** phải trần: một path / actor / origin mà `tests.md` Coverage matrix có nhưng AC im lặng ⇒ vẫn phải có dòng verify ở đây; một chiều matrix đang áp mà không có verification = `NOT_VERIFIED`.

## Steps

1. Copy every AC from `understanding.md` into the AC table.
2. For each AC, state how it is verified and run that verification.
3. Re-run the repository's test / lint / typecheck / build commands on the current code — BE (`ruff`/`mypy`/`pytest`) **and** FE (`npm run build`/`vitest`) whenever the diff touches that side; open the browser for any new UI flow.
4. Run a regression check on the flow traced in `investigation.md` §3, plus any area flagged in its Impact Analysis.
5. Verify manually what tests cannot cover, and say exactly what you did. AC khớp demo/mockup theo số đo ⇒ chạy lại `delivery-ui-measure` trên `HEAD` cuối (không dùng báo cáo của phase test nếu đã có commit sau đó), đính `report.md` vào `13-verification.md` và PR.
6. `git diff --stat <base>...HEAD` (`<base>` = `Base branch` in `context.md`) — confirm no unrelated file changed and the diff stays inside `plan.md` §2 Scope.
7. Complete `traceability.md`: fill `Verification` + `Status` for every row → `TRACEABILITY_STATUS: COMPLETE`.
8. Confirm no `CRITICAL`/`HIGH` finding in `review.md` is unresolved.
9. Write `13-verification.md` and set the final status.
10. Capture anything worth keeping in `learnings.md` (concepts only, not a diary).

## Template

```md
# Verification

## 1. Acceptance Criteria

| # | Requirement | Verification | Result |
|---|---|---|---|
| AC-1 | ... | `pytest tests/test_x.py::test_y` | PASS |
| AC-2 | ... | manual: ... | PASS |
| AC-3 | ... | needs staging payment API | NOT_RUN (reason) |

## 2. Tests

### Behavior re-proof (entry-path × adversarial, chạy trên HEAD)
- <path: route / inbox / batch / CLI> · <input negative/bypass> → <response + state quan sát> — PASS/FAIL/NOT_RUN
  (N/A chỉ khi change không đụng hành vi — ghi rõ)

### Unit Test
- `<command>` → <result>

### Integration Test
- ...

### E2E Test
- ... (hoặc: NOT_RUN — reason)

## 3. Regression Test
- <flow đã trace ở investigation.md> → <result>
- <area trong Impact Analysis> → <result>

## 4. Manual Verification
- <đã làm gì, thấy gì>

## 5. Test Results
<actual output, trimmed to the relevant lines>

## 6. Test Closure  (STLC 6)

| Metric | Value |
|---|---|
| AC có test | 2/2 |
| Case chạy / tổng | 3/4 (1 BLOCKED) |
| Defect mở / đã đóng | 0 / 1 |
| Regression | PASS |
| Exit criteria (`plan.md` §8) | đạt / chưa: ... |

Chưa đạt exit criteria ⇒ nói rõ AC nào chưa chứng minh được và vì sao (thiếu môi trường, quyền, dữ liệu). Đó là thông tin để bạn quyết ship hay không — **không** tự nâng thành PASS.

## 7. Review Findings Resolved (re-proven red→green)
- [C1] → FIXED — repro chạy lại trên HEAD: `<lệnh/probe>` → giờ PASS (`file:line`)
- [M1] → WON'T FIX (reason) — không blocking

## 8. Remaining Issues
- ... (hoặc: None)

## 9. Unrelated Changes
- None (git diff --stat: ...)

---

FINAL_STATUS: VERIFIED | NOT_VERIFIED
```

## G6 — Final Verification Gate

The issue is complete only when this chain is consistent:

```text
Original Requirement → Acceptance Criteria → Implementation → Test cycle → Review → Verification
```

```text
[ ] Acceptance Criteria verified
[ ] Test cycle closed (tests.md → PASSED, exit criteria đạt)
[ ] Tests executed (or NOT_RUN / BLOCKED with a reason)
[ ] FE build/test chạy nếu diff đụng FE (không UNKNOWN khi máy chạy được)
[ ] Regression checked
[ ] Review completed (review.md → APPROVED)
[ ] HEAD == review.md REVIEWED_SHA (không có commit chưa-review sau review)
[ ] Traceability complete (traceability.md → COMPLETE)
[ ] No unresolved CRITICAL/HIGH findings
[ ] Mỗi blocking finding re-proven bằng repro chạy lại trên HEAD (red→green, không chỉ nhãn FIXED)
[ ] Behavior-proof / các chiều Coverage-matrix của tests.md đã carry sang verification (hoặc NOT_RUN có lý do)
[ ] No unrelated changes
```

Full-chain check for a resumed or long-running task:

```text
[ ] Project context loaded      (context.md LOADED)
[ ] Route planned               (status.md ROUTE_STATUS: PLANNED)
[ ] Requirement understood      (understanding.md READY)
[ ] Codebase investigated       (investigation.md READY)
[ ] Plan completed              (plan.md READY)
[ ] Implementation completed    (implementation.md DONE)
[ ] Test cycle passed           (tests.md PASSED)
[ ] Solution approved           (solution.md APPROVED — nếu có phase này)
[ ] Human approval               (status.md APPROVAL_STATUS — nếu được route)
[ ] Review approved             (review.md APPROVED)
```

Any unchecked line ⇒ `NOT_VERIFIED`: report it, fix it, verify again. `VERIFIED` ⇒ continue to `delivery-dev-operate` when the route plan includes an operational check, otherwise `delivery-dev-pr`.

## Report

Phase summary: `x/y` AC PASS, what failed or could not run and why, regression status, traceability status, gate checklist result, next step.

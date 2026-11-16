---
name: delivery-dev-followup
description: "Phase 14 of delivery-dev — the life of the PR after it is opened: read CI status and failures, triage reviewer comments, fix, re-test, push, and answer each thread, until the PR is merged. Produces SoraVaults/<project>/issue <n>/followup.md. Use when CI is red on the PR, when a reviewer requested changes, or on \"/devflow followup #1234\"."
---

# Devflow · Phase 14 — Post-PR Follow-up

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** an open PR + `pr.md` · **Out:** `SoraVaults/<project>/issue <n>/16-followup.md` · **State:** `PR_OPEN → CI_FAILING | CHANGES_REQUESTED → FIXING → PR_OPEN → MERGED`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> followup` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Most of an issue's real life happens **after** the PR is opened. This phase covers it: CI, review comments, and the loop back into the workflow — with the same evidence rules as everything else.

## 1. Read the actual state

```bash
gh pr view <n> --json number,title,state,mergeable,reviewDecision,statusCheckRollup
gh pr checks <n>
gh pr view <n> --comments
```

GitHub MCP tools (`get_pull_request_status`, `get_pull_request_comments`, `get_pull_request_reviews`) are equally fine when the session prefers them. Never guess CI status or what a reviewer meant. `gh` read commands are fine; `gh pr merge`, `gh pr close`, `gh pr review` are **not yours** — merging and formal approval are the developer's.

## 2. CI failure triage

Read the failing job's log, not just its name:

```bash
gh run view <run-id> --log-failed
```

| Cause | Do |
|---|---|
| Real defect this PR introduced | fix via `delivery-dev-implement`, retest via `delivery-dev-test` |
| Test wrong / outdated expectation | fix the test, and say why the old expectation was wrong |
| Flaky | prove it: same commit, re-run, both outcomes. Then report it as flaky — **do not** rerun until green and call it fixed |
| Environment / secret / runner | not a code problem — report it to the developer, do not paper over it |
| Pre-existing failure on the base branch | verify by checking base; report, do not adopt it as this PR's problem |

**Never disable, skip, or `@pytest.mark.skip` a failing test to get CI green.** That is hiding a defect, not fixing one.

## 3. Review comments

Triage each thread — not every comment is a change request:

| Type | Response |
|---|---|
| Blocking defect | fix, push, reply with the commit |
| Requested change (style, naming, structure) | do it, or say concretely why not — the reviewer decides |
| Question | answer with evidence (`file:line`), no code change |
| Suggestion / nit | do it if cheap; otherwise say so plainly |
| Out of scope | agree it is worth doing, propose a separate issue, do not expand this PR |

**Disagreeing is allowed** when you have evidence — say it once, clearly, and let the reviewer decide. Do not silently comply with a change you believe is wrong, and do not argue past the first exchange.

## 4. Fix loop

Fixes go back through the workflow, not around it:

```text
comment/CI → delivery-dev-implement (commit riêng, dẫn thread/check)
           → delivery-dev-test (retest + regression)
           → push
           → trả lời thread
```

Push is the developer's call unless they already told you to push on this PR. Ask once per PR, not per commit.

Mỗi commit đẩy lên để trả lời review/CI làm phần sau `REVIEWED_SHA` **chưa-review** ⇒ chạy lại `delivery-dev-review` trên delta rồi mới coi PR là sẵn sàng, và cập nhật `REVIEWED_SHA` (`conventions.md` §3). "Đã review 1 lần" không phủ các commit vá sau đó.

**Rebase lên base mới** (bắt buộc với repo linear-history) viết lại SHA ⇒ `REVIEWED_SHA` không còn là ancestor. Delta = `git range-diff <REVIEWED_SHA>...HEAD`: commit nào đổi nội dung khi rebase (conflict fix, renumber migration/revision id) được review lại; rồi chạy lại toolchain + test trên HEAD mới. Force-push sau rebase là việc của developer.

Behavior changed during follow-up ⇒ update `verification.md` and `pr.md` too. A PR body describing what the first commit did is misleading by the fifth.

## Template

```md
# Follow-up

PR: #<n> · <url> · state: OPEN · review: CHANGES_REQUESTED · CI: 2/3 pass

## CI
- `test-integration` FAIL → defect thật: retry đếm sai (D2) → fix `a1b2c3d` → PASS
- `lint` FAIL → pre-existing trên `main`, không phải PR này (chứng minh: chạy trên base cũng đỏ)

## Review threads
| # | Reviewer | Nội dung | Xử lý |
|---|---|---|---|
| 1 | @a | retry cả 4xx | FIXED `a1b2c3d` |
| 2 | @b | tách helper ra file riêng | KHÔNG — chỉ dùng 1 chỗ, tách sớm; đã trả lời thread |
| 3 | @b | logging thiếu request id | OUT OF SCOPE → đề xuất issue riêng |

## Artifacts updated
- verification.md: chạy lại AC-1 sau fix D2 → PASS
- pr.md: cập nhật mục Testing

---

FOLLOWUP_STATUS: OPEN | MERGED
```

## Gate Out

CI green · mọi thread blocking đã xử lý hoặc đã trả lời · `verification.md` và `pr.md` khớp với code hiện tại ⇒ báo là sẵn sàng merge.

**Merge là việc của bạn (developer), không phải của tôi.** Sau khi merge: `delivery-dev-learn` để rút rule dùng lại được từ feedback.

## Report

```text
PR #1240: CI xanh, 3 thread.

- Thread 1 (retry 4xx): đã fix, commit a1b2c3d.
- Thread 2 (tách helper): không làm — chỉ dùng 1 chỗ; đã trả lời, chờ @b.
- Thread 3 (logging): ngoài scope → đề xuất issue riêng.
- `lint` đỏ là pre-existing trên main, không phải PR này.

Sẵn sàng merge khi @b đồng ý với thread 2.
```

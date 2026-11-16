# Devflow — Supporting Artifacts

`08-traceability.md`, `90-decisions.md`, `17-learnings.md` and `18-feedback.md` are **living** files written across several phases. They are supporting outputs, **not extra blocking phases** — they never stall the flow, but a gate may check them.

## 1. 08-traceability.md

Connects `Requirement → Implementation → Test → Verification` so nothing silently falls out of the chain.

- **Created** by `delivery-dev-solution` (or by `delivery-dev-investigate` when no solution phase was routed): one row per meaningful Acceptance Criterion from `understanding.md`, with the design element that satisfies it and the code location found during investigation.
- **Updated** by `delivery-dev-implement` — fill `Code` with what was actually changed, `Test` with the test that covers it.
- **Completed** by `delivery-dev-verify` — fill `Verification` and `Status` from real results.

```md
# Requirement Traceability

| ID | Requirement | Solution | Code | Test | Verification | Status |
|---|---|---|---|---|---|---|
| R1 | AC-1: retry khi timeout | RetryPolicy ở PaymentClient | `payment/client.py:88` | `tests/test_client.py::test_retry` | `pytest` → pass | PASS |
| R2 | AC-2: không tạo payment trùng | Idempotency key | `payment/client.py:96` | — | manual staging | NOT_RUN (no staging creds) |

The `Solution` column is dropped when no solution-design phase ran.

---

TRACEABILITY_STATUS: CREATED | UPDATED | COMPLETE
```

Rules:

- Every meaningful AC has a row. Use `R<n>` ids and reference the `AC` they come from.
- `Status`: `PASS` · `FAIL` · `NOT_RUN (reason)` · `PENDING`.
- **Never `PASS` without evidence** in the `Verification` column.
- A row with no `Code` after implementation means the requirement was not implemented — surface it, do not delete the row.

## 2. 90-decisions.md

Only decisions that **materially affect implementation**. This is not a diary — no "chose a variable name", no restating the plan.

Worth recording: where the logic belongs · database design · API behavior · retry strategy · concurrency strategy · caching strategy · error handling · architectural trade-off · backward-compatibility choice.

```md
# Decisions

## D001 — <Decision Title>

### Question
...

### Decision
...

### Reason
<dựa trên evidence: file:line, hoặc pattern có sẵn trong repo>

### Alternatives
1. ...
2. ...

### Why Alternatives Were Rejected
...

### Impact
<files, behavior, risk, backward compatibility>
```

Rules:

- Sequential ids `D001`, `D002` — never renumber.
- A decision made under an `ASSUMPTION` says so, and says what would confirm it.
- `plan.md`, `implementation.md` and `review.md` reference decisions by id instead of re-arguing them.
- A decision reversed later gets a new entry that supersedes the old one; the old entry stays.

## 3. 17-learnings.md

Concepts worth the developer's long-term memory — captured only when they actually mattered for this issue. One or two entries is a normal issue; zero is fine.

```md
# Learnings

## L001 — <Concept>

### What is it?
<giải thích tiếng Việt đơn giản>

### Why does it matter in this issue?
...

### How does this project use it?
<file:line cụ thể trong repo này>

### Example
...

### Key takeaway
<một câu>

## Knowledge Map

Domain:
- Backend
- Distributed Systems
- Payment

Concepts:
- Retry
- Exponential Backoff
- Idempotency
```

Rules:

- Developer-facing explanation in Vietnamese; keep the technical term in English/Japanese.
- Anchor every concept to real code in this repository, not to a textbook.
- Do not write a tutorial for a concept the issue did not depend on.

### Knowledge Map

- Repository already has a knowledge map (e.g. `docs/knowledge-map*`, `wiki/`, `knowledge/`) ⇒ **update it** and have `learnings.md` reference the relevant node instead of duplicating the content.
- No knowledge map ⇒ **do not build one.** The lightweight `## Knowledge Map` section above is the whole mechanism.

Long-term shape:

```text
Issue #123 → Learning → Concept → Knowledge Map → Future Issue
```

## 4. 18-feedback.md

PR/review feedback that says something reusable about **this project** — written by `delivery-dev-learn`. Format, evidence bar and the rule against auto-editing global rules: see `../../delivery-dev-learn/SKILL.md`.

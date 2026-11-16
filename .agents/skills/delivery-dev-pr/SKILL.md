---
name: delivery-dev-pr
description: "Phase 13 of delivery-dev — write a pull request description from the original issue plus the actual implementation, verification and review results, following the repository's PR template and language convention. Use after verification is VERIFIED, or when asked to prepare the PR text for an issue task."
---

# Devflow · Phase 13 — PR Preparation

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** `original.md` + `plan.md` + `implementation.md` + `review.md` + `verification.md` (`VERIFIED`) · **Out:** `SoraVaults/<project>/issue <n>/15-pr.md` · **State:** `PR_READY`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> pr` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Describe what was actually shipped — nothing aspirational.

Gate in: `verification.md` says `FINAL_STATUS: VERIFIED`. `NOT_VERIFIED` ⇒ do not write a PR description yet.

## Sources (and nothing else)

```text
Original Issue      → what was asked, and the closing reference
Solution (if any)   → why this design, in one or two lines
Implementation      → what changed, how
Verification        → how it was tested, what is NOT_RUN
Review              → known limitations, accepted MEDIUM/LOW findings
Operational check   → deploy notes, migration order, rollback, risk
```

**Never generate a PR description from assumptions.** A change not in the diff does not appear in the PR.

The PR must state: **what changed · why · how it was implemented · how it was tested · known limitations · risk**.

## Step 0 — Find the repository PR template FIRST

Before writing a single line, look for the project's template. **The repo template wins over anything in this skill.**

```bash
ls .github/PULL_REQUEST_TEMPLATE.md .github/pull_request_template.md \
   .github/PULL_REQUEST_TEMPLATE/*.md \
   PULL_REQUEST_TEMPLATE.md pull_request_template.md \
   docs/PULL_REQUEST_TEMPLATE.md docs/pull_request_template.md 2>/dev/null
```

Found ⇒ read it in full and use it as the skeleton of `pr.md`. `.github/PULL_REQUEST_TEMPLATE/` holding several files ⇒ pick the one matching the issue type from `status.md` (bug / feature / hotfix…); genuinely ambiguous ⇒ ask, do not guess.

`context.md` may already name the template — check there before searching.

## Using the template (hard rules)

1. **Headings verbatim, in the template's order, in the template's language.** Do not rename, reorder, translate, merge or drop a section.
2. **Do not add a section the template does not have.** Content with no home — deploy notes, known limitations — goes into the closest existing section (`Notes`, `Others`, `備考`…). No home at all ⇒ leave it out of the PR body and say so in the report.
3. **Every section gets filled**, from the artifacts. A section that truly does not apply gets the template's own convention for that (`N/A`, `-`, `なし`) — never deleted, never left as an empty heading.
4. **HTML comments** (`<!-- mô tả ngắn -->`) are instructions to the author: follow them, then remove the comment. Keep a comment only when it is clearly meant to stay in the body.
5. **Checklists**: tick only what `verification.md` actually shows. An unticked box stays unticked with a one-line reason next to it. Never tick a box to make the PR look complete.
6. Template requires something delivery-dev does not have (ticket link, screenshots, reviewer list, migration flag) ⇒ fill what you can and mark the rest `UNKNOWN` / leave it for the developer. Do not invent a ticket id or a screenshot.

No template found anywhere ⇒ use the fallback below.

## Content Rules

1. Language: follow the repository/team convention — the template's own language decides. A Japanese repo gets a Japanese PR even though the analysis was Vietnamese; Vietnamese stays the developer's explanation language, not the PR's.
2. `Testing` (or its equivalent section) lists what was really executed. Anything `NOT_RUN` in `verification.md` stays `NOT_RUN` here, with its reason.
3. Tick an Acceptance Criterion only when `verification.md` shows it `PASS`.
4. Known limitations carry the accepted `MEDIUM`/`LOW` review findings, every `WON'T FIX`, and out-of-scope discoveries with their suggested follow-up issue.
5. Link the issue with the keyword in `context.md` → Repo Facts → **Issue link keyword** (repo rules / template). Many repos forbid closing keywords (`Closes`/`Fixes`/`Resolves`) because merging into a non-default branch or a partial fix must not auto-close the issue. Not stated anywhere ⇒ use **`Refs #<n>`** and ask whether the developer wants it to auto-close — never default to a closing keyword.

## Fallback Template (only when the repo has none)

```md
# Pull Request

## Summary
<what changed, 2–4 lines>

## Why
<lý do, dẫn từ issue>

## How
<cách implement, tham chiếu decisions.md nếu có D00x đáng chú ý>

## Changes
- `path/to/file` — ...

## Testing
- `<command>` → PASS
- <thing> → NOT_RUN (reason)

## Acceptance Criteria
- [x] AC-1 ...
- [ ] AC-3 ... (NOT_RUN — reason)

## Known Limitations
- <MEDIUM/LOW findings accepted, WON'T FIX, out-of-scope discoveries>

## Risk
<risk + rollback>

## Deploy Notes
<từ operational-check.md: thứ tự migration, env var mới, rollback — bỏ mục này nếu không có phase đó>

## Related Issue
Refs #<issue-number>   <!-- hoặc keyword theo Repo Facts -->

---

PR_STATUS: READY
```

## Before handing off — check the branch is actually PR-able

```bash
git rev-parse --abbrev-ref HEAD                          # không được là một Shared branch (Repo Facts)
git rev-parse --abbrev-ref @{u} 2>/dev/null              # upstream KHÔNG được là shared branch — nếu có: git branch --unset-upstream
git status --short                                       # không còn thay đổi chưa commit
git log --oneline <base>..HEAD                           # <base> = Repo Facts → Base branch; có commit để mở PR
```

Uncommitted work ⇒ back to `delivery-dev-implement` / `delivery-dev-commit`. Still on a shared branch ⇒ the commits need moving to a branch before anything else; say so, do not improvise a fix.

## Handing Off

Writing `pr.md` ends this skill. **Pushing and opening the PR is the developer's call.**

Mechanics go through the **`delivery-dev-open-pr` skill** (it checks the gh account, the branch and its upstream, then prints the push + create commands — it never pushes). Division of labour: this skill owns the **body** — built from the artifacts, in the repo's template; `delivery-dev-open-pr` owns the **branch checks + the commands** the developer runs. Do not let it regenerate a summary over the one you just wrote from `verification.md` — hand it `pr.md`.

Or the developer runs it themselves:

```bash
git push -u origin <branch>                 # tên nhánh feature, KHÔNG phải develop/main
gh pr create --base <base-without-origin/> --title "<title>" --body-file "$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue <n>")/15-pr.md"
```

Reaching `DONE` requires the PR to be actually opened. After that: `delivery-pr-review` for a full review on the open PR (inline comments + posting — `delivery-dev-review` deliberately stops at `review.md`), and `delivery-dev-learn` if a concept mattered or review feedback arrives.

## Report

Phase summary: PR title, **which template file was used** (or that the repo has none and the fallback was used), PR language, AC ticked vs open, anything the template asked for that you could not fill, the command to open it.

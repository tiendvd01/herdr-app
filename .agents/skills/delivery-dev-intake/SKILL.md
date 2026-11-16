---
name: delivery-dev-intake
description: "Phase 1 of delivery-dev — capture a GitHub Issue verbatim into SoraVaults/<project>/issue <n>/original.md, preserving the original Japanese or English wording, labels, comments, acceptance criteria and attachments. Use when starting work on an issue, or when the original issue context has not been recorded yet."
---

# Devflow · Phase 1 — Issue Intake

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** issue number or URL · **Out:** `SoraVaults/<project>/issue <n>/00-original.md` · **State:** `ISSUE_RECEIVED` (stays until `delivery-dev-context` runs)

## Job

Get the complete issue onto disk, unaltered. Nothing is interpreted in this phase.

## Steps

1. Fetch the issue and its comments:

   ```bash
   gh issue view <number> --json number,title,url,body,state,labels,assignees,milestone,comments,updatedAt
   ```

   A GitHub MCP server attached to the session (`get_issue` + issue comments) is equally fine — prefer it when the session says so. No `gh`/MCP, or ambiguous repo ⇒ ask for the issue URL. Do not guess a repository.

2. Resolve and create the workspace in the SoraVaults vault: `T=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue <number>")` (conventions §1). It already exists → reuse it. A legacy `tasks/<number>-*` / `tasks/#<number>*` in the repo → read it as context, still write in `"$T"`, and say so.

3. Collect: title · number · URL · body · labels · assignee · milestone · comments · Acceptance Criteria · Definition of Done · screenshots/attachments · related issues · related PRs · explicit technical constraints.

4. Write `00-original.md`.

5. Follow every linked issue/PR one level deep and record what it adds — do not paste it into `original.md` beyond a short note plus the link.

6. **Approved Solution.** Look for a Solution comment on this issue and, when it is a task under a User Story, on the parent story (`gh api repos/<owner>/<repo>/issues/<n>/parent`, or the sub-issue link on the page). A Solution comment carries a `<!-- …:solution … -->` marker, a heading that starts with "Solution", or "Solution" in its first line. Then find the reviewer's answer after the Solution's latest edit: a first line with the verdict `Được code ngay` / `Code được, sửa trước khi merge` (`delivery-solution-review` §6), or an explicit "Duyệt" from the PO. Record both permalinks and the verdict under `## Solution đã duyệt` in `00-original.md`; the verdict `Sửa Solution rồi review lại`, or no answer, is recorded too, as not approved. `delivery-dev-solution` reads this section (*Solution đã duyệt*).

## Rules

- **Verbatim.** Preserve the original Japanese/English wording, including formatting and lists.
- **`original.md` is exempt from the writing policy.** Never compress, tidy, re-format or bullet-ify the issue. The policy governs AI writing; this file is the source.
- Do not rewrite, summarize, translate or "clean up" the requirement here — translation belongs to `delivery-dev-understand`.
- Do not drop context that looks unimportant.
- Keep every link and reference.
- Mark clearly what came from a **comment** vs the issue body, with the author and date.
- Attachments: keep the URL; note whether you could actually read the image.

## Template

```md
# Original Issue

- Number: #<number>
- Title: <original title, verbatim>
- URL: <url>
- State: open | closed
- Source language: ja | en | mixed
- Labels: ...
- Assignee: ...
- Milestone: ...
- Fetched at: <date>
- Issue updatedAt: <updatedAt từ API> · comments: <số comment>   ← resume so với hai số này để phát hiện issue đổi

## Body (verbatim)

<original body, unmodified>

## Comments (verbatim)

### Comment 1 — @author, <date>

<original comment text>

## Acceptance Criteria (as stated in the issue)

<quoted verbatim; if absent, write: NOT STATED IN ISSUE>

## Definition of Done (as stated)

<quoted verbatim; if absent: NOT STATED IN ISSUE>

## Attachments

- <url> — <what it shows, or: NOT READABLE>

## Related

- Issues: #...
- PRs: #...

## Explicit Technical Constraints (as stated)

- ...

---

INTAKE_STATUS: DONE
```

Later edits or new comments on the issue are **appended** as `## Update <date>` (verbatim, author + date) — never merged into the original body.

`NOT STATED IN ISSUE` is a valid and useful answer. Never fill these sections with an inference.

## Gate Out

`original.md` exists, contains the untouched issue body and ends with `INTAKE_STATUS: DONE` → continue to `delivery-dev-context` (project context is loaded **before** the issue is interpreted).

Then print the phase summary block: which issue, source language, what the issue does and does not state (AC, DoD, constraints), next = Project Context.

# delivery-board/references/issue-templates.md

---

# Khuôn nội dung issue

Ba template đặt trong `.github/ISSUE_TEMPLATE/` của **từng repo issue**. Phần dưới có cả file YAML
để commit vào repo, và khuôn markdown để soạn nhanh body khi tạo issue bằng `gh issue create`.
Nhãn và heading viết **tiếng Anh** (kèm tiếng Nhật ở chỗ Malme trả lời), vì thân issue là tiếng Anh 100% (`../../delivery-write-issue/SKILL.md` §5).

---

## 1. `requirement.yml` — Malme tạo

```yaml
name: Requirement (要件)
description: Created by Malme — a new requirement or feature
labels: []
body:
  - type: textarea
    id: goal
    attributes:
      label: "Goal / 目的"
    validations:
      required: true
  - type: textarea
    id: ac
    attributes:
      label: "Acceptance criteria / 受入条件"
      description: "One condition per line. Acceptance is checked against these."
    validations:
      required: true
  - type: input
    id: spec
    attributes:
      label: "Spec / UX documents in the PM repo (with version)"
      placeholder: "https://github.com/structuralengine/168-yahagi-pan-wall-dx/... (v1.2)"
    validations:
      required: true
  - type: textarea
    id: edge
    attributes:
      label: "Edge cases & validation (3–5 lines)"
  - type: input
    id: deadline
    attributes:
      label: "Requested deadline"
```

## 2. `task.yml` — Sora bóc nhỏ

```yaml
name: Task
description: Created by Sora — a technical task split from a Requirement
body:
  - type: input
    id: parent
    attributes:
      label: "Parent requirement"
      placeholder: "#123"
    validations:
      required: true
  - type: textarea
    id: scope
    attributes:
      label: "Technical scope"
    validations:
      required: true
  - type: input
    id: wiki
    attributes:
      label: "SRS pages on the PMS wiki"
  - type: input
    id: estimate
    attributes:
      label: "Estimate (person-days) — reviewed by a second person"
    validations:
      required: true
```

## 3. `clarification.yml` — Sora hỏi

```yaml
name: Clarification (確認)
description: Created by Sora — the spec is missing, contradictory or unclear
body:
  - type: input
    id: parent
    attributes:
      label: "Related requirement"
      placeholder: "#123"
    validations:
      required: true
  - type: textarea
    id: question
    attributes:
      label: "Questions / 質問"
      description: "One point per question. Say how it is understood now and where it gets stuck."
    validations:
      required: true
  - type: textarea
    id: blocking
    attributes:
      label: "What this blocks"
```

> SLA: Malme trả lời trong **3 ngày làm việc**. Quá hạn → issue liên quan chuyển `Blocked`,
> **deadline tự lùi đúng số ngày chờ**.

---

## 4. Khuôn markdown để soạn body nhanh

### Task

```markdown
## Parent requirement
#123

## Technical scope
- ...

## Edge cases & validation
- ...

## Acceptance criteria
- [ ] ...
- [ ] ...

## SRS pages on the PMS wiki
<url>

## Estimate (person-days) — reviewed by a second person
X person-days — reviewed with @<second person>
```

### Clarification

```markdown
## Related requirement
#123

## Questions / 質問
1. <one point per question>

## Current understanding
... (a flow diagram when the question is about a flow or a condition, the branch in question marked `?`, labels "EN / JA")

## What this blocks
#456 — cannot continue until <...> is settled

## Answer needed by
YYYY-MM-DD (SLA: 3 business days)
```

### Sprint Commitment

Khuôn này cho dự án lên sprint theo task có ước lượng. Dự án lên sprint theo **Epic + User Story** (PWPF từ Sprint 3) dùng `../../delivery-backlog/assets/commitment.md` thay khuôn này: không có ước lượng của PM, US liên kết bằng checkbox vì đã có cha là Epic.

Thân tiếng Anh, theo tiền lệ cam kết Sprint 3 của PWPF; riêng đoạn cuối nhờ Malme làm việc thì song ngữ EN/JA (`../../delivery-write-issue/SKILL.md` §5).

```markdown
# Sprint N — Commitment (<project>)

## Sprint Goal
<1–3 sentences in business terms Malme can follow: what users will be able to do by the end of the sprint>

## Committed issues (total X person-days = 80% of team capacity)
| Issue | Summary | Estimate (person-days) | Assignee |
|---|---|---|---|
| #157 | ... | 3 | @... |

## Demo plan (internal — Wednesday afternoon, week 2)
- Demo steps: ...
- Environment: ...
- Data: ...

## Acceptance checklist (updated by Malme, async)
| Item | Passes when | Evidence | Confirmed by | Result |
|---|---|---|---|---|
| ... | ... | <link / screenshot> | @<Malme PoC> | ⬜ OK / ⬜ Needs work |

## Out of scope this sprint
- ...

## Dependencies — needed from Malme
| What | Needed by |
|---|---|
| ... | YYYY-MM-DD |

---
**EN:**
The team starts right after Planning and **does not wait for confirmation**. @<Malme PoC>, please confirm (a comment or 👍) and update the **acceptance checklist** above before the internal demo (Wednesday afternoon, week 2). If the scope needs to change, let us know and the PoC will update this issue.

**JA:**
チームはプランニング直後に着手し、**ご確認をお待ちせずに進めます**。@<Malme PoC> 内部デモ（第2週 水曜午後）までに、ご確認（コメントまたは 👍）と上記の**受入チェックリスト**の更新をお願いいたします。スコープの変更が必要な場合はお知らせください。PoC が本 issue を更新します。
```

Sau khi tạo: gắn `Kind = Commitment`, `Lane = Sprint`, `Sprint = Sprint N`, và link từng issue cam
kết thành **sub-issue** (field `Sub-issues progress` sẽ tự cho Say/Do ratio).

---

## 5. Khuôn PR

Repo đã có `.github/pull_request_template.md` (PWPF có, tiếng Anh) thì theo template của repo (`../../delivery-dev-pr/SKILL.md`). Khuôn dưới chỉ dùng khi repo chưa có. Thân PR tiếng Anh.

```markdown
Refs structuralengine/<repo-issue>#123

## What changed
- ...

## How to test
1. ...

## Impact
- Migration: yes / no
- Config / infrastructure: ...

## Review tiers
- [ ] Tier 1 — delivery-pr-review (AI) + self-review
- [ ] Tier 2 — a teammate on the same project
- [ ] Tier 3 — Thái / Hòa (architecture · data model · auth · migration · infrastructure)
```

🔴 **Không bao giờ** viết `Fixes #123` / `Closes #123` / `Resolves #123` — kể cả trong commit message,
vì GitHub cũng đọc chúng khi PR merge.

---

## 6. Comment mẫu hay dùng

Các comment dưới nằm trên issue Malme đọc, nên viết EN + JA theo định dạng hai khối (`../../delivery-write-issue/SKILL.md` §5). Comment chỉ gửi người trong team thì viết tiếng Việt theo `../../sora-profile/references/van-phong.md`. Hạn trả lời ghi kèm thứ trong tuần (`../../delivery-start/references/luat-chung.md` §4).

**Triage — trả về vì chưa đạt DoR**

```markdown
**EN:**
This issue does not meet the Definition of Ready yet, so it is moved to `Blocked`. Missing:
- [ ] Acceptance criteria (only a general description so far)
- [ ] Edge case: what should happen when <...>

@<Malme PoC> could you add these? Under the 3-business-day SLA we would like them by YYYY-MM-DD (<weekday>). Until then the issue stays `Blocked`, and its deadline moves back by the days waited.

**JA:**
本 issue はまだ着手条件（DoR）を満たしていないため、`Blocked` に移動しました。不足している項目：
- [ ] 受入条件（現状は概要の説明のみ）
- [ ] 例外ケース：<...> の場合の想定動作

@<Malme PoC> ご追記をお願いできますでしょうか。SLA（3営業日）に基づき、YYYY-MM-DD（<曜日>）までにいただけますと幸いです。それまでは `Blocked` のままとし、期限は待機日数分だけ後ろ倒しになります。
```

**Triage — trùng**

```markdown
Duplicate of #<number>
```

**Acknowledge Requirement (SLA 2 ngày làm việc)**

```markdown
**EN:**
Received. Rough estimate: **X person-days**; we propose to take it in **Sprint N**.
Split into tasks: #.., #..
Still to clarify: #.. (Clarification)

**JA:**
受領しました。概算は **X人日** で、**Sprint N** での対応を提案します。
タスク分割：#.., #..
確認事項：#..（Clarification）
```

**Chuyển Blocked vì chờ Malme**

```markdown
**EN:**
Moved to `Blocked` (`Waiting on = Malme`): waiting since YYYY-MM-DD for the answer to #<clarification>. Under the SLA rule, this issue's deadline moves back by the number of days waited.

**JA:**
`Blocked`（`Waiting on = Malme`）に変更しました。YYYY-MM-DD より #<clarification> のご回答をお待ちしております。SLA のルールにより、本 issue の期限は待機日数分だけ後ろ倒しになります。
```

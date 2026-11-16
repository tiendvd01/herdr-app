# sora-profile/references/board-schema.md

---

# Board 201 — field ID, option ID, câu lệnh GraphQL

Chụp ngày 14/09/2026. Dùng để tra nhanh và viết mutation thủ công khi thao tác hàng loạt.
Thao tác lẻ thì dùng `delivery-board/scripts/board.sh` — nó tra tên tại thời điểm chạy nên không bao giờ lệch.

```
OWNER      = structuralengine
PROJECT    = 201
PROJECT_ID = PVT_kwDOAZdpEs4BbvaF
```

---

## 1. Field ID

| Field | dataType | ID |
|---|---|---|
| Title | TITLE | `PVTF_lADOAZdpEs4BbvaFzhWdwuQ` |
| Assignees | ASSIGNEES | `PVTF_lADOAZdpEs4BbvaFzhWdwuU` |
| **Status** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhWdwuY` |
| Labels | LABELS | `PVTF_lADOAZdpEs4BbvaFzhWdwuc` |
| Linked pull requests | LINKED_PULL_REQUESTS | `PVTF_lADOAZdpEs4BbvaFzhWdwug` |
| Milestone | MILESTONE | `PVTF_lADOAZdpEs4BbvaFzhWdwuk` |
| Repository | REPOSITORY | `PVTF_lADOAZdpEs4BbvaFzhWdwuo` |
| Reviewers | REVIEWERS | `PVTF_lADOAZdpEs4BbvaFzhWdwuw` |
| Parent issue | PARENT_ISSUE | `PVTF_lADOAZdpEs4BbvaFzhWdwu0` |
| **Sub-issues progress** | SUB_ISSUES_PROGRESS | `PVTF_lADOAZdpEs4BbvaFzhWdwu4` |
| Created / Updated / Closed | — | `…zhWdwu8` / `…zhWdwvA` / `…zhWdwvE` |
| **Deadline** | DATE | `PVTF_lADOAZdpEs4BbvaFzhWd4UQ` |
| **Sprint** | ITERATION | `PVTIF_lADOAZdpEs4BbvaFzhWd4iE` |
| **Estimation days** | NUMBER | `PVTF_lADOAZdpEs4BbvaFzhWd5F0` |
| **Start date** | DATE | `PVTF_lADOAZdpEs4BbvaFzhWd51k` |
| **Priority** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhWd7jk` |
| Actual days | NUMBER | `PVTF_lADOAZdpEs4BbvaFzhfvkAw` |
| **Lane** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhiBp9A` |
| **Project** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhiBqBc` |
| **Source** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhiBqBg` |
| **Waiting on** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhiBqBk` |
| **Kind** | SINGLE_SELECT | `PVTSSF_lADOAZdpEs4BbvaFzhiBqbo` |

24 field / trần 50.

## 2. Option ID

**Status** (`PVTSSF_…zhWdwuY`)

| Option | ID | Nghĩa |
|---|---|---|
| Backlog | `69b0aefe` | Tiếp nhận — chưa triage. PoC duyệt T3 & T6, phải rỗng sau mỗi phiên |
| Todo | `f75ad846` | Đạt DoR. Có `Sprint` = đã cam kết · không có = chờ tới lượt |
| In Progress | `47fc9ee4` | Đang code |
| In Review | `57f57a04` | PR đã mở, chờ review (mục tiêu: review đầu trong 24h) |
| Changes Requested | `779d579a` | Review trả về — tới lượt tác giả sửa |
| Ready for QA | `6a1e2935` | Dev xong, đạt DoD |
| QA Testing | `e89c4d8d` | QA đang đối chiếu AC |
| Ready for Release | `6c01223c` | QA duyệt, chờ phát hành |
| Done | `98236657` | Đã phát hành; Malme nghiệm thu async qua checklist |
| Canceled | `9286d903` | Bỏ — phải comment lý do |
| Blocked | `4d9f5e14` | Thiếu DoR hoặc chờ trả lời — set `Waiting on`, deadline lùi theo số ngày chờ |

**Lane** (`…zhiBp9A`): `Sprint` = `a66835b1` · `Ad-hoc` = `2f8fab9b`

**Kind** (`…zhiBqbo`): `Requirement` = `191b9356` · `Task` = `0f1916d0` · `Clarification` = `7bbd436d` · `Commitment` = `d0d323f5` · `Epic` = `5ae672e2` · `Story` = `687a3007` (Epic / Story thêm 12/10/2026 cho cách lên sprint Epic + US — skill `delivery-backlog`)

**Source** (`…zhiBqBg`): `Malme` = `eb0b05c3` · `Sora` = `e30da444`

**Waiting on** (`…zhiBqBk`): `Malme` = `3a3ccf9e` · `Sora` = `ca00d83e`
(để trống = không chờ ai; không có option sentinel)

**Priority** (`…zhWd7jk`): `Urgent` = `fb93701f` · `High` = `7ded0013` · `Medium` = `6035d95b` · `Low` = `81f411f8`

**Project** (`…zhiBqBc`): `Yahagi 168` = `51a07904` · `Yahagi 167` = `7c5c2c16` · `Yahagi 147` = `299d9f4d` · `ICT` = `f873eea8` · `Lunchbox` = `31374282` · `Civilink` = `1cc64e96`

**Sprint** (iteration, `…zhWd4iE`)

| Iteration | ID | Bắt đầu | Dài |
|---|---|---|---|
| Sprint 1 | `ba8c4f06` | 2026-09-14 | 12 ngày lịch (10 ngày làm việc) |
| Sprint 2 | `2a027242` | 2026-09-28 | 12 ngày lịch (10 ngày làm việc) |
| Sprint 3 | `bbee5fd9` | 2026-10-12 | 12 ngày lịch (10 ngày làm việc) |

Giữa các sprint có `break` 2 ngày cuối tuần — GitHub tạo iteration nối liền nhau, thiếu break thì
sprint sau rơi vào thứ 7. (Iteration ID trên là ảnh chụp; `board.sh sprints` cho danh sách hiện tại.)

---

## 3. Hai trục loại việc — đừng trộn

| | Là gì | Giá trị |
|---|---|---|
| **Issue Type** (native, cấp org, Malme nhìn thấy trên issue) | *bản chất thay đổi* | `Feat` `Fix` `Chore` `Docs` `Perf` `Test` `Refactor` `Style` `Spike` `Security` |
| **`Kind`** (project field của board 201) | *vai trò trong luồng Malme ↔ Sora* | `Requirement` `Task` `Clarification` `Commitment` `Epic` `Story` |

Bug đã có `Fix` ở trục Issue Type — **không** thêm `Bug` vào `Kind`.

---

## 4. Bảy view

| View | Layout | Filter | Cấu hình thêm | Dùng khi |
|---|---|---|---|---|
| `0-Backlog` | Table | `status:Backlog` | sort `Created ASC` | Phiên triage T3 & T6 |
| `1-Current Sprint` | Board | `sprint:@current -status:Backlog` | column `Status` · slice `Lane` | Daily |
| `2-Assignees` | Board | `status:"In Progress","In Review","Changes Requested"` | column `Status` · slice `Assignees` | Daily — ai ôm nhiều việc |
| `3-Waiting on Malme` | Table | `waiting-on:Malme` | sort `Deadline ASC` | Báo cáo T6 |
| `4-Refinement` | Table | `status:Todo no:sprint` | | Grooming T6 tuần 2 — pool đã duyệt, chờ tới lượt (view giữ nguyên id) |
| `5-Roadmap` | Roadmap | `-status:Done -status:Canceled` | dates `Start date`→`Deadline` · markers `Sprint` · slice `Project` | Xem dự án chồng lấn |
| `6-Retro` | Table | `sprint:@current` | group by `Lane` · sum `Estimation days` | T6 tuần 2 |

Cú pháp filter GitHub dùng **dấu cách** làm AND, không dùng `+`.

Ba cơ chế chia nhóm, mỗi cái nhận field khác nhau — dễ nhầm:

| Cơ chế | Nhận field nào |
|---|---|
| **Column field** (Board) | chỉ `Status`, single-select, hoặc iteration |
| **Group by** | chỉ custom field — **không** nhận `Assignees`, `Repository`, `Labels`, `Milestone`, `Title` |
| **Slice by** | nhận cả `Assignees`, label, milestone… (trừ `Title`, `Reviewers`, `Linked pull requests`) |

→ Vì vậy view `2-Assignees` bắt buộc dùng **Slice by**.

> API **không đọc được** cấu hình slice (`ProjectV2ViewConfiguration` chỉ lộ `visibleFields`,
> `filter`, `groupByFields`, `verticalGroupByFields`). Muốn kiểm tra slice phải mở UI.

---

## 5. Automation đang bật

| Workflow | Cấu hình | |
|---|---|---|
| Item added to project | → `Status = Backlog` | 🔴 mọi việc qua cửa triage |
| Item reopened | → `Status = Backlog` | việc bị trả lại phải duyệt lại |
| Item closed | → `Status = Done` | |
| Auto-archive items | `is:closed updated:<@today-30d` | dọn item đã đóng |
| Auto-add sub-issues to project | ✅ giữ | sub-issue vẫn là issue |
| **Pull request merged → Ready for QA** | ❌ **phải TẮT** | nếu bật sẽ đẩy mọi PR đã merge vào cột `Ready for QA` |
| Pull request linked to issue · Code review approved · Code changes requested | ❌ tắt | chỉ tác dụng lên item PR |

**Auto-add**: plan `team` cho tối đa **5 suất**, mỗi repo issue 1 suất, filter `is:issue is:open`.
🔴 **Không bao giờ đặt `is:pr`** — đó là thứ đưa PR lên board.

Hết 5 suất → chuyển sang GitHub Actions `actions/add-to-project@v1` (cần fine-grained PAT lưu ở org
secret `ADD_TO_PROJECT_PAT`: Projects read+write, Issues read-only). Actions **không backfill**, nạp
issue cũ bằng:

```bash
gh issue list -R structuralengine/<repo> --state open --limit 500 --json url -q '.[].url' |
  xargs -I{} gh project item-add 201 --owner structuralengine --url {}
```

---

## 6. GraphQL — công thức

### Lấy toàn bộ field + option

```bash
gh api graphql -f owner=structuralengine -F number=201 -f query='
query($owner:String!,$number:Int!){
  organization(login:$owner){ projectV2(number:$number){ id
    fields(first:50){nodes{
      ... on ProjectV2FieldCommon{id name dataType}
      ... on ProjectV2SingleSelectField{options{id name}}
      ... on ProjectV2IterationField{configuration{iterations{id title startDate duration}}}
    }}}}}'
```

### Tìm `itemId` từ số issue

```bash
gh api graphql -f owner=structuralengine -f repo=168-yahagi-panwall -F num=123 -f query='
query($owner:String!,$repo:String!,$num:Int!){
  repository(owner:$owner,name:$repo){ issue(number:$num){ id title
    projectItems(first:20){nodes{ id project{number title} }}}}}'
```

### Set field

```bash
# single-select
gh api graphql -f query='mutation{updateProjectV2ItemFieldValue(input:{
  projectId:"PVT_kwDOAZdpEs4BbvaF", itemId:"<ITEM_ID>",
  fieldId:"PVTSSF_lADOAZdpEs4BbvaFzhWdwuY",
  value:{singleSelectOptionId:"6a1e2935"}}){projectV2Item{id}}}'

# iteration
value:{iterationId:"ba8c4f06"}
# number
value:{number:2.5}
# date
value:{date:"2026-09-25"}
# text
value:{text:"..."}
```

Xoá giá trị: `clearProjectV2ItemFieldValue(input:{projectId,itemId,fieldId})`.

### Thêm issue vào board

```bash
gh api graphql -f query='mutation{addProjectV2ItemById(input:{
  projectId:"PVT_kwDOAZdpEs4BbvaF", contentId:"<ISSUE_NODE_ID>"}){item{id}}}'
```

### Gỡ item khỏi board (PR lọt lên board)

```bash
deleteProjectV2Item(input:{projectId:"…", itemId:"…"}){deletedItemId}
```
Chỉ gỡ item, PR/issue nguyên vẹn trong repo. Gộp **tối đa 10 mutation/query**, chạy lại theo vòng
cho tới khi đếm về 0 — lô lớn hơn bị trả `Resource limits for this query exceeded` và xử lý thiếu âm thầm.

### List item của board (nhanh hơn GraphQL cho việc đọc)

```bash
gh project item-list 201 --owner structuralengine --format json --limit 500
```

---

## 7. Việc nào API làm được, việc nào phải làm tay

| Việc | `gh` CLI | UI |
|---|---|---|
| Tạo field | ✅ `gh project field-create` | |
| Sửa option/description của `Status` | ⚠️ `updateProjectV2Field` thay **cả** danh sách option | ✅ khuyến nghị |
| Cấu hình iteration `Sprint` | ⚠️ `iterationConfiguration` thay **cả** cấu hình | ✅ khuyến nghị |
| Tạo view | ❌ | ✅ |
| Bật Workflows / auto-archive | ❌ (chỉ đọc qua `projectV2.workflows`) | ✅ |
| Thêm item vào project | ✅ `gh project item-add` | |
| Tạo label | ✅ `gh label create` | |
| Issue template | ✅ commit file | |

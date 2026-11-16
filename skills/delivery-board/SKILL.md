---
name: delivery-board
description: "Làm việc với GitHub theo đúng quy trình Scrumban của team Sora trên board \"Sora Team\" (org structuralengine, project #201) — tra quy trình, tạo issue đúng loại, triage Backlog theo DoR, gắn project field, chuyển trạng thái issue, mở PR \"Refs #123\", chuẩn bị Planning/Grooming/Demo nội bộ/Retro, báo cáo tuần cho Malme. Dùng khi người dùng nhắc tới board Sora, project 201, triage, sprint, clarification, grooming, Ready for QA, báo cáo Malme, hoặc dán link issue thuộc structuralengine."
---

# Làm việc với GitHub — quy trình team Sora

Skill này gói trọn quy trình Scrumban của team Sora thành thao tác thật trên GitHub — **tự chứa,
không phụ thuộc tài liệu ngoài**. Quy trình đầy đủ (cột, DoR, SLA, lịch các buổi) nằm ở
`../sora-profile/references/quy-trinh.md`. Board áp dụng và mọi thông số team (org, số board, lịch sprint, dự án ↔ repo): `../sora-profile/SKILL.md`.

**Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`.

> Nguyên tắc gốc: **GitHub = nơi việc XẢY RA. PMS = nơi việc được ĐO.**
> Board chỉ chứa **issue**, PR ở lại trong repo. Dev không bao giờ cập nhật trạng thái ở hai nơi.

---

## 0. Trước khi làm bất cứ gì

1. **Đọc trước, ghi sau.** Mọi truy vấn (xem issue, list board, đếm chỉ số) cứ chạy thẳng.
   Mọi thao tác **ghi** lên GitHub — tạo issue, comment, đổi `Status`, gắn `Sprint`, đóng issue,
   mở PR — **phải trình bày nội dung dự kiến và chờ người dùng xác nhận**. Không tự ý ghi.
2. **Không bao giờ `git push` / merge PR** khi người dùng chưa cho phép rõ ràng.
3. **Xác định vai của người dùng** (Dev · QA · PoC · Techlead · HoE) nếu chưa rõ — mỗi vai được
   phép chạm vào những field khác nhau (§2). Nếu người dùng yêu cầu thao tác ngoài vai của họ
   (ví dụ dev tự gắn `Sprint`), **cảnh báo rồi hỏi lại**, đừng làm im lặng.
4. Nếu câu hỏi chỉ là "quy trình thế nào" → trả lời từ `../sora-profile/references/quy-trinh.md`, không cần gọi API.

---

## 1. Bảy luật không được phá

Kiểm tra những luật này trước mỗi thao tác ghi. Vi phạm thì dừng lại và nói rõ lý do.

1. **Mọi issue mới đều vào `Backlog`.** Chỉ **PoC** đưa ra khỏi đó, và chỉ trong phiên triage T3/T6.
2. **Giữa sprint không thêm việc vào `Lane = Sprint`.** Việc gấp đi `Lane = Ad-hoc` (20% buffer).
   Hết buffer thì **đổi chỗ công khai** — rút một việc tương đương, ghi rõ trên issue Commitment.
3. **Mô tả PR ghi `Refs #123`** — 🔴 **không bao giờ** `Fixes` / `Closes` / `Resolves`.
   Từ khoá đóng issue làm issue nhảy thẳng sang `Done`, **bỏ qua `Ready for QA` và `QA Testing`**,
   và nó xảy ra im lặng.
4. **Merge PR xong thì tự kéo issue sang `Ready for QA`.** Không có automation nào làm thay.
5. **Dev không tự gắn `Sprint`.** Đó là việc của PoC ở buổi Planning.
6. **Mọi quyết định với Malme ghi thành comment trên issue trong ngày.** Chat không tính.
7. **Xong = đúng spec**, không phải "code chạy được". Đối chiếu từng dòng AC trước khi kéo thẻ.

Thêm hai luật về board:
- **Không thêm PR vào board 201.** Board chỉ chứa issue.
- **Không tạo `Requirement` thay Malme.** Spec thiếu → tạo `Clarification`.

---

## 2. Ai được chạm field nào

| Vai | Được làm | Không được |
|---|---|---|
| **Dev** | `Status` (`Todo → In Progress → In Review → Ready for QA`), `Assignees` (tự nhận), `Estimation days` (cùng 1 người nữa), tạo `Task`/`Clarification` | 🔴 gắn `Sprint`, đưa issue khỏi `Backlog`, tạo `Requirement` |
| **QA** | `Status` (`Ready for QA → QA Testing → Ready for Release → Done`) | phần còn lại |
| **PoC** | Tất cả: đưa khỏi `Backlog`, `Sprint`, `Lane`, `Kind`, `Source`, `Priority`, `Waiting on`, `Start date`, `Deadline`, tạo issue Commitment, `Canceled` + lý do | — |
| **Techlead** | Comment đánh dấu issue cần review tầng 2 | — |
| **HoE** | Xem tải theo người, duyệt rút người giữa dự án | — |

---

## 3. Router — ý định của người dùng → làm gì

| Người dùng nói gì | Chạy playbook |
|---|---|
| "tôi bắt đầu làm issue này", "kéo sang In Progress", "mở PR", "merge xong rồi" | **P1 — Vòng đời dev** (§4.1) |
| "triage backlog", "duyệt issue mới", "backlog còn gì" | **P2 — Phiên triage T3/T6** (§4.2) |
| "planning", "chốt sprint", "gắn sprint", "tạo Sprint Commitment" | **P3 — Planning** (§4.3) |
| "tạo Epic", "viết US", "bóc sprint theo Epic + US", "issue cũ thành task / phần đã giao" | skill **`delivery-backlog`** (dựng backlog sprint theo Epic + User Story), rồi quay lại đây gắn field |
| "grooming", "refinement", "ước lượng", "gom câu hỏi gửi Malme" | **P4 — Grooming** (§4.4) |
| "tạo issue", "report bug", "hỏi Malme", "clarification" | **P5 — Tạo issue đúng loại** (§4.5) |
| "báo cáo tuần", "đang chờ Malme những gì", "hỏi expectation" | **P6 — Báo cáo T6** (§4.6) |
| "demo", "demo nội bộ", "nghiệm thu", "chấm AC" | **P7 — Demo nội bộ** (§4.7) |
| "retro", "6 con số", "% việc phát sinh", "say/do" | **P8 — Retro** (§4.8) |
| "issue này đang ở đâu", "việc của tôi", "ai đang ôm nhiều việc" | **P9 — Truy vấn board** (§4.9) |
| "QA test xong rồi", "nghiệm thu xong" | **P10 — QA** (§4.10) |

Chi tiết đầy đủ từng playbook: `references/playbooks.md`.
Bảng field/option ID + câu lệnh GraphQL: `../sora-profile/references/board-schema.md`.
Quy trình gốc (cột, DoR, SLA, lịch các buổi): `../sora-profile/references/quy-trinh.md`.

---

## 4. Playbook rút gọn

### 4.1 P1 — Vòng đời dev

```
1. Lấy issue ở Todo có tên mình   → scripts/board.sh mine
2. Status = In Progress            → scripts/board.sh set <issue> Status "In Progress"
3. Code. Mở PR, mô tả ghi:  Refs #123      ← KHÔNG Fixes/Closes/Resolves
4. Status = In Review
5. PR được duyệt & merge
6. 🔴 Status = Ready for QA        ← bước hay quên nhất, không ai làm thay
```

Trước khi chuyển sang `Ready for QA`, soát DoD: có test tự động cho luồng chính + edge case đã
liệt kê · pass CI · PR được review đúng tầng · đã đối chiếu đủ AC · cập nhật PMS wiki nếu đụng
hạ tầng/nghiệp vụ lõi (quyết định kiến trúc thì thêm ADR ở `docs/decisions/`).

**Review 3 tầng:** mọi PR chạy skill `delivery-pr-review` + tự soát → tính năng theo spec rõ / sửa bug thì
đồng nghiệp cùng dự án review → đụng kiến trúc, data model, auth/phân quyền, migration, hạ tầng
thì **Thái / Hoà** review.

PR bị trả về → `Changes Requested`; sửa + đẩy lại → về `In Review`.

### 4.2 P2 — Phiên triage (PoC, T3 & T6, 15–30')

Mở cột `Backlog`, xử lý **từng issue** theo đúng ba hướng, không có hướng thứ tư:

| Tình huống | Xử lý |
|---|---|
| Trùng issue cũ | Đóng + comment `Duplicate of #<số>` — **không xoá**, để lại vết |
| Đủ **6 điều DoR** | → `Todo` (**chưa gắn `Sprint`**) + gắn `Lane`, `Kind`, `Source`, `Priority` |
| Còn thiếu | → `Blocked` + comment **nói rõ thiếu gì**; chờ Malme thì `Waiting on = Malme` |

**DoR 6 điều** — thiếu một điều là chưa được vào `Todo`:
1. Đúng loại issue, đúng template
2. Có **AC rõ ràng** + link spec (mục nào, bản nào)
3. Đã liệt kê **edge case & validation** (3–5 dòng là đủ)
4. **Hết câu hỏi mở với Malme**
5. **Không trùng** issue đang mở
6. Có **ước lượng công**, có người thứ 2 xem qua

> Cột `Backlog` **phải rỗng sau mỗi phiên**. Còn tồn nghĩa là phiên chưa xong — báo lại số còn tồn.

**Chọn `Priority`** — hỏi theo thứ tự, câu đầu tiên trả lời "có" quyết định:

1. Production hỏng, dữ liệu sai, lỗ hổng bảo mật? → `Urgent`
2. Có hạn với khách, hoặc chặn nghiệm thu / phát hành đã hẹn? → `Urgent` nếu hạn rơi trong sprint đang chạy, `High` nếu sprint sau
3. Chặn việc của người khác, hoặc là điểm rủi ro chưa rõ cần làm sớm để biết? → `High`
4. Thuộc milestone đang cam kết với khách? → `Medium`
5. Còn lại (cải tiến nội bộ, nợ kỹ thuật chưa gây đau) → `Low`

Ghi lý do một dòng trong bảng đề xuất (câu nào, căn cứ gì). Đổi `Priority` của việc đã vào sprint thì comment lý do trên issue. Chi tiết, cách xếp các việc cùng mức và dấu hiệu lạm phát ưu tiên: `references/playbooks.md` P2.

### 4.3 P3 — Planning nội bộ (T2 tuần 1, cả team)

- PoC trình bày pool `Todo` theo `Priority` → gắn `Sprint` + `Lane = Sprint` cho việc được chọn.
- Dev nhận việc, xác nhận ước lượng, tự gắn `Assignees`.
- **Chỉ cam kết 80% sức đội.** Tính tổng `Estimation days` của các issue được chọn và so với
  capacity; vượt 80% thì cảnh báo trước khi gắn.
- **Issue chưa đủ DoR thì không được vào sprint** — không ngoại lệ.
- **Ngay sau Planning**, PoC tạo issue `Sprint N — Commitment (<dự án>)`: `Kind = Commitment`,
  `Lane = Sprint`, `Sprint = Sprint N`, link các issue cam kết thành **sub-issue** (field
  `Sub-issues progress` tự cho Say/Do ratio). Sprint làm theo Epic + US thì US đã có cha là Epic
  (sub-issue chỉ có một cha) → liên kết bằng **danh sách checkbox** trong thân, không ghi ước lượng
  của PM, có dòng "Draft" tới khi dev ước lượng xong — xem skill `delivery-backlog` §B5. Nội dung: Sprint Goal · danh sách cam kết + ước lượng ·
  Demo Plan (demo nội bộ) · Ngoài phạm vi · Phụ thuộc cần Malme cung cấp + hạn chót · **checklist
  nghiệm thu** để Malme cập nhật.
- **Team chạy ngay sau Planning, KHÔNG đợi Malme confirm** — tránh lãng phí thời gian chờ. Malme
  confirm (comment/👍) và cập nhật checklist nghiệm thu sau khi sprint đã chạy; nếu Malme điều chỉnh
  scope thì PoC cập nhật lại issue Commitment.

### 4.4 P4 — Grooming (T6 tuần 2, đầu giờ chiều, 45', cả team)

**Chuẩn bị:** PoC gửi **list task cần grooming từ T5** để cả team đọc trước.

Dev nêu chỗ chưa rõ và **ước lượng cùng một người nữa** (không ước lượng một mình) → điền
`Estimation days`. QA nêu edge case/validation còn thiếu trong AC. Techlead đánh dấu issue cần
review tầng 2. PoC **gom câu hỏi trùng, tạo `Clarification`** — câu hỏi phát sinh gửi **Q&A cho Malme
MỘT đợt vào T2 tuần kế**, không hỏi rải rác cả tuần.

### 4.5 P5 — Tạo issue đúng loại

| Loại | Ai tạo | Bắt buộc có |
|---|---|---|
| `Requirement` | **Malme** | Mục tiêu + AC + deadline mong muốn + link tài liệu/UX bên PM repo |
| `Task` | Sora (dev) | **Link Requirement cha** + phạm vi kỹ thuật + ước lượng (2 người xem) |
| `Clarification` | Sora (dev) | Câu hỏi cụ thể + link Requirement liên quan + đang chặn việc gì |

Body theo template ở `references/issue-templates.md`. Sau khi tạo: issue tự rơi vào `Backlog`
(auto-add), **không tự gắn `Status` khác**. Nếu repo chưa có trong auto-add thì thêm item thủ công
bằng `scripts/board.sh add <url>`.

Cần soạn nội dung issue công phu hơn (bug/feature/UI enhancement theo 4 template repo) → dùng skill
`delivery-write-issue` rồi quay lại đây để gắn field.

### 4.6 P6 — Báo cáo tuần cho Malme (T6, PoC)

Viết đúng **3 mục, đúng thứ tự**:
1. 🔴 **Đang chờ Malme** (lên đầu): `Clarification` chưa trả lời + số ngày đã chờ + hạn chót
2. Việc xong / đang làm / bị chặn trong tuần
3. Sprint hiện tại: % hoàn thành, rủi ro trễ + lý do

Lấy số liệu: `scripts/board.sh waiting-malme` và `scripts/board.sh sprint`.
**Báo cáo T6 tuần 1 kèm hỏi expectation của Malme cho sprint sau** — làm đầu vào cho buổi Grooming
T6 tuần 2. Demo là buổi nội bộ nên báo cáo tuần 2 gửi dạng văn bản; nghiệm thu Malme làm async qua
checklist trong issue Commitment.

### 4.7 P7 — Demo nội bộ (chiều T4 tuần 2, chỉ team)

**Buổi nội bộ, không có Malme** — Malme nghiệm thu async qua checklist trong issue Commitment.
Chấm **từng dòng AC** của từng issue cam kết ✅ / ⚠️ / ❌ và ghi vào comment trên issue Commitment,
kèm kết luận issue nào carry-over sang sprint sau. "Xong" nghĩa là **đúng spec**, không phải "code
chạy được".

### 4.8 P8 — Retro (T6 tuần 2, 30')

Sáu con số (chi tiết cách đếm ở `references/playbooks.md`):

| Con số | Mong muốn |
|---|---|
| Nói được – làm được (Say/Do) | ≥ 80% |
| % việc phát sinh (`Lane = Ad-hoc`) | ≤ 20% |
| Issue bị trả lại sau Demo | giảm dần |
| PR chờ review | < 24h |
| Bug lọt production | giảm dần · 0 Critical |
| Issue blocked quá SLA 3 ngày | không tồn qua sprint |

Chốt **1–2 cải tiến**, mỗi cái có tên người phụ trách, đưa vào sprint sau. **Không bỏ Retro.**

### 4.9 P9 — Truy vấn board

`scripts/board.sh` (xem `--help`): `backlog` · `sprint` · `todo-pool` · `mine` · `assignee <user>` ·
`wip` · `waiting-malme` · `status "<tên cột>"` · `retro` · `item <issue>` · `fields` · `sprints`.

Bảy view trên board — khi trả lời hãy chỉ đúng view người dùng nên mở:
`0-Backlog` · `1-Current Sprint` · `2-Assignees` · `3-Waiting on Malme` · `4-Refinement` (view giữ
nguyên id, nay phục vụ buổi Grooming) · `5-Roadmap` · `6-Retro`.

### 4.10 P10 — QA

`Ready for QA → QA Testing → Ready for Release → Done`. QA đối chiếu **từng điều kiện nghiệm thu
ghi trong issue**, không phải "chạy thử thấy được". Dự án QA không phủ hết: dev tự đối chiếu AC +
demo cho PoC rồi mới đóng.

---

## 5. Công cụ

```bash
scripts/board.sh --help          # danh sách lệnh đầy đủ

# ĐỌC
scripts/board.sh fields          # field + option (cache 1h) · sprints · item <issue>
scripts/board.sh backlog         # cột Backlog — phiên triage
scripts/board.sh sprint          # issue của sprint hiện tại
scripts/board.sh todo-pool       # Todo chưa gắn Sprint — buổi Grooming
scripts/board.sh mine            # việc của mình · assignee <login> · wip
scripts/board.sh waiting-malme   # đang chờ Malme — báo cáo T6
scripts/board.sh status "Ready for QA"
scripts/board.sh retro           # Say/Do + % việc phát sinh theo Lane

# GHI — trình bày trước, xác nhận rồi mới chạy
scripts/board.sh set <issue> Status "Ready for QA"
scripts/board.sh set <issue> Lane "Ad-hoc"
scripts/board.sh set <issue> Sprint "Sprint 1"
scripts/board.sh set <issue> "Estimation days" 2.5
scripts/board.sh clear <issue> "Waiting on"
scripts/board.sh add https://github.com/structuralengine/<repo>/issues/123
```

`DRY_RUN=1 scripts/board.sh set …` in mutation ra màn hình mà **không** gửi lên GitHub — dùng để rà
lại trước khi ghi, nhất là với thao tác hàng loạt.

`<issue>` nhận 3 dạng: URL đầy đủ · `owner/repo#123` · `repo#123` (mặc định owner `structuralengine`).
Nếu file mất quyền chạy sau khi apply skill, gọi `bash scripts/board.sh …`.
Yêu cầu: `gh` đã đăng nhập + `jq`. Board khác thì đặt `SORA_GH_OWNER` / `SORA_GH_PROJECT`.

Script tra field/option **theo tên tại thời điểm chạy**, không hardcode ID — board đổi option thì
script vẫn đúng. Bảng ID hiện tại nằm ở `../sora-profile/references/board-schema.md` để tra nhanh và để viết
GraphQL thủ công khi cần thao tác hàng loạt.

> ⚠️ Thao tác hàng loạt: gộp **tối đa 10 mutation** mỗi query GraphQL. Lô lớn hơn bị GitHub trả
> `Resource limits for this query exceeded` và xử lý thiếu **âm thầm** — luôn đếm lại sau mỗi vòng.

> ⚠️ **Không dùng API** cho: sửa option/description của `Status`, cấu hình iteration `Sprint`,
> tạo view, bật workflow. Những mutation đó thay **toàn bộ** cấu hình — sai một trường là hỏng field
> trên hơn 200 item. Làm trên UI: Project 201 → Settings.

---

## 6. Bối cảnh cố định

Org, board (#201), lịch một sprint, dự án ↔ repo issue ↔ repo code, label `area:*`: **`../sora-profile/SKILL.md`**.
Field ID, option ID, view, automation, công thức GraphQL: `../sora-profile/references/board-schema.md`.

---

## 7. Tình huống hay gặp → trả lời thế nào

| Người dùng | Trả lời |
|---|---|
| "Tôi cần hỏi Malme một điều" | Tạo `Clarification`, **đừng nhắn thẳng Malme**. PoC gom ở Grooming, gửi Q&A một đợt vào T2 tuần kế. Malme trả lời trong 3 ngày làm việc. |
| "Việc của tôi đang chờ Malme" | `Status = Blocked` + `Waiting on = Malme`. **Deadline tự lùi đúng số ngày chờ**, không tính Sora chậm. |
| "Có việc gấp chen ngang" | Không tự nhận — báo PoC. Sự cố production → làm ngay, `Lane = Ad-hoc`. Gấp thật → **đổi chỗ**, ghi rõ việc nào bị rút. Không gấp → `Backlog`. 🔴 Không bao giờ cộng thêm vào phần đã cam kết. |
| "Issue này không cần làm nữa" | Đừng tự đóng. Báo PoC → `Canceled` + comment lý do. |
| "Worklog với board có phải nhập 2 lần?" | Không. Board = việc **đang ở bước nào**; PMS worklog = **bao nhiêu giờ**, ghi **cuối mỗi ngày**, không ghi dồn. |
| "Tôi đang làm 5 việc cùng lúc" | Mở view `2-Assignees`, slice tên mình; nói ở Daily. Đừng im lặng gánh. |
| "Sao merge rồi issue vẫn ở In Progress?" | Vì không có automation nào làm thay — tự kéo sang `Ready for QA` (luật 4). |
| "Bao giờ Malme nghiệm thu?" | Async — Malme cập nhật checklist nghiệm thu trong issue Commitment, không có buổi demo trực tiếp. Demo T4 tuần 2 là nội bộ. |

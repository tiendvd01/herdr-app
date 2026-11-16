# delivery-board/references/playbooks.md

---

# Playbook chi tiết

Mỗi playbook: **đầu vào → các bước → kiểm tra trước khi ghi → output cho người dùng**.
Mọi bước ghi lên GitHub phải trình bày trước và chờ xác nhận. Dùng `DRY_RUN=1` để rà mutation.

---

## P1 — Vòng đời dev

**Đầu vào:** người dùng nói đang làm / vừa merge một issue.

```
1. board.sh mine                      → lấy issue Todo có tên mình
2. board.sh set <issue> Status "In Progress"
3. Code. Mở PR:
     gh pr create -R structuralengine/<repo-code> \
       --base develop --title "..." --body "Refs structuralengine/<repo-issue>#123 ..."
4. board.sh set <issue> Status "In Review"
5. Chạy skill delivery-pr-review + tự soát → giao cho người review đúng tầng
6. PR merge xong → board.sh set <issue> Status "Ready for QA"
```

**Kiểm tra trước khi ghi:**
- Mô tả PR có `Refs #123` và **không** chứa `Fixes` / `Closes` / `Resolves`
  (bao gồm cả biến thể `Fixed`, `Closed`, `Resolved`). Grep lại body PR trước khi tạo.
- Issue đang làm có `Sprint` không? Không có `Sprint` mà vẫn kéo sang `In Progress` nghĩa là
  đang làm việc ngoài cam kết → hỏi lại người dùng, có thể phải gắn `Lane = Ad-hoc` (PoC làm).
- Trước `Ready for QA`: soát DoD 5 điều (test tự động · pass CI · review đúng tầng · đủ AC ·
  cập nhật PMS wiki nếu đụng hạ tầng/nghiệp vụ lõi).

**Review 3 tầng — tự xác định tầng từ diff:**

| Diff chạm vào | Tầng |
|---|---|
| Chỉ UI/logic theo spec rõ, sửa bug | Đồng nghiệp cùng dự án |
| Migration, schema, `auth`/`permission`, IaC, CI/CD, cấu hình hạ tầng, thư viện chung | **Thái / Hoà** |

**PR bị trả về:** `Status = Changes Requested` → sửa + đẩy lại → `In Review`.

---

## P2 — Phiên triage (PoC, T3 & T6)

**Đầu vào:** "triage backlog", "duyệt issue mới".

```
1. board.sh backlog                → danh sách cần duyệt, sort theo ngày tạo
2. Với TỪNG issue, đọc nội dung:  gh issue view <n> -R structuralengine/<repo>
3. Chấm DoR 6 điều → chọn 1 trong 3 hướng
4. Trình bày bảng đề xuất cho người dùng duyệt, rồi mới ghi
5. Chạy lại board.sh backlog → phải rỗng
```

**Bảng đề xuất trình cho người dùng** (một dòng một issue):

| # | Tiêu đề rút gọn | Hướng | Thiếu gì / Field sẽ gắn |
|---|---|---|---|
| #464 | 拠点→地区 mapping | → `Todo` | `Kind=Task` `Source=Sora` `Lane=Sprint` `Priority=Medium` |
| #542 | Logical delete không cascade | → `Blocked` | thiếu AC + chưa rõ phạm vi xoá mềm; `Waiting on=Malme` |
| #461 | … | → đóng | `Duplicate of #455` |

**Lệnh cho mỗi hướng:**

```bash
# Đủ DoR → Todo  (KHÔNG gắn Sprint ở bước này)
board.sh set <issue> Status Todo
board.sh set <issue> Kind Task          # Requirement | Task | Clarification | Commitment | Epic | Story
board.sh set <issue> Source Sora        # Malme | Sora
board.sh set <issue> Lane Sprint        # Sprint | Ad-hoc
board.sh set <issue> Priority Medium    # Urgent | High | Medium | Low

# Thiếu → Blocked + comment nói rõ thiếu gì
board.sh set <issue> Status Blocked
board.sh set <issue> "Waiting on" Malme        # nếu chờ Malme
gh issue comment <n> -R structuralengine/<repo> --body-file dor.md   # khuôn EN + JA: issue-templates.md §6

# Trùng → đóng, KHÔNG xoá
gh issue comment <n> -R structuralengine/<repo> -b "Duplicate of #<number>"
gh issue close <n> -R structuralengine/<repo>
```

**Cách chấm từng điều DoR khi đọc issue:**

| Điều | Nhìn gì trong issue |
|---|---|
| Đúng loại + template | Có các mục của template tương ứng; `Kind` khớp với người tạo (Malme→Requirement, Sora→Task/Clarification) |
| AC rõ ràng + link spec | Có danh sách điều kiện nghiệm thu **đếm được**, không phải mô tả chung; Requirement có link PM repo **kèm version** |
| Edge case & validation | Có ít nhất 3 dòng nói về dữ liệu bất thường / giới hạn / lỗi |
| Hết câu hỏi mở | Không còn `Clarification` liên quan đang mở; không có câu "chưa rõ", "cần confirm" trong body/comment |
| Không trùng | `gh issue list -R <repo> --search "<từ khoá>" --state open` |
| Có ước lượng | `Estimation days` đã điền, và có dấu vết người thứ 2 xem (comment/reaction) |

**Chọn `Priority` — năm câu, câu đầu tiên trả lời "có" quyết định:**

| # | Câu hỏi | Mức | Căn cứ để trả lời |
|---|---|---|---|
| 1 | Production hỏng, dữ liệu sai, lỗ hổng bảo mật? | `Urgent` | issue mô tả sự cố thật, có bằng chứng (log, ảnh, dữ liệu) |
| 2 | Có hạn với khách, hoặc chặn nghiệm thu / phát hành đã hẹn? | `Urgent` nếu hạn trong sprint đang chạy · `High` nếu sprint sau | field `Deadline`, milestone, ngày phát hành trong lịch dự án |
| 3 | Chặn việc của người khác, hoặc là điểm rủi ro chưa rõ cần làm sớm để biết? | `High` | issue khác dẫn "blocked by" / "phụ thuộc"; Solution ghi rủi ro chưa kiểm |
| 4 | Thuộc milestone đang cam kết với khách? | `Medium` | milestone của issue |
| 5 | Còn lại: cải tiến nội bộ, nợ kỹ thuật chưa gây đau | `Low` | — |

Trong bảng đề xuất, cột "Field sẽ gắn" ghi kèm lý do: `Priority=High (câu 3: chặn #735)`.

**Xếp các việc cùng mức** (dùng ở P3 bước 2 khi cộng dồn vào sprint), theo thứ tự:

1. Hạn gần hơn trước.
2. Mở khoá nhiều việc khác hơn trước (đếm issue đang chờ nó).
3. Requirement của khách trước Task nội bộ.
4. Cùng giá trị thì việc nhỏ hơn trước — xong sớm, giảm việc dở dang.

**Dấu hiệu lạm phát ưu tiên** — gặp thì xếp lại trước khi Planning:

- Hơn hai việc `Urgent` cùng lúc: `Urgent` mất nghĩa; hỏi lại từng cái câu 1–2.
- `High` chiếm quá nửa pool `Todo`: hạ những việc chỉ "quan trọng" mà không trả lời "có" ở câu 2–3.
- Việc `Low` nằm im hơn ba sprint: hỏi PoC giữ hay đóng (đóng là việc của người dùng, không tự đóng).

Đếm nhanh phân bố: `board.sh todo-pool` rồi đếm theo cột Priority, hoặc
`jq '[.items[]|select(.status=="Todo")|.priority]|group_by(.)|map({(.[0]//"(trống)"):length})|add'` trên JSON của `gh project item-list`.

**Kết thúc:** báo số issue đã xử lý theo từng hướng + số còn tồn ở `Backlog` (phải là 0).

---

## P3 — Planning nội bộ (T2 tuần 1)

```
1. board.sh todo-pool              → pool Todo chưa gắn Sprint
2. Sắp theo Priority (cùng mức thì theo thứ tự xếp ở P2), cộng dồn Estimation days
3. So với capacity: tổng cam kết ≤ 80% sức đội
4. Trình danh sách đề xuất → xác nhận → gắn Sprint + Lane cho từng issue
5. Dev tự gắn Assignees
6. NGAY SAU Planning: tạo issue Sprint Commitment → gửi Malme (team chạy ngay, không đợi confirm)
```

**Tính 80%:** capacity = (số dev × số ngày làm việc trong sprint). Sprint có 10 ngày làm việc
(iteration 12 ngày lịch) → nếu 5 dev thì capacity = 50 người-ngày, trần cam kết = **40 người-ngày**. Luôn hỏi lại số dev thực tế của sprint
(có người nghỉ, có người chia nhiều dự án) thay vì tự giả định.

```bash
board.sh set <issue> Sprint "Sprint 2"
board.sh set <issue> Lane Sprint
board.sh set <issue> "Start date" 2026-09-28
board.sh set <issue> Deadline 2026-10-09
```

**Issue Commitment** (tạo ngay sau Planning, gửi Malme):

```bash
gh issue create -R structuralengine/<repo-issue> \
  --title "Sprint 2 — Commitment (168)" --body-file commitment.md
# rồi gắn field
board.sh set <repo-issue>#<n> Kind Commitment
board.sh set <repo-issue>#<n> Lane Sprint
board.sh set <repo-issue>#<n> Sprint "Sprint 2"
# link sub-issue cho từng issue cam kết (UI hoặc GraphQL addSubIssue)
```

Body `commitment.md` theo khuôn ở `issue-templates.md` (gồm **checklist nghiệm thu** để Malme cập nhật).
**Team bắt đầu ngay sau Planning** — Malme confirm + cập nhật checklist sau khi sprint đã chạy; nếu
Malme điều chỉnh scope thì cập nhật lại issue Commitment.

**Cảnh báo phải nêu nếu gặp:** tổng vượt 80% · có issue chưa đủ DoR · có issue chưa ai ước lượng ·
một người bị gán quá nhiều so với phần còn lại (đối chiếu `board.sh wip`).

---

## P4 — Grooming (T6 tuần 2, đầu giờ chiều)

**Chuẩn bị:** PoC gửi **list task cần grooming từ T5** để cả team đọc trước.

```
1. board.sh todo-pool                    → issue dự kiến vào sprint sau
2. Với từng issue: đọc, liệt kê điểm chưa rõ
3. Điền Estimation days (2 người cùng nhìn)
4. GOM mọi câu hỏi → tạo Clarification; gửi Q&A cho Malme MỘT đợt vào T2 tuần kế
```

Khi gom câu hỏi: **gộp câu trùng ý, diễn đạt lại theo ngôn ngữ nghiệp vụ**, mỗi `Clarification` một
ý — không nhét 10 câu hỏi rời rạc vào một issue trừ khi chúng thuộc cùng một chủ đề. Ghi rõ mỗi câu
hỏi **đang chặn issue nào**, để khi Malme trả lời thì biết gỡ `Blocked` cho cái gì.

```bash
board.sh set <issue> "Estimation days" 3
```

---

## P5 — Tạo issue đúng loại

**Bước 0 — chọn loại:** người dùng muốn *nêu yêu cầu nghiệp vụ mới* → đó là việc của Malme, **không
tạo thay**; gợi ý tạo `Clarification` hoặc nhờ PoC làm việc với Malme. Muốn *bóc việc kỹ thuật* →
`Task` (bắt buộc có Requirement cha). Muốn *hỏi cho rõ spec* → `Clarification`.

```bash
gh issue create -R structuralengine/<repo-issue> \
  --title "[Task][backend] ..." --body-file body.md --label "area:be"
```

- Mở issue ở **repo issue của dự án**, không mở ở repo code.
- Gắn label `area:fe|be|infra|db`, thêm `needs-doc` nếu đụng hạ tầng/nghiệp vụ lõi.
- Issue tự rơi vào `Backlog` nhờ auto-add — **không tự gắn `Status` khác**. Nếu sau 1 phút chưa thấy
  trên board (repo chưa có auto-add) thì `board.sh add <issue>`.
- Sau khi tạo: nhắc người dùng rằng issue sẽ được PoC duyệt ở phiên triage T3/T6 gần nhất.

Cần soạn nội dung theo 4 template repo (bug / feature-request / feature-enhancement / ui-enhancement)
→ dùng skill `delivery-write-issue`, rồi quay lại đây để gắn field và đưa lên board.

---

## P6 — Báo cáo tuần cho Malme (T6)

```
1. board.sh waiting-malme        → mục 1
2. board.sh sprint               → mục 2 và 3
3. board.sh retro                → % hoàn thành
```

**Khuôn báo cáo:**

Thân tiếng Anh như issue Commitment; chỗ Malme phải trả lời thì thêm tiếng Nhật (`../../delivery-write-issue/SKILL.md` §5).

```markdown
## 1. Waiting on Malme / ご回答待ち  🔴
| Issue | Question | Waiting since | Due (SLA: 3 business days) |
|---|---|---|---|
| #304 | ... | 2026-09-09 (4 days) | OVERDUE — the related issue's deadline moves back 4 days |

## 2. This week
- Done: #.., #..
- In progress: #.., #..
- Blocked: #.. (reason)

## 3. Sprint N (<start date> → <end date>)
- Completed: x/y issues (z%)
- Risk of delay: #.. — reason, mitigation
```

Báo cáo T6 tuần 1 thêm đoạn hỏi expectation cho sprint sau (hạn trả lời có thứ trong tuần và việc sẽ làm khi quá hạn — `../../delivery-start/references/luat-chung.md` §4):

```markdown
---
**EN:**
@<Malme PoC> What would you most like to see working in Sprint N+1? Please reply by YYYY-MM-DD (<weekday>) so we can prepare it for Grooming (Friday, week 2). Without a reply by then, we will plan from the current backlog order.

**JA:**
@<Malme PoC> Sprint N+1 で優先して実現したい内容はございますか。グルーミング（第2週 金曜）に向けて準備するため、YYYY-MM-DD（<曜日>）までにご返信いただけますと幸いです。期限までにご返信がない場合は、現在のバックログの優先順位で計画いたします。
```

Mục 1 **luôn đứng đầu**. Với mỗi mục chờ, ghi **số ngày đã chờ** và **hạn chót cụ thể** — đây là cơ
sở để deadline tự lùi theo quy tắc công bằng SLA. **Báo cáo T6 tuần 1 kèm hỏi expectation của Malme
cho sprint sau** (đầu vào cho Grooming T6 tuần 2). Tuần 2 gửi dạng văn bản — không có buổi demo với Malme.

---

## P7 — Demo nội bộ (chiều T4 tuần 2, chỉ team)

```
1. Lấy danh sách issue cam kết từ issue Commitment (sub-issues)
2. Với từng issue: trích AC từ body, chấm từng dòng ✅ / ⚠️ / ❌
3. Comment kết quả lên issue Commitment
4. Kết luận: issue nào Done, issue nào carry-over sang sprint sau
```

**Buổi nội bộ, không có Malme** — Malme nghiệm thu async qua checklist nghiệm thu trong issue Commitment.

**Khuôn comment:**

Comment nằm trên issue Commitment, nơi Malme nghiệm thu, nên viết tiếng Anh như thân issue.

```markdown
### Internal demo results — Sprint N

| Issue | AC | Result | Notes |
|---|---|---|---|
| #157 | 3/3 | ✅ | |
| #160 | 2/3 | ⚠️ | AC#3 (switching tabs on click) does not work on mobile yet → carry-over |
| #166 | 0/4 | ❌ | Not started — moved to the next sprint |

Carried over to the next sprint: #160, #166
```

⚠️ Chỉ chấm ✅ khi **từng dòng AC** được đối chiếu. "Code chạy được" không phải ✅.

---

## P8 — Retro (T6 tuần 2)

```
board.sh retro           → Say/Do + % việc phát sinh
board.sh wip             → phân bố việc song song theo người
```

**Cách lấy 6 con số:**

| Con số | Cách đếm |
|---|---|
| Say/Do | `Sub-issues progress` của issue Commitment; hoặc `board.sh retro` (Done / tổng issue có `Sprint`) |
| % việc phát sinh | `board.sh retro` — tổng `Estimation days` của `Lane = Ad-hoc` / tổng. Chính xác hơn: `WorkLog × Task.lane` bên PMS |
| Issue bị trả lại | Đếm issue quay lại `Changes Requested`/`Blocked` **sau** Demo — đọc timeline: `gh issue view <n> --json timelineItems` hoặc đếm comment Demo có ⚠️/❌ |
| PR chờ review | Thời gian từ lúc mở PR tới review đầu: `gh pr list -R <repo> --state merged --json createdAt,reviews --limit 50` |
| Bug lọt production | Issue tạo sau ngày `Done` của issue gốc, `Type = Fix`, liên quan cùng chức năng |
| Blocked quá SLA | `board.sh status Blocked` → xem `Waiting on = Malme` và số ngày kể từ khi chuyển `Blocked` |

**Đầu ra bắt buộc:** 1–2 cải tiến, mỗi cái **có tên người phụ trách**, đưa vào sprint sau dưới dạng
issue. Không dừng ở "team nên chú ý hơn".

Nếu `board.sh retro` cho thấy nhiều issue **chưa gắn `Lane`** → nói thẳng: số liệu % việc phát sinh
sprint này không tin được, và đó là việc cần sửa trước khi bàn tiếp.

---

## P9 — Truy vấn board

| Người dùng hỏi | Lệnh | View nên mở |
|---|---|---|
| "Issue #123 đang ở đâu" | `board.sh item <repo>#123` | — |
| "Việc của tôi" | `board.sh mine` | `1-Current Sprint` |
| "Ai đang ôm nhiều việc" | `board.sh wip` | `2-Assignees` |
| "Backlog còn gì" | `board.sh backlog` | `0-Backlog` |
| "Chờ Malme những gì" | `board.sh waiting-malme` | `3-Waiting on Malme` |
| "Sprint này tới đâu" | `board.sh sprint` + `board.sh retro` | `1-Current Sprint` |
| "Hàng đợi QA dài không" | `board.sh status "Ready for QA"` | `1-Current Sprint` |
| "Việc nào sẵn sàng cho sprint sau" | `board.sh todo-pool` | `4-Refinement` (view nay phục vụ Grooming) |

Khi trả lời, luôn kèm **việc cần làm tiếp** chứ không chỉ con số: ví dụ "4 issue đang `In Review` của
sora-hoa, cái cũ nhất mở 3 ngày — vượt mục tiêu 24h, nên nhắc ở Daily".

---

## P10 — QA

```
board.sh status "Ready for QA"        → hàng đợi
board.sh set <issue> Status "QA Testing"
# đối chiếu TỪNG dòng AC trong body issue
board.sh set <issue> Status "Ready for Release"    # đạt
board.sh set <issue> Status "Changes Requested"    # không đạt → comment nói rõ AC nào fail
board.sh set <issue> Status Done                   # sau khi phát hành + nghiệm thu
```

Comment khi trả về phải chỉ đúng **dòng AC nào fail + bước tái hiện**, không viết "chưa chạy được".

Dự án QA không phủ hết: dev tự đối chiếu AC + demo cho PoC rồi mới đóng — ghi lại kết quả đối chiếu
thành comment trên issue để có vết.

---

## Xử lý tình huống ngoại lệ

| Tình huống | Làm gì |
|---|---|
| Người dùng muốn dùng `Closes #123` trong PR | **Từ chối và giải thích**: issue sẽ nhảy thẳng `Done`, bỏ qua QA, và im lặng. Đề xuất `Refs #123`. |
| Dev nhờ gắn `Sprint` | Cảnh báo đây là việc của PoC ở Planning; hỏi người dùng có phải PoC không trước khi làm. |
| Muốn thêm PR vào board | Từ chối — board chỉ chứa issue. PR liên kết qua `Linked pull requests`. |
| Muốn thêm việc vào sprint đang chạy | Hỏi loại: sự cố production → `Lane = Ad-hoc`; gấp thật → **đổi chỗ**, phải nêu rõ rút issue nào và ghi lên issue Commitment; không gấp → `Backlog`. |
| Issue đang `Blocked` chờ Malme quá 3 ngày | Nhắc đưa vào mục 1 báo cáo T6 và **deadline lùi đúng số ngày chờ** — đây là quyền lợi của Sora, đừng bỏ qua. |
| Malme hỏi bao giờ demo | Demo là buổi nội bộ (chiều T4 tuần 2). Malme nghiệm thu async qua checklist nghiệm thu trong issue Commitment. |
| Thao tác hàng loạt >10 item | Chia lô ≤10 mutation/query, **đếm lại sau mỗi vòng** (GitHub trả `Resource limits for this query exceeded` và xử lý thiếu âm thầm). |
| Muốn sửa option `Status` / cấu hình `Sprint` / tạo view | **Không dùng API** — mutation thay toàn bộ cấu hình. Hướng dẫn làm trên UI: Project 201 → Settings. |

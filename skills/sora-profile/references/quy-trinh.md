# sora-profile/references/quy-trinh.md

---

# Quy trình gốc — bản tra cứu

Bản tra cứu quy trình **tự chứa** của skill (không phụ thuộc tài liệu ngoài). Mô hình Scrumban của
team Sora: một board GitHub dùng chung với Malme, PMS là lớp đo nội bộ.

---

## 1. Ba nơi, ba việc

| Nơi | Chứa gì | Ai dùng |
|---|---|---|
| 🗂 **Board "Sora Team"** (org project #201) | **Issue** — trạng thái, ai làm, sprint nào | Dev Sora **+ Malme** |
| 💻 **Repo** | Code, **Pull Request**, CI | Dev Sora |
| 📚 **PMS** | **Worklog** hằng ngày · wiki: SRS tiếng Việt, thiết kế, vận hành | **Chỉ nội bộ Sora** |

1. **Board chỉ có issue, không có PR.** Nhìn từ issue vẫn thấy PR nhờ `Linked pull requests`.
2. **Quyết định với Malme phải nằm trong comment của issue**, ghi lại trong ngày. Chat không nhớ.
3. **Board là trạng thái, PMS worklog là thời gian.** Board trả lời *"việc đang ở đâu"*; worklog trả
   lời *"tốn bao nhiêu công"*. Ghi worklog **cuối mỗi ngày**, gắn với issue tương ứng, không ghi dồn.
   Thời gian họp, review, hỗ trợ đồng nghiệp cũng ghi vào.

### Vì sao board là GitHub chứ không phải PMS

1. **Malme không dùng PMS** — Sprint Commitment cần Malme confirm, phải có chỗ hai công ty cùng nhìn.
2. Mất liên kết với code: PR ↔ issue, review 3 tầng, CI trong DoD.
3. PMS hiện do một người viết và bảo trì. PMS hỏng = mất báo cáo vài ngày (chấp nhận được).
   Board hỏng = team dừng (không chấp nhận được).

### Vì sao board không chứa PR

Toàn bộ quy trình dựng trên **issue**: DoR, AC, `Requirement`/`Task`/`Clarification`, cửa triage,
Sprint Commitment, Demo. Không khái niệm nào áp được lên một PR. Một PR đã merge nằm ở `Ready for QA`
không mang nghĩa gì — QA nghiệm thu **tính năng**, không nghiệm thu diff. PR có vòng đời riêng (open →
review → merged) và GitHub đã hiển thị đủ ở tab PR; đừng đưa PR lên board.

---

## 2. Mười một cột

```
Backlog → Todo → In Progress → In Review → Changes Requested
        → Ready for QA → QA Testing → Ready for Release → Done
                                           ↘ Blocked   ↘ Canceled
```

| Cột | Nghĩa | Ai chuyển vào |
|---|---|---|
| `Backlog` | Tiếp nhận — mới vào, chưa ai duyệt | 🤖 tự động |
| `Todo` | Đã duyệt, đủ rõ. Có `Sprint` = cam kết sprint này · không có = chờ tới lượt | PoC |
| `In Progress` | Đang code | **Dev** |
| `In Review` | PR đã mở, đang chờ review | **Dev** |
| `Changes Requested` | Review trả về, tới lượt tác giả sửa | Người review |
| `Ready for QA` | PR đã merge, chờ QA nghiệm thu | 🔴 **Dev — sau khi merge** |
| `QA Testing` | QA đang test | QA |
| `Ready for Release` | QA duyệt xong, chờ phát hành | QA |
| `Done` | Đã phát hành và được nghiệm thu | QA |
| `Blocked` | Thiếu thông tin / đang chờ Malme trả lời | Ai phát hiện |
| `Canceled` | Bỏ, không làm nữa — **phải comment lý do** | PoC |

**`Todo` có hai trạng thái**, phân biệt bằng ô `Sprint`: không có `Sprint` = đã duyệt, đang xếp hàng
(triage đưa vào) · có `Sprint` = đã cam kết làm trong 2 tuần này (Planning gắn vào).

---

## 3. Các ô thông tin trên issue

| Ô | Ai điền | Khi nào |
|---|---|---|
| `Status` | Người đang giữ việc | Mỗi lần việc chuyển bước |
| `Assignees` | PoC hoặc tự nhận | Khi bắt đầu làm |
| **`Sprint`** | **PoC** | Buổi Planning — 🔴 dev không tự gắn |
| **`Lane`** | **PoC** | Phiên triage. `Sprint` = đã cam kết · `Ad-hoc` = phát sinh |
| `Project` | 🤖 tự động theo repo | — |
| `Kind` | PoC | `Requirement` (Malme tạo) · `Task` (Sora bóc) · `Clarification` (Sora hỏi) · `Commitment` |
| `Source` | PoC | Yêu cầu đến từ `Malme` hay `Sora` |
| `Waiting on` | Ai chuyển sang `Blocked` | Đang chờ ai trả lời |
| `Priority` | PoC | Triage |
| `Estimation days` | Dev + 1 người nữa | Grooming — **không ước lượng một mình** |
| `Start date` / `Deadline` | PoC | Planning |

**Vì sao `Lane` quan trọng:** cuối sprint đo *"bao nhiêu % công sức đi vào việc ngoài kế hoạch"*,
mục tiêu ≤20%. Không gắn `Lane` thì không đo được, và không ai chứng minh được dự án đang bị rút người.

---

## 4. Ba loại issue

| Loại | Ai tạo | Khi nào | Bắt buộc có |
|---|---|---|---|
| `Requirement` | **Malme** | Yêu cầu/tính năng mới | Mục tiêu + AC + deadline mong muốn + **link tài liệu/UX bên PM repo** |
| `Task` | **Sora** (dev) | Bóc nhỏ Requirement để code | **Link về Requirement cha** |
| `Clarification` | **Sora** (dev) | Spec thiếu/mâu thuẫn/mơ hồ | Câu hỏi cụ thể + link Requirement liên quan |

1. **Dev không tạo Requirement.** Thấy spec thiếu → `Clarification`.
2. **Task nào cũng phải có cha** (trừ việc kỹ thuật nội bộ).
3. **Deadline gắn ở Requirement**, không rải xuống từng task con.

`Clarification` sau khi Malme trả lời: là thay đổi/bổ sung → Malme sửa doc PM repo + cập nhật
Requirement, đóng Clarification · chỉ là giải thích → ghi câu trả lời, đóng.

---

## 5. Cửa triage + DoR

```
Issue mới (Malme hay Sora tạo đều vậy)
   │  tự động lên board: Status = Backlog
   ▼
PoC Sora duyệt theo lịch cố định: THỨ 3 & THỨ 6
   ├─ Trùng issue cũ?  → đóng, comment "Duplicate of #<số>" (không xoá, giữ vết)
   ├─ Đủ DoR?          → Status = Todo (CHƯA gắn Sprint) + gắn Lane/Kind/Source/Priority
   └─ Thiếu gì đó?     → Status = Blocked + comment nói rõ thiếu gì
                         (chờ Malme thì đặt Waiting on = Malme)
```

**DoR — MỘT bộ 6 điều dùng chung cho cả hai quy trình:**

- [ ] Đúng loại issue (Requirement/Task/Clarification), đúng template
- [ ] Có **AC rõ ràng**; Requirement kèm link tài liệu/UX bên PM repo (spec tiếng Nhật thì kèm link
      trang tóm tắt/SRS tiếng Việt trên PMS wiki)
- [ ] Đã liệt kê **trường hợp đặc biệt & validation** (3–5 dòng cũng được)
- [ ] **Hết câu hỏi mở** (còn Clarification chưa trả lời → `Blocked`, không để dev vừa làm vừa đoán)
- [ ] **Không trùng** issue đang mở
- [ ] Có **ước lượng công** (2 người cùng nhìn) + `Priority`; Requirement có deadline

> Cột `Backlog` **phải rỗng sau mỗi phiên**. Còn tồn nghĩa là phiên chưa xong.

### Đã họp Planning thứ Hai rồi, sao thứ Ba còn triage?

| | Planning (T2) | Triage (T3 & T6) |
|---|---|---|
| Xử lý issue nào | Đã duyệt từ trước, đang ở `Todo` | Mới sinh ra, đang ở `Backlog` |
| Việc làm | Gắn `Sprint` cho việc làm 2 tuần này | Quyết định việc mới có đủ rõ không |
| Phục vụ sprint nào | Sprint **đang bắt đầu** | Sprint **sau** |
| Ai · bao lâu | Cả team · 60–90' | Chỉ PoC · 15–30' |

Nếu chỉ duyệt ở Planning, việc mới nằm im tới **10 ngày làm việc** — trong khi cam kết với Malme là
phản hồi trong **2 ngày làm việc**. Issue mới **không chen vào sprint đang chạy**: duyệt sớm để kịp
SLA, rồi **xếp hàng** ở `Todo` tới buổi Planning kế tiếp.

---

## 6. Các buổi trong một sprint

```
TUẦN 1:  T2 PLANNING 60–90' cả team (+ ngay sau: PoC tạo Commitment gửi Malme)
         T3 Triage 15–30' PoC │ T6 Triage + Báo cáo Malme (+ hỏi expectation sprint sau)
TUẦN 2:  T3 Triage │ chiều T4 DEMO NỘI BỘ 45' (chỉ team) │ T5 PoC gửi list task grooming │
         T6 GROOMING đầu chiều 45' + RETRO 30' + Triage
Mỗi ngày: DAILY 10–15' — nhắn Slack 3 dòng TRƯỚC giờ họp
T2 tuần kế: PoC gửi Q&A (gom từ Grooming) cho Malme
```

Tổng ~3 giờ họp/người/sprint. Mọi buổi có giờ kết thúc cứng.
Nguyên tắc lịch: **không họp hai lần cho cùng một nội dung** — triage và phân loại ad-hoc là MỘT
phiên. **Demo là buổi nội bộ** (chiều T4 tuần 2); nghiệm thu Malme làm async qua checklist trong issue
Commitment, không họp demo trực tiếp với Malme. Báo cáo tuần 2 gửi dạng văn bản.

| Buổi | Mục đích | Xong khi |
|---|---|---|
| **Planning nội bộ** T2 | Chốt việc team cam kết làm xong trong 2 tuần | Mọi issue được chọn có `Sprint` + `Assignees`, tổng ước lượng ≤ 80% sức đội; PoC tạo Commitment gửi Malme |
| **Daily** mỗi ngày | Phát hiện chỗ vướng sớm — **không phải** báo cáo tiến độ | Mọi chỗ vướng có người nhận gỡ |
| **Triage** T3 & T6 | Quyết định việc mới có đủ rõ để vào kho | Cột `Backlog` rỗng |
| **Demo nội bộ** chiều T4 tuần 2 | Đối chiếu kết quả với AC đã ghi trong issue (chỉ team) | Mỗi issue cam kết được chấm ✅/⚠️/❌ và ghi vào comment |
| **Grooming** T6 tuần 2 (đầu chiều) | Làm rõ việc của sprint sau (PoC gửi list task từ T5) | Mọi issue dự kiến vào sprint sau có ước lượng, hết câu hỏi mở; Q&A gom gửi Malme T2 tuần kế |
| **Báo cáo Malme** T6 tuần 1 | Malme biết họ đang nợ ta gì, dự án có rủi ro trễ không; hỏi expectation sprint sau | Đã gửi, mục chờ Malme có hạn chót cụ thể |
| **Retro** T6 tuần 2 | Sửa quy trình, không phải kiểm điểm người | Chọn được 1–2 điểm cải thiện, mỗi điểm có người phụ trách |

Hai luật ở buổi Planning:
- **Chỉ cam kết 80% sức.** 20% chừa cho việc gấp. Cam kết 100% là cách chắc chắn nhất để trượt.
- **Issue chưa đủ 6 điều DoR thì không được vào sprint.** Không ngoại lệ.

Daily: mỗi người nhắn Slack 3 dòng trước giờ họp — *hôm qua làm gì / hôm nay làm gì / đang vướng gì*.
Dev **cập nhật `Status` TRƯỚC khi họp**; vào họp chỉ nói chỗ vướng. Vào họp mà phải đi lại từng việc
nghĩa là board chưa được cập nhật — sửa board, đừng kéo dài buổi họp.

---

## 7. Review 3 tầng + DoD

| PR loại gì | Ai review |
|---|---|
| Mọi PR | Chạy skill `delivery-pr-review` (AI) + tự soát trước khi giao cho người |
| Tính năng theo spec rõ, sửa bug | **Đồng nghiệp cùng dự án** |
| Đụng kiến trúc · thiết kế dữ liệu · đăng nhập/phân quyền · migration · hạ tầng | **Thái / Hoà** |

**Một issue coi là xong khi:**
- [ ] Code kèm **test tự động** cho luồng chính + các edge case đã liệt kê
- [ ] **Pass CI**
- [ ] PR được review **đúng tầng**
- [ ] Đối chiếu đủ AC (luồng nghiệp vụ chính thì QA xác nhận)
- [ ] **Cập nhật PMS wiki nếu đụng hạ tầng/nghiệp vụ lõi** — không để trong máy cá nhân hay chat.
      Quyết định kiến trúc: ghi thêm **ADR trong repo code** (`docs/decisions/`), link từ wiki

> Worklog **không** nằm trong DoD — nó là việc hằng ngày. Nhưng vẫn bắt buộc.

**Vì sao `Refs` chứ không `Fixes`/`Closes`/`Resolves`:** những từ này khiến GitHub **đóng issue ngay
khi merge**. Issue bị đóng → workflow `Item closed` set thẳng `Status = Done`, **nhảy qua
`Ready for QA` và `QA Testing`** — QA không bao giờ biết có việc cần nghiệm thu, và nó xảy ra im lặng.

**PR merge xong mà issue vẫn mở là đúng quy trình.** Vòng đời: dev làm → PR merge vào nhánh chung →
issue ở lại `Ready for QA` để QA nghiệm thu → **QA đóng issue** sau khi kiểm xong toàn bộ AC. Khi rà
backlog:
- Không xếp "PR merged + issue mở" vào rổ "xong, nên đóng"; không tự đóng, không đề xuất PM đóng.
- Thứ đáng nêu là chuyện khác: PR merge đã lâu mà QA chưa bắt đầu hoặc chưa có PASS / FAIL; PR chỉ làm
  một phần AC rồi dừng; bằng chứng PR dẫn trong thread sai (nhầm số, PR không tồn tại, merge vào nhánh
  khác).
- Muốn biết QA tới đâu thì đọc comment cuối thread và file test case tester đăng, không suy từ trạng
  thái PR.

*30/09/2026: một lượt rà backlog liệt kê 15 issue "đã xong mà còn mở" như tồn đọng cần đóng; người
dùng (PM) đính chính là chúng đang đúng chỗ.*

---

## 8. Sprint Commitment

**Ngay sau Planning**, PoC tạo **1 issue** trong repo issue của dự án rồi gửi Malme:

- Tiêu đề: `Sprint N — Commitment (<dự án>)`
- Field: `Kind = Commitment`, `Lane = Sprint`, `Sprint = Sprint N`
- Dùng **sub-issues** link toàn bộ issue cam kết → field `Sub-issues progress` tự hiện %,
  **Say/Do ratio lấy thẳng từ đó, không đếm tay**

| Mục | Nội dung |
|---|---|
| Sprint Goal | 1–3 câu **chức năng người dùng đạt được** (ngôn ngữ nghiệp vụ, Malme đọc hiểu) |
| Danh sách issue cam kết | Link từng issue + ước lượng — tổng **chỉ 80% sức đội** |
| Demo Plan | Demo nội bộ (chiều T4 tuần 2) thao tác gì, môi trường nào, dữ liệu gì |
| Checklist nghiệm thu | Malme cập nhật vào issue này: điều kiện, chứng cứ, người xác nhận |
| Ngoài phạm vi | Ghi rõ những gì KHÔNG làm sprint này |
| Phụ thuộc | Cần Malme cung cấp gì (spec chốt, dữ liệu, tài khoản, câu trả lời) + hạn chót |

- **Team chạy ngay sau Planning, KHÔNG đợi Malme confirm** — tránh lãng phí thời gian chờ. Malme
  confirm (comment/👍) và cập nhật checklist nghiệm thu sau khi sprint đã chạy; điều chỉnh scope thì
  PoC cập nhật lại Commitment.
- Trong sprint **scope đóng băng** — thay đổi đi luồng việc gấp / Change Request.
- Việc có nguy cơ không xong → báo trên issue Commitment **ngay khi phát hiện**, không đợi cuối sprint.
- Cuối sprint: ✅/⚠️/❌ từng issue (demo nội bộ) + nghiệm thu theo checklist (Malme xác nhận async) +
  kết luận carry-over thành comment cuối rồi đóng issue.

---

## 9. SLA hai chiều

| Việc | Bên chịu | Hạn |
|---|---|---|
| Acknowledge Requirement mới (kèm bóc task) | Sora | 2 ngày làm việc |
| **Trả lời Clarification / Q&A** | **Malme** | **3 ngày làm việc** |
| Ước lượng + đề xuất sprint | Sora | 3 ngày làm việc sau khi hết điểm mơ hồ |
| Impact note cho Change Request | Sora | 2 ngày làm việc |
| Phản hồi phân loại việc [URGENT] | Sora | Trong ngày làm việc |
| Gửi candidate list trước Planning | Sora | Trước 1 ngày làm việc |
| Confirm Commitment + cập nhật checklist nghiệm thu | **Malme** | Trước buổi Demo nội bộ (T4 tuần 2) |

**Quy tắc công bằng:** Malme quá hạn trả lời Clarification → issue liên quan `Blocked`,
**deadline tự lùi đúng số ngày chờ**. Đo thời hạn áp dụng cho cả hai bên.

---

## 10. Bốn luồng giao tiếp với Malme

**6.1 Malme gửi yêu cầu mới** — Malme chuẩn bị doc + UX trong PM repo → tạo `Requirement` kèm link →
vào `Backlog` → PoC xử lý ở phiên triage gần nhất (⏱ tối đa 2 ngày làm việc) → Sora trả lời ngay trên
issue: ✅ *"Đã hiểu — ước lượng X ngày, đề xuất sprint Y"* (kèm bóc Task con) hoặc ❓ *"Cần làm rõ A, B"*
→ Malme confirm → `Todo`. Requirement lớn: PoC viết tóm tắt/SRS tiếng Việt lên PMS wiki (link về spec
gốc **kèm version**), Task con link tới trang wiki này.
**Điểm chốt:** yêu cầu chỉ "đã tiếp nhận" khi có **acknowledge của Sora + confirm của Malme trên issue**.

**6.2 Dev thấy spec thiếu** — tạo `Clarification` → PoC gom câu hỏi trùng, diễn đạt lại (ở Grooming
T6 tuần 2) → gửi Q&A cho PoC Malme MỘT đợt vào T2 tuần kế, hẹn 3 ngày làm việc → Malme trả lời trên
issue → quá hạn thì issue liên quan `Blocked` + `Waiting on = Malme`, không tính Sora trễ.

**6.3 Việc gấp giữa sprint** — Malme tạo issue + nhắn PoC kèm `[URGENT]` → PoC phân loại ngay:
sự cố production → làm luôn, `Lane = Ad-hoc` · gấp thật có deadline khách → **ĐỔI CHỖ**, rút 1 việc
tương đương khỏi làn Sprint và ghi rõ trên issue Commitment · không gấp thật → chờ sprint sau.
Hết buffer 20% mà việc gấp vẫn đến → PoC đưa **2 lựa chọn công khai** cho Malme: bỏ việc nào, hoặc
lùi mốc nào.

**6.4 Change Request** — Malme sửa doc PM repo (commit/PR, nhìn được diff) + cập nhật Requirement,
**không sửa ngầm** → PoC viết **Impact note** trên issue trong 2 ngày làm việc (tốn thêm bao nhiêu,
task nào bị chạm, lịch lùi bao nhiêu) → không chạm sprint đang chạy thì làm rõ ở Grooming vào sprint
sau · chạm sprint đang chạy thì **đổi chỗ, không cộng thêm** · thay đổi lớn (>3 ngày công / chạm data
model, kiến trúc) thì CR chính thức 1 trang, Malme ký xác nhận rồi mới làm.

---

## 11. Mô hình lưu trữ — cái gì nằm ở đâu

| Nội dung | Nằm ở | Tuyệt đối KHÔNG |
|---|---|---|
| Spec/UX gốc của khách | **PM repo** (Malme) | ❌ copy nguyên văn vào wiki — wiki chỉ **tóm tắt + link về PM repo kèm version** |
| Quyết định, trao đổi, cam kết với Malme | **Issue** trên project repo | ❌ chốt trong wiki/chat — Malme không theo dõi wiki nội bộ |
| SRS tiếng Việt, phân tích nghiệp vụ, thiết kế, tài liệu vận hành, handover, meeting note nội bộ | **PMS wiki** (đúng không gian dự án) | ❌ để trong máy cá nhân / chat / file rời |
| Code, config, README kỹ thuật | Project repo | |

---

## 12. Sáu con số xem ở Retro

| Con số | Đo gì | Mong muốn |
|---|---|---|
| **Nói được – làm được** | Đầu sprint hứa bao nhiêu, cuối sprint xong bao nhiêu | ≥ 80% |
| **% việc phát sinh** | Bao nhiêu công sức đi vào việc ngoài kế hoạch | ≤ 20% |
| **Issue bị trả lại** | Demo xong bị trả về vì sai/sót | Giảm dần |
| **PR chờ review** | Nằm chờ bao lâu mới có người xem | < 24h |
| **Bug lọt production** | Bug tìm ra **sau khi** issue đã `Done` | Giảm dần · 0 Critical |
| **Issue blocked quá SLA** | Issue chờ Malme quá 3 ngày làm việc | Không tồn qua sprint |

Sáu con số chỉ đúng nếu mọi người gắn `Lane` và cập nhật trạng thái đúng lúc.
Board sai thì Retro bàn trên số liệu sai.

**Hai thứ theo dõi, không đặt trần cứng** (GitHub Projects không cưỡng chế WIP limit, đặt con số bị
vi phạm mỗi ngày chỉ làm mất uy tín cả bộ luật):

| Theo dõi | Xem ở đâu | Xử lý khi nào |
|---|---|---|
| Số item `In Progress` / người | View `2-Assignees` | Retro xem trung bình. Ngưỡng "quá tải" quyết sau 2 sprint có số liệu thật |
| Độ dài hàng đợi `Ready for QA` | View `1`, cột `Ready for QA` | So với sprint trước. Tăng liên tục = nghẽn QA → Retro quyết ai test cái gì |

---

## 13. Checklist triển khai dự án mới

1. **Project repo:** tạo 3 issue template trong `.github/ISSUE_TEMPLATE/` (skill `delivery-write-issue` hỗ trợ).
2. **Project repo:** tạo label `area:*` + `needs-doc`. Thêm repo vào **board 201** (auto-add) —
   `Status`/`Lane`/`Kind`/`Source`/`Priority`/`Waiting on`/`Sprint` là project field dùng chung,
   không tạo lại theo repo.
3. **PM repo:** thống nhất cấu trúc thư mục spec/UX + quy ước đặt tên để issue dễ dẫn chiếu.
4. **PMS wiki:** tạo không gian dự án với 4 nhánh chuẩn — `SRS & tóm tắt spec` · `Thiết kế kỹ thuật` ·
   `Vận hành & handover` · `Biên bản nội bộ`. Trang SRS luôn ghi rõ version spec gốc mà nó tóm tắt.
5. Chốt danh tính **PoC Malme** và **PoC Sora** — mỗi bên đúng 1 người; đưa lịch sprint vào calendar
   hai bên.
6. Kickoff 30' với Malme: thống nhất SLA + luật Sprint Commitment.

Bộ label:

```bash
for R in 168-yahagi-panwall genba-bento civilink-boxc 147-yahagi-ryokka-system; do
  gh label create "area:fe"    -R structuralengine/$R -c 1D76DB -d "Frontend"            -f
  gh label create "area:be"    -R structuralengine/$R -c 5319E7 -d "Backend"             -f
  gh label create "area:infra" -R structuralengine/$R -c 0052CC -d "Infra / CI / Deploy" -f
  gh label create "area:db"    -R structuralengine/$R -c B60205 -d "Data model"          -f
  gh label create "needs-doc"  -R structuralengine/$R -c D4C5F9 -d "DoD: phải cập nhật PMS wiki" -f
done
```

---

## Tóm tắt một dòng

> **Việc mới rơi vào `Backlog` → PoC duyệt T3 & T6 → vào `Todo` → Planning T2 gắn `Sprint` (ngay sau
> PoC tạo Commitment gửi Malme) → dev kéo `In Progress` → mở PR ghi `Refs #123` → merge xong tự kéo
> `Ready for QA` → QA nghiệm thu theo AC → `Done`. Việc sprint sau làm rõ ở Grooming T6 tuần 2, Q&A
> gửi Malme T2 tuần kế. Demo nội bộ chiều T4 tuần 2; Malme nghiệm thu async qua checklist. Việc gấp đi
> làn `Ad-hoc` trong 20% chừa sẵn — không bao giờ cộng thêm vào phần đã cam kết.**

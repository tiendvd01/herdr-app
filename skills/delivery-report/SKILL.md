---
name: delivery-report
description: "Lập báo cáo tiến độ Sprint & Milestone cho PM/PoC từ số liệu thật của board Sora Team (structuralengine #201) + milestone repo — luôn chạy cổng kiểm tra độ tin cậy dữ liệu trước khi viết số, tính 6 chỉ số Retro, dự phóng milestone, xuất báo cáo tuần T6 cho Malme (VI/JA), báo cáo chốt sprint, hoặc báo cáo milestone nhiều dự án. Dùng khi người dùng hỏi \"báo cáo tiến độ\", \"sprint tới đâu rồi\", \"còn kịp deadline không\", \"tiến độ milestone\", \"số liệu retro\", \"báo cáo tuần cho Malme\"."
---

# Báo cáo tiến độ Sprint & Milestone — team Sora

Skill này biến board **`Sora Team` (org `structuralengine`, project #201)** thành một bản báo cáo
mà PM đọc xong **tin được và hành động được**. Skill **tự chứa** — quy trình cần thiết nằm ngay
trong file này, không phụ thuộc tài liệu ngoài.

**Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`.

> **Luật gốc của skill này: báo cáo chỉ đáng tin bằng dữ liệu nằm dưới nó.**
> Board 201 có thể còn field trống và issue kẹt trạng thái (§7). Vì vậy **không bao giờ viết con số
> trước khi chạy cổng tin cậy §3** — một con số đẹp nhưng sai làm PM ra quyết định sai, tệ hơn
> nhiều so với việc nói thẳng "mục này chưa đo được vì X".

Skill anh em: `delivery-board` (thao tác **ghi** lên board). Skill này **chỉ đọc** — nó
không đổi `Status`, không gắn `Sprint`. Cần sửa dữ liệu sai thì báo ra, người dùng quyết.

---

## 0. Sáu nguyên tắc

1. **Mọi con số phải có nguồn.** Ghi kèm lệnh đã chạy hoặc view board tương ứng. Không ước lượng
   bằng cảm tính, không suy ra từ trí nhớ, không lấy lại số của báo cáo tuần trước.
2. **Thiếu dữ liệu thì nói thiếu.** Viết `chưa đo được — thiếu <field> ở <n> issue` kèm việc cần
   làm để lần sau đo được. Tuyệt đối không làm tròn hay bỏ qua im lặng.
3. **Tin xấu lên đầu.** Thứ tự: đang chờ Malme → rủi ro trễ → tiến độ → việc đã xong.
4. **Chỉ đọc.** Không ghi gì lên GitHub trong lúc lập báo cáo. Đăng báo cáo (comment issue
   Commitment / gửi Malme) **chỉ sau khi người dùng duyệt bản nháp**.
5. **Đúng đối tượng đọc.** PM Malme cần *ảnh hưởng tới lịch và việc họ phải làm*; HoE cần *tải
   người và chồng lấn dự án*; team cần *việc cụ thể*. Cùng dữ liệu, ba cách kể khác nhau (§5).
6. **Báo cáo gửi ra ngoài luôn là bản nháp tiếng Việt trước** để người dùng duyệt, kể cả khi bản
   cuối sẽ là tiếng Nhật (rule email của repo).

---

## 1. Router — người dùng muốn loại báo cáo nào

| Người dùng nói | Loại | Template | Phạm vi dữ liệu |
|---|---|---|---|
| "báo cáo tuần", "báo cáo T6 cho Malme", "gửi Malme tình hình" | **R1 · Tuần (T6)** | `references/templates.md` §1 | 1 dự án · sprint hiện tại · 7 ngày qua |
| "chốt sprint", "báo cáo demo", "kết quả sprint N" | **R2 · Chốt sprint** | §2 | 1 dự án · trọn sprint · đối chiếu Commitment |
| "tiến độ milestone", "còn kịp bàn giao không", "roadmap" | **R3 · Milestone** | §3 | 1 repo/dự án · theo milestone, không theo sprint |
| "tình hình chung 4 dự án", "báo cáo cho HoE" | **R4 · Danh mục dự án** | §4 | Toàn board · theo `Project` |
| "sprint đang tới đâu", hỏi nhanh giữa tuần | **R5 · Nhanh** | §5 | Trả lời thẳng trong chat, vẫn chạy §3 rút gọn |
| "số liệu retro", "% việc phát sinh", "say/do" | **R6 · Retro** | §6 | Sprint vừa kết thúc |
| "sổ rủi ro", "rủi ro dự án", "thêm rủi ro" | **Sổ rủi ro** (không phải báo cáo) | SKILL §11 | 1 dự án · sống suốt dự án |

**Chốt trước khi chạy** (hỏi nếu người dùng chưa nói, trừ R5): dự án nào · sprint/milestone nào ·
ai đọc · ngôn ngữ (VI/JA) · đăng ở đâu (file / comment issue Commitment / email / chỉ trong chat).
Mặc định khi người dùng không nói: dự án đang làm việc · sprint hiện tại · tiếng Việt · xuất file
`SoraVaults/<dự án>/reports/<YYYY-MM-DD>-<loai>.md` (luật chung §6, lấy thư mục bằng `vault-path.sh reports`) và hỏi trước khi đăng lên GitHub.

---

## 2. Quy trình 6 bước — không bỏ bước nào

```
B1  Chốt phạm vi (§1)
B2  Thu thập số liệu        → scripts/report.sh all "<Sprint N>"
B3  🔴 CỔNG TIN CẬY (§3)    → quality · drift · stale · blocked
       ├─ đủ tin  → đi tiếp
       └─ có lệch → liệt kê điểm lệch, hỏi người dùng: sửa board trước hay báo kèm cảnh báo
B4  Tính chỉ số (§4 + references/metrics.md) — chỉ tính chỉ số nào dữ liệu cho phép
B5  Viết theo template (references/templates.md), tin xấu lên đầu
B6  Trình bản nháp cho người dùng duyệt → mới đăng/gửi
```

Không rút gọn B3. Nếu người dùng giục "làm nhanh thôi", vẫn chạy `quality` + `drift` và rút gọn
phần trình bày, đừng rút gọn phần kiểm tra.

---

## 3. Cổng tin cậy — 7 phép kiểm tra

Chạy `scripts/report.sh quality "<Sprint N>"`, `drift`, `stale`, `blocked`. Mỗi phát hiện dưới đây
**phải xuất hiện trong báo cáo** (mục "Độ tin cậy số liệu") hoặc được sửa trên board trước:

| # | Kiểm tra | Vì sao quan trọng | Xử lý |
|---|---|---|---|
| 1 | Issue trong sprint **thiếu `Estimation days`** | Không có mẫu số → mọi % theo ngày công đều sai | Báo số issue thiếu; tính % theo **số issue** thay vì ngày công, và nói rõ đang tính theo cách nào |
| 2 | Issue trong sprint **thiếu `Lane`** | `% việc phát sinh` — chỉ số quan trọng nhất — không tính được | Ghi "độ phủ Lane = x%"; dưới 80% thì **không công bố con số %**, chỉ nêu độ phủ |
| 3 | **PR đã merge có dẫn chiếu issue (`Refs #n` hoặc `Refs <URL issue>`) mà issue chưa sang `Ready for QA`** | Dev quên kéo thẻ → board báo chậm hơn thực tế, PM tưởng trễ | `drift` liệt kê từng cái; hỏi người dùng có phải việc đã xong không, đừng tự suy. PR không ghi `Refs` thì không phát hiện được |
| 4 | Issue **`closed` nhưng `Status ≠ Done`** (hay ngược lại) | Hai nguồn sự thật lệch nhau | Liệt kê; thường do đóng issue ngoài board |
| 5 | Issue **`In Progress`/`In Review` > 5 ngày không có hoạt động** | Việc đứng im nhưng vẫn được đếm là "đang chạy" | Đưa vào mục rủi ro, kèm tên người và ngày cập nhật cuối |
| 6 | **`Backlog` còn tồn** sau phiên triage T3/T6 | Có việc chưa được phân loại → báo cáo thiếu phạm vi | Nêu số lượng tồn; đây là việc của PoC, không phải của báo cáo |
| 7 | Issue `Done` **đã bị auto-archive** (đóng > 30 ngày) | Board không còn item → đếm thiếu việc đã xong của sprint dài/milestone | Với milestone và throughput, **đếm từ repo** (`report.sh throughput`, `milestone`), không đếm từ board |

**Kết luận độ tin cậy — ghi ngay đầu báo cáo, một dòng:**

| Mức | Điều kiện |
|---|---|
| 🟢 Cao | Độ phủ `Estimation days` và `Lane` ≥ 90% · không có drift · không có issue kẹt |
| 🟡 Trung bình | Độ phủ 60–90%, hay có ≤3 điểm lệch đã liệt kê rõ |
| 🔴 Thấp | Độ phủ < 60%, hay có drift chưa xác minh — **chỉ báo cáo định tính, không công bố %** |

---

## 4. Chỉ số — tóm tắt (công thức đầy đủ: `references/metrics.md`)

| Chỉ số | Công thức | Nguồn | Mong muốn |
|---|---|---|---|
| **% hoàn thành sprint** | ngày công `Done` / tổng ngày công cam kết | `report.sh sprint` | so với % thời gian đã trôi |
| **Say/Do** | issue `Done` / issue đã cam kết | `Sub-issues progress` của issue Commitment (`report.sh commitment`) | ≥ 80% |
| **% việc phát sinh** | ngày công `Lane = Ad-hoc` / tổng ngày công sprint | `report.sh sprint` | ≤ 20% |
| **Ticket bị trả lại** | số lần vào `Changes Requested` / `Blocked` sau Demo | board + comment | giảm dần |
| **PR chờ review** | thời gian issue nằm `In Review` | `report.sh stale` (xấp xỉ) | < 24h |
| **Bug lọt production** | issue `Fix` tạo sau khi issue gốc `Done` | repo, gắn nhãn/Type `Fix` | giảm dần · 0 Critical |
| **Blocked quá SLA** | `Blocked` + `Waiting on = Malme` > 3 ngày làm việc | `report.sh waiting`, `blocked` | không tồn qua sprint |
| **Tiến độ milestone** | issue đóng / tổng issue của milestone | `report.sh milestone` | so với % thời gian còn lại |
| **Dự phóng ngày xong** | issue còn lại ÷ throughput 4 tuần gần nhất | `report.sh throughput` + `milestone` | trước `due date` |

🔴 **Ba cái bẫy khi tính:**
- **% thời gian đã trôi phải luôn đi kèm % hoàn thành.** "Xong 40%" vô nghĩa nếu không biết sprint
  đã đi hết 80% thời gian. Luôn viết cặp: `hoàn thành 40% · đã qua 80% thời gian → chậm`.
- **Say/Do đếm theo issue cam kết ban đầu**, không đếm lại theo danh sách cuối sprint. Việc bị
  **đổi chỗ** (swap) phải nêu riêng, không lặng lẽ trừ vào mẫu số.
- **Deadline bị lùi do chờ Malme không tính là Sora trễ** (§9 SLA quy trình) — nhưng **phải hiện
  trong báo cáo**, kèm số ngày đã chờ, để PM thấy chi phí của việc chậm trả lời.

---

## 5. Kể chuyện đúng đối tượng

| Đối tượng | Mở đầu bằng | Không nên |
|---|---|---|
| **PoC/PM Malme** | Việc họ phải làm (Clarification chưa trả lời, spec chờ chốt) + ảnh hưởng lịch | Chi tiết kỹ thuật, tên nhánh, lý do nội bộ |
| **HoE (Thái)** | Tải theo người, chồng lấn dự án, % ad-hoc vượt buffer | Kể lại từng issue |
| **Team** | Việc còn lại theo người, việc đứng im | Ngôn ngữ ngoại giao |

Câu mở đầu luôn là **một câu kết luận** ("Sprint 1 đang **đúng tiến độ**, rủi ro duy nhất là #123
chờ Malme 4 ngày"), không phải bảng số. Bảng nằm dưới.

---

## 6. Milestone — khác sprint, đừng trộn

> **Sprint = iteration field của board 201** (trải nhiều repo). **Milestone = mốc phát hành lớn của
> MỘT repo** (vd `168 v1.0 リリース`). Một milestone trải nhiều sprint.

Báo cáo milestone trả lời đúng 4 câu:
1. Còn bao nhiêu issue mở / tổng, tính theo cả ngày công nếu có `Estimation days`.
2. Còn bao nhiêu ngày tới `due date`, và theo throughput hiện tại thì **dự phóng xong ngày nào**.
3. Những issue nào đang chặn mốc (Blocked / chờ Malme / chưa đủ DoR).
4. Nếu trễ: **hai lựa chọn công khai** — bỏ bớt phạm vi nào, hay lùi mốc bao nhiêu (đúng luật
   "thay đổi luôn có ảnh hưởng, ảnh hưởng phải được nói rõ"). Không báo trễ mà không kèm lựa chọn.

Issue chưa gắn milestone thì **không nằm trong phép đếm** — nêu rõ số issue của dự án chưa gắn
milestone, vì đó là phần "không nhìn thấy" của mốc.

---

## 7. Cạm bẫy đã biết trên board 201

| Cạm bẫy | Hệ quả nếu quên |
|---|---|
| `Lane`, `Kind`, `Source`, `Waiting on` **có thể chưa được điền đủ** (chỉ PoC điền ở phiên triage) | `% việc phát sinh` và mục "chờ Malme" thiếu dữ liệu — phải báo độ phủ |
| **Auto-archive dọn item `Done` đóng > 30 ngày** | Đếm việc xong của milestone/throughput bị thiếu → đếm từ repo |
| Board **chỉ chứa issue**, PR ở lại repo | Đừng tìm PR trên board; đo PR bằng `gh pr list` ở repo |
| `Ready for QA` có thể lẫn PR nếu automation cũ chưa tắt | Cắt theo loại item — chỉ đếm issue, không đếm PR, khi báo hàng đợi QA |
| Một số dự án **chưa quen dùng issue** (mở PR thẳng, ít issue) | Báo cáo dựa trên issue sẽ **trống một cách sai lệch** — phải nói rõ "board chưa phản ánh thực tế dự án này", đối chiếu thêm PR/worklog |
| Sprint là iteration, **không phải milestone** | Đừng lấy milestone làm sprint |
| `updatedAt` đổi cả khi chỉ có comment | Số ngày "đứng im" và "chờ Malme" là **xấp xỉ** — luôn ghi chữ "xấp xỉ" |

---

## 8. Công cụ

```bash
scripts/report.sh --help

# Một lệnh cho trọn bộ số liệu của một lần lập báo cáo
scripts/report.sh all "Sprint 1"

# Từng phần
scripts/report.sh sprint ["Sprint 1"]      # tiến độ sprint: status, ngày công, % hoàn thành, lane
scripts/report.sh commitment ["Sprint 1"]  # issue Commitment + Say/Do từ Sub-issues progress
scripts/report.sh quality ["Sprint 1"]     # 🔴 độ phủ field → mức tin cậy
scripts/report.sh drift [days] [repo...]   # 🔴 PR merged dẫn chiếu issue (Refs #n hoặc Refs <URL>)
                                           #    mà issue chưa sang Ready for QA
scripts/report.sh stale [days]             # việc đứng im (mặc định 5 ngày)
scripts/report.sh waiting                  # đang chờ Malme + số ngày (xấp xỉ) + SLA 3 ngày làm việc
scripts/report.sh blocked                  # Status = Blocked + số ngày
scripts/report.sh milestone [repo]         # tiến độ từng milestone đang mở + dự phóng
scripts/report.sh throughput [weeks] [repo] # issue đóng theo tuần (đếm từ repo, né auto-archive)
scripts/report.sh portfolio                # tổng quan theo Project — cho HoE
scripts/report.sh raw                      # JSON đã chuẩn hoá, tự phân tích bằng jq
```

Yêu cầu: `gh` đã đăng nhập + `jq`. Board khác: `SORA_GH_OWNER`, `SORA_GH_PROJECT`.
Repo khác mặc định: `SORA_ISSUE_REPOS`, `SORA_CODE_REPOS`. Cache 10 phút
(`SORA_CACHE_TTL=0` để ép tải lại — luôn ép tải lại khi lập báo cáo chính thức).
File mất quyền chạy sau khi apply skill → gọi `bash scripts/report.sh …`.

Số liệu không có trên GitHub (giờ công thực tế, capacity) nằm ở **PMS** — dùng MCP `worklog_list`
nếu có, và ghi rõ nguồn. **GitHub = việc xảy ra, PMS = việc được đo.**

---

## 9. Khi nào phải nói "không biết"

Nói thẳng, kèm việc cần làm để lần sau biết:

| Tình huống | Câu trả lời đúng |
|---|---|
| Sprint chưa có issue Commitment | "Chưa có bản cam kết cho Sprint N → **không có Say/Do**. Số dưới đây là trạng thái board tại thời điểm chạy, không phải mức hoàn thành cam kết." |
| Độ phủ `Lane` < 80% | "% việc phát sinh chưa đo được (Lane phủ x%). Cần PoC gắn Lane ở phiên triage T3/T6." |
| Dự án chưa dùng issue | "Board không phản ánh dự án này (n issue / m PR). Báo cáo dựa trên PR và worklog, độ chính xác thấp hơn." |
| Người dùng hỏi "bao giờ xong?" mà không có estimation | "Không dự phóng được từ ngày công. Dự phóng theo throughput: còn n issue, tốc độ k issue/tuần → khoảng ngày X, sai số lớn." |

Không bao giờ bù chỗ trống bằng phỏng đoán. Một dòng "chưa đo được vì X" giữ được lòng tin của
PM; một con số bịa thì không.

---

## 10. Bối cảnh cố định

Org, board, nhịp sprint, nhịp báo cáo, repo issue, view board, SLA với Malme: **`../sora-profile/SKILL.md`**.
Quy trình nền (chỉ số, cột, SLA, Sprint Commitment): `../sora-profile/references/quy-trinh.md` — dùng chung với `delivery-board`, không tham chiếu tài liệu ngoài.

---

## 11. Sổ rủi ro — những gì chưa xảy ra nhưng sẽ làm trễ hoặc hỏng

"Rủi ro trễ" ở `references/metrics.md` §4 là việc **đang** trễ, đo được trên board. Sổ rủi ro giữ những thứ **chưa** thành issue: phụ thuộc bên ngoài (khách chưa trả lời, tài khoản, API bên thứ ba), điểm kỹ thuật chưa rõ, sức người (nghỉ, thiếu vai trò), đặc tả còn đổi.

**Nằm ở đâu** (theo `../sora-profile/references/quy-trinh.md` §11): một trang **"Sổ rủi ro"** trên wiki PMS của dự án — phân tích nội bộ. Rủi ro chạm tới cam kết với khách thì **cũng** nêu trong báo cáo tuần; cần khách hành động thì thành Clarification. Không chốt trên wiki điều khách cần biết. Chưa có trang thì tìm bằng `wiki_search` trước, không có mới đề xuất tạo (nháp, duyệt rồi mới ghi; `projectId` lấy từ memory dự án).

**Mỗi rủi ro một dòng:**

| Trường | Ghi gì |
|---|---|
| Mã | `R-NN`, không dùng lại |
| Rủi ro | dạng "nếu … thì …", ví dụ "nếu khách chưa cấp tài khoản production trước ngày chạy thử thì phần tích hợp không kịp kiểm trước nghiệm thu" |
| Khả năng · Tác động | thấp / vừa / cao; tác động nói bằng hậu quả: lùi mốc bao lâu, sai dữ liệu gì, tốn bao nhiêu |
| Dấu hiệu sớm | điều đo được cho biết rủi ro sắp xảy ra (hạn trả lời trôi qua, PR đứng im…) |
| Biện pháp | giảm khả năng hoặc giảm tác động; ai làm, hạn nào |
| Người theo dõi · Ngày xem lại | một người; ngày cụ thể |
| Trạng thái | mở · đang xảy ra (→ link issue Blocked / Clarification) · đã đóng (lý do) |

**Xếp:** cao × cao lên đầu; dòng có khả năng và tác động đều "thấp" thì không cần giữ.

**Nhịp:**

- **Planning (T2 tuần 1):** rà sổ; rủi ro mới từ Solution của dev (mục rủi ro) và từ đặc tả đổi thì thêm.
- **Báo cáo T6:** đưa các rủi ro "cao" chạm cam kết vào mục rủi ro của báo cáo (`references/templates.md` §1), luôn kèm phương án.
- **Retro:** rủi ro nào đã xảy ra mà sổ không có → thêm một dòng học được.
- Rủi ro xảy ra thì **thành issue** (Blocked / Clarification) và đóng dòng trong sổ kèm link. Sổ không thay issue.

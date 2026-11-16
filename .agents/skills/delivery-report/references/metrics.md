# delivery-report/references/metrics.md

---

# Chỉ số — định nghĩa, công thức, nguồn, và cách xử lý khi thiếu dữ liệu

Mọi con số trong báo cáo phải tra được về đúng một dòng trong file này. Nếu một yêu cầu không khớp
dòng nào ở đây → nói rõ đó là **số tự đặt ra cho lần này** và ghi cách tính ngay trong báo cáo.

---

## 1. Tiến độ sprint

### 1.1 % hoàn thành (theo ngày công) — *số chính*

```
% hoàn thành = Σ Estimation days (Status ∈ {Done, Ready for Release})
             ÷ Σ Estimation days (mọi issue có Sprint = N)
```

Nguồn: `report.sh sprint`. Điều kiện dùng được: độ phủ `Estimation days` ≥ 90%.

🔴 **Luôn đi cặp với % thời gian đã trôi**: `(hôm nay − ngày bắt đầu sprint) ÷ 12 ngày lịch` (độ dài iteration; `report.sh` đếm cả tử và mẫu theo ngày lịch nên hai vế cùng loại ngày — đừng chia cho 10 ngày làm việc).
Chỉ khi đặt cạnh nhau con số mới có nghĩa:

| Hoàn thành vs thời gian | Kết luận viết ra |
|---|---|
| hoàn thành ≥ thời gian | **đúng tiến độ** |
| lệch 10–20 điểm | **chậm nhẹ** — nêu 1–2 issue đang giữ chân |
| lệch > 20 điểm | **có nguy cơ trượt** — bắt buộc kèm phương án (§4) |

### 1.2 % hoàn thành (theo số issue) — *số thay thế*

Dùng khi độ phủ `Estimation days` < 90%. Ghi rõ trong báo cáo: *"tính theo số issue vì n/m issue
chưa có ước lượng"*. Không trộn hai cách trong cùng một bảng.

### 1.3 `Ready for QA` **không** tính là xong

DoD yêu cầu QA xác nhận với luồng nghiệp vụ chính. Hàng đợi `Ready for QA` dài là **tín hiệu
nghẽn QA**, phải nêu riêng một dòng trong báo cáo, không gộp vào phần đã hoàn thành.

---

## 2. Say/Do ratio (nói được – làm được) · mục tiêu ≥ 80%

```
Say/Do = số issue Done / số issue trong Sprint Commitment ban đầu
```

Nguồn chuẩn: field **`Sub-issues progress`** của issue `Sprint N — Commitment` → `report.sh commitment`.

- **Không có issue Commitment → không có Say/Do.** Viết đúng câu đó, đừng thay bằng % board.
- Issue bị **đổi chỗ (swap)** giữa sprint: giữ nguyên mẫu số ban đầu, và nêu riêng
  *"đã đổi chỗ n issue: rút #a, thêm #b (lý do)"* — đây là thông tin PM cần nhất khi xem Say/Do thấp.
- Issue **carry-over** sang sprint sau tính là chưa xong ở sprint này.

---

## 3. % việc phát sinh (ad-hoc) · mục tiêu ≤ 20%

```
% ad-hoc = Σ Estimation days (Lane = Ad-hoc) ÷ Σ Estimation days (toàn sprint)
```

Nguồn: `report.sh sprint`. **Điều kiện: độ phủ `Lane` ≥ 80%** — dưới ngưỡng thì chỉ công bố độ phủ,
không công bố %.

Vượt 20% nghĩa là buffer đã cạn → báo cáo phải nêu **việc nào đã bị rút ra để đổi chỗ**. Vượt liên
tục 2 sprint là dữ kiện để trao đổi lại với khách, nêu ở Retro.

---

## 4. Rủi ro trễ — cách xác định, không đoán

Một issue vào danh sách rủi ro khi thoả **ít nhất một** điều kiện đo được:

| Dấu hiệu | Lấy từ |
|---|---|
| `Deadline` < ngày kết thúc sprint mà `Status` chưa qua `Ready for QA` | `report.sh sprint` |
| Đứng im ≥ 5 ngày ở `In Progress`/`In Review` | `report.sh stale` |
| `Blocked` + `Waiting on = Malme` quá 3 ngày làm việc | `report.sh waiting` |
| Ngày công còn lại > số ngày làm việc còn lại của sprint × số người | tính tay từ `report.sh sprint` |

🔴 **Nêu rủi ro thì phải nêu phương án.** Đúng hai lựa chọn, để PM chọn:
`(a) bỏ/hoãn phạm vi nào` · `(b) lùi mốc bao nhiêu ngày`. Báo trễ không kèm lựa chọn là báo cáo dở.

---

## 5. SLA hai chiều

| Việc | Bên chịu | Hạn |
|---|---|---|
| Trả lời Clarification / Q&A | **Malme** | 3 ngày làm việc |
| Acknowledge Requirement mới | Sora | 2 ngày làm việc |
| Impact note cho Change Request | Sora | 2 ngày làm việc |
| Phản hồi phân loại [URGENT] | Sora | trong ngày |
| Confirm Commitment + cập nhật checklist nghiệm thu | **Malme** | trước buổi Demo nội bộ (T4 tuần 2) |

`report.sh waiting` quy đổi ngày lịch → ngày làm việc bằng công thức xấp xỉ
`bd = ⌊d/7⌋×5 + min(d mod 7, 5)` (không trừ ngày lễ). Luôn ghi "xấp xỉ".

**Quy tắc công bằng:** Malme quá hạn → deadline lùi đúng số ngày chờ, **không tính Sora trễ** —
nhưng vẫn phải hiện trong báo cáo kèm số ngày, vì đó là chi phí thật của việc chậm trả lời.

---

## 6. Ticket bị trả lại · PR chờ review · bug lọt production

Ba chỉ số này **script không tự tính đủ** — nêu rõ cách lấy khi đưa vào báo cáo Retro:

| Chỉ số | Cách lấy | Hạn chế |
|---|---|---|
| Ticket bị trả lại | Đếm issue từng vào `Changes Requested` hoặc quay lại `Blocked` **sau** Demo — đọc comment/timeline của issue Commitment | Project field không lưu lịch sử chuyển cột → đếm tay từ ghi chép Demo |
| PR chờ review | `gh pr list -R <repo> --state open --json number,createdAt,reviews` → thời gian từ lúc mở tới review đầu | Board không chứa PR — luôn đo ở repo |
| Bug lọt production | Issue `Type = Fix` (hoặc tiêu đề `[Bug]`) tạo **sau** khi issue gốc `Done` | Cần PoC gắn nhãn đúng; nếu không có, nói "chưa đo được" |

---

## 7. Milestone

```
% hoàn thành milestone = closed_issues ÷ (open_issues + closed_issues)
dự phóng số tuần còn lại = open_issues ÷ throughput (issue/tuần, 4 tuần gần nhất)
ngày dự phóng xong      = hôm nay + số tuần còn lại
```

Nguồn: `report.sh milestone` + `report.sh throughput 4 <repo>`.

**Bốn cảnh báo bắt buộc khi báo cáo milestone:**
1. Throughput là số **thô** (mọi loại issue, to nhỏ như nhau) → dự phóng có sai số lớn. Luôn viết
   "ước lượng thô". Nếu milestone có đủ `Estimation days` thì dự phóng theo ngày công chính xác hơn.
2. Issue **chưa gắn milestone** không nằm trong phép đếm → nêu số lượng đó ra.
3. Milestone quá hạn (`due_on` < hôm nay) mà còn issue mở → đây là tin phải đưa **lên đầu** báo cáo.
4. Milestone là mốc của **một repo**; một dự án nhiều repo thì cộng thủ công và nói rõ đã cộng gì.

---

## 8. Tổng quan danh mục (cho HoE)

`report.sh portfolio` cho mỗi `Project`: tổng issue · đang chạy · blocked · chờ Malme · backlog,
và **tải theo người** (số việc `In Progress`/`In Review`/`Changes Requested`).

Đọc bảng tải người: **không có trần WIP cứng**; việc cần làm là so với sprint trước và nêu ở Retro
khi một người gánh rõ ràng nhiều hơn phần còn lại.

---

## 9. Độ tin cậy — công thức kết luận

```
pe = độ phủ Estimation days của sprint
pl = độ phủ Lane của sprint

pe ≥ 90 và pl ≥ 90                      → 🟢 Cao
pe ≥ 60 và pl ≥ 60                      → 🟡 Trung bình (nêu độ phủ trong báo cáo)
còn lại, hoặc có drift chưa xác minh    → 🔴 Thấp (không công bố %, chỉ định tính)
```

Ngoài hai độ phủ, hạ một bậc tin cậy nếu có bất kỳ điều nào: có issue lệch PR↔Status chưa xác minh
(`report.sh drift`) · dự án chưa dùng issue · sprint không có Commitment.

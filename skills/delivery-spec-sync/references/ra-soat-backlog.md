# Rà soát backlog theo spec mới

Mục tiêu: sau đợt đối soát, **mỗi issue đang mở đều có một kết luận** — còn đúng, đã lỗi thời, phải
huỷ, hay đang chờ chốt. Không để issue nào "không ai biết còn đúng không".

---

## 1. Cách tìm issue bị chạm

**Chiều xuôi — từ thay đổi tìm issue:**

1. Bảng 「今回の変更まとめ」 của 変更通知 có sẵn cột **影響** → thường ghi thẳng `#211`, `#463`, `E09`…
2. `scripts/spec-sync.sh <dự án> refs v8.2` → gom mọi `#issue` + mã `FR/BR/CR/§` trong bản đó.
3. Với từng mã: `scripts/spec-sync.sh <dự án> issue FR-055` (tìm cả issue đã đóng — issue đóng mà
   spec đổi thì có thể phải **mở lại**).
4. Tra thêm bằng từ khoá nghiệp vụ (tên màn hình, tên bảng DB) khi mã không xuất hiện trong issue.

**Chiều ngược — từ issue tìm spec:**

```bash
scripts/spec-sync.sh 168 issues-open > /tmp/issues-open.txt
gh issue view <n> -R structuralengine/168-yahagi-panwall --json body -q .body | sed -n '/参考/,$p'
```

Issue của repo dev có mục **`## 参考 / References`** ghi sẵn `要件定義: FR-###` · `機能仕様: §#` ·
`WBS: T-###` và dòng chân trang ghi **version đã dựa vào** (vd *要件定義 v3.12／機能仕様 v2.14 準拠*).
So dòng version đó với bản ghim: **lệch nhiều version = ứng viên rổ A**.

---

## 2. Rubric xếp rổ

| Rổ | Điều kiện xếp vào | Bằng chứng phải trích trong báo cáo |
|---|---|---|
| **A — Outdate spec** | Mã FR/§ mà issue dựa vào **vẫn còn** nhưng nội dung đã sửa; hoặc version chân trang lệch ≥ 1 bản có sửa đúng mục đó | Số issue · mã FR/§ · version cũ → mới · 1 câu trích canon mới |
| **B — Phải huỷ** | Canon nói `廃止` / `実装しない` / `作らない` / `クローズ依頼` / `Phase 2 以降` đúng phạm vi issue | Số issue · § ra quyết định · ngày PM chốt · câu trích |
| **C — Phát sinh mới** | § mới mô tả việc phải làm mà **không** tìm được issue nào nhắc mã/nội dung đó | § · tóm tắt việc · tại sao không khớp issue nào |
| **D — Gỡ chặn** | `Q## クローズ` · `【要確定・着手不可】` → `確定＝着手可` | Số issue · mã Q · kết luận |
| **E — Không đổi** | Không rơi vào A–D | (chỉ cần đếm số lượng) |

**Vùng xám — xử lý thế nào:**

- Canon mơ hồ / hai chỗ mâu thuẫn → **không tự chọn**. Tạo `Clarification` (repo dev dùng nhãn
  `question`), gắn `Status = Blocked` + `Waiting on = Malme`, SLA Malme trả lời 3 ngày làm việc.
- Issue phủ nhiều mã, chỉ 1 mã bị rút → **rescope** (rổ A), không huỷ cả issue.
- Issue đã `Done`/đã merge mà spec đổi → **không mở lại issue cũ**; tạo Task mới link tới issue cũ
  ("thay đổi sau nghiệm thu"), để lịch sử demo giữ nguyên.
- Tính năng bị rút mà **code đã xây rồi** (ví dụ `#151` master 書類番号): ghi rõ trong báo cáo là
  **nợ kỹ thuật cần quyết định gỡ hay để lại**, kèm ước lượng — đây là việc của cổng thay đổi.

---

## 3. Hành động theo rổ

| Rổ | Ai làm | Trên board 201 | Việc kèm theo |
|---|---|---|---|
| A | PoC (dev sửa AC sau khi PoC duyệt) | giữ `Status`; cập nhật `Estimation days` nếu khối lượng đổi | comment "spec đã đổi" + sửa AC + đổi dòng version |
| B | **PoC** (dev không tự đóng) | `Status = Canceled` | comment lý do + link §; nếu đã có code → mở Task "gỡ/để lại" |
| C | PoC bóc `Task`; yêu cầu nghiệp vụ mới → **Malme** tạo `Requirement` | issue mới vào `Backlog`, chờ phiên triage T3/T6 | ước lượng 2 người; chưa đủ DoR thì `Blocked` |
| D | PoC | `Blocked → Todo`, xoá `Waiting on` | cập nhật AC theo kết luận đã chốt |
| E | — | — | ghi số lượng vào báo cáo |

Thao tác field chạy bằng skill `delivery-board`:
```bash
board.sh set 168-yahagi-panwall#211 Status "Canceled"
board.sh clear 168-yahagi-panwall#123 "Waiting on"
DRY_RUN=1 board.sh set …      # rà trước khi ghi hàng loạt
```

---

## 4. Mẫu comment (song ngữ — theo đúng văn phong repo dev)

### 4.1 Rổ A — spec đã đổi

```markdown
## 📝 Spec đã thay đổi / Specification updated

- **Nguồn / Source**: `変更通知 v8.2 §109`（PM 確定 2026-09-16）
- **Canon**: 要件 v3.48 ／ 仕様 v2.50 — bản ghim hiện tại: 要件 v3.40 ／ 仕様 v2.42
- **Thay đổi / What changed**: 権限が発生する操作は 6 つだけ（§51・§93 の 25 項目を上書き）
- **Ảnh hưởng tới issue này / Impact**: AC số 2 và 4 không còn đúng; bảng `case_permissions` đổi khoá thao tác

### Xử lý / Next
- [ ] Cập nhật AC theo §109 sau khi PR sync bản ghim được merge
- [ ] Ước lượng lại (hiện `Estimation days = 2`)

> ⚠️ **Issue vẫn giữ bản ghim 要件 v3.40 ／ 仕様 v2.42** cho tới khi PR sync merge.
> Chưa được implement theo canon mới. / Keep implementing against the pinned version until the sync PR lands.
```

### 4.2 Rổ B — huỷ issue

```markdown
## ❌ Huỷ theo quyết định của PM / Cancelled per PM decision

- **Nguồn / Source**: `変更通知 v8.2 §111`（PM 確定 2026-09-17）— 週間受注情報（FR-055）は Phase 1 で実装しない
- **Kết luận / Decision**: #211 và #212 không thực hiện trong Phase 1 (`#211／#212 は実装不要・クローズしてください`)
- **Không đổi / Unchanged**: 機能 47 件・税込金額・納期
- **Board**: `Status = Canceled`（không xoá issue — giữ vết）

Mọi thảo luận kỹ thuật ở đây vẫn giữ nguyên cho Phase 2. / Kept for Phase 2 reference.
```

### 4.3 Rổ D — gỡ chặn

```markdown
## ✅ Đã chốt — gỡ chặn / Unblocked

- **Nguồn / Source**: `変更通知 v8.2 §110`（Q47 クローズ・2026-09-17）
- **Kết luận / Decision**: 削除した物件の設計番号は再利用する。`lead_no` の一意制約は
  `WHERE deleted_at IS NULL` の部分ユニークインデックスに
- **Board**: `Blocked → Todo`, xoá `Waiting on`

AC đã cập nhật theo kết luận trên. / Acceptance criteria updated accordingly.
```

### 4.4 Impact note (khi thay đổi chạm sprint đang chạy)

```markdown
## ⚖️ Impact note — `変更通知 v8.2`

| Mục | Nội dung |
|---|---|
| Thay đổi | §109 権限モデル = 6 thao tác (đè lên 25 mục của §51/§93) |
| Issue bị chạm | #4xx (đang `In Progress`), #4yy (`Todo`, trong sprint) |
| Thêm công | ~2,5 ngày (viết lại `case_permissions` + test) |
| Lịch | Sprint 2 trễ 1,5 ngày nếu nhận vào sprint này |
| Đề xuất | **ĐỔI CHỖ**: rút #4zz (2 ngày) khỏi làn Sprint → sprint sau |

**Hai lựa chọn cho Malme chọn công khai:**
1. Nhận vào sprint này → rút #4zz ra, deadline #4zz lùi 1 sprint
2. Dời §109 sang sprint sau → sprint này giữ nguyên cam kết

Chờ PoC Malme xác nhận trên issue Commitment. / Awaiting confirmation on the Sprint Commitment issue.
```

> Thay đổi **> 3 ngày công** hoặc **chạm data model / kiến trúc** → không dừng ở Impact note mà viết
> **CR 1 trang** (đổi gì · vì sao · tốn bao nhiêu · lịch ảnh hưởng ra sao), Malme ký xác nhận rồi mới làm.

---

## 5. Checklist bổ sung cho đợt RÚT SCOPE

Tính năng bị cắt thường để lại rác ở 4 chỗ — rà đủ cả 4:

- [ ] **Backlog**: issue viết theo tính năng đã rút (rổ B) — kể cả issue đã xây xong (`#151`)
- [ ] **Audit log**: sự kiện không còn writer — giữ hàng trong enum (append-only), chỉ đổi ghi chú
- [ ] **CSV / báo cáo xuất**: cột mất dữ liệu — quy ước hiện hành: **giữ cột, xuất trống**
- [ ] **Ước lượng / WBS**: mục WBS tương ứng bỏ khỏi Estimation; **báo giá đã nộp thì không sửa**

# Đồng bộ wiki PMS + bản ghim repo dev

Wiki là **bản diễn giải tiếng Việt** để team đọc; canon vẫn là file trong PM repo / bản ghim.
Khi lệch, **file canon thắng** — wiki phải sửa theo, không bao giờ ngược lại.

---

## 1. Năm bước của một đợt đồng bộ wiki

```
① FETCH   — version + SHA canon mới (scripts/spec-sync.sh … status / changelog)
② DIFF    — entry mới hơn dòng cuối trong bảng §1 của trang 9.0
③ PHÂN LOẠI — spec / requirements / tài liệu họp(⛔ không lên changelog)
④ MAP     — tạo trang 9.x mới theo template §3 + patch các trang nội dung liên quan
⑤ GHI SỔ  — thêm dòng vào bảng §1 của 9.0, cập nhật §0 + §1.1, đổi dòng "Rà soát {ngày}"
```

Trang sổ: `9.0 — Sync Ledger`, ID `01a06548-2abf-7489-afcd-8ac6e08a3da4` (dự án YAHAGI 168).
Trang cha của changelog: `01a01904-fab6-7448-8afd-0d58a00d2fe4`.

---

## 2. Luật viết wiki (vi phạm là hỏng trang)

1. **`wiki_update_page` thay TOÀN BỘ content.** Luôn `wiki_get_page` lấy bản đầy đủ → dựng bản mới
   (cũ + phần patch) → mới `wiki_update_page`. Không bao giờ gửi content rút gọn.
2. **Trang quá lớn** (trang `2`, `3.2`, `SRS`): kết quả `wiki_get_page` vượt giới hạn đọc → ghi ra file
   rồi cắt bằng `python3` (`open(f).read()[A:B]`), ghép xong mới ghi lại.
3. **Giữ nguyên thân trang, chỉ chèn khối bổ sung** và đánh dấu 🔴 / ⚠️ tại chỗ sai. Không viết lại
   trang trừ khi canon đổi hẳn mô hình (ví dụ WF 5 phân loại → 3).
4. **Đổi tiêu đề trang khi tiêu đề có số version** — trang `2`, `3.2`, `3.3`, `4.3`, `4.4` từng mang
   version trong tiêu đề; patch thân mà quên tiêu đề thì người đọc vẫn tưởng trang cũ.
5. **Không bịa.** Chỗ chưa đối chiếu được ghi **⚠️ cần đối chiếu**, kèm câu hỏi để mở `Clarification`.
6. **Ghi kèm SHA canon** vào §0 của trang 9.0 và vào mô tả PR sync.
7. **Tag trang 9.x**: `changelog`, `req-vX.XX`, `spec-vY.YY` cho khớp cách đặt tag hiện có.
8. **Trang 9.x chỉ ghi đặc tả đổi gì và dev phải xây gì theo đặc tả.** Không đưa số issue GitHub, mục
   "Ảnh hưởng tới backlog", dòng "Dev issues", hay trạng thái code hiện tại ("code đang xuất 81 cột"):
   chúng đổi hằng ngày nên trên wiki nhanh cũ. Phân tích backlog (5 rổ, §3 của SKILL.md) để trong báo cáo
   đối soát ở chat hoặc comment trên issue. Được giữ: thuật ngữ đặc tả, §, mã FR/BR/Q, DDL.
   *(25/09/2026: người dùng bỏ phần gắn issue khỏi nháp 9.27; trang 9.26 từng phải sửa bảng backlog vì lý do này.)*

---

## 3. Template trang changelog `9.{N}`

````markdown
# 9.{N} — Requirements v{X} / Spec v{Y} ({DD/MM/YYYY})

| | |
|---|---|
| **Version** | requirements **v{X}** · spec **v{Y}** |
| **Ngày** | {DD/MM/YYYY} |
| **Trước / Sau** | ← 9.{N-1} (v…/v…) · 9.{N+1} → |
| **Không đổi** | 47 chức năng · ¥27.500.000 · hạn tháng 11 |
| **Trạng thái** | {canon PM repo / đã ghim vào repo dev `{sha}` / 変更通知 v… chưa gửi} |
| **Nguồn** | `docs/CHANGELOG.md` ({YYYY-MM-DD}) · `変更通知 v…` §… · canon SHA `{sha}` |

## ⚡ Tóm tắt thay đổi

> Loại: 🗃️ DB/DDL · 🔌 API · 🖥️ UI · 🧮 Logic/rule · 📄 CSV · 🐛 Bugfix · 📘 Doc
> Ưu tiên dev: 🔴 cao · 🟡 vừa · ⚪ thấp

| # | Loại | Thay đổi (1 dòng) | Mã | Impact dev | Ưu tiên |
|---|---|---|---|---|---|
| 1 | {icon} | {mô tả ngắn} | {FR/BR/§} | {dev phải xây gì theo đặc tả} | {🔴/🟡/⚪} |

---

## 📋 Chi tiết

### 1. {icon} {tiêu đề} ({mã})
- {nội dung; kèm khối ```sql``` nếu có DDL}

---

## 🔗 Liên quan
- **Trang wiki:** 4.x · 3.2 · 7.4 …
- **Tài liệu:** `変更通知 v…` (§…, {đã/chưa} gửi)

---
**Rà soát {DD/MM/YYYY}** — nguồn `docs/CHANGELOG.md` mục {…}. {ghi chú đợt}.
````

Ví dụ đã điền: trang `9.14`, `9.22`, `9.23`, `9.25` (các trang này còn mục backlog / số issue; bỏ đi khi chép, theo luật 8).

---

## 4. Trang nội dung phải patch theo loại thay đổi

| Canon đổi cái gì | Patch trang |
|---|---|
| Mã `FR/BR/CR` thêm · sửa · bãi bỏ | `2 — 要件一覧` |
| Màn hình / tab / nút | `3.2 — Đặc tả màn hình S1–S6` · `3.4 — UI設計・IA` |
| Workflow, phân loại WF | `3.3 — Engine workflow` |
| DDL, bảng, cột, ràng buộc | 🔴 `4.1 — ER + data dictionary` |
| Quy tắc đánh số / trạng thái | `4.2` |
| Quyền | `4.3` + `10.1` |
| Kết nối ngoài, di trú dữ liệu | `4.5` |
| Câu hỏi treo chốt/mở | `7.4 — Vấn đề chưa chốt` |
| Sự kiện audit | `10.2` |
| AC chi tiết | `SRS — PWPF Phase 1` ⏳ **tách đợt riêng** (238k ký tự · 355 AC) |

Sau khi patch xong, cập nhật bảng §1.1 của trang `9.0` (cột "Việc đã làm" + ✅/⏳).

---

## 5. PR cập nhật bản ghim trong repo dev

**Chỉ mở PR khi đang ở khe giữa 2 sprint**, hoặc đã qua cổng thay đổi và có quyết định ghi trên issue
Commitment.

Toàn bộ cơ chế — nhánh, chép file và đối chiếu mã băm, bảng version README, **rà trích dẫn** (phần
hay hỏng nhất), tài liệu dẫn xuất, kiểm tra, mô tả PR và checklist — nằm ở
**`pr-ghim-canon.md`**. Đọc file đó trước khi chạm vào `docs/requirements/source/`.

Nhắc lại: **không `git push`, không merge** khi người dùng chưa cho phép rõ ràng.

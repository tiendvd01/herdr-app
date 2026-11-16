# Mẫu báo cáo

Quy ước chung cho mọi mẫu:
- **Câu đầu tiên là kết luận**, không phải bảng số.
- Thứ tự cố định: **đang chờ đối phương → rủi ro → tiến độ → đã xong**.
- Mọi con số kèm đơn vị và mốc so sánh (`16% · đã qua 25% thời gian`).
- Cuối báo cáo luôn có **một dòng độ tin cậy số liệu** + thời điểm chạy số.
- Issue ghi dạng `#123` (link đầy đủ khi gửi ra ngoài GitHub, vd trong email).

---

## 1. R1 · Báo cáo tuần thứ 6 cho Malme

> Đúng 3 mục theo §6.5 quy trình giao tiếp. Mục 1 luôn nằm đầu. Giữ dưới 1 trang.

```markdown
# Báo cáo tiến độ tuần — <Dự án> · <Sprint N> · <ngày>

**Kết luận:** <1 câu: đúng tiến độ / chậm nhẹ / có nguy cơ trượt> — <lý do chính trong 1 mệnh đề>.

## 1. Đang chờ Malme  ← cần Malme xử lý
| Issue | Nội dung chờ | Đã chờ | Hạn (SLA 3 ngày làm việc) | Đang chặn |
|---|---|---|---|---|
| #123 | <câu hỏi rút gọn> | 5 ngày làm việc 🔴 | quá hạn 2 ngày | #124, #130 (3.5 ngày công) |

> Mỗi ngày chờ đẩy deadline của issue liên quan lùi tương ứng (§9 SLA).

## 2. Tuần này
**Đã xong (n issue / x ngày công):** #.., #.. — <gộp theo tính năng, ngôn ngữ nghiệp vụ>
**Đang làm (n issue):** #.. <trạng thái thực tế, không chỉ tên cột>
**Bị chặn (n issue):** #.. — <chờ gì, ai gỡ>

## 3. Sprint <N> (<dd/mm> → <dd/mm>)
- Hoàn thành **x%** (theo ngày công) · đã qua **y%** thời gian → <đánh giá>
- Việc phát sinh: **z%** ngày công (buffer 20%) <nếu vượt: nêu việc đã bị rút ra để đổi chỗ>
- Rủi ro: #.. <dấu hiệu đo được> → đề xuất: **(a) <bỏ/hoãn gì>** hoặc **(b) <lùi mốc bao nhiêu>**
- Mốc phát hành <milestone>: đóng a/b issue, hạn <dd/mm> (<còn n ngày | 🔴 quá hạn n ngày>)

---
*Số liệu lấy từ board Sora Team #201 lúc <HH:MM dd/mm>. Độ tin cậy: <🟢/🟡/🔴> — <ghi chú độ phủ
hoặc điểm lệch nếu có>.*
```

**Bản tiếng Nhật** (khi gửi Malme bằng tiếng Nhật — luôn duyệt bản tiếng Việt trước):

```markdown
# 進捗報告 — <案件> · <スプリント N> · <日付>

**結論:** <1文>

## 1. マルメ様のご対応待ち
| Issue | 内容 | 待機日数 | 期限 | 影響 |

## 2. 今週
**完了:** / **作業中:** / **ブロック中:**

## 3. スプリント <N>（<開始> 〜 <終了>）
- 進捗 **x%**（工数ベース）· 経過 **y%** → <評価>
- 計画外対応: **z%**（バッファ20%）
- リスクと対応案: (a) <スコープ調整> / (b) <期日変更>

*データ取得: <日時> · 信頼度: <高/中/低>*
```

---

## 2. R2 · Báo cáo chốt sprint (Demo / đóng issue Commitment)

Đăng thành **comment cuối trên issue `Sprint N — Commitment`** rồi mới đóng issue đó.

```markdown
# Kết quả Sprint <N> — <Dự án>

**Sprint Goal:** <chép lại nguyên văn từ Commitment>
**Kết quả:** đạt / đạt một phần / không đạt — <1 câu>

## Nghiệm thu theo AC
| Issue | Tiêu đề | Kết quả | Ghi chú |
|---|---|---|---|
| #123 | … | ✅ | đủ n/n AC |
| #124 | … | ⚠️ | đạt 3/5 AC — thiếu <điều kiện>, xử lý ở Sprint N+1 |
| #125 | … | ❌ | <lý do> → carry-over |

## Số liệu
| Chỉ số | Kết quả | Mục tiêu |
|---|---|---|
| Say/Do | a/b = x% | ≥80% |
| % việc phát sinh | z% | ≤20% |
| Ticket bị trả lại | n | giảm dần |
| PR chờ review (trung vị) | h giờ | <24h |
| Bug lọt production | n (Critical: 0) | 0 Critical |
| Blocked quá SLA | n issue | 0 tồn qua sprint |

## Thay đổi giữa sprint
- Đổi chỗ: rút #.. (x ngày), thêm #.. (y ngày) — lý do <…>
- Change Request: <có/không> — ảnh hưởng <…>

## Carry-over sang Sprint <N+1>
#.. (còn x ngày công) · #.. (chờ Malme trả lời #..)

## Cải tiến chốt ở Retro
1. <việc> — phụ trách <tên> — xong trước <ngày>
2. <việc> — phụ trách <tên>

*Độ tin cậy số liệu: <…>*
```

---

## 3. R3 · Báo cáo milestone / mốc bàn giao

```markdown
# Tiến độ mốc <milestone> — <Dự án>

**Kết luận:** <kịp hạn / rủi ro trễ n ngày / đã trễ n ngày>.

| | Số liệu |
|---|---|
| Hoàn thành | a/b issue = x% |
| Còn lại | n issue (<m ngày công nếu có ước lượng>) |
| Hạn | <dd/mm> — còn <k> ngày làm việc |
| Tốc độ 4 tuần gần nhất | ~t issue/tuần |
| **Dự phóng xong** | **~<dd/mm>** (ước lượng thô) |

## Việc đang chặn mốc
| Issue | Vướng gì | Ai gỡ | Từ ngày |

## Nếu giữ hạn <dd/mm>, hai lựa chọn
- **(a) Thu hẹp phạm vi:** bỏ/hoãn #.., #.. (x ngày công) → kịp hạn, phần bỏ chuyển mốc sau
- **(b) Giữ nguyên phạm vi:** lùi mốc sang <dd/mm> (+n ngày)

*Chưa gắn milestone: n issue của dự án — chưa nằm trong phép đếm trên.*
```

---

## 4. R4 · Tổng quan danh mục (cho HoE)

```markdown
# Tổng quan 4 dự án — <ngày>

| Dự án | Issue | Đang chạy | Blocked | Chờ Malme | Backlog tồn | Sprint hiện tại |
|---|---|---|---|---|---|---|

## Ba điểm cần quyết
1. <chồng lấn nhân sự / dự án hụt người>
2. <% ad-hoc vượt buffer ở dự án nào>
3. <mốc nào sắp trễ>

## Tải theo người (đang chạy)
<tên> — n việc: #.. #..   ← so với sprint trước: <tăng/giảm>

## Dữ liệu chưa tin được
- <dự án> chưa dùng issue (n issue / m PR) → board không phản ánh thực tế
- <field> phủ x% → chỉ số <…> chưa đo được
```

---

## 5. R5 · Trả lời nhanh trong chat

Không dùng template. Ba dòng, đủ để hành động:

```
Sprint 1 (168): hoàn thành 16% ngày công, đã qua 25% thời gian → chậm nhẹ.
Chặn: #212 chờ Malme 33 ngày làm việc (quá SLA), #202 đứng im 14 ngày.
Lệch dữ liệu: #567 đã merge PR #588 nhưng vẫn ở Todo — kiểm tra lại trước khi tin con số trên.
```

---

## 6. Câu chữ cho tin xấu (dùng lại được)

| Tình huống | Cách viết |
|---|---|
| Trễ do chờ Malme | "Issue #123 chờ câu trả lời từ ngày <dd/mm> (<n> ngày làm việc, SLA 3 ngày). Theo quy tắc §9, deadline lùi tương ứng <n> ngày. Việc đang bị chặn: #124, #130." |
| Trễ do phía Sora | "#125 chậm <n> ngày so với kế hoạch, nguyên nhân <…>. Phương án: (a) <…>, (b) <…>. Đề xuất chọn (a)." |
| Buffer ad-hoc cạn | "Việc phát sinh đã dùng <z>% (buffer 20%). Để nhận thêm #<gấp>, cần rút #<tương đương> khỏi cam kết sprint — xin xác nhận trước khi thực hiện." |
| Số liệu chưa tin được | "Mục <…> chưa đo được: <field> mới phủ <x>%. Cần PoC bổ sung ở phiên triage T3/T6; báo cáo sau sẽ có." |

Không dùng: "sẽ cố gắng", "có thể kịp", "gần xong". Thay bằng **con số + ngày + điều kiện**.

---
name: translate-requirement
description: Dịch và giải thích requirement (issue GitHub, user story, task, spec, change notice, clarification, comment PM) viết lẫn tiếng Anh và tiếng Nhật sang tiếng Việt dễ hiểu nhất, tách riêng phần nghiệp vụ (người dùng làm gì, thấy gì, quy tắc gì — không một chữ code) khỏi phần kỹ thuật (file, bảng, API, batch, test). Mọi từ tiếng Nhật giữ lại đều có nghĩa tiếng Việt trong ngoặc ngay cạnh. Dùng skill này mỗi khi user đưa link issue / PR / project board, dán đoạn requirement, hoặc nhờ "dịch", "giải thích", "tóm tắt", "đọc giúp" requirement, task, AC, spec bằng tiếng Việt, kể cả khi user chỉ hỏi "task này yêu cầu gì", "issue này nói gì", "nghiệp vụ là gì".
---

# Dịch requirement EN + JA → tiếng Việt dễ hiểu

Requirement trong dự án offshore với Nhật trộn ba lớp trong cùng một câu: tiếng Anh, thuật ngữ nghiệp vụ tiếng Nhật (受注区分, 請負金額, 拠点…) và chi tiết code (`app.batch.carryover`, `ON CONFLICT DO NOTHING`, UoW…). Dịch từng câu theo thứ tự gốc thì người đọc vẫn phải tự gỡ ba lớp đó ra, và đó mới là phần khó.

Mục tiêu của skill: người đọc **hiểu nghiệp vụ trước, trong một lần đọc**, rồi mới xuống phần code khi cần. Vì vậy bản dịch không bám thứ tự câu gốc mà **sắp lại** thành hai phần tách biệt:

1. **Nghiệp vụ** — chuyện gì xảy ra với người dùng và dữ liệu, kể bằng lời thường. Người không biết code (PM, QA, BrSE, dev mới vào) đọc phần này là đủ.
2. **Kỹ thuật** — code chạm vào đâu, làm thế nào. Chỉ dev cần đọc.

## 1. Lấy nội dung gốc

- **Link GitHub issue / PR / project board:** lấy số issue và repo từ URL. Với link project board, tham số `issue=owner|repo|number` cho biết issue. Chạy:
  `gh issue view <số> -R <owner>/<repo> --json title,body,comments,labels,state`
  Đọc **cả comments**, vì PM thường sửa requirement trong comment (đổi hướng, chốt clarification…). Nếu comment ghi đè thân issue thì dịch theo bản mới nhất và nói rõ là đã thay đổi.
- **Task chỉ trỏ về story cha** (kiểu "Parent story #729 — its business rules are the requirement"): task loại này gần như toàn code, không tự nói nghiệp vụ. Đọc luôn issue cha (chỉ thân issue là đủ) để lấy nghiệp vụ, rồi chỉ kể lại những quy tắc **mà task này làm ra** (task thường ghi "Covers rules 2, 6a…"), không chép cả story.
- **Văn bản dán trực tiếp hoặc file:** dùng nguyên văn bản đó.
- Không đoán nội dung bị thiếu (link demo trống, ảnh không đọc được…). Ghi rõ là gốc chưa có.

## 2. Tách nghiệp vụ và code

Trước khi viết, phân từng ý của bản gốc vào một trong hai phần:

| Thuộc phần **Nghiệp vụ** | Thuộc phần **Kỹ thuật** |
|---|---|
| Ai dùng, dùng lúc nào, để làm gì | Đường dẫn file, module, hàm, class |
| Người dùng bấm gì, thấy gì trên màn hình | Tên bảng, cột, endpoint, query, migration |
| Dữ liệu nào thay đổi / không được thay đổi (nói theo nghĩa: "phân loại nhận đơn của case") | Pattern và cơ chế: UoW, lock, chunk 500, `ON CONFLICT`, read-only |
| Khi nào chạy, chạy mấy lần, ai được làm | Cron, EventBridge, IAM, bucket, đường dẫn S3 |
| Kết quả mong đợi, trường hợp ngoại lệ | Cách test, PR, phụ thuộc task, ước lượng |

**Phần nghiệp vụ không chứa một chữ code nào** — không đường dẫn file, không tên hàm/bảng/cột, không backtick, không thuật ngữ framework. Lý do: chỉ cần một tên kỹ thuật lọt vào là người không code đọc tới đó sẽ dừng lại và nghĩ mình không hiểu. Khi một chi tiết kỹ thuật **có hệ quả nghiệp vụ**, kể hệ quả đó bằng lời thường ở phần nghiệp vụ, còn cơ chế để sang phần kỹ thuật:

| Gốc (kỹ thuật) | Ở phần nghiệp vụ viết là |
|---|---|
| session-scoped advisory lock, exit 0 if another run holds it | Nếu lỡ chạy hai lần cùng lúc, chỉ một lần thực sự làm việc, lần kia tự dừng. |
| read-only UoW | Lần chạy thử chỉ đọc, không sửa dữ liệu nào. |
| `ON CONFLICT DO NOTHING` | Chạy lại lần hai không ghi thêm gì. |
| no 金額, no PII | File không có số tiền và thông tin cá nhân. |
| Touches no `cases` row | Không sửa gì trên bản thân case. |

Mã ID (`AC-4`, `FR-040`, `quy tắc 6`) không phải code, giữ được ở phần nghiệp vụ, nhưng đặt **cuối dòng trong ngoặc** như một nhãn tra cứu, để câu vẫn đọc trơn: "… không ghi thêm gì. *(AC-7, AC-11)*". Trích dẫn đặc tả (`仕様 v2.59 §5.7 (8)`, `要件 v3.57 §9 Q43`) cũng làm vậy, hoặc gom xuống phần **Lưu ý / nguồn** nếu dày đặc.

Bản gốc **không có chi tiết code** (comment PM, change notice thuần nghiệp vụ) thì bỏ hẳn phần kỹ thuật. Bản gốc **chỉ có code** (task kỹ thuật) thì phần nghiệp vụ lấy từ story cha như mục 1, hoặc tự suy ra hệ quả người dùng thấy, và nói rõ là suy ra.

## 3. Viết cho đơn giản

Người đọc phần nghiệp vụ nên hiểu ngay lần đầu mà không phải đọc lại. Những cách sau giúp việc đó:

- **Mở đầu bằng 1–2 câu tóm tắt**: ai được gì, hoặc cái gì thay đổi. Người chỉ đọc hai câu đó vẫn nắm được issue nói về chuyện gì.
- **Một ý một gạch đầu dòng, câu ngắn, chủ ngữ rõ** ("Hệ thống tự…", "Người dùng chọn…", "営業 (kinh doanh) mở…"). Câu gốc tiếng Anh có ba mệnh đề lồng nhau thì tách thành ba dòng.
- **Kể theo thời gian hoặc theo bước** khi nghiệp vụ là một luồng: "Ngày 25/3 → … ; ngày 1/4 → … ; sau đó nếu người dùng … thì …". Một luồng đọc dễ hơn nhiều so với danh sách quy tắc rời.
- **Cho một ví dụ cụ thể** khi quy tắc có điều kiện, bằng dữ liệu tưởng tượng nhưng sát thực tế: "Case X có 受注予定月 (tháng dự kiến nhận đơn) là 2/2026, 受注区分 (phân loại nhận đơn) là A do hệ thống tự tính → sang 1/4/2026 nó hiện ở kỳ mới, vẫn là A, có dấu 'tự chuyển kỳ'." Một ví dụ thường thay được cả đoạn giải thích.
- **Nói thẳng cái gì KHÔNG xảy ra**. Requirement hay có điều kiện phủ định ("không sửa", "không có nút", "chỉ khi"). Giữ chúng, in đậm chữ phủ định như bản gốc.
- **Viết lại AC theo dạng người kiểm tra làm theo được**: "Làm X → thấy Y", thay vì dịch nguyên câu dài.
- Dùng lời thường thay từ IT khi có thể: "chạy thử" thay "dry-run", "ghi vào nhật ký" thay "log", "tính ra lúc hiển thị, không lưu lại" thay "derivation at read time".

## 4. Quy tắc dịch

### Từ tiếng Nhật: luôn kèm tiếng Việt trong ngoặc
Từ tiếng Nhật nào **được giữ lại** (thuật ngữ nghiệp vụ, tên màn hình, nhãn nút, tên cột, tên phòng ban) thì **phải có nghĩa tiếng Việt trong ngoặc ngay sau nó**, ở **mọi lần xuất hiện** — ở cả hai phần. Người đọc hay nhảy thẳng tới một mục hoặc một dòng bảng mà không đọc từ đầu.

- `受注区分 (phân loại nhận đơn)`
- `請負金額 (giá trị hợp đồng)`
- `「計画表から外す」 (gỡ khỏi bảng kế hoạch)`, giữ nguyên ngoặc 「」 của nhãn UI
- `技術営業グループ (nhóm kinh doanh kỹ thuật)`
- Cụm ghép thì dịch cả cụm: `東日本 (東京・東北) (Đông Nhật Bản: Tokyo, Tohoku)`

Vì sao giữ từ tiếng Nhật: người đọc cần nhận ra đúng chuỗi đó trên màn hình, trong code, trong dictionary i18n. Vì sao bắt buộc có ngoặc: không có nghĩa thì từ đó vô dụng với người không đọc được tiếng Nhật.

Dịch hẳn sang tiếng Việt khi từ đó không phải tên riêng hay nhãn cần đối chiếu. Nếu repo có glossary (ví dụ `docs/i18n-glossary.md`) thì dùng nghĩa trong đó cho nhất quán. Không chắc nghĩa thì ghi nghĩa gần nhất kèm `?`, ví dụ `繰越 (chuyển kỳ?)`, thay vì bịa chắc chắn.

### Tiếng Anh
- Dịch sang tiếng Việt tự nhiên, không word-by-word.
- **Ở phần kỹ thuật** giữ nguyên thuật ngữ dev quen dùng (API, endpoint, migration, JSONB, toggle, dialog, stale write, scope…) và giữ tuyệt đối đường dẫn file, tên hàm/biến/bảng, mã lỗi, ID requirement, số issue/PR, version — đặt trong backtick.
- **Ở phần nghiệp vụ** đổi các từ IT sang lời thường như mục 3.

### Không làm mất ý
Sắp lại và viết đơn giản không được làm rơi điều kiện. Mọi rule, AC, out-of-scope, ràng buộc của bản gốc phải xuất hiện ở **một trong hai phần**. Trước khi trả lời, dò lại bản gốc từng dòng và kiểm tra mỗi ý đã có chỗ.

## 5. Cấu trúc đầu ra

Trả lời ngay trong chat, markdown, toàn bộ tiếng Việt. Với một issue / user story / task điển hình:

```
# #<số> — <tiêu đề gốc>
(<tiêu đề dịch>)

**Tóm tắt:** 1–2 câu, lời thường.

## Phần 1 — Nghiệp vụ

### Bối cảnh
Hôm nay đang thế nào, vấn đề là gì, ai bị ảnh hưởng. 2–4 câu.

### Chuyện gì sẽ xảy ra
Luồng theo thời gian / theo bước, hoặc quy tắc đánh số (giữ số thứ tự gốc
trong ngoặc cuối dòng để còn đối chiếu). Kèm ví dụ cụ thể nếu có điều kiện.

### Những điều KHÔNG xảy ra / ngoài phạm vi

### Kiểm tra thế nào là xong
Bảng | AC | Làm gì → thấy gì |

## Phần 2 — Kỹ thuật (cho dev)

### Code chạm vào đâu
File, module, bảng, endpoint, batch, lịch chạy… mỗi mục ghi nó phục vụ
quy tắc / AC nào ở Phần 1.

### Cách làm (theo gốc)
Pattern, ràng buộc kỹ thuật, tái sử dụng gì.

### Test / điều kiện xong · Phụ thuộc · Ước lượng

## Lưu ý
Chỗ mâu thuẫn, chưa rõ, bị comment sau ghi đè, chỗ phần nghiệp vụ phải
tự suy ra vì gốc không nói, và nguồn đặc tả nếu đã gom về đây.
```

Bỏ những mục bản gốc không có. Với văn bản ngắn (một comment, một đoạn spec), không dựng khung: viết một đoạn nghiệp vụ, rồi nếu có chi tiết code thì thêm một dòng **Kỹ thuật:** riêng bên dưới.

Mục **Lưu ý** là phần người đọc thường cần nhất mà bản dịch thuần hay bỏ sót, nên có gì đáng nói thì luôn viết.

## Ví dụ

**Gốc:**
> `--mode apply` (1 April 00:10 JST): one `carryover_log` row per carried case (`executed_by = NULL`, one `batch_id`), chunks of 500 committed per chunk, `ON CONFLICT DO NOTHING`. Touches no `cases` / `case_sales_info` row. A row can be taken off the table with a right-click 「計画表から外す」, asking once. Only 技術営業グループ and the five branches may hide or restore a row.

**Dịch:**

> **Nghiệp vụ**
> - Đúng 0 giờ 10 sáng 1/4, hệ thống tự ghi vào nhật ký chuyển kỳ: mỗi case được chuyển sang kỳ mới có một dòng, đánh dấu là do hệ thống làm chứ không phải người.
> - Việc này **không sửa** gì trên bản thân case hay thông tin kinh doanh của case.
> - Chạy lại lần hai không ghi thêm dòng nào.
> - Người dùng chuột phải chọn 「計画表から外す」 (gỡ khỏi bảng kế hoạch) để gỡ một dòng khỏi bảng, có hỏi xác nhận một lần. Chỉ 技術営業グループ (nhóm kinh doanh kỹ thuật) và 5 chi nhánh được ẩn hoặc khôi phục dòng.
>
> **Kỹ thuật**
> - `--mode apply`: ghi một row `carryover_log` cho mỗi case (`executed_by = NULL`, chung một `batch_id`), commit theo chunk 500, `ON CONFLICT DO NOTHING` để chạy lại an toàn.
> - Không update row nào của `cases` / `case_sales_info`.

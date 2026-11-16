---
name: onboard-domain
description: "Dựng (hoặc cập nhật) bộ tài liệu nghiệp vụ + thiết kế cấp dự án từ code thật vào vault Obsidian SoraVaults/<dự án>/design/: README tổng quan kiến trúc, use case diagram + mô tả use case, activity diagram, sequence diagram, ERD — tất cả bằng Mermaid, đối chiếu từng khẳng định với code. Dùng khi người dùng gõ /onboard-domain, nói 'onboard dự án', 'dựng tài liệu domain', 'vẽ use case / activity / sequence / ERD cho project', 'tài liệu cho người mới', 'cập nhật lại design theo code mới', ở bất kỳ repo nào. Không dùng cho sơ đồ của một issue lẻ (đó là artifact trong issue <n>/) hay để review PR."
---

# Onboard domain — tài liệu thiết kế từ code

Mục tiêu: người mới (hoặc agent) đọc 5 file là nắm được **hệ thống làm gì, ai dùng, dữ liệu chảy thế nào, lưu ở đâu** — và tin được, vì mọi thứ đã đối chiếu với code ở một commit ghi rõ.

## 0. Nguyên tắc cứng

- **Code là nguồn sự thật.** Docstring, `docs/`, README chỉ là gợi ý; khẳng định nào đưa vào tài liệu phải đã đọc code trong lượt này. Tài liệu thiết kế cũ lệch code thì ghi vào mục "Lệch so với thiết kế", không sửa code.
- **Ghi commit đối chiếu** ở đầu mỗi file: `develop @ <sha7> (YYYY-MM-DD)`. `git fetch` trước; local đang sau thì xem `git diff --stat HEAD origin/<nhánh>` có chạm phần mình mô tả không, chạm thì đọc bằng `git show origin/<nhánh>:<path>`.
- **Từ tiếng Nhật** (kể cả trong nhãn Mermaid, bảng, tiêu đề) luôn có nghĩa tiếng Việt trong ngoặc ngay sau, **mọi lần xuất hiện**. Để sơ đồ gọn, ưu tiên viết nhãn bằng tiếng Việt; chỉ giữ từ Nhật khi đó là nhãn nút / thuật ngữ người dùng thấy trên màn hình.
- **Viết tiếng Việt**, tên bảng / cột / API / file giữ nguyên trong backtick. Ngắn, dạng bảng và gạch đầu dòng.
- **Chỉ ghi vào vault**, không ghi vào repo dev, không commit.

## 1. Vị trí

```bash
D=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh design)   # <vault>/<dự án>/design
ls "$D"
```

- Thư mục rỗng → **chế độ tạo mới** (mục 2–4).
- Đã có file → **chế độ cập nhật** (mục 5). Không ghi đè mù: đọc file cũ trước.

## 2. Điều tra (theo thứ tự)

Dùng CodeGraph nếu repo có `.codegraph/`, không thì `rg`. Repo lớn có thể giao 1–2 agent `Explore` song song cho phần dò file, nhưng **tự đọc lại** các chỗ sẽ khẳng định.

1. **Tổng quan**: `README.md`, `CLAUDE.md` / `AGENTS.md`, `docs/` (kiến trúc, auth, DB/S3, feature). Rút ra: hệ thống làm gì, stack, các thành phần ngoài (IdP, LLM, storage, queue…).
2. **Mô hình dữ liệu**: file model ORM / schema / migration. Ghi mọi bảng, PK/FK/UK, CHECK, cột JSON, enum. Đánh dấu bảng / cột di sản.
3. **Toàn bộ endpoint**: `rg -n "@(router|app)\.(get|post|put|patch|delete)\("` (FastAPI) hoặc tương đương (Express routes, Spring `@*Mapping`, Rails routes…). Ghi prefix khi mount, dependency auth chung.
4. **Frontend → API**: liệt kê route màn hình (router), và các API FE thật sự gọi (`rg` các chuỗi path trong `src/`, bỏ file test). **Endpoint không có ai gọi** → ghi là "còn mount nhưng FE không dùng".
5. **Luồng nghiệp vụ**: với mỗi endpoint chính, đọc handler → service/persist → repository: ghi lại bảng nào được ghi, khoá JSON nào, file nào lên storage, audit event nào, lỗi / mã HTTP nào, khoá / hàng đợi / timeout. Hook FE điều phối nhiều API (ví dụ "phân tích" gọi tuần tự 3 API) là nguồn cho activity diagram.
6. **Actor ngoài màn hình**: script CLI (`scripts/`, `manage.py`, `bin/`), seed, cron / batch, webhook.
7. **Soát giả định**: trước khi viết, kiểm riêng các điều "nghe hợp lý" dễ sai — cột có thật được ghi không (`rg` tên cột ngoài file model), validation lúc tạo khác lúc sửa, nhãn nút lấy từ file i18n chứ không đoán, tham số query thật của API danh sách.

## 3. Viết 5 file

| File | Bắt buộc có |
|---|---|
| `README.md` | Commit đối chiếu; mục lục `[[01-use-case]]`…; "bức tranh một dòng"; sơ đồ kiến trúc (flowchart); bảng lớp ↔ thư mục code; **"Điểm cần lưu ý khi đọc code"** (thuật ngữ trùng nghĩa như `sid` = id bảng nào, API / bảng di sản, quy tắc nghiệp vụ xuyên suốt, chỗ dùng LLM) |
| `01-use-case.md` | Bảng actor; use case diagram; **ma trận UC ↔ màn hình ↔ API ↔ code**; mô tả từng UC: actor, tiền điều kiện, đầu vào, luồng chính, luồng phụ / ngoại lệ (kèm mã HTTP), hậu điều kiện (bảng / file / audit được ghi), mục đích nghiệp vụ nếu không hiển nhiên |
| `02-activity.md` | Một activity cho luồng chính end-to-end + một cho mỗi luồng phức tạp (có nhánh, vòng lặp, khoá, timeout, thuật toán). Ghi "Nguồn:" các file đã đọc trên mỗi sơ đồ |
| `03-sequence.md` | Bảng ký hiệu participant ↔ thành phần thật; một sequence cho mỗi API / nhóm API chính, có `alt` / `opt` cho nhánh lỗi, ghi đúng bảng + khoá storage được ghi |
| `04-erd.md` | `erDiagram` đủ bảng + cột; bảng nhóm bảng (ai ghi, ghi chú); enum dùng trong code (kèm hằng số); khoá JSON trong cột JSON; bố cục file trên storage; **lệch so với tài liệu thiết kế DB** |

Mẫu đã làm (tham khảo cấu trúc, độ chi tiết): `~/Documents/SoraTech/SoraVaults/167-yahagi-sekisan/design/`.

### Mermaid — các bẫy đã gặp

- Use case diagram: Mermaid không có kiểu riêng → `flowchart LR`, actor `U(["👤 ..."])`, use case `UC01(["UC01 ..."])` trong `subgraph`, quan hệ `-. "«include»" .->`. Ghi một dòng giải thích ký hiệu dưới sơ đồ.
- **Dấu `;` trong message của `sequenceDiagram` làm vỡ parse** → dùng dấu phẩy.
- Nhãn flowchart có `( ) [ ] { } | < >` → bọc trong `"..."`; xuống dòng bằng `<br/>`.
- Trong **bảng Markdown**, dấu `|` trong ô (kể cả trong backtick) làm vỡ bảng → viết "hoặc".
- `erDiagram`: key chỉ được `PK`, `FK`, `UK`; ghi chú cột trong `"..."`; kiểu cột là một từ (`timestamptz`, `json`…).

## 4. Kiểm và báo

```bash
bash ~/.config/herdr-app/skills/onboard-domain/scripts/check-mermaid.sh "$D"
```

Mọi khối phải `OK`; `FAIL` thì sửa và chạy lại. Sau đó rà lại từng từ tiếng Nhật đã có nghĩa tiếng Việt chưa.

Báo cho người dùng: đường dẫn thư mục, bảng 5 file + nội dung, số sơ đồ đã kiểm, và **3–5 phát hiện đáng chú ý khi đối chiếu code** (lệch thiết kế, API / bảng di sản, chỗ dễ hiểu nhầm). Thêm (hoặc cập nhật) memory dự án trỏ tới thư mục `design/`.

## 5. Chế độ cập nhật

1. Đọc commit đối chiếu cũ trong `README.md`.
2. `git fetch` rồi `git log --oneline <sha cũ>..origin/<nhánh>` và `git diff --stat <sha cũ> origin/<nhánh>` — lọc file liên quan: model / migration, route, service, hook FE, router FE, script.
3. Với mỗi thay đổi, xác định file tài liệu bị ảnh hưởng (bảng / cột → 04; endpoint / luồng → 01, 02, 03; màn hình → 01). Không có gì liên quan → báo "không cần cập nhật" kèm commit đã kiểm, đổi commit đối chiếu.
4. Sửa đúng chỗ bằng Edit (không viết lại cả file), đổi commit đối chiếu ở mọi file đã sửa, chạy lại mục 4.
5. Báo danh sách thay đổi: file nào, mục nào, vì commit / PR nào.

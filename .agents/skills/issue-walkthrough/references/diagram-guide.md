# Sơ đồ

## Chọn kiểu
- **Activity** (`flowchart TD`): người đọc hỏi "trường hợp nào đi nhánh nào?" — luật, rẽ nhánh, trạng thái, bước batch.
- **Sequence** (`sequenceDiagram`): "ai gọi ai, lúc nào?" — FE ↔ API ↔ DB / queue / API ngoài. Infra thường là sequence.

## Activity
- `S(["Bắt đầu"])` / `E(["Kết thúc"])`, quyết định `{...}` có nhãn trên mũi tên.
- Mới / đổi: `classDef new fill:#e8f5e9,stroke:#2e7d32`, `classDef changed fill:#fff3e0,stroke:#ef6c00` + một dòng chú thích màu.

## Sequence
- `participant` alias ngắn, nhãn là thành phần thật.
- `alt` / `else` / `opt` cho nhánh, `loop` cho lặp; phần mới bọc `rect rgb(232,245,233)`.
- Ghi đúng bảng / topic / key được ghi, không "lưu DB".
- Sơ đồ flow cũ ở phần 2: gắn số trạm vào message (`API->>SVC: ③ create_order()`), chỉ các trạm chính.

## Bẫy Mermaid
- `;` trong message sequence → dùng dấu phẩy.
- Nhãn flowchart có `( ) [ ] { } | < > :` → bọc `"..."`, xuống dòng `<br/>`.
- `end` làm id node → đặt id khác.
- `|` trong ô bảng Markdown → viết "hoặc".
- Nhãn ngắn; tiếng Nhật chỉ khi là chữ trên màn hình, kèm nghĩa.

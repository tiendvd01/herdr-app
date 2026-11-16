---
name: find-mockup-repo
description: Tìm repo/thư mục mockup, UI, spec của một dự án SoraTech trong ~/Documents/SoraTech/mockup-ui theo mã dự án (số đứng đầu tên dự án, ví dụ "168-yahagi-panwall" → mã 168). Dùng mỗi khi người dùng nhắc mã dự án kèm mockup / mockup-ui / UI / màn hình / 07-UI設計 / 仕様書 / spec, hỏi "mockup dự án 168 ở đâu", "mở repo mockup của 147", hoặc cần đối chiếu UI/mockup của một dự án khi làm issue, PR, spec-sync — kể cả khi họ chỉ đưa tên dự án mà không nói đường dẫn.
---

# Tìm repo mockup theo mã dự án

Mọi repo mockup nằm phẳng trong `~/Documents/SoraTech/mockup-ui/`, mỗi dự án một thư mục tên dạng `<mã>-<tên-dự-án>`
(ví dụ `168-yahagi-pan-wall-dx`). Tên người dùng gõ có thể lệch tên thật (`panwall` vs `pan-wall-dx`), nên **chỉ tìm theo mã số**, không khớp theo tên.

## Cách tìm

1. Rút mã dự án: phần số đầu tiên trước dấu `-` (`168-yahagi-panwall` → `168`). Nếu người dùng chỉ đưa số thì dùng luôn.
2. Liệt kê thư mục chứa mã đó (dùng `rg`/`ls`, không dùng `grep`):

   ```bash
   ls -1 ~/Documents/SoraTech/mockup-ui | rg '168'
   ```

   Ưu tiên khớp ở đầu tên (`^168-`) trước; nếu không ra mới nới sang "chứa 168" để bắt trường hợp tên có tiền tố khác. Khớp lỏng dễ nhận nhầm thư mục khác (vd `1680-...`, `x-168-...`), nên kiểm lại tên đầy đủ trước khi kết luận.
3. Xử lý kết quả:
   - **1 thư mục**: dùng nó, báo đường dẫn tuyệt đối đầy đủ.
   - **Nhiều thư mục**: liệt kê hết, hỏi người dùng chọn cái nào; đừng tự đoán.
   - **Không có**: nói rõ không thấy thư mục nào chứa mã đó, liệt kê vài thư mục hiện có để người dùng đối chiếu (có thể repo chưa clone: remote dạng `git@github-soratech:structuralengine/<tên>.git`, đề xuất clone chứ đừng tự clone).
4. Sau khi tìm ra, nếu cần xem nội dung, ghi nhận cấu trúc thường gặp (dự án 168): `01-ヒアリング`, `02-要件定義`, `05-仕様書`, `07-UI設計` (mockup/UI nằm đây), `08-受領資料`, `10-成果品`. Chỉ đọc đúng phần liên quan, vì repo có nhiều tài liệu tiếng Nhật và dung lượng lớn.

## Lưu ý

- Chỉ đọc, không sửa/commit trong repo mockup trừ khi người dùng yêu cầu rõ. Đây là repo dùng chung, thay đổi sẽ lan sang cả team.
- Repo có thể cũ so với remote; nếu độ mới quan trọng (vd đối soát spec), nhắc người dùng `git pull` hoặc hỏi trước khi chạy.

## Ví dụ

Input: "tìm mockup của 168-yahagi-panwall"
→ mã `168` → `ls ~/Documents/SoraTech/mockup-ui | rg '168'` → `168-yahagi-pan-wall-dx`
→ Trả lời: `/Users/tiendvd/Documents/SoraTech/mockup-ui/168-yahagi-pan-wall-dx` (UI ở `07-UI設計`).

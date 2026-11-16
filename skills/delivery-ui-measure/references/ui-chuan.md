# Chuẩn đo UI

## Điều kiện đo (giữ cố định, ghi vào báo cáo)

- Chrome headless (`--headless=new`), device scale 1, không mobile emulation, `Accept-Language` + `Emulation.setLocaleOverride` = `ja-JP` (hoặc `en-US` cho AC bản en).
- Cùng viewport hai bên; bảy viewport chuẩn của dự án 168: 1920×1080, 1600×900, 1440×900, 1280×800, 1024×768, 768×1024, 390×844.
- Mỗi (viewport, state) tải lại trang để state trước không rò sang state sau.
- Chờ `ready` rồi mới đo; mỗi step có 250ms settle.

## Đọc kết quả

- Số có đơn vị px so với dung sai 0,5px (làm tròn nửa pixel của layout); chuỗi (`boxShadow`, `display`…) so bằng nhau.
- `height` header = 66.75 ở demo: lấy nguyên số lẻ, đừng làm tròn khi viết AC.
- `table.width` demo đo 1302 trong khi min-width khai 1300: 2px là border của bảng. So demo với app **cùng phương pháp đo**, đừng so với con số khai trong CSS.
- `clipped: true` = `scrollWidth > clientWidth` hoặc `scrollHeight > clientHeight`; phần tử cố ý `overflow: hidden; text-overflow: ellipsis` (ô bảng cố định) cũng báo true — đọc cùng `text`.

## Bẫy hay gặp

| Bẫy | Cách tránh |
|---|---|
| Đo repo demo ở commit khác commit issue ghi | `git log -1` trước khi đo; ghi sha vào báo cáo |
| App chưa có hàng dữ liệu tương ứng (hàng đầu là hàng 材販 (bán vật liệu, không thi công) nên không có select) | seed một dòng cùng loại với hàng demo; hoặc đặt selector chọn đúng loại hàng |
| Selector khớp nhầm phần tử khác (nút trong cùng ô) | dùng `limit: 1` + `selector` theo bên, xem `text` trong JSON |
| Màu lệch vì token toàn app (#993) | `--ignore-colors`, nói rõ trong báo cáo |
| Font chưa tải xong lúc đo | tăng `wait` ở step cuối, đo lại lần hai thấy số khác ⇒ có race |
| Cookie phiên hết hạn ⇒ trang đăng nhập | `ready` sẽ timeout; lấy cookie mới |

## Báo cáo đính PR (DoD kiểu #998)

`report.md` của `diff.mjs` + ảnh trong `--shots` (header, chip, ô edit, hai chế độ, các viewport). Kèm một dòng: sha demo · sha app · ngày · locale.

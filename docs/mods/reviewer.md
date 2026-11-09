# Changes / Reviewer (mod `reviewer`)

Dialog "Changes" (mở bằng nút Changes ở thanh tab hoặc `cmd-shift-g`, bấm lần nữa để đóng, hoặc `Esc`), dùng để review diff như một pull request rồi gửi comment cho agent của space. Là clone của mod `changes` có sẵn (0.1.8), do Vytas Gavelis chỉnh (MIT); bản gốc Apache 2.0. Bản đầu file ghi rõ nguồn.

## Làm gì

- Hiển thị diff của repo ở thư mục của terminal đang focus (`docs/space-folder.md`), có tô màu cú pháp (`highlight.js`, bảng màu `palette.js`).
- **Section Changes**: phần diff nằm trong một section riêng bên dưới danh sách file, kéo thanh chia để đổi chiều cao (`v_resizable`, kích thước do cửa sổ giữ). Nút chevron ở tiêu đề section thu gọn / mở (thu gọn thì chỉ còn thanh tiêu đề, danh sách file chiếm hết chỗ). Dòng dài luôn xuống dòng (không còn nút Wrap); nút Split nằm ở tiêu đề section. Trạng thái thu gọn lưu cùng Split/Tree.
- **List / Tree**: chip `Tree` ở header bật danh sách file dạng cây thư mục (bấm dòng thư mục để thu gọn / mở), tắt thì về danh sách phẳng. Lựa chọn lưu trong `localStorage` key `view` cùng Split.
- **Phạm vi review** (menu ở header, phím `reviewer.scope` đổi vòng): `work` (thay đổi chưa commit), `last` (commit cuối + thay đổi chưa commit), `branch` (mọi thứ trên branch kể từ base, giống tab Files changed của PR). Bên dưới là mục **Commits** (30 commit mới nhất): chọn một commit thì chỉ hiện diff của riêng commit đó so với commit cha (scope `commit:<sha>`, không kèm thay đổi chưa commit, nhớ theo repo như các scope khác). Phím `reviewer.scope` chỉ đổi vòng giữa ba scope đầu.
- **Comment inline**: bấm một dòng (bấm hai lần để chọn đoạn, bấm tiêu đề `@@` để chọn cả hunk) thì hộp comment hiện nổi ở góc trên phải của diff. Comment nằm ngay dưới các dòng đó, có thể comment nhiều file. Biểu tượng comment ở dòng file dùng cho cả file (ảnh, file bị xóa). `Esc` đóng hộp.
- **Submit review** gửi toàn bộ comment kèm số dòng cho agent của space dưới dạng một tin nhắn (`ask.js`). Bản nháp lưu trong shared `reviewer.drafts`; trạng thái đã gửi ở `reviewer.sent`.
- **Chuột phải một dòng** để hỏi agent về dòng đó ngay, không cần gom comment.

## Phím (đặt trong `keys.json` mục `mod:reviewer` nếu muốn)

`reviewer.submit`, `reviewer.ask` (hỏi về cả diff), `reviewer.clear` (xóa bản nháp), `reviewer.split` (bật/tắt chế độ hai cột), `reviewer.scope`. Trong hộp thoại gửi: `reviewer.send`, `reviewer.close`. Phím mở/đóng dialog: `cmd-shift-g` (mục `global`).

## Props (đặt ở `content.props` của block trong layout)

- `palette`: `one-dark-pro` (mặc định) | `theme` | `dark-plus`.
- `font_size`: px, mặc định cỡ chữ terminal trừ 1.
- `base`: branch để so sánh, mặc định `origin/HEAD`, rồi `main`, rồi `master`.
- Dưới 640px chiều rộng, chế độ hai cột tự rơi về một cột.

## Mod khác mở diff của một file

Ghi shared `reviewer.open = { id, at: Date.now(), path (tuyệt đối), on (máy hoặc null) }`. Panel nhặt yêu cầu ở lần refresh kế tiếp, chọn file (hoặc báo file không có diff trong phạm vi đang xem) rồi xóa khóa. Yêu cầu cũ hơn 30 giây bị bỏ để không bật bất ngờ khi repo được focus muộn.

## Lưu ý

- Changes không còn nằm trong stack `panel-body` của layout. Nút ở `my-tabs`, phím `cmd-shift-g` (`keys.json`) và `showChanges()` của `git-graph` đều chạy `mod.open:reviewer` (gọi lại thì đóng); kiểu và kích thước dialog (90% cửa sổ) ở `mod.json`. Khi mở, mod ghi id overlay vào shared `reviewer.dialog` (nút sáng lên); `close()` xoá khoá đó.
- Yêu cầu `reviewer.open` chỉ được nhặt khi dialog đang mở.

- Các lệnh git đọc tự động dùng `--no-optional-locks`, `core.fsmonitor=false`, `diff.autoRefreshIndex=false` để không giữ `index.lock` mà commit của agent có thể cần. Các thao tác bấm chủ động (như commit) chạy không cờ này.
- Tự làm mới khi file đổi (`watchFolder`). Repo ở máy khác dùng tham số `on`.
- Các file: `main.js` (panel), `dialog.js` (hộp thoại gửi), `ask.js` (soạn tin nhắn cho agent), `highlight.js`, `palette.js`.
- Commit xong từ ô Commit thì section Changes (phần diff) tự thu lại; bấm mũi tên cạnh tiêu đề "Changes" hoặc chọn một file để mở lại.

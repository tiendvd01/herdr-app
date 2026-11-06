# Issues (mod `issues`)

Panel GitHub issues ở cột phải (cùng stack `panel-body` với Files và Changes). Bật bằng nút "Issues" trên thanh tab (`my-tabs`).

## Hành vi

- **Mỗi space có trạng thái riêng**: repo, bộ lọc, từ khóa tìm, issue đang mở. Đổi space thì đổi theo. Trạng thái lưu trong `localStorage` khóa `spaces`.
- **Repo** lấy từ thư mục của terminal đang focus bằng `gh repo view`. Muốn chỉ định tay thì gõ `owner/repo` vào ô repo (lưu theo space, khóa `repos`); để trống thì quay lại tự dò.
- **Bộ lọc**: Open / Closed / All, và Mine (`--assignee @me`). Space mới mặc định **Open + Mine** (`fresh()` trong `main.js`); space đã lưu giữ lựa chọn cũ. Tìm kiếm gửi bằng Enter. Danh sách tối đa 100 issue.
- Bấm một issue để xem nội dung và comment (render markdown native, link mở bằng `open`). Có nút Close/Reopen và "GitHub ↗".
- **Thu gọn comment**: bấm tiêu đề một comment (mũi tên ▾/▸) để gập/mở; comment gập chỉ còn tiêu đề kèm 80 ký tự đầu. Nút "Collapse comments" / "Expand comments" ở thanh trên gập hoặc mở tất cả. Trạng thái gập chỉ giữ trong bộ nhớ, theo space, và reset khi mở issue khác (khóa theo `c.id` của comment).
- **Sơ đồ mermaid** trong body/comment (khối ` ```mermaid `) được vẽ thành ảnh bằng `mmdc` (mermaid-cli), chạy qua `zsh -ilc` để lấy node từ nvm. Bấm ảnh mở viewer (`viewer.js`, hộp thoại). Ảnh cache ở `mods/issues/.diagrams/` (gitignored).

## Tóm tắt bằng AI

- Chỉ chạy khi bấm nút **Summarize** / **Re-summarize** ở thanh trên của chi tiết issue; không tự chạy.
- Gọi `claude -p --model haiku` với `--tools ""`, `--no-session-persistence`, `--strict-mcp-config`, `--setting-sources ""`, `--disable-slash-commands` (rẻ, không đụng session hay cấu hình của bạn). Prompt hệ thống yêu cầu tiếng Việt và chú thích nghĩa cho mọi từ tiếng Nhật.
- `exec` giới hạn 30 giây nên claude chạy thành job tách rời (`nohup`); mod poll file `.done` mỗi giây, tối đa 180 giây.
- **Lưu ngoài project**: `~/.herdr/issue-summaries/summaries.json` (khóa `owner/repo#n` → `text`, `version`, `model`, `at`). Thư mục `jobs/` chứa file tạm của job đang chạy.
- **Phiên bản để phát hiện thay đổi**: `version` = hash của body + `id:body` từng comment (bỏ comment bị ẩn). Khi render, nếu hash hiện tại khác `version` đã lưu thì tiêu đề thẻ ghi "⚠ OUTDATED (issue changed since)". Không gắn nhãn trong lúc đang fetch lại issue. Đổi label/assignee/state không làm outdated.
- Issue quá 50 comment: giữ 20 đầu + 30 cuối, ghi "đã lược N comment ở giữa".
- Nghiên cứu nền: `docs/research/issue-summary.md`.

## Cache

- Danh sách và issue chi tiết được giữ trong bộ nhớ và `data/issues/cache.json`, ghi lại mỗi 5 giây khi có thay đổi. Mở lại thì hiện bản cache ngay rồi `gh` lấy bản mới phía sau (dòng "updated ... ago").
- Mọi thao tác dùng CLI `gh`, nên cần `gh auth login` trước. Lỗi `gh` hiện toast "gh failed".

## Lưu ý khi sửa code

- `render()` không gọi `cx.notify()`; việc nặng (dò repo, tải danh sách, đổi space) chạy trong task rồi mới notify.
- Chỉ phần "đọc và thao tác issue" được làm; tạo issue mới hay sửa nội dung chưa có.

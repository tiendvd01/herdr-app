# Project Settings: Ports và Worktree script (mod `project-settings`)

Trang cài đặt theo từng git project, hiện trong vùng nội dung chính (child `project-settings` của stack `content` trong layout). Mở từ mục "Project Settings" ở sidebar (`my-chrome`), bấm Back để về tab đang làm việc.

Cột trái liệt kê các project: mọi repo git của các space đang mở trên máy này (space ở máy khác bị bỏ qua). Mặc định chọn project của space đang active; danh sách quét lại mỗi 5 giây.

## Tab Ports

Liệt kê các cổng TCP đang LISTEN, nhóm theo worktree của project.

- Danh sách worktree lấy từ `git worktree list --porcelain` (chạy ở repo gốc).
- Cổng lấy từ `lsof -nP -iTCP -sTCP:LISTEN`; thư mục làm việc của tiến trình (`lsof -d cwd`) quyết định nó thuộc worktree nào (worktree có đường dẫn dài nhất khớp tiền tố). Tiến trình nằm ngoài mọi worktree của project thì không hiện.
- Mỗi dòng: số cổng, lệnh đầy đủ + pid, thư mục tương đối trong worktree. Tự làm mới mỗi 3 giây khi đang ở tab này, hoặc bấm Reload.
- **Terminal**: chỉ hiện khi tìm được terminal chạy nó (so tty điều khiển của listener với tiến trình foreground của terminal), bấm để nhảy tới pane đó.
- **Open**: mở `http://localhost:<port>`. **Stop**: `kill <pid>` (SIGTERM).
- Chỉ dùng được trên macOS/Linux (cần `lsof`, `ps`).

## Tab Worktree script

Trình soạn script bash chạy **một lần** trong mỗi worktree mới của project (cwd là worktree).

- File lưu ở `~/.config/herdr-app/projects/<repo>/post-create.sh`; `<repo>` là đường dẫn repo gốc đã đổi ký tự lạ thành `_`.
- Chưa có file thì editor hiện mẫu (ví dụ copy `.env`, `npm install`). Nếu có file cũ `<repo>/.herdr/post-create.sh` mà chưa có file mới, editor nạp nội dung file cũ; Save sẽ ghi sang đường dẫn mới.
- **Save** ghi file (kiểm tra nội dung không đổi bên ngoài), **Revert** nạp lại từ đĩa. Dòng trạng thái báo "Unsaved changes", "No script yet", "Saved" hoặc "Failed: ...".
- Script chạy tự động bởi mod `status-usage` (`postscripts.js`) sau khi hộp thoại worktree tạo checkout dưới `~/.herdr/worktrees/`. Chi tiết xem `docs/mods/status-usage.md`.
- Thư mục `projects/` nằm trong `.gitignore` vì là cấu hình riêng của máy này.

## Tab Summary prompt

Soạn system prompt cho nút **Summarize** của panel Issues, riêng cho từng project.

- File lưu ở `~/.config/herdr-app/projects/<repo>/summary-prompt.md` (cùng quy tắc đặt tên `<repo>` như Worktree script). Chưa có file thì editor hiện prompt mặc định.
- **Save** ghi file, **Revert** nạp lại từ đĩa, **Use default** xóa file để quay về prompt có sẵn trong mod `issues`.
- Mod `issues` đọc file này mỗi lần bấm Summarize: lấy thư mục của space đang xem → repo git gốc → `summary-prompt.md`. File trống, không có, space ở máy khác hoặc thư mục không phải repo git thì dùng prompt mặc định.
- Prompt mặc định được khai báo ở hai nơi (`SUM_SYSTEM` trong `mods/issues/main.js`, `DEFAULT_SUMMARY_PROMPT` trong `mods/project-settings/main.js`); sửa một nơi thì sửa cả hai.
- Đổi prompt không làm các bản tóm tắt đã lưu thành outdated (phiên bản chỉ tính từ nội dung issue); bấm Re-summarize để áp prompt mới.

## Mod liên quan

`project-scripts` là bản hộp thoại cũ của riêng tab Worktree script (cùng file, cùng mẫu); layout hiện tại dùng `project-settings`.

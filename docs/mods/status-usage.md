# Thanh trạng thái và giới hạn dùng AI (mod `status-usage`)

Clone của `workspace-status`. Thanh dưới cùng của cửa sổ, đồng thời là nơi chạy ba việc nền: giới hạn dùng AI, thu thập tiến trình cho Sessions, và chạy script sau khi tạo worktree.

## Thanh hiển thị

Từ trái sang phải: máy hiện tại, branch của space đang chọn (bấm để đổi, xem dưới), số agent (kèm "N needs you" khi có agent blocked), badge tiến trình, mức dùng AI, gợi ý phím mở palette.

## Đổi branch

- Branch hiện trên thanh là branch của folder của space (`space-folder.js`, theo terminal đang focus), đọc bằng `git rev-parse --abbrev-ref HEAD` mỗi 3 giây, ngay khi đổi space, và ngay sau khi đổi branch (shared `branch.switched`).
- Bấm vào branch mở popup mod `branch-switch` (cũng mở được bằng `mod.open {"name":"branch-switch"}`): ô lọc + danh sách branch local (mới nhất trước, branch hiện tại đầu tiên) rồi branch chỉ có trên remote.
- ↑/↓ + Enter hoặc bấm để `git switch`. Branch remote: `git switch --track <remote>/<tên>`. Gõ tên không có sẵn: dòng "Create branch" chạy `git switch -c` từ HEAD.
- Branch đang checkout ở worktree khác bị làm mờ ("other worktree") và không đổi được. Lỗi git (vd. thay đổi chưa commit bị đè) hiện đỏ ngay trong popup; đổi xong có toast.

## Giới hạn dùng AI ("Used")

- Dữ liệu lấy từ CLI **`quota-axi`**, chạy qua `zsh -lic "quota-axi --json --max-age 60s"` (shell login, để có PATH của bạn). Cần cài `quota-axi` trước.
- Cập nhật mỗi 120 giây, và khi rê chuột lên thanh (tối đa 5 giây một lần, hoặc 30 giây nếu không ép).
- Mỗi provider (claude, codex, copilot, gemini, agy) có các "window"; mod lấy `percentRemaining` rồi hiển thị phần **đã dùng** = 100 − còn lại.
- Hiển thị gọn: Claude chỉ hiện window `weekly` kèm thời gian reset; provider khác hiện window dùng nhiều nhất.
- Rê chuột vào để mở thẻ chi tiết: thanh tiến độ từng window, màu xanh (accent) → vàng (≥ 70%) → đỏ (≥ 90%), dòng "resets in ...".
- Provider không có dữ liệu `fresh`/`stale`, hoặc `notSetUp`, bị ẩn. Dữ liệu `stale` được ghi chú bên cạnh tên gói.
- Lỗi hiện chữ đỏ (90 ký tự đầu) ngay trên thanh.
- Icon lấy từ `icons/<provider>.svg`.

## Badge tiến trình và Sessions

- Cứ 4 giây gọi `collect()` (`procs.js`) rồi ghi shared `procs`. Badge tổng hợp số tiến trình, CPU, RAM của mọi phiên Claude.
- Bấm badge mở hộp thoại Sessions (mod `processes`, xem `docs/mods/processes.md`).

## Script sau khi tạo worktree

- Cứ 3 giây `checkPostScripts()` (`postscripts.js`) quét các space có thư mục nằm dưới `~/.herdr/worktrees/` (checkout do hộp thoại worktree tạo).
- Với worktree mới, tìm repo gốc bằng `git rev-parse --git-common-dir`, rồi chạy `~/.config/herdr-app/projects/<repo>/post-create.sh` (nếu trống hoặc không có thì thử `<repo>/.herdr/post-create.sh` cũ), cwd là worktree. Kết quả báo bằng toast.
- Các space đã mở ngay lần chạy đầu tiên được đánh dấu "đã xong" để không chạy lại script hồi tố. Danh sách đã xử lý lưu trong `localStorage` khóa `ps.done` (giữ 200 mục gần nhất).
- Soạn script ở trang **Project Settings** (xem `docs/mods/project-settings.md`).

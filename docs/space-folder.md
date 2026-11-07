# Folder cố định của space

Mỗi space có **một folder cố định**, không đổi khi terminal trong tab `cd` sang thư mục khác. Các panel đọc theo folder này: Files (`my-files`), Changes (`reviewer`), Issues (`issues`), Git (`git-graph`), Pull requests (`pr-flow`), cùng sidebar (`better-sidebar`: branch, worktree lồng, trạng thái PR), số dòng diff trên `my-tabs`, menu + của `my-new-menu` (tab mới mở ở folder này), `my-worktree`, `open-vscode`.

## Lưu ở đâu

- `shared("space.folders")`: `{ [space id]: folder }` (trong `shared.json`, không commit).
- Lần đầu space có terminal, folder được ghim bằng thư mục của **terminal đầu tiên** lúc đó (`pinSpaceFolders()`, chạy mỗi giây từ `better-sidebar` và `my-tabs`). Chưa ghim thì tạm dùng thư mục sống của terminal đầu tiên, rồi `space.folder` của Herdr.
- Không dùng `space.folder` của Herdr làm nguồn chính: giá trị đó là nơi space được tạo ra (thường là thư mục terminal đang focus lúc tạo), hay sai.

## Đổi folder

Chuột phải space ở sidebar (mod `my-menu`, clone của `menu`):
- **Use folder <tên>**: lấy thư mục của terminal đang focus trong space đó (chỉ hiện khi khác folder đang ghim).
- **Choose folder…**: chọn bằng hộp thoại hệ thống (chỉ space trên máy này).

## Code

Nguồn duy nhất: `lib/space-folder.js`. Mod chỉ import được file trong thư mục của chính nó, nên `scripts/sync-github-lib.sh` chép file này vào từng mod (`<mod>/space-folder.js`, `better-sidebar/git/space-folder.js`). Sửa `lib/` rồi chạy script, đừng sửa bản chép.

`pr-flow` giữ trạng thái riêng cho từng space, giống `issues` (`localStorage` khóa `spaces`): bộ lọc Open/Merged, Mine/Everyone, owner/repo đang chọn, PR và issue đang mở. Danh sách **chỉ** hiện PR của repo thuộc folder cố định của space (`git remote get-url origin`, tên repo hiện cạnh tiêu đề); không có thanh chọn owner/repo, không có chế độ xem chung. Số đếm Open/Merged cũng chỉ tính repo đó. Folder không phải repo GitHub thì panel báo vậy.

`pr-flow`: mỗi terminal đại diện cho folder cố định của space chứa nó; branch đọc bằng `git branch --show-current` ở folder đó (hoặc lấy branch của pane nếu pane đang đứng đúng folder).

`status-usage` hiện branch của folder cố định, và popup `branch-switch` đổi branch ở folder đó.

Chưa đổi: `project-settings`, `project-scripts`, `status-usage` (post-create) vẫn dùng `space.folder`.

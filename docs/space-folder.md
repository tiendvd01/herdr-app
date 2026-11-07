# Folder của space

Các panel đọc theo **thư mục của terminal đang focus**: terminal `cd` đi đâu thì panel đi theo. Không còn ghim folder cố định cho space (đã bỏ, cùng hai mục "Use folder" / "Choose folder…" ở menu chuột phải).

- `activePlace()`: space đang mở và thư mục của pane đang focus (kèm máy của nó). Dùng bởi Files (`file-icons`), Changes (`reviewer`), Git (`git-graph`), số dòng diff trên `my-tabs`.
- `spaceFolder(space)`: thư mục của terminal đang focus nếu nó thuộc space đó, không thì terminal đầu tiên của space, rồi `space.folder` của Herdr. Dùng bởi Issues (`issues`), Pull requests (`pr-flow`), `inbox`, `status-usage`, `branch-switch`, menu + của `my-new-menu`, `my-worktree`, `open-vscode`, `my-menu`.
- Sidebar (`better-sidebar`: branch, worktree lồng, trạng thái PR) đọc theo **terminal đầu tiên** của mỗi space (`git/checkouts.js`).

## Code

Nguồn duy nhất: `lib/space-folder.js`. Mod chỉ import được file trong thư mục của chính nó, nên `scripts/sync-github-lib.sh` chép file này vào từng mod (`<mod>/space-folder.js`, `better-sidebar/git/space-folder.js`). Sửa `lib/` rồi chạy script, đừng sửa bản chép.

`pr-flow` giữ trạng thái riêng cho từng space, giống `issues` (`localStorage` khóa `spaces`): bộ lọc Open/Merged, Mine/Everyone, owner/repo đang chọn, PR và issue đang mở. Danh sách **chỉ** hiện PR của repo thuộc folder của space (`git remote get-url origin`, tên repo hiện cạnh tiêu đề). Folder không phải repo GitHub thì panel báo vậy.

`status-usage` hiện branch của folder của space, và popup `branch-switch` đổi branch ở folder đó.

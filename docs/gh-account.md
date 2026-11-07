# Tài khoản gh theo repo

`gh` đăng nhập nhiều tài khoản (`gh auth login`). Các mod `pr-flow`, `better-sidebar` (trạng thái PR) và `issues` chọn tài khoản theo **owner của repo**, không đổi tài khoản active của `gh`:

- Owner trùng login một tài khoản đã đăng nhập (`tiendvd01/herdr-app`) thì chạy bằng tài khoản đó.
- Còn lại (org như `structuralengine`) chạy bằng tài khoản active (`tien-sora`). Giữ `tien-sora` active: `gh auth switch --user tien-sora`.

Cách chạy: `sh -c 'GH_TOKEN="$(gh auth token --user <login>)" exec gh ...'`, token lấy trong shell nên không lộ trong danh sách tiến trình. Repo được suy từ tham số (`-R`, URL GitHub, `repos/<owner>/<name>`, graphql `owner=`/`name=`). Lệnh không gắn repo: `gh search prs --author @me` (Mine của `pr-flow`) chạy với từng tài khoản rồi gộp; `gh repo view` của `issues` thử từng tài khoản tới khi được.

Mine của `pr-flow` so tác giả PR với `gh api user` của mọi tài khoản (tên GitHub thật có thể khác tên `gh` hiển thị, ví dụ `tien-sora` → `sora-tien`).

Nguồn: `lib/gh-account.js`, chép vào mod bằng `scripts/sync-github-lib.sh`. Đăng nhập thêm/bớt tài khoản thì reload mod (lưu một file trong mod, hoặc khởi động lại app).

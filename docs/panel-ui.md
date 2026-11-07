# Button của các panel

Năm panel bên phải (Files `file-icons`, Changes `reviewer`, Issues `issues`, Git `git-graph`, Pull requests `pr-flow`) dùng chung một bộ button: `lib/panel-ui.js`, icon trong `lib/icons/` (Lucide). `scripts/sync-github-lib.sh` chép `panel-ui.js` vào từng mod; sửa ở `lib/` rồi chạy script.

| Loại | Helper | Dùng cho | Hình dáng |
|---|---|---|---|
| Hành động quen thuộc | `iconButton(id, icon, tooltip, action, { small, active })` | làm mới `refresh`, cài đặt `settings`, đóng `close`, mở nvim `edit`, copy `copy`, mở GitHub `external`, phóng to `maximize`, fetch `fetch` | chỉ icon + tooltip; ô 24px icon 14 (trong dòng danh sách: `small`, ô 18 icon 12); đang chạy thì icon `spinner` |
| Quay lại | `backButton(id, label, action)` | về màn trước | icon `back` + tên màn trước ("List", "Issues", "Files", "Manygit") |
| Bộ lọc / chế độ xem | `chip(id, label, on, action, { tip, count })` | Open/Closed/All, Mine/Everyone, Open/Merged, Wrap/Split, Preview/Source, All branches/Current, Remotes | chữ, cao 22, nền `selected` khi bật |
| Hành động | `button(id, label, action, { primary, large, disabled })` | Submit, Send, Search, Commit, Summarize, Merge… | chữ; `primary` nền đặc, còn lại có viền; cao 26 (`large`: 32 cho hộp thoại và thanh dưới) |
| Hành động phụ | `textButton(id, label, action, { color })` | Cancel, Discard, Delete, Expand comments | chữ không khung |

Thêm icon mới: chép svg Lucide vào `lib/icons/<tên>.svg` (stroke `currentColor`).

# open-file

`cmd-p` (`keys.json`: `mod.open:open-file`) mở hộp thoại tìm file: chọn một file thì mở nó trong **tab mới**, hiển thị bằng phần xem trước của mod `file-icons` (file `.md` được render, có nút Preview/Source).

- Thư mục tìm = folder của terminal đang focus (`space-folder.js`, `activePlace()`), trên đúng máy của nó.
- Gõ chữ thường: tìm mờ trong thư mục đó (`rg --files --hidden`, bỏ `.git`, `node_modules`, xếp hạng bằng `fzf --filter --scheme=path`; không có `fzf` thì hiện danh sách `rg`). Tối đa 30 dòng.
- Gõ đường dẫn (bắt đầu bằng `/`, `~`, `./`, `../`): duyệt thư mục đó bằng `ls`, `fzf` lọc phần sau dấu `/` cuối. Thư mục có dấu `/`: Enter hoặc Tab đi vào. `~` do shell khai triển (đúng cả trên máy remote).
- ↑/↓ chọn, Enter hoặc bấm để mở, Esc đóng.
- Tab mới: `tab.new {name, mod: "file-icons", props: {file: <đường dẫn tuyệt đối>, on}}`.

## Tab xem file (`file-icons` với `props.file`)

- Copy này là trình xem một file cố định: **không** theo folder của terminal đang focus (panel Files thì theo), nên đổi focus hay đổi space không làm nó đổi file.
- Đọc lại file mỗi 10 giây, chỉ vẽ lại khi nội dung đổi. Nút Edit mở `nvim` ở tab khác.
- Panel Files vẫn theo folder của terminal đang focus / space hiện tại; bấm một file trong cây hoặc kết quả tìm cũng mở tab xem này thay vì xem ngay trong panel.

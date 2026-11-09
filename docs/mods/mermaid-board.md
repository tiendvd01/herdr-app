# mermaid-board

Hộp thoại dán sơ đồ mermaid, xem trước, và lưu lại để quản lý.

- Mở: `cmd-shift-m`, chữ "Mermaid" ở status bar, hoặc `mod.open {"name":"mermaid-board"}` (mở lần nữa thì đóng).
- Bố cục: danh sách đã lưu (trái), tên + editor (giữa), preview (phải). Preview tự vẽ lại 0,6 giây sau phím cuối; dán cả khối "```mermaid" cũng được. Bấm ảnh hoặc nút phóng to để mở viewer zoom.
- Lưu: nút Save hoặc cmd-s. Đổi tên ở ô tên rồi Save thì đổi tên file. Nút x trong danh sách xoá (bấm hai lần).
- Thư mục quản lý: `data/mermaid-board/library/<tên>.mmd` (nút mũi tên mở trong Finder). Thêm, đổi tên, xoá file ngoài app thì danh sách cập nhật trong 3 giây. `data/` bị gitignore, nên muốn đưa vào git thì copy ra ngoài.
- Ảnh preview là cache ở `mods/mermaid-board/.diagrams/` (ẩn, gitignored), vẽ bằng `mmdc`.
- `markdown.js`, `diagram-viewer.js`, `panel-ui.js` sinh bởi `scripts/sync-github-lib.sh`, không sửa trong mod.

# inbox

Một hòm thư chung ở sidebar trái (dưới Agents): những gì đang chờ bạn.

## Nguồn

- **Agent** (`agents()`, xét mỗi lần render):
  - chuyển sang `blocked` → mục "Needs you";
  - chuyển sang `done` → mục "Finished" (`done` chỉ xảy ra khi bạn không nhìn agent đó).
  - Nhìn vào agent (focus) thì mục thành đã đọc; agent làm việc tiếp thì mục "Needs you" chuyển vào Done.
  - Lần render đầu sau khi khởi động chỉ ghi nhận trạng thái hiện có, không sinh mục.
- **PR của bạn** (đang mở, `gh search prs --author @me` trên mọi tài khoản gh):
  - mỗi 5 phút lấy lại danh sách PR; mỗi PR được hỏi lại tối đa 2 phút một lần (`gh pr view` + GraphQL lấy thread);
  - so với snapshot lần trước (lưu ở `localStorage` key `prs`), nên khởi động lại app không báo lại việc cũ;
  - **sự kiện:** review mới của người khác (yêu cầu sửa / approve / review), comment mới trong thread chưa resolve, CI chuyển sang lỗi, PR bị conflict;
  - lần đầu thấy một PR chỉ chụp snapshot, không báo;
  - PR rời danh sách (merge / đóng) thì mục chuyển vào Done;
  - mỗi sự kiện PR còn bắn một toast; bấm toast chạy `inbox.open-latest`.

Mỗi agent / PR chỉ có một mục (key `agent:<address>` / `pr:<url>`). Sự kiện mới ghi đè nội dung, đưa mục lên đầu và đặt lại thành chưa đọc. Mục trong Done tự xoá sau 7 ngày; tối đa 150 mục.

## Icon

Icon chính cho biết mục nói về cái gì, huy hiệu ở góc cho biết nó đang thế nào:

- **Agent:** icon của chương trình agent (lấy từ `programs.json`, như sidebar Agents); góc `!` đỏ = cần bạn, chấm = đã chạy xong.
- **PR:** icon pull request; góc theo sự kiện nặng nhất: ✗ đỏ (yêu cầu sửa, CI lỗi, conflict), bong bóng vàng (review, comment mới), ✓ xanh lá (approve).
- Dòng thứ hai của mục PR liệt kê từng sự kiện kèm dấu riêng, nên approve và comment mới cùng lúc vẫn thấy cả hai.

Mỗi sự kiện PR lưu `badge` riêng (`changes`, `ci`, `conflict`, `comment`, `approved`; bảng `BADGE`), không đoán từ chữ trong nội dung.

## Bấm vào mục

- Agent → `agent.focus {terminal}`.
- PR → tìm space có repo khớp (theo folder của space, ưu tiên space đang mở) → `space.select` → chờ 600ms (vì `my-tabs` khôi phục panel riêng của space đó ngay sau khi đổi space) → `layout.select panel-body/prs` + `layout.show panel` → `setShared("pr-flow.goto", { url, at })`.
- `pr-flow` đọc `pr-flow.goto` trong `render` (sau `syncSpace`): bỏ qua yêu cầu cũ hơn 30 giây, `track` URL rồi mở PR đó.

**Done** (nhóm gập ở cuối danh sách):

- rê chuột lên một mục rồi bấm ✓ ("Mark as done"): chuyển mục vào Done;
- nút ✓ ở header ("Mark all as done", hoặc lệnh `inbox.done-all`): chuyển hết vào Done;
- trong Done, rê chuột lên một mục rồi bấm x ("Remove"): xoá hẳn mục đó; nút "Clear" trên tiêu đề nhóm (khi đang mở) xoá hết mục trong Done;
- sự kiện mới của cùng agent / PR đưa mục ra khỏi Done, lên đầu, chưa đọc.

Bấm vào mục để mở thì mục chỉ thành đã đọc (chữ nhạt, mất chấm xanh) và vẫn nằm lại, để còn quay lại xử lý.

Lệnh (`keys.json` / `herdr-app do`): `inbox.open-latest`, `inbox.done-all`.

## Code dùng chung

`gh.js`, `status.js`, `github.js`, `gh-account.js`, `space-folder.js` là bản chép từ `lib/` (`pr-gh.js`, `pr-status.js`, ...) bằng `scripts/sync-github-lib.sh`. Sửa ở `lib/` rồi chạy lại script, không sửa bản trong mod.

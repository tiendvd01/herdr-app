# delivery-dev-review · Data-migration lens

**Nạp khi:** diff đụng migration, backfill, seed, reference data, hoặc định nghĩa state machine dùng chung (khớp `Data-change paths` trong Repo Facts / regex mặc định của `delivery-dev-gate.sh`).

Phần mở rộng của `../SKILL.md` (Phase 10). Core giữ template, severity và gate; file này là **cách làm**. Nạp xong thì ghi tên file vào dòng `References đã nạp` ở mục _Scope_ của `review.md`.

## Data-migration lens — đọc NGỮ NGHĨA, không chỉ cú pháp

Một migration có `op.execute`/backfill KHÔNG an toàn chỉ vì "không nội suy input" (đó mới là injection).
Với **mọi** migration đổi/điền dữ liệu, bắt buộc kiểm — mỗi mục có bằng chứng trong `review.md`:

- **Literal ↔ closed-set nghiệp vụ.** Mỗi hằng ghi vào cột có tập giá trị hợp lệ (enum, `ingestion_method`,
  status, phase…) phải là **thành viên hợp lệ**. Mở file định nghĩa closed-set và đối chiếu — vd backfill ghi
  `'system'` vào một cột mà closed-set không có `system` là lỗi dữ liệu, không phải style.
- **Cast thời gian ↔ session TimeZone.** `::timestamptz`, `::date::timestamp`, `AT TIME ZONE`, `to_char`
  phụ thuộc `TimeZone` của session chạy migration ⇒ kết quả đổi theo môi trường (CI vs prod). Bắt múi giờ
  tường minh (`AT TIME ZONE 'Asia/Tokyo'`) ở cả upgrade lẫn downgrade; đừng để mặc định session.
- **Round-trip up/down trên DB thật.** `upgrade → downgrade → upgrade`; `alembic heads` đúng một head,
  tuyến tính. downgrade làm mất dữ liệu mà không nêu rõ cũng là finding.
- **Backfill ↔ dữ liệu có sẵn.** NULL, hàng soft-deleted, giá trị ngoài miền — migration xử thế nào?
  Chạy thử trên vài hàng thật, đừng chỉ đọc SQL.
- **Seed: insert-only hay reconcile?** Seed insert-only (`ON CONFLICT DO NOTHING`, "chỉ thêm nếu chưa có")
  ⇒ xoá/sửa một định nghĩa trong code **không** tự dọn hàng đã seed ở môi trường đã chạy — cần migration
  dữ liệu đi kèm. Đọc code seed để biết nó thuộc loại nào, đừng suy từ tên.
- **Index/constraint phủ đúng predicate.** Unique trên bảng soft-delete phải là partial
  (`WHERE deleted_at IS NULL`) và mang cột tenant nếu có; thiếu thì tạo lại một bản ghi đã xoá sẽ đụng
  unique, hoặc hai tenant chặn nhau. Soft-delete + reuse key còn cần flush/thứ tự đúng trong transaction.
- **Chấm severity KÈM trạng thái deploy** (xem _Severity_). Ghi rõ trong finding: "HIGH nếu đã chạy
  staging/prod; LOW nếu chưa deploy (seed lại từ đầu)".

- **Xoá / soft-delete một STATE (hay giá trị enum đang được tham chiếu) ⇒ remap hàng đang mang giá trị
  đó.** Migration bỏ một state mà không `UPDATE` các bản ghi đang ở state đó ⇒ chúng kẹt, không còn move
  hợp lệ. `SELECT count(*) … WHERE <cột> = '<giá trị bỏ>'` trước, rồi remap sang state kế thừa (mirror ở
  downgrade).
- **Parity fresh-seed vs post-migration.** Reference data (seq, is_initial, cờ, nhãn) do seed *dẫn xuất*
  mà migration *không* cập nhật hàng cũ ⇒ DB seed-mới và DB đã-migrate lệch nhau dù cả hai "đúng cú
  pháp". So trạng thái sau `seed fresh` với sau `migrate`; lệch = finding (UPDATE trong migration, hoặc
  ghi chú chủ ý).

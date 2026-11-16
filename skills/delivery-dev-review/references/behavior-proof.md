# delivery-dev-review · Behavior proof

**Nạp khi:** PR **đụng hành vi** — business rule · guard · state transition · side-effect · API contract. Gần như mọi PR feature/bug.

Phần mở rộng của `../SKILL.md` (Phase 10). Core giữ template, severity và gate; file này là **cách làm**. Nạp xong thì ghi tên file vào dòng `References đã nạp` ở mục _Scope_ của `review.md`.

## Behavior proof — chạy hành vi đã đổi, KHÔNG chỉ chạy suite của tác giả

Toolchain xanh ở trên là mức **regression/syntax**: nó chỉ chứng minh "test tác giả tự viết vẫn
pass", không chứng minh hành vi mới đúng. **Một suite xanh KHÔNG phải behavior-proof** — bug thật hay
nằm đúng ở path mà happy-path của tác giả không phủ. Với PR **đụng hành vi** (business rule · guard ·
state transition · side-effect · API contract), phải tự dựng bằng chứng **động**, mỗi dòng có số quan
sát được:

1. **Liệt kê MỌI entry-path tới operation đã đổi** — không chỉ endpoint mới trong diff. `grep`
   call-site của hàm/action đã đổi **xuyên toàn repo** (HTTP route · queue/inbox consumer · batch/cron ·
   admin CLI · caller nội bộ). Một rule chứng minh ở một path **không** tự đúng ở path khác — khe giữa
   hai path là chỗ bug ẩn.
2. **Mỗi path: tự viết một probe throwaway** đẩy **input đối kháng** (negative · boundary · bypass —
   không phải happy path), chạy trên hệ thật (app + DB qua harness / `docker compose` của repo), rồi
   **quan sát cả response lẫn state** (row DB, side-effect, event được ghi/không ghi). Xoá probe sau khi
   lấy số; transcript (request/response + query state) lưu ở `evidence/` trong thư mục task trong vault (`SoraVaults/<project>/issue <n>/evidence/`) và link từ bảng.
   **Chỉ trên hệ local/compose/test harness.** Gửi request đối kháng vào môi trường đã deploy (dev/staging/prod)
   là probe hệ đang chạy ⇒ phải hỏi trước từng lệnh (`../../delivery-dev/references/security.md` hard rule 5).
3. **Bắt buộc ≥1 probe là case bypass/negative mà suite tác giả KHÔNG phủ.** Mọi probe đều xanh sẵn
   trong suite cũ ⇒ chưa chứng minh gì mới. Kiểm fixture: nếu dữ liệu vào đã ở trạng thái "hợp lệ" thì
   nhánh vi phạm không bao giờ chạy — "N tests pass" nói KHÔNG gì về path không test nào đi qua.
4. Điền bảng **Behavior proof** trong Template (`../SKILL.md`). Không dựng được hệ ⇒ `NOT_RUN + lý do` **cho từng
   path**; PR đụng hành vi **không được APPROVE** chỉ với toolchain xanh — nói thẳng "chưa chứng minh
   hành vi", không nâng lên APPROVED.

Đây là forcing function, không phải lời khuyên: ô bảng trống = gate fail (thấy được), khác một đoạn văn
"nên chạy thật" (bỏ qua là vô hình). Viết probe bypass còn tự ép enumerate entry-path (mục 1) và quan
sát state sau migration/seed (chạy migration trên DB thật rồi query row, không đọc SQL suông).

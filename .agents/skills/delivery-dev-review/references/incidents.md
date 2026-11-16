# Vì sao review có các cổng này — hai lần review AI sót lỗi

Đọc khi muốn biết một cổng trong `SKILL.md` sinh ra từ đâu, hoặc khi định nới một cổng. Tên skill trong phần kể giữ tên lúc xảy ra (`devflow-*`, đổi thành `delivery-dev-*` ngày 18/10/2026).

## 1. PWPF #189 / PR #592 (09/2026)

Phase review trong luồng `APPROVE` với 0 blocking; sau đó người review thật tìm ra 12 finding. Đối chiếu `review.md` với ngày giờ commit: review AI **đã thấy 4/12** (ma trận quyền theo vai người gọi, bước không có người nhận, nhánh không làm gì khi bản ghi phụ là None, `key={index}`) nhưng **hạ xuống LOW / nit / follow-up**; **sót 8/12**, vì sáu nguyên nhân đều sửa được:

| | Nguyên nhân | Cổng sinh ra |
|---|---|---|
| A | **Ảnh chụp cũ, không review lại.** Review chạy ở một SHA; deep-link, DateTimeField, FileField commit sau đó không ai review. Lỗi 404 nằm trọn trong đoạn chưa review. Lỗ lớn nhất | `REVIEWED_SHA` + review lại phần `REVIEWED_SHA..HEAD` (hoặc `git range-diff` sau rebase) trước verify / PR |
| B | **Thang chỉ chặn CRITICAL / HIGH.** Một loạt MEDIUM / LOW thấy đúng vẫn đi qua dưới dạng "APPROVE + follow-up" | MEDIUM về data integrity, bất biến workflow, RBAC-UX là chặn |
| C | **Không có lăng kính migration dữ liệu.** Kiểm injection, nhưng không ai kiểm literal backfill so với tập giá trị đóng của domain (`'system'` không phải `ingestion_method` hợp lệ) hay phép cast phụ thuộc múi giờ phiên (`::date::timestamptz`) | `references/data-migration.md` bắt buộc |
| D | **Đọc theo hunk.** Tính chất xuyên file lọt: một hàm trùng ở hai repository, một dòng cố định khớp bằng giá trị đổi được / xoá mềm được | Lượt DRY toàn module + bất biến xuyên file sau lượt hunk |
| E | **FE không chạy thật.** `npm run build` / vitest để `UNKNOWN`; kiểm i18n đếm key **có mặt** chứ không đếm key **được dùng** → 404 lúc chạy và key chết vô hình | Verify chạy build FE / vitest + trình duyệt trên HEAD cuối |
| F | **Cùng định kiến.** AI review code AI viết, cả hai neo vào cùng `requirements.md` / `plan.md` → cùng điểm mù. Định kiến độc lập của người thật mới phá được thế đối xứng | Review đọc issue + đặc tả + diff trước, chỉ đọc plan / implementation sau khi đã có nhận định riêng |

## 2. PWPF #192 / PR #609 (24/09/2026) — sáu cổng trên vẫn không giữ

Review `APPROVED` ở SHA của nó, người thật vẫn tìm ra 8 finding. Review AI thấy 3 (lệch `is_initial`, nhánh không làm gì khi bản ghi phụ là None, migration bị kẹt) nhưng xếp LOW hoặc "chấp nhận cho buổi diễn tập" **mà không có số issue**; và **sót** một đường vòng 差し戻し qua hộp thư (lối vào thứ hai tới một chuyển trạng thái có guard), một trích dẫn chỉ có trên wiki, một chữ "Must" của đặc tả bị nới, một lỗi chính tả thuật ngữ. Phần "Verification" chỉ là toolchain xanh + bộ test của chính tác giả, tức mức hồi quy / cú pháp, chưa bao giờ là thăm dò runtime có chủ đích phá: người thật bắt được đường vòng bằng cách POST đúng request độc rồi thấy 0 dòng thay đổi.

Hai bài học:

1. **Luật viết bằng văn xuôi không giữ được.** Các cổng của #189 nằm trong chính skill mà AI cùng định kiến đọc lướt, và người review đã tự hợp lý hoá qua từng cổng ("khớp đặc tả", "tự đủ", "chấp nhận cho diễn tập"). Một luật chỉ bám khi nó là **(a) lệnh phải dán output, (b) ô bắt buộc trong template (để trống = trượt cổng thấy rõ), hoặc (c) mặc định đóng (chưa kiểm = chặn)**.
2. **Bộ test của tác giả xanh không phải bằng chứng hành vi.**

Cổng sinh ra (24/09/2026):

- Bảng **Behavior-proof** bắt buộc: mỗi lối vào một thăm dò runtime có chủ đích phá, ghi response + trạng thái; toolchain xanh một mình không bao giờ đủ để APPROVE (`references/behavior-proof.md`).
- Liệt kê lối vào xuyên module.
- Canon là thứ **dự án định nghĩa**, có hai trục: thẩm quyền yêu cầu (lệch với bản ghim trong repo = finding "đồng bộ bản ghim") và vệ sinh trích dẫn đã commit (trích chỉ giải được trên wiki vẫn là trích treo) (`references/canon.md`).
- **Phân loại lại mặc định đóng** khi migration / seed / schema / state machine dùng chung lộ ra ngoài route; `status.md` cũ = trượt cổng.
- Finding hậu quả cao bị hạ hoặc "chấp nhận" phải có số issue.
- Ô "giả định của tác giả, đã bác bỏ".
- Lăng kính migration thêm: đối chiếu DB dựng mới với DB đã migrate, và ánh xạ lại trạng thái đang dở.

## 3. Cổng cơ học (24/09/2026)

Sau một lượt rà toàn bộ bộ skill, mỗi phase bắt đầu bằng `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> <phase>` và dán output vào `## Gate-in`; `GATE: FAIL` thì không chạy phase. Script kiểm token tiền điều kiện, dấu duyệt trong `02-status.md`, `HEAD == REVIEWED_SHA` (dùng `git range-diff` khi rebase làm đứt tổ tiên; ở #192 `REVIEWED_SHA` không còn là tổ tiên sau khi đổi số migration), cây sạch, và độ tươi của route (diff đụng migration / seed mà `## Roles` / `## Phases` không có DBA hay operational check thì trượt; #192 chỉ ghi một dòng "re-route"). `01-context.md` có mục **Repo Facts** (nhánh base, nhánh dùng chung, nguồn canon, trạng thái deploy, từ khoá liên kết issue) cho script và review đọc. Không bao giờ lập luận để vượt một FAIL: sửa artifact hoặc hỏi.

## 4. Vệ sinh comment (18/09/2026)

Cũng ở #189: code đã commit mang ID yêu cầu trần (`AC-007〜010`, `AC-005`…) và nguyên câu comment tiếng Nhật trong component FE. Cả self-review của implement lẫn review đều cho qua; dev bắt được bằng mắt. Nguyên nhân: vệ sinh comment không nằm trong checklist nào, author AI viết bằng ngôn ngữ nó đang suy luận, reviewer AI dồn vào correctness / security / test. Cổng sinh ra: mục *Comment & citation hygiene* trong `SKILL.md` và bước tương ứng trong Self Review của `delivery-dev-implement`.

## Khi chạy một issue

Review `APPROVE` trong khi FE còn `UNKNOWN`, hoặc HEAD đã đi tiếp sau `REVIEWED_SHA`, thì coi như chưa review.

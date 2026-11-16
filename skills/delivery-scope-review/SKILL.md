---
name: delivery-scope-review
description: "Rà và chốt scope một GitHub issue (hoặc comment phân tích scope/task/DoD của issue) rồi soạn nháp comment trả lời đầy đủ: đối chiếu issue gốc + nguồn đặc tả của dự án + code thật, chỉ ra đúng/thiếu/thừa/mở rộng scope, tự chốt các câu hỏi mở, đề xuất field/API bám mẫu có sẵn, kèm sơ đồ ER + sequence và DoD sau khi chốt. Dùng khi được hỏi 'comment này đã cover hết chưa', 'so với issue gốc thừa hay thiếu', 'rà lại scope issue', 'draft reply chốt scope', 'chốt Q1–Qn giúp', ở bất kỳ dự án nào. Không dùng cho review PR/diff (dùng delivery-pr-review) hay câu hỏi giải thích một khái niệm lẻ."
---

# Rà và chốt scope issue

Mục tiêu: biến một issue (và comment phân tích của người nhận việc) thành **một comment chốt scope đủ để dev làm luôn**, mọi căn cứ đều kiểm được, không cần hỏi lại.

Người dùng thường là người có quyền chốt (PM / lead). Họ muốn **đầy đủ, chi tiết, dễ đọc**, và **tự quyết khi đặc tả đã đủ rõ**. Không kéo thêm người khác vào quyết định trừ khi đặc tả thật sự không có câu trả lời.

## 0. Nguyên tắc cứng

- **Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`. Các mục dưới chỉ ghi phần riêng của skill này.
- **Mọi khẳng định đều có căn cứ đã đọc trong lượt này**: `path:line`, trang wiki + mục, số issue/PR. Không có thì ghi "chưa kiểm được" và nói cần gì để kiểm.
- **Nháp trước, không tự đăng.** Đưa nháp trong fence ` ````markdown ` rồi dừng chờ duyệt. Chỉ đăng khi người dùng bảo "đăng đi / post luôn" trong lượt đó.
- **Tách rõ 3 loại nội dung:** (a) đặc tả nói, (b) code đang có, (c) quyết định của người dùng (đặc tả không nói). Loại (c) phải ghi rõ là quyết định, và nhắc lại ở cuối reply để người dùng soát trước khi đăng.
- **Không trích nguồn người đọc không mở được** (repo nội bộ của PM, file local, tài liệu thương mại). Chỉ trích nguồn team truy cập được: wiki của dự án, spec đã commit, code trong repo dev, issue/PR.

## 1. Xác định nguồn của dự án (làm đầu tiên)

Mỗi dự án đặt đặc tả một chỗ khác nhau. Trước khi điều tra, đọc `CLAUDE.md` / `AGENTS.md` / memory của dự án để biết:

- **Nguồn đặc tả chuẩn** (wiki nào, bản spec ghim ở path nào, thứ tự ưu tiên khi lệch nhau).
- **Nguồn chỉ để tham khảo** (demo, repo PM, bản nháp chưa ràng buộc). Chỉ dùng khi người dùng bảo, và khi dùng thì nói rõ lệch bản chuẩn thế nào.
- **Quy ước ghi**: file nào dev không được sửa (vd thư mục spec ghim), nơi đặt feature spec (`docs/features/…`), cách trích requirement ID, link issue (`Refs #`), ngôn ngữ comment và cách xưng hô với người nhận.

Nếu không tìm ra nguồn chuẩn, hỏi người dùng **một câu** trước khi làm, đừng đoán.

## 2. Điều tra (theo thứ tự, không bỏ bước)

0. **Chốt đề bài trước.** Người dùng chỉ vào **một comment cụ thể** (link `#issuecomment-…`) thì đề bài là **chủ đề của comment đó**. Các comment khác trong thread chỉ là bối cảnh: đọc hết, nhưng không tự chuyển sang trả lời câu hỏi khác (dù chúng còn treo). Nếu comment đó **đã có reply** (kể cả reply của chính người dùng), việc cần làm là đối chiếu lại reply đó với nguồn chuẩn và chỉ ra chỗ đúng/sai, chứ không bảo "đã trả lời rồi" rồi chuyển đề. Chưa rõ người dùng muốn rà comment nào thì hỏi một câu.
1. **Issue gốc**: đọc body, comment, label, issue cha mà nó thừa kế nội dung. Lập bảng "issue gốc thực sự đòi gì" (R1, R2…), kể cả phần nằm trong DoD và phần chỉ nằm trong tiêu đề task. Đánh dấu phần thừa kế đã bị loại hoặc đã đóng ở issue khác.
2. **Comment đang rà**: liệt kê task (T1…), DoD, câu hỏi mở (Q1…) của người comment.
3. **Đối chiếu đặc tả**: từng R/T/DoD/Q so với nguồn chuẩn ở mục 1. Tìm cả chỗ đặc tả tự mâu thuẫn hoặc còn sót từ bản cũ (changelog giúp phân biệt).
   - **Mở và đọc đúng mọi trang/mục mà comment trích** (vd "wiki SRS §8.1"), không kết luận từ trang lân cận. Sau đó **tìm trên toàn wiki** theo từ khoá nghiệp vụ (tên cột, nhãn UI, thuật ngữ) để chắc không sót trang nào nói về chủ đề đó, gồm cả trang dữ liệu, quyền, màn hình, nhật ký quyết định.
   - Ghi kết quả thành bảng **"đặc tả nói gì / im lặng chỗ nào"** theo từng điểm, kèm nguồn.
   - **Số mục (§) lấy từ heading thật**: tìm heading gần nhất phía trên dòng đang trích, đừng suy từ ngày hay nội dung. (Lần 05/10 ghi §5.14(7)(b) trong khi dòng đó nằm ở §5.13.)
4. **Kiểm code thật** trên nhánh chính mới nhất: tên bảng, cột, enum, unique index, endpoint, hàm service, quyền, test đang có. Mỗi căn cứ mà comment trích thì kiểm lại xem có đúng không. Không vẽ hay ghi cột nào chưa đọc model.
   - **Kiểm lại head ngay trước khi đưa nháp và trước khi đăng**: PR/nhánh có thể vừa có commit sửa đúng chỗ mình định chỉ ra (vd đánh số lại BR/AC). Không fetch được thì so head qua API.
   - **Kiểm cả tài liệu và docstring**, không chỉ code: code có thể đã đúng đặc tả mà `docs/features/…` hay docstring vẫn mô tả hành vi cũ.
   - **Comment trong code không phải căn cứ nghiệp vụ.** Câu kiểu "X is the next list" có thể cũ hơn đặc tả. Mọi dự báo "sẽ có danh mục / sẽ thêm vai trò / sẽ đổi" phải đối chiếu đặc tả ghim trước khi đưa vào lập luận. (Lần 05/10 dựa vào một comment code để nói "tư vấn thiết kế sẽ có danh mục", trong khi yêu cầu ghim nói ngược lại; phải đính chính sau khi đã đăng.)
5. **Tìm mẫu có sẵn** trước khi đề xuất cái mới (xem mục 3).
6. **Soát hệ quả ngầm** của từng đề xuất: quyền / phạm vi xem, unique constraint, audit, thông báo, migration, dữ liệu import.
   - **Liệt kê đủ mọi đường ghi** của dữ liệu đó, không chỉ API update: tạo mới (đăng ký), sửa, sao chép / tách nhánh, nhập CSV / di trú, batch. Màn đăng ký mới thường đi một endpoint khác với màn sửa; bỏ sót thì dữ liệu nhập lúc tạo bị mất.
   - **Đường đọc**: ai đọc dữ liệu này (CSV, PDF, danh sách, tìm kiếm, lịch sử…) và đọc qua đâu (service công khai hay thẳng vào bảng). Điều này quyết định chi phí đổi chỗ lưu.
7. **Tra backlog**: việc đó đã có issue nào nhận chưa, issue liên quan đã đóng/bỏ chưa. Quyết định gộp hay tách dựa trên đó.

## 3. Quy tắc thiết kế khi đề xuất (bài học đã trả giá)

- **Dùng lại API update có sẵn** của màn hình chứa thao tác. Chỉ tách API riêng khi thao tác có **quyền hoặc quy tắc khác** với update chung (kiểm trùng, quyền hẹp hơn…). Luôn nói thao tác nằm ở **màn nào / tab nào / nút nào**.
- **Đổi một giá trị đơn** (người phụ trách, trạng thái, mốc ngày): **cập nhật đè**, gửi lại đúng giá trị cũ thì **không ghi gì**, lịch sử from→to để ở **nhật ký sự kiện/audit append-only**. Không "xoá mềm dòng cũ + thêm dòng mới" (rác, trộn lịch sử vào bảng trạng thái).
- **Đừng để một chi tiết lưu trữ đổi nghiệp vụ**: vd thêm dòng vào bảng người phụ trách có thể tự mở phạm vi xem cho cả bộ phận. Nếu có hệ quả như vậy, chọn chỗ lưu khác hoặc ghi rõ để người dùng duyệt.
- **Field/cột mới phải mô tả ngay trong văn bản**: bảng, tên, kiểu, nullable, nghĩa nghiệp vụ, vì sao đặt ở đó, hệ quả. Sơ đồ chỉ vẽ lại đúng cái đã mô tả. Không để field "lòi ra" trong diagram mà text không nói.
- **Suy ra thay vì lưu thêm** khi có thể (vd bước suy từ loại WF, không cần cột `step_no`). Và đừng chép công thức của demo/tham khảo mâu thuẫn với chính quyết định đó.
- **Không bịa field từ nghiệp vụ**: nếu đặc tả chỉ nói nghiệp vụ mà không nói lưu ở đâu, ghi "anh/chị chốt chỗ lưu như sau" rồi mô tả.
- Tên endpoint/cột mới gắn nhãn **"tên đề xuất"** để dev chốt khi làm.
- **"Đặc tả im lặng về X" khác "đặc tả quy định rõ cách thao tác".** Đặc tả không nhắc một thành phần (vd modal nhập lý do) không có nghĩa là giữ được nó: nếu đặc tả mô tả hành vi "chọn là đổi ngay", thì chen thêm một bước giữa là trái đặc tả. Chỉ áp quy tắc "đặc tả im lặng thì giữ như code" khi đặc tả không nói gì về **hành vi** đó, không chỉ về **thành phần** đó.
- **Quyết định cũ (của PM, không có tài liệu gốc) có trước một thay đổi đặc tả sau này** thì phải rà lại theo đặc tả sau, không coi là đã chốt vĩnh viễn.

### 3a. Câu hỏi "lưu ở đâu" là quyết định mô hình dữ liệu (bài học 05/10)

Người dùng đã bắt lại ba lần trong cùng một issue: "đấy là nghiệp vụ, phải phân tích kỹ solution", "solution phải cover dài hạn, không nhìn trước mắt", "cần bản đánh giá cụ thể, tradeoff". Vì vậy:

- **Đừng chọn theo "vừa sprint".** Trước khi đề xuất, phải:
  - **Kiểm kê mọi chỗ cùng loại.** Ví dụ: mọi vai trò công ty trên một công trình đang lưu ở đâu, theo kiểu nào.
  - **Tìm tiền lệ trong ADR.**
  - **Đọc hướng đích của đặc tả.**
  - **Gọi đúng tên mẫu thiết kế chuẩn.** Ví dụ: thuộc tính của quan hệ thì đặt ở bảng liên kết theo vai trò, không đặt ở danh mục và không rải cột phẳng.
- **Đưa bản đánh giá trước khi chốt**, gồm:
  1. Các phương án, kể cả phương án bị loại kèm lý do.
  2. **Chi phí làm ngay đo trên code**: số file, số chỗ, số test bị đụng; tính năng đã qua QA nào bị chạm.
  3. **Chi phí khi yêu cầu đổi**, theo từng kịch bản. Mỗi kịch bản ghi khả năng xảy ra **và căn cứ** (đặc tả, ADR, lịch sử thay đổi), không lấy căn cứ từ comment trong code.
  4. Rủi ro.
  5. Ràng buộc thời gian: sprint, milestone, di trú dữ liệu.
  6. Điều kiện để chọn từng phương án.
  7. Khuyến nghị.

  Số ngày công là ước lượng, ghi rõ là ước lượng.
- **Mô hình dài hạn mà sprint chật thì chia bước** theo kiểu mở rộng, chuyển, thu gọn:
  - Bước đầu chỉ đưa **dữ liệu mới** vào chỗ đích.
  - Không ghi kép.
  - Gom mọi chỗ ghép dữ liệu cũ với mới vào **một điểm dịch** trong service.
  - Mở ngay issue cho bước sau.

  Thời điểm rẻ nhất để đổi chỗ lưu là **trước khi di trú dữ liệu thật**.
- **Phát hiện một căn cứ của bản đánh giá bị sai** thì nói ngay, đánh giá lại xem quyết định còn đứng không, rồi để người dùng quyết. Đừng âm thầm sửa câu chữ.

## 4. Kết luận trong chat (trước nháp)

Ngắn gọn, cho người dùng thấy toàn cảnh:

- 1 câu: đã rà với nguồn nào, ở commit/phiên bản nào.
- **Kết luận** (vd "cover ~70%, thiếu 6 điểm, 2 điểm chặn DoD").
- Bảng **Đã đúng** / **Thiếu hoặc sai** (mức độ 🔴🟡⚪ + căn cứ) / **Thừa so với issue gốc**.
- Đề xuất chốt từng câu hỏi mở. Chỉ đẩy lên người khác những câu đặc tả thật sự không trả lời được.

## 5. Nháp comment

Theo khung ở [reference/comment-template.md](reference/comment-template.md). Yêu cầu trình bày:

- **Gạch đầu dòng thay đoạn văn dài.** Mỗi bước/quy tắc 1 dòng: "Bước N – tên: xong khi …". Căn cứ gom cuối dòng. Câu ngắn.
- **Số bước viết "bước 2"**, không "#2" (GitHub tự link sang issue #2) và không trùng ký hiệu task ("T2"). Chỉ số issue/PR thật mới dùng `#`.
- Sơ đồ bằng mermaid, hai mức. **Nghiệp vụ** theo `../delivery-start/references/so-do.md`: luồng theo làn vai trò hoặc vòng đời trạng thái thay cho đoạn tả cơ chế; thêm use case khi Requirement có từ 2 vai trò trở lên. **Kỹ thuật**: `erDiagram` (cột thật + đánh dấu `NEW`), `sequenceDiagram` cho luồng đọc và luồng ghi. Label ngắn, không dấu nháy lồng.
- **Nhãn mermaid viết đúng chính tả ngôn ngữ đang dùng** — tiếng Việt thì **có dấu đầy đủ**. Mermaid render Unicode bình thường; bỏ dấu nhìn như lỗi encoding giữa một bài có dấu. Chỉ tránh 3 ký tự vì cú pháp, không phải vì dấu: `#` (mermaid đọc là entity code `#35;` → viết `PR 645`, không `PR #645`), `:` (phân tách của `Note …:` và nhãn mũi tên), `(` `)` trong tên `participant` (dùng gạch ngang hoặc dấu phẩy). Gặp 3 ký tự đó thì đổi cách diễn đạt, đừng đổi sang không dấu. Identifier và giá trị thật (tên cột, endpoint, giá trị URL) giữ nguyên trong nhãn.
- **Mỗi khối mermaid trong comment mở đầu bằng dòng** `%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%`, đặt ngay sau dòng mở khối. Không có dòng này thì GitHub cắt mất cuối mỗi dòng nhãn có dấu, ngắt dòng bằng `<br/>` cũng không chữa được (comment #774, 19/10/2026). Nhãn dài vẫn ngắt bằng `<br/>` trong `["…"]`, mỗi dòng khoảng 20 ký tự. Không kiểm được hình vẽ bằng `gh`, nên sau khi đăng nhờ người dùng xem lại. Chi tiết: `../sora-profile/references/van-phong.md` §4.
- Nếu là **mở rộng scope** so với issue gốc thì ghi rõ để người nhận tính lại estimation.
- **Khi comment phải chốt một quyết định nghiệp vụ**, sắp theo thứ tự này (người dùng đã duyệt):
  1. **Chốt nhanh** ở đầu: mỗi quyết định 1 dòng, kèm thuộc issue nào.
  2. **Nghiệp vụ**: giải thích cơ chế bằng lời thường cho người không đọc code (vd trạng thái tự chạy theo ngày, đổi tay = ghim, vì sao cần gỡ ghim), có **một ví dụ đi trọn một vòng** đánh số từng bước, kèm sơ đồ luồng hoặc trạng thái mức nghiệp vụ (`so-do.md`).
  3. **Yêu cầu theo đặc tả**: bảng "nội dung / đặc tả nói gì / nguồn", ghi rõ chỗ **không nói**; rồi nêu code hiện tại làm gì và quyết định đó đến từ đâu.
  4. **Căn cứ cho từng quyết định**: mỗi phương án kèm hệ quả cụ thể (dùng lại ví dụ ở bước 2), rồi lý do chọn.
  5. Thuộc issue nào, DoD (có một dòng đi lại đúng ví dụ ở bước 2), Nguồn.
- **Đổi một quyết định đã đăng** thì ghi thẳng "đổi so với comment ngày X" và vì sao lần trước hiểu sai.
- Kết bằng **DoD sau khi chốt** (đánh số, kiểm được) + 1 câu giao việc.
- Văn phong, ngôn ngữ, xưng hô: theo quy ước của dự án/người nhận (mục 1). Mặc định với team Việt: giọng ngang hàng, bỏ "ạ", không chữ Nhật trong câu (giữ identifier và số hiệu điều khoản), không jargon nội bộ, không lạm dụng gạch ngang.

Sau nháp, ở ngoài fence: liệt kê **các quyết định loại (c)** và **điểm còn phải kiểm khi làm**, rồi dừng chờ duyệt.

## 6. Vòng sửa

Người dùng sẽ hỏi vặn từng chỗ ("stepNo ở đâu?", "role_in_case đâu ra?", "sao lại API riêng?"). Mỗi lần:

- Nếu họ đúng: **nhận thẳng, nói nguyên nhân mình sai**, kiểm code nếu cần, đưa **đoạn thay thế** (không bắt họ tự ghép).
- Khi họ bảo "ghép lại / draft lại": xuất **bản đầy đủ**, kèm 2–3 dòng "đổi gì so với bản trước".
- Nếu họ tự đăng bản cuối và muốn giữ bài học: đề xuất cập nhật mục 3 của skill này.
- **"Rà soát thật chi tiết"** nghĩa là một lượt kiểm toàn bộ, không chỉ phần mới viết:
  - Liệt kê **từng khẳng định** trong mọi nội dung đã đăng và mọi nháp (số §, số dòng code, số cột, ngày, tên endpoint, tên hàm), đối chiếu lại với nguồn.
  - Trả về bảng **lỗi**: mức độ, nằm ở đâu, căn cứ.
  - Kèm danh sách **đã kiểm và đúng**.
  - Kèm **bản sửa dạng diff** cho từng nơi.
- **Đính chính nội dung mình đã đăng**: người dùng chọn **sửa tại chỗ comment cũ**, không đăng comment mới (05/10).
  - Đọc bản hiện tại ngay trước khi ghi.
  - Gửi nguyên văn từ file nháp.
  - Đọc lại để so khớp.
  - Thân issue nào trích comment đó cũng sửa theo.

## 7. Sau khi người dùng bảo đăng

- Đăng đúng bản nháp cuối, không sửa thêm câu chữ.
- **Đồng bộ các nơi liên quan khi người dùng yêu cầu**: dòng tóm tắt cập nhật trong body issue (đọc body mới nhất ngay trước khi sửa, chỉ thay đúng dòng đó), comment nối sang issue nhận việc (đọc hết thread issue đó trước, gồm comment của khách có thể đổi điều kiện), trang wiki (sửa đúng mục, không ghi số issue/PR vào wiki nếu dự án cấm).
- Issue nhận việc **đã có PR merge** thì ghi rõ "làm ở PR mới", không mở lại PR cũ.
- **Quyết định mới đè lên quyết định đã đăng ở issue khác** (vd "tách issue riêng" nay thành "gộp vào đây") thì báo ở chính issue đó và sửa đúng dòng liên quan trong thân issue đó.
- **Đặc tả hay quyết định đổi** thì sửa cả **tiêu đề lẫn thân** của issue nhận việc. Đầu thân dẫn permalink comment chốt, theo `../delivery-write-issue/SKILL.md` → *Giọng và cập nhật issue* (§5b). Đổi mỗi tiêu đề thì thân cũ sẽ mâu thuẫn với comment.
- **Ngay trước mỗi lần ghi**, kiểm lại trạng thái live của đúng đối tượng đó (updatedAt, số comment, milestone, assignee): giữa lúc soạn và lúc đăng có thể đã có người làm. Việc đã xong thì bỏ bước và báo lại, không ghi đè (18/10: milestone #478 đã được chuyển từ hôm trước).
- **Issue liên quan do người khác giữ**: comment cho người đó trước, rồi sửa thân, dòng đầu dẫn permalink comment đó. **Do chính người nhận comment chính giữ**: không comment riêng, dòng đầu thân dẫn permalink comment chính.
- **Sửa thân hay comment dài**: lấy body thô qua JSON (không qua `--jq`, vì `--jq` thêm dấu xuống dòng). Thay đúng chuỗi bằng script, assert chuỗi đó xuất hiện đúng một lần, ghi ra file nháp. Không gõ lại cả thân.
  - Gửi: PATCH bằng `gh api … --input` file JSON. `gh issue edit` bị chặn trong Claude Code (18/10), nên dùng MCP GitHub `update_issue` với nguyên thân lấy từ file.
  - Kiểm: tải lại thân rồi so với file nháp sau khi chuẩn hoá dòng cuối, `diff <(sed -e '$a\' new.md) <(sed -e '$a\' after.md)`. Lệnh phải không in ra gì.

## 8. Checklist trước khi đưa nháp

- [ ] Đề bài đúng là **comment được chỉ**; không trả lời nhầm câu hỏi khác trong thread.
- [ ] Đã **đọc mọi trang wiki/mục mà comment trích** và tìm toàn wiki theo từ khoá.
- [ ] Đã kiểm lại **head mới nhất** của PR/develop ngay trước khi đưa nháp.
- [ ] Đã đối chiếu với **issue gốc**, không chỉ trả lời câu hỏi của người comment.
- [ ] Mọi căn cứ đã đọc lượt này; không trích nguồn team không mở được.
- [ ] Mọi field/API mới có mô tả trong text; sơ đồ khớp text; cột trong ER là cột thật hoặc `NEW`.
- [ ] Luồng nghiệp vụ từ 3 bước, có rẽ nhánh hoặc có trạng thái thì có sơ đồ mức nghiệp vụ (`../delivery-start/references/so-do.md`); sơ đồ nghiệp vụ không có tên bảng hay module.
- [ ] Không có "#<số>" nào không phải issue/PR thật.
- [ ] Quyết định của người dùng được ghi rõ và nhắc lại cuối reply.
- [ ] Có DoD sau khi chốt; mở rộng scope (nếu có) đã ghi.
- [ ] Đã liệt kê **đủ đường ghi** (tạo, sửa, sao chép, nhập) và đường đọc của dữ liệu được đề xuất.
- [ ] Câu hỏi "lưu ở đâu / chọn phương án nào" có **bản đánh giá tradeoff** theo mục 3a, không chọn chỉ vì vừa sprint.
- [ ] Mọi kịch bản tương lai dùng để lập luận đều có căn cứ ở đặc tả / ADR, không phải comment trong code.
- [ ] Đã rà **một lượt toàn bộ khẳng định** của nháp so với nguồn: số §, dòng code, số cột, ngày.
- [ ] Chưa đăng.

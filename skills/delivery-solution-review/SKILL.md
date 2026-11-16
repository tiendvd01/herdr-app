---
name: delivery-solution-review
description: "Chấm một Solution dev đã đăng trên issue / User Story ('review solution <link>', 'rà Solution', 'chấm Solution', 'review lại Solution sau khi dev sửa') ở vai Solution Architect, cho người chốt Solution (PoC / PO / lead). Kiểm bảng phủ AC, NFR, guardrail và DoD với code đã merge và đặc tả; chấm từng quyết định thiết kế theo tám mặt (vừa yêu cầu và quy mô, tái sử dụng, thiết kế hệ thống, anti-pattern, kỹ thuật, ảnh hưởng, tradeoff, chi phí hạ tầng khi đụng DevOps); soát triển khai, khả năng đảo ngược và ghi lại quyết định; tự chốt từng điểm có căn cứ; ra kết luận một trong ba mức; soạn nháp comment và các sửa đổi issue liên quan để duyệt. Có vòng review lại chỉ kiểm điểm còn mở. Không dùng để tự thiết kế (đó là delivery-dev-solution) hay review PR (delivery-pr-review)."
---

# Review Solution — vai Solution Architect

Người dùng (người chốt Solution) đưa link một comment Solution dev đăng trên US. Đầu ra: bản rà trong chat → **một file nháp** (comment trả lời + thay đổi thân các issue liên quan + việc trên board) → chờ duyệt → đăng. **Đi từng US một**, xong US này mới sang US khác.

**Người chấm đứng ở vai Solution Architect**, không phải người soát checklist. Chỉ kiểm phủ AC rồi chốt câu dev hỏi là mới làm một nửa.

Đọc trước: `../delivery-dev/references/roles.md` (output shape của phát hiện). Thông số dự án (quy mô thật, hạ tầng đang có, ai vận hành, đặc tả chuẩn nằm ở đâu) lấy từ memory dự án và rule của repo. **Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`.

## Hàng chờ — chưa có link thì tìm việc ở đây

```bash
scripts/solution_queue.py all --project "Yahagi 168"   # pending + missing; chỉ đọc
scripts/solution_queue.py pending --json               # cho delivery-start gom agenda
```

- **pending** — US có Solution được đăng, sửa hoặc báo "đã cập nhật" sau comment gần nhất của người review (mặc định: user gh đang đăng nhập; `--reviewer` để đổi). Cũ nhất lên đầu. US đã qua dev (Ready for QA trở đi) bị bỏ, trừ khi `--all`.
- **missing** — US đang làm (sprint hiện tại, hoặc Todo / In Progress) mà chưa có comment Solution. `--all` thêm US ở Backlog. Việc của người chốt là nhắc dev, không tự viết Solution thay.
- Cột `đụng:` là gợi ý theo từ khoá cho bốn nhóm phải PO duyệt (§3), không phải kết luận: vẫn đọc Solution rồi mới xếp.
- Nhận diện Solution: comment không phải của người review, có marker `<!-- …:solution … -->`, heading bắt đầu bằng "Solution", hoặc dòng đầu có chữ "Solution". Dev viết Solution kiểu khác thì script không thấy: hỏi lại dev hoặc thêm marker.

## 1. Quy trình một lượt

1. **Lượt đầu hay review lại?** Đã có comment review trước đó trên US này ⇒ làm theo §7, không chấm lại từ đầu.
2. **Đọc căn cứ** (§2). Fetch nhánh chung trước, ghi commit đã đối chiếu.
3. **Ranh giới quyền quyết định** (§3): Solution có rơi vào nhóm phải PO duyệt không; xếp mỗi phát hiện vào "phải sửa" hay "góp ý".
4. **Độ sâu tỉ lệ với cỡ Solution.** Áp chính nguyên tắc chống over-engineering cho việc review: Solution một task, không đụng schema hay quyền thì mỗi mặt một dòng, không viết bài dài. Solution đụng kiến trúc, dữ liệu, quyền hay hạ tầng thì chấm đủ.
5. **Chấm ba lớp** (§4). Cả ba bắt buộc, độ dài theo bước 4.
6. **Chốt từng điểm** (§5) và **ra kết luận** (§6).
7. **Bản rà trong chat** theo sáu phần: story yêu cầu gì · dev đề xuất gì (nói bằng lời, không chép) · đúng / thiếu / thừa so với story, có đối chiếu code · đánh giá thiết kế vai SA · từng câu dev hỏi kèm ví dụ cụ thể, phương án và chốt · ước lượng. Kết luận đứng đầu bản rà. Người dùng hỏi sâu thêm về kiến trúc (strategy / registry, vòng đời đối tượng, outbox, circuit breaker…) thì trả lời bằng code thật của repo, dẫn path.
8. **Nháp** (§8), soát checklist (§10), chờ duyệt, rồi **đăng** (§9).

## 2. Căn cứ — chỉ ba nguồn

- Đặc tả chuẩn của dự án (memory dự án nói nằm ở đâu).
- Code **đã merge** trên nhánh chung vừa fetch; ghi commit đã đối chiếu. Working tree bẩn thì đọc bằng `git show origin/<branch>:<path>`, không pull đè.
- Issue liên quan: thân, hết thread comment, milestone, assignee.

Draft PR chưa merge **không** phải căn cứ và không xuất hiện trong nháp (rebase, kích thước diff, DoD trong thân PR để dành cho lượt review PR). Ước lượng chấm theo bảng task trong chính Solution. Câu "ai review PR" không thuộc lượt này.

## 3. Ranh giới quyền quyết định giữa PO và dev

Khuôn US ghi rõ (mục *How dev takes this* trong `../delivery-backlog/assets/user_story.md`): dev chỉ chờ PO duyệt khi Solution đụng **hạ tầng, kiến trúc (module, pattern hay ranh giới context mới), mô hình dữ liệu (bảng, cột, migration) hoặc phân quyền**; còn lại dev tự quyết theo kiến trúc sẵn có.

- Bước đầu: xác định Solution có chạm nhóm trên không, ghi một dòng vào bản rà. Không chạm và không có lỗ hổng lớp 1 ⇒ review gọn, kết luận thường là "Được code ngay".
- Mỗi phát hiện gắn một nhãn:
  - **Phải sửa**: sai yêu cầu, vi phạm guardrail / rule của dự án, hoặc quyết định thuộc nhóm PO duyệt mà chưa ổn.
  - **Góp ý**: lựa chọn thuộc quyền dev (đặt tên, chia hàm, thứ tự task, cách test khác nhưng đủ). Góp ý không chặn và không tính vào kết luận. Không gắn nhãn này thì review biến thành soi từng chi tiết và dev mất quyền chủ động.

## 4. Chấm — ba lớp

### Lớp 1 — phủ yêu cầu (vai BA + QC)

1. Mỗi quy tắc và mỗi AC của story có đúng một dòng trong bảng phủ. **Mở từng test được dẫn và đọc assert**: test có thể khẳng định điều ngược lại (#708: dòng AC-11 dẫn một test assert `can_open is False`).
2. AC chỉ có test ở tầng dưới mà không có test đi qua API ⇒ yêu cầu thêm e2e, và cộng thời gian của nó vào ước lượng.
3. Lần theo dữ liệu mà luật mới đọc: mọi đường tạo / ghi có điền nó không. Đường nào bỏ trống thì luật không bao giờ bắn (#708: đăng ký case kèm yêu cầu chưa tạo workflow nên không có hạn).
4. Thân story ghi "đã xong / đã mở" mà code đã merge không có ⇒ nhận lỗi đó là của thân story ngay trong comment và sửa thân, không để dev gánh.
5. **Guardrail dữ liệu và NFR của dự án.** Đọc danh sách trong rule của repo (PWPF: `CLAUDE.md` → *Non-negotiable data guardrails*, `.claude/rules/architecture.md` → *Data guardrails*): cột chung, chỉ xoá mềm, ghi sự kiện workflow cùng transaction, phạm vi truy cập (`AccessContext`), envelope lỗi chuẩn. Cộng các NFR trong đặc tả chuẩn chạm tới story. Một Solution phủ đủ AC mà quên guardrail vẫn là thiết kế sai: mức H.
6. **DoD của US.** Từng dòng DoD trong thân story có việc tương ứng trong bảng task: cập nhật `docs/features/…`, đủ chuỗi giao diện hai ngôn ngữ, lint và test. Dòng nào không có việc ⇒ "phải sửa".

### Lớp 2 — kiến trúc (vai SA), tám mặt

Trước khi chấm, đọc rule kiến trúc của dự án: tài liệu layering, catalogue pattern và danh sách anti-pattern trong đó (PWPF: `.claude/rules/architecture.md`, `.claude/rules/design-patterns.md` → Anti-patterns). Sau đó chấm **từng quyết định thiết kế** trong Solution theo tám mặt, đối chiếu với code đã merge. Hai mặt đầu là cổng: thứ không cần thì cắt, thứ đã có thì dùng lại, rồi mới chấm chi tiết phần còn lại. Mặt "Chi phí và hạ tầng" bắt buộc khi Solution chạm hạ tầng / DevOps.

| Mặt | Câu hỏi phải trả lời |
|---|---|
| Vừa với yêu cầu | Mỗi thành phần mới (bảng, cột, endpoint, service, abstraction, config, job, cache, queue) phải truy được về một quy tắc hoặc AC của story. Không truy được thì đó là over-engineering, đề nghị cắt. **Kiểu kiến trúc phải hợp quy mô thật**, tính theo số người dùng, lượng dữ liệu và số người trong team, không tính theo "sau này có thể lớn". Ít người dùng thì dùng modular monolith, ranh giới module nằm trong code. Không tách microservice. Không dựng event bus, service mesh hay hàng đợi khi một lời gọi hàm trong cùng process là đủ. PWPF Phase 1 khoảng 100 người dùng nội bộ, nên query thẳng mà đủ nhanh thì không cần cache, read model riêng hay xử lý bất đồng bộ. Chiều ngược lại cũng là phát hiện: một quy tắc cần mà thiết kế bỏ trống. |
| Tái sử dụng | Với mỗi thứ Solution định làm mới, người chấm **tự tìm** trong code đã merge xem đã có thứ làm được việc đó chưa: helper, endpoint, bảng, component, luật nghiệp vụ, pattern. Tìm bằng CodeGraph hoặc `rg`, và dẫn path. Thứ tự ưu tiên là dùng lại nguyên, rồi mở rộng (thêm tham số, cột, biến thể, đăng ký một strategy), cuối cùng mới làm mới. Làm mới chỉ khi cái có sẵn thật sự không diễn đạt được, và Solution phải nói vì sao. Làm một bản song song với cái đã có là phát hiện. Ví dụ: viết luật lần hai, thêm endpoint thứ hai trả cùng dữ liệu, thêm component na ná. Mức H nếu là luật nghiệp vụ, vì hai bản sẽ lệch nhau. Ví dụ làm đúng là #708: phạm vi phòng ban là một tham số trên endpoint trễ có sẵn, không viết luật trễ lần hai. **Thư viện mới** cũng thuộc mặt này: trước hết tìm thư viện đã có trong dự án làm được việc đó; nếu vẫn cần thêm thì soát giấy phép, mức độ được bảo trì (bản phát hành gần nhất, số người duy trì), rủi ro chuỗi cung ứng (phụ thuộc kéo theo, mã chạy lúc cài), và cỡ bundle nếu là thư viện giao diện. |
| Thiết kế hệ thống | Đặt ở module / context nào, có đúng ranh giới không. Luồng dữ liệu đi qua đâu. Gọi chéo context qua service / port hay đọc thẳng bảng của context khác. Thêm API mới hay thêm tham số vào API có sẵn, contract đổi gì cho FE. Dữ liệu mới nằm ở bảng nào, nullable, index. |
| Anti-pattern | Lọc quyền / phạm vi trong code sau khi lấy hết dòng thay vì trong query. N+1. Rẽ nhánh theo loại thay vì registry hoặc dữ liệu. Một cổng dùng chung cho cả đọc lẫn ghi. Trừu tượng hoá sớm, tham số "để sau dùng". Rồi soát hết danh sách anti-pattern của dự án. |
| Kỹ thuật | Có đúng ở biên không: ngày giờ, múi giờ, giá trị rỗng, gửi lại, xoá mềm. Đồng thời và idempotent. Hiệu năng theo khối lượng thật: số query, index, phân trang. Quyền và lộ dữ liệu: phạm vi, IDOR, PII. Khi lỗi thì hệ thống ra sao, có log hoặc đo được không. |
| Ảnh hưởng | Blast radius: call site, module, consumer, màn hình nào đổi. Issue / US khác đang làm cùng vùng sẽ trùng, phải làm lại hay vứt đi. Phụ thuộc kỹ thuật vào issue chưa xong: nếu issue kia đổi thiết kế thì Solution này có vỡ không (câu hỏi của SA là "có vỡ không", không phải "bao giờ xong"). Test cũ nào phải sửa. Tương thích ngược của dữ liệu và API. |
| Tradeoff | Mỗi quyết định có phương án thay thế không. Dev không nêu thì người chấm tự dựng phương án chính và so: chi phí làm ngay (đo trên code), chi phí khi yêu cầu đổi, rủi ro vận hành, đường tiến hoá từ phương án này sang phương án kia. Đặc tả chỉ là một ràng buộc trong bảng so, không phải lý do chính. |
| Chi phí và hạ tầng | Bắt buộc khi Solution thêm hoặc đổi tài nguyên cloud, dịch vụ, môi trường, pipeline. Mỗi tài nguyên mới phải có **tiền tháng ước tính** cho từng môi trường, tính theo bảng giá của nhà cung cấp ở region thật, ghi nguồn giá và ngày tra. Không nhớ giá thì tra; không tra được thì ghi "chưa tra", không đoán. Phải tính cả **công vận hành**: ai trực, ai nâng cấp, ai xử lý sự cố. Một cụm Kubernetes cần người chăm, team không có DevOps riêng thì đó là chi phí thật. **Đề xuất dịch vụ vừa tầm**, ưu tiên managed và trả theo dùng. Container nhỏ chạy trên ECS Fargate, App Runner hoặc Lambda, không dựng Kubernetes / EKS cho một app nhỏ. DB dùng bản managed cỡ nhỏ. Batch dùng tác vụ chạy theo lịch, không thuê máy chạy suốt. Dùng lại hạ tầng đang có (cluster, load balancer, DB, VPC) trước khi dựng mới. Soát các khoản tốn âm thầm: NAT gateway, traffic chéo AZ, log không đặt hạn lưu, load balancer chạy không, Multi-AZ trên môi trường dev. Môi trường dev / staging chạy Single-AZ, cỡ nhỏ, tắt ngoài giờ được. Kết luận bằng con số: phương án đề xuất tốn X / tháng, phương án của dev tốn Y / tháng, chênh lệch đổi lại được gì. |

Bật thêm lens theo `../delivery-dev/references/roles.md` khi Solution chạm tới vùng đó: INFOSEC (quyền, input từ ngoài, PII), DBA (schema, migration, query trên bảng lớn), PERFORMANCE (hot path, dữ liệu lớn), SRE / DEVOPS (hạ tầng, config; đọc thêm `../delivery-dev/references/devops.md`), và **GIAO DIỆN** khi Solution có màn hình:

- đủ trạng thái đang tải, rỗng, lỗi, không có quyền;
- dùng lại component trong thư viện chung của dự án (PWPF: `frontend/src/shared/`), không dựng component na ná;
- chuỗi tiếng Anh dài hơn tiếng Nhật 1,6 đến 2 lần có làm vỡ bố cục nút, tiêu đề cột, menu không;
- mọi chuỗi đi qua từ điển hai ngôn ngữ, không viết cứng.

### Lớp 3 — đưa lên production và để lại dấu vết

**Triển khai, khả năng đảo ngược, chia bước an toàn.**

- Migration có chạy an toàn khi code cũ vẫn đang chạy không (deploy cuốn chiếu: code cũ đọc schema mới, code mới đọc dữ liệu cũ).
- Dữ liệu cũ có cần backfill không, backfill chạy ở đâu, chạy lại có an toàn không.
- Thứ tự deploy FE và BE có làm vỡ nhau không; contract đổi thì phía nào lên trước.
- Rollback thì khôi phục được gì; dữ liệu đã ghi theo cách mới có đọc được bằng code cũ không.
- **Quyết định một chiều** (xoá hay đổi tên cột, đổi contract API, xoá dữ liệu) soi kỹ hơn quyết định đảo ngược được, và phải có lý do vì sao không làm theo kiểu đảo ngược được.
- **Chia bước sao cho merge xong mỗi bước hệ thống vẫn nhất quán.** Ví dụ: thêm cột cho phép rỗng trước, backfill dữ liệu cũ, rồi mới đặt bắt buộc. Một task merge xong để hệ thống ở trạng thái nửa vời là phát hiện.

**Ghi lại quyết định.**

- Solution có quyết định kiến trúc (pattern mới, ranh giới module mới, đổi một quy ước) ⇒ phải có ADR trong thư mục quyết định của repo (PWPF: `docs/decisions/`).
- Thay đổi nghiệp vụ hoặc AC ⇒ phải cập nhật spec feature của repo (PWPF: `docs/features/<feature>.md`).
- Solution không nói sẽ cập nhật những tài liệu này ⇒ "phải sửa": thêm task. Nếu không, quyết định chỉ nằm trong một comment GitHub.

### Trình bày — sơ đồ thay chữ

Soát Solution theo bảng sơ đồ bắt buộc ở `../delivery-dev/references/writing-policy.md` §7b: luồng gọi mới hoặc đổi qua ≥ 3 thành phần, hay một lần ghi nhiều bảng trong một transaction ⇒ sequence; đổi bảng, cột ⇒ ER có đánh dấu `NEW`; đổi trạng thái ⇒ state. Một đoạn văn kể lần lượt ai gọi ai, ghi bảng nào là sơ đồ chưa vẽ.

- Thiếu sơ đồ bắt buộc ⇒ luôn đưa vào mục "Còn N chỗ" của comment, ghi rõ là bổ sung trình bày. Không đổi mức kết luận (§6): đó là cách trình bày, không phải lỗi thiết kế.
- Tả mơ hồ đến mức không chấm được Lớp 2 (không rõ ghi bảng nào, gọi qua module nào, trong transaction nào) ⇒ H, "Sửa Solution rồi review lại", nói rõ cần sơ đồ nào. Không tự đoán thiết kế rồi chấm phần mình đoán.

### Cách ghi phát hiện

Theo output shape của `roles.md`: `[H|M|L] path:line — vấn đề → hệ quả cụ thể → cách sửa`, kèm nhãn **phải sửa** hoặc **góp ý** (§3). Mặt nào không có vấn đề thì ghi một dòng kèm lý do kiểm được, ví dụ "đúng mẫu repository: bắt đầu từ `alive_stmt`, lọc phạm vi bằng `EXISTS` trong query". Thiết kế ổn cũng phải nói ổn vì sao, dẫn mẫu có sẵn mà nó dùng. "Nhìn chung ổn" không được tính là đã chấm.

## 5. Chốt từng điểm — tự chốt, không bắt user chọn

Mỗi điểm (câu dev hỏi và lỗ hổng tìm thấy) ghi đủ ba dòng:

- **Chốt:** chọn gì.
- **Căn cứ:** `path:line`, mục đặc tả, số liệu đo được.
- **Vì sao loại phương án khác:** chi phí đếm được (số call site phải sửa, ngày công), rủi ro, khung thời gian (milestone, ngày phát hành), phần việc một issue khác sẽ làm lại hoặc vứt đi.

Đã phân tích có số liệu thì không hỏi "chốt A hay B?". Chỉ đưa lên user khi nguồn mâu thuẫn (bản ghim, wiki, thân issue, quyết định cũ nói khác nhau về cùng một hành vi), nghiệp vụ chặt không có nguồn, hoặc đổi phạm vi lớn. Khi đó liệt kê nguồn nào nói gì, ví dụ cụ thể chỗ chúng ra kết quả khác nhau, 2 đến 4 phương án kèm tradeoff và khuyến nghị. **Trước khi chốt, soát giả định của chính mình bằng nguồn** (#708: ý "khối Techno có nhóm con" bị tài liệu tổ chức bác, rút lại trước khi đăng).

## 6. Kết luận — một trong ba mức

Tính trên các phát hiện nhãn **phải sửa** (góp ý không tính):

| Kết luận | Khi nào | Dev làm gì |
|---|---|---|
| **Được code ngay** | Không có phát hiện phải sửa mức H hay M | Bắt đầu code; góp ý tự cân nhắc |
| **Code được, sửa trước khi merge** | Có M, không có H | Bắt đầu code; các điểm M phải xong trong PR, người review PR kiểm |
| **Sửa Solution rồi review lại** | Có ít nhất một H | Chưa code phần bị ảnh hưởng; sửa Solution, đăng lại, vào vòng review lại (§7) |

Phát hiện mức L để dev tự quyết. Kết luận đứng **dòng đầu** của bản rà và của comment, để dev đọc một dòng là biết được làm gì tiếp.

## 7. Vòng review lại

Khi dev sửa Solution sau một lượt "Sửa Solution rồi review lại" hoặc trả lời các điểm M:

- Chỉ kiểm các điểm còn mở của lượt trước. Đóng từng điểm rõ ràng: **đã xử lý** (dẫn chỗ sửa) hoặc **chưa** (nói thiếu gì).
- Không mở lại điểm đã chốt. Không thêm góp ý mới, trừ phát hiện mức H thật sự mới (nói rõ vì sao lượt trước không thấy).
- Hết điểm mở ⇒ nói thẳng "**Duyệt**" và kết luận "Được code ngay". Còn điểm mở ⇒ giữ kết luận cũ, liệt kê đúng những điểm còn lại.

Cùng tinh thần với review PR: còn việc nhờ tác giả sửa thì chưa duyệt, duyệt đúng một lần khi đã xong.

## 8. Nháp

Bản rà trong chat theo sáu phần ở §1 bước 7, có đủ ba lớp: bảng phủ (gồm guardrail, NFR, DoD), các mặt SA kèm phát hiện, lớp 3, rồi phần chốt.

Comment trả lời đi theo thứ tự sau, văn phong theo quy ước team của dự án:

1. **Kết luận** (§6), một dòng.
2. Nhận xét thiết kế, 1 đến 3 câu: dùng lại mẫu nào, đặt đúng chỗ nào, vì sao đó là lựa chọn đúng.
3. Chốt các câu dev hỏi.
4. "Còn N chỗ em bổ sung giúp anh", đánh số. Mỗi chỗ gồm vấn đề, căn cứ và việc cần làm. Phần này gồm lỗ hổng lớp 1, lớp 3 và phát hiện SA mức H / M nhãn phải sửa. Góp ý và phát hiện mức L để trong bản rà, chỉ đưa vào comment khi sửa rẻ, và ghi rõ là góp ý.
5. Ước lượng sau khi cộng.
6. `Nguồn:` cuối comment.

Comment review cũng theo §7b: điểm nào đề xuất luồng hoặc dữ liệu khác Solution thì vẽ sequence / ER của phương án đề xuất, không tả bằng lời. Mỗi chỗ trong "Còn N chỗ" gọn trong khoảng 3 dòng; căn cứ dài (đoạn code, số liệu đo) để trong `<details>`.

Không đưa vào nháp những việc cơ học dev tự biết và CI đã chặn: đổi số ADR, đổi số migration khi trùng sau rebase (`../delivery-start/references/luat-chung.md` §5).

Vòng review lại thì comment chỉ gồm: kết luận, danh sách điểm đã đóng / còn mở, `Nguồn:`.

**Hệ quả sang issue khác:**

- Issue do **người khác** giữ ⇒ comment cho người đó trước, lấy permalink, rồi sửa thân; dòng đầu thân `> Updated YYYY-MM-DD ([comment](<permalink>)): <đổi gì>.`
- Issue do **chính người viết Solution** giữ ⇒ không comment riêng; dòng đầu thân dẫn permalink comment review.
- Assignee, milestone, sprint chỉ đổi khi đã nằm trong nháp được duyệt.

## 9. Đăng (sau khi user nói đăng)

1. **Ngay trước mỗi lần ghi**, kiểm lại trạng thái live của issue đó (updatedAt, số comment, milestone, assignee) và tải lại thân, diff với bản đã dùng để soạn. Đã có người làm thì bỏ bước và báo lại (#708: milestone #478 đã được chuyển từ trước). Thân đã lệch thì soạn lại trên bản mới.
2. Comment trước, sửa thân sau. Cách gửi thân và kiểm khớp: skill `delivery-scope-review` §7.
3. Board item: comment tóm tắt (link comment, kết luận, các điểm đã chốt, việc dev còn làm), chuyển `in_review`. Không bao giờ `done` hay `cancelled`.
4. **Bàn giao sang delivery-dev**: kết luận "Được code ngay" hoặc "Code được, sửa trước khi merge" thì comment Solution cộng comment review là đầu vào đã chốt của dev. Khi dev chạy `delivery-dev` trên issue này, phase solution lấy hai permalink đó, không thiết kế lại.

## 10. Checklist trước khi đưa nháp

- [ ] Kết luận đứng dòng đầu, đúng bảng §6 theo các phát hiện phải sửa.
- [ ] Đã ghi Solution có chạm nhóm phải PO duyệt hay không; mọi phát hiện có nhãn phải sửa / góp ý.
- [ ] Bảng phủ: mỗi quy tắc và AC một dòng; đã mở và đọc assert của từng test được dẫn.
- [ ] Guardrail, NFR và từng dòng DoD đã soát.
- [ ] Tám mặt đều có dòng; hai mặt cổng đã tự tìm code có sẵn và dẫn path; mặt chi phí có con số khi đụng hạ tầng.
- [ ] Lớp 3: triển khai, đảo ngược, chia bước; ADR / `docs/features` có task tương ứng khi cần.
- [ ] Mỗi điểm chốt đủ ba dòng (chốt, căn cứ, vì sao loại phương án khác); không hỏi user điều đã phân tích được.
- [ ] Căn cứ chỉ từ đặc tả, code đã merge (ghi commit) và issue; không nhắc draft PR; không hỏi "ai review PR".
- [ ] Solution đủ sơ đồ bắt buộc (§4 *Trình bày*), thiếu thì có trong "Còn N chỗ"; comment review vẽ phương án đề xuất khi khác Solution.
- [ ] Độ dài tỉ lệ với cỡ Solution.
- [ ] Văn phong team của dự án; `Nguồn:` cuối comment; nội dung gửi ra ngoài là nháp, chưa đăng.

---
name: delivery-runbook
description: "Soạn và chạy runbook deploy / phát hành theo khuôn 'người dùng dán, Claude kiểm, Claude tick': bước ⬜/✅ có id, mỗi bước một khối lệnh bọc { } có chặn STOP, dòng Kiểm tra ghi output mong đợi rồi ghi kết quả thật kèm ngày và run id. Gồm các cổng phải qua trước khi viết lệnh (fetch nhánh chung, plan Terraform cũ hay mới, đọc từng migration sẽ chạy, cửa sổ gián đoạn, luật promote image, khoá trước công tắc sau, revision cũ còn map nguyên secret) và vòng chạy (đọc output người dùng dán, đối chiếu, tick hoặc dừng). Dùng khi người dùng nói 'viết runbook', 'runbook deploy', 'deploy lên dev/stg/prd', 'phát hành stg', 'release', đưa issue deploy, hoặc dán output của một bước runbook ('chạy xong B4', 'output đây')."
---

# Runbook deploy — soạn, chạy, tick

Runbook là file markdown người dùng mở cạnh terminal. Người dùng dán từng khối, dán output lại vào chat; Claude đối chiếu với dòng **Kiểm tra**, tick ✅ kèm bằng chứng, hoặc dừng và nói vì sao. File là nhật ký thật của lần deploy: đọc lại sau một tuần vẫn biết bước nào chạy lúc nào, run nào, lệch gì.

**Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live): `../delivery-start/references/luat-chung.md`. Khuôn file đầy đủ, chép ra rồi điền: `references/khuon-runbook.md`. Thông số riêng của dự án (profile AWS, tên cluster, workflow, luật promote) nằm ở memory dự án, không chép vào skill.

## 1. Ai làm gì

| Việc | Ai |
|---|---|
| Soạn và sửa runbook, đọc code / workflow / plan để viết dòng Kiểm tra | Claude |
| Chạy khối có ghi: apply, deploy, tag, push, merge, sửa secret trên console | **người dùng** |
| Chạy khối chỉ đọc (`describe-*`, `get-parameter`, `gh run view`) để tự kiểm | Claude được chạy, ghi rõ "mình chạy" trong dòng kết quả |
| Tick ✅, ghi kết quả, ghi chú lệch | Claude, sau khi thấy output |
| Comment bằng chứng lên issue, báo khách, báo team | nháp → duyệt → đăng (luật chung §2) |

Claude không tự chạy bước có ghi kể cả khi có quyền, trừ khi người dùng bảo đúng bước đó. Không `git push`, `gh pr create`, `gh pr merge` (người dùng làm, dù lệnh nằm trong runbook).

## 2. Khuôn file (tóm tắt — đủ ở `references/khuon-runbook.md`)

1. Tiêu đề `# Runbook: <làm gì> — <issue>`, đoạn mở đầu giải thích ⬜ / ✅, dòng **nguồn lệnh** (file nào trong repo, ở commit nào) và **cập nhật lần cuối** kèm commit đã đối chiếu.
2. Bảng sự thật `| | Giá trị |`: commit / image / revision DB đang chạy và sẽ chạy, run plan và hạn artifact, quyền của profile CLI.
2b. **Bảng changelog `**Bản này đưa lên <env>**`** ngay dưới bảng sự thật, **mỗi PR một dòng** `| PR | Thay đổi | Người dùng thấy gì trên <env> |` — bắt buộc cho mọi runbook deploy / phát hành có đổi image. Lấy từ `git log --first-parent <commit env đang chạy>..<commit phát hành>` (ghi lệnh trên đầu bảng), không chép từ trí nhớ. Cột cuối: "Có — kiểm ở <id bước>" (PR đó **phải** có dòng Kiểm tra / Kiểm tra tay ở pha sau) hoặc "Không gì: <vì sao, có căn cứ>" (công tắc tắt, chỉ hạ tầng…). PR mang migration / hạ tầng ghi ngay trong cột Thay đổi. Bảng sự thật chỉ giữ một dòng `Có thêm so với <env> | N PR (M commit), bảng ngay dưới`, không nhét danh sách PR vào một ô. *(21/10/2026: người dùng không thấy #830 vì nó nằm giữa một ô dài; PR đã có trên develop / dev nhưng chưa lên env đích dễ bị tưởng là "đã có", bảng này nói rõ cái gì lên lần này.)*
3. `## Bốn điều phải nhớ` (3–5 mục đánh số): chỉ những thứ làm hỏng môi trường nếu quên. Mục cuối luôn là luật dán: một khối một lần dán, terminal mới dán lại bước 0, không in giá trị bí mật.
4. Pha `## Pha X — …` ngăn bằng `---`; bước `### ⬜ <id>. <tên>`, bước con `#### ⬜ <id>.<n>`; id ngắn và ổn định (A1, B6, S3.3) vì các bước khác "dán lại **B6**".
5. Dưới tiêu đề bước một dòng nghiêng: `*chỉ đọc*`, `*gán PLAN_RUN*`, `*branch phải là develop*`.
6. Khối lệnh bọc `{ … }` để một lần dán là một khối; mọi điều kiện sai in `STOP: <vì sao, làm gì>` bằng tiếng Anh và **không làm gì tiếp**. Không `return` / `exit` trong `{ }` (giết shell của người dùng): dùng `if / elif / else` lồng nhau.
7. Sau khối: `⬜ **Kiểm tra:** <output mong đợi, nguyên văn đến mức so được>`. Kiểm tra tay trên màn hình: `⬜ **Kiểm tra tay:** …`. Thao tác console: `Làm tay: <đường đi menu>`.
8. Không gạch đầu dòng trong thân bước: mỗi việc là một bước hoặc một dòng Kiểm tra. Bảng được (plan mong đợi, xử lý lỗi).
9. Cuối file: `## Kết thúc (DoD …)` — mỗi dòng `⬜ … — <id bước>` kết thúc bằng hai dấu cách; `## Khi có lỗi` bảng hai cột `Tình huống | Xử lý`; `## Ngoài phạm vi` một dòng ngăn bằng ` · `.
10. Văn xuôi tiếng Việt; lệnh, chuỗi `echo`, tên tài nguyên giữ tiếng Anh.

## 3. Bước 0 — chuẩn bị shell

Mọi runbook có bước 0 dán lại mỗi lần mở terminal:

- `export` profile, region, `AWS_PAGER=""`, `GH_PAGER=cat`, `GH_REPO`; biến môi trường (`ENV`, `PREFIX`, `CLUSTER`, host).
- Hàm `dispatch_ref_and_watch <ref> <workflow> -f …`: nhớ run id trước, dispatch, chờ run mới xuất hiện (tối đa 60 giây), in URL, `gh run watch --exit-status`. `dispatch_and_watch` là nó với ref nhánh chung.
- Chặn tài khoản: `sts get-caller-identity` khác account mong đợi thì xoá các biến môi trường và in `STOP`, để mọi khối sau rơi vào nhánh STOP thay vì chạy nhầm môi trường.
- Đọc id hạ tầng từ SSM (secret ARN chỉ in tên, subnet, SG), in một dòng `OK <env> | …` để so.

Giá trị phải chốt (commit phát hành, image) **lấy từ trạng thái live** (`/…/deploy/state`, merge commit của PR), không bắt người dùng gõ tay. Hai runbook cho hai môi trường dùng **cùng tên biến** để runbook sau "dán lại B8 của runbook dev" chạy được nguyên văn.

## 4. Cổng trước khi viết lệnh

Đi hết danh sách cho mỗi runbook mới; mục nào không áp dụng thì bỏ, đừng bỏ vì vội.

| Cổng | Kiểm gì | Viết thành gì trong runbook |
|---|---|---|
| Nhánh chung mới nhất | `git fetch`, ghi commit đã đối chiếu; có merge mới thì đọc lại đoạn liên quan | dòng "cập nhật lần cuối … đối chiếu tới `<sha>`" |
| Bản này mang gì lên | `git log --first-parent <commit env đang chạy>..<commit phát hành>`; mỗi PR: người dùng có thấy không, có cần công tắc / khoá / hạ tầng không, công tắc trên env đích đang bật hay tắt (đọc code cổng, ghi file:dòng) | bảng changelog §2 mục 2b; mỗi dòng "Có" có một Kiểm tra tay ở pha cuối |
| Hạ tầng đi cùng image | deploy đăng ký revision mới **từ revision mới nhất của family**: apply task definition (khoá, biến mới) phải xong **trước** deploy / đẩy tag, không thì bản mới chạy thiếu cấu hình | pha apply đứng trước pha phát hành; khối phát hành có chốt `STOP` khi revision mới nhất chưa mang cấu hình |
| Plan hạ tầng | artifact plan có hạn; plan lập trước một merge đụng hạ tầng là **cũ** | bảng "Mong đợi" từng stack; khối plan lại cả môi trường; dừng khi có `destroy` / `must be replaced` ngoài bảng |
| Apply từ ref nào | environment của GitHub chỉ cho ref nào; input `branch` guard | khối apply riêng cho môi trường có ref khác nhánh plan |
| Migration sẽ chạy | `git diff` thư mục migration giữa revision đang chạy và đích; **đọc từng file**: thêm hay xoá, CHECK có thể trượt trên dữ liệu có sẵn không, chạy một transaction hay nhiều | dòng sự thật số revision; ghi chú "additive" có căn cứ; cảnh báo nếu xoá cột |
| Cửa sổ gián đoạn | migration xoá / đổi thứ app cũ còn đọc + thứ tự deploy (migration → worker → api) | điều phải nhớ số 1; bước báo người dùng trước |
| Không lùi được | sau migration không rollback riêng app | điều phải nhớ "không cancel sau migration, sửa tiến"; dòng "bỏ hẳn bản" trong bảng lỗi |
| Luật promote | môi trường sau chỉ nhận image môi trường trước **đang chạy**; đọc script promote xem nó so **tag hay digest** (commit chỉ sửa hạ tầng thường cùng digest với commit trước) | khối kiểm image đang chạy ngay trước tag; bước đóng băng / mở băng deploy môi trường trước; **đẩy tag phát hành là phát hành thật**, không viết nó như bước "sẽ đỏ, vô hại" |
| Ref mỗi environment nhận | đọc `deployment-branch-policies` của **từng** environment GitHub mà workflow chạm (apply, deploy, release có thể là các environment khác nhau, nhận nhánh hay tag khác nhau) | ghi rõ ref dispatch cho từng khối; break-glass dispatch từ đúng ref được nhận |
| Merge đổi hạ tầng giữa chừng | trước mỗi pha `git fetch` lại; merge mới đụng stack / Dockerfile của môi trường đích có thể làm image định phát hành thành không hợp (vd. hạ tầng siết quyền mà image cũ chưa sửa theo) | sửa dòng `REL` và bảng mong đợi ngay, ghi ngày; báo người dùng trước bước kế |
| Apply ngoài workflow | người khác có thể apply từ máy → plan ra `No changes`, hay cấu hình đã đổi mà không có run apply | kiểm thẳng tài nguyên (`describe-*`) trước khi kết luận "chưa apply"; ghi chú lệch kèm "chưa xác minh ai apply" |
| Plan ẩn giá trị | trường `sensitive` (container definitions) không hiện trong plan | dòng Kiểm tra trên **revision đã đăng ký** sau apply |
| Khoá trước, công tắc sau | công tắc map khoá secret mà secret chưa có khoá → task không khởi động | bước ghi khoá (console) trước bước merge công tắc; PR công tắc riêng cho mỗi môi trường khi thứ tự khác nhau |
| Revision cũ map nguyên secret | revision cũ còn map cả secret sẽ nhận khoá mới | bước huỷ đăng ký revision cũ (chạy hai lần, lần hai không in gì) **trước** khi ghi khoá |
| Deploy chung nhiều PR | apply giữa hai merge làm bước "tìm plan của merge commit" lấy nhầm | thứ tự merge, "không apply ở giữa", mốc dừng chờ nếu PR kia chưa được duyệt |
| Quyền CLI | profile có / không có quyền gì (secret, snapshot) | dòng sự thật; thao tác thiếu quyền chuyển thành `Làm tay` trên console |
| Lock song song | hai run plan cùng lúc giữ lock state | dòng lỗi: chờ run kia xong rồi `gh run rerun <id> --failed` |

Điều gì chỉ suy ra (chưa thấy plan thật, chưa đo) thì viết rõ "suy từ …, chưa thấy plan thật" ngay trên bảng mong đợi.

## 5. Vòng chạy

Mỗi lần người dùng dán output:

1. Xác định output thuộc bước nào (theo dòng in ra, run id). Không chắc thì hỏi một câu.
2. Đối chiếu từng dòng Kiểm tra. Cần thêm bằng chứng thì tự chạy lệnh chỉ đọc (job summary, log run, `describe-*`) thay vì đoán.
3. **Khớp** → sửa `⬜` thành `✅` ở tiêu đề bước và dòng Kiểm tra, nối kết quả: `Đạt dd/mm HH:MMZ: <run id, revision, con số>`. Run id ghi vào chỗ `Run id: …`.
4. **Lệch nhưng giải thích được** → vẫn tick nếu an toàn, thêm `*Ghi chú dd/mm:* …` truy lệch về commit / PR / file:dòng cụ thể (ví dụ phần dư của một PR cũ chưa từng apply). Lệch đổi giả định của bước sau thì sửa luôn bước sau.
5. **Lệch không giải thích được, hoặc STOP** → không tick; nói bước nào, khác gì, mở dòng tương ứng ở `## Khi có lỗi`; chưa có dòng thì viết thêm.
6. Nói bước tiếp theo là gì (id + một câu), không tự chạy.
7. Phát hiện sai trong runbook (tên miền không phân giải, lệnh thiếu biến) → sửa file ngay, ghi chú ngày sửa và nhắc người dùng gán lại biến nếu terminal đang mở dùng bản cũ.
8. Output thiếu hoặc lạ mà khối vẫn "chạy được" (danh sách rỗng bất thường, chọn nhầm file) → nghi chính khối trước: pager của `git` nuốt output trong `{ }` (dùng `git --no-pager`), `sort | tail -1` xếp tên chữ sau tên số. Sửa khối, ghi chú, bảo dán lại.
9. Đừng chẩn đoán "treo" khi chỉ thấy một lần trạng thái chưa xong (task đang dừng, run đang chờ): đọc lại sau ~30 s. Dự đoán sai thì sửa ngay ghi chú trong file và nói rõ là mình sai.
10. Người dùng bảo Claude chạy đúng một bước có ghi → chạy, ghi "mình chạy theo yêu cầu" cạnh kết quả; bước có ghi kế tiếp vẫn hỏi lại.

Hết một pha → đề xuất comment bằng chứng lên issue (nháp: run id, output kiểm, chỉ tên khoá, không giá trị) và chờ duyệt. **Nháp phải nằm trong tin nhắn hoặc trong một file đã nêu đường dẫn _trước_ câu hỏi duyệt** — hộp hỏi đáp của app kết thúc lượt, nên "nháp ở dưới" mà không có nháp thì người dùng sẽ duyệt một thứ chưa thấy. Đăng xong tải bản đã đăng về so với nháp.

## 6. Bí mật

- Không đọc `.env`, không in, không dán giá trị bí mật vào file, chat, comment; chỉ **tên khoá**.
- Lệnh liệt kê mapping secret chỉ in `name`, không `valueFrom` đầy đủ nếu không cần.
- Kiểm token bằng tính chất không lộ giá trị (tiền tố `sl.` của token ngắn hạn, chạy `--verify` thành công).
- Script kiểm khoá ngoài repo để ở `.awog/scratch/`, đọc khoá từ chỗ người dùng chỉ, không in.

## 7. Bàn giao

| Xong | Bước tiếp |
|---|---|
| Soạn xong runbook | người dùng dán bước 0; Claude chờ output |
| Một pha đạt | nháp comment bằng chứng lên issue deploy |
| Runbook đạt hết DoD | nháp comment kết thúc; issue **để mở** nếu còn AC cho QA; cập nhật board qua `delivery-board` (không đặt `Done`) |
| Runbook môi trường trước xong | soạn / mở runbook môi trường sau, dùng lại khối bằng "dán lại" |
| Phát hiện thông số dự án mới (ref apply, luật promote, tên miền, quyền CLI) | ghi vào memory dự án |

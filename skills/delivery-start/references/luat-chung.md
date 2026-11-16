# Luật chung của bộ delivery-*

Mọi skill `delivery-*` theo các luật dưới đây. Skill con chỉ ghi phần riêng của nó và trỏ về đây; chỗ nào skill con nói khác thì skill con thắng. Thông số của team (ai là khách, xưng hô, wiki nào, board nào) nằm ở `../../sora-profile/`, không nằm ở đây. File skill tạo ra lưu ở đâu: §6.

Mỗi luật kèm sự cố đã sinh ra nó, để người đọc biết vì sao không được bỏ qua.

## 1. Đọc đủ trước khi kết luận

**1.1 Đọc hết thread comment** của issue trước khi soạn nháp hay phán duplicate / xong / bị chặn. Thân issue và mô tả PR không đủ: chuyện tách phạm vi, quyết định của PM, câu trả lời của khách đều nằm trong comment. Thread dài thì tìm theo từ khoá quyết định, nhưng vẫn đọc comment cuối của từng người.
`gh issue view <n> -R <owner>/<repo> --json comments` (hoặc MCP `get_issue`).
*Sự cố:* 28/09/2026, hai lần trong một phiên, nháp chỉ dựng từ thân issue: hai issue bị phán nhầm là trùng, và một nháp bỏ sót việc phần Dropbox đã ghi ở issue khác và PM đã đổi kế hoạch trong một comment sau.

**1.2 Fetch nhánh chung mới nhất rồi mới đọc code** để kết luận (`origin/develop` hoặc `origin/main`, theo repo). Không tin cây làm việc đang có.
- `git fetch origin && git log --oneline -5 origin/develop`; local cũ hơn thì đọc thẳng `git show origin/develop:<path>`.
- Trong comment / báo cáo ghi rõ commit đã đối chiếu (`develop @ 638d9213`), không chỉ "trên develop".
- Không fetch được thì nói rõ là đang đọc bản local có thể cũ, không khẳng định.
- Nháp soạn từ hôm trước: fetch lại và soát kết luận nào đã bị code mới lật trước khi đăng.
*Sự cố:* 01/10/2026 một comment khẳng định lỗi "vẫn còn nguyên trên develop", trong khi một PR merge cùng ngày đã sửa đúng chỗ đó; comment lạc hậu trong vòng một ngày.

**1.3 Căn cứ đặc tả lấy từ nguồn team đọc được** (wiki của team + bản ghim trong repo dev), không lấy từ kho tài liệu riêng của PM. Nguồn cụ thể từng dự án: `../../sora-profile/references/du-an-va-nguon.md`.

## 2. Cổng gửi ra ngoài

**2.1 Nháp → duyệt → kiểm live → ghi → tải về so.** Mọi thứ gửi ra ngoài (comment, thân issue, review PR, tin nhắn, trang wiki, thay đổi board) soạn đủ trong chat, rồi dừng và chờ duyệt. Chỉ bỏ cổng khi người dùng nói rõ "đăng luôn" trong lượt đó.
- Ngay trước **mỗi** lần ghi: tải lại trạng thái live của đúng đối tượng đó (updatedAt, comment mới, milestone, người nhận, thân hiện tại). Bước nào đã có người làm thì bỏ và báo lại, không ghi đè.
- Ghi xong: tải về so chuỗi với nháp, báo "khớp n/n", không báo "đã đăng" suông.
- Nháp đổi sau khi duyệt vì sự thật đổi (PR vừa merge, comment mới): sửa luôn rồi báo đã sửa gì. Đổi vì ý mới: hỏi lại.
*Sự cố:* 18/10/2026, giữa lúc soạn và lúc đăng, người dùng đã tự chuyển milestone một issue; bước đó trong nháp đã thừa.

**2.2 Yêu cầu lập kế hoạch không phải lệnh sửa board.** "Đẩy thêm task", "cập nhật plan / artifact", "re-plan" → sửa đề xuất (issue nào, ai, vì sao, ảnh hưởng tải) và liệt kê đúng các thay đổi board sẽ làm, rồi chờ. Chỉ sửa Sprint / Lane / Status / người nhận / milestone khi câu lệnh nêu đúng thay đổi đó ("gắn Sprint 2 cho #632"). Đổi người nhận việc của người khác là nhạy cảm nhất.
*Sự cố:* 28/09/2026, sau câu "đẩy thêm đi", 7 issue bị kéo vào sprint và đổi người nhận ngay; người dùng chỉ muốn artifact được cập nhật trước.

**2.3 Gắn người nhận trước khi comment.** Đợt comment báo đổi yêu cầu, chuyển việc, đổi người phụ trách: gắn assignee đúng người, gỡ người cũ, kiểm lại (GraphQL), rồi mới đăng. Comment mở đầu bằng @ người nhận mới; đổi người thì nói rõ "chuyển người nhận từ @A sang @B, vì …". Lệnh gắn bị chặn thì đưa lệnh cho người dùng tự chạy và chờ báo xong.
*Sự cố:* 12/10/2026, đợt comment sprint: comment đăng khi issue còn gắn người cũ thì thông báo đi sai người.

**2.4 Không bao giờ** `git push`, `gh pr create`, `gh pr merge`; không đặt board `Done` / `Canceled`.

## 3. Thang quyết định

Gặp một điểm chưa rõ, đi từ trên xuống, dừng ở bậc đầu tiên khớp.

| Bậc | Tình huống | Làm gì |
|---|---|---|
| 0 | Mọi trường hợp | Tra nguồn trước: đặc tả chuẩn (wiki + bản ghim của **sprint chứa issue đó**), thread issue, code đã merge. Trích nguồn nói gì, hoặc nói rõ nguồn im lặng, kèm vị trí |
| 1 | Đặc tả nói rõ, hoặc hợp lý đúng ngữ cảnh | **Tự chốt**, ghi rõ đó là quyết định kèm lý do. Không đẻ câu hỏi cho thứ tự xác nhận được |
| 2 | Đặc tả im lặng **về hành vi** hoặc tự mâu thuẫn, **và đã có PR / mock** làm một cách | **Giữ như PR / mock**, ghi "giữ như PR (đặc tả không quy định rõ)". Không bịa quy tắc mới, không chặn merge, không "chờ PM confirm" |
| 3 | Các nguồn nói ngược nhau về cùng một hành vi, **chưa có PR** (đang thiết kế / rà Solution) | **Không tự chốt trong nháp.** Nêu nguồn nào nói gì, ví dụ cụ thể chỗ chúng ra kết quả khác nhau, 2–4 phương án kèm tradeoff + đề xuất, rồi hỏi người dùng |
| 4 | Nghiệp vụ chặt mà tài liệu không ghi, hoặc bằng chứng chỉ nằm trong file không mở được | **Hỏi khách chốt** (§4), không tự xác nhận và không tự giữ như PR |
| 5 | Câu hỏi kiến trúc / thiết kế (lưu ở đâu, cache hay suy ra, ranh giới module, hạ tầng) | Lập luận bằng tradeoff; đặc tả chỉ là một ràng buộc trong bảng, không phải lý do chính. Cách chấm: `../../delivery-solution-review/SKILL.md` §4 → Lớp 2 |

Ghi chú cho từng bậc:

- **Bậc 0, bản ghim theo sprint.** Issue làm ở sprint nào thì so với bản đặc tả ghim ở sprint đó (`git show <commit ghim>:<file>`). Chỉ bắt dev sửa khi bản đó ghi rõ; nếu chỉ bản mới hơn mới nói thì đó là **thay đổi đặc tả → issue mới**, không bắt sửa trong issue cũ.
- **Bậc 2, "im lặng" phải là im lặng về hành vi**, không chỉ về thành phần. Đặc tả không nhắc modal lý do nhưng nói "chọn là đổi ngay" ⇒ modal là bước chen giữa, trái đặc tả, không được giữ.
  *Nguồn luật:* PM chốt 25/09/2026 khi review một PR có hai điểm đặc tả tự mâu thuẫn; giới hạn hành vi chốt 02/10/2026.
- **Bậc 3 và mọi câu hỏi gửi người quyết định**, kể cả mục "Cần làm rõ" của một bản review: không bao giờ hỏi trống "giữ hay bỏ?". Đi qua ví dụ thật của dự án (tên, ngày, con số), cả ca lỗi / lạm dụng và thực tế vận hành (ai chạy, bao lâu một lần, gỡ thế nào). Mỗi phương án: lợi, hại, chi phí, lệch đặc tả và ai phải duyệt; cuối cùng một đề xuất và những gì đổi trong issue / DoD nếu chọn nó. Đo trên code khi được (màn hình nào ghi cột chung nào, gửi thử API xem kết quả thật).
  *Sự cố:* 28/09/2026 hỏi PM "giữ hay bỏ" một yêu cầu phân quyền mà chưa tra wiki; 05/10/2026 kết một review bằng hai câu hỏi trống.
- **Đã phân tích có số liệu và nguồn không mâu thuẫn thì tự chốt**, không bày phương án ra bắt chọn. Mỗi điểm ghi: chọn gì, bằng chứng, vì sao loại từng phương án còn lại. Trước khi chốt, soát lại giả định của chính mình bằng nguồn. Cổng còn lại là duyệt nháp (§2.1).
- **Code "thiếu" không tự động thành issue.** Dữ liệu có trong DB mà không hiện, cột không ai ghi, hai chỗ lưu cho cùng một thứ: chỉ đề xuất issue / task khi một tài liệu **yêu cầu rõ** (tiêu chí nghiệm thu của FR, đặc tả, bảng đối chiếu, `docs/features/*`, wiki, quyết định PM trong thread). Liệt kê nguồn đã rà và câu trích. Không có thì ghi "chênh lệch đã biết, chấp nhận" và giải thích bằng ví dụ.
  *Sự cố:* 29/09/2026 đề xuất tách task cho một trường dữ liệu cũ không hiện trên màn hình; rà lại thì không có yêu cầu nào, và chính PM đã chốt điều ngược lại trong thread.

## 4. Hỏi khách

Phân điểm mở trước khi hỏi: tài liệu ghi rõ → tự chốt (bậc 1); không ghi nhưng là việc nội bộ / kỹ thuật (chia việc, chỗ đặt guard, thứ tự merge) → tự chốt hoặc hỏi người dùng (bậc 2–3); không ghi và là **nghiệp vụ chặt** (định dạng file khách dùng, quy tắc cấp số / phân nhánh / xoá, dữ liệu di trú, quyền, cách hệ thống cũ chạy) hoặc bằng chứng nằm trong file không mở được → hỏi khách. Nghi ngờ thì hỏi người dùng điểm đó thuộc loại nào.

Câu hỏi gửi khách (người nhận và cách tag: `../../sora-profile/references/van-phong.md`):

- Viết **JA + EN**. Nêu phương án Sora đề xuất kèm ví dụ và căn cứ.
- **Hạn trả lời cụ thể**: ngày + thứ (「10/2（金）までに」) và **vì sao là ngày đó** (gắn sprint, milestone, ngày chuyển đổi thật).
- **Quá hạn thì làm gì**: tiến hành theo phương án Sora; đổi sau đó là thay đổi yêu cầu; lịch có thể lùi và không do phía Sora.
- **Mời báo sớm**: có vấn đề hoặc không kịp thì báo trước hạn, để Sora chuyển phương án dự phòng hoặc đưa việc ra khỏi sprint.
- Việc cần file / dữ liệu từ khách: tách hai hạn (trả lời câu hỏi, giao file), kèm phương án khi trễ.
- Chặn đúng phần việc phụ thuộc câu trả lời; phần khác của issue vẫn làm.
- Người trong team đã hỏi khách bằng tiếng Nhật trên thread: không gạt câu đó đi; trả lời người đó bằng tiếng Việt và thêm một comment JA + EN cho khách để câu hỏi không treo.

Mọi báo cáo / artifact có một mục **"Nguồn không tìm thấy"**: file gì, ở đâu, vì sao không mở được, điểm nào phụ thuộc vào nó.

*Sự cố:* 29/09/2026 tự chốt bố cục CSV dựa trên file thật của khách mà repo dev không có, và tự chốt một quy tắc xoá mà đặc tả không ghi. Câu hỏi không có hạn thì trôi, rồi trễ hạn lại bị quy cho phía Sora.

## 5. Viết cho người đọc

- Comment / tin nhắn tiếng Việt gửi người trong team: giọng, xưng hô từng người, cách dẫn nguồn ở `../../sora-profile/references/van-phong.md`.
- Thân issue GitHub: tiếng Anh 100%, ngôi thứ ba, quy trình sửa thân khi đặc tả đổi: `../../delivery-write-issue/SKILL.md` → *Giọng và cập nhật issue*.
- Nội dung là luồng, vai trò, trạng thái hay quan hệ thì vẽ, không tả. Mức nghiệp vụ (Epic, US, rà yêu cầu, Clarification, đối soát đặc tả): `so-do.md`. Mức kỹ thuật (Solution, điều tra code): `../../delivery-dev/references/writing-policy.md` §7b.
- Không nhắc trong nháp những việc cơ học dev tự biết và CI đã chặn (đổi số ADR, đổi số migration khi trùng sau rebase). Nêu trong chat cho người dùng biết bối cảnh nếu cần.
  *Sự cố:* 17/10/2026 nháp review Solution nhắc dev đổi số ADR và migration; người dùng gạt đi vì dev tự biết.

## 6. Nơi lưu artifact

Mọi file skill tự tạo ra để lưu lâu (artifact phase của issue, nháp issue / comment / review, nháp sprint, báo cáo, runbook, bằng chứng) **lưu trong vault Obsidian `~/Documents/SoraTech/SoraVaults/`**, không lưu trong repo dev và không lưu trong scratchpad. Repo không cần `.gitignore` gì thêm, và không có nguy cơ artifact lọt vào commit / PR.

```text
~/Documents/SoraTech/SoraVaults/<dự án>/
├── issue <n>/      # mọi thứ của issue n: artifact delivery-dev (00-original … 90-decisions, evidence/),
│                   # nháp comment scope-review / solution-review, nháp review PR gắn issue, runbook của issue
├── pr <n>/         # review PR không gắn issue nào
├── sprint <N>/     # nháp sprint của delivery-backlog (epic-*/, other/, _plan/, templates/, _archive/, README.md)
├── drafts/         # nháp issue chưa có số (delivery-write-issue); đăng xong thì chuyển vào issue <n>/
├── reports/        # báo cáo delivery-report: <YYYY-MM-DD>-<loai>.md
└── runbooks/       # runbook không gắn một issue (phát hành theo version)
```

- **`<dự án>`** = thư mục có sẵn trong vault bắt đầu bằng mã dự án (số đầu tên repo: repo `168-yahagi-panwall` → `168-yahagi/`); không có thì tạo theo tên thư mục repo. Không tự đoán, lấy bằng script:
  ```bash
  P=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh)              # thư mục dự án
  T=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue 296")  # tạo nếu chưa có
  ```
- Tên thư mục có **dấu cách** (`issue 296`, `sprint 4`) → luôn bọc ngoặc kép trong lệnh shell.
- Trước khi tạo: `ls "$P"` xem đã có thư mục cho issue / sprint đó chưa; có thì dùng lại, không tạo bản thứ hai.
- **Thư mục cũ trong repo** (`tasks/<n>-*/`, `tasks/#<n>/`, `.claude/issue-drafts/`) là ngữ cảnh chỉ đọc: đọc nếu có, ghi tiếp vào vault, nói rõ với người dùng. Chỉ chuyển sang vault khi người dùng bảo.
- Ưu tiên Markdown để Obsidian đọc được. File tạm một lần (output probe, script thử) vẫn để scratchpad.
- Artifact trong vault **không ai khác thấy**: không link, không trích ID của nó trong PR / comment / issue — nội dung cần người khác đọc thì đưa vào chính comment / PR / ADR.

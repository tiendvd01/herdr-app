---
name: delivery-start
description: "Cửa vào của bộ delivery-* cho người làm PoC / PO / lead: mở phiên bằng agenda những việc đang chờ mình (Clarification quá hoặc sắp hạn, tag chưa trả lời, Solution chờ review, US đang làm mà chưa có Solution, đặc tả mới chưa ghim, người vượt ngưỡng tải), nhận một link bất kỳ rồi chuyển sang đúng skill (thông báo đổi đặc tả → delivery-spec-sync, Requirement của khách → delivery-scope-review, Epic / US / sprint → delivery-backlog, comment Solution → delivery-solution-review, PR → delivery-pr-review, board → delivery-board, tiến độ → delivery-report, issue tự code → delivery-dev, deploy / phát hành / runbook → delivery-runbook), và khi một skill xong thì gợi ý bước tiếp theo theo bảng bàn giao. Dùng khi người dùng gõ /delivery, nói 'hôm nay có gì', 'việc nào đang chờ tôi', 'agenda', 'bắt đầu phiên', hoặc dán một link mà không nói làm gì. Chỉ đọc; mọi thứ gửi ra ngoài vẫn đi qua nháp và duyệt của skill con."
---

# Delivery — mở phiên, chọn skill, gợi ý bước tiếp

Skill này không làm nghiệp vụ. Nó trả lời ba câu: **việc gì đang chờ mình**, **link này thuộc skill nào**, **xong việc này thì làm gì tiếp**. Mỗi lượt đọc lại trạng thái live: board, issue và PR là nguồn sự thật, không có file trạng thái riêng.

Thông số team (board, repo, mã dự án) nằm ở `../sora-profile/`. Router chi tiết của từng skill con giữ nguyên ở chỗ của nó, không chép sang đây: ý định trên board ở `delivery-board` §3 (P1–P10), loại báo cáo ở `delivery-report` §1.

## 1. Có link hay không

- Người dùng đưa link hoặc số issue → §3.
- Không có gì, hoặc hỏi "hôm nay có gì" → §2.

## 2. Agenda

```bash
python3 ~/.config/herdr-app/skills/delivery-start/scripts/agenda.py --project 168   # chỉ đọc, ~30 giây
python3 ~/.config/herdr-app/skills/delivery-start/scripts/agenda.py --json          # mọi dự án, cho tự xử lý
```

Mã dự án lấy theo repo đang mở: tên repo nằm trong `TAG_REPOS` của dự án nào ở `../sora-profile/scripts/projects.sh` thì dùng mã đó; không khớp thì chạy không có `--project` (bỏ qua mục đặc tả và tải).

| Mục | Nguồn | Skill xử lý |
|---|---|---|
| 1. Clarification quá / sắp hạn (field `Deadline`, mặc định còn ≤ 2 ngày) và Clarification chưa có hạn | `delivery-report` `report.sh raw` | nhắc khách, hoặc chốt theo phương án quá hạn đã ghi trong Clarification — `delivery-write-issue`, `delivery-board` P2 |
| 2. Tag chưa trả lời | `sora-mention-inbox` (`--json`, chỉ GitHub) | đọc hết thread rồi trả lời bằng skill hợp với nội dung tag |
| 3. Solution chờ review | `delivery-solution-review` `solution_queue.py` | `delivery-solution-review` |
| 4. US đang làm mà chưa có Solution | như trên | nhắc dev đăng Solution; không tự viết thay |
| 5. Đặc tả mới chưa ghim | `delivery-spec-sync` `spec-sync.sh <mã> status` | `delivery-spec-sync` |
| 6. Người vượt ngưỡng tải | `delivery-backlog` `load.py estimates` (cần `_plan/capacity.json` của sprint hiện tại) | `delivery-backlog` §B6 |

Trình bày trong chat **một bảng**, không dán nguyên output script:

- Thứ tự: quá hạn trước; rồi việc có hạn, gần hạn trước; rồi việc không có hạn, chờ lâu trước.
- Một issue xuất hiện ở hai mục (script đánh dấu "cũng ở mục 3") thì gộp một dòng.
- Mỗi dòng: việc gì, chờ bao lâu hoặc còn bao lâu, link, skill sẽ dùng.
- Tối đa khoảng 10 dòng; phần còn lại ghi số lượng theo mục.
- Nguồn nào lỗi (script in `⚠ không đọc được`) thì nói rõ mục đó chưa kiểm, không coi là "không có việc".
- Giới hạn của nguồn tag: không bắt được gọi tên không có `@`, tag trong PR, trả lời qua Slack. Nhắc khi báo.

Rồi hỏi người dùng làm việc nào trước (đề xuất dòng đầu bảng).

## 3. Link → skill

Đọc link trước khi chọn. Loại issue xem bằng field `Kind`: `bash ~/.config/herdr-app/skills/delivery-board/scripts/board.sh item <issue>`.

| Link / nội dung | Skill |
|---|---|
| File hoặc commit trong PM repo, bản thông báo đổi đặc tả, "v2.61 ra rồi" | `delivery-spec-sync` |
| Issue `Kind = Requirement` (khách tạo), hoặc "rà scope issue này" | `delivery-scope-review` |
| Issue `Kind = Epic / Story / Commitment`, hoặc việc lên sprint, chia tải | `delivery-backlog` |
| Link `#issuecomment-…` là một Solution (marker `<!-- …:solution`, heading hay dòng đầu có "Solution") | `delivery-solution-review` |
| Link pull request | `delivery-pr-review` |
| Câu hỏi về cột, field, sprint trên board | `delivery-board` (router §3) |
| Tiến độ, báo cáo tuần, milestone | `delivery-report` (router §1) |
| "Đo UI", "so với demo", "khác bao nhiêu px", AC dạng số đo, hoặc dán báo cáo diff | `delivery-ui-measure` |
| Issue `Kind = Task` hoặc bug người dùng tự code | `delivery-dev` |
| Cần hỏi khách / soạn issue mới | `delivery-write-issue` |
| Issue deploy / phát hành, "viết runbook", output của một bước runbook | `delivery-runbook` |
| Tag trên một issue bất kỳ | đọc tag, rồi theo nội dung chọn một dòng ở trên |

Không chắc thì nói link trông như loại nào và hỏi một câu, đừng đoán rồi chạy.

## 4. Xong một việc → gợi ý bước tiếp

Khi skill con xong (đã đăng, hoặc người dùng dừng), so với bảng dưới và đề xuất đúng một bước tiếp. Không tự chạy bước đó.

| Vừa xong | Bước tiếp gợi ý |
|---|---|
| Lên sprint / tạo US (`delivery-backlog`) | Theo dõi mục 4 của agenda: US nào chưa có Solution sau 2 ngày làm việc thì nhắc người nhận |
| Review Solution, kết luận "Được code ngay" hoặc "Code được, sửa trước khi merge" | Báo dev (comment review đã đủ); khi dev chạy `delivery-dev` trên issue đó, phase solution lấy hai permalink làm đầu vào, không thiết kế lại (`delivery-dev-solution` → *Solution đã duyệt*) |
| Review Solution, kết luận "Sửa Solution rồi review lại" | Chờ dev đăng lại; nó sẽ hiện ở mục 3 của agenda; vòng sau chỉ kiểm điểm còn mở (`delivery-solution-review` §7) |
| `delivery-dev` dừng ở câu hỏi nghiệp vụ (`NEEDS_PRODUCT_DECISION`) | Soạn Clarification có hạn trả lời và việc sẽ làm khi quá hạn (`delivery-write-issue`) |
| Đối chiếu đặc tả mới (`delivery-spec-sync`) | Issue bị ảnh hưởng → `delivery-scope-review`; đổi backlog → `delivery-backlog` |
| Rà scope một Requirement | Chốt xong thì bóc vào Epic / US (`delivery-backlog`); còn điểm mở thì Clarification |
| PR merged | Cập nhật tiến độ trên board (`delivery-board` P1, `report.sh drift`); issue **để mở** cho QA kiểm AC rồi QA tự đóng |
| Clarification được khách trả lời | Cập nhật thân issue liên quan theo câu trả lời (comment trước, sửa thân sau), rồi báo người đang làm |
| PR hạ tầng / bật tính năng merged, cần đưa lên môi trường | Soạn hoặc mở runbook (`delivery-runbook`); môi trường sau dùng lại khối của runbook môi trường trước |
| Runbook đạt hết DoD | Nháp comment bằng chứng lên issue deploy; issue để mở nếu còn AC cho QA |
| Issue UI "khớp demo/mockup" đã có Solution, chuẩn bị code | Chạy `delivery-ui-measure` để có số Today thật trước khi code; chạy lại ở test và verify, đính báo cáo vào PR |
| Báo cáo tuần đã gửi | Không có bước tiếp bắt buộc; mở lại agenda nếu còn thời gian |

## 5. Luật chung

Luật đầy đủ cho cả bộ, mọi skill con trỏ về đây: `references/luat-chung.md`. Tóm tắt:

- Chỉ đọc. Mọi comment, issue, thay đổi board đi qua nháp và duyệt của skill con; ngay trước khi ghi kiểm lại trạng thái live.
- Nội dung là luồng, vai trò, trạng thái thì vẽ: `references/so-do.md` (nghiệp vụ), `../delivery-dev/references/writing-policy.md` §7b (kỹ thuật).
- Board: không bao giờ đặt `Done` hay `Canceled`.
- Không `git push`, `gh pr create`, `gh pr merge`.
- Trả lời người dùng bằng tiếng Việt; nội dung gửi ra ngoài theo quy ước của skill con.

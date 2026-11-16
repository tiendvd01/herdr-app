---
name: sora-profile
description: "Hồ sơ cố định của team Sora: org structuralengine, board Sora Team (project 201), lịch sprint 2 tuần, dự án và repo issue, nguồn đặc tả từng dự án, SLA và nhịp báo cáo với Malme, sức từng người, giọng văn và xưng hô khi viết cho người trong team và cho khách. Các skill delivery-* đọc file này khi cần thông số team thay vì tự ghi cứng. Dùng trực tiếp khi hỏi 'ID board / field', 'repo issue của dự án X', 'lịch sprint', 'SLA với Malme', 'quy trình Malme ↔ Sora thế nào', 'xưng hô với ai thế nào', 'ai chốt nghiệp vụ phía khách'."
---

# Hồ sơ team Sora

Phương pháp làm việc nằm ở các skill `delivery-*`. File này chỉ giữ **thông số đổi khi đổi team**: ai, ở đâu, board nào, nhịp nào. Đổi team thì thay hồ sơ này, không sửa phương pháp.

| File | Chứa gì | Ai đọc |
|---|---|---|
| `profile.env` | org, số board, node ID, tên board, danh sách repo issue | script `board.sh`, `report.sh`, `spec-sync.sh`, `load.py` |
| `scripts/projects.sh` | `profile_project <mã>`: tên dự án trên board, các repo tính tag, PM repo, repo dev, thư mục ghim, 変更通知, mockup của từng dự án | `spec-sync.sh`, `delivery-start/scripts/agenda.py` |
| `references/quy-trinh.md` | quy trình Scrumban Malme ↔ Sora: cột, ba loại issue, DoR, SLA, các buổi, Sprint Commitment, sáu chỉ số Retro | `delivery-board`, `delivery-report`, `delivery-write-issue`, `delivery-backlog` |
| `references/board-schema.md` | field ID, option ID, bảy view, automation, công thức GraphQL của board 201 | `delivery-board`, `delivery-report` |
| `references/du-an-va-nguon.md` | nguồn nào được trích cho team, cách dùng MCP wiki PMS, ánh xạ dự án → PM repo → repo dev → wiki PMS, cấu trúc PM repo 168, năm file canon, lệnh kiểm tra repo dev | `delivery-spec-sync`, `delivery-scope-review`, mọi skill trích đặc tả |
| `references/van-phong.md` | giọng văn khi viết cho người trong team, xưng hô từng người, cách viết cho khách Malme (Fujine), nhãn Mermaid | mọi skill soạn comment, review, issue, tin nhắn |
| `assets/capacity.json` | mẫu sức từng người (cấp độ, tỉ lệ thời gian) — chép vào `_plan/` của mỗi sprint rồi sửa | `delivery-backlog` |

Script tìm hồ sơ ở `~/.config/herdr-app/skills/sora-profile`; đặt `DELIVERY_PROFILE_DIR` để trỏ hồ sơ khác. Biến `SORA_GH_OWNER`, `SORA_GH_PROJECT`, `SORA_ISSUE_REPOS` vẫn ghi đè được từng giá trị.

## Board và nhịp sprint

| | Giá trị |
|---|---|
| Org | `structuralengine` |
| Board | `Sora Team`, project **#201** (`PVT_kwDOAZdpEs4BbvaF`) |
| Nhịp sprint | **2 tuần, T2 → T6 tuần 2**: **10 ngày làm việc**. Iteration trên GitHub dài 12 ngày lịch (T2 tuần 1 → T6 tuần 2), 2 ngày cuối tuần sau đó là break. Sprint hiện tại lấy động qua `board.sh sprints` / `report.sh sprint` / filter `@current` |
| View board hay dùng | `1-Current Sprint` · `3-Waiting on Malme` · `5-Roadmap` · `6-Retro` |

**Lịch một sprint:**

```
TUẦN 1:  T2 PLANNING 60–90' cả team (+ ngay sau: PoC tạo Commitment gửi Malme)
         T3 Triage 15–30' PoC │ T6 Triage + Báo cáo Malme (+ hỏi expectation sprint sau)
TUẦN 2:  T3 Triage │ chiều T4 DEMO NỘI BỘ 45' (chỉ team) │ T5 PoC gửi list task grooming │
         T6 GROOMING đầu chiều 45' + RETRO 30' + Triage
Mỗi ngày: DAILY 10–15' — nhắn Slack 3 dòng TRƯỚC giờ họp
T2 tuần kế: PoC gửi Q&A (gom từ Grooming) cho Malme
```

## Dự án và repo

**Mỗi dự án đúng MỘT repo issue** (repo code thì nhiều). Issue của mọi repo code đều mở ở repo issue của dự án, gắn label `area:*`. PR ở repo code liên kết ngược bằng `Refs structuralengine/<repo-issue>#123`.

| Dự án (`Project` field) | Repo issue | Repo code kèm theo | PM repo (Malme) | Wiki PMS |
|---|---|---|---|---|
| `Yahagi 168` (PWPF) | `168-yahagi-panwall` | `168-yahagi-pan-wall-dx`, `panwall-dx-phase1` | `168-yahagi-pan-wall-dx` | `YAHAGI 168` |
| `Lunchbox` | `genba-bento` | | `128_lunchboxEC_pm` | `LUNCHBOX` |
| `Civilink` | `civilink-boxc` | `civilink-frontend/-backend/-common/-comparison-service/-migration-server` | | |
| `Yahagi 147` / `Yahagi 167` | `147-yahagi-ryokka-system` | `167-yahagi-sekisan-dx`, `167-yahagi-sekisan` | `147-yahagisystem-pj` | `YAHAGI 147` / `YAHAGI 167` |
| `ICT` | *(PoC chốt)* | | | |

Label còn dùng: `area:fe` · `area:be` · `area:infra` · `area:db` · `needs-doc`. Không có label trạng thái, loại hay ưu tiên: những trục đó là **project field** (`references/board-schema.md` §3).

Chi tiết đường dẫn thư mục, page ID wiki, cách lấy SHA ghim, quy ước 変更通知 và version tầng UI: `references/du-an-va-nguon.md`.

## Với khách Malme

| | Giá trị |
|---|---|
| Nhịp báo cáo | **T6 hằng tuần** cho Malme (văn bản). Báo cáo T6 tuần 1 kèm hỏi expectation của Malme cho sprint sau. Demo là buổi **nội bộ** (chiều T4 tuần 2); Malme nghiệm thu async qua checklist trong issue Commitment, không có buổi demo trực tiếp |
| SLA | Malme trả lời Clarification **3 ngày làm việc** · Sora ack Requirement 2 ngày · impact note CR 2 ngày · Malme confirm Commitment + cập nhật checklist nghiệm thu **trước Demo nội bộ (T4 tuần 2)** |
| Ba loại issue | Requirement (chỉ Malme tạo) · Task (Sora bóc) · Clarification (Sora hỏi) — `references/quy-trinh.md` §4 |

## Con người

Danh sách người, cấp độ và tỉ lệ thời gian theo từng sprint nằm ở `assets/capacity.json` (mẫu) và ở memory dự án (`team-roster.md` của 168). Giọng văn, xưng hô từng người, ai là người chốt nghiệp vụ phía khách: `references/van-phong.md`.

## Khi đổi thông số

- Board đổi số hoặc thêm field: sửa `profile.env` và `references/board-schema.md`; script tra field theo tên lúc chạy nên không cần sửa script.
- Thêm dự án: thêm một nhánh vào `scripts/projects.sh` (đủ `BOARD_PROJECT` và `TAG_REPOS`, để agenda của `delivery-start` lọc được), một dòng vào bảng trên và vào `references/du-an-va-nguon.md`, và thêm repo issue vào `ISSUE_REPOS` trong `profile.env`.
- Đổi lịch họp hoặc SLA: sửa bảng trên và `references/quy-trinh.md` cùng lúc, để hai chỗ không lệch nhau.

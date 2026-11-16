# Nháp Sprint <N> — một chỗ duy nhất

Ghi chú nội bộ, không phải issue. Mọi nháp Sprint <N> nằm ở đây, **mỗi issue đúng một file**. Sửa nháp thì sửa ở file đó, không tạo bản v2 / bản "edit" bên cạnh.

## Quy ước

- **Dòng đầu mỗi file** là `<!-- STATE: … -->`:
  - `draft` — chưa đăng.
  - `posted — GitHub matches this file (YYYY-MM-DD)` — đã đăng; file giống hệt GitHub.
  - `posted + PENDING EDIT` — đã đăng, file có sửa mà GitHub chưa có.
  - `closed` / `dropped` — issue đã đóng / bỏ nháp; ghi lý do.
- **Tên file:** đã đăng thì theo số (`705-epic.md`, `706-us-1-1.md`); chưa đăng thì theo số US (`us-2-1-….md`). Issue cũ treo dưới US: `<N>-task.md` (chưa có PR) hoặc `<N>-delivered.md` (đã có PR).
- **Issue mới (Epic, US)** chỉ sửa thân, không comment. Issue cũ đổi yêu cầu thì comment trước, rồi sửa thân. Đóng issue thì có comment khi lý do không tự hiển nhiên.
- **Đăng xong:** đổi dòng STATE, tải thân trên GitHub về so với file, ghi một dòng vào "Sổ đã đăng".
- `_archive/` là bản cũ, chỉ để tra; `_plan/` là trang duyệt / kế hoạch; `templates/` là mẫu issue.

## Ai làm gì

| Bước | Ai | Ở đâu |
|---|---|---|
| Định nghĩa Epic + US (mục tiêu, quy tắc nghiệp vụ, AC, DoD) | PM | Issue Epic, issue US |
| Bóc task, lên Solution (thiết kế, dữ liệu, API, rủi ro, ước lượng, bảng phủ) | Dev nhận US | Sub-issue dưới US + comment "Solution" trên US |
| Review Solution — chỉ khi đụng hạ tầng, kiến trúc, bảng hoặc cột dữ liệu mới, phân quyền | PM | Trả lời comment Solution |
| Code theo task | Dev | PR `Refs #<task>` và `Refs #<US>` |
| Test theo AC + DoD của US | Tester | Trên US, đóng US khi đạt |

PM không ghi ước lượng / khối lượng vào Epic, US hay cam kết sprint; dev tự ước lượng trong Solution.

## Chỉ mục

### Epic <k> — <tên>

| Loại | Issue | US | Trạng thái | File |
|---|---|---|---|---|
| Epic | #<n> | — | Nháp | `epic-<k>-<slug>/epic.md` |
| US | #<n> | <k>.1 | Nháp | `epic-<k>-<slug>/us-<k>-1-<slug>.md` |
| Issue cũ → task | #<n> | — | Nháp (comment + thân mới) | `epic-<k>-<slug>/<n>-task.md` |
| Issue cũ → phần đã giao | #<n> | — | Nháp (chỉ comment) | `epic-<k>-<slug>/<n>-delivered.md` |

### Không thuộc US nào

| Loại | Issue | US | Trạng thái | File |
|---|---|---|---|---|
| Hỏi khách | — | — | Nháp | `other/clar-01-<slug>.md` |
| Cam kết sprint | — | — | Nháp | `other/sprint<N>-commitment.md` |

## Việc còn treo

### Quyết định cần PM chốt (nháp đã ghi sẵn một lựa chọn)

1. <điểm> — <lựa chọn đang ghi trong nháp>

### Việc nhỏ khác

- <…>

## Sổ đã đăng

| Ngày | Việc |
|---|---|

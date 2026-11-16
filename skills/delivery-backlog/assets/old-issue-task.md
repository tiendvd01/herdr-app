<!-- STATE: draft — not posted (comment + new body) -->
<!-- Existing issue #<N> · assignee @<login> · no PR (<PRs that only mention it, checked via the timeline on YYYY-MM-DD>) · milestone <old> → <new> · labels today: <…> · action: comment, then replace title + body, add as a sub-issue (task) of the US -->
<!-- NOTE for <PM>: anything the PM must know before approving (not posted). -->

## Comment (VI)

<@login + lời chào theo người nhận — xem ../../sora-profile/references/van-phong.md §2>, <anh/em> báo: Sprint <N> làm theo Epic + User Story, mỗi Epic có một người đảm nhiệm chính. #<N> thành **task** của US mới #<US>, thuộc Epic #<Epic> (<tên Epic bằng lời>) do <người> sẽ đảm nhiệm chính<, nên … chuyển người nhận từ @<cũ> sang …>. #<N> chưa có PR nên nhận luôn yêu cầu mới; ngay sau comment này <anh/em> thay tiêu đề và thân issue.

**Thay đổi gì:**
- <thông báo thay đổi vNN §NNN (gửi DD/MM): nói bằng lời, không để mã trần>
- <phần của thân cũ đi đâu (issue nào nhận)>

**Phạm vi task này:** <quy tắc nào / AC nào của US; phần nào là task khác>

**Cách làm:** quy tắc nghiệp vụ và AC nằm trên US #<US>, không chép lại vào đây. Người nhận US đăng comment Solution trên US, cuối Solution có bảng phủ (mỗi quy tắc và AC → task nào làm, test nào chứng minh); #<N> là một dòng trong bảng đó. Solution nào đụng hạ tầng, kiến trúc, bảng hoặc cột dữ liệu mới, hay phân quyền thì chờ <anh/em> review rồi mới code; còn lại <em/anh> tự chốt và làm theo kiến trúc có sẵn. PR ghi `Refs #<N>` và `Refs #<US>`.

**Nguồn:**
- `docs/requirements/source/<file>.md@<sha>` (<tên tài liệu> v<x>): §x.y, FR-…
- Thông báo thay đổi vNN §NNN
- Wiki: [<trang>](<link PMS wiki>)

## New title (EN)

[Task] <what this task delivers, in one line>

## New body (EN)

> Rewritten YYYY-MM-DD as a task of #<US>, following <COMMENT_PERMALINK — fill after posting>. The previous body stays in the edit history. Pinned spec: 要件一覧 v<x> / 機能仕様書 v<y> (`docs/requirements/source/` at `<sha>`).

Kind: Task · Labels: epic:<E0x-…> · Parent: #<US> · Milestone: <vX.Y>

## Parent story

#<US> — <story title>. Its business rules and acceptance criteria are the requirement; this task does not restate them.

## What this task covers

Business rules <…> of #<US>, and the acceptance criteria that test them (AC-<…>).

## Not in this task

- <item> — <issue that owns it>

## Done when

- [ ] The rules and ACs above pass on staging (QA checks them on #<US>)
- [ ] The PR says `Refs #<this task>` and `Refs #<US>`
- [ ] The coverage table in the story's Solution points at this task for each rule it covers

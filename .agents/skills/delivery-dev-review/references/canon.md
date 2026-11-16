# delivery-dev-review · Đối chiếu tài liệu & canon

**Nạp khi:** PR feature / đụng logic nghiệp vụ, hoặc diff sửa `docs/`/spec, hoặc code cite requirement-ID.

Phần mở rộng của `../SKILL.md` (Phase 10). Core giữ template, severity và gate; file này là **cách làm**. Nạp xong thì ghi tên file vào dòng `References đã nạp` ở mục _Scope_ của `review.md`.

## Đối chiếu tài liệu & canon (kể cả canon NGOÀI repo / wiki)

`§5 đọc ngoài diff` là đọc ngoài diff **trong code**. Mục này là đối chiếu ngoài diff **trong tài
liệu** — dễ bị bỏ vì reviewer chỉ nhìn `docs/` trong repo. Với PR chạm một feature/spec:

**Hai trục tách bạch — đừng gộp:**
- **Trục thẩm quyền (requirement đúng/sai):** canon là 正本 do dự án khai báo (`context.md` → Repo Facts → **Canon source**) — có thể
  là **wiki / PM tool / docs repo**; **đừng mặc định repo, cũng đừng hard-code "wiki"**. Canon **bản
  mới nhất thắng**; canon (bản mới) khác mirror trong repo ⇒ **finding "mirror lag → sync"**, không im
  lặng theo mirror. Chỉ *cần làm rõ* khi **cùng version mà lệch nội dung**, hoặc một bên không đọc được
  version. Impl **nới một "Must" của canon thành conditional** chỉ là finding **nếu canon bản-mới-nhất
  vẫn giữ Must**; nếu canon đã supersede thì đúng — vẫn ghi "mirror committed lag → sync".
- **Trục citation:** ID cite trong **code committed** phải resolve tới **file committed**, *dù* 正本 ở
  ngoài repo (người đọc code có thể không có quyền wiki; ID wiki dễ rot). Cite chỉ resolve tới
  canon-ngoài-repo = finding hygiene, **kể cả khi thiết kế đúng canon**. Hai trục độc lập.

- **Tìm canon thật, đừng dừng ở `docs/` của repo.** Nhiều dự án giữ 正本 (機能仕様書 / 要件一覧 /
  ADR / design set) ở **nơi khác**: PM repo, hoặc **wiki** — nơi nào thì đọc ở Repo Facts → Canon source
  (wiki dạng PMS: `wiki_list_projects` → `wiki_search` → `wiki_get_page`). Một tham chiếu kiểu `機能仕様書 §3.6`
  **KHÔNG phải `UNKNOWN`** nếu canon nằm trên wiki — **đọc nó**. Chỉ ghi `UNKNOWN` khi đã thử mọi
  nguồn (repo + wiki + PM tools) mà vẫn không với tới.
- **Không nguồn nào mặc định là chuẩn — lấy bản MỚI NHẤT.** `docs/` trong nhánh và canon ngoài repo lệch version
  theo **cả hai chiều**: khi thì repo cũ hơn wiki (repo v3.19 / wiki v3.20), khi thì dev sửa `docs/`
  trong nhánh trước rồi mới sync lên wiki. Cách làm:
  1. Thu thập **song song** cả hai nguồn cho cùng một spec.
  2. Đọc **version + ngày cập nhật** ở từng nguồn (header version, changelog, ngày sửa trang wiki,
     `git log -1 --format=%cs -- <file>`) rồi so. Bản mới hơn = chuẩn; bản cũ chỉ để soi phần chênh.
  3. **Version bằng nhau mà nội dung lệch**, hoặc một nguồn không đọc được version ⇒ đưa vào _Cần làm rõ_,
     đừng tự đoán bản nào đúng.
  4. Ghi vào `review.md`: nguồn đã quét, version từng nguồn, **bản nào được chọn làm chuẩn**.
- **Mẹo khi canon là wiki PMS** (tool tên `mcp__<server>__wiki_*` — tên server khác nhau theo máy; chưa nạp thì `ToolSearch` với `wiki search page`):
  URL `.../wiki?sp=<projectId>&spage=<pageId>` → `wiki_get_page(pageId=<spage>)`; link chia sẻ công khai
  → `wiki_get_shared_page`; không có URL → `wiki_search` theo mã ticket / FR / tên feature, hoặc duyệt
  `wiki_get_tree`. Trang lớn (SRS thường > 25k token) ⇒ lưu ra file rồi **grep/slice theo từ khoá**
  (`FR-xxx`, `AC-xxx`, tên bảng, tên state) và trích **nguyên văn** AC/BR liên quan. Wiki chưa cấu hình /
  rỗng / 401-403 ⇒ lấy `docs/` mới nhất làm chuẩn **tạm**, ghi rõ "chưa đối chiếu được wiki — <lý do>" và
  không bịa nội dung spec; 401/403 thì báo developer cấp token mới, không đoán.
- **Đối chiếu 4 thứ, có bằng chứng:** (1) schema/DDL & field ↔ model/migration thật; (2) AC/DoD của
  issue ↔ code + test; (3) thuật ngữ (glossary — không lẫn hai cơ chế trùng tên); (4) **ngữ nghĩa
  requirement** — một chữ trong FR quyết định phạm vi (vd `参照` = xem metadata hay tải file?). Đọc
  nguyên văn FR trên canon rồi kết luận, đừng đoán.
- **Divergence code ↔ canon:** nói rõ do PR này gây ra, hay là refinement của một issue trước
  (đọc `Discrepancies`/ADR để phân biệt). Chỉ tính finding nếu **PR này** tạo/làm nặng thêm (§23).
- **Doc trong PR:** nếu PR sửa/thêm `docs/`, kiểm cross-ref resolve, AC khớp code, và các mục
  `Discrepancies` là thật (đối chiếu canon), không phải chép tay.

**Ba mục BẮT BUỘC có trong `review.md`** cho PR feature/logic (rỗng thì ghi `N/A` + lý do):
_Đối chiếu tài liệu (canon ↔ code)_, _Kiến trúc & tính nhất quán_, _Cần làm rõ_ (câu hỏi nghiệp vụ
cho PM/author — mỗi câu là một quyết định người khác phải chốt, không phải finding). Xem Template trong `../SKILL.md`.

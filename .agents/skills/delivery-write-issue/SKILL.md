---
name: delivery-write-issue
description: Soạn nội dung GitHub issue theo đúng 3 loại của quy trình Malme↔Sora — Requirement (chỉ Malme tạo), Task (Sora bóc), Clarification (Sora hỏi) — kèm đủ trường bắt buộc để qua cửa triage T3/T6 và checklist DoR 6 điều. Nội dung issue viết tiếng Anh, AC và câu hỏi kèm bản tiếng Nhật. Dùng khi người dùng muốn tạo issue, bóc task, hỏi spec.
---

# Soạn issue theo chuẩn Malme ↔ Sora

Biến mô tả thô thành nội dung issue **đạt DoR ngay từ lúc tạo**, để không bị trả về ở phiên triage T3/T6.

Skill này **chỉ soạn nội dung**. Gắn project field (`Kind`, `Status`, `Lane`, `Priority`, `Sprint`, `Estimation days`) là việc của `delivery-board` — xem §Hậu xử lý.

**Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`.

---

## 1. Ba loại issue — ai tạo gì

| Loại | Ai tạo | Khi nào | Template |
|---|---|---|---|
| `Requirement` (要件) | **CHỈ Malme** | Yêu cầu/tính năng nghiệp vụ mới | `assets/requirement.md` |
| `Task` | Sora (dev/PoC) | Bóc nhỏ Requirement để code | `assets/task.md` |
| `Clarification` (確認) | Sora (dev) | Spec thiếu / mâu thuẫn / mơ hồ | `assets/clarification.md` |

### Cách phân loại — hỏi 2 câu, không đoán bằng từ khoá

1. **Ai đang tạo?** Malme → `Requirement`. Sora → câu 2.
2. **Mục đích?** Bóc việc để code → `Task`. Hỏi để hiểu spec → `Clarification`.

Không phân loại theo "bug / feature / UI" — đó là **trục khác** (xem §2).

> **Epic / Story (từ 10/2026, PWPF):** board có thêm `Kind = Epic` và `Story`. Dựng backlog một
> sprint theo Epic + User Story (PM viết Epic + US, dev tự bóc task, issue cũ thành task hoặc phần
> đã giao) → dùng skill **`delivery-backlog`**, không dùng các mẫu ở đây.

### 🔴 Luật cứng: Sora KHÔNG tạo Requirement

Quy tắc cốt lõi 1 của quy trình giao tiếp: **chỉ Malme có quyền tạo `Requirement`.**

Khi người dùng nhờ soạn một `Requirement`:

- Soạn draft bình thường theo `assets/requirement.md`.
- **In cảnh báo:** *"Draft này Malme phải tự đăng — Sora không tạo Requirement."*
- **KHÔNG xuất lệnh `gh issue create`** cho loại này. Chỉ đưa nội dung để PoC gửi Malme.

Dev/PoC thấy spec thiếu → tạo `Clarification`, **không tự phát sinh yêu cầu nghiệp vụ**.

---

## 2. Hai trục độc lập — không trộn

| Trục | Là gì | Giá trị | Ai gắn |
|---|---|---|---|
| **Kind** (project field) | *Vai trò trong luồng Malme↔Sora* | `Requirement` · `Task` · `Clarification` · `Commitment` | `delivery-board` |
| **Issue Type** (native GitHub, cấp org) | *Bản chất thay đổi* | `Feat` `Fix` `Chore` `Docs` `Perf` `Test` `Refactor` `Style` `Spike` `Security` | Người tạo chọn trên UI |

Một `Task` sửa lỗi = `Kind: Task` + `Issue Type: Fix`. Hai trục, chọn riêng.

**Không có loại `bug`.** Bug là `Issue Type: Fix` ở trục kia.

---

## 3. Label — chỉ 5 cái

Chỉ đề xuất trong `--label`:

`area:fe` · `area:be` · `area:infra` · `area:db` · `needs-doc`

- Nhiều `area:` cùng lúc là bình thường (`--label area:fe --label area:be`).
- `needs-doc` khi đụng hạ tầng / nghiệp vụ lõi — điều kiện cuối của DoD.
- **KHÔNG** gợi ý label trạng thái / loại / ưu tiên. Những thứ đó là **project field**, gắn label sẽ tạo hai nguồn sự thật.
- Label cũ `bug` · `new-feature` · `enhancement-feature` · `enhancement-ui` **đã bị xoá khỏi repo**. Gợi ý chúng = issue mang label không tồn tại.

---

## 4. Trường bắt buộc theo loại

| Loại | Bắt buộc có |
|---|---|
| `Requirement` | Mục tiêu · **AC kiểm chứng được** · **link PM repo kèm version** · deadline mong muốn |
| `Task` | **Requirement cha** · phạm vi kỹ thuật · AC · edge case & validation · link SRS wiki · **ước lượng đã có người thứ 2 xem** |
| `Clarification` | Requirement liên quan · **câu hỏi cụ thể** · đang chặn việc gì |

### Link spec — bắt buộc dạng `<đường dẫn>@<version|SHA>`

Không chấp nhận link trần. Lý do: có version thì `delivery-scope-review` đối chiếu được issue với đúng bản đặc tả, và `delivery-pr-review` phát hiện PR đang bám spec cũ.

```
https://github.com/structuralengine/168-yahagi-pan-wall-dx/blob/.../要件一覧.md@v1.2
```

Spec gốc tiếng Nhật → **bắt buộc kèm link trang tóm tắt/SRS tiếng Việt trên PMS wiki** (DoR điều 2).
*(Wiki vẫn tiếng Việt — đó là tri thức nội bộ cho dev, khác với nội dung issue.)*

Issue chạm UI → ghi thêm dòng `UI baseline: <path>@<SHA> · <ngày> · <người xác nhận>`.

### Task chưa có Requirement cha

Quy tắc cốt lõi 2: **Task nào cũng phải có cha.** Chưa có Requirement Issue (luồng PM repo) → **bản spec cụ thể trong PM repo là cha**, link `path@version` vào ô cha.

Chỉ việc kỹ thuật nội bộ mới được không có cha — và phải **ghi rõ lý do** trong issue.

### Deadline

Quy tắc cốt lõi 3: **deadline gắn ở `Requirement`** (hoặc milestone phát hành). **Không rải xuống Task con.** Không điền deadline vào `Task`.

---

## 5. Ngôn ngữ — nội dung issue tiếng Anh, song ngữ EN/JA ở chỗ Malme đọc

**Nội dung issue viết bằng tiếng Anh**, bất kể người dùng nói chuyện với Claude bằng ngôn ngữ nào.
Những phần **Malme đọc và dùng để chấm** phải có thêm bản **tiếng Nhật**.

| Phần | Ngôn ngữ |
|---|---|
| **AC / điều kiện nghiệm thu** | 🔴 **Song ngữ EN/JA** — đây là thứ được chấm ở Demo |
| **Câu hỏi trong `Clarification`** | 🔴 **Song ngữ EN/JA** — Malme trả lời |
| **Mục tiêu của `Requirement`** | 🔴 **Song ngữ EN/JA** |
| Kết luận / quyết định quan trọng | Song ngữ EN/JA |
| Phạm vi kỹ thuật, edge case, validation, ghi chú | **Tiếng Anh** |
| AC của `Task` thuần kỹ thuật nội bộ (Malme không chấm) | Tiếng Anh là đủ |
| Tên biến, đường dẫn, lệnh, log, mã FR/§ | Giữ nguyên |
| **Trả lời cho người dùng trong chat** | **Tiếng Việt** — khác hẳn với nội dung file issue |

### Định dạng song ngữ

Dòng ngắn (AC) — một dòng, ngăn bằng `/`:

```markdown
- [ ] EN: Approver can reject with a mandatory comment / JA: 承認者は必須コメント付きで却下できる
```

Đoạn dài (câu hỏi Clarification, mục tiêu) — tách hai khối:

```markdown
**EN:**
When an order is split across two sites, which site owns the invoice number?

**JA:**
注文が2拠点に分割された場合、請求番号はどちらの拠点に帰属しますか。
```

### 🔴 Không dịch bừa

Không tự dịch sang tiếng Nhật nếu **không chắc thuật ngữ nghiệp vụ**. Ghi `<cần PoC rà bản JA>` còn hơn dịch sai một điều kiện nghiệm thu — AC sai nghĩa sẽ bị chấm sai ở Demo.

Thuật ngữ đã có trong spec gốc (`枝番`, `採番`, `書類番号`…) thì **dùng nguyên từ của spec**, không dịch lại theo ý mình.

### Tiếng Anh 100%, kể cả heading

Toàn bộ thân issue tiếng Anh, kể cả heading. Ngoại lệ duy nhất: **tên trang wiki PMS dùng làm link text** (ví dụ `4.4 — Kiến trúc hạ tầng (インフラ構成) v1.5`) giữ nguyên, vì đó là tên riêng của trang; phần giải thích quanh nó thì dịch. Soạn xong, quét thân tìm dấu tiếng Việt trước khi tạo issue. Người đọc issue gồm cả Malme và khách Nhật; heading tiếng Việt làm họ không đọc được cấu trúc.

## 5b. Giọng và cập nhật issue

**Ai đọc dòng này?** Thân issue nằm trong repo dev: team đọc, khách thì không. Viết ở **ngôi thứ ba cho team**, không viết như thư gửi khách.

**Tag:** hỏi ai thì phải @ được người đó. Kiểm trước bằng `search_users` với `q: "<tên> org:structuralengine"`; không bịa @. Người phía khách cuối thường không có tài khoản trong org (danh sách ở `../sora-profile/references/van-phong.md` §3). Khi không tag được, issue có câu hỏi cho khách theo cấu trúc:

1. Mở đầu thuật lại ở ngôi thứ ba: *"YAHAGI sent X on <date>… reading those files raised six points that only YAHAGI can settle. This issue tracks those questions and records the answers as they come back."*
2. Mục **"How these questions reach <khách>"**: kênh thật (email / Teams), ai gửi (PoC), hạn trả lời cụ thể (luật hạn: `../delivery-start/references/luat-chung.md` §4).
3. Đoạn gửi khách đặt trong khối đánh dấu để copy nguyên si sang kênh thật: `<!-- ↓↓↓ TEXT TO SEND … ↓↓↓ -->` … `<!-- ↑↑↑ … ↑↑↑ -->`. Câu "Thank you for…" thuộc về trong khối này, không phải mở đầu issue.
4. Câu trả lời nhận về thì paste lại thành comment, từng câu một.

*Sự cố:* 01/10/2026 một issue mở đầu bằng "Thank you for the metadata you sent on…" như thư gửi khách, không tag được ai, câu hỏi rơi vào không khí.

### Đặc tả đổi thì làm gì với issue đang có

| Issue | Làm gì |
|---|---|
| Đã có PR (mở hoặc đã merge) | Đã chốt theo sprint của nó. Chỉ comment **thông báo**, không đổi phạm vi; phần thay đổi thành **issue mới** |
| Chưa có PR | **Comment trước** (mốc thời gian, lý do, căn cứ: điều khoản nào của bản ghim nào) → **rồi sửa tiêu đề + thân** cho khớp, thân vẫn tiếng Anh 100% → **đầu thân dẫn permalink comment vừa đăng** (`#issuecomment-NNN`) kèm một dòng: thân viết lại ngày nào, thay cho nội dung gì, bản ghim nào đang chạy |

- Kiểm "đã có PR" bằng timeline issue (PR cross-reference có `Refs #N` hoặc tiêu đề chứa `#N`) và commit trên nhánh chung; đừng tin `gh pr list --search "#N"` (khớp nhầm).
- Phải comment trước vì có đăng mới có permalink để thân trích; lấy `html_url` trong kết quả API.
- Không mất dấu vết: GitHub giữ lịch sử sửa thân (nhãn "edited"), comment cũ không xoá.
- Dự án lên sprint theo Epic + US: issue chưa có PR thành task của US, comment chỉ còn "Thay đổi gì / Phạm vi / Cách làm / Nguồn" (`delivery-backlog`).

*Sự cố:* nếp cũ "chỉ comment, giữ nguyên tiêu đề và thân" bỏ ngày 02/10/2026: issue chạy vài tuần có vài chục comment, người vào sau không biết cái nào là chốt, mà cái sai nhất lại nằm ngay đầu trang.

---

## 6. Quy trình

1. **Phân loại** theo §1 (ai tạo + mục đích). Ambiguous thật sự → hỏi **một** câu ngắn.
2. **Đọc template** `assets/<loại>.md` để giữ đúng cấu trúc section.
3. **Khai thác hội thoại** lấy thông tin người dùng đã đưa — đừng hỏi lại.
4. **Kiểm DoR 6 điều** trước khi kết thúc (§7). Thiếu gì thì nói thẳng thiếu gì.
5. **Điền template**:
   - Giữ đúng các heading (tiếng Anh) và thứ tự section của template. Bản nháp cũ còn heading tiếng Việt thì dịch sang tiếng Anh, không bê nguyên.
   - Xoá comment `<!-- ... -->` rồi viết nội dung vào.
   - Thiếu thông tin → `<TBD>` + nêu rõ trong phần báo cáo. **Không bịa.**
   - Chỗ nào bắt buộc song ngữ mà chưa chắc bản JA → `<cần PoC rà bản JA>`.
   - Clarification hỏi về luồng hay điều kiện → kèm sơ đồ theo `../delivery-start/references/so-do.md` (khuôn "chỗ đang hỏi khách"), nhãn song ngữ `EN / JA`.
6. **Lưu file** vào thư mục `drafts/` của dự án trong vault (luật chung §6): `D=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh drafts)`. Sửa nháp của issue đã có số thì sửa ở `issue <n>/`:
   ```
   <loại>-<kebab-slug>.md
   ```
   Ví dụ: `task-import-material-master-csv.md` · `clarification-tax-rounding-rule.md` · `requirement-monthly-report-export.md`
7. **Báo cáo** theo §8.

---

## 7. Cổng DoR — kiểm trước khi giao

Sáu điều, thiếu điều nào thì **chưa được vào sprint**:

- [ ] Đúng loại issue (`Requirement`/`Task`/`Clarification`), đúng template
- [ ] Có **AC rõ ràng** + **link spec kèm version** (spec tiếng Nhật → kèm link SRS tiếng Việt trên PMS wiki)
- [ ] Đã liệt kê **trường hợp đặc biệt & validation** (3–5 dòng)
- [ ] **Hết câu hỏi mở với Malme** (còn vướng → `Clarification`, issue để `Blocked`)
- [ ] **Không trùng** với issue đang mở
- [ ] Có **ước lượng**, và **người thứ 2 đã xem**

Không tự tick hộ. Điều nào chưa đạt thì in ra `⚠️ DoR chưa đạt: điều N — thiếu ...`.

Rà DoR **hàng loạt** cho nhiều issue là việc của phiên triage (`delivery-board` P2), không phải skill này.

---

## 8. Báo cáo sau khi soạn

### Với `Task` và `Clarification`

```
Đã tạo draft: <đường dẫn tuyệt đối>/SoraVaults/<dự án>/drafts/task-<slug>.md

gh issue create \
  --repo structuralengine/168-yahagi-panwall \
  --title "<tiêu đề tiếng Anh>" \
  --body-file "$D/task-<slug>.md" \
  --label area:be

Sau khi tạo: auto-add đã đẩy issue vào cột Backlog.
→ Dùng delivery-board để gắn Kind/Priority/Sprint. KHÔNG tự gắn Status.

DoR: 5/6 — thiếu điều 6 (chưa có người thứ 2 xem ước lượng).
```

Tiêu đề issue viết **tiếng Anh**, dưới ~70 ký tự, không dấu chấm cuối.

### Với `Requirement`

**Không xuất lệnh `gh`.** Thay bằng:

```
⚠️ Requirement chỉ Malme được tạo. Draft dưới đây để PoC gửi Malme đăng.
```

---

## 9. Hậu xử lý — ranh giới với skill khác

| Việc | Thuộc skill |
|---|---|
| Soạn nội dung issue | 🟢 **skill này** |
| Gắn project field, triage, chuyển trạng thái | `delivery-board` |
| Rà DoR hàng loạt, tìm trùng | `delivery-board` P2 (triage) |
| Đối chiếu issue với đặc tả | `delivery-scope-review` |
| Ước lượng công | dev ước lượng trong Solution (`delivery-backlog` luật 3) |
| Đối chiếu bản đặc tả mới | `delivery-spec-sync` (viết SRS tiếng Việt lên wiki: chưa có skill riêng) |
| Đối soát version spec, tìm issue outdate | `delivery-spec-sync` |

**Không tự gắn `Status`.** Automation auto-add đã đẩy issue vào `Backlog`; tự set `Status` sẽ đá nhau với automation.

---

## 10. Cạm bẫy

- **Gợi ý label cũ** (`bug`, `new-feature`, `enhancement-feature`, `enhancement-ui`) — đã xoá khỏi repo.
- **Trộn `Kind` với `Issue Type`** — hai trục độc lập.
- **Link spec trần không có version** — trượt DoR điều 2, và `delivery-scope-review` không biết đối chiếu với bản nào.
- **Đặt deadline ở `Task`** — deadline thuộc `Requirement`/milestone.
- **Sora tự tạo `Requirement`** — vi phạm quy tắc cốt lõi 1.
- **AC chỉ có một thứ tiếng** — Malme chấm ở Demo bằng bản JA, dev đọc bản EN. Thiếu bản nào cũng lệch.
- **Dịch JA theo ý mình** — thuật ngữ nghiệp vụ phải lấy nguyên từ spec gốc; không chắc thì `<cần PoC rà bản JA>`.
- **Viết nội dung issue bằng tiếng Việt**, kể cả heading — chat trả lời tiếng Việt, nhưng file issue thì không (§5).
- **Thân issue viết như thư gửi khách**, hoặc @ một người không có trong org — §5b.
- **Đặc tả đổi mà chỉ comment, để thân cũ** (issue chưa có PR) — §5b.
- **Ước lượng AI coi như cam kết** — phải có người thứ 2 xem (DoR điều 6).
- **Tự tick DoR cho đủ** — thà báo 4/6 và nói rõ thiếu gì.

---

## 11. Ghi chú vận hành

- **Thư mục output:** chỉ dùng `SoraVaults/<dự án>/drafts/` (đăng xong thì chuyển file vào `issue <n>/`) — không rải draft ra repo hay thư mục riêng của tool khác. Nháp cũ ở `.claude/issue-drafts/` trong repo chỉ đọc.
- **Template nằm trong skill** tại `assets/`. Thiếu file → báo người dùng, không tự bịa cấu trúc.
- **Không overtrigger:** chỉ chạy khi người dùng muốn *tạo* issue. "Xem issue #123" không phải trigger.
- **`gh` chưa cài** → vẫn in nội dung để paste lên GitHub web.
- Repo issue theo dự án: `168-yahagi-panwall` · `genba-bento` · `civilink-boxc` · `147-yahagi-ryokka-system`.

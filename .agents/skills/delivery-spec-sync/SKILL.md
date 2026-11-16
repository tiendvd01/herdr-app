---
name: delivery-spec-sync
description: Đối soát spec mới từ repo PM của Malme với bản ghim trong repo dev và wiki PMS, rồi rà toàn bộ backlog để chỉ ra issue nào đã lỗi thời (outdate spec), issue nào phải huỷ (tính năng bị rút khỏi scope), issue nào còn thiếu (thay đổi chưa có ai làm) và issue nào bị chặn vì spec chưa chốt. Phủ cả tầng nghiệp vụ lẫn tầng UI (mockup). Dùng skill này khi người dùng nói "có spec mới không", "đối soát spec", "sync spec", "kiểm tra 変更通知", "cập nhật wiki theo spec mới", "issue nào outdate", "issue nào phải cancel", "spec đổi thì ảnh hưởng issue nào", "rà backlog theo spec", "PM repo có gì mới", "cập nhật bản ghim requirements", "changelog spec", "canon đang lệch bao nhiêu", "mockup có đổi không", "UI đổi thì issue nào sai" — kể cả khi họ chỉ hỏi "spec mới nhất là version nào" hay dán link một bản 変更通知/CHANGELOG của repo PM. Also trigger on English phrasings like "sync the spec", "which issues are outdated", "what changed in the PM repo", "check the change notice", "did the mockup change". Áp dụng cho Yahagi 168 (PWPF), 147/167, Lunchbox — mọi dự án có mô hình PM repo (Malme) ↔ repo dev (Sora) ↔ wiki PMS.
---

# Đối soát spec PM → repo dev → wiki → backlog

Skill này thi hành **luồng Change Request** và **cổng kiểm soát thay đổi** của quy trình Scrumban
Malme↔Sora (mô hình đầy đủ đã gói trong skill `delivery-board`): Malme sở hữu "cái gì",
Sora sở hữu "làm thế nào" — mọi thay đổi spec phải đi qua một cổng có **ảnh hưởng được nói rõ**.

Đầu ra của một đợt chạy là **một báo cáo đối soát** + **danh sách hành động đề xuất**, không phải
một loạt thao tác âm thầm.

**Luật chung** của bộ `delivery-*` (đọc hết thread, fetch nhánh chung, cổng nháp → duyệt → kiểm live, thang quyết định, hỏi khách): `../delivery-start/references/luat-chung.md`. Giọng văn và xưng hô trong team: `../sora-profile/references/van-phong.md`.

---

## 0. Trước khi làm bất cứ gì

1. **Đọc thoải mái, ghi phải xin phép.** Mọi lệnh trong `scripts/spec-sync.sh` là read-only, cứ chạy.
   Mọi thao tác **ghi** — comment/đóng issue, đổi field trên board 201, sửa trang wiki, mở PR sync —
   **phải trình bày nội dung dự kiến và chờ người dùng xác nhận từng nhóm**.
2. **Không `git push`, không merge PR** khi chưa được cho phép rõ ràng.
3. **Xác định dự án** (168 / 147 / 167 / Lunchbox) và **SHA canon đã ghim** trước khi chạy. Thiếu SHA
   thì lấy ở wiki trang `9.0 — Sync Ledger` §0 hoặc mô tả PR sync gần nhất (xem `../sora-profile/references/du-an-va-nguon.md`).
4. **Không bịa.** Chỗ chưa đối chiếu được thì ghi **⚠️ cần đối chiếu**, không đoán ý PM.
5. Nếu người dùng chỉ hỏi "spec mới nhất version nào / lệch bao nhiêu" → chạy bước S1 rồi trả lời,
   không chạy cả quy trình.

---

## 1. Ba tầng version + tầng UI — luật quan trọng nhất

| Tầng | Là gì | Có hiệu lực ràng buộc? |
|---|---|---|
| **PM repo (HEAD)** | Canon mới nhất, Malme cập nhật liên tục | ❌ **Chưa** — nếu chưa sync về repo dev |
| **`docs/requirements/source/` của repo dev** | 🔒 **Bản GHIM cho sprint đang chạy** | ✅ **CÓ — chỉ implement theo bản này** |
| **Wiki PMS** | Bản diễn giải tiếng Việt | 📖 Tham khảo — lệch thì file canon thắng |
| **🔴 `mockup/` của PM repo** | Canon UI — bản dev thực sự bám theo | ⚠️ **KHÔNG CÓ TẦNG GHIM** — xem luật 6 |

**Sáu luật không được phá:**

1. **Chỉ implement theo bản ghim.** 変更通知 đã gửi nhưng chưa sync = **chưa ràng buộc**.
2. **PR sync rơi vào KHE GIỮA hai sprint** — sau Demo, trước sprint kế. Một sprint không bao
   giờ được xây trên hai version.
3. **Sync giữa sprint = thay đổi scope**, không phải merge thường: qua cổng thay đổi, viết Impact
   note, **đổi chỗ** việc tương đương ra khỏi sprint, ghi quyết định lên issue Commitment.
4. **🔴 So bằng SHA, KHÔNG so bằng số version.** Malme từng ghi đè 18 thay đổi (có cả DDL) vào **cùng**
   số version mà không tăng số (đợt 09–10/09/2026).
5. **PM repo đi trước thì ghi nhận, không đổi issue**: comment lên issue "chờ §X của 変更通知 vY",
   giữ issue ở version đã ghim.
6. **🔴 Tầng ghim CHỈ phủ phần nghiệp vụ. Mockup KHÔNG có tầng ghim** — mockup đổi là có hiệu lực
   **ngay giữa sprint**, không có lớp đệm nào. Đây là điều **phải nêu trong báo cáo**, không im lặng
   chấp nhận. Thay vào tầng ghim, mockup dùng **baseline UI ghi ở wiki `9.0 — Sync Ledger`** (§4b).

---

## 2. Quy trình 6 bước

```
S1 FETCH    → version ghim ↔ canon HEAD, SHA lệch bao nhiêu, 変更通知 nào chưa sync, mockup nào đổi
S2 DIFF     → file spec nào đổi, entry CHANGELOG nào mới, § nào mới, mockup nào LỆCH baseline
S3 PHÂN LOẠI→ mỗi thay đổi: spec / requirement / UI / tài liệu họp(⛔ bỏ qua) + loại tác động
S4 RÀ BACKLOG → mỗi thay đổi → issue bị chạm → xếp vào 5 rổ (§3)
S5 CẬP NHẬT → PR ghim repo dev + trang wiki 9.x + trang nội dung + sổ 9.0 + baseline UI
S6 BÁO CÁO  → báo cáo đối soát + hành động đã xin xác nhận + đóng sổ
```

### S1 — FETCH

```bash
scripts/spec-sync.sh 168 status            # 版数 ghim ↔ canon + SHA HEAD + khối "Tầng UI"
scripts/spec-sync.sh 168 notices           # 台帳 変更通知: bản nào đã gửi / chưa gửi
scripts/spec-sync.sh 168 ui                # mockup đang sống + mockup đã _archive
```
Ghi lại: `要件 vX / 仕様 vY` (ghim) · `vX' / vY'` (canon) · SHA ghim · SHA HEAD · **baseline UI**.

### S2 — DIFF

```bash
scripts/spec-sync.sh 168 diff <SHA_ghim>      # file spec đã đổi
scripts/spec-sync.sh 168 ui-diff <SHA_UI>     # mockup nào KHỚP / LỆCH so với baseline UI
scripts/spec-sync.sh 168 commits <SHA_ghim>   # commit kể từ SHA ghim
scripts/spec-sync.sh 168 changelog 120        # entry mới của docs/CHANGELOG.md
scripts/spec-sync.sh 168 notice v8.2          # đọc trọn 1 bản 変更通知
scripts/spec-sync.sh 168 refs v8.2            # mọi #issue + mã FR/§ được nhắc trong bản đó
```

Mỗi bản `変更通知` có sẵn 2 bảng dùng được ngay: **「今回の変更まとめ」** (cột 影響 = issue bị chạm) và
**「上書き関係」** (節 nào đè lên 節 nào). **Đọc hai bảng này trước**, đừng đọc tuần tự từ đầu.

> 🔴 **`diff` có trần 300 file** (giới hạn API compare). Khoảng so xa thì lệnh **tự in cảnh báo đỏ** —
> gặp cảnh báo là kết quả ĐANG THIẾU, phải chia nhỏ khoảng so. `ui-diff` không bị trần này vì dùng
> API `commits?path=`.

### S3 — PHÂN LOẠI thay đổi

| Loại | Dấu hiệu | Xử lý |
|---|---|---|
| **Thêm** | 新設 · 追加 · FR/BR mới | → có thể phát sinh issue mới (rổ C) |
| **Sửa** | 変更 · 改訂 · 是正 · 「§X を更新」 | → issue liên quan có thể outdate (rổ A) |
| **RÚT SCOPE** | 廃止 · 実装しない · 作らない · クローズ依頼 | 🔴 → issue phải huỷ (rổ B) |
| **🔴 ĐỔI UI / MOCKUP** | `ui-diff` báo LỆCH · mockup vào `_archive` · 07-UI設計 có thư mục version mới | → issue có ảnh chụp / link màn hình cũ → **rổ A (outdate)** |
| **Chốt câu hỏi** | Q## クローズ · 確定＝着手可 | → gỡ blocked (rổ D) |
| **Tài liệu họp / bản nộp khách** | 議事録 · ヒアリング · 送付セット | ⛔ không lên changelog, không đổi issue |

> 🔴 **Đợt RÚT SCOPE là đợt nguy hiểm nhất.** Wiki đúng nhưng issue sai thì dev vẫn xây nhầm — đúng
> chuyện đã xảy ra với `#151` (đã xây master 書類番号 mà spec đã bãi bỏ). Đợt rút scope **bắt buộc**
> rà thêm: **backlog · sự kiện audit mất writer · cột CSV mất dữ liệu · tiêu đề trang wiki có số version**.

> 🔴 **Đổi UI là dạng lỗi khó thấy nhất: spec nghiệp vụ không đổi một chữ mà AC vẫn sai.**
> Không cơ chế nào ở tầng nghiệp vụ bắt được — chỉ `ui-diff` bắt được. Tiền lệ: mockup
> `mockup/_archive/phase1-提案モックv1/` đã bị bỏ và dựng lại từ đầu; issue nào còn trỏ bản cũ là
> đang trỏ vào đất chết.

### S4 — RÀ BACKLOG (phần trọng tâm — chi tiết ở `references/ra-soat-backlog.md`)

Lấy toàn bộ issue đang mở rồi đối chiếu ngược:

```bash
scripts/spec-sync.sh 168 issues-open
scripts/spec-sync.sh 168 issue FR-055      # tra theo mã yêu cầu / §  / mã WBS
```

Đối chiếu **hai chiều**: (a) từ thay đổi → tìm issue bị chạm; (b) từ issue đang mở → hỏi "mã FR/§ mà
issue này dựa vào còn sống trong canon mới không?".

**Khi `ui-diff` báo LỆCH**, rà thêm chiều thứ ba: issue nào có **ảnh chụp màn hình, link mockup, hoặc
mô tả layout** — những issue đó không nhắc mã FR/§ nào nên hai chiều trên bỏ sót hết.

### S5 — CẬP NHẬT

- **Repo dev**: PR cập nhật `docs/requirements/source/` (chép nguyên 2 dòng `版数` vào mô tả PR + SHA canon).
  ⚠️ Chỉ mở PR khi đang ở khe giữa 2 sprint, hoặc đã qua cổng thay đổi. **Không tự merge.**
  🔴 **Cơ chế đầy đủ: `references/pr-ghim-canon.md` — đọc trước khi mở PR.** Ghim bản mới làm
  **gãy âm thầm** các trích dẫn đang đúng: file bị đổi tên thường cũng bị sửa nội dung, và mục
  trong spec có thể bị đánh số lại ở upstream. Không cái nào bị lint/build bắt. Bỏ bước rà trích
  dẫn là lý do PR #692 bị `CHANGES_REQUESTED` với 11 phát hiện.
- **Wiki PMS**: trang changelog `9.x` mới + patch các trang nội dung + cập nhật sổ `9.0`.
  Quy trình, template và cạm bẫy: `references/dong-bo-wiki.md`.
- **Baseline UI**: cập nhật ở sổ `9.0 — Sync Ledger` theo §4b. **Chỉ sau khi PoC xác nhận bản mockup mới.**

### S6 — BÁO CÁO

Theo mẫu ở `references/mau-bao-cao.md`. Báo cáo là thứ mang ra **Grooming (T6 tuần 2)** hoặc **Planning**,
và phần "đang chờ Malme" đi thẳng vào **báo cáo thứ 6** cho Malme.

**Báo cáo bắt buộc có mục "Tầng UI"** khi dự án có `mockup/` — kể cả khi kết quả là "không lệch".
Im lặng ở mục này bị hiểu nhầm thành "đã kiểm và không sao", trong khi thực tế có thể là "chưa kiểm".

Thay đổi làm đổi một luồng nghiệp vụ hoặc vòng đời trạng thái ⇒ báo cáo, và trang changelog wiki, có sơ đồ trước ⇢ sau theo `../delivery-start/references/so-do.md`. Người đọc thấy ngay bước nào thêm, bước nào bỏ, thay vì so hai đoạn văn.

---

## 3. Năm rổ phân loại issue

| Rổ | Nghĩa | Bằng chứng bắt buộc | Hành động đề xuất |
|---|---|---|---|
| **A — Outdate spec** | Issue viết theo bản cũ, canon mới đã sửa. **Gồm cả issue bám mockup cũ** | mã FR/§ + version cũ ghi trong issue ↔ nội dung mới; hoặc link/ảnh mockup đã đổi | Comment "spec đã đổi" + cập nhật AC + ghi version mới; **giữ ở bản ghim nếu đang trong sprint** |
| **B — Phải huỷ** | Tính năng bị rút khỏi scope | 廃止 / 実装しない / クローズ依頼 kèm số issue | `Status = Canceled` + comment lý do + link §. **PoC bấm, không phải dev** |
| **C — Phát sinh mới** | Thay đổi chưa có issue nào phủ | § mới, không tìm được issue nào nhắc mã đó | Đề xuất **Task** mới (Sora bóc); nếu là yêu cầu nghiệp vụ mới → **Malme tạo Requirement** |
| **D — Gỡ chặn** | Câu hỏi treo đã được chốt | Q## クローズ · 【要確定】→ 確定 | `Blocked → Todo`, xoá `Waiting on`, cập nhật AC |
| **E — Không đổi** | Không bị chạm | — | Ghi vào báo cáo cho đủ, không làm gì |

**Ba luật khi đề xuất hành động:**

1. **Không tự đóng issue.** Huỷ đi qua PoC: `Status = Canceled` + comment nêu rõ § nào rút, ai chốt, ngày nào.
2. **Không tự tạo Requirement.** Yêu cầu nghiệp vụ mới là việc của Malme; Sora chỉ tạo `Task` /
   `Clarification`. Chỗ spec mâu thuẫn → `Clarification`, không tự diễn giải.
3. **Issue đang trong sprint thì không sửa scope âm thầm** — viết Impact note, đưa ra cổng thay đổi
   (đổi chỗ hoặc dời sprint sau), ghi quyết định lên issue Commitment.

---

## 4. Cổng thay đổi — quyết định nhận thay đổi lúc nào

```
Canon PM đi trước bản ghim
   │
   ├─ Đang ở KHE giữa 2 sprint  → mở PR sync, cập nhật wiki, rà backlog, vào Planning sprint kế
   │
   └─ Đang GIỮA sprint
        ├─ Không chạm việc đã cam kết → ghi nhận lên issue, giữ bản ghim, xử lý ở khe kế tiếp
        ├─ Chạm việc đang chạy        → Impact note (⏱ 2 ngày làm việc) → ĐỔI CHỖ, không cộng thêm
        └─ Lớn (>3 ngày công / chạm data model, kiến trúc) → CR 1 trang, Malme xác nhận rồi mới làm
```

Mẫu Impact note và mẫu CR: `references/ra-soat-backlog.md`.

## 4b. Tầng UI — baseline và cách ghim

Mockup **không có số 版数** (là SPA React+Vite, không phải tài liệu). **SHA commit là mốc duy nhất so được.**

### Định dạng baseline

Ghi ở wiki `9.0 — Sync Ledger`, mỗi mockup một dòng, **đủ 4 trường**:

```
mockup/pwpf-eigyo@8e73b4ac · 2026-06-22 · Thái · 2026-09-17
<đường dẫn>@<SHA>         · <ngày commit> · <người xác nhận> · <ngày xác nhận>
```

Thiếu **người xác nhận** thì baseline không có ai chịu trách nhiệm — không tính là baseline.

### Quy trình ghim

Script **chỉ đọc**, không ghi wiki. Ghim là thao tác thủ công qua MCP:

1. `scripts/spec-sync.sh <dự án> ui` → lấy SHA + ngày commit hiện tại.
2. **Trình bày cho PoC** bản mockup mới có gì khác, issue nào bị chạm. **Chờ xác nhận.**
3. `wiki_get_page` (MCP PMS wiki `sora-pms`) lấy trang `9.0 — Sync Ledger` **đầy đủ**.
4. `wiki_update_page` (MCP PMS wiki `sora-pms`) patch **chỉ dòng baseline UI**, giữ nguyên phần còn lại.
5. Ghi ngày xác nhận và tên người xác nhận thật — không ghi "AI" hay để trống.

### Liên kết vào issue

Issue chạm UI phải có dòng — cùng quy ước với `link spec@version` của DoR điều 2:

```
UI baseline: mockup/pwpf-eigyo@8e73b4ac · 2026-06-22 · Thái · 2026-09-17
```

Không có dòng này thì khi mockup đổi, **không cách nào biết issue đang bám bản nào**.

### Dự án nào áp dụng

| Dự án | `mockup/` | Ghi chú |
|---|---|---|
| **168** | ✅ `pwpf-eigyo` · `pw-adjustment-ai` (+ `_archive`) | `pwpf-eigyo` là bản 営業段階 dev thực sự bám theo |
| **147 / 167** | ✅ 5 thư mục, đổi thường xuyên hơn 168 | Chung PM repo `147-yahagisystem-pj` |
| **Lunchbox** | ❌ không có | `ui` / `ui-diff` báo lỗi rõ ràng, không im lặng trả rỗng |

---

## 5. Công cụ

```bash
scripts/spec-sync.sh --help
scripts/spec-sync.sh <168|147|167|lunchbox> <lệnh>
#   Nghiệp vụ: status · notices · notice <v8.2> · refs <v8.2> · diff <SHA> · commits <SHA>
#              changelog [n] · pinned · issue <mã> · issues-open
#   Tầng UI:   ui · ui-diff <SHA_baseline>
```

Script **chỉ đọc**, không ghi. Đường dẫn trong PM repo có dấu cách + tiếng Nhật nên script tra blob
qua git tree API (cache 15 phút) thay vì encode URL — cứ truyền tên bản dạng `v8.2` là đủ.
Nếu file mất quyền chạy sau khi apply skill, gọi `bash scripts/spec-sync.sh …`.

| Việc | Dùng gì |
|---|---|
| Đọc / sửa wiki PMS, ghim baseline UI | MCP PMS wiki (`sora-pms`: `wiki_get_page` · `wiki_update_page` · `wiki_create_page` · `wiki_search`) |
| Đổi field trên board 201 | skill **`delivery-board`** (`scripts/board.sh set …`) |
| Soạn nội dung issue mới | skill **`delivery-write-issue`**, rồi quay lại đây để gắn field |
| Issue bị ảnh hưởng / đổi backlog | skill **`delivery-scope-review`** · **`delivery-backlog`**; ước lượng lại do dev làm trong Solution (viết SRS tiếng Việt: chưa có skill riêng) |

Yêu cầu: `gh` đã đăng nhập org `structuralengine`, `jq`, `python3` (cắt trang wiki lớn).

---

## 6. Bối cảnh cố định

Bảng dự án → PM repo (Malme) → repo dev → wiki PMS và board chung: **`../sora-profile/SKILL.md`** §Dự án và repo.
Đầy đủ (đường dẫn thư mục, page ID wiki, cách lấy SHA ghim, quy ước 変更通知, quy ước version 3 trục của tầng UI): `../sora-profile/references/du-an-va-nguon.md`. Cấu hình script theo dự án: `../sora-profile/scripts/projects.sh`.

---

## 7. Cạm bẫy đã vấp — đừng lặp lại

| Cạm bẫy | Cách tránh |
|---|---|
| So bằng số version | Version có thể **đứng yên mà nội dung đổi** → luôn `compare/<SHA>...HEAD` |
| Tin bảng version ở README | Đọc dòng `**版数**` **trong chính file** (README từng lệch 3 version) |
| **Mockup bị thay / đưa vào `_archive` mà issue vẫn trỏ bản cũ** | Chạy `ui` mỗi đợt; rà issue có ảnh chụp / link màn hình, không chỉ rà mã FR/§ |
| **Version UI không nằm ở dòng `版数` như spec nghiệp vụ** | UI có **3 trục**: ô bảng `\| 版 \|` · tên thư mục (`2026-06-18-01 …v1`) · SHA commit. Mockup chỉ có SHA |
| **`diff` báo "không có file spec nào đổi" khi khoảng so quá xa** | API compare cắt ở 300 file. Lệnh tự in cảnh báo đỏ — **thấy cảnh báo là kết quả đang thiếu**, chia nhỏ khoảng so |
| **`gh api --jq` không nhận cờ `--arg` của jq** | Viết nhầm làm lệnh hỏng; nếu còn `\|\| true` thì lỗi biến thành "không có gì đổi". **Không dùng `\|\| true` cho lệnh mà rỗng nghĩa là an toàn** |
| `wiki_update_page` ghi đè cả trang | Luôn `wiki_get_page` lấy bản đầy đủ trước, chỉ patch phần thêm |
| Trang wiki quá lớn (SRS 238k ký tự) | Ghi kết quả ra file rồi cắt bằng `python3 read()[A:B]`, tách thành đợt riêng |
| Patch thân trang mà quên tiêu đề | Tiêu đề trang có số version thì phải đổi theo |
| Đợt rút scope chỉ sửa wiki | Phải rà thêm backlog + audit event + cột CSV (giữ cột, xuất trống) |
| Sửa quá tay | Chỉ sửa đúng chỗ canon nói; chỗ nghi ngờ đánh ⚠️ rồi mở `Clarification` |
| Merge PR sync vào giữa sprint | PR sync rơi vào khe giữa 2 sprint; giữa sprint phải qua cổng thay đổi |
| **Báo cáo bỏ trống mục "Tầng UI"** | Im lặng bị hiểu là "đã kiểm, không sao". Luôn ghi rõ đã kiểm hay chưa kiểm |

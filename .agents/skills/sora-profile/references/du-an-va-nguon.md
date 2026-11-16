# Nguồn dữ liệu theo dự án

Tra bảng này trước khi chạy bất cứ lệnh nào. Cột nào ghi *(chưa chốt)* thì hỏi người dùng, đừng đoán.

---

## 0. Nguồn nào được trích cho team

- **"Wiki" trong mọi dự án Sora là PMS wiki** (`https://pms.sora-techs.com`), nơi giữ bản đặc tả chuẩn (要件一覧 / 機能仕様書 / thiết kế), không phải wiki nội bộ của AWOG.
- **Căn cứ đưa vào comment / câu trả lời** là trang wiki PMS (tên trang + mục) hoặc path **bản ghim trong repo dev** (§3). **Không trích path PM repo**: PM repo thường đi trước bản ghim (chưa ràng buộc) và không chia sẻ được cho team (có tài liệu thương mại), nên path trong đó vô nghĩa với người đọc. PM repo chỉ dùng tham khảo nội bộ khi người dùng bảo "dò repo PM", và khi dùng thì nói rõ nó lệch bản ghim thế nào. *(24/09/2026: giải thích một mục thông báo thay đổi bằng file trong PM repo, người dùng nhắc lại.)*
- Bản trên wiki thường **mới hơn** version mà issue GitHub tham chiếu (168: một issue dẫn 仕様 v2.14 trong khi wiki đã tới v2.36), nên đối chiếu wiki là bắt buộc để không làm theo đặc tả cũ.

**Dùng MCP PMS wiki:**
- Tools `mcp__sora-pms__wiki_*` (server `sora-pms`, endpoint `https://pms.sora-techs.com/mcp`; đi qua AWOG thì tên server có thêm hậu tố id: `mcp__sora-pms_<id>__wiki_*`). Tên cũ `papay-pms` / `pms.papay.vn` đã bỏ từ 22/10/2026. `projectId` lấy ở §1, không đoán, không dùng của dự án khác.
- URL `/user/wiki?sp=<projectId>&spage=<pageId>` → `wiki_get_page` với `pageId` = giá trị `spage`. `wiki_get_tree` để duyệt cây. `wiki_search` khớp cả nội dung (`mode: any` hoặc cụm trong ngoặc kép) nhưng vẫn hay phải duyệt cây. Trang lớn: `wiki_get_page` với `maxBytes: 0` rồi cắt bằng python.
- Cách nối MCP trên từng máy (token, header) là chuyện của máy đó, không ghi ở đây.

---

## 1. Bảng ánh xạ

| Dự án | PM repo (Malme — canon) | Repo dev (issue + bản ghim) | Wiki PMS | `Project` trên board 201 |
|---|---|---|---|---|
| **Yahagi 168 (PWPF / パンウォールDX)** | `structuralengine/168-yahagi-pan-wall-dx` | `structuralengine/168-yahagi-panwall` | `YAHAGI 168` — `019efd61-1934-75ee-b552-0a3c1ad65f54` | `Yahagi 168` |
| Yahagi 147 | `structuralengine/147-yahagisystem-pj` | `structuralengine/147-yahagi-ryokka-system` | `YAHAGI 147` — `019efeb0-d0af-716e-9604-5d848faba1eb` | `Yahagi 147` |
| Yahagi 167 | `structuralengine/147-yahagisystem-pj` | `structuralengine/147-yahagi-ryokka-system` | `YAHAGI 167` — `01a07b17-4854-7644-8695-20e946e22ede` | `Yahagi 167` |
| Lunchbox (Mogupochi) | `structuralengine/128_lunchboxEC_pm` | `structuralengine/genba-bento` | `LUNCHBOX` — `019efd61-1148-7174-ae92-d68c00d43b5b` | `Lunchbox` |
| Civilink | *(không có PM repo — spec đi thẳng qua issue)* | `structuralengine/civilink-boxc` | `CIVILINK` — `019efd61-16b5-7688-a8ca-444dfdd057d4` | `Civilink` |
| ICT | *(chưa chốt)* | *(chưa chốt)* | `ICON` — `019efd61-15f1-71be-82f4-e8e5c3498fee` | `ICT` |

> Dự án **không có PM repo** thì bỏ bước S1/S2 theo file; nguồn thay đổi là **Requirement issue do Malme
> cập nhật** (luồng 6.4). Phần rà backlog (S4) và cập nhật wiki (S5) vẫn giữ nguyên.

---

## 2. Cấu trúc PM repo 168 (mẫu chuẩn — các dự án khác tương tự nhưng đặt tên khác)

| Thư mục | Chứa gì | Có phải nguồn spec? |
|---|---|---|
| `02-要件定義/` | 要件一覧 (danh mục yêu cầu, mã `FR-###`/`BR-###`/`CR-###`) | ✅ canon |
| `05-仕様書/` | 機能仕様書 (đặc tả chức năng, `§` theo chương) | ✅ canon |
| `07-UI設計/` | IA, thiết kế màn hình. Version ở **tên thư mục** (`2026-06-18-01 …IA設計v1`) và ô bảng `\| 版 \|`, **không** ở dòng `版数` | ✅ canon UI |
| 🔴 `mockup/` | SPA React+Vite. **147/167: bản dev bám theo** (5 thư mục). 168: `pwpf-eigyo` · `pw-adjustment-ai` — từ 20/10/2026 chỉ để tra, xem dòng `frontend/`. Loại trừ `_archive` | ✅ canon UI (147/167) |
| `06-スケジュール/` | WBS (`T-###`), 工程表 | ✅ ảnh hưởng ước lượng |
| `90-PJ管理/オフショア/…画面仕様変更 通知/` | **変更通知** — bản tin thay đổi gửi offshore | 🔴 **cửa chính của thay đổi** |
| `docs/CHANGELOG.md` | Nhật ký cập nhật tài liệu, ghi rõ version mới | ✅ mốc đối soát |
| 🔴 `frontend/` (168) | **Demo Malme — 168 phải khớp UI 100%** (PM chốt 20/10/2026). Malme gọi là 「デモ（168 frontend）＝あるべき姿」 và soi stg theo bản này. Đổi liên tục → luôn trích kèm SHA; baseline ở wiki 9.0 §4b. Không chép giàn giáo demo (đổi người dùng, dữ liệu mock) | ✅ **canon UI 168** |
| `frontend-phase2/`, `frontend-redesign/` | Prototype mock khác (`モックデータ駆動`, không backend). Chưa rõ vai trò | ⚠️ hỏi PoC Malme trước khi đưa vào phạm vi |
| `01-ヒアリング/`, `09-コミュニケーション/`, `10-成果品/`, `_archive/` | biên bản họp, bản nộp khách, bản cũ | ⛔ không đồng bộ |

**Quy ước 変更通知** (đọc kỹ, cả quy trình dựa vào đây):

- 1 lần gửi = 1 bản = 1 số version: `v1.0` `v2.0` `v3.0` … **Bản đã gửi thì đóng băng**, không sửa lại.
  Sửa trước khi gửi thì tăng phần thập phân (`v8.1` → `v8.2`), khi gửi đổi tên về `v8.0`.
- **Số `§` chạy liên tục** xuyên các bản (v7.0 §96–§106 → v8.x §107–…) để issue dẫn chiếu được "§109".
- Bản sau sửa bản trước thì ghi rõ trong bảng **「2. 上書き関係」** — đọc bảng này để biết § nào đã chết.
- Mỗi bản mở đầu bằng bảng **「1. 今回の変更まとめ」** có cột **影響** liệt kê thẳng issue bị chạm.
- File `変更通知 台帳（一覧）.md` là **sổ cái**: bản nào đã gửi ngày nào, thu những § nào, ứng với
  `要件 vX / 仕様 vY` nào, và SHA-256 của PDF đã gửi.
- Kênh gửi: **PM gửi PDF qua LINE WORKS** (từ 27/08/2026 không còn PR đồng bộ / comment issue).
  ⇒ **Bản chưa gửi vẫn có thể đã nằm trong repo** — trạng thái "未送付" nghĩa là *chưa ràng buộc*.

**Quy ước version tầng UI — 3 trục, khác hẳn tầng nghiệp vụ:**

| Trục | Ở đâu | Dùng cho |
|---|---|---|
| Ô bảng `\| 版 \| v0.1（2026-06-18・たたき台）\|` | trong file tài liệu `07-UI設計/` | tài liệu thiết kế |
| Tên thư mục `2026-06-18-01 …IA設計v1` | thư mục `07-UI設計/` | mốc đợt thiết kế |
| **SHA commit** | git | 🔴 **mockup — mốc DUY NHẤT so được** |

⚠️ Lệnh `status` của script grep `^\*\*版数\*\*` — **không đọc được version UI** vì UI không dùng
định dạng đó. Đừng kết luận "UI không có version" khi `status` không in ra.

**Baseline UI** (thay cho tầng ghim mà mockup không có) ghi ở wiki `9.0 — Sync Ledger`:

```
frontend@45e1f911         · 2026-10-15 · Hòa  · 2026-10-20   (168, từ 20/10/2026)
mockup/pwpf-eigyo@8e73b4ac · 2026-06-22 · Thái · 2026-09-17   (168, baseline cũ)
<đường dẫn>@<SHA>         · <ngày commit> · <người xác nhận> · <ngày xác nhận>
```

Thiếu trường **người xác nhận** thì không tính là baseline — không ai chịu trách nhiệm.
So bằng `delivery-spec-sync/scripts/spec-sync.sh <dự án> ui-diff <SHA_baseline>`. Chi tiết: `delivery-spec-sync/SKILL.md` §4b.

| Dự án | Có `mockup/`? |
|---|---|
| 168 | ✅ 2 thư mục sống + `_archive` |
| 147 / 167 | ✅ 5 thư mục, đổi thường xuyên hơn 168 |
| Lunchbox | ❌ không có — `ui`/`ui-diff` báo lỗi rõ ràng, không im lặng trả rỗng |

---

## 3. Bản ghim trong repo dev

> 🔴 **Đo ngày 17/09/2026: mới CHỈ dự án 168 có tầng ghim này.** `147-yahagi-ryokka-system` và
> `genba-bento` **chưa có** thư mục `docs/requirements/source/` (404). Với hai dự án đó:
> - Bỏ phần so bản ghim; canon so trực tiếp với **version ghi trong issue**.
> - Trong báo cáo, nêu thẳng: *"dự án chưa có tầng ghim → mọi thay đổi canon có hiệu lực ngay,
>   không có lớp bảo vệ sprint"* và đề xuất dựng thư mục ghim + `README.md` như 168.
>
> ⚠️ Kể cả 168 — **tầng ghim chỉ phủ phần nghiệp vụ**. Mockup không có tầng ghim ở bất kỳ dự án nào.

`docs/requirements/source/` của repo dev — **bản duy nhất được implement**:

| File | Vai trò |
|---|---|
| `README.md` | Luật ghim version (3 tầng, 5 quy tắc) |
| `パンウォールDX-Phase1-要件一覧.md` | 要件定義書 — dòng `**版数**: 3.40（…）` ở đầu file là version thật |
| `パンウォールDX-Phase1-機能仕様書.md` | 機能仕様書 — tương tự |
| `枝番lineage設計.md`, `組織・ロール定義…md` | tài liệu phụ trợ đi kèm |

⚠️ **Không sửa file trong thư mục này bằng tay** — đợt sync sau sẽ ghi đè. Thấy sai thì mở issue nhãn
`question` (repo dev dùng nhãn này cho câu hỏi spec, tương đương `Clarification`).

### 3a. Năm file canon của 168 — đường dẫn hai đầu

🔴 **Trong PM repo chúng KHÔNG nằm cùng một thư mục và không suy ra được từ tên.** Dùng bảng này,
đừng đoán; cần tìm lại thì `find . -name '<tên file>'`.

| File trong bản ghim `docs/requirements/source/` | Đường dẫn trong PM repo `168-yahagi-pan-wall-dx` |
|---|---|
| `パンウォールDX-Phase1-要件一覧.md` | `02-要件定義/パンウォールDX/2026-06-29-01 Phase1要件定義v3/` |
| `パンウォールDX-Phase1-機能仕様書.md` | `05-仕様書/2026-06-29-01 パンウォールDX-Phase1機能仕様v2/` |
| `CSV出力×CD表×画面 対応表（オフショア向け）.md` | `02-要件定義/パンウォールDX/_参考資料/` |
| `枝番lineage設計.md` | `02-要件定義/パンウォールDX/_参考資料/` |
| `組織・ロール定義（オフショア向け・日英）.md` | `02-要件定義/パンウォールDX/_参考資料/` |

⚠️ **Tên file có thể bị PM đổi.** Bảng đối chiếu CSV từng tên là `CSV全データ×画面 対応表（オフショア
向け）.md` cho tới 30/09/2026. Đổi tên thì dùng `git mv` để giữ lịch sử, và **kiểm luôn xem nội dung
có bị sửa kèm không** — lần đó vừa đổi tên vừa lên v1.5, từ 83 cột xuống 82.

**Đính kèm là canon nhưng CHƯA ghim** (tính tới 10/10/2026):
`02-要件定義/パンウォールDX/_参考資料/過去物件の座標（オフショア向け）/README（座標データの取込仕様・突合結果）.md`
— 変更通知 v9.0 §0 và §126 đều gọi nó là 正本, và 仕様 §8.0 dẫn 「README v1.4 のとおり」. Chưa ghim vì
v1.4 đã lỗi thời so với §139 (vẫn mô tả cột `latitude2`〜`longitude3` thay vì bảng con). Ghim nguyên
trạng = ghim một bản spec sai, nên phải ghi rõ trong mô tả PR thay vì bỏ im lặng.

### 3b. Lệnh kiểm tra của repo dev (chạy cả khi chỉ sửa comment)

| Dự án | Backend | Frontend |
|---|---|---|
| **168** | `cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy app scripts && uv run pytest` | `cd frontend && npm run lint && npm run build` |
| 147 / 167 | *(chưa chốt)* | *(chưa chốt)* |
| Lunchbox | *(chưa chốt)* | *(chưa chốt)* |

Luật của 168 nằm ở `.claude/rules/verification-loop.md`; quy ước trích dẫn ở
`.claude/rules/coding-guide.md` → _Requirement-ID citations_; luật cấm sửa migration đã apply ở cùng
file, mục _Migrations_.

**Lấy SHA canon đã ghim** — theo thứ tự ưu tiên:

1. Wiki trang `9.0 — Sync Ledger` §0, dòng "Ngày canon đã đồng bộ" (vd `8d25a1aa`).
2. Mô tả PR sync gần nhất trong repo dev:
   ```bash
   gh pr list -R structuralengine/168-yahagi-panwall --state merged --limit 20 \
     --search "requirements source" --json number,title,mergedAt
   gh pr view <số> -R structuralengine/168-yahagi-panwall --json body -q .body | head -40
   ```
3. Không tìm thấy → hỏi người dùng. **Đừng đoán bằng ngày.**

---

## 4. Wiki PMS — dự án YAHAGI 168 (cây trang đã có)

| Trang | ID | Vai trò trong đợt đối soát |
|---|---|---|
| `9.0 — Sync Ledger (Sổ đồng bộ)` | `01a06548-2abf-7489-afcd-8ac6e08a3da4` | 🔴 **Sổ cái**: trạng thái hiện tại, bảng đối chiếu, checklist, luật ghim, **baseline UI** |
| `9 — Changelog đồng bộ (theo version)` | `01a01904-fab6-7448-8afd-0d58a00d2fe4` | Cha của các trang `9.x` |
| `9.25 — v3.35→v3.40 / v2.37→v2.42` | `01a0af34-b76a-77ce-b3bf-182a1090367e` | Trang đợt gần nhất — dùng làm mẫu |
| `2 — 要件一覧 (danh mục yêu cầu)` | `019fdb39-2f05-723d-96dc-93eac33a196d` | Patch khi mã FR đổi/bãi bỏ |
| `3.2 — Đặc tả màn hình S1–S6` | `019fdb3f-c324-7428-9de9-6538e94b071d` | Patch khi màn hình đổi |
| `3.3 — Engine workflow` | `019fdba6-379b-71af-836a-9fc7d0ac9054` | WF phân loại |
| `3.4 — UI設計・IA` | `019fdba7-1aa5-765b-995c-917c93a2efbd` | Sơ đồ mermaid — 🔴 patch khi mockup đổi |
| `4.1 — ER + data dictionary` | `019fdb6f-30cf-71d8-ac14-1fb576a6060b` | 🔴 DDL đổi là phải patch |
| `4.2 — Đánh số / trạng thái / phân nhánh` | `019fdb70-7a85-7448-8a5b-b3e1f567a284` | Quy tắc 採番 |
| `4.3 — RBAC theo bộ phận` | `019fdb71-0b66-7075-948b-f8b007ccb361` | Quyền |
| `4.5 — Migration / kết nối ngoài` | `019fdbad-ebd6-74e4-b836-b4f3f53ed139` | Kết nối ngoài bị bỏ/đổi |
| `7.4 — Vấn đề chưa chốt` | `019fdb76-5848-7740-a479-7077024ed298` | 🔴 Q## chốt/mở → rổ D |
| `10.1 — RBAC ma trận` / `10.2 — Audit 45 loại` | `01a03d1a-ae56-7619-8111-a8fc0edd97c9` / `01a03d1c-992d-746d-8568-c1ca67908241` | Đợt rút scope phải rà |
| `SRS — PWPF Phase 1` | `019f6f20-c08d-70a9-b840-24307b4cb97a` | 238k ký tự · 355 AC — **luôn tách đợt riêng** |

Dự án khác: chạy `wiki_get_tree` (MCP PMS wiki `sora-pms`) với project ID ở §1 rồi tìm nhánh tương đương
(`SRS & tóm tắt spec` · `Thiết kế kỹ thuật` · `Vận hành & handover` · `Biên bản nội bộ`).

---

## 5. Lệnh tra cứu hay dùng

Chạy từ thư mục `~/.config/herdr-app/skills/delivery-spec-sync/` (lệnh `board.sh` từ `delivery-board/`).

```bash
# tình trạng lệch
scripts/spec-sync.sh 168 status
scripts/spec-sync.sh 168 diff 8d25a1aa      # ⚠️ trần 300 file — xem cảnh báo đỏ nếu khoảng so xa
scripts/spec-sync.sh 168 changelog 150

# tầng UI
scripts/spec-sync.sh 168 ui                 # mockup đang sống + đã _archive
scripts/spec-sync.sh 168 ui-diff 8e73b4ac   # KHỚP / LỆCH so với baseline ở Sync Ledger
#   ⚠️ script chỉ quét mockup/. Baseline 168 nay là frontend@45e1f911: gh api "repos/structuralengine/168-yahagi-pan-wall-dx/commits?path=frontend"

# 変更通知
scripts/spec-sync.sh 168 notices
scripts/spec-sync.sh 168 notice v8.2 > /tmp/notice-v8.2.md
scripts/spec-sync.sh 168 refs v8.2

# backlog
scripts/spec-sync.sh 168 issues-open > /tmp/issues-open.txt
scripts/spec-sync.sh 168 issue FR-055
gh issue view 211 -R structuralengine/168-yahagi-panwall --json title,body,labels,milestone

# board 201 (qua skill delivery-board)
board.sh item 168-yahagi-panwall#211
```

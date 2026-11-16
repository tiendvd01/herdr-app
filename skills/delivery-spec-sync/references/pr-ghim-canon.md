# PR ghim canon về repo dev

Đây là chi tiết của **bước S5 — phần repo dev**. Wiki nằm ở `dong-bo-wiki.md`; mọi đường dẫn,
tên file và lệnh kiểm tra **theo từng dự án** nằm ở `sora-profile/references/du-an-va-nguon.md` §3. File này chỉ giữ
**quy trình**, không giữ toạ độ.

PR này trông như "chép 5 file, sửa bảng version". Không phải. **Ghim canon mới làm gãy âm thầm
những trích dẫn hôm qua còn đúng** — và không có công cụ nào bắt được: comment vẫn biên dịch,
`mypy` vẫn sạch, trong khi trích dẫn giờ trỏ sang một quy tắc khác.

PR #692 (Yahagi 168, 10/2026) bị `CHANGES_REQUESTED` với 11 phát hiện. Kiểm chứng lại thì **11/11
đều đúng**, và **không cái nào là lỗi code** — toàn bộ là hệ quả của việc bỏ bước rà trích dẫn.

> **Không `git push`, không `gh pr create`, không merge.** Soạn nhánh, commit và mô tả PR; người
> dùng tự đẩy. Repo 168 còn chặn cứng các lệnh này trong `.claude/settings.json`.

---

## 1. Điều kiện trước khi mở

| Kiểm | Vì sao |
|---|---|
| Đang ở khe giữa hai sprint, hoặc đã qua cổng thay đổi | Luật 2 của `docs/requirements/source/README.md` — một sprint không được xây trên hai version |
| SHA canon đã chốt và ghi lại | Mọi so sánh bên dưới phải đối chiếu đúng commit đó, không phải "HEAD của repo PM" (HEAD chạy tiếp trong lúc mình làm) |
| Biết SHA đã ghim trước đó | Cần cho diff trước/sau và cho việc ghim `path@SHA` |

Ghi cả hai SHA vào mô tả PR. SHA cũ là commit của PR sync lần trước, không phải `develop`.

## 2. Nhánh

```bash
git fetch origin
git switch -c sync/req-vX.XX-spec-vY.YY --no-track origin/develop
```

`--no-track` là bắt buộc: tách từ nhánh chung mà không gỡ thì upstream trỏ vào `develop`, và hộp
thoại push của Fork/GitKraken sẽ mặc định đẩy thẳng lên đó.

**Đặt tên nhánh theo version dự kiến ghim.** PM sửa canon giữa chừng thì tên nhánh lạc hậu — chấp
nhận, chỉ đổi tiêu đề PR; đổi tên nhánh khi PR đang mở thì phải đóng rồi mở lại.

## 3. Chép file rồi chứng minh

**Đường dẫn các file canon trong repo PM không nằm cùng một thư mục và không đoán được.** Bảng
ánh xạ hai đầu (bản ghim ↔ PM repo) nằm ở **`sora-profile/references/du-an-va-nguon.md` §3a**, kèm cả danh sách đính kèm là
canon nhưng cố ý chưa ghim. Dùng bảng đó, đừng suy từ tên file.

Chép xong, **so SHA-256 từng file với `git show <canon-sha>:<path>`** và đưa kết quả vào phần điều
kiện hoàn thành của PR. "Tôi đã chép" không phải bằng chứng; mã băm mới là.

PM đổi tên file thì dùng `git mv` để giữ lịch sử, và ghi việc đổi tên vào mô tả PR.

## 4. Bảng version trong README

`docs/requirements/source/README.md` có bảng file × version × ngày. Lấy version từ **dòng `版数`
bên trong chính file đó**, không lấy từ bản 変更通知 — hai chỗ có thể lệch, và file thắng. Chép
nguyên các dòng `版数` vào mô tả PR (luật 4 của README yêu cầu); dòng dài thì cắt và ghi rõ là
bản rút gọn.

## 5. 🔴 Rà trích dẫn — chỗ PR sync thật sự hỏng

Ba kiểu gãy khác nhau. Làm đủ cả ba, chúng không trùng nhau.

### 5a. File đổi tên làm gãy mọi đường dẫn trỏ tới nó

```bash
git grep -n '<tên file cũ>'
```

Sửa path xong **dừng lại, kiểm tiếp xem việc đổi tên có đi kèm sửa nội dung không** — thường là có.
Chỉ đổi path sẽ để lại những câu kiểu "v1.1 … cố định 83 cột" trỏ vào một file giờ là v1.5, 82 cột,
và không còn chứa danh sách đang được trích.

**Khi code vẫn làm theo bản cũ thì ghim bản cũ**, đừng ép câu chữ trỏ sang tài liệu đang nói ngược:

```
docs/requirements/source/<tên cũ>.md@<SHA của lần ghim trước>
```

rồi gọi tên bản mới riêng ra, kèm issue sẽ theo nó. Grep thêm *các chỗ khác nhắc version cũ*
(`git grep -n 'v1\.1'`) — commit đổi tên chỉ chạm những dòng có đường dẫn.

### 5b. Mục bị đánh số lại làm gãy mọi trích dẫn `§x.y(n)`

Đặc tả thỉnh thoảng đánh số lại một danh sách (số trùng, đuôi xếp ngược). Chính tiêu đề mục trong
file mới có ghi, và bản `変更通知` tương ứng kèm bảng cũ→mới. Cả hai đều dễ bỏ qua vì **trích dẫn
vẫn trông hợp lệ**.

Tìm cho hết, kể cả dạng nối mà grep ngây thơ chỉ bắt được số đầu (`§5.13(3)/(16)(b)`,
`§5.13(12)(13)(16)`):

```bash
git -c core.quotePath=false grep -n '§5\.13' -- . ':!docs/requirements/source'
```

Đếm trên `origin/develop`, không đếm trên nhánh — `develop` chạy tiếp trong lúc PR mở và các commit
thêm vào cũng mang trích dẫn.

Rồi **map theo nội dung, không theo số**. Chỗ nào số bị trùng thì hai lần xuất hiện có số phận khác
nhau — đọc từng trích dẫn để biết nó định nói mục nào. Tiểu mục chữ cái là dấu hiệu nhận ra
(`(8)(d)` chỉ có thể là mục có tiểu mục chữ cái), số trần thì không.

**Thay từ số lớn xuống nhỏ** (18→20 trước 16→18), nếu không sẽ đè chồng lên nhau.

**Migration đã chạy thì để nguyên.** Chúng ghi lại cách đánh số đang đúng vào lúc chúng chạy, và
luật của dự án cấm sửa migration đã apply (168: xem §3b). Ghi lý do vào README để người sau không
tưởng là bỏ sót.

### 5c. Nhãn trích dẫn không tồn tại trong canon

Trong lúc map sẽ gặp những trích dẫn mà **nhãn của nó không có trong canon** (grep từ đó ở cả bản
cũ lẫn bản mới, 0 kết quả ở cả hai nghĩa là nó chưa bao giờ là canon). Theo quy ước trích dẫn của
dự án (168: xem §3b): thay bằng nội dung thật của mục đó, và nói rõ từ kia là tên riêng của repo
mình.

## 6. Tài liệu dẫn xuất

`docs/requirements/glossary.md`, `docs/requirements/product-overview.md`, `docs/data-shapes.md` và
các ADR là bản tóm tắt của thư mục ghim. README của thư mục hứa rằng khoảng trống của chúng "được
theo dõi bằng issue" — nên hoặc sửa, hoặc mở issue; đừng để lời hứa đó thành sai.

Bảng "What changed since the previous copy" trong chính README là **lịch sử, không phải đặc tả**.
Canon thay dòng nào thì đánh dấu dòng đó, đừng viết lại bảng, và giữ nhãn "đây là lịch sử".

## 7. Kiểm tra

Sửa comment thôi vẫn phải qua **đủ** vòng kiểm tra của dự án — lệnh theo từng dự án ở
**`sora-profile/references/du-an-va-nguon.md` §3b**.

Dòng comment dài làm vỡ giới hạn 100 cột của `ruff` — xuống dòng lại, đừng cắt ngắn trích dẫn.

Không chạy được database tại chỗ thì **nói thẳng** và để CI làm cổng chặn. Bằng chứng thay thế cho
"tôi không đổi hành vi": bỏ docstring rồi so cây cú pháp từng file `.py` với bản trên `develop`.

```python
# mỗi file .py đã đổi: ast.dump(strip_docstrings(ast.parse(old))) == ast.dump(...(new))
```

**Không bao giờ tick ô điều kiện hoàn thành cho lệnh mình chưa chạy.**

## 8. Mô tả PR

Ngoài template của repo, một PR sync phải có:

- cả hai SHA (canon mới, bản ghim cũ) và lệch nhau bao nhiêu commit;
- dòng `版数` của từng file đã ghim;
- **mỗi bản 変更通知 trong khoảng đổi những gì**, một gạch đầu dòng một bản;
- **bảng "mục nào bị đè trong chính khoảng này"**, dựng từ bảng `上書き関係` của *mọi* bản thông báo
  trong khoảng — bản sau thường xuyên rút lại bản trước, và người đọc nhằm mục cũ sẽ xây sai;
- **phần việc còn thiếu**: mọi chỗ code đang lệch bản ghim, mỗi chỗ kèm issue sẽ đóng nó;
- thứ gì cố ý **không** ghim thì nói vì sao, và nó là dữ liệu khách hay là đặc tả;
- ghi chú bảo mật khi bản ghim đổi câu chữ về quyền, **nói rõ khoảng cách là mới hay đã có từ
  trước** (kiểm bản ghim cũ trước khi viết "giờ đây spec ghi là…").

Mẫu ngắn:

```markdown
## Sync spec: 要件 v3.49 → v3.57 ／ 仕様 v2.51 → v2.59

- **Canon SHA**: `3b84bc9b` (repo PM, 2026-10-09)
- **SHA trước đó**: `7eedf7b7` — lệch 42 commit
- **変更通知 trong khoảng**: v9.0 (§116–§126) · v10.0 (§127–§128) · v11.0 (§129–§132) · v12.0 (§133–§147)

**版数 (chép nguyên từ file, bản rút gọn):** …
**Bị đè trong chính khoảng này:** §116 ← §142 · §124 ← §140 · §126 ← §139 · …
**Việc còn thiếu sau khi gộp:** … (mỗi dòng kèm số issue)
```

## 9. Checklist — 11 bẫy review #692 đã bắt

- [ ] Dòng tóm tắt một § trong bảng đầu bản thông báo **không phải** là §. Đọc thân § rồi mới mô tả:
      「A・Bの削除」 có thể nghĩa là "A, và việc xoá B".
- [ ] "Xoá ô trên màn hình" không phải là "bỏ cột". Nói rõ cái nào.
- [ ] Dựng bảng bị-đè từ **mọi** bản thông báo trong khoảng, không chỉ bản mới nhất.
- [ ] Tài liệu được bản thông báo gọi là đính kèm thì **là đặc tả**, kể cả khi nó nằm cạnh dữ liệu.
      Nếu nó đã lỗi thời so với canon mới hơn thì nói ra, đừng ghim im lặng.
- [ ] "Theo dõi ở issue riêng" — kiểm issue đó có thật, và tiêu đề lẫn tiêu chí nghiệm thu của nó
      có đang ghim bản đã bị thay không.
- [ ] Trích theo số mục, không theo số dòng (README → _Citing_).
- [ ] Gọi tên nút và trạng thái **đúng như canon gọi**.
- [ ] 「…で構いません」 là **cho phép**, không phải bắt buộc — đừng nới thành "giữ nguyên hành vi".
- [ ] Trích issue liên quan nguyên văn ("continues in Sprint 2" ≠ "finishes in Sprint 2").
- [ ] Link trong issue đang mở trỏ `blob/develop/<path cũ>` sẽ 404 sau khi gộp; permalink theo SHA
      thì không. Liệt kê ra.
- [ ] Lỗi phát hiện trong canon thì **báo ngược cho PM** ở đúng issue đã nêu vấn đề gốc — không bao
      giờ tự sửa file sync nguyên trạng.

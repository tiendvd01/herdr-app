---
name: issue-walkthrough
description: "Dẫn dev đi từ con số 0 tới hiểu một issue mà phần code cần sửa do người khác viết, chạy liền cả ba phần trong một lượt và ghi vào MỘT file markdown ngắn gọn: (1) tự tay tái hiện flow nghiệp vụ đang chạy — qua màn hình, hoặc chạy API / script / batch nếu là backend, hoặc xem hạ tầng hiện tại nếu sửa infra; (2) lộ trình đọc code theo đúng đường chạy, bắt đầu từ file nào, đi qua file nào, file nào trọng tâm, kèm các bảng / field DB liên quan và tác dụng của từng field; (3) activity hoặc sequence diagram của flow MỚI sau khi làm issue. Chức năng mới hoàn toàn không đụng module nào thì chỉ làm phần 3. Ghi vào SoraVaults/<dự án>/issue <n>/walkthrough.md. Dùng khi người dùng gõ /issue-walkthrough, nói 'mới nhận issue này, flow cũ chạy sao', 'dẫn mình tái hiện flow hiện tại', 'code này người khác viết, đọc từ đâu', 'nên đọc file nào trước', 'vẽ flow mới cho issue', 'walkthrough issue', hoặc dán link issue kèm ý muốn hiểu luồng trước khi code. Không dùng để lên plan / code (delivery-dev), review PR, hay dựng tài liệu cả dự án (onboard-domain)."
argument-hint: "<số issue hoặc URL>"
---

# Issue walkthrough

Người dùng vừa nhận issue, code do người khác viết. Một file `walkthrough.md` cho họ: thấy flow đang chạy → đọc code theo đường chạy → nhìn flow mới. Làm liền một lượt, không dừng hỏi giữa chừng.

## Viết concise — quan trọng nhất

Người dùng đọc lướt; đoạn dài lan man làm mất thời gian và che mất điều quan trọng.
- Bảng và gạch đầu dòng, không đoạn văn. Mỗi gạch đầu dòng một dòng.
- Nói một lần: điều đã có trong bảng / sơ đồ thì không nhắc lại bằng lời.
- Chỉ ghi điều giúp hiểu flow hoặc chỗ issue đổi; bỏ chi tiết "cho đủ".
- Cả file nhắm ≤ ~120 dòng. Dài hơn → cắt bớt trạm, dồn sang "Đọc khi cần".

## Nguyên tắc

- **Chỉ flow.** Không AC status, PR, người làm, milestone, việc tiếp theo. Điều gì chặn việc tái hiện / vẽ flow thì một dòng ngay chỗ đó.
- **Code là nguồn sự thật.** Mọi bước, `file:line`, tên bảng / field đều đã đọc trong lượt này. Không chắc → `CHƯA XÁC NHẬN`.
- **Mốc đối chiếu** một lần ở đầu file: `<nhánh> @ <sha7> (YYYY-MM-DD)`, sau `git fetch`.
- **Tiếng Việt**; tên kỹ thuật trong backtick. Mỗi lần từ tiếng Nhật xuất hiện đều có nghĩa tiếng Việt trong ngoặc ngay sau.
- **Chỉ đọc.** Không ghi repo dev, không commit; môi trường chung chỉ dùng lệnh chỉ đọc; dữ liệu giả là dữ liệu bịa.

## Bước 0 — chuẩn bị (không ra mục riêng)

1. `gh issue view <n> --json number,title,url,body,labels,comments`; task con thì lấy thêm story cha (`gh api repos/<owner>/<repo>/issues/<n>/parent`).
2. `T=$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue <n>")`, file `$T/walkthrough.md`. Đã có file → sửa đúng phần đổi, không ghi đè mù. Có `05-investigation.md` / `07-solution.md` → dùng làm gợi ý, vẫn tự đọc lại code.
3. Xếp loại: `SỬA FLOW CÓ SẴN` hay `CHỨC NĂNG MỚI ĐỘC LẬP` (đã `rg` không thấy luồng nào chạm; dùng chung `users` / auth không tính) → độc lập thì chỉ làm phần 3. Tầng: `UI` · `API` · `BATCH/SCRIPT` · `INFRA`.

Trước khi viết phần 1 đọc `references/reproduce-by-layer.md`; trước khi vẽ đọc `references/diagram-guide.md`.

## Khuôn `walkthrough.md`

`````md
# #<n> · <tên flow bằng lời nghiệp vụ>
<nhánh> @ <sha7> (YYYY-MM-DD) · <issue url> · <SỬA FLOW CÓ SẴN | CHỨC NĂNG MỚI ĐỘC LẬP> · <tầng>

## 1. Flow đang chạy
`Chưa chạy thử`   (xoá khi người dùng báo đã chạy)
**Tóm tắt:** 2–3 gạch đầu dòng — ai làm gì để được gì, vấn đề issue nêu.
**Chuẩn bị:** môi trường (trỏ tới README / run-local, đừng chép), tài khoản, dữ liệu cần có + cách tạo.

| # | Làm gì | Kỳ vọng thấy |
|---|---|---|
| 1 | mở `/orders` | danh sách, Network `GET /api/orders` 200 |
| 4 ★ | ... | ... |
★ = chỗ issue đổi; cột cuối ghi ngắn "sau issue: …".

## 2. Đọc code
```mermaid
sequenceDiagram   %% flow hiện tại, message gắn số trạm ① ②, ★ = trọng tâm
```

| Trạm | Ở đâu | Nhìn gì |
|---|---|---|
| ① | `path/file.py:120` `func` | 1 dòng: điều kiện / lời gọi / ghi bảng |
| ③ ★ | ... | 1 dòng + vì sao trọng tâm |

### Bảng và field liên quan
**`<bảng>`** — lưu gì, một dòng.
| Field | Kiểu | Tác dụng | Trạm |
|---|---|---|---|

**Đọc khi cần:** `file` — khi nào (một dòng mỗi file, tối đa 5).
**Test khoá hành vi hiện tại:** `path::test_name` (1–3 test).

## 3. Flow mới
Nguồn: <Solution permalink | code nhánh feature | AC | ĐỀ XUẤT — chưa có Solution>
```mermaid
```
| Chỗ đổi | Cũ | Mới | Trạm |
|---|---|---|---|
**Field mới / đổi tác dụng:** (cùng khuôn bảng field; bỏ nếu không có)
**Giả định:** (bỏ nếu không có)
`````

### Cách dựng

- **Phần 1:** bước đi theo thứ tự người dùng thật đi, ≤ 8 bước. Kỳ vọng phải cụ thể (mã HTTP, chữ trên màn, số dòng), không "chạy thành công". Nhiều flow bị chạm → mỗi flow một bảng, flow chính lên đầu.
- **Phần 2:** lần theo đường chạy thật: điểm vào (route FE / endpoint / CLI / cron / resource IaC) → handler → service → repository → nơi ghi. CodeGraph nếu có `.codegraph/`, không thì `rg`. 4–7 trạm, tối đa 3 ★; trạm trỏ tới hàm và dòng, không trỏ cả file.
- **Bảng / field:** đọc model / migration để nói bảng lưu gì và tác dụng từng field (nghĩa nghiệp vụ, giá trị enum / cờ, NULL nghĩa là gì). Chỉ field flow đọc / ghi / lọc / nối; mỗi ô Tác dụng ≤ 1 câu.
- **Phần 3:** nguồn theo độ tin cậy: Solution đã duyệt → chưa duyệt → code nhánh feature → AC + đặc tả. Chưa chốt làm rẽ nhánh → vẽ cả hai nhánh "nếu chốt A / B", không tự chọn. Một sơ đồ là đủ trừ khi sơ đồ thứ hai cho thấy điều mới.

## Trước khi báo xong

`bash ~/.config/herdr-app/skills/onboard-domain/scripts/check-mermaid.sh "$T"` — `FAIL` thì sửa; không có `mmdc` thì nói rõ. Rà nghĩa mọi từ tiếng Nhật. Đếm dòng: vượt ~120 thì cắt.

Báo chat ngắn: đường dẫn đầy đủ tới file · flow cũ 1–2 dòng · trạm ★ và field chính · flow mới đổi gì (ghi rõ nếu `ĐỀ XUẤT`) · nhờ người dùng chạy thử phần 1 và báo lại.

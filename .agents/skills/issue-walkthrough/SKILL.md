---
name: issue-walkthrough
description: "Dẫn dev đi từ con số 0 tới hiểu một issue mà phần code cần sửa do người khác viết, chạy liền cả ba phần trong một lượt và ghi vào MỘT file markdown dễ hiểu, đủ ngữ cảnh: (1) tự tay tái hiện flow nghiệp vụ đang chạy — qua màn hình, hoặc chạy API / script / batch nếu là backend, hoặc xem hạ tầng hiện tại nếu sửa infra; (2) ngay sau đó, flow MỚI sau khi làm issue — đổi chỗ nào, từ gì thành gì, kèm activity hoặc sequence diagram; (3) lộ trình đọc code theo đúng đường chạy, bắt đầu từ file nào, đi qua file nào, file nào trọng tâm, kèm các bảng / field DB liên quan và tác dụng của từng field. Chức năng mới hoàn toàn không đụng module nào thì chỉ làm phần 2. Ghi vào SoraVaults/<dự án>/issue <n>/walkthrough.md. Dùng khi người dùng gõ /issue-walkthrough, nói 'mới nhận issue này, flow cũ chạy sao', 'dẫn mình tái hiện flow hiện tại', 'code này người khác viết, đọc từ đâu', 'nên đọc file nào trước', 'vẽ flow mới cho issue', 'walkthrough issue', hoặc dán link issue kèm ý muốn hiểu luồng trước khi code. Không dùng để lên plan / code (delivery-dev), review PR, hay dựng tài liệu cả dự án (onboard-domain)."
argument-hint: "<số issue hoặc URL>"
---

# Issue walkthrough

Người dùng vừa nhận issue, code do người khác viết. Một file `walkthrough.md` cho họ: thấy flow đang chạy → ngay sau đó thấy issue muốn đổi nó thành gì → đọc code theo đường chạy. Cũ và mới đặt sát nhau để so sánh mà không phải kéo xuống. Làm liền một lượt, không dừng hỏi giữa chừng.

## Viết dễ hiểu, không mất ngữ cảnh — quan trọng nhất

Người đọc chưa biết gì về nghiệp vụ lẫn code. Mục tiêu: đọc một lượt là hiểu, không phải đoán.
- Văn phong kể chuyện bằng lời thường: ai làm gì, để được gì, hệ thống phản ứng ra sao. Đừng nén thành ký hiệu (`Σ`, `→`, viết tắt) khi một câu thường nói rõ hơn.
- Mỗi khái niệm nghiệp vụ được giải thích lần đầu nó xuất hiện (là gì, dùng để làm gì), rồi mới dùng tiếp.
- Tách rõ "trước / sau": hiện đang thế nào, vấn đề là gì, issue đổi gì.
- Gạch đầu dòng và bảng vẫn dùng để dễ quét, nhưng một ý cần hai, ba câu thì cứ viết đủ; được lồng gạch con.
- Không giới hạn độ dài. Chỉ bỏ những gì không giúp hiểu flow hoặc chỗ issue đổi; không lặp lại điều bảng / sơ đồ đã nói.

## Nguyên tắc

- **Chỉ flow.** Không AC status, PR, người làm, milestone, việc tiếp theo. Điều gì chặn việc tái hiện / vẽ flow thì một dòng ngay chỗ đó.
- **Code là nguồn sự thật.** Mọi bước, `file:line`, tên bảng / field đều đã đọc trong lượt này. Không chắc → `CHƯA XÁC NHẬN`.
- **Mốc đối chiếu** một lần ở đầu file: `<nhánh> @ <sha7> (YYYY-MM-DD)`, sau `git fetch`.
- **Tiếng Việt**; tên kỹ thuật trong backtick. Mỗi lần từ tiếng Nhật xuất hiện đều có nghĩa tiếng Việt trong ngoặc ngay sau.
- **Chỉ đọc.** Không ghi repo dev, không commit; môi trường chung chỉ dùng lệnh chỉ đọc; dữ liệu giả là dữ liệu bịa.

## Bước 0 — chuẩn bị (không ra mục riêng)

1. `gh issue view <n> --json number,title,url,body,labels,comments`; task con thì lấy thêm story cha (`gh api repos/<owner>/<repo>/issues/<n>/parent`).
2. `T=$(bash ~/.config/herdr-app/.agents/skills/delivery-start/scripts/vault-path.sh "issue <n>")`, file `$T/walkthrough.md`. Đã có file → sửa đúng phần đổi, không ghi đè mù. Có `05-investigation.md` / `07-solution.md` → dùng làm gợi ý, vẫn tự đọc lại code.
3. Xếp loại: `SỬA FLOW CÓ SẴN` hay `CHỨC NĂNG MỚI ĐỘC LẬP` (đã `rg` không thấy luồng nào chạm; dùng chung `users` / auth không tính) → độc lập thì chỉ làm phần 2. Tầng: `UI` · `API` · `BATCH/SCRIPT` · `INFRA`.

Trước khi viết phần 1 đọc `references/reproduce-by-layer.md`; trước khi vẽ đọc `references/diagram-guide.md`.

## Khuôn `walkthrough.md`

`````md
# #<n> · <tên flow bằng lời nghiệp vụ>
<nhánh> @ <sha7> (YYYY-MM-DD) · <issue url> · <SỬA FLOW CÓ SẴN | CHỨC NĂNG MỚI ĐỘC LẬP> · <tầng>

## 1. Flow đang chạy
`Chưa chạy thử`   (xoá khi người dùng báo đã chạy)
**Tóm tắt:** kể bằng lời thường, đủ cho người chưa biết gì —
- **Hiện nay:** ai làm gì trên màn / API nào, để được gì; giải thích từng khái niệm nghiệp vụ lần đầu gặp.
- Hệ thống tự làm gì phía sau, kết quả được dùng ở đâu.
- **Vấn đề:** issue / khách nêu điều gì sai hoặc khó.
- **Issue đổi:** liệt kê từng thay đổi.
- Lưu ý phạm vi (vd chỉ ước lượng, có hạn) nếu có.
**Chuẩn bị:** môi trường (trỏ tới README / run-local, đừng chép), tài khoản, dữ liệu cần có + cách tạo.

| # | Làm gì | Kỳ vọng thấy |
|---|---|---|
| 1 | mở `/orders` | danh sách, Network `GET /api/orders` 200 |
| 4 ★ | ... | ... |
★ = chỗ issue đổi; cột cuối ghi ngắn "sau issue: …".

## 2. Flow mới — issue muốn đổi thành gì
Nguồn: <Solution permalink | code nhánh feature | AC | ĐỀ XUẤT — chưa có Solution>
```mermaid
```
| Chỗ đổi | Hiện nay | Sau issue | Trạm (phần 3) |
|---|---|---|---|
**Field mới / đổi tác dụng:** (cùng khuôn bảng field; bỏ nếu không có)
**Giả định:** (bỏ nếu không có)

## 3. Đọc code
```mermaid
sequenceDiagram   %% flow hiện tại, message gắn số trạm ① ②, ★ = trọng tâm
```

| Trạm | Ở đâu | Nhìn gì |
|---|---|---|
| ① | `path/file.py:120` `func` | điều kiện / lời gọi / ghi bảng, nói bằng lời thường |
| ③ ★ | ... | làm gì + vì sao trọng tâm |

### Bảng và field liên quan
**`<bảng>`** — lưu gì, dùng vào việc gì.
| Field | Kiểu | Tác dụng | Trạm |
|---|---|---|---|

**Đọc khi cần:** `file` — khi nào cần mở.
**Test khoá hành vi hiện tại:** `path::test_name` (1–3 test).

`````

### Cách dựng

- **Phần 1:** bước đi theo thứ tự người dùng thật đi, ≤ 8 bước. Kỳ vọng phải cụ thể (mã HTTP, chữ trên màn, số dòng), không "chạy thành công". Nhiều flow bị chạm → mỗi flow một bảng, flow chính lên đầu.
- **Phần 2:** viết ngay sau phần 1, cùng thứ tự các bước / ★ của phần 1 để người đọc so cũ ↔ mới tại chỗ. Bảng Chỗ đổi đi theo thứ tự ★ ở phần 1; cột Trạm trỏ xuống phần 3. Nguồn theo độ tin cậy: Solution đã duyệt → chưa duyệt → code nhánh feature → AC + đặc tả. Chưa chốt làm rẽ nhánh → vẽ cả hai nhánh "nếu chốt A / B", không tự chọn. Một sơ đồ là đủ trừ khi sơ đồ thứ hai cho thấy điều mới.
- **Phần 3:** lần theo đường chạy thật: điểm vào (route FE / endpoint / CLI / cron / resource IaC) → handler → service → repository → nơi ghi. CodeGraph nếu có `.codegraph/`, không thì `rg`. 4–7 trạm, tối đa 3 ★; trạm trỏ tới hàm và dòng, không trỏ cả file.
- **Bảng / field:** đọc model / migration để nói bảng lưu gì và tác dụng từng field (nghĩa nghiệp vụ, giá trị enum / cờ, NULL nghĩa là gì). Chỉ field flow đọc / ghi / lọc / nối; ô Tác dụng nói nghĩa nghiệp vụ bằng lời thường, dài ngắn tuỳ cần.

## Trước khi báo xong

`bash ~/.config/herdr-app/.agents/skills/onboard-domain/scripts/check-mermaid.sh "$T"` — `FAIL` thì sửa; không có `mmdc` thì nói rõ. Rà nghĩa mọi từ tiếng Nhật. Đọc lại phần Tóm tắt như người mới: chỗ nào còn phải đoán thì viết rõ thêm.

Báo chat ngắn: đường dẫn đầy đủ tới file · flow cũ 1–2 dòng · flow mới đổi gì (ghi rõ nếu `ĐỀ XUẤT`) · trạm ★ và field chính · nhờ người dùng chạy thử phần 1 và báo lại.

---
name: delivery-ui-measure
description: "Đo và so sánh giao diện thật bằng Chrome — lấy computed style (font, padding, border, radius, shadow) và kích thước (rộng/cao, bị cắt chữ) của các phần tử trên nhiều viewport và nhiều trạng thái (đọc / sửa, ja / en), rồi diff demo Malme với app và ra bảng khác biệt có số. Dùng khi issue đòi UI khớp demo / mockup 'đến từng pixel', khi viết AC dạng số đo (px, weight, padding), khi cần đo Today của một task UI, khi verify 'không còn khác biệt', hoặc người dùng nói 'đo UI', 'so sánh với demo', 'diff pixel', 'capture.mjs', 'diff.mjs', 'ui-chuan'. Không dùng để đánh giá đẹp/xấu hay thay test chức năng."
---

# Đo và so sánh UI (demo ⇄ app)

Trả lời một câu: **app đang lệch demo ở đâu, bao nhiêu** — bằng số đo trong Chrome, không bằng mắt. Không cài gì thêm: chỉ cần Chrome và Node ≥ 22 (client CDP viết sẵn, `scripts/cdp.mjs`).

```text
demo (vite dev của repo mockup) ─┐
                                  ├─ capture.mjs ─→ demo.json ┐
app  (local / staging)          ─┘                             ├─ diff.mjs ─→ bảng khác biệt (exit 1 nếu còn lệch)
                                  capture.mjs ─→ app.json ────┘
```

## Khi nào dùng trong luồng delivery

| Phase | Việc |
|---|---|
| `delivery-dev-investigate` (task UI) | Đo **Today**: capture demo + app, diff → danh sách lệch thật, đối chiếu với bảng "Today" của issue. Phát hiện lệch ngoài bảng ⇒ báo thêm vào task trước khi code ("Compare first"). |
| `delivery-dev-test` | Chạy lại sau khi code; mỗi AC dạng số đo = một dòng trong báo cáo diff. |
| `delivery-dev-verify` | Chạy trên `HEAD` cuối, đính báo cáo vào `13-verification.md` và PR. |
| `delivery-pr-review` | Reviewer chạy lại để kiểm số người viết đưa. |

## Dùng

1. **Chạy demo.** Tìm repo bằng `find-mockup-repo` (mã dự án), đứng đúng commit issue ghi (`@45e1f911`: `git status` sạch, `git log -1`), rồi `cd frontend && npx vite --port 5199 --strictPort`. Demo dùng `HashRouter`: URL dạng `http://localhost:5199/#/plan`.
2. **Chạy app.** URL app đã đăng nhập, có dữ liệu giống hàng demo (seed một dòng cùng chuỗi với một dòng demo). Cần cookie phiên: `--cookie pwpf_session=<giá trị>` (lấy từ trình duyệt của bạn, không ghi vào file nào; **không dán vào chat**). Locale lưu ở localStorage: `--ls <khoá>=<giá trị>` (khoá xem `frontend/src/shared/i18n/locale.ts`).
3. **Capture** (mỗi bên một lần):

   ```bash
   S=~/.config/herdr-app/skills/delivery-ui-measure
   # output (json, shots, report.md) để trong evidence/ của issue trong vault — ../delivery-start/references/luat-chung.md §6
   cd "$(bash ~/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh "issue <n>/evidence/ui-measure")"
   node $S/scripts/capture.mjs --side demo --url 'http://localhost:5199/#/plan' --spec $S/specs/plan-table.json --out demo.json --shots shots
   node $S/scripts/capture.mjs --side app  --url 'http://localhost:5173/plan'   --spec $S/specs/plan-table.json --out app.json  --cookie pwpf_session=… --shots shots
   ```

   Mặc định bảy viewport chuẩn (1920×1080, 1600×900, 1440×900, 1280×800, 1024×768, 768×1024, 390×844), device scale 1, `ja-JP`. Chọn bớt: `--viewports 1600x900`, `--states read`, `--lang en-US`.
4. **Diff**:

   ```bash
   node $S/scripts/diff.mjs demo.json app.json --ignore-colors --md report.md
   ```

   `--ignore-colors` bỏ màu/shadow khi màu thuộc task khác (vd token toàn app). `--tol` đổi dung sai (mặc định 0,5px). Exit 0 = không lệch, 1 = còn lệch, 2 = lỗi chạy.

## Viết spec cho màn mới

Spec là JSON (mẫu: `specs/plan-table.json`):

- `ready`: selector chờ tới khi dữ liệu đã vẽ.
- `states[]`: `read`, `edit`… mỗi state tải lại trang rồi chạy `steps` (`click`, `clickText` + `exact`, `waitFor`, `wait`; thêm `"only": "demo"|"app"` nếu bước khác nhau).
- `targets[]`: `name`, `selector`, `limit` (số phần tử đo), `props` (mặc định gồm font, padding, border, radius, shadow, kích thước), `states`.
- Selector hai bên khác nhau (demo dùng `<select>`, app dùng `<button>` của `Select` chung) ⇒ `"selector": {"demo": "…", "app": "…"}`.
- Mỗi phần tử còn ghi `width`, `height`, `clipped` (chữ bị cắt) — dùng cho AC kiểu "không bị cắt".

## Luật

- **Số đo mới là bằng chứng**; ảnh chụp (`--shots`) chỉ để người xem. Báo cáo ghi: commit demo, commit app, viewport, locale, ngày.
- Khác biệt do demo là mock còn app là dữ liệu thật (số dòng, chuỗi) **không** phải lỗi style — ghi vào báo cáo, đừng "sửa" cho khớp.
- Không đưa cookie phiên vào repo, artifact hay PR.
- Chỉ đọc: công cụ không sửa repo demo hay app. Lệch ngoài scope task ⇒ báo, đề xuất issue riêng.
- Công cụ không phán đẹp/xấu và không thay test chức năng (bàn phím, a11y vẫn do test + `delivery-dev-test`).

Phương pháp chi tiết, sai số, bẫy hay gặp: `references/ui-chuan.md`.

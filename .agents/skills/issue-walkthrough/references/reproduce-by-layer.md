# Tái hiện flow theo tầng

Thứ tự người dùng thật đi qua: UI → API → batch; infra đứng riêng. Kỳ vọng phải đủ cụ thể để biết đúng / sai.

## Tìm trước khi viết
- Cách chạy local: `run-local.md` trong vault, `README`, `docker-compose*.yml`, `Makefile`, `package.json`, `.env.example` — có rồi thì trỏ tới.
- Dữ liệu: có seed chưa? Thiếu → cách tạo (SQL / API / màn hình), tên cột đọc từ model.
- Công tắc: feature flag, env, role có thể chặn flow.

## UI
- Đăng nhập local bằng gì, cần role nào.
- URL thật (từ router FE) + nhãn nút (từ i18n / JSX).
- Mỗi thao tác chính kèm API màn gọi (`METHOD /path` trong Network) — cầu nối sang phần 2.
- Chỉ nhánh lỗi / rẽ mà issue chạm.

## API
- Cách lấy token; có Swagger (`/docs`) thì dẫn qua đó.
- `curl` chạy được nguyên văn, dữ liệu bịa.
- Kỳ vọng: mã HTTP, body đáng chú ý, thay đổi phía sau (dòng DB, file storage, message queue) + lệnh tự xem.

## BATCH / SCRIPT / CLI
- Lệnh thật (từ `__main__`, argparse / click, cron config) và cờ quan trọng (`--dry-run`).
- File đầu vào giả tối thiểu, đúng định dạng code đọc, đặt ngoài repo.
- dry-run → chạy thật → xem kết quả; chạy lần hai nếu issue chạm tính chạy-lại-được.

## INFRA
- Resource liên quan: file IaC, module, môi trường.
- Chỉ lệnh đọc: `terraform plan` (kỳ vọng `No changes`), `state show`, `aws … describe/list/get`, `kubectl get/describe`.
- Đi theo một request / job qua từng chặng: xem ở đâu, thấy gì.
- Thiếu quyền → ghi quyền gì, nhờ ai, cách xem thay thế.

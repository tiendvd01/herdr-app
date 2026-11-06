# Sessions (mod `processes`)

Hộp thoại quản lý các phiên Claude Code đang chạy ở mọi space: xem tiến trình con, tạm dừng, dừng, khởi động lại, xóa phiên.

Mở bằng cách bấm badge `N proc · CPU% · RAM` ở thanh trạng thái dưới (mod `status-usage`). Đóng bằng `Esc`.

## Dữ liệu lấy từ đâu

- Mod `status-usage` chạy `collect()` (`status-usage/procs.js`) mỗi 4 giây, rồi ghi vào shared `procs`. Mod này chỉ đọc `shared("procs")` để vẽ, tự nó không gọi `ps`.
- `collect()` chạy `ps -axo` một lần, dựng cây tiến trình, rồi với mỗi agent có `app === "claude-code"` lấy tiến trình foreground của terminal làm gốc. Mỗi con trực tiếp của gốc là một dòng "process" (kèm cả cây con của nó).
- Chỉ nhận phiên **Claude Code**. Agent khác (codex, gemini...) không hiện ở đây.
- Nút Refresh ghi `Date.now()` vào shared `procs.refresh`; `status-usage` thấy thay đổi trong vòng 0,5 giây và poll lại.

## Mỗi phiên có

- Chấm trạng thái (blocked / working / done / idle), tiêu đề, `space › tab`, tuổi, số tiến trình, CPU, RAM.
- Nhãn "Running" khi CPU thật sự tăng (xem bên dưới).
- Nút: **Restart** (xoay), **Go** (nhảy tới pane), **Stop all**, **Delete**. Mỗi dòng tiến trình có **Pause/Resume**.

## Hành vi cần biết

- **CPU "Running"** không dựa vào `%cpu` của `ps` (trên macOS đó là trung bình suy giảm nên cao mãi sau khi việc dừng). Mod so sánh thời gian CPU tích lũy giữa hai lần poll; ≥ 10% thì coi là đang chạy.
- **Pause/Resume** gửi `kill -STOP` / `-CONT` tới cả nhóm pid con.
- **Stop all** gửi `-TERM` tới mọi tiến trình con (không đụng tới Claude). Các pid này được ghi vào shared `procs.killed` để không bị báo "Process finished".
- **Delete** là `terminal.kill`: đóng luôn terminal và pane.
- **Restart** chạy một job shell tách rời (`nohup`), nên đóng hộp thoại không làm đứt giữa chừng:
  1. gửi `/exit`, đợi Claude thoát (tối đa ~20 giây);
  2. đọc màn hình terminal, lấy id từ dòng `claude --resume <uuid>`, gửi lại lệnh đó (không có id thì `claude --continue`);
  3. đợi giao diện Claude sẵn sàng (tối đa ~27 giây), rồi gửi `/compact`.
  - Lỗi ghi vào `~/.config/herdr-app/data/restart-session.log`. Spinner chỉ chạy cố định 8 giây, không theo dõi job thật.
- **Thông báo "Process finished"** do `status-usage` phát: một tiến trình chạy ≥ 20 giây rồi biến mất mà không bị Stop thì báo xong, bấm vào sẽ focus pane.

## Lưu ý

- Restart phụ thuộc vào chuỗi nhận diện giao diện Claude (`? for shortcuts`, `shift+tab to cycle`, `bypass permissions`, `accept edits`). Claude đổi giao diện thì bước chờ sẽ hết hạn và `/compact` không được gửi (ghi vào log).
- Chỉ chạy trên macOS/Linux có `ps`, `hc` trong PATH.

---
name: trace-flow
description: "Lần theo một flow trong code theo bốn lượt, theo đúng thứ tự: (1) điểm vào — cái gì khởi động flow, input nào đi qua ranh giới (route, event, command, component); (2) dữ liệu — lần một giá trị (vd `orderId`) từ request tới chỗ lưu, kể ra mọi hàm biến đổi / validate nó; (3) side effect — mọi thao tác ra khỏi process (ghi DB, gọi mạng, email, queue, file); (4) lỗi — với mỗi side effect, nếu nó thành công mà bước sau hỏng thì sao. Mọi khẳng định đều kèm `file:line` và tên hàm, để người đọc mở ra kiểm được. Kết quả là một đường đi xuyên code, không phải một đống file. Dùng khi người dùng hỏi 'flow này chạy thế nào', 'request X đi qua đâu', 'trace orderId', 'dữ liệu này được ghi ở đâu', 'cái gì gọi ra ngoài', 'nếu bước này lỗi thì sao', 'map the flow', 'how does X work end to end', 'where does this value end up', kể cả khi chỉ dán một route / tên event / tên hàm và hỏi nó làm gì. Không dùng để vẽ diagram (code-diagram-guide), dẫn đọc một issue cụ thể (issue-walkthrough), hay dựng tài liệu cả dự án (onboard-domain)."
argument-hint: "<route | event | command | component> [giá trị cần lần, vd orderId]"
---

# Trace flow

Hiểu một flow bằng cách đi bốn lượt, mỗi lượt đứng trên kết quả lượt trước. Hỏi cả kiến trúc một lúc sẽ ra một đống file rời rạc; đi theo thứ tự thì cuối cùng có một **đường đi** xuyên qua code.

## Luật số một: không có vị trí thì không phải khẳng định

Mỗi câu nói về code phải kèm `path/to/file.ext:line` và tên hàm / class, lấy từ chính file đã mở trong lượt này. Vì sao: có vị trí thì người đọc mở ra kiểm được trong vài giây; không có vị trí thì rất dễ bịa mà không ai biết.

- Chưa mở file để xác nhận → ghi `CHƯA XÁC NHẬN` và nói cần đọc chỗ nào để chắc.
- Suy luận (vd "chắc framework tự retry") → ghi rõ là suy luận, kèm chỗ đã nhìn khiến mình nghĩ vậy.
- Không viện dẫn tên file / hàm "nghe hợp lý" mà chưa thấy. Đây là lỗi tệ nhất của skill này.

## Cách tìm code

- Repo có `.codegraph/` → dùng `codegraph explore "<tên>"` / `codegraph node <symbol>` trước (callers, call path ra luôn).
- Không có → `rg` (không dùng `grep`). Lần theo tên hàm được gọi, không đọc lan man cả thư mục.
- Đọc đúng đoạn cần, lấy số dòng từ chính output đã đọc.

## Bốn lượt — làm theo thứ tự

Đừng nhảy cóc: lượt sau dựa trên đường đi lượt trước tìm ra. Nếu ở lượt 1 có nhiều điểm vào khả dĩ và người dùng chưa chỉ rõ, liệt kê chúng (có vị trí) rồi hỏi chọn cái nào trước khi đi tiếp. Còn lại thì làm liền cả bốn lượt.

### Lượt 1 — Điểm vào

Câu hỏi: *Cái gì khởi động flow này, và input nào đi qua ranh giới?*

- Gọi tên cụ thể: route (`POST /orders`), event / message, CLI command, cron job, UI component + handler.
- Chỗ đăng ký (router, subscriber, khai báo job) và hàm handler đầu tiên — cả hai có `file:line`.
- Hình dạng input ở ranh giới: field nào, từ đâu (body, query, header, payload), ai gửi.
- Middleware / guard chạy trước handler (auth, parse, rate limit) nếu có.

### Lượt 2 — Dữ liệu

Câu hỏi: *Lần `<giá trị>` từ request tới chỗ lưu. Hàm nào biến đổi hoặc validate nó?*

- Chọn một giá trị then chốt (người dùng nêu, hoặc ID / payload chính của flow) và đi theo nó, không theo cả object.
- Liệt kê theo thứ tự chạy, mỗi bước một dòng: `hàm` @ `file:line` — làm gì với giá trị (đổi tên, parse, ép kiểu, validate, map sang entity, ...).
- Đánh dấu chỗ giá trị **đổi tên / đổi hình dạng** (`orderId` → `order.id` → cột `order_id`) — đây là chỗ người đọc hay lạc.
- Kết thúc ở chỗ lưu: bảng / cột, key cache, file, hoặc chỗ nó rời khỏi process.

### Lượt 3 — Side effect

Câu hỏi: *Những thao tác nào đi ra khỏi process?*

Quét dọc đường đi đã có, không chỉ hàm chính. Mỗi side effect một dòng, kèm vị trí:

| # | Loại | Gọi gì | Ở đâu (`file:line`, hàm) | Đồng bộ / async | Trong transaction? |

Loại: ghi DB, gọi HTTP / RPC, email / SMS / push, đẩy queue / publish event, ghi file / object storage, cache, log audit. Lời gọi ẩn sau abstraction (repository, client wrapper, hook ORM, event listener) vẫn tính — lần tới chỗ thật sự gọi ra ngoài.

### Lượt 4 — Lỗi

Câu hỏi: *Với mỗi side effect: nếu nó thành công mà bước kế tiếp hỏng thì sao?*

Đi qua từng dòng của bảng lượt 3:

| # | Thành công rồi bước sau hỏng → | Có gì đỡ? (`file:line`) | Hậu quả còn lại |

- "Có gì đỡ" = transaction bao quanh, rollback / compensate, retry, idempotency key, outbox, catch + xử lý. Không thấy gì → ghi "không thấy" (đó chính là phát hiện).
- Hậu quả cụ thể: "đã trừ tiền nhưng order vẫn `pending`", "email đã gửi nhưng DB rollback", "retry sẽ tạo bản ghi trùng".
- Không đề xuất sửa trừ khi được hỏi; mục tiêu là bản đồ.

## Định dạng trả lời

Trả lời trong chat (hoặc vào file nếu người dùng yêu cầu), ngắn, bảng và gạch đầu dòng:

```
# Flow: <tên flow>
Mốc: <branch> @ <sha7>

## 1. Điểm vào
## 2. Dữ liệu: <giá trị>
## 3. Side effect
## 4. Lỗi
## Đường đi (tóm tắt)
<handler> → <hàm> → <hàm> → <chỗ lưu>, mỗi chặng có file:line
## Chưa xác nhận
- <điều chưa chắc> — cần đọc <chỗ nào>
```

- Mốc lấy từ `git rev-parse --abbrev-ref HEAD` và `git rev-parse --short HEAD`, để biết bản đồ đúng với phiên bản nào.
- Người dùng chỉ hỏi một lượt (vd "chỉ cần side effect") → làm lượt đó, nhưng vẫn cần lượt 1 tối thiểu để biết đường đi bắt đầu từ đâu.
- Mục "Chưa xác nhận" bỏ đi nếu trống; không giấu nó đi khi có.
- Từ tiếng Nhật trong tên field / comment / nhãn UI: mỗi lần xuất hiện đều kèm nghĩa tiếng Việt trong ngoặc.

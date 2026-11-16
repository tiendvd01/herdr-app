# Khung nháp comment chốt scope

Bỏ mục nào không áp dụng; đổi tên mục cho khớp nghiệp vụ của issue. Mẫu thật đã dùng: PWPF #196 (luồng nghiệp vụ 10 + 7 bước), xem đoạn ví dụ cuối file.

````markdown
@<người nhận> <lời gọi theo quy ước>, <xưng> rà lại scope với issue gốc, <nguồn đặc tả chuẩn: wiki trang/mục, spec ghim vX>. <Phần đã ổn, 1 câu>. <Xưng> chốt luôn các điểm mở như dưới.

### Chốt nhanh
- **Q1:** <quyết định 1 dòng>.
- **Q2:** …
- **Task mới / mở rộng scope:** <tên>, <gộp hay tách>. <Nếu mở rộng: "em tính lại estimation">.
- **API:** <API mới nào, API nào dùng lại>.
- **DoD<n> bỏ / sửa:** <lý do 1 dòng>.

### 1. <Quy tắc chính, vd trạng thái từng bước>
<1 câu định nghĩa trạng thái / quy ước chung.>

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%
<vòng đời trạng thái (stateDiagram-v2) hoặc luồng theo làn vai trò (flowchart), mức nghiệp vụ>
```

**<Nhóm A> (<số> bước)** (<căn cứ>)
- Bước 1 – <tên>: <xong khi … / theo …>.
- Bước 2 – …

**<Nhóm B>** …

### 2. <Quy tắc phụ, vd vị trí hiện tại>
- <điều kiện> → <kết quả>.

### 3. <Mapping / liên kết dữ liệu>
- <khoá dùng để map, vì sao không cần lưu thêm>.
- <danh sách map>.
- <cái không map>.
- <việc thuộc issue khác, ghi issue nào làm>.

### 4. Field mới (<xưng> chốt, đặc tả không nói lưu ở đâu)
**<Thao tác 1> (<bước / màn hình>)**
- Màn hình: <màn> → <tab> → <nút> mở <modal>. API: <API update có sẵn> (<path:line>).
- Cột mới: `<schema.table>.<column>` (<kiểu>, <nullable>) = <nghĩa nghiệp vụ>. <vì sao đặt ở đây>.
- Cách ghi: <cập nhật đè; trùng giá trị → không ghi gì>.
- Lịch sử: <sự kiện audit from→to>.
- Hệ quả / vì sao không lưu chỗ khác: <…>.
- Em kiểm giúp: <điểm còn mở khi làm>.

**Chung:** <quyền, audit>.

### 5. <Phần khác, vd danh sách / field bổ sung cho API có sẵn>
- …

### 6. Sơ đồ
DB (NEW = field mới ở mục 4):
```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%
erDiagram
  ...
```

Luồng đọc (<API>, <vì sao giữ/tách>):
```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%
sequenceDiagram
  ...
```

Luồng ghi:
```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%
sequenceDiagram
  ...
```

### 7. Sửa thêm
- **T<n>:** <sửa gì, căn cứ>.
- **Test:** <liệt kê ca test cụ thể, gồm ca no-op, ca từ chối, 404/403>.
- **Tài liệu:** <file dev được sửa / file không được sửa → mở issue question>.
- **Body issue:** <bỏ phần thừa kế nào, vì đã đóng ở đâu>.

### DoD sau khi chốt
1. <kiểm được>
2. …

<Câu giao việc, vd "Em cập nhật lại task list, DoD và estimation theo mấy điểm trên nhé.">
````

## Đoạn ví dụ (PWPF #196, rút gọn)

```markdown
**Chọn phụ trách thi công (bước 7 nhận đơn)**
- Màn hình: chi tiết công trình (S3), tab luồng nghiệp vụ, nút ở bước 7 mở modal chọn người. Không có API riêng: gửi qua API update có sẵn `PATCH /cases/{id}` (`casebook/case/router.py:580`).
- Thêm 1 cột mới vào bảng có sẵn `casebook.cases`: `construction_staff_id` (uuid, nullable) = người phụ trách thi công đang được chọn.
- Chọn người khác thì cập nhật đè. Chọn lại đúng người đang có thì không ghi gì (`update_case` chỉ ghi sự kiện khi giá trị thật sự đổi).
- Lịch sử đổi người: mỗi lần đổi thật có 1 sự kiện `CASE_UPDATED` với `construction_staff_id {from, to}`.
- Không lưu vào `case_assignees`: unique `(case_id, user_id)` sẽ đụng, và tự mở phạm vi xem cho cả phòng thi công PW.
```

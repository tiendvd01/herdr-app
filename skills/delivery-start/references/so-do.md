# Sơ đồ nghiệp vụ — vẽ thay tả

Dùng chung cho mọi skill delivery-* khi phân tích nghiệp vụ: rà yêu cầu của khách, viết Epic / US, soạn Clarification, đối soát đặc tả, hiểu issue trước khi code. Sơ đồ ở đây là **mức nghiệp vụ**: vai trò, bước, đối tượng nghiệp vụ, trạng thái. Không có tên module, bảng, endpoint — đó là việc của Solution, vẽ theo `../../delivery-dev/references/writing-policy.md` §7b.

Một đoạn văn kể "người bán gửi, người duyệt duyệt, hệ thống báo người thiết kế" bắt người đọc tự dựng sơ đồ trong đầu, và khách đọc bản dịch còn khó hơn. Vẽ hộ họ.

## Khi nào bắt buộc

| Nội dung | Sơ đồ | Bắt buộc ở |
|---|---|---|
| Ai dùng hệ thống để làm gì (phạm vi) | use case | Epic; rà Requirement có từ 2 vai trò trở lên |
| Các bước nghiệp vụ, rẽ nhánh, ai làm bước nào | luồng theo làn vai trò (`flowchart`, mỗi vai trò một `subgraph`) | US hay Requirement có từ 3 bước trở lên hoặc có rẽ nhánh |
| Trao tay giữa người và hệ thống theo thời gian (gửi duyệt, thông báo, trả về) | sequence mức nghiệp vụ (`actor` là vai trò, một `participant` là "System") | từ 3 bên tham gia trở lên |
| Vòng đời một đối tượng: trạng thái, chuyển, điều kiện chuyển | `stateDiagram-v2` | luật xoay quanh trạng thái |
| Đối tượng nghiệp vụ và quan hệ | ER mức khái niệm (không kiểu dữ liệu, không khoá) | Requirement đưa vào đối tượng mới |
| Màn nào mở màn nào, bằng nút gì | chuyển màn (`flowchart LR`, node là màn hình, nhãn mũi tên là nút hoặc thao tác) | US đi qua từ 2 màn hình trở lên |
| Chỗ còn phải hỏi khách | luồng đang hiểu, nhánh đang hỏi đánh `?` và viền nét đứt, nhãn song ngữ | Clarification hỏi về luồng hoặc điều kiện |
| Đặc tả đổi luồng hoặc vòng đời | hai khung trước ⇢ sau (khuôn ở `../../delivery-spec-sync/references/mau-bao-cao.md` §2) | báo cáo đối soát đặc tả, trang changelog wiki |

Không vẽ cho: danh sách phẳng, việc chỉ có 2 bước, bảng đối chiếu (dùng bảng markdown).

## Quy tắc

- **Sơ đồ thay đoạn văn, không đứng cạnh nó.** Chữ còn lại chỉ nói điều sơ đồ không nói được: vì sao, ngoại lệ, nguồn.
- Một sơ đồ một ý, tối đa khoảng 12 node. Rộng hơn thì tách theo vai trò hoặc theo giai đoạn.
- Mức nghiệp vụ: tên vai trò và đối tượng nghiệp vụ người dùng gọi hằng ngày. Thấy tên bảng hay module trong sơ đồ nghiệp vụ là đang viết Solution.
- Sơ đồ chuyển màn dùng đúng mã và tên màn hình trong sơ đồ IA / chuyển màn của dự án (toạ độ trong memory dự án); màn mới chưa có trong IA vẽ nét đứt.
- Mỗi use case trong Epic ứng với một US, ghi số US trong nhãn. Mỗi bước trong luồng của US ứng với ít nhất một quy tắc hoặc AC; bước không có AC là chỗ hổng.
- Thứ chưa có hoặc đang đề xuất: nét đứt (`-.->`, `stroke-dasharray`), để không lẫn với hiện trạng.
- **Ngôn ngữ nhãn theo tài liệu chứa sơ đồ.** Thân issue GitHub: tiếng Anh, thuật ngữ nghiệp vụ tiếng Nhật giữ nguyên theo glossary của dự án (ví dụ `Lead 引合`). Phần Malme đọc và trả lời (Clarification, câu hỏi gửi khách): nhãn song ngữ ngắn `EN / JA`, tối đa khoảng 8 node, một sơ đồ dùng chung cho hai khối EN và JA, không vẽ hai lần. Tài liệu tiếng Việt: tiếng Việt có dấu. Ký tự làm vỡ cú pháp (`#`, `:`, ngoặc tròn trong tên participant) theo `../../sora-profile/references/van-phong.md` §4; nhãn có ký tự lạ thì bọc trong `["…"]`.
- **Sơ đồ đăng lên GitHub mở đầu bằng dòng cấu hình tắt nhãn HTML** `%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false}}}%%`, đặt ngay sau dòng mở khối mermaid. Thiếu dòng này thì GitHub cắt mất cuối mỗi dòng nhãn có dấu. Khuôn bên dưới chưa có dòng này, chép khuôn thì thêm vào. Lý do và cách kiểm: `../../sora-profile/references/van-phong.md` §4.
- Mermaid không có use case UML. Quy ước ở đây: vai trò là node tròn `(("…"))`, use case là node bo tròn `(["…"])`, ranh giới hệ thống là một `subgraph`.

## Khuôn

Use case (Epic):

```mermaid
flowchart LR
    sales(("Sales"))
    approver(("Approver"))
    subgraph sys["System"]
        uc1(["Register a lead - US 712"])
        uc2(["Request a design - US 713"])
        uc3(["Approve a design request - US 714"])
    end
    sales --> uc1
    sales --> uc2
    approver --> uc3
```

Luồng theo làn vai trò (US, Requirement):

```mermaid
flowchart TD
    subgraph S["Sales"]
        a1["Fill in the request"] --> a2["Submit"]
    end
    subgraph A["Approver"]
        b1{"Approve?"}
    end
    subgraph SYS["System"]
        c1["Notify the designer"]
        c2["Return to sales with the reason"]
    end
    a2 --> b1
    b1 -- "yes" --> c1
    b1 -- "no" --> c2
    c2 --> a1
```

Sequence mức nghiệp vụ:

```mermaid
sequenceDiagram
    actor Sales
    participant System
    actor Approver
    Sales->>System: Submit the design request
    System->>Approver: Notify - approval needed
    Approver->>System: Approve
    System-->>Sales: Notify - approved, due date set
```

Vòng đời trạng thái:

```mermaid
stateDiagram-v2
    [*] --> Lead
    Lead --> Ordered: work code entered
    Lead --> Lost: marked as lost
    Lost --> Lead: reopened
    Ordered --> InDesign: design request approved
```

ER mức khái niệm:

```mermaid
erDiagram
    CASE ||--o{ DESIGN_REQUEST : "has"
    CASE ||--o{ ASSIGNEE : "involves"
    DEPARTMENT ||--o{ ASSIGNEE : "belongs to"
```

Chuyển màn (US đi qua từ 2 màn hình):

```mermaid
flowchart LR
    s2["S2 Case list"] -- "open a row" --> s3["S3 Case detail"]
    s3 -- "Request button" --> m1["Design request - modal"]
    m1 -- "Send" --> s3
    s3 -. "PDF button" .-> m2["PDF preview - new"]
    style m2 stroke-dasharray: 5 5
```

Chỗ đang hỏi khách (Clarification), nhãn song ngữ:

```mermaid
flowchart LR
    a["Request submitted / 依頼送信"] --> b{"Approver absent? / 承認者不在？"}
    b -- "no / いいえ" --> d["Approver decides / 承認者が判断"]
    b -- "yes / はい" --> c["? Deputy or next level / 代理者か上位者か"]
    style c stroke-dasharray: 5 5
```

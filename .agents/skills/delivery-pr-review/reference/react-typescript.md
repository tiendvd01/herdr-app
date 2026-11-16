# Reference — React + TypeScript (SPA) hunting checklist

Nạp file này ở **pha 2 / §5B bước 3** khi diff chạm React/TS. Đây là danh mục lỗi **đặc thù
stack** — bổ trợ, không thay §8D (logic chung) hay §11 (security). Mỗi mục là *câu hỏi để soi*,
kết luận phải có **bằng chứng `file:line`** và trích **convention thành văn của repo** (§5B bước 1:
`.claude/rules/*`, `eslint.config.*`, `docs/`). Không có rule thành văn ⇒ best-practice chung, hạ
xuống suggestion trừ khi chạm correctness/security (§5B, Rule 23).

## A. Type safety (thường là rule thành văn của repo)

- `any` mới xuất hiện? Ép kiểu `as X` che mất mismatch thật? `@ts-ignore`/`@ts-expect-error` không
  kèm lý do? — nhiều repo bật `no-explicit-any`; trích rule trước khi phán.
- `unknown` từ ranh giới (response, `JSON.parse`, `catch (e)`) có **narrow bằng type guard** không,
  hay cast thẳng?
- Kiểu response API là *lời hứa compile-time* — có **validate runtime** ở ranh giới không (Zod/io-ts…)?
  Type suy ra từ chính schema (`z.infer`) hay khai báo tay rồi lệch với check thực chạy?

## B. Ranh giới dữ liệu & transport

- Có gọi `fetch`/`axios` **thẳng trong component/screen** không? Repo thường bắt đi qua **một lớp
  transport duy nhất** (vd `cores/api`) — screen gọi service của trang, không tự HTTP.
- Endpoint/DTO khai báo cạnh trang tiêu thụ hay rải khắp nơi? Swap mock→real có phá kiểu không?
- Lỗi từ server: branch theo `status` (quyết định transport) vs hiển thị `message` (đã bản địa hoá)
  — có tự chế lại message tạo hai phiên bản một câu không?

## C. State máy chủ (TanStack Query / SWR)

- **Query key** dựng từ **factory tập trung** hay literal array inline? Key cache ≠ key invalidate
  (`['case', id]` vs `['cases', id]`) ⇒ màn hình hiện data cũ **không báo lỗi** — lỗi im lặng kinh điển.
- Sau mutation: `invalidateQueries` **đúng mọi nhánh** dữ liệu thay đổi, hay hand-patch state bằng
  tay (bản local dần lệch server)? `setQueryData` chỉ chính đáng khi refetch sẽ đè draft đang sửa.
- Retry trên 4xx (403 retry vô ích)? `staleTime`/`refetchOnFocus` đặt ẩu gây bão request?
- Cache có **remount theo phiên đăng nhập** không, hay re-login phục vụ cache của user trước (rò dữ liệu)?

## D. Hooks & render correctness

- `useEffect`/`useMemo`/`useCallback` **thiếu/thừa dependency**? Effect có setState vô điều kiện gây
  loop? Cleanup thiếu (subscription, timer, `AbortController`) ⇒ rò/`setState` sau unmount?
- `key` trong list: index dùng làm key khi thứ tự đổi ⇒ state gắn nhầm row. Trace như §8D.2
  (non-deterministic ordering) khi list từ API.
- Mở **hai `EventSource`/hai timer** cho cùng một luồng (double-fetch)? Consumer vừa tự reload vừa
  gọi `refresh()`?
- Điều kiện hook chạy lệch nhau giữa các render (gọi hook trong nhánh `if`) — vi phạm Rules of Hooks.

## E. UI đúng hợp đồng nghiệp vụ

- **Cờ quyền trên UI = UX, không phải security.** Ẩn nút/cột chỉ là mỹ thuật; backend vẫn phải
  re-check. Đừng coi "đã ẩn ở FE" là đã kiểm soát truy cập (§11).
- **Nút hành động mới phải khớp luật của hành động đó — kể cả khi là mock/chưa nối API.** Một
  inline action (duyệt/từ chối/gửi/xoá) là hành động nghiệp vụ, không chỉ UI. Nếu BE hoặc một màn
  khác trong repo bắt hành động đó qua điều kiện (lý do tối thiểu, đính kèm, quyền, xác nhận) mà
  card/nút mới cho làm trong 1 tap thì đó là **finding**: nó mã hoá một luồng bị cấm, vỡ khi wire
  và sai ngay ở demo. "Mock-first, để phase sau" **không** miễn việc trace luật này (§5 bước 5).
  Trace đúng: mở enum/schema/service BE của action, hoặc màn duyệt sẵn có, so từng điều kiện.
- Chuỗi hiển thị: có **literal ngôn ngữ đích cứng** trong component không (repo i18n thường cấm bằng
  ESLint)? Thiếu key ⇒ vỡ build hay hiện sai ngôn ngữ?
- Biến thể style (màu/spacing) lặp Tailwind thay vì dùng token/variant đã có? Đây là **nit**, không
  block (§10) trừ khi phá design-system rule thành văn.

## F. XSS & client-side (nối §11)

- `dangerouslySetInnerHTML` / `innerHTML` với dữ liệu người dùng — có sanitize không?
- URL/`href`/`src` dựng từ input (`javascript:` scheme)? `target="_blank"` thiếu `rel="noopener"`?
- Secret lọt vào bundle: `import.meta.env`/`process.env` client chỉ được chứa config public
  (§11, security-baseline). Key/API-secret trong FE là **CRITICAL**.

## G. Test (nối §16)

- Behavior đổi mà không có test? Test chỉ assert render, bỏ nhánh lỗi/loading/empty?
- Mock che luôn cả bug (mock trả sẵn shape đúng trong khi ranh giới thật không validate)?

> Đi mục nào **PR thực sự đụng**, đừng quét cả file. Mỗi nghi vấn ⇒ confirmed finding có `file:line`
> + repro, hoặc `💡 Verification needed` (§8C). `UNKNOWN` khi thiếu ngữ cảnh — không đoán.

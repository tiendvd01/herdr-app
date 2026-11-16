# delivery-dev-review · Frontend — forcing functions + 5 tiêu chí kiến trúc

**Nạp khi:** diff đụng file frontend (component, hook, page, service, i18n, style).

Phần mở rộng của `../SKILL.md` (Phase 10). Core giữ template, severity và gate; file này là **cách làm**. Nạp xong thì ghi tên file vào dòng `References đã nạp` ở mục _Scope_ của `review.md`.

## Forcing functions — simulate, don't eyeball

A diff that **looks** like notation/typo/docs is not automatically low-risk: classify by what the
lines *do*, not by how big the change reads. These triggers are non-negotiable — when the diff
touches one, the eyeball pass is not enough, you **simulate the interaction and cite real output**
(§8C). Reading each piece in isolation and calling it "intentional" is exactly the miss.

| If the diff touches… | You MUST simulate | Then trace |
|---|---|---|
| A controlled input's `onChange`/normalize (strip, slice, uppercase, toFullWidth…) | typing mid-string, paste, then delete-back-to-start | caret position after set (per-keystroke rewrite jumps it — a repo may have a written `onBlur` idiom; grep for it) |
| A value transform + an equality/`unchanged`/dirty guard that feeds it | the transform running, then the guard comparing transformed-vs-stored | does the guard compare **raw vs normalized**? a normalize on entry silently defeats a raw-string guard |
| A guard the frontend enforces | sending the value the FE now produces | the backend guard on the other side — does it compare the same way, or wave it through? |
| Any "leaves X untouched until edited" claim | touch-then-revert (edit one char, undo it) | is X actually back to its stored form, or to a normalized form that looks different? |

The cheap tool for a FE interaction is a **throwaway probe test** in a git worktree of the branch:
render the component, drive it with `userEvent` (type/paste/clear), assert the field value / the
callback args / `selectionStart`, run `vitest`, delete it. A passing existing suite is **not**
evidence the break path is covered — check the fixture: if the test's `currentWorkCode` is already
in normal form, the guard's break case is never exercised. "737 tests pass" says nothing about a
path no test drives.

## Frontend: 5 tiêu chí kiến trúc — CHỈ khi diff đụng FE

Bỏ hẳn mục này với diff thuần backend/infra (ghi `N/A — không đụng FE`). Mỗi tiêu chí chấm **so với
convention tìm được ở _Soi convention THỰC TẾ_**, không so với sở thích:

1. **Chia theo nghiệp vụ, dev độc lập.** Code nằm đúng bounded context? Vocabulary/logic của context A
   có bị nhét vào page/module của context B, tạo phụ thuộc chéo sai hướng không?
2. **File không quá dài.** Tách view / hook / service hợp lý, không "god file" — đếm dòng các file mới
   (`wc -l`) và so với ngưỡng repo (ngưỡng lấy từ coding guide của repo; không có thì so với file cùng loại dài nhất đang được chấp nhận).
3. **Type/định nghĩa tập trung.** Enum/type/label dùng chung có **một** nguồn, hay khai lại ở component
   inline + mock + service? Validator (zod…) nên **derive** từ nguồn trung tâm, không hard-code lần hai.
   ⚠ Mock data thường là tạm và sẽ bị gỡ — đừng coi định nghĩa trong mock là nguồn chuẩn; đây là dịp tạo
   "nhà" cố định ở chỗ shared.
4. **Cache/store theo lib server-state repo ĐANG dùng.** Repo đã dùng TanStack Query (hay Pinia store,
   SWR…) mà code mới tự viết `useEffect`/`watch` + state thủ công + race-guard (`active` flag, in-flight
   guard) ⇒ **tái phát minh** → đề xuất `useQuery`/`useMutation` + query-keys + invalidate ở `onSuccess`
   (hoặc action của store tương ứng); local state chỉ giữ cho draft form. Lý do kiểu "ADR defer Query"
   trong khi feature khác đã dùng ⇒ mâu thuẫn, đưa vào _Cần làm rõ_.
5. **API client chung.** Dùng service/client chung của repo hay tự `fetch`? Response có validate theo
   convention (zod…) không?

Kết quả vào bảng trong Template (`../SKILL.md`) (✅ / ⚠️ / ❌ + `file:line`). Tiêu chí ❌ gây lỗi thật (race, dữ liệu cũ
hiển thị) là finding có severity; ❌ chỉ vì lệch convention là `MEDIUM`/`LOW`.

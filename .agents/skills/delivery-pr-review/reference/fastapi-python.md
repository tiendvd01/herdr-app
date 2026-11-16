# Reference — FastAPI + Python (backend) hunting checklist

Nạp file này ở **pha 2 / §5B bước 3** khi diff chạm FastAPI/SQLAlchemy/Python. Danh mục lỗi **đặc thù
stack** — bổ trợ §8D (logic chung), §11 (security), §12 (concurrency). Mỗi mục là *câu hỏi để soi*;
kết luận phải có `file:line` + trích **convention thành văn của repo** (§5B bước 1: `.claude/rules/*`,
`ruff.toml`/`pyproject`, `docs/decisions/*`). Không có rule thành văn ⇒ best-practice chung, hạ xuống
suggestion trừ khi chạm correctness/security (§5B, Rule 23).

## A. Ranh giới tầng (router → service → repository)

- **Router** có chứa SQL / business rule không? Chuẩn: router chỉ validate (Pydantic) + gọi service.
- **Service** có nhận `Request`/`Response` của FastAPI, hay chạm session DB trực tiếp không? Chuẩn:
  service giữ business rule, không import framework, không mở query.
- **Repository** có phải nơi **duy nhất** chạm session không? Query rò ra service/router là mùi lệch tầng.
- Cross-context: code có import **repository/models của context khác** không, hay đi qua **service**
  (public API) của context đó? Import xuyên repo là vi phạm ranh giới module.

## B. Pydantic ở ranh giới

- Router **nhận/trả Pydantic schema** hay dict thô / ORM model? Trả thẳng ORM model dễ rò cột nội bộ.
- Input có validate (type/range/required) **trước khi** tới service/DB không? Field tin từ client
  (role, tenant_id, amount, id chủ sở hữu) có bị **tin thẳng** không (§8D.0, §11)?
- `response_model` có lọc đúng field lộ ra UI không, hay phơi cả cột nhạy cảm (金額/PII)?

## C. Type & lint (thường là rule thành văn)

- Def thiếu type hint? `Any` ngầm/hiện? `# type: ignore` không lý do? Nhiều repo bật `mypy --strict`
  — trích rule trước khi phán.
- `except Exception`/`except:` nuốt lỗi rồi `pass`/log suông (§8D.8)? Bắt rộng che mất lỗi thật?

## D. Transaction & Unit of Work (nối §8D.6, §12)

- **Commit ở đâu?** Chuẩn phổ biến: **service commit đúng một lần**, cuối operation, *trong* request.
  Commit trong **router / repository / teardown dependency** là mùi — teardown chạy **sau khi response
  đã gửi**, commit lỗi ở đó vô hình (client vẫn nhận 2xx).
- State-change + audit/side-effect (event log, outbox) có **cùng một transaction** không? Tách ra ⇒
  crash giữa chừng để lại state đã đổi mà không có bản ghi (§8D.6). Đây là **data-integrity blocking**.
- Repository `flush` (để lỗi constraint nổ **trong** request, map 409) hay lỡ `commit`?
- Long-running (batch/import/consumer): **một UoW cho cả vòng lặp** thay vì **mỗi work-item**? Thiếu
  `begin_nested()`/savepoint mỗi item ⇒ trên PostgreSQL một row hỏng **abort mọi row sau** (`25P02`)?

## E. Repository an toàn dữ liệu

- Mọi `SELECT` có bắt đầu từ helper **lọc soft-delete** (không lấy row `deleted_at`) không?
- Có **filter `tenant_id`/scope lấy từ ngữ cảnh server** (danh tính đã xác thực), **không từ request**
  (§8D.3, §11)? Thiếu filter phạm vi là rò dữ liệu chéo tenant/phòng ban.
- Lọc phạm vi bằng **`EXISTS`/predicate trong query** hay fetch rồi lọc trong Python (§8D.3)? Lọc ở
  Python làm sai `count`/phân trang và rò tổng số row người dùng không được thấy.
- Xoá **vật lý** (`DELETE`/`ON DELETE CASCADE`) trong khi repo yêu cầu logical delete? Blocking.

## F. Lỗi & envelope (nối §8D.8)

- Ném `HTTPException` rải rác hay dùng **catalog lỗi** thống nhất (code/status/message ổn định)?
- `try/except IntegrityError` trong service thay vì đăng ký constraint để map về business error?
- Response lỗi có **rò stack trace / chi tiết DB / SQL** ra client không (§11)? Chỉ được lộ field an
  toàn theo định nghĩa (opt-in), mặc định tắt.

## G. Concurrency (nối §12)

- Check-then-act (tạo trùng, mất update) **không khoá/không CAS** (§8D.5)? Có version/optimistic lock
  cho màn hình sửa qua "think time" của người dùng không?
- Giữ khoá **xuyên external call**? Auto-retry transaction chứa quyết định của con người?
- Idempotency: side-effect (gửi thông báo, gọi vendor) — **claim trước rồi mới gửi**, hay gửi trước
  ghi sau (crash giữa hai bước ⇒ gửi trùng)?

## H. Security & logging (nối §11)

- Session/assertion **verify trước mọi side-effect** trên endpoint có thay đổi trạng thái?
- Secret (DB creds, signing key, S3/vendor key) đọc từ settings layer, **không hardcode**, không lọt log?
- Log có **token/password/PII đầy đủ** không? Chuẩn: log định danh, không log giá trị nhạy cảm/bind-param.

## I. Migration & test (nối §16)

- Có model đổi mà **thiếu migration**? Migration sửa file **đã applied** thay vì thêm mới?
- Behavior đổi mà không có test (unit/integration)? Test chỉ happy-path, bỏ nhánh 404/403/constraint?

> Đi mục nào **PR thực sự đụng**, đừng quét cả module. Mỗi nghi vấn ⇒ confirmed finding có `file:line`
> + repro, hoặc `💡 Verification needed` (§8C). `UNKNOWN` khi thiếu ngữ cảnh — không đoán, không PASS.

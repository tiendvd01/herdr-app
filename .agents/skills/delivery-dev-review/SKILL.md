---
name: delivery-dev-review
description: "Phase 10 of delivery-dev — code review and specialist review before the PR exists: read the actual diff with the delivery-pr-review methodology, run the routed specialist lenses, and produce SoraVaults/<project>/issue <n>/review.md with severity-ranked, evidence-backed findings and an APPROVED or CHANGES_REQUIRED verdict. Use after implementation and tests, before final verification, or on \"/devflow review #1234\"."
---

# Devflow · Phase 10 — Code Review + Specialist Review

Read `../delivery-dev/references/conventions.md`, `../delivery-dev/references/writing-policy.md` and `../delivery-dev/references/roles.md` first.

Then the lenses the diff calls for — `references/*.md` in this skill, chosen by the table _Nạp thêm theo diff_ below (a command decides, not a feeling).

**In:** the real diff + `original.md`/`understanding.md` + canon + `context.md` — then, only after forming your own view, `plan.md` + `implementation.md` (`DONE`) · **Out:** `SoraVaults/<project>/issue <n>/12-review.md` · **State:** `SPECIALIST_REVIEW → FIXING` or → `FINAL_VERIFICATION`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> review` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Catch what the implementer missed, on the **actual changed code**, before the PR exists.

```text
Implement → Self Review → Test → THIS PHASE → Fix → Final Verification
```

## Form your own view first — don't inherit the author's blind spots

This is usually an AI reviewing code an AI wrote, both anchored on the same `plan.md`/`implementation.md`. Shared inputs ⇒ **shared assumptions**, and a wrong assumption there (「起票 always binds an assignee」,「the ext row always exists」,「matching by timestamp is fine」) is invisible to both sides — that is precisely the class of bug a human reviewer with different priors catches and this phase does not. The two reviews where this phase approved and a human then found 12 and 8 findings, and the gate each lesson became: `references/incidents.md`. Read it before loosening any gate below.

Break the symmetry: read the **issue + the canon/spec + the raw diff** and build your own model of what the change must do **before** you read `plan.md`/`implementation.md`. Those record the author's intent — useful context, but they are not the requirement, and reading them first quietly turns the review into "does the code match the plan?" instead of "does the code match reality?". Treat every `as intended` / `by design` / `AC-0xx PASS` note in `implementation.md` as a **claim to verify**, never as a settled answer.

### Verify claims — cắt cả HAI chiều

Mọi tự-biện-minh của author — trong `implementation.md`, mô tả PR, commit message, comment, docstring — phải **trace tới code thật** trước khi tin. Đặc biệt các cụm: `đã defer`, `an toàn vì…`, `idempotent`, `atomic`, `không cần migration`, `backward-compatible`, `đã có guard ở …`, `chỉ đổi notation`.

Việc này cắt **cả hai chiều**, và chiều thứ hai hay bị quên:

- **Tránh bỏ sót gap thật** — claim nghe hợp lý nhưng code không đảm bảo. Vd: seed "insert-only" ⇒ xoá một transition khỏi code **không** dọn hàng đã seed trong DB → gap thật.
- **Tránh báo bug sai** — cơ chế trông đáng ngờ nhưng trace ra **đúng**. Vd: lỗi unique bị "nuốt" qua một lớp translate, đọc lướt tưởng mất lỗi, trace ra là map đúng sang 409 → **không** phải finding.

Chỉ ghi `CRITICAL`/`HIGH` khi đã dựng được **đường đi cụ thể** tới lỗi (hàm được gọi, migration, seed, guard, index, transaction). Mới nghi ⇒ ghi vào _Cần làm rõ_ hoặc `UNKNOWN`, không nâng severity để "cho chắc". Không mở được code để kiểm ⇒ nói thẳng "chưa verify".

**Liệt kê ngầm định của tác giả rồi phá từng cái (slot bắt buộc — _Ngầm định của tác giả_ trong
Template).** Trước khi đọc `plan.md`/`implementation.md`, viết ra các **invariant tác giả cho là đúng
nhưng chưa chứng minh** — nhất là ba khuôn: *「X luôn tồn tại」*, *「chỉ một path làm Y」*, *「khớp bản ghi
bằng một giá trị có thể đổi / soft-delete」*. Mỗi cái tìm một đường phá (row thiếu, path thứ hai, giá
trị đổi) và thử. Ô này trống = chưa review — đây chính là lớp bug mà reviewer-cùng-prior không thấy.

## Method — reuse `delivery-pr-review`

**Follow the `delivery-pr-review` methodology** — do not reinvent a review procedure here. But that skill is 1.5k lines (~13k tokens); loading all of it for a three-line change buries the parts that matter. **Read it by section**, always the core, plus what this change actually touches:

```bash
S=~/.config/herdr-app/skills/delivery-pr-review/SKILL.md

# CORE — always (~4k tokens)
sed -n '/^# 2B\./,/^# 6\./p' $S    # §2B 4 pha · §3 evidence-first · §4 finding vs suggestion · §5 đọc ngoài diff · §5B stack
sed -n '/^# 21\./,/^# 24\./p' $S   # §21 severity · §22 finding format · §23 lỗi tồn tại từ trước

# DEEP — khi Complexity/Risk ≥ MEDIUM, hoặc diff đụng logic (~4k)
sed -n '/^# 8\./,/^# 9\./p'   $S   # §8 correctness · §8B kỹ thuật · §8C chạy thật · §8D bảng săn lỗi · §8E hợp đồng ngầm

# THEO SPECIALIST được route trong status.md (mỗi mục ~0.1–0.8k)
sed -n '/^# 9\./,/^# 10\./p'  $S   # SA — architecture
sed -n '/^# 11\./,/^# 12\./p' $S   # INFOSEC — OWASP
sed -n '/^# 12\./,/^# 13\./p' $S   # PERFORMANCE
sed -n '/^# 13\./,/^# 14\./p' $S   # DBA
sed -n '/^# 14\./,/^# 15\./p' $S   # API / contract
sed -n '/^# 15\./,/^# 17\./p' $S   # QC — test + regression
sed -n '/^# 17\./,/^# 19\./p' $S   # SRE — observability + config
```

Core only ≈ 4k thay vì 13.5k. Đọc thiếu section cần thiết là lỗi review; đọc thừa cũng là lỗi — nó làm loãng đúng phần đang cần.

This skill only defines the delivery-dev wiring: input, routing, artifact, gate.

What each section gives you:

| delivery-pr-review | Use for |
|---|---|
| §2B — 4 phases (context → high-level → line-by-line → summary) | The order of the review. Do not start line-by-line before knowing what the change must do. |
| §3 — evidence-first (incl. "TUYỆT ĐỐI KHÔNG ĐƯỢC BỊA") | Every finding needs file + line + evidence + impact + fix. No invented lines, tests or CI results. |
| §4 — finding vs suggestion | A suggestion with no proven risk is `MEDIUM`/`LOW` and never blocks. |
| §5 — scope + **bắt buộc đọc ngoài diff** | Trace consumers, the other side of the contract, state machines, callers. Cannot open a linked file ⇒ `UNKNOWN`, never `PASS`. |
| §5B + `reference/*.md` | Load the stack file when it matches (`fastapi-python.md`, `react-typescript.md`). |
| §8B, §8C, §8D, §8E | Adversarial input · lifecycle simulation · cross-layer contracts · invariants · the high-frequency bug table · implicit shared-field contracts. Walk §8D pattern by pattern. |
| §9–§18 | Architecture · quality · security (§11 OWASP) · performance · database · API · tests · regression · observability · configuration. |
| §21 — severity | Same four levels as delivery-dev. |
| §22 — finding format, word budget, natural Vietnamese | How each finding is written. |
| §23 — pre-existing issues | Do not report a pre-existing problem unless this change created or worsened it. |

## Nạp thêm theo diff — quyết định bằng lệnh, không bằng cảm giác

Core này (template · severity · gate) luôn đọc. Các lens dưới **bắt buộc** nạp khi điều kiện khớp — chạy lệnh rồi quyết:

```bash
git diff --name-only <base>...HEAD      # <base> = context.md → Repo Facts → Base branch
```

| Điều kiện | Nạp |
|---|---|
| Review một PR/MR đã mở | `references/open-pr.md` |
| Có file khớp `Data-change paths` (migration · seed · backfill · reference data · state machine) | `references/data-migration.md` |
| Có file frontend (component · hook · page · service · i18n · style), **hoặc** diff có normalize/transform input đi kèm một guard so sánh (dirty/unchanged/equality) | `references/frontend.md` |
| PR feature/logic · sửa `docs/`/spec · code cite requirement-ID | `references/canon.md` |
| PR đụng hành vi (rule · guard · transition · side-effect · contract) | `references/behavior-proof.md` |
| INFOSEC trong route | `../delivery-dev/references/security.md` |
| SRE/DEVOPS trong route, hoặc diff đụng IaC/CI | `../delivery-dev/references/devops.md` |

Ghi danh sách đã nạp vào `References đã nạp` ở mục _Scope_. Điều kiện khớp mà file không có trong dòng đó = lens bị bỏ ⇒ chưa được APPROVED.

## What does NOT carry over

This phase runs **before** the PR exists — delivery-dev opens the PR at phase 13.

- **No posting.** §25.3 anchor verification, §25.4 post, §25.5 gate do not apply. There is no PR to comment on. Findings go into `review.md`.
- **No GitHub PR object.** The diff comes from the working tree / branch, not from `gh pr diff`.
- **No AC/DoD tables here.** §7 and §19 rebuild them; in delivery-dev the AC matrix is `traceability.md` and the AC verdict is `verification.md` (phase 11). This phase checks the requirement **at code level** and records `UNKNOWN` where it cannot tell — it does not duplicate the AC table.
- **Verdict mapping:**

  ```text
  APPROVE          → REVIEW_STATUS: APPROVED
  REQUEST CHANGES  → REVIEW_STATUS: CHANGES_REQUIRED
  COMMENT          → REVIEW_STATUS: APPROVED, findings recorded as MEDIUM/LOW
  ```

**After the PR is open**, a full PR review — inline comments, anchors, posting — is `delivery-pr-review` itself, invoked directly. Not this skill.

## When invoked on an already-open PR

PR/MR đã mở ⇒ **nạp `references/open-pr.md`** trước khi làm gì khác: diff lấy từ PR ở head sha thật (không phải working tree), verify trong worktree detached, đối chiếu description ↔ diff, đọc thread sẵn có, fallback khi không có thư mục task trong vault, và **không tự post** — post là việc của `delivery-pr-review` sau khi developer đồng ý.

## Read the Diff First

`<base>` = `Base branch` trong `01-context.md` (không có ⇒ gate script đã đoán và WARN — hỏi developer nếu đoán sai). **Không bao giờ mặc định `main`.**

```bash
git status --short               # PHẢI rỗng — gate script đã kiểm; thay đổi chưa commit
                                 # không thuộc SHA nào nên không được review "kèm"
git diff <base>...HEAD           # whole branch vs base
git diff --stat <base>...HEAD
git log --oneline <base>..HEAD   # ý định từng commit; lộ commit "dọn dẹp" trộn lẫn commit tính năng
```

**Re-review (đã có `REVIEWED_SHA` cũ).** Chỉ đọc delta, theo bảng ở `conventions.md` §3:

```bash
git merge-base --is-ancestor <REVIEWED_SHA> HEAD && git diff <REVIEWED_SHA> HEAD   # thêm commit lên trên
git range-diff <REVIEWED_SHA>...HEAD                                               # rebase/amend/renumber
```

Rebase mà có commit bị `!` (đổi nội dung — conflict fix, đổi tên migration, sửa revision id) ⇒ review lại commit đó như code mới. Findings cũ vẫn mở phải được xác nhận lại trên HEAD mới.

**A generic review without reading the changed code is forbidden.** Empty diff ⇒ say so and stop.

Diff lớn: lưu ra file rồi đọc từng phần; đọc **trọn** file chứa logic cốt lõi, lướt file generated / lockfile / snapshot và **ghi rõ đã lướt** ở mục _Scope_. Đối chiếu danh sách file mà `implementation.md` nói đã đổi với `--stat` thật — lệch (khai đã sửa mà không có trong diff, hoặc có trong diff mà không khai) là thứ phải giải thích.

Review against `context.md` conventions and `plan.md` scope — not against generic best practice. A "best practice" claim with no repository evidence is not a finding.

### Soi convention THỰC TẾ trước khi chấm kiến trúc

`context.md` ghi luật trên giấy; repo mới là luật đang chạy. Trước khi nói "nên làm X", mở repo xem **feature/module chuẩn nhất** đang làm thế nào:

```bash
find <fe>/src -maxdepth 2 -type d | sort            # cách phân lớp pages/features
grep -rl "useQuery\|useMutation" <fe>/src           # server-state lib nào đang là chuẩn
ls <fe>/src/**/api* <fe>/src/**/query* 2>/dev/null  # API client chung? query-keys chung?
find <be>/app/modules -maxdepth 2 -type d           # pattern aggregate của backend
```

Xác định và ghi vào mục _Kiến trúc & tính nhất quán_: **feature tham chiếu** đầy đủ nhất, nơi đặt type/vocabulary dùng chung, API client chung, cơ chế cache/store, guardrail dữ liệu (soft-delete / tenant / provenance / audit). Feedback mạnh nhất có dạng: *"chỗ này lệch với `<feature X>` (`path:line`) — vốn là chuẩn hiện tại của dự án"*. Không tìm được feature tham chiếu ⇒ nói vậy, đừng lấy best practice chung thế vào.

## Specialist Routing

The code-reviewer lens (delivery-pr-review) always runs. Additionally run **only** the specialist roles listed in `status.md`, each on the real diff, using its section in `roles.md`:

| Change | Specialists |
|---|---|
| Auth, user input, external I/O, payment, PII, upload | INFOSEC (+ `../delivery-dev/references/security.md`) |
| Terraform / CloudFormation / k8s manifest / CI config | SRE·DEVOPS (+ `../delivery-dev/references/devops.md`) — review the **plan**, not just the source |
| IAM / security group / bucket policy / KMS | INFOSEC **and** SRE — both files |
| Hot path, high traffic, large data | PERFORMANCE (+ SRE) |
| Schema, index, migration, heavy query | DBA (+ SRE) |
| Payment | INFOSEC + QC + SRE |
| Architecture change | SA |
| Feature | QC (+ BA for AC coverage) |
| Config, env, deploy-affecting | SRE (+ `../delivery-dev/references/devops.md`) |

Overlap is deliberate: strict §11 already hunts OWASP on the diff; the INFOSEC lens adds what the diff cannot show — threat model, abuse cases, the surface this change opens. Same for DBA over §13 and SRE over §18.

A specialist with nothing to report writes one line saying so. **Do not run a specialist the change does not need** — an InfoSec section on a typo fix is noise, and it teaches the developer to stop reading them.

PERFORMANCE claiming an improvement needs the number from `baseline.md` plus an after-measurement. No numbers ⇒ `NOT_MEASURED`.

**Infrastructure diffs are reviewed from `terraform plan`, not from the `.tf` source alone** — a three-line variable change can produce `must be replaced` on an RDS instance.

Get the plan from CI or from the developer. **Do not run infra commands yourself without an explicit per-command approval** (`devops.md` command policy — `plan` and even `init` are Tier 2). No plan and no approval ⇒ review the source, mark infra findings `UNKNOWN`, and state that nothing was verified against a plan. Never `apply`.

## Dimension Index

Cover each; `Không có vấn đề` or `N/A` where it does not apply. The hunting technique for each lives in delivery-pr-review.

| Dimension | strict § |
|---|---|
| Correctness · edge cases · invariants | §8, §8B, §8D |
| Error handling | §8D.8 |
| Security | §11 |
| Performance | §12 |
| Database | §13 |
| API / contract | §14, §8E |
| Concurrency · atomicity | §8D.5, §8D.6 |
| Backward compatibility | §14, §16 |
| Code quality · architecture | §9, §10 |
| Comment & citation hygiene (ngôn ngữ + ID trần) | delivery-dev — mục _Comment & citation hygiene_ |
| Test quality | §15 |
| Observability · configuration | §17, §18 |
| Scope creep | delivery-dev — `plan.md` §2 Scope |
| Đối chiếu tài liệu ↔ code (kể cả **canon ngoài repo / wiki**) | `references/canon.md` |
| Kiến trúc & tính nhất quán (design-patterns / ADR) | §9, §10 + file pattern/ADR của repo (ghi ở `context.md`) + delivery-dev — mục _Soi convention THỰC TẾ_ |
| Kiến trúc Frontend — 5 tiêu chí + forcing functions (**chỉ** khi diff đụng FE) | `references/frontend.md` |
| Migration · seed · severity theo trạng thái deploy | `references/data-migration.md` + _Severity_ |
| Cần làm rõ (câu hỏi nghiệp vụ cho PM/author) | `references/canon.md` |
| Behavior proof (entry-path × đối kháng) | `references/behavior-proof.md` |





## Comment & citation hygiene

Dễ trôi vì reviewer AI dồn vào correctness/security/tests, còn author AI hay để lại comment bằng ngôn
ngữ nó đang suy luận. Trên diff đụng comment/docstring, kiểm nhanh — theo coding guide của repo (đọc từ `context.md`), không theo cảm tính:

- **Ngôn ngữ comment.** Đúng ngôn ngữ repo quy định (vd English, chỉ giữ **từ khoá domain** bản ngữ
  verbatim — 会議型, 確定, 別日を依頼). Một comment/docstring **nguyên khối tiếng Nhật/bản ngữ** là vi phạm.
- **Không ID trần.** Mọi cite requirement-ID (`AC-007`, `AC-007〜010`, `NFR-3`) phải mang **path committed**
  giải được — `docs/features/<f>.md (AC-010)` — hoặc diễn giải tự-đủ-nghĩa; ID trần là tham chiếu treo,
  rot lặng sau khi code đổi. Cite thưa: chỉ ở nơi implement một business rule không hiển nhiên, không phải mỗi dòng.
- **Không lẫn hai hệ NFR** (canon `NFR-001…` vs task-local `NFR-1…`), và **không cite ID từ thư mục task trong vault** (người khác không thấy).
- **Không con trỏ thay lời giải thích.** Số mục đặc tả trần (`機能仕様書 §5.3`) không kèm path committed, và con trỏ
  PR / issue dùng làm lý do (`(PR #518 review)`), đều là finding **MEDIUM** khi repo có rule trích dẫn thành văn:
  số mục trôi khi tài liệu đánh số lại, còn thảo luận PR thì người đọc sau không lần được. Sửa: câu giải thích tự
  đứng vững; giữ tham chiếu thì `<path committed> (<ID>)` cùng dòng. Câu đã nêu đủ lý do thì xoá đuôi con trỏ.

## Đối chiếu tài liệu & canon

PR feature/logic ⇒ **nạp `references/canon.md`**. Hai trục không gộp: **thẩm quyền** (canon ở `context.md` → Repo Facts → Canon source, bản **mới nhất** thắng; mirror trong repo lag ⇒ finding "sync mirror") và **citation** (ID trong code committed phải resolve tới file committed, kể cả khi 正本 ở wiki). Ba mục bắt buộc trong `review.md`: _Đối chiếu tài liệu_, _Kiến trúc & tính nhất quán_, _Cần làm rõ_ (`N/A` + lý do nếu rỗng).

## Độ sâu tối thiểu trước khi APPROVE — không "gật" từ một lượt core

Một lượt đọc core (§2B/§3/§5) rồi `LGTM` là cái bẫy chính. Với PR **feature / đụng logic / RBAC /
schema**, chưa được `APPROVED` khi chưa làm đủ, mỗi thứ có bằng chứng trong `review.md`:

1. **§8D đi từng mẫu** (không chỉ liếc) + specialist được route.
2. **Đối chiếu canon** (`references/canon.md`) — kể cả wiki, **đã so version và ghi bản chọn làm chuẩn**.
3. **Toolchain chạy THẬT lần này** (regression), **và** nếu PR đụng hành vi thì **Behavior proof** đã
   điền — probe đối kháng trên **mỗi** entry-path, quan sát state (`references/behavior-proof.md`). Suite xanh
   một mình **không** đủ để APPROVE.
4. Ba mục bắt buộc ở Template đã điền (+ bảng 5 tiêu chí FE nếu diff đụng FE).
5. **Mọi claim "an toàn / deferred / idempotent / không cần migration" đã trace** (mục _Verify claims_),
   và trạng thái deploy đã biết cho mọi finding migration/seed/compat.
6. **Một lượt TOÀN-aggregate sau lượt đọc theo hunk.** Diff đọc theo từng khối bỏ sót thuộc tính
   xuyên-file — mở trọn các file của aggregate bị đụng và truy: (a) hàm/logic **trùng** giữa các file
   anh em (một `repository` thêm đúng cái file kia đã có → dead/duplicate); (b) invariant trải trên
   ≥2 hàm (giá trị set ở hàm A, đọc lại ở hàm B — có khớp nhau không); (c) chỗ **khớp một bản ghi bằng
   giá trị MỀM** (timestamp/tên/label có thể sửa hoặc soft-delete) thay vì id ổn định — nó gãy im lặng
   khi giá trị đó đổi. Ba thứ này không bao giờ nằm gọn trong một hunk.

Thiếu bất kỳ mục nào ⇒ chưa APPROVE; nói rõ còn thiếu gì. "Nhanh" ở đây = bỏ bước, không phải gọn.

## Chạy toolchain THẬT — bật cả DB nếu cần

`§8C`: claim trong PR/DoD không phải bằng chứng. CI chưa chạy (`total_count: 0`) cũng vậy. Tự chạy:

- **Cần DB mà có `docker compose`** ⇒ `docker compose up -d postgres` (chờ healthy) rồi chạy — đừng
  dừng ở `NOT_RUN` khi compose sẵn có. `NOT_RUN` chỉ khi thật sự không dựng được.
- Chạy **targeted trước, rồi full suite** cho AC "existing tests green" / regression (§15/§16).
  Một test **đỏ** ⇒ `§8C.1`: tái hiện trên **merge-base** — đỏ-y-hệt = pre-existing/môi trường
  (không phải finding của PR), xanh-base-đỏ-head = PR gây ra.
- **Diff đụng FE ⇒ CHẠY FE, không để `UNKNOWN`.** `npm run build` (tsc + vite) **và** `vitest`, và
  **mở browser** cho mọi luồng có màn hình/nav mới (deep-link, route mới) — một 404 runtime chỉ lộ
  khi thật sự mở màn, không lộ khi đọc code. i18n "parity" đếm khoá **có mặt** ở cả JA/EN, nó KHÔNG
  bắt được khoá **chết** (khai báo nhưng không call-site nào gọi); muốn chắc thì grep call-site của
  khoá mới. Để FE ở `NOT_RUN`/`UNKNOWN` trong khi `npm` chạy được = bỏ bước, không phải giới hạn môi trường.
- Ghi **lệnh + số thật** vào khối `🧰 Verification` của `review.md`. Trả working tree về nhánh cũ khi xong.

## Behavior proof — chạy hành vi đã đổi, KHÔNG chỉ chạy suite của tác giả

PR đụng hành vi ⇒ **nạp `references/behavior-proof.md`**. Không thương lượng: enumerate **mọi** entry-path tới operation đã đổi (grep xuyên repo), mỗi path một probe đối kháng **chỉ trên local/compose**, quan sát **response + state**, ≥1 probe là case bypass/negative mà suite tác giả không phủ. Bảng _Behavior proof_ trống, hoặc chỉ có toolchain xanh ⇒ **không APPROVED**.

## Severity

| Level | Means |
|---|---|
`CRITICAL` | Data loss/corruption, auth bypass, security hole, likely production outage — blocks
`HIGH` | Requirement not met, missing error path, likely bug, missing required test — blocks
`MEDIUM` | Should fix, does not block the issue
`LOW` | Nit, style, optional improvement

Any `CRITICAL`/`HIGH` ⇒ `REVIEW_STATUS: CHANGES_REQUIRED`.

**Severity phụ thuộc trạng thái triển khai.** Migration / dữ liệu cũ / backward-compat / seed có thể là
`CRITICAL` khi hệ thống đã chạy staging/prod, nhưng gần như vô hại khi **chưa deploy** (seed lại từ đầu là
đúng cách). Đọc ở `context.md` → Repo Facts → **Deploy state** (operational-check chạy *sau* review nên không dùng được ở đây); `UNKNOWN` ⇒ **hỏi
developer** trước khi chốt verdict, đừng mặc định chiều nào. Trong finding ghi rõ điều kiện
("HIGH nếu đã chạy staging; LOW nếu chưa deploy").

**Một `MEDIUM` ở bốn nhóm hệ quả cao KHÔNG được `APPROVE + follow-up` lặng lẽ:** data-integrity ·
workflow/state-invariant · **RBAC-visible affordance** (nút/nav lộ sai vai — kể cả khi server đã chặn:
server chặn ngăn khai thác, không ngăn người dùng bấm-là-lỗi) · migration-correctness. Với các nhóm này,
trước khi `APPROVED`: **hoặc** sửa trong PR, **hoặc** mở issue theo dõi **có số** và liệt kê ở
_Required Fixes_. "Chấp nhận cho リハーサル" không kèm số issue là đúng cái cách một lỗi thật đi thẳng
tới bàn reviewer người. `LOW` thật (nit/style/tùy chọn) vẫn không chặn.

**Fail-closed:** một finding thuộc bốn nhóm trên mà bị **hạ xuống LOW**, **"accepted"**, hay **"cho
リハーサル/dev"** — nếu **không** có số issue trong _Required Fixes_ — thì verdict là `CHANGES_REQUIRED`,
không phải APPROVED. "Đã ghi nhận / tác giả chấp nhận" **không** thay được số issue.

## Template

```md
# Code Review

## Scope
<diff: base...HEAD, N files, M lines> · <files đọc thêm ngoài diff và lý do> · <file chỉ lướt: generated/lockfile/snapshot>
Trạng thái deploy: <chưa deploy | staging | prod | UNKNOWN — đã hỏi>
Feature tham chiếu (chuẩn của repo): <path — vì sao chọn>
References đã nạp: <open-pr · data-migration · frontend · canon · behavior-proof · security · devops — chỉ những cái điều kiện khớp; không cái nào ⇒ `none` + vì sao>

## Findings

### CRITICAL
- [C1] `path/file.py:88` — <vấn đề>
  Evidence: <dòng code / trace>
  Impact: <hỏng cụ thể ra sao>
  Fix: <làm gì>

### HIGH
- [H1] ...

### MEDIUM
- [M1] ...

### LOW
- [L1] ...

## Specialist Review

### INFOSEC
- [H2] ... (hoặc: không có vấn đề ở surface này)

### DBA
...

## Ngầm định của tác giả (đã phá)
- <「X luôn tồn tại」/「chỉ 1 path làm Y」/「khớp bằng giá trị mềm」> → <đường phá đã thử: OK / FAIL→finding>

## Đối chiếu tài liệu (canon ↔ code)
- Nguồn đã quét + version: <docs/… vX (ngày) · PMS wiki <page> vY (ngày) · ADR…> → **chuẩn: <bản mới nhất>** (hoặc "chưa đối chiếu được wiki — <lý do>")
- Đối chiếu: <DDL/AC/glossary/ngữ nghĩa FR, trích nguyên văn, có bằng chứng>
- Discrepancies: <do PR này hay refinement issue trước>

## Kiến trúc & tính nhất quán
- Pattern/ADR của repo: <điểm khớp + điểm lệch, có file:line>
- So với feature tham chiếu: <lệch ở đâu, file:line cả hai phía>

### Frontend — 5 tiêu chí (bỏ nếu không đụng FE: `N/A`)
| # | Tiêu chí | Kết quả | Ghi chú (`file:line`) |
|---|---|---|---|
| 1 | Chia đúng theo nghiệp vụ | ✅/⚠️/❌ | … |
| 2 | File không quá dài | … | … |
| 3 | Type/định nghĩa một nguồn | … | … |
| 4 | Cache/store theo lib repo đang dùng | … | … |
| 5 | API client chung | … | … |

## 🧰 Verification (đã chạy lần này, có số)
```
<lệnh + kết quả thật; test đỏ đã phân loại pre-existing/PR theo §8C.1>
```

## Behavior proof (PR đụng hành vi — bắt buộc; trống hoặc chỉ có toolchain = KHÔNG APPROVED)
| Entry-path tới operation | Input đối kháng | Response quan sát | State quan sát (DB/side-effect) | Verdict |
|---|---|---|---|---|
| <route / inbox-consumer / batch / CLI> | <negative/boundary/bypass> | <mã + body> | <row count / event / side-effect> | PASS / FAIL / NOT_RUN(lý do) |
≥1 dòng phải là case bypass/negative KHÔNG nằm trong suite tác giả. (N/A chỉ khi PR không đụng hành vi — ghi rõ.)

## Cần làm rõ (câu hỏi cho PM/author — không chặn merge)
- <câu hỏi nghiệp vụ, mỗi câu là 1 quyết định người khác phải chốt>
- <nghi vấn chưa dựng được đường đi tới lỗi · version spec bằng nhau mà lệch nội dung · trạng thái deploy nếu ảnh hưởng severity>

## Làm tốt (tùy chọn — chỉ khi cụ thể, theo strict §22 🌟)
- <chỗ làm đúng và khó, có file:line; không có thì bỏ mục>

## UNKNOWN
- <điều không kiểm chứng được + vì sao> — KHÔNG tính là PASS (đã thử repo + wiki + PM tools chưa?)

## Required Fixes
- [C1] ...
- [H1] ...

## MEDIUM hệ quả cao (data-integrity · workflow-invariant · RBAC-visible · migration) — bắt buộc
| Finding | Nhóm | Xử lý: commit fix `<sha>` \| issue `#<n>` |
|---|---|---|
| [M1] | migration | issue #612 |
Ô "Xử lý" trống, hoặc ghi "accepted / cho リハーサル" không có số ⇒ **CHANGES_REQUIRED**. Không có finding nhóm này ⇒ ghi `None`.

## Độ sâu tối thiểu (in kết quả — ô chưa tick ⇒ không được APPROVED)
- [ ] §8D đi từng mẫu + specialist được route
- [ ] Canon đã đối chiếu, version + bản chọn ghi ở trên
- [ ] Toolchain chạy thật lần này (BE + FE nếu đụng FE)
- [ ] Behavior proof điền (hoặc N/A có lý do)
- [ ] Claim "an toàn/deferred/idempotent/không cần migration" đã trace
- [ ] Lượt toàn-aggregate (trùng lặp · invariant ≥2 hàm · khớp bằng giá trị mềm)
- [ ] `References đã nạp` khớp bảng _Nạp thêm theo diff_ (điều kiện khớp mà không nạp = lens bị bỏ)
- [ ] Route khớp diff (gate-in PASS dòng route freshness) — FAIL ⇒ finding HIGH "route stale: migration không qua DBA/operate", CHANGES_REQUIRED

---

REVIEWED_SHA: <git rev-parse HEAD>
REVIEW_STATUS: APPROVED | CHANGES_REQUIRED
```

Findings first — no preamble, no "the implementation appears to follow good engineering principles, however…".

Nothing found (chỉ được viết sau khi đã qua _Độ sâu tối thiểu_ — không phải lối tắt bỏ bước):

```text
LGTM.

- Requirement matched (đối chiếu canon).
- No critical issue found (§8D đã đi từng mẫu + specialist).
- Tests cover the changed behavior (đã chạy thật lần này).
```

Never invent a finding to make the review look thorough — và cũng đừng `LGTM` khi mới đọc lướt.

## Fix Loop

`CHANGES_REQUIRED` ⇒ state `FIXING`:

1. Report the required fixes in Vietnamese, severity first.
2. Fix via `delivery-dev-implement` (each fix is a tracked step in `implementation.md`).
3. Re-run the tests on the new state.
4. Re-run this skill on the **new** diff; mark each earlier finding `FIXED` / `NOT FIXED` / `WON'T FIX (reason)`.

Same finding surviving 3 loops ⇒ stop and escalate with what was tried.

Scope-creep findings are not "fixed" by keeping the change — revert the out-of-scope edit and recommend a separate issue for the real problem it uncovered.

## Gate Out

`REVIEW_STATUS: APPROVED` only when **all** of:

```text
[ ] Không còn CRITICAL/HIGH mở
[ ] Mọi MEDIUM hệ quả cao có commit fix hoặc số issue (bảng trong template)
[ ] Mọi ô "Độ sâu tối thiểu" đã tick (gồm dòng References đã nạp)
[ ] Behavior proof điền cho PR đụng hành vi (toolchain xanh một mình không bao giờ APPROVED)
[ ] REVIEWED_SHA = HEAD, working tree sạch
```

→ continue to `delivery-dev-verify`.

**Record `REVIEWED_SHA: <git rev-parse HEAD>` in `review.md`.** `APPROVED` covers exactly that SHA. Any commit added afterwards — a review fix, a polish pass, a new developer request, a rebase — leaves the change since then unreviewed; re-run this phase on that delta before verify / PR / merge (`conventions.md` §3 — after a rebase the delta is `git range-diff`, not `REVIEWED_SHA..HEAD`). "Already reviewed once" never blankets the patches that came after — that snapshot gap is exactly how an unreviewed deep-link / migration / dead key reaches the human reviewer.

Reviewing your own implementation is expected here — the safeguard is the diff and the evidence rule, not detachment. Never mark `APPROVED` because the implementation phase said it was done, and never turn an `UNKNOWN` into a `PASS`.

## Report

Phase summary: files reviewed (and what was read beyond the diff), count per severity, the blocking findings, `UNKNOWN` items, verdict, next = fix or verify.

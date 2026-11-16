---
name: delivery-dev-context
description: "Phase 2 of delivery-dev — load the project context relevant to a GitHub Issue (AGENTS.md, CLAUDE.md, README, CONTRIBUTING, architecture and docs, existing skills, coding and testing conventions) into SoraVaults/<project>/issue <n>/context.md before the issue is interpreted. Use after issue intake and before classification, or when asked what project rules apply to an issue."
---

# Devflow · Phase 2 — Project Context Loading

Read `../delivery-dev/references/conventions.md` and `../delivery-dev/references/writing-policy.md` first.

**In:** `00-original.md` · **Out:** `SoraVaults/<project>/issue <n>/01-context.md` · **State:** `ISSUE_RECEIVED → CONTEXT_LOADED`

**Gate-in (bắt buộc, trước mọi việc khác):** `~/.config/herdr-app/skills/delivery-dev/scripts/delivery-dev-gate.sh <issue> context` — paste nguyên output vào mục `## Gate-in` đầu artifact. `GATE: FAIL` ⇒ **không chạy phase này**: xử lý dòng FAIL hoặc dừng và báo (conventions §3b). Không có khối Gate-in trong artifact = phase chưa chạy hợp lệ.

## Job

Learn the project's own rules **before** interpreting the issue, so the understanding, plan and implementation are shaped by this repository and not by generic defaults.

### `01-context.md` vs `03-understanding.md`

They are answering different questions and must not bleed into each other:

| | Trả lời | Test để phân biệt |
|---|---|---|
| `01-context.md` | Dự án này bắt tôi làm theo cách nào? | Xoá issue này đi, câu đó **vẫn đúng** ⇒ thuộc context |
| `03-understanding.md` | Issue này nghĩa là gì, cần làm gì? | Câu đó **chỉ đúng cho issue này** ⇒ thuộc understanding |

`ADR 0001 cấm dùng DynamoDB` là context. `#86 phải sinh phiếu liên lạc đơn hàng (受注連絡票)` là understanding. Lọc context theo issue là đúng (đừng nạp cả repo) — nhưng lọc khác với mô tả issue.

```text
GitHub Issue → Project Context → Issue Understanding
```

## Steps

1. Discover what exists — do not read everything yet:

   ```bash
   ls AGENTS.md CLAUDE.md README* CONTRIBUTING* 2>/dev/null
   ls -d docs architecture doc .claude .cursor 2>/dev/null
   ls .claude/skills .claude/rules .claude/commands 2>/dev/null
   ls .github/PULL_REQUEST_TEMPLATE* .github/ISSUE_TEMPLATE* 2>/dev/null
   ```

2. Read the always-relevant ones if present: `AGENTS.md`, `CLAUDE.md` (plus the files it `@imports`), `CONTRIBUTING.md`, and the README section that describes layout or commands.
3. Read **only the docs the issue touches** — pick them by the issue's domain terms, not by reading `docs/` wholesale.
4. Extract the coding conventions (style, layering, naming, lint/format commands) and the testing conventions (framework, where tests live, how they run, coverage expectations).
5. Note existing skills/commands/rules in this repo that already cover part of this work — reuse them instead of reinventing.
6. Fill **Repo Facts** (below) — every field, from evidence. These are read by `delivery-dev-gate.sh` and by later phases that would otherwise guess:

   ```bash
   git symbolic-ref --short refs/remotes/origin/HEAD           # nhánh mặc định trên remote
   git branch -r --list 'origin/main' 'origin/master' 'origin/develop' 'origin/dev'
   for b in origin/develop origin/main; do echo "$b $(git rev-list --count $(git merge-base $b HEAD)..HEAD)"; done
   grep -rniE 'base branch|develop|refs #|closes #|fixes #' CONTRIBUTING* .claude/rules .github/*TEMPLATE* 2>/dev/null | head
   ```

   Base branch = the branch this work's PR targets (repo rule first, then the nearest merge-base) — never assumed to be `main`. Canon = where the **authoritative requirement** lives as the project itself declares it (spec dir, wiki, PM tool); if the repo names none, write `repo docs/ (không khai báo nơi khác)`. Deploy state = what has already run where, because it sets migration/compat severity in review — unknown ⇒ `UNKNOWN — hỏi developer`, never a guess.
7. Write `01-context.md`.

## Scope Rule

**Do not blindly load the entire repository.** Relevance to this issue is the filter. A rule you cannot connect to the issue does not belong in `context.md`.

If a section has nothing relevant, write `Không có / not applicable` — do not pad it.

## Glossary (bắt buộc khi issue/domain dùng tiếng Nhật)

The developer reads Vietnamese. A document full of bare 受注 / 工事台帳 / 帳票 is unusable for them.

Collect every domain term the issue and the code use, once, here — later artifacts cite this table instead of re-explaining:

| Nguyên gốc | Đọc | Nghĩa tiếng Việt | Trong hệ thống này |
|---|---|---|---|
| 受注 | juchuu | nhận đơn hàng | trạng thái sau khi 見積 được duyệt |
| 工事台帳 | kouji daichou | sổ theo dõi công trình | bảng `kouji_daicho`, nguồn dữ liệu cho báo cáo |
| 帳票 | chouhyou | biểu mẫu in ra cho khách | PDF sinh từ WOFF |

Keep the original form in the table (it is what appears in the UI and the code), plus the Vietnamese meaning. Term with no Vietnamese equivalent ⇒ describe it in one clause, do not invent a translation.

## Template

```md
# Project Context

## Repo Facts
- **Base branch**: `origin/develop`
- **Shared branches**: `main`, `develop`   (không bao giờ commit/push thẳng lên đây)
- **Task dir**: `SoraVaults/<project>/issue <n>/` (ghi đường dẫn tuyệt đối thật); thư mục cũ trong repo nếu có: `tasks/…` — chỉ đọc
- **Issue link keyword**: `Refs #<n>` | `Closes #<n>` — nguồn: `.claude/rules/pull-request.md`
- **Canon source**: <nơi requirement gốc — vd PMS wiki project `<id>` (MCP `wiki_*`), `docs/features/` là mirror> · cách đọc · version đã thấy
- **Deploy state**: local ✔ · dev ✔ (auto từ develop) · staging ✗ · prod ✗ — nguồn / hoặc UNKNOWN — hỏi developer
- **Data-change paths**: `(^|/)alembic/versions/|(^|/)seeds?/`   (tuỳ chọn — regex để gate bắt migration/seed; bỏ trống = mặc định)
- **Verify commands**: BE `<lệnh>` · FE `<lệnh>` · browser `<cách mở màn>`

## Glossary
| Nguyên gốc | Đọc | Nghĩa tiếng Việt | Trong hệ thống này |
|---|---|---|---|

## Relevant Project Rules
- <rule> — nguồn: `AGENTS.md`, vì sao liên quan đến issue này

## Architecture Context
<phần kiến trúc mà issue này chạm vào>

## Coding Conventions
- Style / layering / naming
- Lint, format, typecheck commands

## Testing Conventions
- Framework, vị trí test, lệnh chạy

## Relevant Documentation
- `docs/...` — nội dung liên quan

## Important Constraints
- <constraint kỹ thuật hoặc nghiệp vụ, kèm nguồn>

## Existing Skills / Commands to Reuse
- `.claude/skills/...` — hoặc: không có

## PR / Issue Template
- `.github/PULL_REQUEST_TEMPLATE.md` — <các section bắt buộc, ngôn ngữ> — hoặc: không có

## Context Sources
- `AGENTS.md`
- `docs/...`

---

CONTEXT_STATUS: LOADED
```

Label anything not read directly from a file: `INFERENCE` / `ASSUMPTION` (see conventions §4). A convention you inferred from surrounding code is an `INFERENCE`, not a rule.

## Downstream Contract

`context.md` is an **input** to every later phase:

- `delivery-dev-understand` — reads constraints and domain vocabulary before interpreting the issue.
- `delivery-dev-investigate` — starts from the architecture context; prefers the documented existing pattern.
- `delivery-dev-plan` — the plan must comply with the coding + testing conventions recorded here.
- `delivery-dev-implement` — follows them; a deliberate deviation is explained and logged in `decisions.md`.
- `delivery-dev-review` — reviews against these conventions, not generic ones.
- Every phase — cites the Glossary instead of re-translating a term each time.
- `delivery-dev-pr` — the PR template recorded here is the skeleton of `pr.md`; it outranks the skill's own fallback. **Issue link keyword** decides `Refs` vs `Closes`.
- `delivery-dev-gate.sh` — reads `Base branch` and `Data-change paths` from **Repo Facts**. Missing ⇒ it guesses and warns; fix the field instead of living with the warning.
- `delivery-dev-implement` — refuses to commit on any branch in **Shared branches**.
- `delivery-dev-review` — diffs against **Base branch**, reads requirement from **Canon source**, sets migration/compat severity from **Deploy state**.

## Gate Out

`context.md` exists with real sources listed **and every Repo Facts field filled** (a value, or `UNKNOWN — <why>`) → continue to `delivery-dev-classify`.

When sources conflict, the higher one wins and the conflict is stated — see conventions §5b Context Priority.

## Report

Phase summary: which rule files exist, the 2–3 constraints that will actually shape this issue, test command, next = Understanding.

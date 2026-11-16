#!/usr/bin/env bash
# delivery-dev-gate — kiểm gate-in của một phase delivery-dev từ artifact trên đĩa.
#
#   delivery-dev-gate.sh <issue-number> <phase>
#
# Chạy ở repo root. Workspace nằm trong vault SoraVaults (luat-chung §6), không trong repo. In checklist [PASS]/[FAIL]/[WARN], dòng cuối `GATE: PASS|FAIL`,
# exit 0 khi PASS, 1 khi FAIL, 2 khi sai tham số / không tìm thấy workspace.
# Phase paste NGUYÊN output này vào đầu artifact của mình — không paste = chưa qua gate.
#
# Env (tuỳ chọn):
#   DELIVERY_DEV_BASE        base branch để tính diff (mặc định: `Base branch:` trong context.md,
#                       rồi đoán nhánh chung có merge-base gần HEAD nhất, kèm WARN)
#   DELIVERY_DEV_DATA_PATHS  regex (grep -E) cho file đổi dữ liệu/schema (mặc định: `Data-change paths:`
#                       trong context.md, rồi giá trị DEFAULT_DATA_PATHS dưới)

set -u

DEFAULT_DATA_PATHS='(^|/)(migrations?|alembic|versions|seeds?|fixtures/seed)/|(^|/)seed[^/]*\.(py|ts|sql|json|ya?ml)$|schema\.(sql|prisma)$|\.sql$'
PHASES='context classify understand investigate solution plan implement test review verify operate pr followup learn'

usage() { echo "usage: delivery-dev-gate.sh <issue-number> <phase>   phases: $PHASES" >&2; exit 2; }
[ $# -eq 2 ] || usage
N="${1#\#}"; PHASE="$2"
case " $PHASES " in *" $PHASE "*) ;; *) usage ;; esac

FAILS=0
pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*"; FAILS=$((FAILS + 1)); }
warn() { echo "[WARN] $*"; }

# --- workspace: <SoraVaults>/<dự án>/issue <n>/ (luat-chung §6); tasks/ trong repo là dạng cũ ----------
VP="$HOME/.config/herdr-app/skills/delivery-start/scripts/vault-path.sh"
P=$(bash "$VP" 2>/dev/null) || { echo "vault-path.sh lỗi — kiểm $VP" >&2; exit 2; }
D="$P/issue $N"
LEGACY=$(ls -d "tasks/$N-"*/ "tasks/#$N"/ "tasks/#$N-"*/ 2>/dev/null | sort -u | head -1)
if [ ! -d "$D" ]; then
  if [ -n "$LEGACY" ]; then
    warn "chưa có \"$D\" — dùng thư mục cũ trong repo $LEGACY (chỉ đọc theo luật; nên chuyển sang vault)"
    D="$LEGACY"
  elif [ "$PHASE" = context ]; then echo "[FAIL] không có \"$D\" — chạy delivery-dev-intake trước"; echo "GATE: FAIL"; exit 1
  else echo "không tìm thấy workspace cho #$N (\"$D\")" >&2; exit 2
  fi
elif [ -n "$LEGACY" ]; then
  warn "còn thư mục cũ $LEGACY trong repo — chỉ để tham khảo, ghi tiếp vào vault"
fi
D="${D%/}"
echo "workspace: $D · phase: $PHASE · HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo '?')"

# --- helpers --------------------------------------------------------------------------------
art() { ls "$D"/*"$1" 2>/dev/null | head -1; }          # art plan.md → …/issue <n>/09-plan.md
raw() {                                                  # raw <file-suffix> <TOKEN> → giá trị thô
  local f; f=$(art "$1"); [ -n "$f" ] || return 0
  grep -E "^$2:" "$f" | tail -1 | sed -E "s/^$2:[[:space:]]*//"
}
tok() { raw "$1" "$2" | awk '{print $1}'; }             # chỉ lấy từ đầu — token trần
has() { [ -n "$(art "$1")" ]; }

need_tok() {                                             # need_tok <file> <TOKEN> <expected…>
  local file="$1" key="$2"; shift 2
  local v full; full=$(raw "$file" "$key"); v=$(printf '%s' "$full" | awk '{print $1}')
  if ! has "$file"; then fail "$file chưa có (cần $key: $*)"; return; fi
  if [ -z "$v" ]; then fail "$file không có dòng $key:"; return; fi
  [ "$full" = "$v" ] || warn "$file: '$key: $full' có hậu tố tự do — token phải đứng riêng một dòng, ghi chú xuống dòng dưới"
  local e; for e in "$@"; do [ "$v" = "$e" ] && { pass "$file $key: $v"; return; }; done
  fail "$file $key: $v (cần: $*)"
}

STATUS=$(art status.md)
section() { [ -n "$STATUS" ] && sed -n "/^## $1/,/^## /p" "$STATUS" | sed '1d;$d'; }
routed() { section Phases | grep -qiE "^- \[[ xX]\] $1"; }   # phase có trong danh sách Phases
roles_line() { section Roles | grep -vE '^[[:space:]]*(-|$)' | head -1; }

CONTEXT=$(art context.md)
ctx_field() { [ -n "$CONTEXT" ] && grep -E "^- \*\*$1\*\*:|^$1:" "$CONTEXT" | head -1 | sed -E "s/^(- \*\*$1\*\*|$1):[[:space:]]*//" | sed -E 's/`//g'; }

BASE="${DELIVERY_DEV_BASE:-$(ctx_field 'Base branch' | awk '{print $1}')}"
if [ -z "$BASE" ]; then
  # Đoán: nhánh chung có merge-base gần HEAD nhất. origin/HEAD một mình hay sai (nhánh cắt từ develop).
  best=""; bestn=""
  for c in origin/develop origin/main origin/master $(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null); do
    mb=$(git merge-base "$c" HEAD 2>/dev/null) || continue
    n=$(git rev-list --count "$mb"..HEAD)
    if [ -z "$bestn" ] || [ "$n" -lt "$bestn" ]; then best="$c"; bestn="$n"; fi
  done
  BASE="$best"
  [ -n "$BASE" ] && warn "context.md chưa ghi 'Base branch:' — đoán base = $BASE ($bestn commit từ merge-base). Ghi vào context.md để khỏi đoán."
fi
DATA_RE="${DELIVERY_DEV_DATA_PATHS:-$(ctx_field 'Data-change paths')}"
[ -n "$DATA_RE" ] || DATA_RE="$DEFAULT_DATA_PATHS"

tree_clean() {
  local dirty; dirty=$(git status --porcelain -- . ':(exclude)tasks' ':(exclude).awog' 2>/dev/null)
  if [ -z "$dirty" ]; then pass "working tree sạch"; else
    fail "working tree bẩn — commit trước; REVIEWED_SHA không phủ thay đổi chưa commit:"
    printf '%s\n' "$dirty" | head -10 | sed 's/^/       /'
  fi
}

sha_bound() {                                            # A3: REVIEWED_SHA phải == HEAD
  local r h; r=$(tok review.md REVIEWED_SHA); h=$(git rev-parse HEAD 2>/dev/null)
  if [ -z "$r" ]; then fail "review.md không có REVIEWED_SHA"; return; fi
  if [ "$(git rev-parse "$r" 2>/dev/null)" = "$h" ]; then pass "HEAD == REVIEWED_SHA ($(git rev-parse --short HEAD))"; return; fi
  if git merge-base --is-ancestor "$r" HEAD 2>/dev/null; then
    fail "HEAD ≠ REVIEWED_SHA — $(git rev-list --count "$r"..HEAD) commit chưa review: delivery-dev-review trên $r..HEAD"
  else
    fail "REVIEWED_SHA $r KHÔNG phải ancestor của HEAD (rebase/amend) — range $r..HEAD vô nghĩa. Delta thật: git range-diff $r...HEAD (commit nào đổi nội dung) — review lại các commit đó, rồi cập nhật REVIEWED_SHA"
  fi
}

route_fresh() {                                          # A2: diff đụng dữ liệu/schema mà route thiếu DBA/operate
  if [ -z "$BASE" ]; then warn "không xác định được base branch — ghi 'Base branch:' vào context.md; bỏ qua kiểm route"; return; fi
  local mb files; mb=$(git merge-base "$BASE" HEAD 2>/dev/null) || { warn "không tìm thấy merge-base với $BASE"; return; }
  files=$(git diff --name-only "$mb" HEAD 2>/dev/null | grep -E "$DATA_RE" | grep -vE '^tasks/')
  if [ -z "$files" ]; then pass "diff không đụng migration/seed/schema (base $BASE)"; return; fi
  local ok=1
  roles_line | grep -qw DBA || { fail "diff đụng migration/seed/schema nhưng Roles trong status.md không có DBA — route stale, chạy lại delivery-dev-classify:"; ok=0; }
  routed 'operational check' || { fail "diff đụng migration/seed/schema nhưng Phases không có 'operational check' — route stale"; ok=0; }
  [ $ok -eq 1 ] && pass "diff đụng migration/seed/schema, route đã có DBA + operational check" \
    || printf '%s\n' "$files" | head -10 | sed 's/^/       /'
}

approval() {
  routed 'human approval' || { pass "human approval không được route"; return; }
  local v; v=$(tok status.md APPROVAL_STATUS)
  [ "$v" = APPROVED ] && pass "status.md APPROVAL_STATUS: APPROVED" || fail "human approval được route nhưng status.md APPROVAL_STATUS: ${v:-<thiếu>} (cần APPROVED)"
}

no_change() {                                            # issue đã thoát không-code ⇒ không chạy tiếp
  local u i; u=$(tok understanding.md UNDERSTANDING_STATUS); i=$(tok investigation.md INVESTIGATION_STATUS)
  case "$u$i" in *NO_CHANGE*) fail "issue đã kết thúc không-code (NO_CHANGE) — developer đóng issue, không chạy phase nào nữa";; esac
}

# --- gate-in theo phase ---------------------------------------------------------------------
[ "$PHASE" = context ] || [ "$PHASE" = classify ] || no_change
case "$PHASE" in
  context|classify|understand) ;;
  *) need_tok status.md ROUTE_STATUS PLANNED ;;   # route là nguồn cho mọi `routed` bên dưới
esac
case "$PHASE" in
  context)     has original.md && pass "original.md có" || fail "original.md chưa có" ;;
  classify)    need_tok context.md CONTEXT_STATUS LOADED ;;
  understand)  has original.md && pass "original.md có" || fail "original.md chưa có"
               need_tok context.md CONTEXT_STATUS LOADED
               need_tok status.md ROUTE_STATUS PLANNED ;;
  investigate) need_tok understanding.md UNDERSTANDING_STATUS READY ;;
  solution)    need_tok investigation.md INVESTIGATION_STATUS READY ;;
  plan)        need_tok understanding.md UNDERSTANDING_STATUS READY
               routed investigate && need_tok investigation.md INVESTIGATION_STATUS READY
               routed solution && need_tok solution.md SOLUTION_STATUS APPROVED
               route_fresh ;;
  implement)   need_tok understanding.md UNDERSTANDING_STATUS READY
               routed plan && need_tok plan.md PLAN_STATUS READY
               approval; route_fresh ;;
  test)        need_tok implementation.md IMPLEMENTATION_STATUS DONE
               route_fresh ;;
  review)      need_tok implementation.md IMPLEMENTATION_STATUS DONE
               routed test && need_tok tests.md TEST_STATUS PASSED
               tree_clean; route_fresh ;;
  verify)      routed test && need_tok tests.md TEST_STATUS PASSED
               need_tok review.md REVIEW_STATUS APPROVED
               sha_bound; tree_clean; route_fresh ;;
  operate)     need_tok verification.md FINAL_STATUS VERIFIED
               sha_bound ;;
  pr)          need_tok verification.md FINAL_STATUS VERIFIED
               routed 'operational check' && need_tok operational-check.md OPERATIONAL_STATUS READY
               sha_bound; tree_clean; route_fresh ;;
  followup)    need_tok pr.md PR_STATUS READY ;;
  learn)       has pr.md && pass "pr.md có" || warn "chưa có pr.md — learn thường chạy sau PR" ;;
esac

# --- traceability: bắt buộc mọi route có test (chỉ DOCUMENTATION/typo được bỏ) --------------
if routed test; then
  case "$PHASE" in
    implement|test|review|verify) has traceability.md && pass "traceability.md có" || fail "traceability.md chưa có (investigate/solution tạo)";;
    pr) need_tok traceability.md TRACEABILITY_STATUS COMPLETE ;;
  esac
fi

if [ "$FAILS" -eq 0 ]; then echo "GATE: PASS"; exit 0; else echo "GATE: FAIL ($FAILS)"; exit 1; fi

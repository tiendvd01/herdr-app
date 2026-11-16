#!/usr/bin/env bash
# spec-sync.sh — đối soát spec mới từ repo PM (Malme) với bản ghim trong repo dev.
# Chỉ ĐỌC. Không ghi gì lên GitHub / wiki.
set -euo pipefail

die() { printf '%s\n' "$*" >&2; exit 1; }
command -v gh >/dev/null || die "Thiếu gh CLI"
command -v jq >/dev/null || die "Thiếu jq"

PROFILE_DIR="${DELIVERY_PROFILE_DIR:-$HOME/.config/herdr-app/skills/sora-profile}"
[[ -f "$PROFILE_DIR/profile.env" ]] || { printf 'Thiếu hồ sơ team: %s/profile.env\n' "$PROFILE_DIR" >&2; exit 1; }
# shellcheck source=/dev/null
. "$PROFILE_DIR/profile.env"
# shellcheck source=/dev/null
. "$PROFILE_DIR/scripts/projects.sh"
OWNER="${SORA_GH_OWNER:-$GH_OWNER}"
GH_OWNER="$OWNER"
PROJ="${1:-}"

usage() {
  cat <<'EOF'
spec-sync.sh <dự án> <lệnh> [tham số]   — chỉ đọc, không ghi

Dự án:  168 | 147 | 167 | lunchbox
        (cấu hình ở sora-profile/scripts/projects.sh, giải thích ở sora-profile/references/du-an-va-nguon.md)

LỆNH — tầng nghiệp vụ
  status                    版数 bản ghim (repo dev) ↔ 版数 canon (repo PM) + SHA head
  changelog [n]             n dòng đầu của docs/CHANGELOG.md repo PM (mặc định 60)
  notices                   Bảng 変更通知 台帳 + các bản CHƯA gửi
  notice <tên file|v8.2>    In nội dung 1 bản 変更通知
  refs <tên file|v8.2>      Trích mọi #issue + mã FR/§ được nhắc trong 1 bản 変更通知
  diff <SHA_ghim>           File spec đã đổi giữa SHA ghim và HEAD của repo PM
  commits <SHA_ghim>        Commit repo PM kể từ SHA ghim (1 dòng/commit)
  pinned                    Danh sách file trong thư mục ghim của repo dev
  issue <mã>                Tìm issue repo dev có nhắc tới mã (FR-055, §111, T-407…)
  issues-open               Toàn bộ issue đang mở của repo dev (số · nhãn · tiêu đề)

LỆNH — tầng UI (mockup)
  ui                        Mockup đang sống: SHA commit cuối + ngày. Kèm mockup đã _archive
  ui-diff <SHA_baseline>    Từng mockup KHỚP / LỆCH / KHÔNG KIỂM ĐƯỢC so với baseline

VÍ DỤ
  spec-sync.sh 168 status
  spec-sync.sh 168 diff 8d25a1aa
  spec-sync.sh 168 ui
  spec-sync.sh 168 ui-diff 8d25a1aa

LƯU Ý TẦNG UI
  Mockup KHÔNG có số 版数 — SHA commit là mốc duy nhất so được.
  Baseline UI lưu ở wiki "9.0 — Sync Ledger" dạng:
      <đường dẫn>@<SHA> · <ngày commit> · <người xác nhận> · <ngày xác nhận>
  Script này chỉ đọc; ghi baseline là thao tác wiki, xem SKILL.md §Tầng UI.

CẠM BẪY ĐÃ BIẾT — cả hai đều là "báo thiếu trong im lặng"
  1. API compare CẮT danh sách file ở 300. Khoảng cách xa (vài trăm commit) thì
     'diff' sẽ THIẾU file mà không báo. Lệnh 'diff' nay tự cảnh báo khi chạm trần;
     gặp cảnh báo thì chia nhỏ khoảng so, hoặc dùng 'ui-diff' (không bị trần này).
  2. 'gh api --jq' KHÔNG nhận cờ --arg của jq. Viết nhầm sẽ làm lệnh hỏng;
     nếu còn kèm '|| true' thì lỗi biến thành "không có gì đổi". Không dùng
     '|| true' cho lệnh mà kết quả rỗng mang nghĩa an toàn.

Env: SORA_GH_OWNER (mặc định structuralengine)
EOF
}

case "$PROJ" in
  -h|--help|"") usage; exit 0 ;;
esac
profile_project "$PROJ" || die "Chưa cấu hình dự án '$PROJ' — xem $PROFILE_DIR/references/du-an-va-nguon.md"

CMD="${2:-status}"

# Đường dẫn PM repo có dấu cách + tiếng Nhật → tra blob sha qua git tree API (cache 15'),
# không encode URL.
tree_json() {
  local repo="$1"
  local cache="${TMPDIR:-/tmp}/spec-sync-tree-$(echo "$repo" | tr '/' '_').json"
  if [[ ! -f "$cache" || $(( $(date +%s) - $(stat -f %m "$cache" 2>/dev/null || stat -c %Y "$cache") )) -gt 900 ]]; then
    gh api "repos/$repo/git/trees/HEAD?recursive=1" > "$cache"
  fi
  cat "$cache"
}

read_file() { # read_file <repo> <path đầy đủ>
  local repo="$1" path="$2" sha
  sha=$(tree_json "$repo" | jq -r --arg p "$path" '.tree[] | select(.path==$p) | .sha' | head -1)
  [[ -n "$sha" && "$sha" != "null" ]] || die "Không thấy file: $path (repo $repo)"
  gh api "repos/$repo/git/blobs/$sha" --jq '.content' | base64 -d
}

find_path() { # find_path <repo> <regex> → in mọi path khớp
  tree_json "$1" | jq -r --arg re "$2" '.tree[] | select(.type=="blob") | select(.path|test($re)) | .path'
}

notice_path() { # notice_path <v8.2 | tên file>
  local key="$1"
  [[ -n "$NOTICE_DIR" ]] || die "Dự án $PROJ chưa có thư mục 変更通知 — xem sora-profile/references/du-an-va-nguon.md"
  find_path "$PM_REPO" "^$(printf '%s' "$NOTICE_DIR" | sed 's/[]\/$*.^[]/\\&/g')/.*$(printf '%s' "$key" | sed 's/[]\/$*.^[]/\\&/g')" | grep '\.md$' | head -1
}

need_mockup() {
  [[ -n "$MOCKUP_DIR" ]] || die "Dự án $PROJ không có thư mục mockup/ — tầng UI không áp dụng (xem sora-profile/references/du-an-va-nguon.md)"
}

# Mockup đang sống (bỏ _archive), 1 tên/dòng
live_mockups() {
  gh api "repos/$PM_REPO/contents/$MOCKUP_DIR" --jq '.[] | select(.type=="dir") | .name' 2>/dev/null \
    | grep -v '^_archive$' || true
}

# SHA + ngày commit gần nhất chạm một đường dẫn
last_commit() { # last_commit <path>
  gh api "repos/$PM_REPO/commits?path=$1&per_page=1" \
    --jq '.[0] | "\(.sha[0:8])  \(.commit.author.date[0:10])"' 2>/dev/null || echo "—  —"
}

case "$CMD" in
  status)
    echo "### Bản GHIM — $DEV_REPO/$PINNED_DIR"
    gh api "repos/$DEV_REPO/contents/$PINNED_DIR" --jq '.[].name' | while read -r f; do
      [[ "$f" == *.md ]] || continue
      v=$(gh api "repos/$DEV_REPO/contents/$PINNED_DIR/$f" --jq '.content' | base64 -d | grep -m1 '^\*\*版数\*\*' | cut -c1-120 || true)
      printf '  %-56s %s\n' "$f" "${v:-（không có dòng 版数）}"
    done
    echo
    echo "### Canon — $PM_REPO (HEAD)"
    gh api "repos/$PM_REPO/commits?per_page=1" --jq '.[] | "  HEAD \(.sha[0:8])  \(.commit.author.date)  \(.commit.message|split("\n")[0])"'
    find_path "$PM_REPO" "$CANON_RE" | grep -v '_archive' | while read -r p; do
      v=$(read_file "$PM_REPO" "$p" | grep -m1 '^\*\*版数\*\*' | cut -c1-120 || true)
      printf '  %-70s %s\n' "$(basename "$p")" "${v:-—}"
    done
    echo
    if [[ -n "$MOCKUP_DIR" ]]; then
      echo "### Tầng UI — mockup ($PM_REPO)"
      live_mockups | while read -r d; do
        printf '  %-40s %s\n' "$MOCKUP_DIR/$d" "$(last_commit "$MOCKUP_DIR/$d")"
      done
      echo "  → Chạy 'ui-diff <SHA baseline>' để biết KHỚP hay LỆCH. Baseline ở wiki 9.0 — Sync Ledger."
      echo
      echo "⚠️  Tầng ghim $PINNED_DIR CHỈ phủ phần nghiệp vụ. Mockup KHÔNG có tầng ghim —"
      echo "    thay đổi UI có hiệu lực NGAY giữa sprint. Phải nêu trong báo cáo, không im lặng chấp nhận."
    fi
    echo
    echo "⚠️  So bằng SHA, KHÔNG so bằng số version. SHA đã ghim lấy ở wiki 9.0 §0 hoặc PR sync gần nhất."
    ;;

  ui)
    need_mockup
    echo "### Mockup đang sống — $PM_REPO/$MOCKUP_DIR"
    live_mockups | while read -r d; do
      printf '  %-40s %s\n' "$MOCKUP_DIR/$d" "$(last_commit "$MOCKUP_DIR/$d")"
    done
    echo
    echo "### Mockup đã _archive (issue trỏ vào đây là trỏ vào đất chết)"
    arch=$(tree_json "$PM_REPO" \
      | jq -r --arg d "$MOCKUP_DIR/_archive/" '.tree[] | select(.type=="tree") | select(.path|startswith($d)) | .path' \
      | awk -F/ 'NF>2 {print "  "$3}' | sort -u)
    if [[ -n "$arch" ]]; then printf '%s\n' "$arch"; else echo "  (không có thư mục _archive)"; fi
    echo
    echo "⚠️  Mockup KHÔNG có số 版数 — SHA là mốc duy nhất so được."
    echo "⚠️  Mockup đổi mà spec nghiệp vụ KHÔNG đổi một chữ vẫn làm sai AC."
    echo "    Issue có ảnh chụp / link màn hình cũ → xếp rổ A (outdate)."
    echo
    echo "Baseline UI lưu ở wiki '9.0 — Sync Ledger', dạng:"
    echo "  <đường dẫn>@<SHA> · <ngày commit> · <người xác nhận> · <ngày xác nhận>"
    ;;

  ui-diff)
    need_mockup
    base="${3:?thiếu SHA baseline UI — lấy ở wiki 9.0 Sync Ledger}"
    bdate=$(gh api "repos/$PM_REPO/commits/$base" --jq '.commit.author.date' 2>/dev/null) \
      || die "SHA baseline không hợp lệ: $base"
    echo "### Baseline $base · $bdate"
    echo
    # Dùng API commits?path= — lọc đúng đường dẫn, KHÔNG bị trần 300 file của compare.
    # KHÔNG dùng `|| true` ở đây: rỗng = KHỚP, lỗi = không kiểm được. Phải phân biệt được.
    live_mockups | while read -r d; do
      if ! raw=$(gh api "repos/$PM_REPO/commits?path=$MOCKUP_DIR/$d&since=$bdate&per_page=50" \
            --jq '.[] | "      \(.sha[0:8])  \(.commit.author.date[0:10])  \(.commit.message|split("\n")[0])"' 2>&1); then
        echo "  ❓ KHÔNG KIỂM ĐƯỢC — $MOCKUP_DIR/$d"
        echo "      $raw" | head -2
        continue
      fi
      out=$(printf '%s\n' "$raw" | grep -v "  ${base:0:8}  " || true)
      if [[ -n "${out//[[:space:]]/}" ]]; then
        echo "  ⚠️  LỆCH — $MOCKUP_DIR/$d"
        printf '%s\n' "$out"
      else
        echo "  ✅ KHỚP — $MOCKUP_DIR/$d"
      fi
    done
    echo
    echo "LỆCH nghĩa là mockup đã đổi kể từ baseline → rà issue nào còn trỏ bản cũ (rổ A)."
    echo "Sau khi PoC xác nhận bản mới: cập nhật baseline ở wiki 9.0 — Sync Ledger."
    ;;

  changelog)
    n="${3:-60}"
    read_file "$PM_REPO" "docs/CHANGELOG.md" | sed -n "1,${n}p"
    ;;

  notices)
    read_file "$PM_REPO" "$NOTICE_DIR/変更通知 台帳（一覧）.md" | grep -E '^\||未送付|送付済' | cut -c1-400
    echo
    echo "### File 変更通知 hiện có"
    find_path "$PM_REPO" "^$NOTICE_DIR/変更通知.*\.md$" | sed 's|.*/||'
    ;;

  notice)
    p=$(notice_path "${3:?thiếu tên bản, vd v8.2}")
    echo "# $p"; echo
    read_file "$PM_REPO" "$p"
    ;;

  refs)
    p=$(notice_path "${3:?thiếu tên bản, vd v8.2}")
    echo "### Issue được nhắc trong: $(basename "$p")"
    read_file "$PM_REPO" "$p" | grep -oE '#[0-9]{2,4}' | sort -u -t'#' -k2 -n | tr '\n' ' '
    echo; echo
    echo "### Mã yêu cầu / 節 được nhắc"
    read_file "$PM_REPO" "$p" | grep -oE '(FR|NFR|BR|CR)-[0-9]+[A-Za-z-]*|§[0-9]+(-[0-9]+)?' | sort -u | tr '\n' ' '
    echo
    ;;

  diff)
    base="${3:?thiếu SHA đã ghim, vd 8d25a1aa}"
    cmp_json=$(gh api "repos/$PM_REPO/compare/$base...HEAD" 2>/dev/null) || die "Không so được — kiểm tra SHA"
    nfiles=$(printf '%s' "$cmp_json" | jq '.files|length')
    printf '%s' "$cmp_json" | jq -r '"Lệch \(.ahead_by) commit · \(.files|length) file\n"'
    printf '%s' "$cmp_json" | jq -r '.files[] | "\(.status[0:1])  +\(.additions)/-\(.deletions)  \(.filename)"' \
      | grep -E "$SPEC_DIRS" | grep -v '_archive' || echo "(không có file spec nào đổi)"
    if [[ "$nfiles" -ge 300 ]]; then
      echo
      echo "🔴 CẢNH BÁO: API compare cắt danh sách file ở 300 — kết quả trên ĐANG THIẾU."
      echo "   Khoảng so quá xa. Hãy chia nhỏ (so qua vài mốc trung gian),"
      echo "   và dùng 'ui-diff $base' cho tầng UI vì lệnh đó không bị trần này."
    fi
    ;;

  commits)
    base="${3:?thiếu SHA đã ghim}"
    gh api "repos/$PM_REPO/compare/$base...HEAD" --jq '.commits[] | "\(.sha[0:8])  \(.commit.author.date[0:10])  \(.commit.message|split("\n")[0])"'
    ;;

  pinned)
    gh api "repos/$DEV_REPO/contents/$PINNED_DIR" --jq '.[] | "\(.name)  (\(.size) bytes)"'
    ;;

  issue)
    key="${3:?thiếu mã, vd FR-055}"
    gh search issues --repo "$DEV_REPO" "$key" --limit 30 --json number,state,title \
      --jq '.[] | "#\(.number)  \(.state)  \(.title)"' 2>/dev/null || echo "(không tìm thấy)"
    ;;

  issues-open)
    gh issue list -R "$DEV_REPO" --state open --limit 400 \
      --json number,title,labels,milestone \
      --jq '.[] | "#\(.number)\t\((.labels|map(.name)|join(",")))\t\(.title)"'
    ;;

  -h|--help) usage ;;
  *) die "Lệnh không rõ: $CMD (chạy --help)" ;;
esac

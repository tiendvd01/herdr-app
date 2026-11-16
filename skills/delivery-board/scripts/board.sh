#!/usr/bin/env bash
# board.sh — thao tác board "Sora Team" (org structuralengine, project #201)
# Tra field/option THEO TÊN tại thời điểm chạy, không hardcode ID.
set -euo pipefail

PROFILE_DIR="${DELIVERY_PROFILE_DIR:-$HOME/.config/herdr-app/skills/sora-profile}"
[[ -f "$PROFILE_DIR/profile.env" ]] || { printf 'Thiếu hồ sơ team: %s/profile.env\n' "$PROFILE_DIR" >&2; exit 1; }
# shellcheck source=/dev/null
. "$PROFILE_DIR/profile.env"
OWNER="${SORA_GH_OWNER:-$GH_OWNER}"
PRJ="${SORA_GH_PROJECT:-$GH_PROJECT}"
CACHE="${TMPDIR:-/tmp}/sora-board-${OWNER}-${PRJ}.json"
CACHE_TTL=3600

die() { printf '%s\n' "$*" >&2; exit 1; }

# DRY_RUN=1 → in mutation ra màn hình, không gửi lên GitHub
gql_write() {
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf 'DRY_RUN — mutation KHÔNG được gửi:\n%s\n' "$1"; return 0
  fi
  gh api graphql -f query="$1" >/dev/null
}
command -v gh >/dev/null || die "Thiếu gh CLI"
command -v jq >/dev/null || die "Thiếu jq"

usage() {
  cat <<'EOF'
board.sh — board "Sora Team" (structuralengine #201)

ĐỌC
  fields                          In toàn bộ field + option (cache 1h)
  sprints                         Danh sách iteration + sprint hiện tại
  item <issue>                    Item id + giá trị field hiện tại của 1 issue
  backlog                         Issue ở cột Backlog (view 0-Backlog)
  sprint [<tên sprint>]           Issue của sprint (mặc định: sprint hiện tại)
  status "<tên cột>"              Issue ở một cột
  mine                            Issue đang gán cho user gh hiện tại
  assignee <login>                Issue của một người
  waiting-malme                   Issue đang chờ Malme (báo cáo T6)
  todo-pool                       Todo chưa gắn Sprint (view 4-Refinement)
  wip                             In Progress / In Review / Changes Requested theo người
  retro [<tên sprint>]            Tổng Estimation days theo Lane — % việc phát sinh

GHI  (luôn xác nhận với người dùng trước khi chạy)
  set <issue> <Field> <Value>     Gán giá trị field
  clear <issue> <Field>           Xoá giá trị field
  add <issue>                     Thêm issue vào board

<issue>: URL đầy đủ | owner/repo#123 | repo#123 (owner mặc định structuralengine)
<Field>: Status | Lane | Kind | Source | Priority | "Waiting on" | Sprint |
         "Estimation days" | "Actual days" | "Start date" | Deadline | Project

Ví dụ
  board.sh set 168-yahagi-panwall#123 Status "Ready for QA"
  board.sh set 168-yahagi-panwall#123 Sprint "Sprint 1"
  board.sh set 168-yahagi-panwall#123 "Estimation days" 2.5
  board.sh set 168-yahagi-panwall#123 Deadline 2026-09-25
  board.sh clear 168-yahagi-panwall#123 "Waiting on"

Env: SORA_GH_OWNER, SORA_GH_PROJECT
     DRY_RUN=1  → in mutation ra màn hình, KHÔNG gửi lên GitHub (dùng để rà trước khi ghi)
EOF
}

# ── cache field ──────────────────────────────────────────────────────────────
mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1"; }

load_fields() {
  if [[ ! -s "$CACHE" ]] || (( $(date +%s) - $(mtime "$CACHE") > CACHE_TTL )); then
    gh api graphql -f owner="$OWNER" -F number="$PRJ" -f query='
      query($owner:String!,$number:Int!){
        organization(login:$owner){ projectV2(number:$number){ id title
          fields(first:50){nodes{
            ... on ProjectV2FieldCommon{id name dataType}
            ... on ProjectV2SingleSelectField{options{id name}}
            ... on ProjectV2IterationField{configuration{
              iterations{id title startDate duration}
              completedIterations{id title startDate duration}}}
          }}}}}' > "$CACHE.tmp" || { rm -f "$CACHE.tmp"; die "Không đọc được project $OWNER/#$PRJ"; }
    mv "$CACHE.tmp" "$CACHE"
  fi
}

pid()   { load_fields; jq -r '.data.organization.projectV2.id' "$CACHE"; }
fnode() { load_fields; jq -c --arg n "$1" '.data.organization.projectV2.fields.nodes[]|select(.name==$n)' "$CACHE"; }

# ── phân giải <issue> ────────────────────────────────────────────────────────
# in ra: "<owner> <repo> <number>"
parse_issue() {
  local s=$1 o r n
  case "$s" in
    https://github.com/*)
      s=${s#https://github.com/}; s=${s%%\?*}
      o=${s%%/*}; s=${s#*/}; r=${s%%/*}; s=${s#*/}; n=${s##*/} ;;
    */*\#*) o=${s%%/*}; s=${s#*/}; r=${s%%\#*}; n=${s##*\#} ;;
    *\#*)   o=$OWNER;  r=${s%%\#*}; n=${s##*\#} ;;
    *) die "Không hiểu issue '$s' — dùng URL, owner/repo#123 hoặc repo#123" ;;
  esac
  [[ "$n" =~ ^[0-9]+$ ]] || die "Số issue không hợp lệ: '$n'"
  printf '%s %s %s\n' "$o" "$r" "$n"
}

issue_json() {
  read -r o r n <<<"$(parse_issue "$1")"
  gh api graphql -f owner="$o" -f repo="$r" -F num="$n" -f query='
    query($owner:String!,$repo:String!,$num:Int!){
      repository(owner:$owner,name:$repo){ issue(number:$num){
        id number title url state
        projectItems(first:20){nodes{ id project{number title}
          fieldValues(first:30){nodes{
            ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}}
            ... on ProjectV2ItemFieldIterationValue{title field{... on ProjectV2FieldCommon{name}}}
            ... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2FieldCommon{name}}}
            ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2FieldCommon{name}}}
            ... on ProjectV2ItemFieldUserValue{users(first:10){nodes{login}} field{... on ProjectV2FieldCommon{name}}}
          }}}}}}}'
}

item_id() {
  issue_json "$1" | jq -r --argjson p "$PRJ" \
    '.data.repository.issue.projectItems.nodes[]|select(.project.number==$p)|.id' | head -1
}

# ── list qua gh project item-list ────────────────────────────────────────────
items_json() {
  local f="${TMPDIR:-/tmp}/sora-items-${OWNER}-${PRJ}.json"
  if [[ ! -s "$f" ]] || (( $(date +%s) - $(mtime "$f") > 120 )); then
    gh project item-list "$PRJ" --owner "$OWNER" --format json --limit 800 \
      | jq '{items:[.items[]|del(.content.body)]}' > "$f.tmp" \
      || { rm -f "$f.tmp"; die "Không đọc được item list"; }
    mv "$f.tmp" "$f"
  fi
  cat "$f"
}

# in bảng: #issue · repo · status · assignees · title
print_items() {
  jq -r '.[] | [
      ("#" + (.content.number|tostring)),
      (.content.repository // "" | sub(".*/";"")),
      (.status // "-"),
      ((.assignees // []) | join(",") | if . == "" then "-" else . end),
      (.title // .content.title // "")
    ] | @tsv' | column -t -s $'\t'
}

only_issues() { jq '[.items[] | select(.content.type=="Issue")]'; }

current_sprint() {
  load_fields
  local today; today=$(date +%Y-%m-%d)
  jq -r --arg d "$today" '
    .data.organization.projectV2.fields.nodes[]|select(.name=="Sprint")|.configuration.iterations[]
    | select(.startDate <= $d)
    | select((.startDate|strptime("%Y-%m-%d")|mktime) + (.duration*86400) > ($d|strptime("%Y-%m-%d")|mktime))
    | .title' "$CACHE" | head -1
}

# ── lệnh ─────────────────────────────────────────────────────────────────────
cmd_fields() {
  load_fields
  jq -r '.data.organization.projectV2.fields.nodes[]
    | "\(.name)  [\(.dataType)]  \(.id)"
      + (if .options then "\n" + ([.options[]|"    · \(.name)  (\(.id))"]|join("\n")) else "" end)
      + (if .configuration then "\n" + ([.configuration.iterations[]|"    · \(.title)  \(.startDate) +\(.duration)d  (\(.id))"]|join("\n")) else "" end)' "$CACHE"
}

cmd_sprints() {
  load_fields
  jq -r '.data.organization.projectV2.fields.nodes[]|select(.name=="Sprint")|.configuration.iterations[]
    | "\(.title)\t\(.startDate)\t+\(.duration)d\t\(.id)"' "$CACHE" | column -t -s $'\t'
  echo "→ sprint hiện tại: $(current_sprint)"
}

cmd_item() {
  local j; j=$(issue_json "$1")
  echo "$j" | jq -r --argjson p "$PRJ" '
    .data.repository.issue as $i
    | "\($i.url)\n\($i.title)  [\($i.state)]\nissue node id: \($i.id)",
      ( $i.projectItems.nodes[] | select(.project.number==$p)
        | "item id: \(.id)\n--- field ---",
          ( .fieldValues.nodes[] | select(.field.name != null)
            | "\(.field.name): \(.name // .title // .number // .date // ([.users.nodes[]?.login]|join(",")))" ) )'
}

cmd_backlog()  { items_json | only_issues | jq '[.[]|select(.status=="Backlog")]' | print_items; }
cmd_status()   { items_json | only_issues | jq --arg s "$1" '[.[]|select(.status==$s)]' | print_items; }
cmd_todopool() { items_json | only_issues | jq '[.[]|select(.status=="Todo" and (has("sprint")|not))]' | print_items; }

cmd_sprint() {
  local s=${1:-$(current_sprint)}
  [[ -n "$s" ]] || die "Không xác định được sprint hiện tại — truyền tên sprint"
  echo "Sprint: $s"
  items_json | only_issues | jq --arg s "$s" '[.[]|select((.sprint.title // .sprint)==$s)]' | print_items
}

cmd_assignee() {
  items_json | only_issues | jq --arg u "$1" '[.[]|select((.assignees//[])|index($u))]' | print_items
}

cmd_mine() {
  local me; me=$(gh api user -q .login)
  echo "Assignee: $me"
  cmd_assignee "$me"
}

cmd_waiting_malme() {
  items_json | only_issues \
    | jq '[.[]|select(.["waiting on"]=="Malme" or .waitingOn=="Malme")]' | print_items
}

cmd_wip() {
  items_json | only_issues \
    | jq '[.[]|select(.status=="In Progress" or .status=="In Review" or .status=="Changes Requested")]' \
    | jq -r 'group_by(.assignees//["(chưa gán)"]|join(","))[]
        | "\(.[0].assignees//["(chưa gán)"]|join(","))  → \(length) việc: "
          + ([.[]|"#\(.content.number) [\(.status)]"]|join(" · "))'
}

cmd_retro() {
  local s=${1:-$(current_sprint)}
  echo "Sprint: $s"
  items_json | only_issues | jq -r --arg s "$s" '
    [.[]|select((.sprint.title // .sprint)==$s)]
    | group_by(.lane // "(chưa gắn Lane)")[]
    | {lane:(.[0].lane // "(chưa gắn Lane)"), n:length, d:(map(.["estimation days"] // 0)|add // 0)}
    | "\(.lane): \(.n) issue, \(.d) ngày"'
  items_json | only_issues | jq -r --arg s "$s" '
    [.[]|select((.sprint.title // .sprint)==$s)] as $a
    | ($a|map(.["estimation days"]//0)|add // 0) as $t
    | ($a|map(select(.lane=="Ad-hoc"))|map(.["estimation days"]//0)|add // 0) as $x
    | "TỔNG: \(($a|length)) issue, \($t) ngày · Ad-hoc: \($x) ngày = "
      + (if $t>0 then ((100*$x/$t)|floor|tostring) else "0" end) + "%  (mục tiêu ≤20%)"
    , "Done: \($a|map(select(.status=="Done"))|length)/\($a|length) issue  (Say/Do, mục tiêu ≥80%)"'
}

cmd_add() {
  local nid; nid=$(issue_json "$1" | jq -r '.data.repository.issue.id')
  [[ -n "$nid" && "$nid" != "null" ]] || die "Không tìm thấy issue"
  gql_write "mutation{addProjectV2ItemById(input:{projectId:\"$(pid)\",contentId:\"$nid\"}){item{id}}}"
  echo "✓ đã thêm $1 vào board $PRJ"
}

cmd_set() {
  local issue=$1 fname=$2 fval=$3
  local node; node=$(fnode "$fname")
  [[ -n "$node" ]] || die "Không có field '$fname' trên board. Chạy: board.sh fields"
  local fid dtype vexpr
  fid=$(jq -r .id <<<"$node"); dtype=$(jq -r .dataType <<<"$node")

  case "$dtype" in
    SINGLE_SELECT)
      local oid; oid=$(jq -r --arg v "$fval" '.options[]|select(.name==$v)|.id' <<<"$node")
      [[ -n "$oid" ]] || die "Field '$fname' không có option '$fval'. Có: $(jq -r '[.options[].name]|join(" · ")' <<<"$node")"
      vexpr="singleSelectOptionId:\"$oid\"" ;;
    ITERATION)
      local iid; iid=$(jq -r --arg v "$fval" '.configuration.iterations[]|select(.title==$v)|.id' <<<"$node")
      [[ -n "$iid" ]] || die "Không có iteration '$fval'. Có: $(jq -r '[.configuration.iterations[].title]|join(" · ")' <<<"$node")"
      vexpr="iterationId:\"$iid\"" ;;
    NUMBER)
      [[ "$fval" =~ ^-?[0-9]+(\.[0-9]+)?$ ]] || die "'$fval' không phải số"
      vexpr="number:$fval" ;;
    DATE)
      [[ "$fval" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "Ngày phải dạng YYYY-MM-DD"
      vexpr="date:\"$fval\"" ;;
    TEXT|TITLE)
      vexpr="text:\"${fval//\"/\\\"}\"" ;;
    *) die "Field '$fname' kiểu $dtype — không set được bằng script này (dùng UI hoặc gh issue edit)" ;;
  esac

  local iid; iid=$(item_id "$issue")
  [[ -n "$iid" ]] || die "Issue chưa có trên board $PRJ. Chạy: board.sh add $issue"
  gql_write "mutation{updateProjectV2ItemFieldValue(input:{projectId:\"$(pid)\",itemId:\"$iid\",fieldId:\"$fid\",value:{$vexpr}}){projectV2Item{id}}}"
  echo "✓ $issue · $fname = $fval"
}

cmd_clear() {
  local issue=$1 fname=$2
  local node; node=$(fnode "$fname"); [[ -n "$node" ]] || die "Không có field '$fname'"
  local iid; iid=$(item_id "$issue"); [[ -n "$iid" ]] || die "Issue chưa có trên board $PRJ"
  gql_write "mutation{clearProjectV2ItemFieldValue(input:{projectId:\"$(pid)\",itemId:\"$iid\",fieldId:\"$(jq -r .id <<<"$node")\"}){projectV2Item{id}}}"
  echo "✓ $issue · xoá $fname"
}

case "${1:-}" in
  fields)        cmd_fields ;;
  sprints)       cmd_sprints ;;
  item)          shift; cmd_item "${1:?thiếu <issue>}" ;;
  backlog)       cmd_backlog ;;
  status)        shift; cmd_status "${1:?thiếu tên cột}" ;;
  sprint)        shift; cmd_sprint "${1:-}" ;;
  todo-pool)     cmd_todopool ;;
  mine)          cmd_mine ;;
  assignee)      shift; cmd_assignee "${1:?thiếu login}" ;;
  waiting-malme) cmd_waiting_malme ;;
  wip)           cmd_wip ;;
  retro)         shift; cmd_retro "${1:-}" ;;
  add)           shift; cmd_add "${1:?thiếu <issue>}" ;;
  set)           shift; cmd_set "${1:?thiếu <issue>}" "${2:?thiếu <Field>}" "${3:?thiếu <Value>}" ;;
  clear)         shift; cmd_clear "${1:?thiếu <issue>}" "${2:?thiếu <Field>}" ;;
  -h|--help|help|"") usage ;;
  *) die "Lệnh lạ: $1 — chạy board.sh --help" ;;
esac

#!/usr/bin/env bash
# report.sh — số liệu tiến độ Sprint & Milestone từ board "Sora Team"
#             (org structuralengine, project #201) + milestone/PR của repo.
# CHỈ ĐỌC — script này không ghi gì lên GitHub.
set -euo pipefail

PROFILE_DIR="${DELIVERY_PROFILE_DIR:-$HOME/.config/herdr-app/skills/sora-profile}"
[[ -f "$PROFILE_DIR/profile.env" ]] || { printf 'Thiếu hồ sơ team: %s/profile.env\n' "$PROFILE_DIR" >&2; exit 1; }
# shellcheck source=/dev/null
. "$PROFILE_DIR/profile.env"
OWNER="${SORA_GH_OWNER:-$GH_OWNER}"
PRJ="${SORA_GH_PROJECT:-$GH_PROJECT}"
TTL="${SORA_CACHE_TTL:-600}"
CDIR="${TMPDIR:-/tmp}"
ITEMS="$CDIR/sora-report-items-${OWNER}-${PRJ}.json"
FIELDS="$CDIR/sora-report-fields-${OWNER}-${PRJ}.json"

ISSUE_REPOS="${SORA_ISSUE_REPOS:-$ISSUE_REPOS}"
CODE_REPOS="${SORA_CODE_REPOS:-168-yahagi-panwall 168-yahagi-pan-wall-dx panwall-dx-phase1 genba-bento civilink-boxc civilink-frontend civilink-backend 147-yahagi-ryokka-system 167-yahagi-sekisan-dx}"

die() { printf '%s\n' "$*" >&2; exit 1; }
command -v gh >/dev/null || die "Thiếu gh CLI"
command -v jq >/dev/null || die "Thiếu jq"
mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1"; }
fresh() { [[ -s "$1" ]] && (( TTL > 0 )) && (( $(date +%s) - $(mtime "$1") < TTL )); }
hr() { printf '\n── %s %s\n' "$1" "$(printf '─%.0s' $(seq 1 $((60 - ${#1}))))"; }

usage() {
  cat <<'EOF'
report.sh — số liệu báo cáo tiến độ (board Sora Team #201). CHỈ ĐỌC.

  all ["Sprint N"]            Trọn bộ cho một lần lập báo cáo
  sprint ["Sprint N"]         Tiến độ sprint: status, ngày công, % hoàn thành vs % thời gian
  commitment ["Sprint N"]     Issue Commitment + Say/Do (Sub-issues progress)
  quality ["Sprint N"]        🔴 Độ phủ field → mức tin cậy số liệu
  drift [days] [repo...]      🔴 PR merged "Refs #n" mà issue chưa sang Ready for QA
  stale [days]                Việc In Progress/In Review đứng im (mặc định 5 ngày)
  waiting                     Đang chờ Malme + số ngày (xấp xỉ) + SLA 3 ngày làm việc
  blocked                     Status = Blocked + số ngày
  milestone [repo]            Tiến độ milestone đang mở + dự phóng ngày xong
  throughput [weeks] [repo]   Issue đóng theo tuần — đếm từ repo, né auto-archive
  portfolio                   Tổng quan theo Project — cho HoE
  sprints                     Danh sách iteration + sprint hiện tại
  raw                         JSON đã chuẩn hoá (tự phân tích bằng jq)

Env: SORA_GH_OWNER · SORA_GH_PROJECT · SORA_ISSUE_REPOS · SORA_CODE_REPOS
     SORA_CACHE_TTL=0  → bỏ cache, tải lại (dùng khi lập báo cáo chính thức)

Lưu ý: số ngày "đứng im"/"chờ Malme" tính từ updatedAt nên là XẤP XỈ
       (comment cũng làm updatedAt đổi). Luôn ghi chữ "xấp xỉ" trong báo cáo.
EOF
}

# ── tải & chuẩn hoá item ─────────────────────────────────────────────────────
fetch_items() {
  fresh "$ITEMS" && return 0
  gh api graphql --paginate --slurp -f owner="$OWNER" -F number="$PRJ" -f query='
    query($owner:String!,$number:Int!,$endCursor:String){
      organization(login:$owner){ projectV2(number:$number){
        items(first:100, after:$endCursor){
          pageInfo{hasNextPage endCursor}
          nodes{
            fieldValues(first:30){nodes{
              ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}}
              ... on ProjectV2ItemFieldIterationValue{title field{... on ProjectV2FieldCommon{name}}}
              ... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2FieldCommon{name}}}
              ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2FieldCommon{name}}}
              ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2FieldCommon{name}}}
            }}
            content{
              __typename
              ... on Issue{ number title url state createdAt updatedAt closedAt
                repository{nameWithOwner}
                milestone{title dueOn state}
                assignees(first:5){nodes{login}}
                labels(first:10){nodes{name}}
                comments(last:1){nodes{createdAt author{login}}}
              }
              ... on PullRequest{ number title url state createdAt updatedAt closedAt
                repository{nameWithOwner} }
            }
          }
        }}}}' \
  | jq '[ .[].data.organization.projectV2.items.nodes[] ]
        | map(select(.content != null and .content.number != null))
        | map(
            ( [ .fieldValues.nodes[]? | select((.field.name // "") != "") ] ) as $fv
            | def pick($n): [ $fv[] | select(.field.name == $n)
                              | (.name // .title // .number // .date // .text) ][0];
              { type:        .content.__typename,
                number:      .content.number,
                repo:        ((.content.repository.nameWithOwner // "") | sub(".*/";"")),
                title:       .content.title,
                url:         .content.url,
                state:       .content.state,
                createdAt:   .content.createdAt,
                updatedAt:   .content.updatedAt,
                closedAt:    .content.closedAt,
                assignees:   [ .content.assignees.nodes[]?.login ],
                labels:      [ .content.labels.nodes[]?.name ],
                milestone:   (.content.milestone.title // null),
                lastComment: (.content.comments.nodes[0]?.createdAt // null),
                lastCommentBy: (.content.comments.nodes[0]?.author.login // null),
                status:      pick("Status"),
                lane:        pick("Lane"),
                kind:        pick("Kind"),
                source:      pick("Source"),
                priority:    pick("Priority"),
                waitingOn:   pick("Waiting on"),
                sprint:      pick("Sprint"),
                estimation:  pick("Estimation days"),
                actual:      pick("Actual days"),
                deadline:    pick("Deadline"),
                startDate:   pick("Start date"),
                project:     pick("Project") } )' > "$ITEMS.tmp" \
    || { rm -f "$ITEMS.tmp"; die "Không đọc được project $OWNER/#$PRJ"; }
  mv "$ITEMS.tmp" "$ITEMS"
}

fetch_fields() {
  fresh "$FIELDS" && return 0
  gh api graphql -f owner="$OWNER" -F number="$PRJ" -f query='
    query($owner:String!,$number:Int!){
      organization(login:$owner){ projectV2(number:$number){
        fields(first:50){nodes{
          ... on ProjectV2FieldCommon{name}
          ... on ProjectV2IterationField{configuration{
            iterations{title startDate duration}
            completedIterations{title startDate duration}}}
        }}}}}' > "$FIELDS.tmp" || { rm -f "$FIELDS.tmp"; die "Không đọc được field"; }
  mv "$FIELDS.tmp" "$FIELDS"
}

items() { fetch_items; jq '[ .[] | select(.type == "Issue") ]' "$ITEMS"; }

sprint_meta() { # $1 = tên sprint → "title<TAB>start<TAB>duration"
  fetch_fields
  jq -r --arg s "$1" '
    .data.organization.projectV2.fields.nodes[] | select(.configuration != null)
    | (.configuration.iterations + .configuration.completedIterations)[]
    | select(.title == $s) | "\(.title)\t\(.startDate)\t\(.duration)"' "$FIELDS" | head -1
}

current_sprint() {
  fetch_fields
  jq -r --arg d "$(date +%Y-%m-%d)" '
    .data.organization.projectV2.fields.nodes[] | select(.configuration != null)
    | .configuration.iterations[]
    | select(.startDate <= $d)
    | select((.startDate|strptime("%Y-%m-%d")|mktime) + (.duration*86400) > ($d|strptime("%Y-%m-%d")|mktime))
    | .title' "$FIELDS" | head -1
}

pick_sprint() { local s="${1:-}"; [[ -n "$s" ]] || s="$(current_sprint)"; [[ -n "$s" ]] || die "Không xác định được sprint hiện tại — truyền tên sprint, vd: report.sh sprint \"Sprint 1\""; printf '%s' "$s"; }

JQLIB='
  def ago($t): if ($t // null) == null then null else ((now - ($t|fromdateiso8601))/86400 | floor) end;
  def bdays($d): if $d == null then null else (($d/7|floor)*5 + (if ($d%7) > 5 then 5 else ($d%7) end)) end;
  def pct($a;$b): if ($b // 0) == 0 then "n/a" else (100*$a/$b | round | tostring) + "%" end;
  def num($x): ($x // 0);
  def inflight: ["In Progress","In Review","Changes Requested"];
  def donelike: ["Done","Ready for Release"];
'

# ── lệnh ─────────────────────────────────────────────────────────────────────
cmd_sprints() {
  fetch_fields
  jq -r '.data.organization.projectV2.fields.nodes[] | select(.configuration != null)
    | .configuration.iterations[] | "\(.title)\t\(.startDate)\t+\(.duration)d"' "$FIELDS" | column -t -s $'\t'
  echo "→ sprint hiện tại: $(current_sprint)"
}

cmd_sprint() {
  local s; s="$(pick_sprint "${1:-}")"
  local meta start dur; meta="$(sprint_meta "$s")"
  start="$(cut -f2 <<<"$meta")"; dur="$(cut -f3 <<<"$meta")"
  echo "Sprint: $s   (bắt đầu $start, $dur ngày)"

  items | jq -r "$JQLIB"'
    [ .[] | select(.sprint == $s) ] as $a
    | ($a | map(num(.estimation)) | add // 0) as $tot
    | ($a | map(select(.status | IN(donelike[]))) | map(num(.estimation)) | add // 0) as $dd
    | ($a | map(select(.lane == "Ad-hoc")) | map(num(.estimation)) | add // 0) as $ad
    | ($start | strptime("%Y-%m-%d") | mktime) as $st
    | (((now - $st)/86400) | floor) as $elapsed
    | if ($a|length) == 0 then "⚠️  Không có issue nào gắn sprint này." else
      ( "Issue: \($a|length)  ·  Done/Ready for Release: \($a|map(select(.status|IN(donelike[])))|length)"
      , "Ngày công: tổng \($tot) · xong \($dd) → hoàn thành \(pct($dd;$tot)) (theo ngày công)"
      , "Theo số issue: \(pct(($a|map(select(.status|IN(donelike[])))|length);($a|length)))"
      , "Thời gian: đã qua \($elapsed)/\($dur) ngày = \(pct($elapsed;($dur|tonumber)))  ← so cặp với % hoàn thành"
      , "Ad-hoc: \($ad) ngày công / \($tot) = \(pct($ad;$tot))  (mục tiêu ≤20%)"
      , ""
      , "— Phân bố theo Status —"
      , ( $a | group_by(.status // "(trống)") | map("\(.[0].status // "(trống)")\t\(length) issue\t\(map(num(.estimation))|add // 0) ngày") | .[] )
      , ""
      , "— Issue CHƯA xong —"
      , ( $a | map(select((.status|IN(donelike[])) | not))
            | sort_by(.status)
            | map("#\(.number) \(.repo)\t\(.status // "-")\t\((.assignees|join(","))|if .=="" then "(chưa gán)" else . end)\t\(num(.estimation))d\t\(.deadline // "-")\t\(.title[0:52])")
            | if length == 0 then ["(không còn)"] else . end | .[] ) )
      end' --arg s "$s" --arg start "$start" --argjson dur "${dur:-12}" | column -t -s $'\t'
}

cmd_commitment() {
  local s; s="$(pick_sprint "${1:-}")"
  echo "Sprint: $s — issue Commitment"
  local found=0
  while IFS=$'\t' read -r repo num title; do
    [[ -z "${num:-}" ]] && continue
    found=1
    echo "· #$num $repo — $title"
    gh api graphql -f owner="$OWNER" -f repo="$repo" -F num="$num" -f query='
      query($owner:String!,$repo:String!,$num:Int!){
        repository(owner:$owner,name:$repo){ issue(number:$num){
          subIssuesSummary{total completed percentCompleted}
          subIssues(first:100){nodes{number title state url}} }}}' 2>/dev/null \
    | jq -r '.data.repository.issue as $i
        | "   Say/Do: \($i.subIssuesSummary.completed)/\($i.subIssuesSummary.total) = \($i.subIssuesSummary.percentCompleted)%  (mục tiêu ≥80%)"
        , ( $i.subIssues.nodes[] | select(.state != "CLOSED") | "   ✗ chưa xong: #\(.number) \(.title[0:60])" )' \
    || echo "   ⚠️  Không đọc được sub-issue (API đổi?) — đếm tay từ danh sách cam kết trong body issue."
  done < <(items | jq -r --arg s "$s" '.[] | select(.sprint == $s and (.kind == "Commitment" or (.title|test("Commitment";"i")))) | "\(.repo)\t\(.number)\t\(.title)"')
  (( found )) || cat <<EOF
⚠️  Chưa có issue Commitment cho "$s".
    → KHÔNG có Say/Do cho sprint này. Báo cáo phải nói rõ: số liệu là trạng thái board
      tại thời điểm chạy, không phải mức hoàn thành so với cam kết.
EOF
}

cmd_quality() {
  local s; s="$(pick_sprint "${1:-}")"
  echo "Cổng tin cậy — Sprint: $s"
  items | jq -r "$JQLIB"'
    . as $all | [ $all[] | select(.sprint == $s) ] as $a
    | ($a|length) as $n
    | if $n == 0 then "⚠️  Sprint không có issue — không đánh giá được." else
      ( "Độ phủ field (trên \($n) issue của sprint):"
      , "  Estimation days\t\($a|map(select(.estimation != null))|length)/\($n)\t\(pct(($a|map(select(.estimation != null))|length);$n))"
      , "  Lane\t\($a|map(select(.lane != null))|length)/\($n)\t\(pct(($a|map(select(.lane != null))|length);$n))"
      , "  Assignee\t\($a|map(select((.assignees|length)>0))|length)/\($n)\t\(pct(($a|map(select((.assignees|length)>0))|length);$n))"
      , "  Kind\t\($a|map(select(.kind != null))|length)/\($n)\t\(pct(($a|map(select(.kind != null))|length);$n))"
      , "  Deadline\t\($a|map(select(.deadline != null))|length)/\($n)\t\(pct(($a|map(select(.deadline != null))|length);$n))"
      , ""
      , "Điểm lệch:"
      , ( [ $all[] | select(.state == "CLOSED" and ((.status // "") | IN("Done","Canceled") | not))
            | "  ✗ đã closed nhưng Status=\(.status // "trống"): #\(.number) \(.repo)" ] | .[] )
      , ( [ $all[] | select(.state == "OPEN" and (.status == "Done"))
            | "  ✗ Status=Done nhưng issue vẫn OPEN: #\(.number) \(.repo)" ] | .[] )
      , ( [ $a[] | select((.status|IN(inflight[])) and ((.assignees|length) == 0))
            | "  ✗ đang chạy nhưng chưa gán người: #\(.number) \(.repo)" ] | .[] )
      , "  · Backlog còn tồn: \([ $all[] | select(.status == "Backlog") ] | length) issue (phải rỗng sau phiên triage T3/T6)"
      , ""
      , ( ( ($a|map(select(.estimation != null))|length) * 100 / $n ) as $pe
        | ( ($a|map(select(.lane != null))|length) * 100 / $n ) as $pl
        | if ($pe >= 90 and $pl >= 90) then "→ Mức tin cậy: 🟢 Cao"
          elif ($pe >= 60 and $pl >= 60) then "→ Mức tin cậy: 🟡 Trung bình — nêu rõ độ phủ trong báo cáo"
          else "→ Mức tin cậy: 🔴 Thấp — KHÔNG công bố %, chỉ báo cáo định tính" end )
      , "→ Vẫn phải chạy: report.sh drift · stale · waiting trước khi viết số." )
      end' --arg s "$s" | column -t -s $'\t'
}

cmd_stale() {
  local d="${1:-5}"
  echo "Việc đang chạy nhưng đứng im ≥ $d ngày (xấp xỉ — tính từ updatedAt)"
  items | jq -r "$JQLIB"'
    [ .[] | select(.status | IN(inflight[])) | select((ago(.updatedAt) // 0) >= $d) ]
    | sort_by(-(ago(.updatedAt) // 0))
    | if length == 0 then ["(không có)"] else
        map("#\(.number) \(.repo)\t\(.status)\t\((.assignees|join(","))|if .=="" then "(chưa gán)" else . end)\t\(ago(.updatedAt)) ngày\t\(.title[0:52])") end
    | .[]' --argjson d "$d" | column -t -s $'\t'
}

cmd_waiting() {
  echo "Đang chờ Malme (Waiting on = Malme) — SLA trả lời Clarification: 3 ngày làm việc"
  items | jq -r "$JQLIB"'
    [ .[] | select(.waitingOn == "Malme") ] as $w
    | [ $w[] | select((.state == "CLOSED") or ((.status // "") | IN("Done","Canceled"))) ] as $stale
    | [ $w[] | select((.state != "CLOSED") and (((.status // "") | IN("Done","Canceled")) | not)) ]
    | sort_by(-(ago(.updatedAt) // 0))
    | ( if length == 0 then ["(không có issue nào đang chờ Malme — kiểm tra xem PoC đã gắn field Waiting on chưa)"] else
        map( (ago(.updatedAt)) as $d
             | "#\(.number) \(.repo)\t\(.status // "-")\t\($d) ngày (~\(bdays($d)) ngày làm việc)\t\(if (bdays($d) // 0) > 3 then "🔴 QUÁ SLA" else "trong hạn" end)\t\(.deadline // "-")\t\(.title[0:46])") end ) [],
      ( if ($stale|length) > 0 then
          "⚠️  \($stale|length) issue đã xong/đóng nhưng CÒN cờ Waiting on = Malme (PoC cần xoá cờ): "
          + ([ $stale[] | "#\(.number)" ] | join(" "))
        else empty end )' | column -t -s $'\t'
  echo "(số ngày là xấp xỉ, tính từ lần cập nhật cuối của issue — comment cũng làm đổi updatedAt)"
}

cmd_blocked() {
  echo "Issue ở Status = Blocked"
  items | jq -r "$JQLIB"'
    [ .[] | select(.status == "Blocked") ] | sort_by(-(ago(.updatedAt) // 0))
    | if length == 0 then ["(không có)"] else
        map("#\(.number) \(.repo)\t\(.waitingOn // "chưa gắn Waiting on")\t\(ago(.updatedAt)) ngày\t\(.sprint // "-")\t\(.title[0:52])") end
    | .[]' | column -t -s $'\t'
}

cmd_drift() {
  local days="${1:-14}"; shift || true
  local repos="${*:-$CODE_REPOS}"
  echo "PR merged trong $days ngày có dẫn chiếu issue (Refs #n hoặc Refs <URL issue>) — đối chiếu Status"
  local since; since=$(date -u -v-"${days}"d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "$days days ago" +%Y-%m-%dT%H:%M:%SZ)
  local tmp="$CDIR/sora-drift-$$.tsv"; : > "$tmp"
  for r in $repos; do
    gh pr list -R "$OWNER/$r" --state merged --limit 100 \
      --json number,title,body,mergedAt,url 2>/dev/null \
    | jq -r --arg since "$since" --arg repo "$r" '
        .[] | select(.mergedAt >= $since) | . as $pr
        | ( [ ($pr.body // "") | scan("(?i)refs?[: ]*https?://github\\.com/[^/ ]+/([^/ ]+)/issues/([0-9]+)") | {r:.[0], n:.[1]} ]
          + [ ($pr.body // "") | scan("(?i)refs?[: ]*#([0-9]+)") | {r:$repo, n:.[0]} ] )
        | unique | .[]
        | "\(.r)\t\(.n)\t\($repo)\t\($pr.number)\t\($pr.mergedAt[0:10])"' >> "$tmp" || true
  done
  if [[ ! -s "$tmp" ]]; then
    echo "(không tìm thấy PR merged nào dẫn chiếu issue — kiểm tra quy ước 'Refs' của §D1b)"
    rm -f "$tmp"; return 0
  fi
  items | jq -r --rawfile raw "$tmp" "$JQLIB"'
    ( $raw | split("\n") | map(select(length>0) | split("\t"))
      | map({irepo:.[0], issue:(.[1]|tonumber), prrepo:.[2], pr:.[3], merged:.[4]}) ) as $prs
    | . as $items
    | [ $prs[] | . as $p
        | ( [ $items[] | select(.number == $p.issue and .repo == $p.irepo) ][0] ) as $i
        | select($i != null)
        | select(($i.status // "") | IN("Ready for QA","QA Testing","Ready for Release","Done","Canceled") | not)
        | {i: $i, p: $p} ]
    | group_by([.i.repo, .i.number])
    | map( .[0].i as $i
           | "🔴 #\($i.number) \($i.repo)\tStatus=\($i.status // "trống")\tPR đã merge: \([ .[].p | "#\(.pr) (\(.merged))" ] | unique | join(", "))\t\($i.title[0:40])" )
    | if length == 0 then ["✓ Không có lệch: mọi issue có PR đã merge đều đã qua Ready for QA trở đi."] else . end
    | .[]' | column -t -s $'\t'
  rm -f "$tmp"
  echo "(issue không nằm trên board thì không hiện ở đây · PR không ghi Refs cũng không phát hiện được)"
}

cmd_milestone() {
  local repos="${1:-$ISSUE_REPOS}"
  for r in $repos; do
    hr "$r"
    gh api "repos/$OWNER/$r/milestones?state=open&per_page=50" 2>/dev/null \
    | jq -r "$JQLIB"'
        if length == 0 then "(repo không có milestone đang mở)" else
        .[] | ((.open_issues + .closed_issues) // 0) as $t
        | ( if .due_on then ((( (.due_on|fromdateiso8601) - now)/86400) | floor) else null end ) as $left
        | "\(.title)\tđóng \(.closed_issues)/\($t) = \(pct(.closed_issues;$t))\tcòn mở \(.open_issues)\thạn \(.due_on[0:10] // "chưa đặt")\t\(if $left == null then "" elif $left < 0 then "🔴 QUÁ HẠN \(-$left) ngày" else "còn \($left) ngày" end)"
        end' | column -t -s $'\t' || echo "(không đọc được milestone)"
  done
  cat <<'EOF'

Dự phóng: lấy "còn mở" chia cho throughput (report.sh throughput 4 <repo>) → số tuần còn lại.
Nếu vượt hạn → báo cáo PHẢI kèm 2 lựa chọn: bỏ phạm vi nào, hoặc lùi mốc bao nhiêu.
Issue chưa gắn milestone không nằm trong phép đếm — nêu rõ số đó trong báo cáo.
EOF
}

cmd_throughput() {
  local weeks="${1:-4}"; local repos="${2:-$ISSUE_REPOS}"
  local since; since=$(date -u -v-"$((weeks*7))"d +%Y-%m-%d 2>/dev/null || date -u -d "$((weeks*7)) days ago" +%Y-%m-%d)
  echo "Issue đã đóng từ $since (đếm từ repo — không bị auto-archive của board làm thiếu)"
  for r in $repos; do
    local n
    n=$(gh issue list -R "$OWNER/$r" --state closed --limit 500 --json closedAt \
        --search "closed:>=$since" 2>/dev/null | jq 'length' || echo 0)
    printf '%s\t%s issue / %s tuần\t≈ %s issue/tuần\n' "$r" "$n" "$weeks" "$(( n / weeks ))"
  done | column -t -s $'\t'
}

cmd_portfolio() {
  echo "Tổng quan theo Project (toàn board) — cho HoE"
  items | jq -r "$JQLIB"'
    group_by(.project // "(chưa gắn Project)")
    | map( { p: (.[0].project // "(chưa gắn Project)"),
             n: length,
             wip: (map(select(.status|IN(inflight[])))|length),
             blocked: (map(select(.status == "Blocked"))|length),
             malme: (map(select(.waitingOn == "Malme"))|length),
             backlog: (map(select(.status == "Backlog"))|length) } )
    | sort_by(-.n)
    | .[] | "\(.p)\t\(.n) issue\tđang chạy \(.wip)\tblocked \(.blocked)\tchờ Malme \(.malme)\tbacklog \(.backlog)"' \
  | column -t -s $'\t'
  echo
  echo "Tải theo người (đang chạy) — WIP cao là tín hiệu sớm của việc bị dàn mỏng:"
  items | jq -r "$JQLIB"'
    [ .[] | select(.status|IN(inflight[])) | . as $i
      | (if (($i.assignees|length) == 0) then ["(chưa gán)"] else $i.assignees end)[] as $u
      | {u: $u, i: $i} ]
    | group_by(.u) | sort_by(-length)
    | .[] | "\(.[0].u)\t\(length) việc\t\([ .[].i | "#\(.number)[\(.status)]" ] | join(" "))"' \
  | column -t -s $'\t'
}

cmd_all() {
  local s; s="$(pick_sprint "${1:-}")"
  hr "1. TIẾN ĐỘ SPRINT";  cmd_sprint "$s"
  hr "2. CAM KẾT (Say/Do)"; cmd_commitment "$s"
  hr "3. CỔNG TIN CẬY";    cmd_quality "$s"
  hr "4. ĐANG CHỜ MALME";  cmd_waiting
  hr "5. BLOCKED";         cmd_blocked
  hr "6. ĐỨNG IM ≥5 NGÀY"; cmd_stale 5
  hr "7. LỆCH PR↔ISSUE";   cmd_drift 14
  hr "8. MILESTONE";       cmd_milestone
  echo
  echo "→ Còn thiếu: report.sh throughput (dự phóng) · portfolio (cho HoE)."
}

case "${1:-}" in
  all)        shift; cmd_all "${1:-}" ;;
  sprint)     shift; cmd_sprint "${1:-}" ;;
  commitment) shift; cmd_commitment "${1:-}" ;;
  quality)    shift; cmd_quality "${1:-}" ;;
  stale)      shift; cmd_stale "${1:-5}" ;;
  waiting)    cmd_waiting ;;
  blocked)    cmd_blocked ;;
  drift)      shift; cmd_drift "${@:-}" ;;
  milestone)  shift; cmd_milestone "${1:-}" ;;
  throughput) shift; cmd_throughput "${1:-4}" "${2:-}" ;;
  portfolio)  cmd_portfolio ;;
  sprints)    cmd_sprints ;;
  raw)        items ;;
  -h|--help|help|"") usage ;;
  *) die "Lệnh lạ: $1 — chạy report.sh --help" ;;
esac

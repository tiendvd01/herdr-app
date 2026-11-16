#!/usr/bin/env bash
# Kiểm mọi khối ```mermaid trong các file .md của một thư mục bằng mmdc.
#   check-mermaid.sh <thư mục design>
# In OK/FAIL từng khối (file-thứ tự) và 5 dòng lỗi đầu. Exit 1 nếu có khối lỗi.
set -uo pipefail
DIR="${1:?cần thư mục chứa .md}"
command -v mmdc >/dev/null || { echo "Không có mmdc (npm i -g @mermaid-js/mermaid-cli)"; exit 2; }
TMP=$(mktemp -d)
fail=0
for f in "$DIR"/*.md; do
  b=$(basename "$f" .md)
  awk -v base="$TMP/$b" '/^```mermaid/{n++; out=base"-"n".mmd"; inb=1; next} /^```/{inb=0} inb{print > out}' "$f"
done
for m in "$TMP"/*.mmd; do
  [ -e "$m" ] || { echo "Không có khối mermaid nào"; exit 0; }
  if mmdc -q -i "$m" -o "${m%.mmd}.svg" >/dev/null 2>"$m.err"; then
    echo "OK   $(basename "$m")"
  else
    echo "FAIL $(basename "$m")"; head -5 "$m.err"; fail=1
  fi
done
rm -rf "$TMP"
exit $fail

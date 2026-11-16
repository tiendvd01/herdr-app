#!/usr/bin/env bash
# In đường dẫn thư mục lưu artifact trong SoraVaults cho repo hiện tại (luat-chung §6).
#
#   vault-path.sh                 → <vault>/<dự án>
#   vault-path.sh "issue 296"     → <vault>/<dự án>/issue 296   (tạo nếu chưa có)
#   vault-path.sh "sprint 4"      → <vault>/<dự án>/sprint 4
#   vault-path.sh --repo <path> … → xác định dự án theo repo khác thay vì thư mục hiện tại
#
# <dự án> = thư mục có sẵn trong vault bắt đầu bằng mã dự án (số đầu tên repo, vd 168-*);
# không có thì tạo theo tên thư mục repo. Ghi đè vault bằng biến SORA_VAULT.
set -euo pipefail

VAULT="${SORA_VAULT:-$HOME/Documents/SoraTech/SoraVaults}"
REPO=""
if [ "${1:-}" = "--repo" ]; then REPO="$2"; shift 2; fi
[ -n "$REPO" ] || REPO=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
NAME=$(basename "$REPO")
CODE=$(printf '%s' "$NAME" | sed -nE 's/^([0-9]+)-.*/\1/p')

PROJ=""
if [ -n "$CODE" ]; then
  PROJ=$(ls -d "$VAULT/$CODE-"*/ 2>/dev/null | head -1 || true)
  PROJ=${PROJ%/}
fi
[ -n "$PROJ" ] || PROJ="$VAULT/$NAME"

OUT="$PROJ"
[ $# -gt 0 ] && OUT="$PROJ/$1"
mkdir -p "$OUT"
printf '%s\n' "$OUT"

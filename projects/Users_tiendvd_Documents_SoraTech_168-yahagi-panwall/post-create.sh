#!/bin/sh
# Post-create cho Yahagi 168: chay 1 lan trong moi worktree moi (cwd = worktree).
# Chay bang `sh` khong-interactive nen PATH khong co nvm/uv: tu them vao.
set -e

MAIN="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
NODE_VERSION="24.16.0"

export PATH="$HOME/.nvm/versions/node/v$NODE_VERSION/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# 1. Copy .env (file bi gitignore, khong co trong worktree)
cp -n "$MAIN/backend/.env" backend/.env
for f in .env .env.local; do
  [ -f "$MAIN/frontend/$f" ] && cp -n "$MAIN/frontend/$f" "frontend/$f"
done

# 2. Kiem tra node dung phien ban (PATH o tren)
if [ "$(node -v 2>/dev/null)" != "v$NODE_VERSION" ]; then
  echo "Can node v$NODE_VERSION (nvm install $NODE_VERSION), dang co: $(node -v 2>&1)" >&2
  exit 1
fi
command -v uv >/dev/null || { echo "Khong tim thay uv trong PATH" >&2; exit 1; }

# 3. Install dependencies
(cd frontend && npm ci)
(cd backend && uv sync)

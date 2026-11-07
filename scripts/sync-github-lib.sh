#!/bin/sh
# Herdr mods can only import files inside their own folder, so each file in lib/ (the one source)
# is copied into each mod that uses it. Edit lib/<file>, then run this script.
cd "$(dirname "$0")/.." || exit 1
sync() {
  src=$1; shift
  for dest in "$@"; do
    { echo "// GENERATED from $src by scripts/sync-github-lib.sh. Do not edit here."; cat "$src"; } > "$dest"
    echo "synced $dest"
  done
}
sync lib/github.js mods/pr-flow/github.js mods/better-sidebar/git/github.js
sync lib/space-folder.js \
  mods/better-sidebar/git/space-folder.js \
  mods/my-files/space-folder.js \
  mods/reviewer/space-folder.js \
  mods/issues/space-folder.js \
  mods/git-graph/space-folder.js \
  mods/pr-flow/space-folder.js \
  mods/my-tabs/space-folder.js \
  mods/my-menu/space-folder.js \
  mods/my-new-menu/space-folder.js \
  mods/my-worktree/space-folder.js \
  mods/open-vscode/space-folder.js \
  mods/branch-switch/space-folder.js \
  mods/status-usage/space-folder.js
sync lib/gh-account.js mods/pr-flow/gh-account.js mods/better-sidebar/git/gh-account.js mods/issues/gh-account.js

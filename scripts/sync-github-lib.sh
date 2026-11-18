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
sync lib/github.js mods/pr-flow/github.js mods/better-sidebar/git/github.js mods/inbox/github.js
sync lib/space-folder.js \
  mods/better-sidebar/git/space-folder.js \
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
  mods/open-file/space-folder.js \
  mods/file-icons/space-folder.js \
  mods/status-usage/space-folder.js \
  mods/inbox/space-folder.js \
  mods/project-settings/space-folder.js \
  mods/threads/space-folder.js
sync lib/gh-account.js mods/pr-flow/gh-account.js mods/better-sidebar/git/gh-account.js mods/issues/gh-account.js mods/inbox/gh-account.js
# PR reading (gh calls, status facts): pr-flow's, also used by inbox.
sync lib/pr-gh.js mods/pr-flow/gh.js mods/inbox/gh.js
sync lib/pr-status.js mods/pr-flow/status.js mods/inbox/status.js
# The UI kit (spec 018): buttons, motion, common surfaces for every personal screen. Icons: lib/icons/.
sync lib/panel-ui.js mods/file-icons/panel-ui.js mods/reviewer/panel-ui.js mods/issues/panel-ui.js mods/git-graph/panel-ui.js mods/pr-flow/panel-ui.js mods/mermaid-board/panel-ui.js \
  mods/ui-gallery/panel-ui.js mods/my-tabs/panel-ui.js mods/project-settings/panel-ui.js mods/inbox/panel-ui.js mods/status-usage/panel-ui.js mods/processes/panel-ui.js \
  mods/open-zed/panel-ui.js mods/open-vscode/panel-ui.js mods/my-worktree/panel-ui.js mods/open-file/panel-ui.js mods/project-scripts/panel-ui.js \
  mods/threads/panel-ui.js
# Markdown with mermaid diagrams and its zoomable viewer: Issues, Files and the Mermaid board.
sync lib/markdown.js mods/issues/markdown.js mods/file-icons/markdown.js mods/mermaid-board/markdown.js
# Code block colors for that markdown: highlight.js (vendored, lib/vendor/) and the span mapping.
sync lib/code-highlight.js mods/issues/code-highlight.js mods/file-icons/code-highlight.js mods/mermaid-board/code-highlight.js
sync lib/vendor/highlight.min.js mods/issues/hljs.js mods/file-icons/hljs.js mods/mermaid-board/hljs.js
sync lib/diagram-viewer.js mods/issues/diagram-viewer.js mods/file-icons/diagram-viewer.js mods/mermaid-board/diagram-viewer.js
# Per-project Claude skills (library scan, skills.json, generated --plugin-dir bundle): Project Settings, the + menu, and every
# other place that starts Claude in a folder (New worktree, git graph, reviewer Ask; spec 023).
sync lib/project-skills.js mods/project-settings/project-skills.js mods/my-new-menu/project-skills.js \
  mods/my-worktree/project-skills.js mods/git-graph/project-skills.js mods/reviewer/project-skills.js mods/threads/project-skills.js
# Listening ports per worktree (Project Settings › Ports); the herdr-ports MCP server imports lib/ports.js directly.
sync lib/ports.js mods/project-settings/ports.js
# Codebase index state, local git exclude entry and codegraph runs (Project Settings › Index; spec 026).
sync lib/codegraph.js mods/project-settings/codegraph.js
# Claude auto-memory of a project: notes, MEMORY.md index fixes (Project Settings › Memory; spec 029).
sync lib/claude-memory.js mods/project-settings/claude-memory.js
# Claude's saved threads of a folder: list, summaries, live map, delete (Threads panel; spec 031).
sync lib/claude-threads.js mods/threads/claude-threads.js
# A tab's label: the agent's live session title for tabs named after the program (tab bar + sidebar; spec 032).
sync lib/tab-title.js mods/my-tabs/tab-title.js mods/my-agents/tab-title.js mods/processes/tab-title.js

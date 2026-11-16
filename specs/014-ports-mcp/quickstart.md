# Quickstart: validate the Ports MCP tool

## Gate

```sh
cd ~/.config/herdr-app
sh scripts/sync-github-lib.sh
herdr-app check mods/project-settings          # Ports tab still works on the shared lib
node --check mcp-servers/herdr-ports/server.mjs
```

## Protocol smoke test (no Claude needed)

```sh
cd ~/Documents/SoraTech/168-yahagi-panwall
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"qs","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"project_ports","arguments":{}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"port_lookup","arguments":{"port":5173}}}' \
 | sh -c 'exec node "$HOME/.config/herdr-app/mcp-servers/herdr-ports/server.mjs"'
```

Expect 4 responses (ids 1–4), `tools/list` with `project_ports` and `port_lookup`, results with `isError` absent.

## Scenarios

1. **Same as the Ports tab (SC-001)**: start a dev server in a repo; compare `project_ports` with Project Settings › Ports for that project: same worktrees, same ports, pids, commands.
2. **Default project**: in a `Claude · N skills` session with `herdr-ports` on, ask "list my ports"; the tool runs without arguments and returns the session's project (confirms R5).
3. **Other project by name and by folder**: `project_ports {"project":"167-yahagi-sekisan"}` and `{"project":"~/Documents/SoraTech/167-yahagi-sekisan/backend"}` give the same result; an unknown name lists known names.
4. **Port lookup**: a used port names project, worktree and pid; an unused port says free; `0` and `70000` are rejected.
5. **Terminal**: a server started in a Herdr terminal shows `where`; one started in another terminal app has no `terminal`.
6. **Read-only (SC-005)**: after all calls, every server still runs; `git status` unchanged.
7. **Per project (SC-004)**: Project Settings › Skills lists `herdr-ports` under MCP servers; off in a project → no tool in its sessions.
8. **Speed (SC-002)**: `time` the smoke test; under 2 s.

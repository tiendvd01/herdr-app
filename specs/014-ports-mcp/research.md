# Research: Ports Tool for Claude (MCP)

## R1. One port reader for the Ports tab and the MCP server (FR-009)

- **Decision**: move the port discovery out of `mods/project-settings/main.js` (`loadPorts`) into `lib/ports.js`, a plain ES module with **no `herdr` import**: every function takes an injected `exec(cmd, args, opts) → { code, stdout, stderr }`. The mod gets the synced copy `mods/project-settings/ports.js` and passes Herdr's `exec`; the MCP server imports `lib/ports.js` directly and passes a `child_process.execFile` wrapper.
- **Rationale**: one source of truth for grouping rules (deepest worktree, omit outsiders, sort, pid:port dedupe), so the tab and the tool cannot drift. Constitution II (single source in `lib/`, synced copies in mods) is kept; the server is not a mod, so it can import from `lib/` itself.
- **Alternatives considered**: duplicate the logic in the server (drifts, breaks FR-009); have the server ask the running app (Herdr exposes no API for mod data, and the tool would fail with the window closed).

## R2. Terminal of a listener (Story 4)

- **Decision**: `lib/ports.js` returns each listener's controlling `tty` (from `ps -o pid=,tty=`). The mod keeps mapping tty → Herdr terminal through `terminals()` (as today). The server maps tty → terminal through `hc`: `hc ls` (addresses), `hc get <t>` (shell `pid`, `where` = "space / tab"), tty of that pid via `ps`.
- **Evidence**: `hc get t10w` returns `pid`, `foreground.pid`, `where: "168-yahagi-panwall / 1"`, `labels.herdr.space/tab`.
- **Rationale**: same tty rule as the Ports tab; works without the app window. If `hc` is missing or fails, the field is omitted (FR-008 is SHOULD).

## R3. MCP transport without dependencies or a build

- **Decision**: a single Node ES module, `mcp-servers/herdr-ports/server.mjs`, speaking MCP over stdio: newline-delimited JSON-RPC 2.0. Handles `initialize` (echoes the client's `protocolVersion`, declares `capabilities.tools`), `notifications/initialized`, `tools/list`, `tools/call`, `ping`; unknown methods → JSON-RPC error `-32601`. Tool errors are returned as `{ content:[{type:"text", text}], isError:true }`. Nothing is written to stdout except protocol messages; logs go to stderr.
- **Rationale**: no `npm install`, no lockfile, nothing to build (constitution III spirit); the protocol subset needed for tools is small. Node 24 is installed.
- **Alternatives considered**: `@modelcontextprotocol/sdk` (adds `node_modules/` to a config repo and an install step); a shell script server (JSON handling too fragile).

## R4. Registering the server in the library

- **Decision**: `mcp/herdr-ports.json` = `{"command": "sh", "args": ["-c", "exec node \"$HOME/.config/herdr-app/mcp-servers/herdr-ports/server.mjs\""]}`.
- **Rationale**: the library file is tracked and shared; `$HOME` expanded by the shell avoids a hard-coded user path and does not depend on Claude's `${VAR}` expansion rules. Shows in Project Settings › Skills automatically (spec 012 scans `mcp/*.json`), off by default.
- **Note**: the Skills tab shows an MCP entry's description as its command line; acceptable.

## R5. Default project and project names (FR-003)

- **Decision**: without `project`, use the server process's working folder (Claude starts MCP servers in the session's folder); if that is not inside a git repo, return an error asking for `project`. A `project` argument is first tried as a folder (`~` expanded); otherwise as a name, matched against the basenames of the main worktrees of all git repos found from `hc ls` terminal folders (the same live folders Project Settings lists, see CLAUDE.md "Shared behaviour"). Zero or several matches → error listing the known names.
- **Risk**: if Claude starts plugin MCP servers in another folder, the default would be wrong; checked in quickstart scenario 1 and, if so, the server uses `CLAUDE_PROJECT_DIR` when set, else `PWD`.

## R6. Port lookup (FR-004)

- **Decision**: `port_lookup` runs the same listener discovery, filters by port, and for each holder finds the git repo of its folder (`git rev-parse --git-common-dir` in that folder) and the worktree (`git worktree list` of that repo, deepest match). Port must be an integer 1–65535.
- **Rationale**: reuses R1; a holder outside any repo is still reported with `project: null`.

## R7. Performance (SC-002 < 2 s)

- **Decision**: one `lsof` for listeners, one `lsof -d cwd` for their folders, one `ps` for args and ttys, `git worktree list` per project; `hc get` only for terminals whose tty matched a listener is not knowable in advance, so `hc get` runs for all live terminals in parallel (≈15 today). Measured target checked in quickstart.

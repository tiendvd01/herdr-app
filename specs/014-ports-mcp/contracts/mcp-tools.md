# Contract: MCP server `herdr-ports`

Transport: stdio, newline-delimited JSON-RPC 2.0. Server info `{ name: "herdr-ports", version: "1.0.0" }`. Capabilities: `{ tools: {} }`. Both tools are read-only (`annotations: { readOnlyHint: true }`).

## Tool `project_ports`

Description: "Listening TCP ports of a git project, grouped by worktree (same as Herdr Project Settings › Ports). Defaults to the project of the current folder."

Input schema:

```json
{ "type": "object", "properties": {
  "project": { "type": "string", "description": "Folder inside the repository, or a project name as shown in Herdr Project Settings. Omit for the current folder's project." }
}, "additionalProperties": false }
```

Result: one `text` content item with a short summary line followed by JSON:

```text
herdr-app: 2 listening ports across 2 worktrees
{ "project": { "name": "...", "main": "~/..." }, "total": 2,
  "worktrees": [ { "path": "~/...", "branch": "master", "main": true,
    "ports": [ { "port": 5173, "pid": 123, "command": "node vite", "folder": "~/.../frontend", "rel": "frontend", "terminal": { "address": "t9c", "where": "repo / 1" } } ] } ] }
```

Errors (`isError: true`): `Not a git repository: <folder>`; `Unknown project "<x>". Known: a, b`; `Ambiguous project "<x>": <paths>`; `No project given and the current folder (<cwd>) is not in a git repository`.

## Tool `port_lookup`

Description: "Who is listening on a TCP port on this machine: free, or the project, worktree, folder, command and pid holding it."

Input schema:

```json
{ "type": "object", "properties": {
  "port": { "type": "integer", "minimum": 1, "maximum": 65535 }
}, "required": ["port"], "additionalProperties": false }
```

Result: summary line (`Port 3000 is free` / `Port 3000: node server.js (pid 123) in repo › main`) followed by the JSON of `data-model.md` › Port lookup result.

Errors: `Port must be an integer between 1 and 65535`.

## `lib/ports.js` (shared with the Ports tab)

```js
// exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>, injected by the caller.
repoOf(folder, exec)            -> { main, name } | null
listWorktrees(main, exec)       -> Worktree[]            // no ports yet
listListeners(exec)             -> Listener[]            // all on the machine, with folder, command, tty
loadPorts(main, exec)           -> Worktree[]            // worktrees with ports assigned (the tab's view)
assign(listeners, worktrees)    -> Worktree[]            // pure grouping rule, used by both
shortHome(text, home)           -> string
```

`mods/project-settings/main.js` replaces its local `loadPorts` with `loadPorts(r.main, exec)` from `./ports.js` and keeps its own tty → `terminals()` mapping for the Terminal button.

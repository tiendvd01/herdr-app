# Contract: `lib/codegraph.js`

No `herdr` import. `exec(cmd, args, opts?) → Promise<{ code, stdout, stderr }>`; `io = { read(path) → Promise<string|null>, write(path, text, expected) → Promise }`.

| Export | Behaviour |
|---|---|
| `hasEntry(text)` | true if any line (trimmed, not `#`) is `.codegraph`, `.codegraph/`, `/.codegraph`, `/.codegraph/` |
| `addEntry(text)` | `text` with `.codegraph/` on its own line appended (handles null / no trailing newline); unchanged if `hasEntry` |
| `findTool(exec, home)` | resolved command string or null (R5); a found path is cached |
| `excludeFile(main, exec)` | absolute path of the repo's `info/exclude` |
| `ensureExcluded(main, exec, io)` | adds the entry if missing (mkdir -p `info/`); `{ added: boolean, file }` |
| `indexState(main, exec, home)` | `IndexState` (data-model.md) |
| `runIndex(main, exec, io, home, mode)` | mode `"init"` (ensureExcluded, then `init`) or `"sync"`; `{ ok, error? }`; one run per main at a time (`running(main)` tells) |
| `running(main)` | `"init" \| "sync" \| null` |

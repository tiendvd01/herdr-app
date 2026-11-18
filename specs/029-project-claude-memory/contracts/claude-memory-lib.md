# Contract: `lib/claude-memory.js`

No `herdr` import. `exec(cmd, args, opts?) → Promise<{code, stdout, stderr}>`;
`io = { read(path) → Promise<string|null>, write(path, text, expected) → Promise }` (write rejects when
the file no longer equals `expected`; `expected = null` creates).

| Export | Returns | Notes |
|---|---|---|
| `slugOf(path)` | string | non-alphanumerics → `-` |
| `memoryDir(home, main)` | string | `${home}/.claude/projects/${slugOf(main)}/memory` |
| `safeFile(file)` | bool | basename rule; false for `MEMORY.md` |
| `validName(name)` | string \| null | error text or null |
| `parseNote(file, text)` | Note (no mtime) | header both styles |
| `parseIndex(text)` | IndexEntry[] | |
| `noteText({name, description, type, body})` | string | Claude's format |
| `indexLine(note)` | string | `- [Title](file) — description` |
| `withLine(indexText, line)` | string | appended on its own line |
| `withoutFile(indexText, file)` | string | drops lines linking `file` |
| `loadMemory(dir, exec, io)` | Memory | missing folder → `{exists:false, notes:[], …}` |
| `saveNote(dir, file, text, expected, io)` | void | throws on unsafe file / stale |
| `deleteNote(dir, file, exec, io)` | void | file + index lines |
| `addNote(dir, note, exec, io)` | `{file}` | mkdir, file, index line; throws on bad/duplicate name |
| `addToIndex(dir, file, exec, io)` | void | line built from the note's header |
| `dropDead(dir, file, io)` | void | removes index lines of a missing file |

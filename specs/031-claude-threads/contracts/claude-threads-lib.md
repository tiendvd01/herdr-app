# Contract: `lib/claude-threads.js`

No `herdr` import. `exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>`, `read(path) -> Promise<string|null>`.

| Export | Behaviour |
|---|---|
| `slugOf(path)` | every non-alphanumeric char → `-` |
| `threadsDir(home, folder)` | `${home}/.claude/projects/${slugOf(folder)}` |
| `validId(id)` | UUID-shaped basename only |
| `listFiles(dir, exec)` | `[{ id, path, mtime, size }]`; `[]` when the folder is missing |
| `summarize(paths, exec)` | `Map<path, Summary>` from one `rg` call over the given files; unreadable → absent fields |
| `parseLines(lines)` | pure: records of one file → `{ title, firstPrompt, lastPrompt, prompts, branch, cwd }` |
| `cleanPrompt(text)` | pure: typed prompt → one-line text or `null` when it is not a real prompt |
| `class ThreadCache` | `load(dir, exec)` → threads sorted by mtime desc, re-summarizing only changed files; hides 0-prompt threads |
| `liveMap(agentPids, read, home)` | `agentPids: [{ address, pid }]` → `Map<sessionId, address>` |
| `filterThreads(list, query)` | case-insensitive over title, firstPrompt, lastPrompt |
| `deleteThread(dir, id, exec)` | validates id; removes `<id>.jsonl` and `<id>/`; throws on invalid id or rm failure |
| `ago(seconds, now)` | `"now"`, `"5m"`, `"3h"`, `"2d"`, `"4w"`, date |

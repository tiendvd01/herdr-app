# Data Model: Project Claude Memory

## Memory (per project)

| Field | Type | Notes |
|---|---|---|
| dir | string | `~/.claude/projects/<slug>/memory` |
| exists | bool | folder present |
| notes | Note[] | every `*.md` except `MEMORY.md`, newest first |
| index | Index \| null | `MEMORY.md`, null when absent |
| unlisted | string[] | note files no index line links to |
| dead | IndexEntry[] | index entries whose file is missing |
| stamp | string | joined mtimes, to skip rereads |

## Note

| Field | Type | Notes |
|---|---|---|
| file | string | basename, `^[A-Za-z0-9][A-Za-z0-9._-]*\.md$` |
| name | string | header `name`, else file stem |
| description | string | header `description`, else first body line |
| type | `user`\|`feedback`\|`project`\|`reference`\|`unknown` | header `type` or `metadata.type` |
| header | bool | has a `---` header |
| text | string | whole file (what the editor shows and saves) |
| mtime | number | seconds |

## Index / IndexEntry

`Index { text, entries: IndexEntry[] }`; `IndexEntry { line (0-based), title, file, hook }`.

## Rules

- New note name: `^[a-z0-9][a-z0-9_-]*$` (≤ 64), file = `<name>.md`, must not exist.
- Delete: file removed, every entry with that `file` removed from the index.
- Add: note file created (expected null), index gains one line (index created when absent).
- Save: whole text, expected = text loaded; stale → refused, reload offered.

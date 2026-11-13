# Data Model: Files Panel (as-built)

No persisted state: this mod uses no `localStorage` key and writes no files. All of the below lives in memory per mod instance and resets when the instance is rebuilt.

## Folder context
- `cwd`, `on` (machine or null); key = JSON of both. A change resets entries, expanded folders, marks, ignored, search list, and the open file.

## Entry
- `name`, `dir` (bool). Stored per relative folder path in `entries: Map<path, Entry[]>`, sorted folders first then by name; capped 500/folder, 5,000 total (`limited` flag).
- `folders: Set<path>` expanded; `pending: Set<path>` loading.
- `marks: {absolutePath -> "A"|"U"|"D"|"M"}` from git status; `ignored: Set<relative path>`.

## Search
- `query` (trimmed), `all: string[]|null` (relative paths, up to 100,000), `allLoading`; results derived, max 200.

## Open file (viewer)
- `file` (path), `fileText`, `fileError`, `code` (read-only editor state, text capped at 400,000 chars), `md` (text when Markdown), `mdPreview` (bool), `mdY` scroll offset, `mdViewH`, `mdContentH`.
- Pinned viewer props: `file` (absolute path), `on`.

## open-file dialog
- `cwd`, `on`, `matches: {display, rel|abs, dir}[]` (max 30), `selected`, `version` (discards stale results), `error`.

## Transitions
- Click file -> `tab.new` (viewer props). Edit -> `tab.new` with `argv: ["nvim", path]`. Back arrow (unpinned inline preview) -> `file = null`.

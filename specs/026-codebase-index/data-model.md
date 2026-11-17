# Data model: Codebase index

## IndexState (returned by `indexState`)

| Field | Type | Meaning |
|---|---|---|
| `tool` | string \| null | resolved `codegraph` command; null = not installed |
| `indexed` | boolean | `<main>/.codegraph/` exists |
| `files`, `symbols` | number \| null | `fileCount`, `nodeCount` from status |
| `lastIndexed` | string \| null | ISO time |
| `pending` | number | added+modified+removed since last index |
| `tracked` | boolean | `.codegraph` is in the git index |
| `ignored` | boolean | git ignores `.codegraph/` (exclude entry or any ignore rule) |
| `excludeFile` | string | absolute path of the repo's `info/exclude` |
| `blocked` | string \| null | reason the index action is refused (home / root folder) |

## UI states (derived)

`missing tool` → `not indexed` → (click) `indexing` → `indexed` | `failed`
`indexed` + `!ignored && !tracked` → shows "Ignore in git" action.
`indexed` → (click Update) `updating` → `indexed` | `failed`.

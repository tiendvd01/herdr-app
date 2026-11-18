# Data Model: Claude Threads per Space

## Thread

| Field | Source | Notes |
|---|---|---|
| `id` | file name `<uuid>.jsonl` | must match `/^[0-9a-f-]{36}$/i` |
| `path` | `<dir>/<id>.jsonl` | |
| `mtime` | `stat %m` (seconds) | last activity, list order (desc) |
| `size` | `stat %z` | cache key with mtime |
| `title` | last `customTitle` › last `aiTitle` › first clean typed prompt › `"Untitled thread"` | shortened to one line |
| `firstPrompt` | first non-meta, non-sidechain typed prompt, cleaned | search |
| `lastPrompt` | last `lastPrompt` | search |
| `prompts` | count of non-meta, non-sidechain typed prompts | shown as "N prompts"; 0 → hidden |
| `branch` | `gitBranch` of the first typed prompt | optional |
| `cwd` | `cwd` of the first typed prompt | resume folder |
| `running` | address of the live terminal, or null | from LiveMap |

Prompt cleaning: `<command-name>/x</command-name>` + `<command-args>a</command-args>` → `/x a`;
lines starting with `<local-command-`, `<system-reminder>`, `Caveat:` are not prompts.

## LiveMap

`Map<sessionId, address>` built from agent terminals (claude) → foreground pid → `sessions/<pid>.json`.

## Per-space UI state (localStorage `spaces`)

`{ [spaceId]: { query: string } }`

## States of a row

idle → (click) → resuming → running (appears in LiveMap) → (tab closed) → idle.
idle → (delete click) → confirming → (second click) → deleted | (anything else) → idle.

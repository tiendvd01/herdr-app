# Data Model: Ports Tool for Claude (MCP)

## Project

| Field | Source | Rule |
|---|---|---|
| `name` | basename of `main` | shown as in Project Settings |
| `main` | `git rev-parse --path-format=absolute --git-common-dir` minus `/.git` | absolute path |

## Worktree

| Field | Source | Rule |
|---|---|---|
| `path` | `git worktree list --porcelain` | absolute; shown with home as `~` |
| `branch` | `branch refs/heads/<b>` line | `"(detached)"` when absent |
| `main` | `path === project.main` | main first, then by branch name |
| `ports` | listeners assigned to it | ascending by port; may be empty |

## Listener

| Field | Source | Rule |
|---|---|---|
| `port` | `lsof -nP -iTCP -sTCP:LISTEN -Fpcn` | 1–65535; IPv4/IPv6 of one pid count once (pid:port unique) |
| `pid` | same | |
| `command` | `ps -o pid=,args=` | home path shortened to `~`; falls back to process name |
| `folder` | `lsof -a -d cwd -p <pids> -Fpn` | absolute; listener skipped if unknown for project listing |
| `rel` | `folder` relative to its worktree | `./` at the worktree root |
| `tty` | `ps -axo pid=,tty=` | `??` → none |
| `terminal` | tty → Herdr terminal (mod: `terminals()`, server: `hc`) | `{ address, where }`, omitted when unknown |

Assignment: a listener belongs to the worktree whose path equals its folder or is a prefix of it followed by `/`; deepest match wins; none → not in this project.

## Port lookup result

```json
{ "port": 3000, "free": false, "holders": [
  { "pid": 123, "command": "node server.js", "folder": "~/repo/api", "project": "repo", "worktree": { "path": "~/repo", "branch": "main", "main": true }, "terminal": { "address": "t9c", "where": "repo / 1" } }
] }
```

`project` and `worktree` are `null` when the folder is outside any git repository.

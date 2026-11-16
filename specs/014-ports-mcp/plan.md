# Implementation Plan: Ports Tool for Claude (MCP)

**Branch**: `014-ports-mcp` (no branch created) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-ports-mcp/spec.md`

## Summary

Move the Ports tab's discovery into a dependency-free shared module `lib/ports.js` (injected `exec`), used by `mods/project-settings` through its synced copy and by a new stdio MCP server `mcp-servers/herdr-ports/server.mjs` (plain Node, hand-written JSON-RPC, no install). The server exposes two read-only tools, `project_ports` (worktrees + listeners of a project; default = current folder's project, or a folder/name) and `port_lookup` (free or holders). Herdr terminals are named through `hc`. The server is registered as `mcp/herdr-ports.json`, so it is turned on per project in Project Settings › Skills (specs 012/013).

## Technical Context

**Language/Version**: plain JavaScript; mods run in Herdr's runtime, the server in Node 24 (ES modules)

**Primary Dependencies**: none to install; system tools `lsof`, `ps`, `git`, `hc` via `exec`/`execFile`

**Storage**: none (each call reads the live system)

**Testing**: `herdr-app check mods/project-settings`, `node --check`, the stdio smoke test and scenarios in [quickstart.md](quickstart.md)

**Target Platform**: macOS, local machine

**Project Type**: shared lib + one mod refactor + one stdio MCP server

**Performance Goals**: a tool call < 2 s with ≤ 50 listeners (SC-002)

**Constraints**: read-only (never signal processes or write files); stdout carries only protocol messages; no `node_modules`

**Scale/Scope**: a few projects, tens of listeners, ~15 Herdr terminals

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Shipped mods read-only | Only personal `project-settings` changes. | Pass |
| II. Single source in `lib/` | Port logic moves to `lib/ports.js`; copy to `mods/project-settings/ports.js` via `scripts/sync-github-lib.sh`; the server (not a mod) imports `lib/ports.js` directly. | Pass |
| III. Plain JS, `herdr-app check` | Plain JS, no build/install; mod checked; server checked with `node --check` and the smoke test. | Pass |
| IV. Runtime conventions | Mod keeps its `cx.timer`/`cx.spawn` refresh; lib has no `cx`. | Pass |
| V. Panel UI | N/A. | Pass |
| VI. Intent in CLAUDE.md + specs | Note the server and `lib/ports.js` in CLAUDE.md. | Pass |
| No probe mods | Server lives in `mcp-servers/`, not `mods/`, so it is never docked. | Pass |
| Secrets | None used; `mcp/herdr-ports.json` holds no secret. | Pass |

Re-check after Phase 1: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/014-ports-mcp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/mcp-tools.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
lib/ports.js                              # NEW: repoOf, listWorktrees, listListeners, assign, loadPorts, shortHome (injected exec)
mods/project-settings/ports.js            # GENERATED copy
mods/project-settings/main.js             # use loadPorts(r.main, exec) from ./ports.js; keep tty → terminals() mapping
scripts/sync-github-lib.sh                # + sync lib/ports.js → mods/project-settings/ports.js
mcp-servers/herdr-ports/server.mjs        # NEW: stdio JSON-RPC, tools project_ports / port_lookup, hc terminal lookup
mcp/herdr-ports.json                      # NEW: {"command":"sh","args":["-c","exec node \"$HOME/.config/herdr-app/mcp-servers/herdr-ports/server.mjs\""]}
CLAUDE.md                                 # note the server and the shared port reader
```

**Structure Decision**: `mcp-servers/<name>/` at the repo root for servers whose code lives in this repo (outside `mods/` to avoid hot-reload/docking, outside `mcp/` which holds only library config files that the Skills tab lists).

## Complexity Tracking

No violations.

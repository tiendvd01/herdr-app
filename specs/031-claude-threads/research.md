# Research: Claude Threads per Space

## R1. Where threads live and what a summary needs

- **Decision**: a folder's threads are `~/.claude/projects/<slug>/<uuid>.jsonl` (slug = path with every
  non-alphanumeric character as `-`, same as `slugOf` in `lib/claude-memory.js`). A same-named
  `<uuid>/` folder holds sub-agent and tool-result files and is not a thread. Summary fields come
  from a few record kinds: `custom-title` (`customTitle`, set by `/rename`), `ai-title` (`aiTitle`),
  `last-prompt` (`lastPrompt`), and user records whose `message.content` is a plain string (typed
  prompts; carry `cwd`, `gitBranch`, `timestamp`, `isMeta`, `isSidechain`).
- **Rationale**: files are large (MBs); reading them whole in the mod for 200 threads is slow.
  `rg` with three fixed patterns returns only the small lines needed, across many files in one call.
- **Alternatives**: `jq` per file (parses every byte, slower); `claude --resume` picker (not
  scriptable).

## R2. Caching

- **Decision**: one `find <dir> -maxdepth 1 -name '*.jsonl' -exec stat -f '%m %z %N' {} +` per refresh;
  only files whose `mtime:size` changed are re-summarized with `rg`. Cache lives in memory per folder.
- **Rationale**: a running thread grows every few seconds; the rest never change.

## R3. Which threads are running, and where

- **Decision**: Claude writes `~/.claude/sessions/<pid>.json` with the live `sessionId` (updated on
  `/clear`). `hc get <address> --json` reports a terminal's `foreground.pid`, which is the Claude
  process for a terminal running Claude. Map: for each agent terminal with `program.key === "claude"`
  (from `agents()`), read its foreground pid, read `sessions/<pid>.json`, and record
  `sessionId → address`. pids are cached per address; the sessions file is reread each tick.
- **Rationale**: exact, no guessing by folder. Verified in this repo: `t13j` foreground pid 36321 ↔
  `sessions/36321.json` with the current session's id.
- **Alternatives**: parse `ps` command lines for `--resume <id>` (misses fresh threads and `/clear`).

## R4. Resuming in the same space

- **Decision**: `run("tab.new", { name, space, folder, argv })` with
  `argv = [...await agentArgv(claude, folder, null), "--resume", id]` where `claude` is the
  `knownAgents()` entry with key `claude` (fallback `{ key: "claude", run: ["claude"] }`). The folder is
  the listed folder (the thread's own `cwd` when present). Running threads: `run("agent.focus", { terminal })`.
- **Rationale**: same launch path as the + menu (spec 027), so skills attach.

## R5. Deleting

- **Decision**: id must match a UUID pattern; `rm -f <dir>/<id>.jsonl` and `rm -rf <dir>/<id>`.
  Refused when the thread is running.

## R6. Panel placement and button

- **Decision**: layout `panel-body` stack gets `{ id: "threads", type: "block", content: { mod: "threads" } }`;
  `my-tabs` adds `panelButton("threads", "Threads", "icons/claude.svg", …)` after Issues and allows
  `threads` in the per-space remembered panel list.

## R7. Remote spaces

- **Decision**: when `activePlace().on` is set, show an empty state "Threads are listed for local spaces only".

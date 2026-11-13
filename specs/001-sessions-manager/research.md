# Research: Sessions Manager (as-built)

No open unknowns. Decisions recorded from the existing design.

## CPU "Running" detection
- **Decision**: Compare accumulated CPU time between two polls; at least 10% counts as running.
- **Rationale**: macOS `%cpu` is a decaying average and stays high long after work stops.
- **Alternatives**: Use `%cpu` directly (misleading); threshold on RSS (unrelated).

## Single shared poll
- **Decision**: `status-usage` polls every 4 s into shared `procs`; the dialog only reads it.
- **Rationale**: The status badge and dialog show the same numbers and `ps` runs once.
- **Alternatives**: Poll inside the dialog (duplicate work, only fresh while open).

## Restart as a detached shell job
- **Decision**: `nohup` job: `/exit`, wait for exit (about 20 s), resume by parsed conversation id or `--continue`, wait for UI ready (about 27 s), then `/compact`.
- **Rationale**: Survives closing the dialog; works through `hc` like a user typing.
- **Alternatives**: In-mod async loop (dies with the dialog); a dedicated Herdr command (none exists).
- **Known weakness**: depends on Claude UI strings; failures only go to `data/restart-session.log`.

## Delete is immediate
- **Decision**: Hide the row locally, call `terminal.kill` once, request a refresh.
- **Rationale**: Poll lag (up to 4 s) would otherwise show a dead row and invite a second kill that errors.

## Claude Code only
- **Decision**: Filter on `app === "claude-code"`.
- **Rationale**: Process-tree rooting and restart commands are Claude-specific.

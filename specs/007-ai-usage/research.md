# Research: AI Usage Limits in the Status Bar

All unknowns resolved from `mods/status-usage/main.js` and `docs/mods/status-usage.md`.

## Decisions

- **Data source: external `quota-axi` CLI.**
  Rationale: one tool already normalises quota data for all providers (fresh/stale/notSetUp, windows, resets), so the mod holds no provider-specific auth or API code. Alternative rejected: calling each provider API directly (tokens, per-provider formats, much more code).
- **Run via `/bin/zsh -lic`.** Rationale: the app's own environment lacks the user's PATH (nvm-installed CLI); a login interactive shell finds it. Cost: shell start-up noise before the JSON, handled by parsing from the first `{`.
- **Ask for `--max-age 60s`.** Rationale: lets the CLI answer from its own cache so frequent refreshes stay cheap.
- **Show "used", not "remaining".** Rationale: the CLI reports percent remaining; the bar reads more naturally as consumption (100 - remaining).
- **Claude: weekly window only; others: highest window.** Rationale: the weekly window is the binding limit for Claude and keeps the bar short; other providers differ in window names, so the most-consumed window is the safest single signal.
- **Hover card for detail.** Rationale: the bar is narrow; full detail on demand avoids clutter.
- **Colour thresholds 70% / 90%.** Rationale: early warning then urgent, using existing theme colours (accent, working, blocked).
- **Refresh cadence: 120 s timer, plus hover (min 30 s apart, max 5 s documented cadence in the doc note).** Rationale: timely without hammering the CLI. The note in `docs/mods/status-usage.md` says "5 s / 30 s"; the code gates hover on 30 s since the last start unless forced, so the code is treated as authoritative.
- **Single in-flight guard (`busy`).** Rationale: prevents overlapping shell spawns.
- **Errors shown inline, truncated to 90 chars.** Rationale: makes a missing CLI diagnosable without a log.
- **Keep old data on failure.** Rationale: a transient failure should not blank useful figures.

## Alternatives considered

- Notification/toast on errors: rejected as noisy for a 2-minute loop.
- Persisting usage in `localStorage`: rejected; data is cheap to refetch and stale persisted figures would mislead.
- Timer-driven animation: not needed (no animation); Constitution IV forbids it anyway.

## Resolved unknowns

- Where icons come from: `icons/<provider>.svg` at the app home, with `agy` mapped to `antigravity`.
- Test strategy: none exists; `herdr-app check` plus manual scenarios.

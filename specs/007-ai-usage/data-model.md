# Data Model: AI Usage Limits

## Entities

**Provider** (in-memory, `this.data` array of the status view)
- `id`: claude | codex | copilot | gemini | agy (maps to an icon name)
- `label`: provider name as reported
- `plan`: plan name, may be empty
- `stale`: true when the source marks data stale
- `windows`: list of Usage windows (at least one, else the provider is dropped)

**Usage window**
- `label`: e.g. "weekly", "premium interactions"
- `kind`: e.g. "weekly" (used to pick Claude's window)
- `percent`: used percentage = 100 - percentRemaining
- `reset`: ISO timestamp of next reset, or empty

**View state**
- `data`: Provider list or null before first success
- `err`: last error text (max 90 chars) or null
- `busy`: a fetch is running
- `last`: timestamp of the last fetch start (throttle for hover)

## Derived values
- Reset text: minutes until `reset` -> "Nm", "Nh Nm" or "Nd Nh"; past/zero -> "reset pending" (card) or nothing (bar).
- Bar colour: accent < 70, working (warning) >= 70, blocked (danger) >= 90.
- Bar width: clamp(percent, 2..100) of the track.

## Filtering rules
Keep provider if state is fresh or stale and not `notSetUp`; keep window if `percentRemaining` is a number; drop provider with no windows.

## Persistence
None. This feature owns no `localStorage` keys and writes no shared keys. (The `ps.done` key belongs to the post-create runner, and `procs`/`procs.refresh`/`branch.switched` shared keys to other features of the same mod.)

## External interface
Input: JSON from `quota-axi --json --max-age 60s` with `providers[]` (`provider`, `plan`, `state.status`, `notSetUp`, `windows[]` of `label`, `kind`, `percentRemaining`, `resetsAt`). Consumed read-only; no contract file needed.

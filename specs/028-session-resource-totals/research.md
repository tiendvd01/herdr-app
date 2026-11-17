# Research: Session resource totals

## Where to read machine totals
- Decision: `sysctl -n hw.ncpu hw.memsize` through Herdr `exec`, once in `init` (in `cx.spawn`).
- Rationale: two numbers, one fast call; totals do not change while the app runs. `hw.ncpu` = logical cores, matching `ps %cpu` which is per core (100% = one core).
- Alternatives: `os.cpus()` / `os.totalmem()` (no Node `os` in the mod runtime); polling in `status-usage` with the procs data (more traffic for a constant).

## CPU scale
- Decision: `used% / (cores × 100)%`.
- Rationale: same scale as every per-process figure in the dialog; no unit switch.
- Alternative: normalize to 0–100% of machine (would disagree with per-row numbers).

## Warning threshold
- Decision: ≥ 80% of total → `t.blocked` color (the theme's alert color used across mods).

## Failure
- Decision: `sysctl` failure or unparsable output → totals `null` → header as today.

# Data model: Session resource totals

- **Totals** `{ cores: number, mem: number /* bytes */ } | null` — read once per dialog open; null when unreadable. Both must be positive integers or the whole value is null.
- **Usage** (existing) — `cpu` (sum of `%cpu`), `rss` (sum, bytes) over the shown sessions' items.
- **Derived** — `cpuTotal = cores × 100`; warn when `used / total ≥ 0.8`.

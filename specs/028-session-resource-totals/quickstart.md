# Quickstart: Session resource totals

1. `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` — all pass, including `session-totals`.
2. `herdr-app check mods/processes` — passes.
3. `herdr-app do mod.open '{"name":"processes"}'`, then `herdr-app shot` — header reads `… · CPU x% / N% · RAM y / Z GB`, where N = `sysctl -n hw.ncpu` × 100 and Z = `hw.memsize` in GB.
4. Close the dialog (`herdr-app do mod.open '{"name":"processes"}'` again).

# Quickstart: Validate AI Usage Limits

## Automated gate

```sh
herdr-app check mods/status-usage   # must pass
herdr-app status                    # no errors for the mod
herdr-app shot usage.png            # look at the status bar
quota-axi --json --max-age 60s | head -c 400   # source returns JSON
```

## Manual scenarios

1. **Compact figures (US1)**: with providers signed in, the bar shows "Used" + icon + percentage; Claude shows weekly % and time to reset.
2. **Hover card (US2)**: hover "Used"; card "Usage" opens after ~150 ms with bars; a window >= 70% is warning-coloured, >= 90% danger-coloured; stale provider shows "· stale".
3. **Refresh (US3)**: wait over 2 minutes, or hover after 30 s; figures update; rapid hovers do not spawn repeated fetches.
4. **Failure (US4)**: temporarily make `quota-axi` unavailable (e.g. rename it, or run with a broken PATH); a red message appears; restore it and confirm the message clears after the next refresh.
5. **Empty**: with no provider set up, the bar shows only "Used" and the card says "No data yet".

## Cleanup

Restore anything renamed in scenario 4; no probe mods under `mods/` (see MEMORY: no probe mods).

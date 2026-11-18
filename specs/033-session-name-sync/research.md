# Research: session name sync

## Where the three names come from today

- `my-agents` `scan()` (every 5 s): for each local Claude agent, foreground pid → `~/.claude/sessions/<pid>.json` → transcript path; one `jq` pass gives custom titles (`C`), AI titles (`A`), first user message (`F`). Label = `this.first[address]` (custom ‖ ai ‖ first), which beats `tabTitle()`.
- `my-tabs`: `tabTitle(tab, panes())` – chosen name, else telling live terminal title.
- `processes`: `se.title = a.title || "Claude"` from `status-usage/procs.js` (raw terminal title), `where = space_name › tab_name`.

## Decisions

**D1 — One reader, shared result.** `my-agents` keeps the transcript read and publishes `setShared("session.titles", {address: {custom, ai, first, all}})` only when the content changed. Rationale: it already polls every 5 s and is always docked; `setShared` re-renders every mod, so change-only. Alternatives: read in `status-usage`'s 4 s procs poll (would mix concerns, and status-usage has no agent naming today); each screen reads on its own (3× the `jq` calls, can disagree for a round).

**D2 — Order.** chosen tab name → last custom title → last AI title → telling live terminal title → first message → stored tab name. Rename/AI titles come from the transcript and are what `/rename` and Claude set; live title is next because it covers remote sessions with no transcript.

**D3 — Automatic vs chosen.** A tab name is automatic when empty/unnamed, equal to the program's name, or equal (whitespace-collapsed, compared on the first 28 characters, the Threads panel's cut) to any custom/AI title or first message the session ever had, or the live title. So a tab opened from Threads keeps following after a later `/rename`. Alternative: record thread-opened tab ids somewhere — needs bookkeeping across mods, rejected.

**D4 — Parsing in lib.** The `jq` filter string and the parse of its tab-separated output move into `lib/tab-title.js` (`TITLES_JQ`, `parseTitles`) so they are tested.

**D5 — Sessions second line.** `space_name`, plus ` › <tab name>` only when the name is chosen and differs from the shown name.

**D6 — Sidebar dedup.** `my-agents`' rule that hides purely numeric details and disambiguates duplicates stays; it now feeds on the shared label.

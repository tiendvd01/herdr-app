# Contract: `lib/tab-title.js`

- `clean(s)` — unchanged.
- `lead(tab, panes)` — unchanged.
- `TITLES_JQ` — jq filter emitting `C\t…`, `A\t…`, `F\t…` lines from a Claude transcript.
- `parseTitles(stdout)` → `{ custom, ai, first, all }` (last C, last A, first F, every C/A).
- `isChosen(tab, panes, titles?)` → boolean (data-model "Tab").
- `tabTitle(tab, panes, titles?)` → string, order: chosen name → `custom` → `ai` → telling live title → `first` → `tab.name`. `titles` is the SessionTitles entry for the lead pane's address (callers pass `shared("session.titles")?.[lead.terminal]`); without it the result is spec 032's.
- `titlesFor(tab, panes, map)` → the entry of `map` for the lead pane, convenience for callers.

Shared key `session.titles`: object address → SessionTitles; owner `my-agents`; readers `my-tabs`, `processes`.

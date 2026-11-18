# Data model

## SessionTitles (shared `session.titles`, keyed by terminal address)

| Field | Meaning |
|-------|---------|
| `custom` | last rename title (`custom-title` record), cleaned, or `""` |
| `ai` | last Claude title (`ai-title` record), or `""` |
| `first` | first real user message (≤ 200 chars, one line), or `""` |
| `all` | every custom/AI title seen, for the automatic-name check |

Written only by `my-agents` (`scan()`), only when the JSON differs from what is there. Entries for agents that are gone are dropped in the same write.

## Tab (Herdr)

`id`, `name`, `named`. Name is **automatic** when `!named`, `name === program.name`, or `name` matches (first 28 chars, whitespace collapsed) any of `all`, `first` or the live title; otherwise **chosen**.

## Lead pane

As spec 032: the tab's agent pane, else focused, else first; `terminal` is the address used to look up SessionTitles.

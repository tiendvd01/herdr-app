# Research

- **Where**: in `skills.json` next to the switches (one file, one write guard, one place per project). Alternative: a second per-project file — two writes that can disagree.
- **Write safety**: `writeSelection` writes `{ version: 2, sources, skills, mcp }`; `sources` keeps order (not sorted), skills/mcp stay sorted. Any caller passing a selection without `sources` keeps the file's current list (read inside writeSelection when `sel.sources` is not an array) so old callers cannot drop it.
- **Carry-over rule**: a project gets a shared source if any of its selected names is a valid skill folder in that source and not shadowed by Herdr's own library. Done by a script run once (only 4 projects); the lib ignores `skill-sources.json` from now on.

# Contract: `skill-sources.json` and lib API

```json
{ "version": 1, "sources": ["~/Documents/SoraTech/skills-set"] }
```
Missing file or bad JSON = no extra sources. Written only by `writeSources` (Skills tab) and the move script, 2-space JSON + newline.

`lib/project-skills.js` exports (new or changed):
- `sourcesFile()` → `<app>/skill-sources.json`
- `readSources()` → `{ sources: string[], raw }`
- `scanLibrary()` → `{ sources, skills, hidden, mcp, global }` (see data-model)
- `addSource(path)` → `{ ok: true, sources } | { ok: false, error }` (validates, saves)
- `removeSource(path)` → `{ ok: true, sources, projects: number }` (projects whose selection names any skill of that source)

# Contract: lib/project-skills.js (changed)

- `readSelection(project)` → `{ skills, mcp, sources, raw }`
- `writeSelection(project, { skills, mcp, sources? }, expectedRaw)` → `{ ok, raw } | { ok: false, error }`
- `scanLibrary(project?)` → `{ sources, skills, hidden, mcp, global }` (no project: own library only)
- `addSource(project, path)` → `{ ok, sources } | { ok: false, error }`
- `removeSource(project, path)` → `{ ok, sources, on }` (`on` = this project's turned-on skills the folder provided)
- Removed: `sourcesFile`, `readSources`, `writeSources`.

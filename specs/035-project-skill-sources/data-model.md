# Data model

`projects/<slug>/skills.json`:
```json
{ "version": 2, "sources": ["~/Documents/SoraTech/skills-set"], "skills": ["..."], "mcp": ["..."] }
```
- `sources`: ordered, `~` form, may be missing (= none). Version 1 files read as `sources: []`.
- Library for a project: own `.agents/skills/` + its `sources`, first wins a name.

# Data model

## Skill source
| Field | Notes |
|---|---|
| `path` | as stored (`~/...`), shown with `~` |
| `abs` | expanded absolute path |
| `own` | true only for `.agents/skills/` (first, fixed) |
| `missing` | folder does not exist |
| `count` | valid skills it provides (after dedupe) |

Stored: `skill-sources.json` → `sources: string[]` (extra sources only, in order).

## Skill (from `scanLibrary()`)
`{ name, description, path, source, invalid, size, globalDuplicate }` in `lib.skills`; the same shape plus `hiddenBy` (winning source path) in `lib.hidden`.

## Library
`{ sources: Source[], skills: Skill[], hidden: Skill[], mcp, global }`.

## Project selection
Unchanged (`projects/<slug>/skills.json`, names).

### Rules
- A name is provided by the first source (own first, then list order) that has it as a valid or invalid skill folder.
- Add source: path must expand to an existing folder; its realpath must differ from every existing source and must not be or lie inside the own library.

# Research: Skill sources

## Where the source list lives
- **Decision**: `skill-sources.json` at the repo root, `{ "version": 1, "sources": ["~/Documents/SoraTech/skills-set"] }`, paths stored as entered with `~` for home.
- **Rationale**: one list for all projects (spec FR-001); tracked setup like `keys.json`; `~` keeps it readable and portable across user names.
- **Alternatives**: `settings.json` (Herdr's own file, validated by the app, `settings.error` risk); `localStorage` of `project-settings` (invisible to the launch path in other mods and to scripts); per-project list (the request is one place for folders, projects only toggle).

## Name clashes between sources
- **Decision**: first source wins; later same-name skills go to `lib.hidden` with `hiddenBy`, never into `lib.skills`.
- **Rationale**: `syncBundle()` builds its map from `lib.skills` by name, so it needs no change and can never link the hidden one. Selections stay names (FR-005).
- **Alternatives**: namespacing selections as `source/name` (breaks every existing `skills.json`, makes moves change selections).

## Missing source
- **Decision**: `test -d <path>` per extra source; missing → `{ missing: true }`, no skills. The launch path already warns "missing from library" for selected names it cannot find.
- **Alternatives**: auto-remove (loses setup when a disk is unmounted).

## Same folder by another spelling
- **Decision**: compare by `realpath` of the expanded path (`exec("realpath", [p])`); refuse an add equal to an existing source or equal to / inside `.agents/skills`.
- **Rationale**: catches `~/x`, `/Users/me/x`, `x/` and symlinked folders.

## Moving the SoraTech set
- **Decision**: Node script `scripts/move-skill-set.mjs` (no `herdr` import), modelled on `scripts/migrate-agents-skills.mjs`: preflight clash → move (`rename`, fallback `cp -R` + `rm -rf` across volumes) → rewrite absolute paths in moved text files → add the source to `skill-sources.json` → re-point links in every `projects/*/claude-plugin/skills/` whose target is `.agents/skills/<moved>`. `--dry-run` reports only. Every step is idempotent.
- **Path rewrite**: in `.md`, `.sh`, `.py`, `.js`, `.mjs`, `.json`, `.txt`, `.env` files, replace `~/.config/herdr-app/.agents/skills/`, `~/.config/herdr-app/skills/`, `$HOME/...` and the absolute `/Users/<me>/.config/herdr-app/...` spellings with `~/Documents/SoraTech/skills-set/` (keeping the same spelling style: `$HOME` stays `$HOME`, absolute stays absolute).
- **Team set**: listed in the script (`TEAM`: `delivery`, `delivery-*` by prefix, `devflow`, `sora-*` by prefix, `find-mockup-repo`, `issue-walkthrough`, `onboard-domain`, `translate-requirement`).

## UI
- **Decision**: a "Sources" block at the top of the Skills tab: one row per source (path, skill count or "missing", Open, ✕ for extra sources), then an input + Add. Skill rows get the source as a dim tag when there is more than one source; hidden skills are listed with "hidden by <source>" and no switch. Removing a source with skills on in some projects shows "N projects had its skills on" (reads `projects/*/skills.json`).

# Quickstart: validate spec 034

1. Unit tests: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'` → all pass.
2. Dry run: `node scripts/move-skill-set.mjs --dry-run` → lists the team skills, no files change (`git status` same).
3. Move: `node scripts/move-skill-set.mjs` → `.agents/skills/` keeps only ponytail*; `~/Documents/SoraTech/skills-set/` has the team set; `skill-sources.json` lists it.
4. `rg -l 'config/herdr-app/(\.agents/)?skills/' ~/Documents/SoraTech/skills-set` → no output.
5. Links: `ls -l projects/*/claude-plugin/skills | rg skills-set` → team skills of 167/168 point into `skills-set`; `diff` of each `skills.json` before/after → none.
6. Rerun step 3 → "nothing to move", no file changes.
7. `herdr-app check mods/project-settings` (and the other synced users) pass; open Project Settings › Skills, `herdr-app shot` → Sources block with two rows, team skills tagged with their source.
8. Add a missing path in the tab → refused with reason; add a temp folder with one skill → it appears; remove it → gone.

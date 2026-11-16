# Research: Skill Library Moves to `.agents/skills/`

All findings below were checked by hand on 2026-11-16 in scratch folders with `skills` CLI (npx `skills@latest`) and against the current repo.

## R1. Which CLI target writes to `.agents/skills/`, and only there?

- **Decision**: `npx skills add <repo> -a universal`, run from `~/.config/herdr-app`.
- **Rationale**: in an empty git folder it created only `skills-lock.json` and `.agents/skills/<name>/SKILL.md`; no other agent folder. The CLI has no `--dir` flag and no env var for the project folder (checked its `dist/`: only `*_HOME` vars for some agents' global folders), so a target name is the only lever.
- **Alternatives**: `-a openclaw` (writes `skills/`, today's workaround, rejected by the user); `-a claude-code` (writes `.claude/skills/`, which Claude Code would auto-load when working on this repo).

## R2. Does the CLI still manage CLI-installed skills after they are moved by hand?

- **Decision**: yes; keep `skills-lock.json` as is, no rewrite.
- **Rationale**: the lock (v2) stores only source repo, path inside that repo and a hash, not the local folder or agent. After moving `skills/ponytail*` to `.agents/skills/` in a scratch copy:
  - `skills ls -a universal` lists all 6 (`./.agents/skills/...`, "not linked" = no extra agent links, expected);
  - `skills update -p -y` checks all 6 and reports up to date;
  - `skills add ... -a universal` on top reinstalls into `.agents/skills/`.
- **Gotcha**: `skills remove <name> -a universal -y` prints Done but removes nothing (it only unlinks agent-specific copies). `skills remove <name> -y` **without `-a`** removes the folder and the lock entry. CLAUDE.md must give the form without `-a`.

## R3. How to rename in git so history is kept

- **Decision**: plain `mv` of each folder, then `git add -A skills .agents/skills`.
- **Rationale**: git does not record renames; it detects them from identical content at diff/log time (`git log --follow`, `git diff -M`). Contents are unchanged, so every file shows as a 100% rename. `git mv` would need special care for the 6 untracked ponytail folders and gives the same result.
- **Note**: `skills/.gitkeep` moves too; `listSkills` already skips dot-names.

## R4. Repairing every project's plugin folder

- **Decision**: the migration script repairs links itself, from the files, for **every** `projects/*/claude-plugin/skills/`; it does not wait for Herdr.
- **Rationale**: `syncBundle` lives in `lib/project-skills.js`, which imports the `herdr` runtime module and cannot run under plain Node. The rule it applies is simple and file-based, so the script reproduces the end state exactly:
  - a link whose target is `<app>/skills/<n>` → re-pointed to `<app>/.agents/skills/<n>` if that has a `SKILL.md`, else removed;
  - a name in `skills.json` with no entry yet and a valid library folder → link created;
  - anything that is not a link → left alone (same as feature 013).
  `syncBundle` compares targets as strings, and `listSkills` builds paths as `${skillsDir()}/<name>`, so the script must write exactly `/Users/<u>/.config/herdr-app/.agents/skills/<name>` (absolute, no trailing slash). Then the next real `syncBundle` sees nothing to change.
- **Race found**: if the Skills tab runs `syncBundle` with the **old** code after the folders have moved, it sees an empty library and removes all links (selections stay). The second rule above (create missing links from `skills.json`) makes the script recover from that, and the order in R5 keeps the window to well under a second.
- **Alternatives**: a temporary `skills → .agents/skills` compat link (rejected by FR-003); asking the user to open each project in Project Settings (misses closed projects, FR-006).

## R5. Order of steps

- **Decision**:
  1. Edit `lib/project-skills.js` (not loaded by Herdr, so nothing changes yet).
  2. Script: preflight (clash check, nothing to do?) → move folders → `rmdir skills` → repair all plugin folders → run `scripts/sync-github-lib.sh` (copies the new lib into both mods, which hot-reload).
  3. Edit `mods/project-settings/main.js` text (path line, hint) and `CLAUDE.md`.
- **Rationale**: the window in which mods run old code against the new layout is a single script run; links are repaired before mods reload, and the R4 rules make a sync during that window harmless.

## R6. Script language

- **Decision**: one dependency-free Node script, `scripts/migrate-agents-skills.mjs` (Node 24 is installed; same style as `mcp-servers/herdr-ports/server.mjs`).
- **Rationale**: it must parse `skills.json` and read/write symlinks; Node does both with the standard library (`fs`), with no `jq`/`python` dependency. It is run once by hand and kept in `scripts/` as the record of how the migration was done.
- **Alternatives**: bash + `node -e` for JSON (harder to read); building the migration into a mod (spec says run once by hand; a mod would hot-reload mid-move).

## R7. Path text in Project Settings

- **Finding**: `mods/project-settings/main.js` builds the MCP path shown in the Skills tab with `skillsDir().replace(/skills$/, "mcp")` (lines ~267 and ~277). With the new path this would show `.agents/mcp`, which is wrong.
- **Decision**: import and use `mcpDir()` (already exported by the lib) for those two strings.

## R8. Other readers of the old path

- **Finding** (`rg` over the repo, `~/.claude` settings, `~/.zshrc`): only `lib/project-skills.js` (+ its two synced copies), `mods/project-settings/main.js` (via `skillsDir()`), `CLAUDE.md`, and specs 012/013 (history, left as is). `mods/my-new-menu/main.js` uses only lib functions. Skills that point at siblings with `../` (the `delivery-*` set) keep working because they move together.

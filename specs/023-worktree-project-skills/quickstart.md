# Quickstart: Project skills in worktrees

## Setup

1. Pick a git project P that has a worktree (or create one in step B). In Project Settings › Skills, turn on 2 skills and 1 MCP server.
2. `herdr-app check mods/my-worktree`, `mods/git-graph`, `mods/reviewer`, `mods/my-new-menu` all pass; `herdr-app status` shows no mod errors.

## A. + menu in an existing worktree (US1)

Focus a terminal in a worktree of P, open +: row reads `Claude · 3 skills`. Start it, run `/skills` (or ask Claude): the 2 skills appear as `herdr-<repo>:<skill>`, the MCP server is listed in `/mcp`.

## B. New worktree dialog (US2)

+ › New worktree… : chip `Start Claude · 3 skills` is on. Type a new branch, Enter. New space opens with a Claude tab; same check as A. Toggle the chip off, create another: plain space, no Claude tab. Reopen dialog: chip remembers off. If P has `post-create.sh`, its success notification still appears.

## C. git graph and reviewer (US3)

In the Git dialog, open a worktree row's menu › New Claude tab: same check as A. In the Changes dialog, Ask a question: the started Claude has the skills and receives the question.

## D. Shared selection (US4)

Open Project Settings from the worktree: it shows P. Turn one more skill on; start Claude from + in P's main checkout: the new skill is there.

## E. Fallbacks

- Turn everything off for P: B starts a plain Claude, no notification.
- A non-git folder: git graph/reviewer start plain agents.
- `git status` in P's main checkout and the worktree show no new files.

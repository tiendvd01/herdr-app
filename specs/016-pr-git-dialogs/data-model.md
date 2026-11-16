# Data Model: Pull requests and Git graph as dialogs

No persisted data is added. Runtime state only:

| Key (Herdr shared) | Value | Written by | Read by | Lifetime |
|---|---|---|---|---|
| `pr-flow.dialog` | overlay id (string) or `null` | `pr-flow` dialog copy: `init` sets, `close()` clears if it is its own id | `my-tabs` (button on), `inbox` (open or not) | while the dialog is open |
| `git-graph.dialog` | overlay id or `null` | `git-graph` Graph copy in an overlay: `init` sets, `close()` clears | `my-tabs` | while the dialog is open |
| `pr-flow.goto` (existing) | `{ url, at }` | `inbox`, `pr-flow` dialog before it opens the viewer | `pr-flow` list copy (`takeGoto`) | consumed once per `at` |
| `reviewer.dialog` (existing) | overlay id | `reviewer` | `my-tabs` | unchanged |

`my-tabs` localStorage `panels` (space id → panel child id): values `graph` / `prs` become unknown and are
treated as "no panel".

## State transitions (each dialog)

```text
closed --(tab button / mod.open)--> open --(tab button | Esc | close control)--> closed
open(pr-flow) --(open file/log in viewer)--> closed + pr-flow.goto set
```

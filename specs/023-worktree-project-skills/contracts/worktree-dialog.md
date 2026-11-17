# Contract: New worktree dialog (mods/my-worktree)

Applies to `action: "new"` only.

- Below the branch list: chip `Start Claude` (on/off). Label `Start Claude · N skills` when the repo's project has N > 0 valid items on. Hidden while agents load, or when Claude is not installed for the space's machine.
- State: `localStorage.startClaude`, default on.
- Footer hint unchanged except: `↑↓ choose · ↵ create (+ Claude) · esc cancel` when the chip is on.
- Create (Enter / click on a branch):
  - chip off, no Claude, or the caller passed its own `props.tab` or `props.argv`: `space.new { folder, machine, tab: props.tab, argv: props.argv }` (as today).
  - chip on and neither `props.tab` nor `props.argv`: `space.new { folder, machine, tab: claude.name, argv: await agentArgv(claude, path, machine) }`.
- Errors from `git worktree add` keep the dialog open as today; skill problems never block creation.

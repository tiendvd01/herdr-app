# Research: dialog border audit

## How a dialog gets its frame

- **Decision**: a dialog's frame is drawn either by Herdr (default) or by the mod (`frame: "none"` + the kit's
  `dialogFrame`). Never both, never neither.
- **Finding**: an explicit `openOverlay({...})` does **not** take `frame` from the mod's `mod.json`; only
  `mod.open` reads `mod.json`. So a mod with `frame: "none"` in `mod.json` that is also opened by an explicit
  `openOverlay` without `frame: "none"` gets Herdr's frame around its own `dialogFrame`: a double edge (spec 020
  fixed the status bar call this way). Reproduced on 2026-11-17 by removing `frame` from
  `mods/processes/mod.json` and opening it: two nested rounded edges at the corners (restored afterwards).

## Audit (2026-11-17, light theme, `herdr-app shot` + corner crops)

| Dialog | Opened from | Frame | Finding | Fix |
|--------|-------------|-------|---------|-----|
| Changes (`reviewer`) | tab bar, `cmd-shift-g`, inbox (`mod.open`) | mod (`dialogFrame`) | one border | — |
| Ask the agent (`reviewer`, `ask.js`) | Changes › Ask (explicit, no frame) | Herdr; content has no border | one border | — |
| Git (`git-graph`) | tab bar (`mod.open`) | mod | one border | — |
| Git action / update dialogs, menus, settings popup | inside Git (explicit, no frame) | Herdr; roots have no border | one border | — |
| Pull requests (`pr-flow`) | tab bar, inbox (`mod.open`) | mod | one border | — |
| Project Settings | sidebar footer, + menu (`mod.open`) | mod | one border | — |
| UI gallery | `mod.open` | mod | one border | — |
| **Processes** | status bar badge (explicit, `frame: "none"`) | mod | one border | — |
| **Processes** | **Ctrl+B › p** (`tmux-prefix`, explicit, **no frame**) | **Herdr + mod** | **double border** | pass `frame: "none"` |
| Open in VS Code / Zed | + menu, `cmd-g` (`mod.open`) | mod | one border (the dialog closes itself once the editor starts) | — |
| Project scripts | Ctrl+B › s (explicit), `mod.open` | Herdr both ways | one border | — |
| Branch switch (popup) | status bar (explicit) | Herdr | one border | — |
| + menu (`my-new-menu`, popup) | tab bar + (explicit) | Herdr | one border | — |
| Sort menu (`my-agents`, popup) | Agents header (explicit) | Herdr; root has no border | one border | — |
| tmux prefix (popup) | `ctrl-b` (`mod.open`) | Herdr | one border | — |
| Worktree (`my-worktree`) | + menu, space menu (explicit) | Herdr; root has no border | one border | — |
| Diagram viewer (`issues`, `file-icons`) | a diagram in markdown (explicit) | Herdr; root has no border | one border | — |
| Space menu (`my-menu`, popup) | sidebar (explicit) | Herdr | one border | — |

Out of scope (shipped, constitution I): `picker`, `open-file`, `machine-add`, `mermaid-board`, `worktree`,
`menu`, `agents`, `win98`.

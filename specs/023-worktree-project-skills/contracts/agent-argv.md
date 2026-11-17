# Contract: `agentArgv` (lib/project-skills.js)

```js
export async function agentArgv(agent, folder, machine) // → Promise<string[]>
```

**Input**
- `agent`: a `knownAgents()` row (`{ key, name, run }`).
- `folder`: absolute folder the agent will start in (may be null).
- `machine`: the space's machine id, or null/undefined for local.

**Output**: argv to pass to `tab.new` / `space.new`.

| Case | Result | Notification |
|------|--------|--------------|
| `agent.key !== "claude"` | `agent.run` | none |
| `machine` set, `folder` null, or not in git | `agent.run` | none |
| project has nothing selected (`skills.json` missing or empty) | `agent.run` (no library scan, nothing written) | none |
| selected items, none valid | `agent.run` | warning "Skills skipped" |
| project has ≥1 on | `[...agent.run, "--plugin-dir", <projects/slug/claude-plugin>]` | warning "Skills skipped" if any were skipped |
| refresh throws twice | `agent.run` | warning "Project skills not attached" + reason |

Never throws. Never writes outside `projects/<slug>/claude-plugin/`.

The library is scanned once per call (inside `launchArgs`); there is no separate `enabledCount` pass (review fix).

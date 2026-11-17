// The + menu's start of an agent (spec 027). The command line is decided now, from the space's current
// folder, by the same agentArgv as every other launch place: Claude in a main checkout or a worktree
// gets the project's skills folder, everything else runs agent.run. Never throws.
import { agentArgv } from "./project-skills.js";

export async function agentTab(agent, space, folder) {
  const argv = await agentArgv(agent, folder, space?.machine ?? null);
  return { name: agent.name, space: space?.id, folder: folder ?? undefined, argv };
}

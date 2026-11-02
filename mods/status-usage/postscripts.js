// Runs <repo>/.herdr/post-create.sh in each new worktree space (checkouts made by the
// worktree dialog live under ~/.herdr/worktrees/). Spaces open at first start are
// marked done so nothing runs retroactively.
import { spaces, home, readTextFile, notify } from "herdr";

const KEY = "ps.done";

export async function checkPostScripts(exec) {
  const root = `${home()}/.herdr/worktrees/`;
  const cands = spaces().filter((s) => !s.machine && s.folder?.startsWith(root));
  let done = null;
  try { done = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const first = !Array.isArray(done);
  done = new Set(first ? [] : done);
  const fresh = cands.filter((s) => !done.has(s.folder));
  if (!fresh.length) { if (first) localStorage.setItem(KEY, "[]"); return; }
  for (const s of fresh) {
    done.add(s.folder);
    if (first) continue;
    try {
      const c = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: s.folder });
      if (c.code !== 0) continue;
      const common = c.stdout.trim();
      const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
      const file = `${main}/.herdr/post-create.sh`;
      const text = await readTextFile(file);
      if (!text?.trim()) continue;
      const r = await exec("sh", [file], { cwd: s.folder });
      notify(r.code === 0
        ? { title: "Post-create script done", body: s.name, level: "success" }
        : { title: "Post-create script failed", body: `${s.name}\n${(r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n")}`, level: "error" });
    } catch (e) {
      notify({ title: "Post-create script failed", body: String(e?.message ?? e), level: "error" });
    }
  }
  localStorage.setItem(KEY, JSON.stringify([...done].slice(-200)));
}

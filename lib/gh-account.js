// Runs `gh` as the right GitHub account for a repo, without switching gh's active account.
// Rule: a repo whose owner is the login of an account gh is logged in to (gh auth login)
// runs as that account (tiendvd01/herdr-app -> tiendvd01); every other repo (an org such as
// structuralengine) runs as gh's active account. The token is read inside the shell
// (`gh auth token --user`), so it never shows up in a process list.
//
//   const accounts = ghAccounts(exec);
//   await accounts.gh("owner/name", ["pr", "list", "-R", "owner/name"]);  // { code, stdout, stderr }

const AS_USER = 'GH_TOKEN="$(gh auth token --user "$0")" || exit 1; export GH_TOKEN; exec gh "$@"';

/** The "owner/name" of a GitHub URL (PR, issue, run) or of "owner/name" itself; null otherwise. */
export function repoOfRef(ref) {
  const m = /^(?:https?:\/\/github\.com\/)?([\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/|$)/.exec(String(ref ?? "").trim());
  return m ? m[1] : null;
}

/** The repo a gh argument list is about: -R/--repo, a GitHub URL, an api path repos/<owner>/<name>/...,
 *  or graphql's -F owner= -F name=. null when it names none (search, api user). */
export function repoInArgs(args) {
  let owner = null, name = null;
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i]);
    if ((a === "-R" || a === "--repo") && args[i + 1]) return repoOfRef(args[i + 1]);
    if (a.startsWith("--repo=")) return repoOfRef(a.slice(7));
    if (/^https?:\/\/github\.com\//.test(a)) return repoOfRef(a);
    const api = /^\/?repos\/([\w.-]+\/[\w.-]+)/.exec(a);
    if (api) return api[1];
    if (a.startsWith("owner=")) owner = a.slice(6);
    if (a.startsWith("name=")) name = a.slice(5);
  }
  return owner && name ? `${owner}/${name}` : null;
}

export function ghAccounts(exec) {
  let state = null; // Promise<{ logins: string[], active: string | null }>
  const load = () => (state ??= exec("gh", ["auth", "status", "--json", "hosts"])
    .then((r) => {
      const list = JSON.parse(r.stdout || "{}").hosts?.["github.com"] ?? [];
      const ok = list.filter((a) => a.state === "success");
      return { logins: ok.map((a) => a.login), active: ok.find((a) => a.active)?.login ?? null };
    })
    .catch(() => ({ logins: [], active: null })));

  /** The account a repo (or GitHub URL) runs as. */
  async function loginFor(repo) {
    const { logins, active } = await load();
    const owner = repoOfRef(repo)?.split("/")[0].toLowerCase();
    return (owner && logins.find((l) => l.toLowerCase() === owner)) || active;
  }

  async function as(login, args, options) {
    const { active } = await load();
    if (!login || login === active) return exec("gh", args, options);
    return exec("sh", ["-c", AS_USER, login, ...args], options);
  }

  return {
    /** Every logged-in login and the active one. */
    accounts: load,
    loginFor,
    /** gh as the account for `repo` (a repo or GitHub URL; null: the active account). */
    gh: async (repo, args, options) => as(repo ? await loginFor(repo) : null, args, options),
    /** gh as one given account. */
    as,
    /** gh as the account of the repo the arguments name (see repoInArgs). */
    run: async (args, options) => { const repo = repoInArgs(args); return as(repo ? await loginFor(repo) : null, args, options); },
    /** gh as each account in turn (active first) until one succeeds: for a command that names no repo. */
    any: async (args, options) => {
      const { logins, active } = await load();
      let last = null;
      for (const login of [active, ...logins.filter((l) => l !== active)]) {
        last = await as(login, args, options);
        if (last.code === 0) return last;
      }
      return last ?? exec("gh", args, options);
    },
    /** Forget the accounts (after gh auth login/logout). */
    reset: () => { state = null; },
  };
}

// Shared GitHub link helpers for mods (pr-flow, better-sidebar, ...). Pure functions and one
// injected `exec`, so there is no `herdr` import and node can run them in tests.
// Import with a relative path, e.g. `../../lib/github.js` from `mods/<name>/`.

const NAME = "[\\w.-]+";

// A git remote URL -> { host, owner, name, repo }, or null. Accepts https://, ssh:// and scp-style
// (`git@host:owner/repo.git`); credentials, ports and a trailing `.git` or `/` are dropped.
// Local paths and anything without a host give null.
export function parseRemoteUrl(remote) {
  const url = String(remote ?? "").trim();
  const m = new RegExp(`^(?:https?|ssh|git):\\/\\/(?:[^/@]+@)?([^/:@\\s]+)(?::\\d+)?\\/(${NAME})\\/(${NAME}?)(?:\\.git)?\\/?$`, "i").exec(url)
    ?? new RegExp(`^(?:[^/@:\\s]+@)?([^/@:\\s]+):(?!\\/)(${NAME})\\/(${NAME}?)(?:\\.git)?\\/?$`).exec(url);
  return m ? { host: m[1].toLowerCase(), owner: m[2], name: m[3], repo: `${m[2]}/${m[3]}` } : null;
}

// `owner/repo` of a remote that is on github.com itself. Never hand any other URL to gh.
export function githubRepo(remote) {
  const p = parseRemoteUrl(remote);
  return p && p.host === "github.com" ? p.repo : null;
}

// Does this ssh host alias (`github-soratech` in ~/.ssh/config) end up at github.com?
// `ssh -G` prints the resolved config; one answer is kept per machine and alias.
export function githubHostChecker(exec) {
  const seen = new Map();
  return (host, on) => {
    const key = JSON.stringify([on ?? null, host]);
    if (!seen.has(key)) {
      seen.set(key, exec("ssh", ["-G", host], { on: on ?? undefined })
        .then((r) => /^hostname github\.com$/im.test(r?.stdout ?? ""))
        .catch(() => false));
    }
    return seen.get(key);
  };
}

// `owner/repo` of a remote: github.com directly, or an ssh alias that `isGithubHost` says is GitHub.
export async function repoFromRemote(remote, { isGithubHost, on } = {}) {
  const direct = githubRepo(remote);
  if (direct) return direct;
  const p = parseRemoteUrl(remote);
  if (!p || /^https?:/i.test(String(remote).trim()) || !isGithubHost) return null;
  return (await isGithubHost(p.host, on)) ? p.repo : null;
}

// https://github.com/<owner>/<name>/pull/<n> -> { owner, name, repo, number, url }, or null.
export function parsePrUrl(url) {
  const m = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/.exec(String(url));
  return m ? { owner: m[1], name: m[2], repo: `${m[1]}/${m[2]}`, number: Number(m[3]), url: `https://github.com/${m[1]}/${m[2]}/pull/${m[3]}` } : null;
}

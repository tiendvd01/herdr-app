# Research: Pull requests panel

No NEEDS CLARIFICATION remain. Decisions recorded from the code as built.

| Topic | Decision | Rationale | Alternatives rejected |
|-------|----------|-----------|-----------------------|
| Data source | `gh` CLI via `exec` (pr view/list, search, api, graphql, run view) | Reuses user's auth; no tokens stored | Direct REST with own token (secret handling) |
| Account choice | By repo owner, token read inside the shell (`lib/gh-account.js`) | Personal + org repos without switching active account; token hidden from process list | Switching active account (racy), single account |
| Mine | Search with every logged-in account, dedupe URLs; match authors by each account's real login | `gh` name can differ from GitHub login | `@me` for one account only |
| Discovery | Agent branch lookup (30 s working / 2 min idle) plus the view's list every 5 min | PRs by agents appear fast; list covers the rest | Poll everything (rate limits) |
| Polling | Only agent-branch or listed PRs; settled ones at 4x interval; merged/closed stop | Limits API calls | Fixed polling of all |
| Missing CI | "running" within a wait window after head seen, then "none"; never "passed" | Checks appear late; honesty | Treat empty as passed |
| AI checks | Name pattern plus configured names, kept out of CI | AI review job result is not build health | Count as CI |
| Post-merge flow | Show Actions runs by name, no "deployed" guess | Works with any repo, no setup | Per-repo workflow config |
| Merge safety | Optional prop, double press within 4 s, `--match-head-commit` | Prevents accidental or stale merge | Always-on button; single press |
| Diff viewer | Separate pane of the same mod (`screen: "viewer"`), target passed via shared `pr-flow.view` | Wide content needs room; one pane reused | Dialog; inline in narrow panel |
| Per-space state | localStorage `spaces`, keyed by space id | Constitution IV; like Issues | Global shared state |
| Cross-mod goto | shared `pr-flow.goto` `{url, at}`, honoured if under 30 s old | Lets inbox jump without direct coupling | Command with args |
| Language | shared `pr-flow.lang`, prop default, system fallback | Viewer pane follows panel | Per-pane setting |
| Shared code | `lib/pr-gh.js`, `pr-status.js`, `github.js`, `gh-account.js` copied by sync script | Constitution II; inbox reuses them | Duplicate per mod |
| Tests | None; `herdr-app check` is the gate | Constitution III | Add a test runner (forbidden) |

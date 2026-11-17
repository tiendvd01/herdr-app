// GENERATED from lib/pr-gh.js by scripts/sync-github-lib.sh. Do not edit here.
// Every call here only reads, with two exceptions you start yourself: `comment`, when you send a
// comment on a diff line, and `merge`, when the `merge` prop is set and you press the button twice.
// `exec` is the app's: (command, args, options) => Promise<{code, stdout, stderr}>.
import { parsePrUrl } from './github.js';
import { ghAccounts } from './gh-account.js';
export { parsePrUrl };

export const MERGE_METHODS = ['squash', 'merge', 'rebase'];

// `gh run view --log-failed` prefixes every line with job, step and timestamp.
export function cleanRunLog(log) {
  return String(log)
    .split('\n')
    .map((line) => line.replace(/^[^\t]*\t[^\t]*\t﻿?\d{4}-\d{2}-\d{2}T[\d:.]+Z ?/, ''))
    .filter((line) => !/^##\[(group|endgroup)\]/.test(line))
    .map((line) => line.replace(/^##\[[a-z]+\]/, ''))
    .join('\n');
}

export function runIdFromUrl(url) {
  const m = /\/actions\/runs\/(\d+)/.exec(url ?? '');
  return m ? m[1] : null;
}

// The search words of one list view: a repo's PRs in one state, by any of `logins` (none: everyone).
export function viewQuery(repo, state = 'open', logins = null) {
  return [`repo:${repo}`, 'is:pr', state === 'merged' ? 'is:merged' : 'is:open', ...(logins ?? []).map((l) => `author:${l}`)].join(' ');
}

// The fields of one PR a list row shows (spec 019); the full read adds body, files and thread comments (spec 022).
const ROW_FIELDS = `number title url state isDraft headRefName headRefOid baseRefName reviewDecision mergeable mergeStateStatus additions deletions changedFiles createdAt mergedAt closedAt updatedAt
  author{login} mergeCommit{oid}
  latestReviews(first:20){nodes{author{login} state submittedAt}}
  closingIssuesReferences(first:10){nodes{number title state stateReason url repository{nameWithOwner}}}`;
const checks = (n) => `commits(last:1){nodes{commit{committedDate statusCheckRollup{contexts(first:${n}){nodes{__typename ... on CheckRun{name status conclusion startedAt completedAt detailsUrl} ... on StatusContext{context state targetUrl}}}}}}}`;

// One list page with what a row shows, so a page draws from one call (spec 019).
const PAGE_QUERY = `query($q:String!,$first:Int!,$after:String){search(query:$q,type:ISSUE,first:$first,after:$after){issueCount pageInfo{endCursor hasNextPage} nodes{... on PullRequest{
  ${ROW_FIELDS}
  ${checks(50)}
  reviewThreads(first:100){nodes{isResolved isOutdated}}
}}}}`;

// Everything the detail view and the inbox use of one PR (what `gh pr view --json` gave before, spec 022).
const FULL_FIELDS = `${ROW_FIELDS}
  body files(first:100){nodes{path additions deletions changeType}}
  ${checks(100)}
  reviewThreads(first:100){nodes{isResolved isOutdated path line diffSide comments(first:20){nodes{author{login} body}}}}`;

const READ_CHUNK = 10; // PRs per read request
const LOOKUP_CHUNK = 20; // branches per lookup request
const chunks = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

function pageNode(n) {
  const commit = n.commits?.nodes?.[0]?.commit;
  const { commits, latestReviews, reviewThreads, closingIssuesReferences, files, ...pr } = n;
  return {
    url: n.url,
    pr: { ...pr, body: pr.body ?? '', latestReviews: latestReviews?.nodes ?? [], statusCheckRollup: commit?.statusCheckRollup?.contexts?.nodes ?? [], ...(files ? { files: files.nodes ?? [] } : {}) },
    threads: reviewThreads?.nodes ?? [],
    issues: closingIssuesReferences?.nodes ?? [],
    headCommittedAt: commit?.committedDate ?? null,
  };
}

// Each command runs as the gh account of the repo it names (gh-account.js); the rest as the active one.
export function createGh(exec) {
  const accounts = ghAccounts(exec);
  const run = async (args) => {
    const r = await accounts.run(args);
    if (r.code !== 0) throw new Error(String(r.stderr).trim() || `gh ${args[0]} failed`);
    return String(r.stdout);
  };
  const json = async (args) => JSON.parse(await run(args));
  // A GraphQL query as `repo`'s account. Strings go as -f, numbers as -F: values never enter the query text.
  // gh exits 1 when the answer has errors, yet still prints it: a combined query is read per alias (spec 022).
  const graphql = async (repo, query, vars) => {
    const args = ['api', 'graphql', '-f', `query=${query}`];
    for (const [k, v] of Object.entries(vars)) if (v != null) args.push(typeof v === 'number' ? '-F' : '-f', `${k}=${v}`);
    const r = await accounts.gh(repo, args);
    let body = null;
    try { body = JSON.parse(String(r.stdout)); } catch { /* not JSON: a gh or network failure */ }
    if (!body?.data) throw new Error(body?.errors?.[0]?.message || String(r.stderr).trim() || 'gh api graphql failed');
    const errors = new Map();
    for (const e of body.errors ?? []) errors.set(String(e.path?.[e.path.length - 1] ?? ''), e.message);
    return { data: body.data, errors };
  };
  const ownerName = (repo) => { const [owner, name] = repo.split('/'); return { owner, name }; };
  return {
    // The PR of each agent branch of one repo, in one query per 20 branches: its open PR, or else the newest
    // merged one if merged after `since` (ms). Open and merged are asked apart, so merged PRs from the same
    // branch name never push the open one out. { found: Map branch -> url, failed: Map branch -> error }:
    // a branch with no PR is in neither; a failed query fails only its own chunk, an alias error only its branch.
    discoverMany: async (repo, branches, since) => {
      const found = new Map(), failed = new Map();
      for (const part of chunks([...new Set(branches)], LOOKUP_CHUNK)) {
        const decl = part.map((_, i) => `,$b${i}:String!`).join('');
        const body = part.map((_, i) => `o${i}:pullRequests(headRefName:$b${i},states:[OPEN],first:1){nodes{url}} `
          + `m${i}:pullRequests(headRefName:$b${i},states:[MERGED],first:5,orderBy:{field:UPDATED_AT,direction:DESC}){nodes{url mergedAt}}`).join(' ');
        const vars = { ...ownerName(repo), ...Object.fromEntries(part.map((b, i) => [`b${i}`, b])) };
        let answer;
        try { answer = await graphql(repo, `query($owner:String!,$name:String!${decl}){repository(owner:$owner,name:$name){${body}}}`, vars); }
        catch (error) { for (const b of part) failed.set(b, error.message); continue; }
        const { data, errors } = answer;
        part.forEach((branch, i) => {
          const r = data.repository, error = errors.get(`o${i}`) ?? errors.get(`m${i}`) ?? (r ? null : errors.get('repository') ?? `cannot read ${repo}`);
          if (error) { failed.set(branch, error); return; }
          const open = r[`o${i}`]?.nodes?.[0];
          const merged = (r[`m${i}`]?.nodes ?? []).sort((x, y) => Date.parse(y.mergedAt) - Date.parse(x.mergedAt))[0];
          const url = open?.url ?? (merged && Date.parse(merged.mergedAt) > since ? merged.url : null);
          if (url) found.set(branch, url);
        });
      }
      return { found, failed };
    },
    // Your PRs in one state ('open' or 'merged'), newest first.
    // Asked of every logged-in account, so a personal repo's PRs count as yours too.
    mine: async (state = 'open', limit = 20) => {
      const args = ['search', 'prs', '--author', '@me', state === 'merged' ? '--merged' : '--state=open', '--sort', 'updated', '--limit', String(limit), '--json', 'url'];
      const { logins } = await accounts.accounts();
      const lists = await Promise.all((logins.length ? logins : [null]).map(async (login) => {
        const r = await accounts.as(login, args).catch(() => null);
        return r?.code === 0 ? JSON.parse(String(r.stdout)).map((p) => p.url) : null;
      }));
      if (lists.every((l) => l === null)) throw new Error('gh search failed');
      return [...new Set(lists.flat().filter(Boolean))];
    },
    // Any author's PRs of one repo in one state.
    listRepo: async (repo, state = 'open', limit = 20) => (await json(['pr', 'list', '-R', repo, '--state', state, '--limit', String(limit), '--json', 'url'])).map((p) => p.url),
    // How many open and merged PRs one repo has, by any of `logins` (null: everyone), in one query
    // (spec 022; was a REST search per state). Repeated author: qualifiers are OR'd.
    counts: async (repo, logins = null) => {
      const q = 'search(query:$q,type:ISSUE,first:0){issueCount}';
      const { data } = await graphql(repo, `query($qo:String!,$qm:String!){o:${q.replace('$q', '$qo')} m:${q.replace('$q', '$qm')}}`,
        { qo: viewQuery(repo, 'open', logins), qm: viewQuery(repo, 'merged', logins) });
      return { open: data.o?.issueCount ?? 0, merged: data.m?.issueCount ?? 0 };
    },
    // One page of the same view, newest activity first, by cursor: { total, cursor, next, prs }.
    // Each of prs is { url, pr, threads, issues, headCommittedAt }; pr has readPrs' shape minus files and body.
    page: async (repo, state = 'open', logins = null, after = null, first = 20) => {
      const { data, errors } = await graphql(repo, PAGE_QUERY, { q: `${viewQuery(repo, state, logins)} sort:updated-desc`, first, after });
      const s = data.search;
      if (!s) throw new Error(errors.get('search') ?? 'gh search failed');
      return { total: s.issueCount, cursor: s.pageInfo.endCursor, next: s.pageInfo.hasNextPage, prs: (s.nodes ?? []).filter((n) => n?.url).map(pageNode) };
    },
    // Every logged-in account's GitHub login (what a PR's author shows; may differ from gh's own name for it).
    me: async () => {
      const { logins } = await accounts.accounts();
      const names = await Promise.all((logins.length ? logins : [null]).map(async (login) => {
        const r = await accounts.as(login, ['api', 'user', '-q', '.login']);
        return r.code === 0 ? String(r.stdout).trim() : null;
      }));
      return names.filter(Boolean);
    },
    // Full data of PRs of one repo, 10 per query: Map number -> { url, pr, threads, issues, headCommittedAt }
    // or { error }. A PR the answer could not give gets its own error; a failed query fails its chunk.
    readPrs: async (repo, numbers) => {
      const out = new Map();
      for (const part of chunks([...new Set(numbers)], READ_CHUNK)) {
        const decl = part.map((_, i) => `,$n${i}:Int!`).join('');
        const body = part.map((_, i) => `p${i}:pullRequest(number:$n${i}){${FULL_FIELDS}}`).join(' ');
        const vars = { ...ownerName(repo), ...Object.fromEntries(part.map((n, i) => [`n${i}`, Number(n)])) };
        try {
          const { data, errors } = await graphql(repo, `query($owner:String!,$name:String!${decl}){repository(owner:$owner,name:$name){${body}}}`, vars);
          part.forEach((n, i) => {
            const node = data.repository?.[`p${i}`];
            out.set(Number(n), node ? pageNode(node) : { error: errors.get(`p${i}`) ?? errors.get('repository') ?? `cannot read ${repo}#${n}` });
          });
        } catch (error) {
          for (const n of part) out.set(Number(n), { error: error.message });
        }
      }
      return out;
    },
    fetchRuns: async (repo, sha) => (await json(['api', `repos/${repo}/actions/runs?head_sha=${sha}&per_page=50`])).workflow_runs.map((r) => ({
      id: r.id, name: r.name ?? r.display_title ?? 'workflow', status: r.status, conclusion: r.conclusion, url: r.html_url, updatedAt: r.updated_at,
    })),
    fetchJobs: async (repo, runId) => (await json(['api', `repos/${repo}/actions/runs/${runId}/jobs?per_page=50`])).jobs.map((j) => ({
      id: j.id, name: j.name, status: j.status, conclusion: j.conclusion, steps: (j.steps ?? []).map((x) => ({ number: x.number, name: x.name, status: x.status, conclusion: x.conclusion })),
    })),
    fetchIssue: (url) => json(['issue', 'view', url, '--json', 'number,title,state,stateReason,body,author,labels,comments,url,createdAt']),
    fetchDiff: (url) => run(['pr', 'diff', url, '--color', 'never']),
    fetchHead: async (url) => (await json(['pr', 'view', url, '--json', 'headRefOid'])).headRefOid,
    // A review comment on one line of the diff. -f keeps the text literal.
    comment: async (url, { commitId, path, line, side, body }) => {
      const p = parsePrUrl(url);
      await run(['api', '-X', 'POST', `repos/${p.repo}/pulls/${p.number}/comments`, '-f', `body=${body}`, '-f', `commit_id=${commitId}`, '-f', `path=${path}`, '-F', `line=${line}`, '-f', `side=${side}`]);
    },
    failedLog: async (repo, runId) => cleanRunLog(await run(['run', 'view', runId, '-R', repo, '--log-failed'])),
    // Merges exactly the commit that was shown: if something was pushed since, gh refuses.
    merge: async (url, method, headSha) => {
      if (!MERGE_METHODS.includes(method)) throw new Error(`unknown merge method: ${method}`);
      await run(['pr', 'merge', url, `--${method}`, '--match-head-commit', headSha]);
    },
    authOk: async () => (await exec('gh', ['auth', 'status'])).code === 0,
  };
}

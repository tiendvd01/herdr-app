// GENERATED from lib/pr-gh.js by scripts/sync-github-lib.sh. Do not edit here.
// Every call here only reads, with two exceptions you start yourself: `comment`, when you send a
// comment on a diff line, and `merge`, when the `merge` prop is set and you press the button twice.
// `exec` is the app's: (command, args, options) => Promise<{code, stdout, stderr}>.
const PR_FIELDS = [
  'number', 'title', 'body', 'url', 'state', 'isDraft', 'headRefName', 'headRefOid', 'baseRefName',
  'statusCheckRollup', 'reviewDecision', 'latestReviews', 'mergeStateStatus', 'mergeable',
  'author', 'additions', 'deletions', 'changedFiles', 'files', 'createdAt', 'mergedAt', 'closedAt', 'updatedAt', 'mergeCommit',
].join(',');

const THREADS_QUERY = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){
  reviewThreads(first:100){nodes{isResolved isOutdated path line diffSide comments(first:20){nodes{author{login} body}}}}
  commits(last:1){nodes{commit{committedDate}}}
  closingIssuesReferences(first:10){nodes{number title state stateReason url repository{nameWithOwner}}}
}}}`;

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

// Each command runs as the gh account of the repo it names (gh-account.js); the rest as the active one.
export function createGh(exec) {
  const accounts = ghAccounts(exec);
  const run = async (args) => {
    const r = await accounts.run(args);
    if (r.code !== 0) throw new Error(String(r.stderr).trim() || `gh ${args[0]} failed`);
    return String(r.stdout);
  };
  const json = async (args) => JSON.parse(await run(args));
  return {
    // Open PRs only: an agent sitting on `main` would otherwise pick up an old merged PR.
    discover: async (repo, branch) => (await json(['pr', 'list', '-R', repo, '--head', branch, '--state', 'open', '--limit', '1', '--json', 'url']))[0]?.url ?? null,
    // The newest PR merged from this branch, only if merged after `since` (ms).
    discoverMerged: async (repo, branch, since) => {
      const p = (await json(['pr', 'list', '-R', repo, '--head', branch, '--state', 'merged', '--limit', '1', '--json', 'url,mergedAt']))[0];
      return p && Date.parse(p.mergedAt) > since ? p.url : null;
    },
    // Your PRs in one state ('open' or 'merged'), newest first.
    // Asked of every logged-in account, so a personal repo's PRs count as yours too.
    mine: async (state = 'open') => {
      const args = ['search', 'prs', '--author', '@me', state === 'merged' ? '--merged' : '--state=open', '--sort', 'updated', '--limit', state === 'merged' ? '20' : '100', '--json', 'url'];
      const { logins } = await accounts.accounts();
      const lists = await Promise.all((logins.length ? logins : [null]).map(async (login) => {
        const r = await accounts.as(login, args).catch(() => null);
        return r?.code === 0 ? JSON.parse(String(r.stdout)).map((p) => p.url) : null;
      }));
      if (lists.every((l) => l === null)) throw new Error('gh search failed');
      return [...new Set(lists.flat().filter(Boolean))];
    },
    // Any author's PRs of one repo in one state.
    listRepo: async (repo, state = 'open') => (await json(['pr', 'list', '-R', repo, '--state', state, '--limit', '30', '--json', 'url'])).map((p) => p.url),
    // Every logged-in account's GitHub login (what a PR's author shows; may differ from gh's own name for it).
    me: async () => {
      const { logins } = await accounts.accounts();
      const names = await Promise.all((logins.length ? logins : [null]).map(async (login) => {
        const r = await accounts.as(login, ['api', 'user', '-q', '.login']);
        return r.code === 0 ? String(r.stdout).trim() : null;
      }));
      return names.filter(Boolean);
    },
    fetchPr: (url) => json(['pr', 'view', url, '--json', PR_FIELDS]),
    fetchThreads: async (url) => {
      const p = parsePrUrl(url);
      const data = await json(['api', 'graphql', '-f', `query=${THREADS_QUERY}`, '-F', `owner=${p.owner}`, '-F', `name=${p.name}`, '-F', `number=${p.number}`]);
      const pull = data.data.repository.pullRequest;
      return { threads: pull.reviewThreads.nodes, issues: pull.closingIssuesReferences?.nodes ?? [], headCommittedAt: pull.commits.nodes[0]?.commit.committedDate ?? null };
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

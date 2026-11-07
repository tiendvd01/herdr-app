const STRINGS = {
  en: {
    title: 'Pull requests', back: 'List', agent_go: 'Go', progress: 'Progress', comments_open: (n) => `Open comments ${n}`,
    files: (n) => `Changed files ${n}`, description: 'Description', failed_log: (name) => `Failed log · ${name}`, loading: 'Loading…',
    pr_opened: 'PR opened', draft: 'Draft', closed: 'Closed', merged: 'Merged', merge: 'Merge', review: 'Review', ready: 'Ready to merge', conflict: 'Merge conflict',
    behind: 'Behind base', blocked: 'Blocked by rules',
    ci: 'CI', ci_passed: 'CI passed', ci_failed: 'CI failed', ci_running: 'CI running', ci_none: 'No CI',
    r_approved: 'Approved', r_changes: 'Changes requested', r_ai: 'AI reviewing', r_wait: 'Waiting for review', r_reviewed: 'Reviewed', r_none: 'No review',
    n_checks: (n) => `${n} checks`, n_of: (done, total) => `${done} of ${total} finished`, failed_names: (total, names) => `${names} failed (of ${total})`,
    a_working: 'working', a_idle: 'idle', a_done: 'finished', a_blocked: 'needs input', a_unknown: 'unknown',
    empty_title: 'No pull requests yet', empty_body: 'No pull requests match this filter.',
    gh_title: 'GitHub CLI is not ready', gh_body: 'Run gh auth login in a terminal, then refresh.',
    no_diff: 'No text changes.', diff_failed: 'Could not load the changes. Open the PR on GitHub.', log_failed: 'Could not load the log. Open it on GitHub.', open_github: 'Open on GitHub', log_more: 'Full log',
    flow_done: (n) => `${n} runs after merge finished`, flow_failed: (name) => `${name} failed`, flow_more: (n) => `+${n} more`, flow_checking: 'Checking for runs…', flow_waiting: 'waiting for approval', flow_queued: 'queued', flow_cancelled: 'cancelled', flow_failed_note: 'failed', run_log: 'Show log', merged_to: (base) => `Merged → ${base}`,
    checks: (n) => `Checks ${n}`, issues: (n) => `Linked issues ${n}`, issues_none: 'No linked issues', issue_none: 'No issue', issue_one: (n) => `Issue #${n}`, issue_many: (n) => `${n} issues`, issue_open: 'Open', issue_closed: 'Closed', issue_not_planned: 'Not planned', issue_comments: (n) => `Comments ${n}`, issue_failed: 'Could not load this issue. Open it on GitHub.',
    f_open: 'Open', f_merged: 'Merged', f_mine: 'Mine', f_all: 'Everyone', org_all: 'All', repo_all: 'All repos',
    comment_hint: 'Click a line to comment', comment_on: (where) => `Comment on ${where}`, comment_placeholder: 'Leave feedback', comment_send: 'Send', comment_sending: 'Sending…', comment_cancel: 'Cancel',
    merge_do: (m) => `Merge (${m})`, merge_confirm: 'Press again to merge', merging: 'Merging…',
    settings: 'Settings', language: 'Language', lang_auto: 'Follow system', just_now: 'just now', ago: (n, u) => `${n}${{ m: 'm', h: 'h', d: 'd' }[u]} ago`, close: 'Close',
  },
};

export function translator(lang) {
  const table = STRINGS[lang] ?? STRINGS.en;
  return (key, ...args) => {
    const value = table[key] ?? STRINGS.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  };
}

// The choice saved in settings wins; "auto" or nothing saved follows the system.
export function effectiveLang(choice, system) {
  return 'en';
}

export function relative(ms, t) {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return t('just_now');
  if (m < 60) return t('ago', m, 'm');
  if (m < 1440) return t('ago', Math.floor(m / 60), 'h');
  return t('ago', Math.floor(m / 1440), 'd');
}

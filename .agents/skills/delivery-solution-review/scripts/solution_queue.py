#!/usr/bin/env python3
"""Solution queue for the person who reviews Solutions (skill delivery-solution-review). Read-only.

Two lists, both over open User Stories (board field Kind = Story):

  pending   A Solution was posted, edited or announced as updated after the reviewer's last
            comment on that story (or the reviewer never commented). Oldest first. Stories already
            past development (Ready for QA onwards) are left out unless `--all`: their review is the PR's.
  missing   A story that is being worked on (current sprint, or status Todo / In Progress) with no
            Solution comment yet. `--all` adds Backlog stories.

A comment counts as Solution activity when it is not the reviewer's and it carries a solution marker
(`<!-- <prefix>:solution ... -->`), a heading that starts with "Solution", or "Solution" in its first line
("em gửi Solution cho #708", "em đã cập nhật Solution theo review"). The `touches` column is a
keyword hint for the four areas that need the PO's review (infrastructure, architecture, data model,
permissions) — a hint to read the Solution, not a verdict.

Usage:
  solution_queue.py [pending|missing|all] [--reviewer LOGIN] [--project "Yahagi 168"] [--all] [--json]

The reviewer defaults to the logged-in gh user. Owner and board number come from the team profile
(sora-profile/profile.env); SORA_GH_OWNER / SORA_GH_PROJECT override them.
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys

CLOSED = {'Done', 'Canceled'}
DEV_DONE = {'Ready for QA', 'QA Testing', 'Ready for Release'}
ACTIVE = {'Todo', 'In Progress', 'In Review', 'Changes Requested'}
BATCH = 15

MARKER = re.compile(r'<!--\s*[\w-]*:?solution\b', re.I)
HEADING = re.compile(r'^\s{0,3}#{1,4}\s+[^\w\s]*\s*solution\b', re.I | re.M)  # '## 💡 Solution — …', not '### … the solution must …'
WORD = re.compile(r'\bsolution\b', re.I)
TOUCHES = {
    'hạ tầng': re.compile(r'\b(terraform|fargate|ecs|eventbridge|sqs|lambda|cloudfront|valkey|iam|s3 bucket)\b', re.I),
    'dữ liệu': re.compile(r'\b(migration|alembic|new (table|column)|add column)\b|bảng mới|cột mới|thêm (bảng|cột)', re.I),
    'quyền': re.compile(r'\b(rbac|permission|accesscontext|require_[a-z_]+)\b|phân quyền', re.I),
    'kiến trúc': re.compile(r'\b(adr|new module|new context|cross-context)\b|module mới|context mới|pattern mới', re.I),
}


def gh(args):
    r = subprocess.run(['gh', *args], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'failed: gh {" ".join(args[:3])} …\n{r.stderr.strip()}')
    return json.loads(r.stdout)


def read_profile():
    path = os.path.join(os.environ.get('DELIVERY_PROFILE_DIR', os.path.expanduser('~/.config/herdr-app/skills/sora-profile')),
                        'profile.env')
    prof = {}
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                m = re.match(r'\s*([A-Z_]+)="?([^"#\n]*)"?', line)
                if m:
                    prof[m.group(1)] = m.group(2).strip()
    except FileNotFoundError:
        sys.exit(f'Thiếu hồ sơ team: {path}')
    return (os.environ.get('SORA_GH_OWNER') or prof.get('GH_OWNER'),
            os.environ.get('SORA_GH_PROJECT') or prof.get('GH_PROJECT'))


def ts(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')) if s else None


def in_current_sprint(item, today):
    sp = item.get('sprint')
    if not isinstance(sp, dict) or not sp.get('startDate'):
        return False
    start = datetime.date.fromisoformat(sp['startDate'])
    return start <= today < start + datetime.timedelta(days=int(sp.get('duration') or 0))


def stories(owner, number, project):
    items = gh(['project', 'item-list', str(number), '--owner', owner, '--format', 'json', '--limit', '1000'])['items']
    out = []
    for i in items:
        c = i.get('content') or {}
        if c.get('type') != 'Issue' or i.get('kind') != 'Story' or i.get('status') in CLOSED:
            continue
        if project and i.get('project') != project:
            continue
        out.append(i)
    return out


def fetch_threads(items):
    """Issue state, assignees, sub-issue count and the last 100 comments, batched with aliases."""
    threads = {}
    for k in range(0, len(items), BATCH):
        chunk = items[k:k + BATCH]
        parts = []
        for j, it in enumerate(chunk):
            owner, repo = it['content']['repository'].split('/')
            parts.append(
                f'i{j}: repository(owner:"{owner}",name:"{repo}"){{issue(number:{it["content"]["number"]}){{'
                'state createdAt url assignees(first:5){nodes{login}} subIssues{totalCount} '
                'comments(last:100){nodes{author{login} createdAt lastEditedAt url body}}}}')
        data = gh(['api', 'graphql', '-f', 'query={' + ' '.join(parts) + '}'])['data']
        for j, it in enumerate(chunk):
            threads[it['id']] = (data.get(f'i{j}') or {}).get('issue')
    return threads


def is_solution(body):
    first = next((ln for ln in body.splitlines() if ln.strip()), '')
    return bool(MARKER.search(body) or HEADING.search(body) or WORD.search(first))


def touches(body):
    return [name for name, rx in TOUCHES.items() if rx.search(body)]


def analyse(item, issue, reviewer):
    comments = issue['comments']['nodes']
    sol = [c for c in comments
           if (c.get('author') or {}).get('login') not in (reviewer, None) and is_solution(c.get('body') or '')]
    review_times = [ts(c['createdAt']) for c in comments if (c.get('author') or {}).get('login') == reviewer]
    last_review = max(review_times) if review_times else None
    row = {
        'issue': f'{item["content"]["repository"].split("/")[1]}#{item["content"]["number"]}',
        'url': issue['url'],
        'title': item['content'].get('title', ''),
        'status': item.get('status') or '',
        'sprint': (item.get('sprint') or {}).get('title', '') if isinstance(item.get('sprint'), dict) else '',
        'assignees': [a['login'] for a in issue['assignees']['nodes']],
        'sub_issues': issue['subIssues']['totalCount'],
        'last_review': last_review.isoformat() if last_review else None,
    }
    if not sol:
        row['solution'] = None
        return row
    def activity(c):
        return max(t for t in (ts(c['createdAt']), ts(c.get('lastEditedAt'))) if t)
    latest = max(sol, key=activity)
    row['solution'] = {
        'first_url': sol[0]['url'],
        'latest_url': latest['url'],
        'latest_by': latest['author']['login'],
        'latest_at': activity(latest).isoformat(),
        'touches': sorted({t for c in sol for t in touches(c.get('body') or '')}),
    }
    row['pending'] = last_review is None or activity(latest) > last_review
    return row


def age_days(iso, now):
    return (now - ts(iso)).days if iso else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('mode', nargs='?', default='all', choices=['pending', 'missing', 'all'])
    ap.add_argument('--reviewer', help='login của người review (mặc định: user gh đang đăng nhập)')
    ap.add_argument('--project', help='giá trị field Project, ví dụ "Yahagi 168"')
    ap.add_argument('--all', action='store_true',
                    help='missing: tính cả US ở Backlog; pending: tính cả US đã qua dev (Ready for QA trở đi)')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()

    owner, number = read_profile()
    reviewer = a.reviewer or gh(['api', 'user'])['login']
    now = datetime.datetime.now(datetime.timezone.utc)
    today = now.date()

    items = stories(owner, number, a.project)
    threads = fetch_threads(items)
    rows, by_id = [], {}
    for it in items:
        issue = threads.get(it['id'])
        if not issue or issue['state'] != 'OPEN':
            continue
        r = analyse(it, issue, reviewer)
        r['in_sprint'] = in_current_sprint(it, today)
        rows.append(r)
        by_id[r['issue']] = r

    pending = sorted((r for r in rows if r.get('solution') and r.get('pending')
                      and (a.all or r['status'] not in DEV_DONE)),
                     key=lambda r: r['solution']['latest_at'])
    missing = [r for r in rows if not r.get('solution')
               and (a.all or r['in_sprint'] or r['status'] in ACTIVE)]

    if a.json:
        out = {'reviewer': reviewer, 'generated_at': now.isoformat()}
        if a.mode in ('pending', 'all'):
            out['pending'] = pending
        if a.mode in ('missing', 'all'):
            out['missing'] = missing
        json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
        print()
        return

    if a.mode in ('pending', 'all'):
        print(f'SOLUTION CHỜ REVIEW — người review: {reviewer} ({len(pending)})')
        for r in pending:
            s = r['solution']
            hint = ', '.join(s['touches']) or '—'
            seen = 'chưa review lần nào' if not r['last_review'] else f'review gần nhất {r["last_review"][:10]}'
            print(f'  {r["issue"]:<24} {age_days(s["latest_at"], now):>2} ngày · {s["latest_by"]:<18} '
                  f'· đụng: {hint:<26} · {seen}')
            print(f'    {r["title"][:90]}')
            print(f'    {s["latest_url"]}')
        if a.mode == 'all':
            print()
    if a.mode in ('missing', 'all'):
        scope = 'mọi US còn mở' if a.all else 'US trong sprint hiện tại hoặc đang Todo / In Progress'
        print(f'US CHƯA CÓ SOLUTION — {scope} ({len(missing)})')
        for r in missing:
            who = ','.join(r['assignees']) or '(chưa gán)'
            sp = 'sprint này' if r['in_sprint'] else (r['sprint'] or 'chưa gắn sprint')
            print(f'  {r["issue"]:<24} {r["status"]:<12} · {who:<20} · {sp:<16} · {r["sub_issues"]} task con')
            print(f'    {r["title"][:90]}')


if __name__ == '__main__':
    main()

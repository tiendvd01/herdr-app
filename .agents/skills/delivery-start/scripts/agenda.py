#!/usr/bin/env python3
"""Agenda for the start of a delivery session (skill delivery-start). Read-only.

Gathers, in parallel, everything that is waiting on the person running it:

  clarifications  Clarification issues past or near their Deadline (board field), plus open ones with none
  tags            issues where someone tagged the user after the user's last comment (sora-mention-inbox)
  solutions       Solutions waiting for review, and stories being worked on with no Solution yet
  spec            canon spec versions newer than the pinned copy in the dev repo (delivery-spec-sync)
  load            people over the load threshold (delivery-backlog load.py estimates; needs capacity.json)

A source that fails is reported as such; the others still print. Nothing is written anywhere.

Usage:
  agenda.py [--project 168] [--drafts <SoraVaults/<dự án>>] [--soon 2] [--json]

--project takes a code from sora-profile/scripts/projects.sh (168, 147, 167, lunchbox): it filters the
board, the tags and the spec check to that project. Without it every project is listed and the spec and
load checks are skipped.
"""
import argparse
import concurrent.futures as cf
import datetime
import glob
import json
import os
import re
import subprocess
import sys

SKILLS = os.path.expanduser('~/.config/herdr-app/skills')
PROFILE = os.environ.get('DELIVERY_PROFILE_DIR') or os.path.join(SKILLS, 'sora-profile')
REPORT = os.path.join(SKILLS, 'delivery-report/scripts/report.sh')
INBOX = os.path.join(SKILLS, 'sora-mention-inbox/scripts/mention_inbox.py')
QUEUE = os.path.join(SKILLS, 'delivery-solution-review/scripts/solution_queue.py')
SPEC = os.path.join(SKILLS, 'delivery-spec-sync/scripts/spec-sync.sh')
LOAD = os.path.join(SKILLS, 'delivery-backlog/scripts/load.py')
CLOSED = {'Done', 'Canceled'}
TIMEOUT = 300


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip().splitlines()[-1] if (r.stderr or r.stdout).strip()
                           else f'exit {r.returncode}')
    return r.stdout


def project_conf(code):
    """BOARD_PROJECT and TAG_REPOS for a project code, read through projects.sh itself."""
    script = ('. "$1/profile.env"; . "$1/scripts/projects.sh"; '
              'profile_project "$2" || exit 3; printf "%s\\n%s\\n" "$BOARD_PROJECT" "$TAG_REPOS"')
    r = subprocess.run(['bash', '-c', script, '_', PROFILE, code], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'Dự án "{code}" chưa có trong sora-profile/scripts/projects.sh')
    board, repos = (r.stdout.split('\n') + ['', ''])[:2]
    return board, set(repos.split())


def src_clarifications(board_project, today, soon):
    items = json.loads(run(['bash', REPORT, 'raw']))
    out = []
    for i in items:
        if i.get('kind') != 'Clarification' or i.get('status') in CLOSED or i.get('state') != 'OPEN':
            continue
        if board_project and i.get('project') != board_project:
            continue
        d = i.get('deadline')
        days = (datetime.date.fromisoformat(d) - today).days if d else None
        if days is not None and days > soon:
            continue
        out.append({'issue': f'{i["repo"]}#{i["number"]}', 'url': i['url'], 'title': i['title'],
                    'deadline': d, 'days_left': days, 'status': i.get('status'),
                    'waiting_on': i.get('waitingOn'), 'assignees': i.get('assignees') or []})
    return sorted(out, key=lambda r: (r['days_left'] is None, r['days_left'] if r['days_left'] is not None else 0))


def src_tags(repos):
    rows = json.loads(run([sys.executable, '-I', INBOX, '--json']))
    rows = [r for r in rows if r.get('source') == 'github' and (not repos or r.get('repo') in repos)]
    return sorted(rows, key=lambda r: r.get('tagged_at') or '')


def src_solutions(board_project):
    cmd = [sys.executable, QUEUE, 'all', '--json']
    if board_project:
        cmd += ['--project', board_project]
    return json.loads(run(cmd))


def spec_label(name):
    if '要件' in name:
        return 'danh mục yêu cầu'
    if '仕様' in name:
        return 'đặc tả chức năng'
    return name


def src_spec(code):
    text = run(['bash', SPEC, code, 'status'])
    section, pinned, canon = None, {}, {}
    for line in text.splitlines():
        if line.startswith('### '):
            section = 'pinned' if 'GHIM' in line else 'canon' if 'Canon' in line else None
            continue
        m = re.match(r'\s+(\S+\.md)\s+\*\*版数\*\*:\s*([\d.]+)', line)
        if m and section:
            (pinned if section == 'pinned' else canon)[m.group(1)] = m.group(2)
    head = re.search(r'HEAD (\w+)\s+(\S+)', text)
    behind = [{'file': f, 'label': spec_label(f), 'pinned': pinned[f], 'canon': v}
              for f, v in canon.items() if f in pinned and pinned[f] != v]
    return {'behind': behind, 'canon_head': head.group(1) if head else None,
            'canon_head_at': head.group(2) if head else None}


def current_sprint():
    m = re.search(r'sprint hiện tại:\s*(.+)', run(['bash', REPORT, 'sprints']))
    return m.group(1).strip() if m else None


def src_load(drafts):
    sprint = current_sprint()
    caps = []
    for path in glob.glob(os.path.join(drafts, '*', '_plan', 'capacity.json')):
        try:
            with open(path, encoding='utf-8') as f:
                caps.append((json.load(f).get('sprint'), path))
        except (OSError, json.JSONDecodeError) as e:
            raise RuntimeError(f'{path}: {e}') from e
    match = [p for s, p in caps if s == sprint]
    if not match:
        return {'sprint': sprint, 'capacity': None, 'over': []}
    text = run([sys.executable, LOAD, 'estimates', '--capacity', match[0]])
    over = [ln.split('|')[1].strip() + ' — ' + ln.split('|')[-2].strip()
            for ln in text.splitlines() if ln.startswith('|') and re.search(r'QUÁ TẢI|vượt ngưỡng', ln)]
    return {'sprint': sprint, 'capacity': match[0], 'over': over}


def gather(a, today):
    board_project, repos = project_conf(a.project) if a.project else (None, set())
    jobs = {
        'clarifications': lambda: src_clarifications(board_project, today, a.soon),
        'tags': lambda: src_tags(repos),
        'solutions': lambda: src_solutions(board_project),
    }
    if a.project:
        jobs['spec'] = lambda: src_spec(a.project)
        jobs['load'] = lambda: src_load(a.drafts)
    out = {'project': board_project, 'today': today.isoformat(), 'errors': {}}
    with cf.ThreadPoolExecutor(max_workers=len(jobs)) as ex:
        futs = {ex.submit(fn): name for name, fn in jobs.items()}
        for fut in cf.as_completed(futs):
            name = futs[fut]
            try:
                out[name] = fut.result()
            except (RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError, OSError) as e:
                out['errors'][name] = str(e)[:300]
    return out


def days_since(iso, now):
    return (now - datetime.datetime.fromisoformat(iso.replace('Z', '+00:00'))).days


def show(o, now, limit):
    title = f'AGENDA {o["today"]}' + (f' — {o["project"]}' if o['project'] else ' — mọi dự án')
    print(title)
    for name, err in o['errors'].items():
        print(f'  ⚠ không đọc được nguồn "{name}": {err}')

    c = o.get('clarifications')
    if c is not None:
        print(f'\n1. CLARIFICATION QUÁ / SẮP HẠN ({len(c)})')
        for r in c:
            when = ('chưa có hạn' if r['days_left'] is None else f'quá hạn {-r["days_left"]} ngày'
                    if r['days_left'] < 0 else 'hạn hôm nay' if r['days_left'] == 0 else f'còn {r["days_left"]} ngày')
            print(f'  {r["issue"]:<26} {when:<16} · {r["status"] or "-":<12} · {r["title"][:70]}')

    t = o.get('tags')
    in_queue = {r['issue'] for r in (o.get('solutions') or {}).get('pending', [])}
    if t is not None:
        print(f'\n2. TAG CHƯA TRẢ LỜI ({len(t)}) — cũ nhất trước')
        for r in t[:limit]:
            also = ' (cũng ở mục 3)' if f'{r["repo"]}#{r["number"]}' in in_queue else ''
            print(f'  {r["repo"]}#{r["number"]:<6} {days_since(r["tagged_at"], now):>3} ngày · @{r["tagged_by"]:<20} '
                  f'· {r["title"][:60]}{also}')
            print(f'    {r["tag_url"]}')
        if len(t) > limit:
            print(f'  … và {len(t) - limit} tag nữa (--limit để xem thêm)')

    s = o.get('solutions')
    if s is not None:
        p, m = s.get('pending', []), s.get('missing', [])
        print(f'\n3. SOLUTION CHỜ REVIEW ({len(p)})')
        for r in p:
            sol = r['solution']
            print(f'  {r["issue"]:<26} {days_since(sol["latest_at"], now):>2} ngày · {sol["latest_by"]:<18} '
                  f'· đụng: {", ".join(sol["touches"]) or "—"}')
            print(f'    {sol["latest_url"]}')
        print(f'\n4. US CHƯA CÓ SOLUTION ({len(m)})')
        for r in m:
            print(f'  {r["issue"]:<26} {r["status"]:<12} · {",".join(r["assignees"]) or "(chưa gán)":<20} '
                  f'· {r["title"][:60]}')

    sp = o.get('spec')
    if sp is not None:
        print(f'\n5. ĐẶC TẢ MỚI CHƯA GHIM ({len(sp["behind"])})')
        for r in sp['behind']:
            print(f'  {r["label"]}: bản ghim v{r["pinned"]} → canon v{r["canon"]}')
        if sp['behind']:
            print(f'  canon HEAD {sp["canon_head"]} ({(sp["canon_head_at"] or "")[:10]}) — đối chiếu bằng delivery-spec-sync')

    ld = o.get('load')
    if ld is not None:
        if not ld['capacity']:
            print(f'\n6. TẢI {ld["sprint"] or "sprint hiện tại"}: chưa có _plan/capacity.json cho sprint này '
                  '— lập ở delivery-backlog §B6 nếu cần đo')
        else:
            print(f'\n6. NGƯỜI VƯỢT NGƯỠNG TẢI {ld["sprint"]} ({len(ld["over"])})')
            for line in ld['over']:
                print(f'  {line}')


def default_drafts():
    """Thư mục dự án trong SoraVaults (vault-path.sh); lỗi thì về chỗ cũ .claude/issue-drafts."""
    import subprocess
    vp = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vault-path.sh')
    try:
        return subprocess.run(['bash', vp], capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return os.path.join(os.getcwd(), '.claude', 'issue-drafts')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', help='mã dự án trong projects.sh: 168, 147, 167, lunchbox')
    ap.add_argument('--drafts', default=default_drafts(),
                    help='thư mục dự án trong vault, chứa "sprint <N>"/_plan/capacity.json (luat-chung §6)')
    ap.add_argument('--soon', type=int, default=2, help='Clarification còn ≤ N ngày tới hạn thì hiện (mặc định 2)')
    ap.add_argument('--limit', type=int, default=15, help='số tag tối đa in ra (mặc định 15)')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    now = datetime.datetime.now(datetime.timezone.utc)
    o = gather(a, datetime.date.today())
    if a.json:
        json.dump(o, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        show(o, now, a.limit)


if __name__ == '__main__':
    main()

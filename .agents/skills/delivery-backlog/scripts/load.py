#!/usr/bin/env python3
"""Per-person sprint load from the "Sora Team" board (skill delivery-backlog, step B6).

Three modes:

  plan       BEFORE the developers estimate. Each story gets size points from its own content
             (number of ACs + a risk bump, see sizing.json); each person gets an effective capacity
             (days x allocation x speed factor). Shows each person's share of the points against their
             share of the capacity, and breaks of the risk rule (a junior holding a high-risk story in
             the "finished" basket with no senior reviewer).
  estimates  AFTER they estimate. Compares `Estimation days` of the work still to do with the capacity
             still left. No speed factor: a developer's own estimate already carries their speed.
  calibrate  AT THE END of a sprint. Measures each person's speed from finished work —
             points / `Actual days` — and blends it with the prior factor; the more finished items,
             the more the measurement weighs. Write the result back into capacity.json.

capacity.json (in the sprint drafts folder, e.g. _plan/capacity.json):
{
  "sprint": "Sprint 3", "working_days": 10, "threshold": 0.8, "project": "Yahagi 168",
  "speed": {"junior": 0.7, "middle": 1.0, "senior": 1.2},   # PRIOR — replaced by `calibrate`
  "speed_source": "prior (assumption, 2026-10-13)",
  "people": {
    "sora-huan": {"name": "Huấn", "level": "junior", "allocation": 1.0},
    "brian-malme": {"name": "Thắng", "level": "senior", "allocation": 1.0, "off_days": 5, "note": "…"},
    "quangmalme": {"name": "Quang", "level": "senior", "allocation": 0.7, "speed": 1.15}   # measured
  }
}
A person's own "speed" overrides the level default once it has been measured.

sizing.json (plan mode; PM-only, never posted):
{
  "points_by_ac": [[8, 1], [12, 2], [999, 3]],     # up to 8 ACs = 1, 9-12 = 2, 13+ = 3
  "risk_points": {"low": 0, "medium": 1, "high": 2},
  "started_share": 0.5,                          # a story only started this sprint counts half
  "review_share": 0.2,                           # a named reviewer carries 20 % of the story
  "items": {
    "706": {"risk": "high"},
    "711": {"risk": "medium", "started": true},
    "734": {"risk": "high", "reviewer": "quangmalme"},
    "479": {"points": 5, "risk": "high"},          # explicit points for an issue without ACs
    "735": {"risk": "high", "started": true, "assignee": "sora-huan"}   # what-if reassignment
  }
}
Size comes from the AC count of the issue body (`- **AC-n**` lines) unless "points" is given.
Only items listed in sizing.json are counted in plan mode; their assignee is the board's unless
overridden. Edit sizing.json to try a different split, then run plan again.

Usage:
  load.py plan       --capacity _plan/capacity.json --sizing _plan/sizing.json [--details]
  load.py estimates  --capacity _plan/capacity.json [--details]
  load.py calibrate  --capacity _plan/capacity.json --sizing _plan/sizing.json [--sprint "Sprint 3"]
"""
import argparse
import collections
import datetime
import json
import os
import re
import statistics
import subprocess
import sys

NOT_WORK = {'Epic', 'Commitment', 'Clarification'}
DEV_DONE = {'Ready for QA', 'QA Testing', 'Ready for Release', 'Done'}
WIP = {'In Progress', 'In Review', 'Changes Requested'}
PRIOR_WEIGHT = 5  # the prior counts as 5 finished items when blending with a measurement


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'failed: {" ".join(cmd)}\n{r.stderr}')
    return json.loads(r.stdout)


def board_items(owner, number, sprint):
    items = run(['gh', 'project', 'item-list', number, '--owner', owner, '--format', 'json', '--limit', '1000'])['items']
    return [i for i in items if isinstance(i.get('sprint'), dict) and i['sprint'].get('title') == sprint
            and (i.get('content') or {}).get('type') == 'Issue' and i.get('kind') not in NOT_WORK
            and i.get('status') != 'Canceled']


def issue_info(issues):
    """{(repo, n): {'parent': p, 'acs': k}} — one GraphQL call per repository."""
    out, by_repo = {}, collections.defaultdict(list)
    for repo, n in issues:
        by_repo[repo].append(n)
    for repo, nums in by_repo.items():
        owner, name = repo.rstrip('/').split('/')[-2:]
        q = f'query{{repository(owner:"{owner}",name:"{name}"){{' + ' '.join(
            f'i{n}: issue(number:{n}){{number body parent{{number}}}}' for n in nums) + '}}'
        for v in run(['gh', 'api', 'graphql', '-f', f'query={q}'])['data']['repository'].values():
            if v:
                out[(repo, v['number'])] = {'parent': (v['parent'] or {}).get('number'),
                                            'acs': len(re.findall(r'^- \*\*AC-\d+', v['body'] or '', re.M))}
    return out


def key(i):
    return i['content']['repository'], i['content']['number']


def capacity_of(conf, days):
    return (days - conf.get('off_days', 0)) * conf.get('allocation', 1.0)


def speed_of(conf, cap):
    return conf.get('speed', cap.get('speed', {}).get(conf.get('level', 'middle'), 1.0))


def days_left_ratio(items, days):
    if not items:
        return None
    s0 = items[0]['sprint']
    start = datetime.date.fromisoformat(s0['startDate'])
    end = start + datetime.timedelta(days=s0['duration'] - 1)
    today = datetime.date.today()
    if not start < today <= end:
        return None
    left = sum(1 for k in range((end - today).days + 1) if (today + datetime.timedelta(days=k)).weekday() < 5)
    return left / days


def points_of(n, entry, acs, sz):
    if 'points' in entry:
        base = entry['points']
    else:
        base = next(p for limit, p in sz['points_by_ac'] if acs <= limit)
        base += sz['risk_points'][entry.get('risk', 'low')]
    return base


def mode_plan(a, cap):
    sz = json.load(open(a.sizing))
    days, thr, people = cap['working_days'], cap.get('threshold', 0.8), cap['people']
    items = {i['content']['number']: i for i in board_items(a.owner, a.number, cap['sprint'])}
    wanted = {int(k): v for k, v in sz['items'].items()}
    missing = [n for n in wanted if n not in items]
    info = issue_info([key(items[n]) for n in wanted if n in items])
    pts = collections.defaultdict(float)
    lines = collections.defaultdict(list)
    risk_breaks = []
    for n, e in wanted.items():
        if n not in items:
            continue
        it = items[n]
        who = [e['assignee']] if e.get('assignee') else [p for p in (it.get('assignees') or []) if p in people]
        if not who:
            lines['(chưa có người)'].append(f'#{n}')
            continue
        p = points_of(n, e, info[key(it)]['acs'], sz)
        share = sz.get('started_share', 0.5) if e.get('started') else 1.0
        total = p * share
        rv = e.get('reviewer')
        if rv:
            pts[rv] += total * sz.get('review_share', 0.2)
            lines[rv].append(f'#{n} review {total * sz.get("review_share", 0.2):g}')
        for w in who:
            pts[w] += total / len(who)
            tag = (' bắt đầu' if e.get('started') else '') + (f' · rủi ro {e["risk"]}' if e.get('risk') else '')
            lines[w].append(f'#{n} {total / len(who):g}{tag}')
            if (people.get(w, {}).get('level') == 'junior' and e.get('risk') == 'high'
                    and not e.get('started') and not rv):
                risk_breaks.append(f'#{n} ({people[w].get("name", w)}, junior, rủi ro cao, rổ "xong", chưa có senior review)')
    eff = {p: capacity_of(c, days) * speed_of(c, cap) for p, c in people.items()}
    tot_pts, tot_eff = sum(pts[p] for p in people), sum(eff.values())
    per = tot_pts / tot_eff if tot_eff else 0
    print(f'## Chia việc {cap["sprint"]} trước khi dev ước lượng — điểm theo nội dung US, '
          f'hệ số tốc độ: {cap.get("speed_source", "prior")}')
    print()
    print('| Người | Cấp | Sức (ngày) | Hệ số tốc độ | Sức hiệu dụng | Điểm đang giao | Phần công bằng | Tải tương đối | Đánh giá |')
    print('|---|---|---|---|---|---|---|---|---|')
    for p, c in people.items():
        fair = eff[p] * per
        ratio = pts[p] / fair if fair else 0
        verdict = ('**QUÁ TẢI**' if ratio > 1.2 else 'hơi nặng' if ratio > 1.0 else
                   'còn dư' if ratio < 0.8 else 'ổn')
        print(f'| {c.get("name", p)} | {c.get("level", "-")} | {capacity_of(c, days):g} | {speed_of(c, cap):g} | '
              f'{eff[p]:g} | {pts[p]:g} | {fair:.1f} | {ratio:.2f} | {verdict} |')
    print(f'| **Cả đội** | | | | {tot_eff:g} | {tot_pts:g} | | | |')
    if risk_breaks:
        print('\n**Vi phạm luật rủi ro:** ' + ' · '.join(risk_breaks))
    if missing:
        print('\n**Trong sizing.json nhưng không có trong sprint trên board:** ' + ' '.join(f'#{n}' for n in missing))
    if a.details:
        for p, c in list(people.items()) + [('(chưa có người)', {})]:
            if lines[p]:
                print(f'\n- {c.get("name", p)}: ' + ' · '.join(lines[p]))


def mode_estimates(a, cap):
    days, thr, project, people = cap['working_days'], cap.get('threshold', 0.8), cap.get('project'), cap['people']
    items = board_items(a.owner, a.number, cap['sprint'])
    info = issue_info([key(i) for i in items])
    in_sprint = {key(i) for i in items}
    status = {key(i): i.get('status') for i in items}
    containers = {(r, v['parent']) for (r, n), v in info.items()
                  if v['parent'] and (r, v['parent']) in in_sprint and status.get((r, n)) not in DEV_DONE}
    left_ratio = days_left_ratio(items, days)
    rows = {p: dict(remaining=0.0, other=0.0, unest=[], wip=0, items=[]) for p in people}
    orphans = []
    for i in items:
        k = key(i)
        who = [p for p in (i.get('assignees') or []) if p in people]
        if not who:
            orphans.append(i)
            continue
        est, is_container = i.get('estimation days'), k in containers
        mine = project is None or i.get('project') == project
        for p in who:
            r = rows[p]
            label = 'container' if is_container else (f'{est / len(who):g}d' if est else 'no estimate')
            r['items'].append(f'#{k[1]} [{i.get("status")}] {label} · {i["title"][:70]}')
            if i.get('status') in WIP:
                r['wip'] += 1
            if is_container:
                continue
            if not est:
                r['unest'].append(k[1])
                continue
            if i.get('status') in DEV_DONE:
                continue
            r['remaining' if mine else 'other'] += est / len(who)
    print(f'## Tải {cap["sprint"]} theo ước lượng của dev — ngưỡng {int(thr * 100)}%'
          + (f', dự án {project}' if project else ''))
    if left_ratio is not None:
        print(f'\nGiữa sprint: còn {left_ratio * days:g}/{days} ngày làm việc (tính cả hôm nay).')
    print('\n| Người | Sức sprint | Sức còn lại | Ngưỡng 80% | Việc còn lại (ngày) | % sức còn lại | '
          'Chưa ước lượng | Đang làm | Dự án khác | Đánh giá |')
    print('|---|---|---|---|---|---|---|---|---|---|')
    tot_left = tot_rem = 0.0
    for p, conf in people.items():
        c = capacity_of(conf, days)
        c_left = c * left_ratio if left_ratio is not None else c
        r = rows[p]
        tot_left += c_left
        tot_rem += r['remaining']
        pct = r['remaining'] / c_left if c_left else 0
        verdict = ('không có sức trong sprint' if c_left == 0 else '**QUÁ TẢI** — không kịp trong sprint' if pct > 1
                   else 'vượt ngưỡng 80% — không nhận thêm' if pct > thr else 'chưa đủ số liệu' if r['unest']
                   else 'chưa có việc' if not r['items'] else 'ổn')
        if r['unest']:
            verdict += f' ({len(r["unest"])} việc chưa ước lượng: ' + ' '.join(f'#{n}' for n in r['unest']) + ')'
        if r['wip'] > 2:
            verdict += f' · đang làm {r["wip"]} việc cùng lúc'
        name = conf.get('name', p) + (f' — {conf["note"]}' if conf.get('note') else '')
        print(f'| {name} | {c:g} | {c_left:g} | {c_left * thr:g} | {r["remaining"]:g} | {pct:.0%} | '
              f'{len(r["unest"])} | {r["wip"]} | {r["other"]:g} | {verdict} |')
    print(f'| **Cả đội** | | {tot_left:g} | {tot_left * thr:g} | {tot_rem:g} | '
          f'{(tot_rem / tot_left if tot_left else 0):.0%} | | | | |')
    if orphans:
        print('\n**Việc trong sprint chưa có người nhận (trong danh sách sức):** '
              + ' · '.join(f'#{i["content"]["number"]}' for i in orphans))
    if containers:
        print('\n**Không cộng ước lượng của chính issue này (task con còn mở mang ước lượng):** '
              + ' · '.join(f'#{n}' for _, n in sorted(containers)))
    if a.details:
        for p, conf in people.items():
            print(f'\n### {conf.get("name", p)} (@{p})')
            for line in rows[p]['items'] or ['(không có việc)']:
                print(f'- {line}')


def mode_calibrate(a, cap):
    sz = json.load(open(a.sizing))
    sprint = a.sprint or cap['sprint']
    people = cap['people']
    items = [i for i in board_items(a.owner, a.number, sprint) if i.get('status') in DEV_DONE]
    info = issue_info([key(i) for i in items])
    sized = {int(k): v for k, v in sz['items'].items()}
    got = collections.defaultdict(lambda: [0.0, 0.0, 0])   # points, actual days, items
    no_actual = collections.Counter()
    for i in items:
        n = i['content']['number']
        who = [p for p in (i.get('assignees') or []) if p in people]
        if not who or n not in sized:
            continue
        act = i.get('actual days')
        if not act:
            for w in who:
                no_actual[w] += 1
            continue
        p = points_of(n, sized[n], info[key(i)]['acs'], sz)
        for w in who:
            g = got[w]
            g[0] += p / len(who)
            g[1] += act / len(who)
            g[2] += 1
    speeds = {w: g[0] / g[1] for w, g in got.items() if g[1]}
    med = statistics.median(speeds.values()) if speeds else None
    print(f'## Đo hệ số tốc độ từ {sprint} — điểm / Actual days, so với trung vị cả đội, trộn với hệ số cũ')
    print('\n| Người | Việc xong có Actual days | Thiếu Actual days | Điểm | Ngày thật | Tốc độ đo | Hệ số đo | Hệ số cũ | Hệ số mới |')
    print('|---|---|---|---|---|---|---|---|---|')
    for p, c in people.items():
        prior = speed_of(c, cap)
        g = got.get(p)
        if not g or not g[1] or not med:
            print(f'| {c.get("name", p)} | 0 | {no_actual[p]} | | | | | {prior:g} | {prior:g} (chưa đủ dữ liệu) |')
            continue
        measured = speeds[p] / med
        new = (prior * PRIOR_WEIGHT + measured * g[2]) / (PRIOR_WEIGHT + g[2])
        print(f'| {c.get("name", p)} | {g[2]} | {no_actual[p]} | {g[0]:g} | {g[1]:g} | {speeds[p]:.2f} | '
              f'{measured:.2f} | {prior:g} | **{new:.2f}** |')
    print('\nGhi "Hệ số mới" vào `people.<login>.speed` trong capacity.json của sprint sau, '
          'và đổi `speed_source` thành "đo từ <sprint>".')


def read_profile():
    """KEY="value" pairs from the team profile (sora-profile/profile.env)."""
    d = os.environ.get('DELIVERY_PROFILE_DIR') or os.path.expanduser('~/.config/herdr-app/skills/sora-profile')
    out = {}
    with open(os.path.join(d, 'profile.env'), encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                out[k.strip()] = v.strip().strip('"')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['plan', 'estimates', 'calibrate'])
    ap.add_argument('--capacity', required=True)
    ap.add_argument('--sizing')
    ap.add_argument('--sprint')
    prof = read_profile()
    ap.add_argument('--owner', default=prof.get('GH_OWNER'))
    ap.add_argument('--number', default=prof.get('GH_PROJECT'))
    ap.add_argument('--details', action='store_true')
    a = ap.parse_args()
    cap = json.load(open(a.capacity))
    if a.mode in ('plan', 'calibrate') and not a.sizing:
        sys.exit('--sizing is required for plan and calibrate')
    {'plan': mode_plan, 'estimates': mode_estimates, 'calibrate': mode_calibrate}[a.mode](a, cap)


if __name__ == '__main__':
    main()

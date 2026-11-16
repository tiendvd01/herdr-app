#!/usr/bin/env python3
"""Post the "old issue" batch of an Epic + User Story sprint (skill delivery-backlog).

Each existing issue that hangs under a new user story has one draft file:
  <N>-task.md       no PR yet  -> comment, then new title/body/labels/milestone, then sub-issue of the US
  <N>-delivered.md  has a PR   -> comment only, then sub-issue of the US

Draft layout (see ../assets/old-issue-task.md and old-issue-delivered.md):
  - first line `<!-- STATE: draft … -->`
  - a line `Kind: … · Parent: #<US> …` (task: inside the new body; delivered: above the comment)
  - `## Comment (VI)` … up to `## New title (EN)` / `## New body (EN)` or end of file
  - task only: `## New title (EN)` (one line) and `## New body (EN)` (to end of file).
    In the body, `<COMMENT_PERMALINK …>` becomes the posted comment's URL, `#<this task>` becomes #N,
    and the `Kind:` line is dropped (its Labels / Milestone are applied as fields instead).

Usage:
  post_old_issues.py --repo OWNER/REPO --drafts DIR plan   [N ...]   # read-only: what would change
  post_old_issues.py --repo OWNER/REPO --drafts DIR run    [N ...]   # post (resumable: --state file)
  post_old_issues.py --repo OWNER/REPO --drafts DIR verify [N ...]   # GitHub == draft?
  post_old_issues.py --repo OWNER/REPO --drafts DIR mark   [N ...]   # STATE line + permalink in files
Without N, every *-task.md / *-delivered.md whose STATE line says `draft` is taken.
Run `plan` first and show it to the PM; run `run` only after an explicit "đăng".
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

PERMALINK = re.compile(r'<COMMENT_PERMALINK[^>]*>')


def gh(args, payload=None):
    cmd = ['gh', 'api'] + args + (['--input', '-'] if payload is not None else [])
    r = subprocess.run(cmd, input=json.dumps(payload) if payload is not None else None,
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'gh api failed: {" ".join(args)}\n{r.stdout}\n{r.stderr}')
    return json.loads(r.stdout) if r.stdout.strip() else None


def section(text, start, stops):
    m = re.search(r'^' + re.escape(start) + r'.*$', text, flags=re.M)
    if not m:
        return None
    rest = text[m.end():]
    ends = [rest.find('\n' + s) for s in stops if rest.find('\n' + s) >= 0]
    return (rest[:min(ends)] if ends else rest).strip('\n')


def find_drafts(root, numbers):
    files = glob.glob(os.path.join(root, '**', '*-task.md'), recursive=True) + \
        glob.glob(os.path.join(root, '**', '*-delivered.md'), recursive=True)
    found = {}
    for f in files:
        base = os.path.basename(f)
        if not base.split('-')[0].isdigit() or '/_archive/' in f:
            continue
        n = int(base.split('-')[0])
        if numbers:
            if n in numbers:
                found[n] = f
        elif open(f, encoding='utf-8').readline().startswith('<!-- STATE: draft'):
            found[n] = f
    missing = set(numbers or []) - set(found)
    if missing:
        sys.exit(f'no draft file for: {sorted(missing)}')
    return dict(sorted(found.items()))


def parse(n, path):
    s = open(path, encoding='utf-8').read()
    kind = 'task' if path.endswith('-task.md') else 'delivered'
    comment = section(s, '## Comment (VI)', ['## New title', '## New body'])
    if not comment:
        sys.exit(f'#{n}: no "## Comment (VI)" section in {path}')
    title = section(s, '## New title (EN)', ['## New body'])
    body = section(s, '## New body (EN)', ['\x00'])
    meta = next((l for l in s.split('\n') if l.startswith('Kind:') and 'Parent:' in l), None)
    if not meta:
        sys.exit(f'#{n}: no "Kind: … · Parent: #<US>" line in {path}')
    parent = int(re.search(r'Parent: #(\d+)', meta).group(1))
    labels = milestone = None
    m = re.search(r'Labels: ([^·]+)', meta)
    if m:
        labels = [x.strip() for x in m.group(1).split(',') if x.strip()]
    m = re.search(r'Milestone: ([^·(]+)', meta)
    if m:
        milestone = m.group(1).strip()
    if body:
        lines = [l for l in body.split('\n') if not l.startswith('Kind:')]
        body = re.sub(r'\n{3,}', '\n\n', '\n'.join(lines)).strip('\n') + '\n'
        body = body.replace('#<this task>', f'#{n}')
    for label, text in (('comment', comment), ('body', body or '')):
        left = re.findall(r'#<[^>]+>', PERMALINK.sub('', text))
        if left:
            sys.exit(f'#{n}: unfilled placeholder(s) in the {label}: {left}')
    if '<!--' in comment:
        sys.exit(f'#{n}: an HTML comment would be posted inside the comment')
    return dict(n=n, path=path, kind=kind, comment=comment.strip() + '\n', title=title.strip() if title else None,
                body=body if kind == 'task' else None, labels=labels if body else None,
                milestone=milestone if body else None, parent=parent)


def fetch(repo, numbers):
    owner, name = repo.split('/')
    q = f'query{{repository(owner:"{owner}",name:"{name}"){{' + ' '.join(
        f'i{n}: issue(number:{n}){{number state databaseId title body labels(first:20){{nodes{{name}}}} '
        f'milestone{{title}} parent{{number}} assignees(first:5){{nodes{{login}}}} '
        f'comments(last:1){{nodes{{author{{login}} createdAt}}}}}}' for n in numbers) + '}}'
    d = gh(['graphql', '-f', f'query={q}'])['data']['repository']
    return {v['number']: v for v in d.values()}


def new_labels(cur, wanted):
    if wanted is None:
        return None
    keep = [x for x in cur if not (x.startswith('epic:') and x not in wanted)]
    return keep + [x for x in wanted if x not in keep]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', required=True)
    ap.add_argument('--drafts', required=True, help='the sprint drafts folder')
    ap.add_argument('--state', help='progress file (default: <drafts>/_plan/old-issues-state.json)')
    ap.add_argument('--allow-closed', action='store_true')
    ap.add_argument('mode', choices=['plan', 'run', 'verify', 'mark'])
    ap.add_argument('numbers', nargs='*', type=int)
    a = ap.parse_args()
    state_path = a.state or os.path.join(a.drafts, '_plan', 'old-issues-state.json')
    st = json.load(open(state_path)) if os.path.exists(state_path) else {}
    drafts = {n: parse(n, p) for n, p in find_drafts(a.drafts, a.numbers).items()}
    if not drafts:
        sys.exit('nothing to do: no draft files')
    cur = fetch(a.repo, list(drafts))

    def save():
        os.makedirs(os.path.dirname(state_path), exist_ok=True)
        json.dump(st, open(state_path, 'w'), indent=1)

    if a.mode == 'plan':
        for n, d in drafts.items():
            c = cur[n]
            labels_cur = [x['name'] for x in c['labels']['nodes']]
            last = c['comments']['nodes'][0] if c['comments']['nodes'] else None
            warn = []
            if c['state'] != 'OPEN':
                warn.append('CLOSED — drop the draft or pass --allow-closed')
            if last:
                who = last['author']['login'] if last['author'] else '?'
                warn.append(f'last comment: {who} {last["createdAt"][:16]} — newer than the draft? read the thread first')
            print(f'#{n} [{d["kind"]}] → sub-issue of #{d["parent"]} (parent now #{(c["parent"] or {}).get("number")})'
                  f' · assignees {[x["login"] for x in c["assignees"]["nodes"]]}'
                  f' · comment {len(d["comment"])} ch'
                  + (f' · new title + body {len(d["body"])} ch' if d['body'] else '')
                  + (f' · milestone {(c["milestone"] or {}).get("title")} → {d["milestone"]}' if d['milestone'] else '')
                  + (f' · labels {labels_cur} → {new_labels(labels_cur, d["labels"])}' if d['labels'] else ''))
            for w in warn:
                print(f'    ! {w}')
        return

    if a.mode == 'run':
        closed = [n for n in drafts if cur[n]['state'] != 'OPEN']
        if closed and not a.allow_closed:
            sys.exit(f'closed issues in the batch: {closed} (drop their drafts or pass --allow-closed)')
        ms = {m['title']: m['number'] for m in gh([f'repos/{a.repo}/milestones?state=all&per_page=100'])}
        for n, d in drafts.items():
            s = st.setdefault(str(n), {})
            if 'comment_url' not in s:
                r = gh([f'repos/{a.repo}/issues/{n}/comments', '-X', 'POST'], {'body': d['comment']})
                s['comment_url'], s['comment_id'] = r['html_url'], r['id']
                save()
                print(f'#{n} commented {r["html_url"]}')
            if d['body'] and 'edited' not in s:
                patch = {'title': d['title'], 'body': PERMALINK.sub(s['comment_url'], d['body'])}
                if d['milestone']:
                    patch['milestone'] = ms[d['milestone']]
                labels = new_labels([x['name'] for x in cur[n]['labels']['nodes']], d['labels'])
                if labels is not None:
                    patch['labels'] = labels
                gh([f'repos/{a.repo}/issues/{n}', '-X', 'PATCH'], patch)
                s['edited'] = True
                save()
                print(f'#{n} title / body / labels / milestone updated')
            if 'linked' not in s:
                gh([f'repos/{a.repo}/issues/{d["parent"]}/sub_issues', '-X', 'POST'],
                   {'sub_issue_id': cur[n]['databaseId'], 'replace_parent': True})
                s['linked'] = d['parent']
                save()
                print(f'#{n} is now a sub-issue of #{d["parent"]}')
        return

    if a.mode == 'verify':
        bad = 0
        for n, d in drafts.items():
            s = st.get(str(n), {})
            if 'comment_id' not in s:
                print(f'#{n} not posted'); bad += 1; continue
            cm = gh([f'repos/{a.repo}/issues/comments/{s["comment_id"]}'])
            c = cur[n]
            ok = {'comment': cm['body'].replace('\r\n', '\n').strip() == d['comment'].strip(),
                  'parent': (c['parent'] or {}).get('number') == d['parent']}
            if d['body']:
                ok['title'] = c['title'] == d['title']
                ok['body'] = c['body'].replace('\r\n', '\n').strip() == PERMALINK.sub(s['comment_url'], d['body']).strip()
            good = all(ok.values())
            bad += not good
            print(f'#{n} {"OK " if good else "BAD"} {ok} milestone={(c["milestone"] or {}).get("title")}')
        print('mismatches:', bad)
        return

    if a.mode == 'mark':
        for n, d in drafts.items():
            s = st.get(str(n), {})
            if not s.get('linked'):
                print(f'#{n} skipped: not fully posted'); continue
            t = PERMALINK.sub(s['comment_url'], open(d['path'], encoding='utf-8').read())
            first, rest = t.split('\n', 1)
            what = 'comment + new title/body/labels/milestone' if d['body'] else 'comment only'
            first = (f'<!-- STATE: posted — GitHub matches this file · {what} · comment {s["comment_url"]}'
                     f' · sub-issue of #{s["linked"]} -->')
            open(d['path'], 'w', encoding='utf-8').write(first + '\n' + rest)
            print(f'#{n} marked posted')


if __name__ == '__main__':
    main()

---
name: delivery-dev-open-pr
description: "Prepare a pull request for the developer to open: check the gh account, the branch and its upstream, take the PR body from pr.md (or draft one from the repo template), then print the exact push + gh pr create commands. Never pushes and never creates the PR itself."
---

# Open PR — chuẩn bị, không tự đẩy

Claude **never runs `git push`, `gh pr create` or `gh pr merge`** (global rule in `~/.claude/CLAUDE.md`). This skill does everything up to that line, then hands the developer commands that are safe to paste.

## Response Language

Reply in the user's language. The PR title and body follow the repo's own convention (read `.claude/rules/`, `CONTRIBUTING.md`, the PR template).

## Step 0 — GitHub account

```bash
gh auth status
```

Show the active account and ask: "Đang dùng GitHub account **<account>**. Tiếp tục?". Switching is the developer's job (`gh auth switch`).

## Step 1 — Branch and upstream (the push target)

```bash
git branch --show-current
git rev-parse --abbrev-ref @{u} 2>/dev/null || echo "(no upstream)"
git status --short
git log --oneline <base>..HEAD
```

- On a shared branch (`main`, `develop`, `dev`, `master`) → stop. The commits must move to a feature branch first; say so, do not improvise.
- Upstream points at a shared branch (`origin/develop`, `origin/main`…) → run `git branch --unset-upstream` and tell the developer why: a bare `git push` or a GUI client would otherwise push the feature commits straight onto the shared branch.
- Uncommitted changes → back to `delivery-dev-commit`.
- `<base>` comes from the repo rules (`delivery-dev` Repo Facts → Base branch when the issue ran through delivery-dev).

## Step 2 — PR body

- **`pr.md` exists** (written by `delivery-dev-pr`): use it as-is. Do not regenerate a summary over it.
- **No `pr.md`**: read `.github/pull_request_template.md` (any case / location GitHub accepts) and fill its sections exactly. Without a template, use: Description · Related Issue · Detailed Changes · Deployment notes (env vars, migrations, rollback) · Notes.
- Issue link keyword comes from the repo rule or template. Many repos forbid `Fixes` / `Closes`; when unsure, use `Refs #<n>`.
- Link only files that are **committed**. Task artifacts live in the private SoraVaults vault and are invisible to reviewers, so never cite them as an attachment.
- Optional before writing: `docs-sync` agent when the diff adds routes, models or pages; `xservice` agent when it spans two or more services. Fix what they find and commit it first.

Present title + body as a preview.

## Step 3 — Commands for the developer

After the developer approves the preview, print (do not run):

```bash
git push -u origin <feature-branch>        # never develop / main
gh pr create --base <base> --title "<title>" --body-file <path-to-pr.md>
```

Add `--assignee @me`, `--label`, `--reviewer` only when the repo rules ask for them. If they push from a GUI client, remind them to check that the "To:" target is the feature branch and that Force push is off.

## Guidelines

- PR title: the repo's commit convention, under ~72 characters.
- Breaking changes, follow-ups and known gaps go in the notes section.
- A large diff → suggest splitting before opening.

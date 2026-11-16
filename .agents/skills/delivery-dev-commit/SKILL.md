---
name: delivery-dev-commit
description: >
  Create well-structured git commits: one commit per feature/purpose, auto-create branch if needed.
  Use when user says "commit", "save changes", or wants to create a git commit for current changes.
---

## Language Rules

- **Response language:** the user's preferred language (default Vietnamese for this user).
- **Commit message:** English (Conventional Commits).

---

# Commit Skill

Create well-structured git commits: one commit per feature/purpose, no bulk commits mixing unrelated changes.

## IMPORTANT: Commit Only — No Remote Writes

**Do NOT push after committing.** This skill only creates local commits. The user pushes manually or via the PR-creation skill.

### Prohibited
- `git push` — NEVER push.
- `gh pr create`, `gh pr edit`, `gh issue create` — NEVER use `gh` for write/create operations.
- `gh` is **read-only** here: only `gh pr list`, `gh pr view`, `gh issue list`, `gh issue view`, etc.

## Core Rules

- **One commit per purpose** — never mix unrelated changes.
- **Specific staging** — never `git add -A` or `git add .`. Always add specific files.
- **No Co-Authored-By** — do NOT add co-author trailers unless the user explicitly asks.
- **Branch awareness** — create branch if on `main`/`master`; skip if already on a feature branch.
- **Git author** — before the first commit, show `git config user.name` / `user.email` and confirm. Do NOT change git config — warn the user if they want to switch.

---

## Process

### 1. Analyze Current State

```bash
git status
git diff --stat
git diff --cached --stat
git branch --show-current
```

Check: current branch, staged vs unstaged vs untracked, nothing-to-commit case.

### 2. Branch Handling

**On a shared branch** — `main`/`master`, `develop`/`dev`, or any branch the repo rules call shared/protected:
- Propose a branch name based on the changes (see Branch Naming).
- Create and switch **without tracking**: `git switch -c <branch-name> --no-track` (uncommitted changes carry over).
- If the new branch still has an upstream on a shared branch (`git rev-parse --abbrev-ref @{u}`), run `git branch --unset-upstream` — otherwise the first `git push` / GUI push lands on the shared branch.

**On a feature/fix/hotfix branch:** skip branch creation, proceed.

#### Branch Naming

Format: `<type>/<short-description>`

| Type | When |
|------|------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `hotfix/` | Urgent prod fix |
| `refactor/` | Refactoring |
| `chore/` | Build/config/dependency |

Examples: `fix/auth-sso-edge-case`, `feat/product-search`, `hotfix/replace-banner`.

### 3. Review Changes in Detail

```bash
git diff
git diff --cached
```

Read actual diffs to understand what changed and why.

### 4. Evaluate Commit Granularity

Single purpose? → one commit.
Multiple purposes? → split.

**Signs of mixed purposes (must split):**
- Backend logic mixed with unrelated frontend changes.
- Feature code mixed with bug fixes.
- Multiple independent modules changed for different reasons.
- Test fixes mixed with feature implementation.

If splitting, propose:

> Các thay đổi gồm nhiều mục đích:
> 1. **Fix auth bug** — `path/to/file1`
> 2. **Add product search** — `path/to/file2`
> 3. **Update UI styles** — `path/to/file3`
>
> Tôi đề xuất commit riêng từng phần. Bắt đầu phần nào?

Then stage and commit each group separately.

### 5. Stage Changes

```bash
git add <specific-files>
```

**Never stage:**
- `.env`, `.env.*` files.
- Credentials, secrets, keys.
- `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, `build/`.

If sensitive files detected → warn and skip.

### 6. Draft Commit Message

#### Format (Conventional Commits)

```
<type>(<scope>): <subject>

[body]
```

#### Types

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Non-semantic (formatting) |
| `refactor` | Refactoring without bug fix or feature |
| `test` | Adding/updating tests |
| `chore` | Build/config/dependency |
| `perf` | Performance improvement |

#### Scope
- Module/area affected — pick from the project's actual structure.
- Comma-separated for multi-scope: `fix(auth,api): ...`.
- Omit scope if change spans many areas.

#### Guidelines
- **Subject**: imperative, lowercase, no trailing period.
- **Body** (optional): explain WHY, not WHAT.
- Subject under 72 chars.
- Reference issue: `(#123)` at end of subject.

#### Examples

```
fix(auth): auto-approve SSO accounts without admin confirmation
```
```
feat(search): add product full-text search with locale-aware analyzer

Implements search with synonyms and faceted filtering.
```
```
fix(ui): correct pagination on order list (#289)
```
```
chore(deps): bump shared library to v2 to support new media format
```

### 7. Create the Commit

Show the proposed commit message and staged files. Then:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>
EOF
)"
```

For single-line:
```bash
git commit -m "<type>(<scope>): <subject>"
```

### 8. Verify

```bash
git log --oneline -1
git status
```

Confirm and report.

### 9. Output Summary

```
Committed:  <commit-hash> <type>(<scope>): <subject>
Branch:     <current-branch>
Files:      <number> changed
```

---

## Handling Multiple Features

When changes contain multiple unrelated features:
1. **Identify groups** — cluster files by purpose.
2. **Commit sequentially** — stage + commit each group one at a time.
3. **Ask if ambiguous** — if a file's group is unclear, ask user.

Example flow:
```
Phát hiện 2 nhóm:

1. fix(auth): update SSO error handling
   - <files>

2. feat(search): add slug endpoint
   - <files>

Commit từng nhóm riêng. Bắt đầu nhóm 1.
```

## Error Handling

- **Pre-commit hook fails**: show error, help fix, then create a NEW commit (don't amend unless user explicitly asks).
- **Nothing to commit**: inform user, stop.
- **Sensitive files detected**: warn, exclude from staging.
- **Merge conflicts**: do NOT auto-resolve; suggest `git rebase` and inform.

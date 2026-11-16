<!-- STATE: draft — not posted (new issue) -->
<!-- New issue · Kind: Commitment · Lane: Sprint · Sprint: Sprint <N> · no milestone. Stories already sit under their Epic (a sub-issue has one parent), so they are linked here as a checkbox list, not as sub-issues. Create it after the Epics and stories have numbers. -->

Title: Sprint <N> — Commitment (<project>)

# Sprint <N> — Commitment (<project>)

> **Draft.** The Epic leads and the split between finished and started stories below are a proposal. Each developer first analyses and estimates their stories in the Solution; this commitment is finalised after those estimates, and every change from this draft is noted here.

**Window:** YYYY-MM-DD → YYYY-MM-DD · **Milestones:** <real dates, not the GitHub due dates if they differ>

**Baseline:** requirements v<x> / spec v<y>, pinned on `develop` (`<sha>`, PR #<n>). Work is organised as Epics and User Stories. For each story, its developer posts a **Solution** (design, data, API, risks, estimate, and a coverage table mapping every rule and AC to a task, or to the part of a PR when the story has no tasks, and a test). The PO reviews it before coding only when it touches infrastructure, the architecture, the data model (a new table or column, a migration) or permissions; otherwise the developer decides and builds on the existing architecture. **A story counts as done only when every one of its acceptance criteria passes on staging**; a story that is only started is reported as started, not as partly done.

## Sprint Goal

1. <release / UAT goal>
2. **Close <k> Epics end to end:** #<Epic> (…), #<Epic> (…).
3. <stories finished outside those Epics; stories started>

## One lead per Epic

Each Epic has one lead, who delivers every story in it end to end (frontend and backend) and answers for its acceptance criteria. Whoever closes their Epic this sprint takes the next one.

| Epic | Lead | This sprint | Next |
|---|---|---|---|
| #<Epic> <name> | <login> | close the Epic | #<next Epic> |

## Commitment

### <Release> — finish in week 1 (QA on each issue's own scope)

| Issue | Owner |
|---|---|
| #<n> (PR #<pr>) | <login> |

### Stories finished this sprint — demoed, every AC checked

| Epic | Story | Lead | Must land first |
|---|---|---|---|
| #<Epic> | #<US> <title> | <login> | — |

### Stories started this sprint — Solution posted, building under way, finished next sprint

| Story | Lead | Why it is not finished here |
|---|---|---|
| #<US> <title> | <login> | <dependency / capacity> |

### Linked issues

The stories already sit under their Epic as sub-issues, so they are linked here instead. Each box is ticked when every AC of the story passes on staging (release issues: when QA passes them).

- **<Release>**
  - [ ] #<n>
- **Finished this sprint**
  - [ ] #<US>
- **Started this sprint** (ticked when the Solution is posted)
  - [ ] #<US>

## Not in this sprint

- <Epic / stories> — next sprint, with the leads above.
- Existing tasks follow their Epic's lead: #<n> → <login> (#<Epic>). They stay `Todo` until their story starts.

## Demo plan — <weekday> <date> afternoon, internal

- **Finished stories, walked through AC by AC, by Epic lead:** <login> — #<Epic> (#<US>, …). A story not ready on the demo day is checked on the last day and reported as carried over, not as done.
- **Started stories:** the Solution and what already runs for #<US>, ….
- **Environment / data:** <staging, test data, external test accounts>

## Acceptance checklist

| Item | Passes when | Evidence | Result |
|---|---|---|---|
| #<US> | every AC passes on staging | QA comment on the story | |

## Dependencies on <client>

| What | Needed by | If late |
|---|---|---|
| #<clarification> | YYYY-MM-DD | <fallback> |

## Risks

- <risk> — <mitigation>

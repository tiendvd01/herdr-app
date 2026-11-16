# Devflow — InfoSec

Loaded by `delivery-dev-solution` (threat model at design time), `delivery-dev-review` (INFOSEC lens on the real diff) and `delivery-dev-operate` (secrets, IAM, exposure at ship time).

Repo has its own security rules, skill or agent (`.claude/rules/security.md`, a `security-audit` skill, an `infosec` agent, a documented invariant list) ⇒ **load and follow those first**; they encode threats specific to this system. This file is the default.

## Hard rules

1. **Never widen a permission to make something work** — IAM policy, security group, CORS, auth middleware, RLS, file mode. A permission error is a finding.
2. **Never commit or print a secret.** Found one in the diff or in history ⇒ CRITICAL, and it must be **rotated**, not just deleted — a deleted secret stays in git history.
3. **Never disable a security control to make a test pass** (TLS verification, signature check, CSRF token, auth guard). Failing because of a control is information.
4. **Do not exploit beyond proof.** Demonstrate the vulnerability minimally, on non-production, and report it. No data exfiltration, no lateral movement, no third-party targets.
5. **Do not probe a live system without approval.** Scanning, fuzzing, auth brute-force, sending crafted requests to a deployed environment — propose the exact command and wait, exactly like the infra command policy in `devops.md`. Reading code and configuration needs no approval; touching a running system does.
6. A surface you could not examine is `UNKNOWN`, never `PASS`.

## Threat model (design time, in `solution.md`)

Cheap version, three questions per trust boundary:

```text
Ai là attacker?        (anonymous internet · authenticated user · other tenant · insider · compromised dependency)
Họ muốn gì?            (data · money · availability · privilege)
Vào bằng đường nào?    (endpoint · queue · file upload · webhook · admin tool · CI)
```

Trust boundaries worth naming: internet → edge · service → service · app → DB · user input → any sink · third-party → us (webhooks, callbacks, dependencies).

STRIDE as a prompt, not a form: **S**poofing · **T**ampering · **R**epudiation · **I**nformation disclosure · **D**enial of service · **E**levation of privilege. Write only the ones that are real here.

## Hunting the surfaces (review time, on the diff)

Name the **attack and its impact**, with `file:line`. "Input validation: OK" is not a review.

| Surface | Hunt for |
|---|---|
| Authentication | missing check on a new route · token in URL/log · session fixation · timing-unsafe comparison · weak reset flow |
| Authorization / IDOR | object id from the client used without an ownership check · role checked in UI but not API · tenant id trusted from the request |
| Input validation | type/length/range not enforced at the boundary · negative amounts · mass assignment of fields the client should not set |
| Injection | SQL string concat · ORM `raw` · shell command from user input · LDAP/NoSQL/template injection |
| SSRF | server fetches a client-supplied URL · redirect not re-validated · cloud metadata endpoint (169.254.169.254) reachable |
| XSS | `innerHTML`/`v-html`/`dangerouslySetInnerHTML` · unescaped attribute or URL context · stored content rendered raw |
| CSRF | state-changing endpoint without a token/SameSite · GET that mutates |
| Deserialization | pickle/YAML unsafe load · JSON parsed into a class by type name |
| File upload | extension/MIME trusted from the client · path from filename · no size cap · served from the app origin |
| Rate limit / replay | no cap on an expensive or auth endpoint · webhook without signature + timestamp + nonce |
| Crypto | homemade crypto · ECB · static IV · MD5/SHA1 for passwords · secrets compared with `==` |
| Secrets | hardcoded key · secret in env var printed by an error handler · secret in a client bundle |
| Logging / PII | token, password, card number, personal data in logs or traces · verbose error to the client |
| Payment | amount or currency from the client · missing idempotency · webhook not verified · state machine allowing double capture |

## Supply chain

New or bumped dependency ⇒ check before approving: weekly downloads · age and maintainer · repo URL matches the package · name not a typosquat of a popular one · install scripts (`postinstall`) · licence. Then lockfile committed, version pinned, `npm audit` / `pnpm audit` / `pip-audit` run and the output quoted.

A dependency added to solve a five-line problem is a finding in itself.

## Cloud / IaC

IAM, security groups, public buckets, unencrypted stores, secrets in state — see `devops.md`. Security review of infrastructure reads the **plan output**, not just the `.tf` source.

## Data

Classify what the change touches: public · internal · personal (PII) · secret · payment. Then: encrypted in transit and at rest? retained how long, deleted how? who can read it in production? does it leave the region or the vendor boundary?

## Output

```md
### INFOSEC

- [C1] `payment/api.py:41` — `amount` lấy từ body, chưa validate.
  Attack: gửi `amount: -100` → tạo payment âm → refund thành tiền thật.
  Fix: validate `> 0` ở request schema, và enforce lại ở service.

- [H2] `infra/s3.tf:12` — bucket không bật Block Public Access.
  Attack: object mới upload có thể bị đọc ẩn danh nếu ACL lỏng.
  Fix: `aws_s3_bucket_public_access_block` với cả 4 flag = true.

Không tìm thấy vấn đề ở: authn (không đụng), CSRF (API dùng bearer token).
```

Last line matters: say what you looked at and found clean, so silence is not mistaken for coverage.

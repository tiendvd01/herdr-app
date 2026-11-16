# Devflow — DevOps / IaC (AWS · Terraform first)

Loaded by `delivery-dev-solution` (design), `delivery-dev-review` (SRE/DEVOPS lens on the diff) and `delivery-dev-operate` (ship readiness) when the change touches infrastructure, deployment or configuration.

Repo has its own infra conventions (`terraform/README`, `Makefile`, Atlantis/CI pipeline, module registry) ⇒ **those win**. This file is the default when the repo says nothing.

## Command policy — ASK BEFORE RUNNING ANYTHING THAT TOUCHES CLOUD OR STATE

Infrastructure commands run against **the developer's real account** with **their credentials**. The default AWS profile may well be production. So the rule is not "avoid the dangerous ones" — it is **do not run infra commands on your own initiative at all**.

### Tier 1 — FORBIDDEN, never run, not even when asked in passing

```text
terraform apply · destroy · import · taint · untaint · -auto-approve
terraform state rm|mv|push|replace-provider · force-unlock
aws/gcloud/az: bất kỳ lệnh create|update|delete|put|attach|modify|terminate nào
kubectl apply|delete|scale|rollout · helm install|upgrade|uninstall
docker push · lệnh trigger deploy/release trên CI
```

Corrupt state is worse than the bug being fixed. Move resources with `moved` blocks in code, never by hand.

### Tier 2 — ASK FIRST, every single time

Everything that reaches the network, the cloud account or the state file — **including read-only calls and `plan`**:

```text
terraform init · plan · refresh · show · validate · output · providers
aws|gcloud|az describe|get|list|logs · sts get-caller-identity
kubectl get|describe|logs · tflint · checkov · terraform-compliance
```

`plan` is read-only for infrastructure but it still authenticates, reads state, may acquire a state lock, and `init` writes to the backend and downloads providers.

How to ask — one block, then **stop and wait**:

```text
Cần chạy lệnh sau, bạn duyệt giúp:

  terraform plan -out=tfplan

Chạy ở:      infra/prod/
Account:     AWS profile `prod-admin` (bạn xác nhận đúng profile chưa?)
Chạm gì:     đọc state ở s3://tf-state-prod, giữ lock DynamoDB vài giây
Không đổi:   không tạo/sửa/xoá resource nào
Để làm gì:   xem thay đổi này có replace RDS không

Bạn chạy hộ rồi paste output, hoặc trả lời "chạy đi" để tôi chạy.
```

Approval is **per command, per invocation**. A yes for `plan` in `infra/dev/` is not a yes for `plan` in `infra/prod/`, and not a yes for the next command. Never assume a profile, an account or a region — ask which.

Prefer not running at all: plan output from CI, from Atlantis, or pasted by the developer is just as good as evidence and costs nobody a credential.

### Tier 3 — safe without asking

Purely local, no network, no credentials, no state:

```text
đọc file .tf/.yaml · grep/rg · terraform fmt -check -recursive
```

(`terraform validate` needs an initialised working directory, so it belongs to Tier 2.)

## Other hard blocks

1. **Never widen an IAM policy, a security group or a bucket policy to make something work.** A permission error is a finding, not an obstacle. Find the exact action/resource needed.
2. **Never commit a secret** — `.tfvars`, `.tfstate`, `.env`, kubeconfig, access keys. State files hold secrets in plaintext even when the source does not.
3. **Never use `-target`** to get a clean plan. It hides drift; the next full plan will surprise someone.

## Terraform workflow

The plan output — not the exit code — is the review artifact. Getting it, in order of preference:

1. **From CI / Atlantis** — already there, nothing to run.
2. **From the developer** — give them the exact commands, they run and paste:

   ```bash
   terraform fmt -check -recursive          # Tier 3, an toàn
   terraform init                           # Tier 2 — cần bạn duyệt
   terraform plan -out=tfplan               # Tier 2 — cần bạn duyệt
   terraform show -no-color tfplan          # Tier 2 — cần bạn duyệt
   ```

3. **Run it yourself only after an explicit approval for that exact command** (see the command policy above).

No plan available and no approval to produce one ⇒ review the `.tf` source, mark every infrastructure conclusion `UNKNOWN`, and say plainly that the change was **not** verified against a plan.

### Reading a plan — what to hunt

| Signal | Why it matters |
|---|---|
| `must be replaced` / `-/+` on a **stateful** resource (RDS, EBS, S3 bucket, EFS, ElastiCache) | Destroy-then-create = **data loss**. CRITICAL unless the developer explicitly accepted it. |
| `destroy` count > 0 | Read every one. A rename in code shows up as destroy+create. |
| `~ update in-place` on IAM, security group, bucket policy, KMS key policy | Permission changes hide here. Diff the actual statement, not the resource name. |
| `(known after apply)` on something the plan should know | Often a dependency cycle or a data source that will drift. |
| Plan non-empty on **unchanged** code | Someone changed things in the console. Drift — report it, do not silently absorb it. |
| Provider/module version moved | Pin with `~>` on providers, a **tag** (not a branch) on `?ref=` modules. An unpinned module means the plan is not reproducible. |
| Resource count changes on `for_each`/`count` | Index shifts with `count` destroy the wrong resource. Prefer `for_each` with stable keys. |

### Structure

- Remote backend with locking (S3 + DynamoDB, or TF Cloud), versioning + encryption on the state bucket.
- `required_version` and `required_providers` pinned.
- Environments separated by workspace **or** directory — never by editing variables before apply.
- Secrets from SSM Parameter Store / Secrets Manager, referenced not embedded. Note in the review that the value still lands in state.

## AWS review checklist

Keep only the lines the change touches. Each answer is a fact (`file:line` in the .tf, or a plan hunk) or an explicit `UNKNOWN`.

**IAM** — no `Action: "*"`, no `Resource: "*"` outside a justified case · no `iam:PassRole` without a `Condition` · roles over users, no long-lived access keys · IRSA / instance profile / task role instead of embedded credentials · separate ECS task role from execution role.

**S3** — Block Public Access on · encryption (SSE-S3 or KMS) · versioning where data matters · bucket policy least privilege · TLS-only condition · lifecycle rules (cost).

**Network** — no `0.0.0.0/0` on 22 / 3389 / database ports · egress rules actually scoped · data tier in private subnets · security group referencing another SG instead of a CIDR where possible.

**RDS / data stores** — encryption at rest · backup retention ≠ 0 · `deletion_protection` on production · not publicly accessible · Multi-AZ where the SLA needs it · parameter-group changes that force a reboot flagged.

**Secrets / KMS** — Secrets Manager or SSM SecureString, never a plaintext env var for a real secret · key policy scoped · not the AWS-managed default key for sensitive data · rotation stated or explicitly deferred.

**Compute** — Lambda: timeout, memory, reserved concurrency, DLQ · ECS/EKS: no privileged containers, image pinned by digest or tag (never `latest`), health check + graceful shutdown.

**Observability + cost** — CloudWatch alarms on the thing that can break · log retention set (default is forever = a growing bill) · no PII in logs · NAT gateway, cross-AZ traffic and log retention are the usual silent cost drivers.

## Deployment strategy

| Strategy | Use when | Watch |
|---|---|---|
| Rolling | stateless service, backward-compatible change | old + new run together — the change must be compatible both ways |
| Blue/green | needs instant rollback, can afford double capacity | DB is shared: schema must serve both colours |
| Canary | risky change, measurable metric | who decides to roll forward, on what number, after how long |
| Feature flag | behavior change without a deploy | flag default, who can flip it, when it gets removed |

## Rollback reality — state this honestly

Reverting a commit does **not** undo an applied infrastructure change:

- Deleted RDS instance / S3 objects / EBS volume: gone. Restore is from backup, if a backup exists.
- Applied migration: `terraform apply` of the old code will happily destroy what the new code created.
- Blue/green gives instant rollback for the app **only if** the DB schema still serves the old version.

So `operational-check.md` says **what the rollback actually restores and what it does not** — never a bare "revert the deploy".

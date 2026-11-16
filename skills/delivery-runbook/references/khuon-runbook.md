# Khuôn runbook

Chép ra file mới rồi điền. Ví dụ thật đã chạy hết: PWPF `runbook-deploy-dev-dropbox-788.md` (dev, bật một tính năng) và `runbook-deploy-stg-v1.2.md` (phát hành stg, dùng lại khối của bản dev). Tên file: `runbook-deploy-<env>-<chủ đề>.md` trong vault (luật chung §6): runbook của một issue để ở `issue <n>/`, runbook phát hành theo version để ở `runbooks/` (`vault-path.sh runbooks`). Không để trong repo.

````markdown
# Runbook: <làm gì> lên <env> — issue #<n>

Làm lần lượt từng bước. Mỗi bước có tiêu đề mang dấu ⬜ (chưa làm) / ✅ (đã chạy), và các dòng **Kiểm tra** bên dưới cũng mang ⬜ / ✅ (output đã khớp). Kiểm tra chưa ✅ thì không sang bước sau.

Nguồn lệnh: <file trong repo> (<commit / PR>). Cập nhật lần cuối: dd/mm/yyyy, đối chiếu `<nhánh>` tới `<sha>`.

| | Giá trị |
|---|---|
| <PR / commit> | <trạng thái, merge commit> |
| Plan Terraform | run **<id>**, artifact hết hạn <thời điểm> |
| Đang chạy | image `<tag>`, DB ở `<revision>` |
| Có thêm so với <env> | <N> PR (<M> commit), bảng ngay dưới |
| Profile CLI | `<profile>` — <thiếu quyền gì> |

**Bản này đưa lên <env>** (đối chiếu `git log --first-parent <commit env đang chạy>..<commit phát hành>`):

| PR | Thay đổi | Người dùng thấy gì trên <env> |
|---|---|---|
| #<n> | <một câu: làm gì; kèm migration / hạ tầng nếu có> | Có — kiểm ở <id bước> |
| #<n> | <…> | Không gì: <vì sao, có căn cứ file:dòng — vd công tắc đang tắt> |

## Bốn điều phải nhớ

1. <điều làm hỏng môi trường nếu quên, kèm file:dòng làm căn cứ>
2. …
3. …
4. Một khối lệnh = một lần dán; dòng **Kiểm tra** chưa đạt thì không dán khối tiếp. Mở terminal mới thì dán lại bước 0. Không in, không chụp, không dán giá trị bí mật vào đâu cả (chỉ tên khoá).

---

## Pha 0 — Chuẩn bị

### ⬜ 0. Chuẩn bị shell

*dán lại mỗi lần mở terminal mới*

```bash
{
cd <repo>
export AWS_PROFILE="<profile>"
export AWS_REGION=<region>
export AWS_PAGER=""
export GH_PAGER=cat
export GH_REPO=<org/repo>
ENV=<env>
CLUSTER="<prefix>-cluster"
ME=$(gh api user --jq .login)
latest_dispatch() {
  gh run list --workflow "$1" --event workflow_dispatch --user "$ME" --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty'
}
dispatch_ref_and_watch() {  # $1 = ref, $2 = workflow, rest = -f inputs
  RUN_ID=""
  ref=$1; wf=$2; shift 2
  before=$(latest_dispatch "$wf")
  gh workflow run "$wf" --ref "$ref" "$@" || return 1
  tries=0
  while [ -z "$RUN_ID" ] && [ "$tries" -lt 30 ]; do
    sleep 2; tries=$((tries + 1))
    id=$(latest_dispatch "$wf")
    if [ -n "$id" ] && [ "$id" != "$before" ]; then RUN_ID=$id; fi
  done
  if [ -z "$RUN_ID" ]; then echo "the $wf run did not appear within 60 s: open the Actions tab"; return 1; fi
  echo "$wf run $RUN_ID: $(gh run view "$RUN_ID" --json url --jq .url)"
  gh run watch "$RUN_ID" --exit-status
}
dispatch_and_watch() { dispatch_ref_and_watch <shared-branch> "$@"; }
account=$(aws sts get-caller-identity --query Account --output text)
if [ "$account" = "<account>" ]; then
  echo "OK <env> | gh user: ${ME:-NOT LOGGED IN} | <id hạ tầng đọc từ SSM>"
else
  ENV=""; CLUSTER=""
  echo "STOP: AWS account is '${account}', not <account>. Fix AWS_PROFILE and paste this block again."
fi
}
```

⬜ **Kiểm tra:** `OK <env> | gh user: <login> | …`.

---

## Pha A — <tên pha>

### ⬜ A1. <bước chỉ đọc>

*chỉ đọc*

```bash
{
<lệnh>
}
```

⬜ **Kiểm tra:** <output mong đợi nguyên văn>.

### ⬜ A2. Plan

*chỉ gán `PLAN_RUN` khi xanh*

```bash
{
PLAN_RUN=""
if dispatch_and_watch terraform -f environment=<env> -f stack=<stack>; then PLAN_RUN=$RUN_ID
else echo "STOP: no green plan, so PLAN_RUN is empty: read the run, then paste this block again"; fi
}
```

⬜ **Kiểm tra summary:** (suy từ …, chưa thấy plan thật)

| Stack | Mong đợi |
|---|---|
| … | … |

### ⬜ A3. Apply

*`branch` phải là `<shared-branch>`; dán lại cho mọi lần apply sau*

```bash
if [ -z "$PLAN_RUN" ]; then echo "STOP: PLAN_RUN is empty: paste the plan block first"
else dispatch_ref_and_watch <ref> terraform-apply -f environment=<env> -f run_id="$PLAN_RUN" -f branch=<shared-branch>
fi
```

⬜ **Kiểm tra:** watch xanh. Run id: …

### ⬜ A4. <thao tác console>

Làm tay: <Dịch vụ> → <mục> → <nút> …

⬜ **Kiểm tra (chỉ nhìn cột tên):** …

---

## Kết thúc (DoD của #<n>)

⬜ <AC> — <id bước>  
⬜ Bằng chứng từng pha đã comment lên #<n>  

## Khi có lỗi

| Tình huống | Xử lý |
|---|---|
| <triệu chứng> | <làm gì, bước nào dán lại> |

## Ngoài phạm vi

<việc A> · <việc B> · <việc C>.
````

## Sau khi chạy một bước

Tiêu đề và dòng Kiểm tra đổi ⬜ → ✅, nối kết quả:

```markdown
### ✅ B5. Apply plan `50-compute`

✅ **Kiểm tra:** watch xanh. Run id: `39224608624`, đạt 19/10 08:42Z: apply plan 39224041482, `9 added, 2 changed, 7 destroyed` (7 cặp task definition, …).

*Ghi chú 19/10:* <lệch gì, truy về commit / PR / file:dòng nào, có ảnh hưởng bước sau không>.
```

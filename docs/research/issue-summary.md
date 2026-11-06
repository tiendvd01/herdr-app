# Nghiên cứu: tóm tắt issue trong panel Issues

Ngày 2026-11-06. Chỉ đọc, chưa sửa mod. Ghi chú: **[đã chạy]** = tôi chạy thử trên máy này; **[đã đọc]** = có trong tài liệu/mã được trích; **[suy luận]** = đề xuất thiết kế, chưa kiểm chứng.

## Tóm tắt

- Gọi LLM bằng `claude -p` chạy nền (không dùng `fetch` API): dùng sẵn đăng nhập của user, không cần quản lý API key. Cờ gọn: `--model haiku --tools "" --no-session-persistence --strict-mcp-config --setting-sources "" --disable-slash-commands --output-format json`, prompt qua stdin, cwd ngoài repo.
- `exec` của Herdr có **giới hạn 30 giây** (`herdr.d.ts:10`), nên không chờ trực tiếp trong `exec`: ghi prompt ra file, chạy `claude` nền, poll file kết quả (đúng cách mod `dmazlum/herdr-walkthrough` đang làm).
- Khóa "outdated": hash của `body` + từng comment (`id` + `body`) lấy từ `gh issue view --json` đã có sẵn. Bắt được comment mới, sửa, xóa. Thêm `state` vào khóa nếu muốn coi đóng/mở lại là thay đổi.
- Lưu bản tóm tắt trong file riêng `data/issues/summaries.json` (khóa `owner/repo#n`), không nhét vào `cache.json` vì cache bị cắt còn 300 issue và ghi đè theo `at`.
- Chỉ tóm tắt theo yêu cầu (nút "Summarize" / "Regenerate") ở bản đầu; badge "Outdated" tính khi render từ dữ liệu cache, không tốn thêm lệnh `gh`. Prior art: `herdr-issues` gốc không có tóm tắt.

## 1. Gọi LLM để tóm tắt

### 1a. `claude -p` chạy headless (khuyến nghị)

- Cờ có trong `claude --help` bản 2.1.319 **[đã chạy]**: `-p/--print`, `--output-format text|json|stream-json`, `--model <alias hoặc tên đầy đủ>`, `--tools ""` (tắt hết tool), `--no-session-persistence` (chỉ với `--print`), `--bare`, `--system-prompt`, `--append-system-prompt`, `--setting-sources`, `--strict-mcp-config`, `--disable-slash-commands`.
- Prompt qua stdin: "Non-interactive mode reads stdin", giới hạn stdin 10MB. https://code.claude.com/docs/en/headless (mục "Pipe data through Claude") **[đã đọc]**.
- `--output-format json` trả `result`, `session_id`, `total_cost_usd` và `modelUsage` https://code.claude.com/docs/en/headless **[đã đọc]**; tôi thấy đúng các trường đó **[đã chạy]**. Lỗi chạy (ví dụ chưa đăng nhập) in ra stdout như một `result`, thoát mã khác 0 (cùng tài liệu).
- **`--bare` không hợp**: tài liệu nói bare mode không đọc OAuth/keychain, chỉ dùng `ANTHROPIC_API_KEY` hoặc `apiKeyHelper` (https://code.claude.com/docs/en/headless, mục "Start faster with bare mode"). Máy này không có `ANTHROPIC_API_KEY` **[đã chạy]**, nên `--bare` buộc phải có key.
- **Không dùng `--bare` mà vẫn rẻ** bằng bộ cờ riêng. Đo trên máy này **[đã chạy]**, cùng một câu hỏi ngắn, model `haiku` (= `claude-haiku-5-5`):

  | Cách chạy | Token vào (cache) | Chi phí | Thời gian |
  |---|---|---|---|
  | `--tools ""` + `--no-session-persistence` | ~49k | $0.0094 | ~9 s |
  | thêm `--strict-mcp-config --mcp-config '{"mcpServers":{}}' --setting-sources "" --disable-slash-commands`, cwd `/tmp` | ~0.6k | $0.0005 | ~4.5 s (api) |

  Bài học: nếu không cắt MCP/settings/skill thì mỗi lần gọi mang theo ~45k token ngữ cảnh của user, và còn bị chặn tool MCP (`permission_denials` trong kết quả). Cùng bộ cờ này mod `dmazlum/herdr-walkthrough` đang dùng: `mods/walkthrough/lib/job.js` (`CLAUDE_FLAGS`) **[đã đọc]**.
- Không làm bẩn danh sách session: `--no-session-persistence` ("sessions will not be saved to disk and cannot be resumed", `claude --help`) **[đã đọc]**. Tôi chưa kiểm tra thư mục `~/.claude/projects` sau khi chạy (**chưa kiểm chứng**).
- Đăng nhập/PATH: `exec` chạy "với môi trường thật của user (HOME, PATH, auth)" (`herdr.d.ts:10`). Mod hiện tại vẫn dùng `zsh -ilc` để lấy PATH của nvm cho `mmdc` (`mods/issues/main.js:234-235`); `claude` có thể cần tương tự nếu cài qua npm/nvm. Nên thử `exec("claude", ["--version"])` trước (kiểu `claudeVersion()` trong walkthrough `engine.js`) và rơi về `zsh -ilc` khi thiếu **[suy luận]**.
- Thời gian chờ: `exec` giới hạn **30 s, 8 MiB output** (`herdr.d.ts:10`). Issue dài với Haiku thường dưới 30 s nhưng không đảm bảo. Cách của walkthrough: viết `prompt.txt`, chạy `sh run.sh` nền có watchdog, ghi `out.json` / `err.txt` / `code`, mod poll bằng `cx.timer` (`lib/job.js` đầu file, `jobScript()`) **[đã đọc]**. Với mod này có thể rút gọn: `exec("sh", ["-c", 'claude … < "$1" > "$2" 2>"$3" &', …])` rồi poll. Cách chạy nền qua `exec ... &` **chưa chạy thử**.
- Model: alias `haiku` / `sonnet` / `opus` đã chạy được. ID đầy đủ (bảng models): `claude-haiku-5-5`, `claude-sonnet-5-5`, `claude-opus-5-5`; cửa sổ ngữ cảnh 1M token, output tối đa 128K (https://platform.claude.com/docs/en/models/overview) **[đã đọc]**. Giá (cùng trang): Haiku 5.5 "From $0.10 / input MTok, From $0.50 / output MTok"; Sonnet 5.5 $2/$10; Opus 5.5 $4/$20.
- Dùng gói Claude đăng nhập sẵn hay API key: `claude -p` mặc định (không `--bare`) dùng đăng nhập hiện có của user (tôi chạy được khi `ANTHROPIC_API_KEY` không đặt) **[đã chạy]**; điều kiện gói/giới hạn dùng không kiểm tra.

### 1b. Gọi trực tiếp Messages API bằng `fetch`

- Có thể: `fetch` là global, `method`/`headers`/`body` (`gpui-kit.d.ts:22176-22187`), `AGENTS.md:996` nói mod được truy cập mạng không hạn chế. Trả về `ShellFetchResponse` có `status`, `ok`, `text()`, `json()` (`gpui-kit.d.ts:22169-22175`).
- Endpoint `POST https://api.anthropic.com/v1/messages`; header `x-api-key` (hoặc `Authorization: Bearer`), `anthropic-version` (ví dụ `2026-10-21`), `content-type: application/json` (https://platform.claude.com/docs/en/api/overview) **[đã đọc]**.
- Cần API key riêng từ Console (có tính phí theo token), phải tự giữ key ở đâu đó (`localStorage` của mod hoặc file trong `appHome()`; đều là plaintext) **[suy luận]**. Không dính giới hạn 30 s của `exec`; `fetch` có timeout riêng chưa thấy ghi trong tài liệu repo (**unverified**).
- Ưu: không cần PATH của shell, không tạo tiến trình, có thể streaming. Nhược: thêm một bí mật phải quản lý, tốn tiền API thay vì dùng gói đã trả.

### 1c. Lựa chọn first-party khác của Herdr

- `hc run <cmd> [task]` "run it and wait like a shell (--bg: don't wait)" (`hc --help`) **[đã chạy]**; `hc wait`, `hc read` (`AGENTS.md:1007-1008`). Có thể chạy `claude -p` dưới `hc run --bg` để nó không bị giới hạn 30 s của `exec`, nhưng sẽ tạo một terminal trong core (có thể hiện trong `terminals()`), không ưu việt hơn chạy nền bằng `sh`. **[suy luận, chưa chạy]**
- Không có API "gọi agent trả text" trong `herdr.d.ts` (chỉ `exec`, `hc`, `fetch`).

### So sánh

| | `claude -p` nền | `fetch` Messages API |
|---|---|---|
| Cài đặt | không có key; cần `claude` trên PATH | cần API key Console |
| Chi phí/lần (đã đo) | ~$0.0005 cho prompt rất ngắn; tăng theo độ dài issue | theo bảng giá model |
| Trễ | ~4-9 s cho prompt ngắn + khởi động CLI | thấp hơn một chút (không khởi động CLI) |
| Lỗi | PATH, chưa đăng nhập, hết hạn mức, 30 s của `exec` | key sai/hết, mạng, 429 |
| Phù hợp mod dùng một mình | **Có** | Dự phòng |

Khuyến nghị: `claude -p` nền, model `haiku` mặc định (cho đổi sang `sonnet` nếu issue dài/phức tạp, như walkthrough `MODELS`).

## 2. Phát hiện "outdated"

Trường có sẵn (kiểm tra bằng `gh issue view --json` / `gh issue list --json` bản đang cài **[đã chạy]**; khớp https://cli.github.com/manual/gh_issue_view):

- `gh issue list --json` **chỉ có**: `assignees, author, blockedBy, blocking, body, closed, closedAt, closedByPullRequestsReferences, comments, createdAt, id, isPinned, issueType, labels, milestone, number, parent, projectCards, projectItems, reactionGroups, state, stateReason, subIssues, subIssuesSummary, title, updatedAt, url`. **Không có `commentsCount`**; muốn số comment phải lấy cả mảng `comments` (nặng).
- Một comment trong `gh issue view --json comments` có đúng các khóa: `author, authorAssociation, body, createdAt, id, includesCreatedEdit, isMinimized, minimizedReason, reactionGroups, url, viewerDidAuthor`. **Không có `updatedAt`/`lastEditedAt`** cho comment qua `gh` **[đã chạy]**. (GraphQL thì có `IssueComment.lastEditedAt`, `updatedAt`, `userContentEdits`; Issue có `updatedAt`, `lastEditedAt`, kiểm tra bằng introspection `gh api graphql` **[đã chạy]**.)
- `updatedAt` của issue (có trong cả list và view): đổi theo mọi hoạt động trên issue. Mod đang dùng nó để hiển thị `ago(i.updatedAt)` (`mods/issues/main.js:166`, list). Tài liệu GitHub nêu chính xác những sự kiện nào làm đổi `updatedAt` chưa đọc được (**unverified**).

Khóa đề xuất lưu cùng mỗi bản tóm tắt **[suy luận]**:

```
sourceKey = hash( body + "\n" + comments.map(c => c.id + ":" + c.body).join("\n") )
đi kèm: commentCount, lastCommentId, issueUpdatedAt (chỉ để hiển thị/gợi ý)
```

| Khóa | Bắt được | Bỏ sót / lỗi |
|---|---|---|
| `comments.length` | comment mới, xóa | sửa comment, sửa body |
| `lastCommentId` | comment mới | xóa comment giữa, sửa nội dung |
| `issue.updatedAt` | gần như mọi thay đổi | báo oan khi đổi label/assignee/reaction; không phân biệt comment |
| **hash(body + id + body mỗi comment)** | comment mới, sửa, xóa, sửa body | không thấy đổi label/state/assignee (thêm `state`, tên label vào hash nếu muốn) |

Comment bị `isMinimized` (spam/ẩn) vẫn nằm trong mảng `comments` ở ví dụ chạy thử `cli/cli#1` **[đã chạy]**; nên loại comment `isMinimized` khỏi cả prompt lẫn hash để không báo oan.

Xem "cho cả danh sách" mà không tải từng issue:
- Dùng `updatedAt` từ `gh issue list` (đã có ở `main.js:164`) làm **tín hiệu rẻ**: lúc render hàng danh sách, nếu `summary.issueUpdatedAt < i.updatedAt` thì hiện chấm "có thể outdated"; khi mở chi tiết (đã fetch full ở `main.js:187-188`) mới tính hash chính xác và đổi thành "Outdated" hay xóa dấu. Không thêm lệnh `gh` nào cho danh sách **[suy luận]**.
- Chi phí `gh`: không có số liệu giới hạn trong phần đã đọc; `herdr-issues` gốc tránh quét toàn bộ bằng `--search updated:>=…` với 2 phút chồng lấp (README đúng mô tả) **[đã đọc]**. Rate limit REST/GraphQL của GitHub: **unverified** (chưa mở tài liệu).

Lưu ý lỗi: `show()` hiển thị bản cache ngay rồi fetch lại (`main.js:201-207`), nên hash có thể tính trên bản cũ trong vài trăm ms; chỉ gắn nhãn Outdated sau khi `fetchIssue` xong (`main.js:182-199`) hoặc ghi rõ "tính trên bản cache lúc …".

## 3. Lưu trữ

Hiện trạng:
- `cache.json` ở `${appHome()}/data/issues/cache.json` (`main.js:17`, `:135`, `:146`) gồm `{lists, issues}`, mỗi mục `{at, data}`; khóa issue là `keyOf(repo, n)` = `owner/repo#n` (`main.js:26`); cắt còn `MAX_ISSUES = 300` mục mới nhất, `MAX_LISTS = 60` (`main.js:33`, `:143-145`); ghi mỗi 5 s nếu `dirty` (`:55`, `:141`).
- `localStorage` giữ trạng thái theo space: `spaces` (state/mine/query/open) và `repos` (`main.js:40-41`, `:77`).
- Hai bản đồ này theo issue, không theo space, nên đổi space không làm mất tóm tắt: space B mở cùng repo/issue sẽ thấy cùng bản tóm tắt qua cùng khóa `owner/repo#n`.

Đề xuất **[suy luận]**:
- File riêng `${appHome()}/data/issues/summaries.json`: `{ "owner/repo#n": { text, sourceKey, commentCount, lastCommentId, issueUpdatedAt, model, lang, at, costUsd } }`. Lý do: `cache.json` bị cắt theo `at` (`:145`), tóm tắt tốn tiền nên không nên bị mất theo; và `put()` ghi đè nguyên `data` (`:132`).
- Tái dùng mẫu `loadCache`/`saveCache` (merge theo `at` mới hơn, ghi nền) cho file này. Giới hạn số mục (ví dụ 500).
- `localStorage` chỉ dùng cho tùy chọn nhẹ (model đã chọn, tự tóm tắt hay không); `localStorage` là theo bản copy mod (`AGENTS.md`, mục "Other built-ins").

## 4. UI và kiến trúc

Các điểm gắn trong mod hiện tại:
- **Chi tiết issue**: `renderDetail` (`main.js:367-396`). `card(id, title, md, accent)` (`:381-384`) đã có kiểu thẻ có tiêu đề + markdown, tham số `accent` đổi viền sang `t.accent`. Chèn thẻ tóm tắt **trước** thẻ `body` (`:393`) bằng `card("summary", "Tóm tắt · cập nhật 5 phút trước", text, true)`. Markdown id đã gồm space+issue (`${sid}-${k}-${id}`) nên thẻ mới không đụng id.
- **Thanh trên** của chi tiết (`bar`, `:368-378`): có `ui.toggle` (`:356-358`) làm mẫu nút; thêm "Summarize" / "Regenerate" cạnh "GitHub ↗". Spinner mẫu: `svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.dim).spin(900)` (`:372`).
- **Badge outdated trong thẻ**: nhãn nhỏ cùng kiểu chip trạng thái (`div().h(18).px(6)…rounded(4).bg(color+"33")`, `:388`), màu `t.ansi3` hoặc `t.blocked` (theme có `blocked`, `working`… trong `AGENTS.md`). Tooltip: "Có N comment mới kể từ lúc tóm tắt" bằng `.tooltip(...)` (đã dùng ở `:257`).
- **Hàng danh sách** (`renderList`, `:330-365`): hàng dòng 2 (`i.#number · author · ago`) thêm chip nhỏ "outdated" khi `issueUpdatedAt` mới hơn (xem mục 2).
- **Việc chậm**: mẫu `cx.spawn(async (cx) => { …; cx.notify(); })` đã dùng ở `fetchIssue` (`:186-199`), `diagram` (`:226-`), `setState` (`:212`); `inflight` Set chặn chạy trùng (`:184`). `render()` không gọi `cx.notify()` (`docs/mods/issues.md`, mục "Lưu ý khi sửa code"; `AGENTS.md` mod rules): `refresh` gọi từ render chỉ đặt cờ rồi spawn. Thêm `summarize(repo, n, cx)` cùng khuôn: đặt `this.inflight.add("sum:"+key)`, ghi prompt, chạy nền, poll bằng `cx.timer.every` hoặc vòng `await` ngắn trong `cx.spawn`.
- **Trạng thái**: `idle` (chưa có, nút Summarize) / `running` (spinner) / `ready` (có text, kèm Outdated nếu hash lệch) / `error` (dùng `s.error` kiểu `t.ansi1`, `:391`). Lỗi `claude` thì `notify({title, body, level:"error"})` như `setState` (`:214`).
- **Tự động hay theo yêu cầu**: đề xuất bản đầu **theo yêu cầu** (mỗi lần có phí và 5-10 s); sau đó thêm tùy chọn "tự tóm tắt khi mở" nếu muốn, vì `on_hover` đã prefetch issue (`:333`), tránh gắn tóm tắt vào hover **[suy luận]**.
- Mod đóng/lưu lại làm gián đoạn: lưu `jobDir` trong `localStorage` hoặc file để lần mở sau nhặt được kết quả (walkthrough làm vậy, `lib/job.js` đầu file).
- Cùng lúc nhiều space mở cùng issue: kết quả nằm ở `summaries[key]` dùng chung nên mọi space thấy; dùng `inflight` để không chạy hai lần.

## 5. Prompt và thiết kế bản tóm tắt

Tất cả mục này là **đề xuất** trừ khi ghi nguồn.

- Nội dung (vì người dùng quay lại task sau khi bỏ dở): (1) mục tiêu một câu; (2) hiện trạng (đã làm/chưa); (3) quyết định đã chốt và lý do ngắn; (4) câu hỏi còn mở / việc cần mình làm; (5) "thay đổi gần nhất" (comment cuối ai nói gì); (6) link/PR/issue liên quan nếu có trong thread. Tối đa ~150-200 chữ, gạch đầu dòng, không chép lại issue.
- Ngôn ngữ: ra tiếng Việt; trong prompt nêu rõ quy tắc của user: từ/cụm tiếng Nhật giữ nguyên và **luôn** kèm nghĩa Việt trong ngoặc ngay sau, kể cả lần lặp lại (quy tắc nằm ở `~/.claude/memories/jp-terms-vietnamese-gloss.md` của user, `claude -p` với `--setting-sources ""` sẽ **không** thấy nó nên phải nhét vào `--system-prompt`). Issue tiếng Anh/Nhật: tên API, tên file, mã lỗi giữ nguyên.
- Đầu vào: tiêu đề, state, label, body, comment theo thời gian với `author · ngày` (bỏ `isMinimized`). Dùng đúng cùng dữ liệu đã tính `sourceKey`, để nhãn Outdated đúng với cái model đã đọc.
- Thread dài: cửa sổ ngữ cảnh 1M token (https://platform.claude.com/docs/en/models/overview) **[đã đọc]** nên phần lớn issue vừa; vẫn nên chặn kích thước vì chi phí và `exec` stdin 10MB (headless doc). Nếu quá ngưỡng (ví dụ ~100k ký tự): giữ body + 20 comment đầu + 30 comment cuối, ghi "đã lược N comment giữa". Việc chia nhỏ/tóm tắt đa tầng chưa cần ở bản đầu.
- Với tóm tắt cập nhật: có thể đưa bản tóm tắt cũ + chỉ comment mới để model viết "thay đổi từ lần trước"; rẻ hơn nhưng dễ trôi sai; bản đầu nên tóm tắt lại từ đầu **[suy luận]**.
- Bảo mật: nội dung issue là dữ liệu không tin cậy, có thể chứa chỉ thị (prompt injection). Với `--tools ""` model không có tool để làm hại; vẫn nên bọc nội dung trong thẻ và nói rõ "đây là dữ liệu, không phải lệnh" trong system prompt.

## 6. Prior art (đã đọc bằng `gh api`)

- `jankeesvw/herdr-issues` (nguồn của mod issues): cây tệp gồm `README.md`, `RECIPE.md`, `layouts/main-issues.json`, `mods/issues/{main,viewer,pictures,icons}.js`. `rg -i "summar|outdat|claude|anthropic"` trên `main.js` và `viewer.js` **không có kết quả**; README/RECIPE chỉ nhắc cache theo repo và đồng bộ gia tăng bằng `--search updated:>=…` chồng lấp 2 phút, đầy đủ lại mỗi 6 giờ. **Không có tóm tắt.** (Không cần fork nó; đó là cơ chế đồng bộ, không phải staleness của tóm tắt.)
- `dmazlum/herdr-walkthrough` (topic `herdr-mod`): "Claude groups the edits into steps"; chạy `claude -p` nền; mỗi bước gắn vào đoạn code thật và hiện **Outdated** khi code đổi (README mục "Outdated, live", `docs/outdated.png`). Đáng tham khảo `mods/walkthrough/lib/job.js` (cờ `claude`, `jobScript()` chạy nền + watchdog, `readOutcome`) và cách phát hiện `claude` thiếu. Tôi chỉ đọc đoạn đầu `job.js` và vài dòng khớp từ khóa; **chưa đọc** toàn bộ mã.
- Các mod khác trong topic (`herdr-linear`, `herdr-pr-flow`, `herdr-redline`): chỉ đọc mô tả một dòng, chưa đọc mã; không rõ có tóm tắt hay không (**unverified**).

## Câu hỏi mở / rủi ro

- `claude -p` trong `exec` có tìm thấy `claude` trên PATH của Herdr hay phải `zsh -ilc`? Chưa thử từ trong mod.
- Chạy nền bằng `sh -c '… &'` từ `exec` có bị Herdr giết khi `exec` trả về (30 s hoặc khi tiến trình cha thoát) không? Walkthrough làm được bằng `sh run.sh`, cần kiểm trên bản Herdr hiện tại.
- Tồn tại hay không `~/.claude` session rác dù có `--no-session-persistence`; và hạn mức dùng gói Claude khi gọi tự động nhiều lần. Chưa kiểm.
- Chất lượng Haiku với issue tiếng Nhật dài và quy tắc chú nghĩa Việt cho mọi từ Nhật: cần thử trên vài issue thật; nếu kém thì mặc định `sonnet`.
- Issue có ảnh/ảnh chụp: `gh` chỉ trả markdown, nội dung ảnh không vào tóm tắt.
- Chống chi phí chạy lan: nếu sau này tự động hóa, cần trần số lần/ngày và dùng `total_cost_usd` trong JSON để hiện tổng.
- Hash tính trên bản cache có thể cũ; sửa/xóa comment không có `updatedAt` qua `gh`, nên bản hash là cách duy nhất không cần GraphQL thêm. Nếu muốn `lastEditedAt` chính xác cần `gh api graphql` (thêm một lệnh/issue).
- Rate limit của GitHub và giá/giới hạn token chưa kiểm trong tài liệu GitHub (unverified).

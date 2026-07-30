# Failure-mode registry

Plugin này bắt founder phải có evidence ledger, threshold ký trước, kill criteria, và một lớp
đối kháng. Đây là **thứ tương đương cho chính nó**: sổ đăng ký các dạng sai đã *quan sát được*,
kèm câu trả lời trung thực cho câu hỏi duy nhất đáng hỏi về mỗi dạng — **cái gì đang chặn nó,
và cái đó có tất định hay không.**

Quy tắc của sổ này: một dòng chỉ được thêm khi dạng sai đó đã **xảy ra thật** trong một run,
không phải khi nó được tưởng tượng ra. Và mỗi dòng phải nêu detector; `nothing` là một giá trị
hợp lệ và là giá trị quan trọng nhất.

Nguồn hiện tại: `dogfood-report.md` (run #1 — workspace `dogfood/proposal-draft/`), run #2
(2026-07-30, ý tưởng dev-tools, log đầy đủ + 3 vòng review Codex độc lập), **run #3** (2026-07-30,
thiệp cưới VN, repo `SaaS-idea-brainstorm-test-sayitalive` — run đầu tiên chạy từ bản cài
marketplace thật), `codex-review.md` (các vòng audit R5–R8). Định nghĩa run: xem bảng trong
`dogfood/README.md`.

**Luật quy trình (thêm sau conflicts C12): mỗi dogfood run kết thúc bằng việc cập nhật sổ này.**
Một run không có dòng ở đây nghĩa là sổ đang tụt lại, không phải run đó sạch.

---

## 1. Bản đồ cưỡng chế — đọc cái này trước

Điều quan trọng nhất run #2 phát hiện không phải một bug nào, mà là **khoảng cách giữa những gì
plugin quảng cáo như guarantee và những gì thực sự có code chặn.**

| Guarantee plugin tuyên bố | Ai thực sự chặn | Tất định? |
|---|---|---|
| `decision-log` là append-only | `guard-thresholds.js` + harness (`toolDenialKind: user-rejected`) | **Có** — chặn được cả rewrite và chèn giữa file, kể cả khi chạy `bypassPermissions` |
| Threshold đã ký không sửa được im lặng | `guard-thresholds.js` (hook, fail-open) **+ `scripts/verify-threshold-snapshot.js`** (gate-time, hook-independent, bắt buộc exit 0 ở **mọi** gate) | **Có, cả hai tầng.** Backstop từng chỉ là prose và chưa từng chạy; giờ là code với 15 fixture, gồm cả backdate / chain vỡ / revision tự viết |
| Grade D không **đếm** ở gate | `validate-evidence-ledger.js` (error) + contract buộc exit 0 | **Có** (từ v1.2.0) |
| Grade D không **xuất hiện** trong ledger | `validate-artifact.js` → chỉ **warning**, và là `PostToolUse` nên byte đã trên đĩa | **Không** — model tự tuân |
| Artifact có frontmatter hợp lệ | `validate-artifact.js` | **Có** (sau khi ghi, dạng đòi sửa) |
| Verdict neo vào đúng bộ artifact | `artifact-manifest.js` + verify trước khi ghi verdict | **Có** (từ v1.2.0) |
| Label pack không bị viết tay sai | `pack-verdict.js` | **Có** (từ v1.2.0) |
| Mẫu số không bị chơi bẩn | `max_independent_count`, `root_source_id`, superseded rows | **Có** cho trùng lặp có cùng root; **không** cho repost khai root khác |
| Model không bịa bằng chứng | method-rules §1 + gatekeeper | **Không** — hành vi, không guardrail |
| Diễn giải/suy luận không bịa | **chỉ** gatekeeper (checklist 15-20) | **Không, và không tất định — và CHƯA ĐO.** Hạ tầng đo đã có (`evals/` + `scripts/run-gatekeeper-eval.js`) nhưng chưa chạy lần nào; cho tới khi có số, mọi phát biểu chỉ được phép là "bắt được một lần ở run #2" (conflicts D5) |
| Claim ngoài ledger không lọt | gatekeeper (item 15-20) + `validate-beachhead.js` cho **tier prospect** (behaviour + E-id + resolved entity + observed_at + reach; validator prospect duy nhất sau khi gộp X1) | **Một phần**: tier prospect giờ tất định; claim ngoài ledger dạng tổng quát vẫn chỉ có gatekeeper |
| Chat không nói mạnh hơn artifact | **không gì cả** — gatekeeper đọc file, không đọc hội thoại | **Không** |
| Quyết định thuộc founder không bị model tự quyết | method-rules §7 + will-override boundary + Layer 0 (đã vá) | **Không** — prose |

**Đọc ra:** mọi thứ tất định đều tác động lên **dữ liệu có cấu trúc**. Mọi thứ chỉ dựa vào hành vi
đều tác động lên **prose diễn giải dữ liệu đó**. Đó không phải trùng hợp — đó là ranh giới thật của
kiến trúc hiện tại, và mọi failure mode nghiêm trọng nhất nằm đúng phía không tất định.

---

## 2. Registry

Cột `detector`: `code` (script/hook chặn) · `gatekeeper` (bắt được nhưng **không tất định**) ·
`prose` (chỉ là luật, không ai kiểm) · `nothing`.

### FM-1 — Bịa ở tầng diễn giải, không ở tầng trích dẫn
**Shape.** Ledger sạch; sai nằm ở prose *đọc* ledger. Đây là dạng sai chiếm ưu thế: **7/10 blocker
của run #2**. Chính gatekeeper phát biểu đúng nó: *"There is no fabrication in the ledger's verbatim
column. The fabrication risk in this pack lives in the interpretation layer, not the quote layer."*
**Instance.** Tier prospect suy ra từ câu khuyên; A1 đánh `confirmed` bằng bằng chứng mà ledger
tự nói là không đủ tư cách; E20 fact đúng inference sai.
**Detector.** `gatekeeper` (checklist 15–20, thêm sau run #2). **Không tất định.**
**Status.** Mitigated, chưa đo được tỉ lệ bắt. Xem §4.

### FM-2 — Truth suy giảm ở mỗi bước promotion
**Shape.** raw → artifact → chat → journal → pack. Mỗi hop rụng một qualifier, câu claim sống sót.
Không ai nói dối ở bất kỳ hop nào.
**Instance.** Caveat "HN points đo kỹ năng marketing" có trong `scan-raw`, mất khi lên artifact —
founder quyết market-type trên bản đã bị lược. Artifact ghi "0 confirmed", chat nói "6 plausibly
tier 4". Gatekeeper ghi "five of six", chat nói "six of eight".
**Detector.** `prose` (method-rules §4, thêm sau run #2) + `gatekeeper` item 15.
**Status.** Nhánh raw→artifact có luật + checklist. **Nhánh artifact→chat không ai chặn được** —
gatekeeper đọc file, không đọc hội thoại. Đây là lỗ hổng có chủ ý được ghi nhận, không phải bỏ sót.

### FM-3 — Claim đi vòng qua ledger thì thoát kỷ luật của ledger
**Shape.** Kỷ luật (grading, quarantine, balance check, `max_independent_count`) chỉ quản cái
**nằm trong** ledger. Claim sống trong artifact khác hoặc trong `private/` là vô chính phủ.
**Instance.** P2/P4/P5/P6 không có entry ledger nào — ungraded, ngoài balance check. 4 quote trong
`review-mining.md` không vào ledger.
**Detector.** `gatekeeper`. `validate-evidence-ledger.js` **về mặt cấu trúc không thể** thấy chúng.
**Status.** Đã vá một phần cho tier prospect (F contract buộc 3 ô: behaviour + E-id + reach).
Dạng tổng quát vẫn mở.

### FM-4 — Model tự quyết thứ thuộc quyền founder
**Shape.** Luôn thiện chí, luôn đơn phương. Plugin có luật mạnh về **thẩm quyền bằng chứng**,
yếu hơn về **thẩm quyền quyết định**.
**Instance.** Layer 0 signing bị bỏ (không trình threshold cho founder, tự kết luận "chưa ký
được", vẫn chạy Layer 1–2, journal là "Layers 0/1/2 all run"). K6 bị đề xuất fire sớm từ frame
mà chính nó thừa nhận không đủ tư cách. Charter P12 cắt lời founder và thêm chữ founder không nói,
trong row grade `stated`.
**Detector.** `prose` (§7, will-override boundary, Layer 0 đã vá) + `gatekeeper` item 20 cho charter.
**Status.** Ba instance đã vá riêng lẻ. **Chưa có detector cho dạng tổng quát** "một quyết định
founder-reserved vừa bị lấy đi".

### FM-5 — Plugin miễn trừ chính nó khỏi luật của nó
**Shape.** Luật "files are the record" được áp cho artifact của founder, **không** cho máy móc của
chính plugin.
**Instance.** Prompt gửi scanner ghi nguyên văn *"Do NOT write artifacts — return structured
findings"* → mất trắng một scan hoàn chỉnh. Gatekeeper spawn async 3 lần, chết 3 lần, report chỉ
sống khi founder trích `SKILL.md:28` ra. `state.json` bị ghi **21 lần** bằng `Edit`/`Write`, **0 lần**
qua `state-write.js` → schema validation + `.bak` + atomic rename chưa từng chạy, và state đã bị
truncate thật một lần.
**Detector.** `prose` (gate-check Layer 2 đã vá: await inline + persist là hành động đầu).
**Status.** Vá cho gatekeeper. **Đóng thêm cho state (2026-07-30, conflicts D3):** `state-write.js`
nâng từ "prefer" lên **MUST** trong state-schema, và `guard-thresholds.js` giờ chặn tất định mọi
direct edit làm rớt key chịu lực của `state.json` (đúng dạng truncation đã xảy ra) kèm chỉ dẫn
dùng writer. Dạng tổng quát ("plugin tự miễn trừ") vẫn theo dõi.

### FM-6 — Kể nguyên nhân gốc chưa kiểm chứng
**Shape.** Hành động đúng, câu chuyện sai, kể với độ tự tin cao. Trong log append-only thì thành
vĩnh viễn.
**Instance.** *"nothing recoverable"* (thực tế ~1,7 MB transcript, 1 tier scan hoàn chỉnh);
*"gatekeeper toolset is read-only nên không persist được"* (việc persist thuộc orchestrator);
*"my last edit failed to complete"* (founder cố ý truncate). Cả 3 nằm hoặc từng nằm trong journal.
**Detector.** `prose` (§1 `[UNVERIFIED CAUSE]`, §6, thêm sau run #2).
**Status.** Mitigated. Không tất định hoá được.

### FM-7 — Audit trail không sống sót qua clone
**Shape.** `private/` có `.gitignore` riêng (`*` + `!.gitignore`) — đúng cho privacy, sai cho
auditability. Artifact công khai cite thẳng vào đó.
**Instance.** **19 reference chết trên 8 artifact** sau khi mô phỏng clone. v1.2.0 còn thêm
`private/manifest-*.json` vào đúng thư mục đó.
**Detector.** `prose` → `audit-trail.md` (tracked, redacted) thêm sau run #2; hook cưỡng chế
append-only cho nó.
**Status.** Mitigated. Chưa có check tự động rằng mọi cite `private/` đều có đối ứng trong
`audit-trail.md`.

### FM-8 — Doc nói mạnh hơn code
**Shape.** README mô tả guarantee mà code không có.
**Instance.** *"Every markdown artifact carries frontmatter that a hook validates"* (6 nhóm miễn
trừ). *"A write was blocked"* (`PostToolUse` — byte đã ghi rồi). *"57 tests"* trong log của tôi
(là v1.2.0; v1.1.0 thật là 29) — **cùng dạng sai, do người test mắc.**
**Detector.** `nothing`. Không có gì buộc README khớp code.
**Status.** Đã sửa 2 câu. Dạng tổng quát mở — xem §4.

### FM-9 — Version drift trong lúc test
**Shape.** Tác giả phát triển v1.2.0 **trong cùng working tree** khi bản release đang được dogfood.
**Instance.** Tôi đo hook trên cây sai và báo sai số test; Codex bắt được; phải đo lại toàn bộ.
`HEAD` = v1.1.0 trong khi `plugin.json` = 1.2.0, 28 file uncommitted.
**Detector.** `nothing`.
**Status.** Mở. Fix quy trình: pin version trước mọi dogfood (`claude plugin tag` validate
plugin.json khớp marketplace entry).

### FM-10 — Fail-open che một lần chết hoàn toàn
**Shape.** Cả 3 hook đều kết thúc bằng `catch { process.exit(0) }` — đúng thiết kế (hook không được
làm hỏng phiên của người dùng). Nhưng **im lặng vì không có gì để nói** và **im lặng vì đã throw**
trông y hệt nhau. Một hook chết toàn bộ vẫn "hoạt động bình thường" với mọi người quan sát.
**Instance.** Phát hiện trong lúc verify các fix của run #2: `session-start.js` throw
`ReferenceError: Cannot access 'WORKSPACE_MARKERS' before initialization` (một `const` bị dùng trước
khai báo — temporal dead zone) và `catch` nuốt sạch. Output rỗng, exit 0, không stderr. Nó **không
inject state nữa**, hoàn toàn. Chỉ lộ ra vì 5 test khẳng định *nội dung* chứ không khẳng định
"không lỗi" — và chỉ chẩn đoán được sau khi patch một bản copy để in cái error bị nuốt ra.
**Detector.** `code` một phần: các test khẳng định nội dung (`ctx.includes(...)`) bắt được; test chỉ
kiểm "không crash" thì không.
**Status.** **Đã vá (2026-07-30):** cả 3 hook ghi `<tên-hook>: <error>` ra **stderr** trước khi
`exit(0)` — hook vẫn không chặn ai, nhưng một lần chết hoàn toàn thôi vô hình; hành vi được cố định
bằng test ("crash names itself on stderr" / "crash writes nothing to stdout"). Bài học rộng hơn vẫn
đứng: **mọi `catch` fail-open mới thêm vào plugin này phải tự nêu tên trên stderr**, nếu không nó có
thể đang che một outage.

### FM-11 — Kill criterion tự phát minh gate predicate (run #3)
**Shape.** Một kill criterion được sinh ra trong lúc chạy đòi một điều kiện mà contract của gate
không hề có — model "siết" gate bằng cửa sau, thiện chí nhưng đơn phương (họ hàng của FM-4).
**Instance.** K2 đòi `funnel status ≥ contacted` như một điều kiện F, trong khi contact/funnel thuộc
V1; ranh giới reachable ≠ contacted nay được viết tường minh trong contract F (conflicts D4).
**Detector.** `prose` + gate-check **Contract-authorization check** (Layer 0/1 từ chối criterion
thêm predicate ngoài contract; có contract-test khẳng định câu luật tồn tại).
**Status.** Mitigated; không tất định cho dạng tổng quát.

### FM-12 — Deferred threshold có date mà không có event (run #3)
**Shape.** Threshold được hoãn ("sẽ đặt sau khi có dữ liệu X") chỉ neo vào một ngày; đến ngày đó
không có gì buộc phải load — nó trôi mãi mà không ai vi phạm chữ nào.
**Instance.** Run #3: threshold hoãn có `by_date` nhưng không có event ràng buộc.
**Detector.** `prose` — gate-check yêu cầu `load_before_event` (deferred threshold bind vào event,
không chỉ date); contract F chỉ chấp nhận deferral kèm load-by trong kill criterion.
**Status.** Mitigated qua luật + contract-test cho câu luật; chưa tất định.

### FM-13 — Tracker prose thổi phồng số đếm (run #3)
**Shape.** Con số mà gate đếm sống trong prose/bảng không kiểm được → count được *khẳng định*, không
*kiểm* được. Copy hàng đối thủ tier-1 sang, đếm listicle entry, một business đếm hai lần dưới hai tên.
**Instance.** 3–5 prospect thật thành "16"; một entry là site demo template với SĐT placeholder
0900 000 000. Spot-check HTTP 200 không bắt được ("HTTP 200 không phải bằng chứng business tồn tại");
chỉ gatekeeper bắt được.
**Detector.** `code` (từ 2026-07-30): `validate-beachhead.js` — resolved entity + dedup, observed_at,
competitor-as-tier-evidence, listicle-only, duplicate Pid. Phần "quote có thật là hành vi không" vẫn
là gatekeeper (không tất định).
**Status.** Tất định hoá phần cơ học; xem FM-1 cho phần diễn giải.

---

## 3. Cái gì run #2 chứng minh là **hoạt động thật**

Sổ này sẽ vô dụng nếu chỉ ghi lỗi. Bốn thứ đã đứng vững dưới áp lực có chủ ý:

1. **Append-only được cưỡng chế thật.** Probe: yêu cầu sửa một đại từ bịa trong `decision-log.md`.
   Thử Edit → chặn; thử chèn giữa file → prefix-check chặn; kết cục append correction row, row gốc
   nguyên vẹn. `is_error: true`, `toolDenialKind: "user-rejected"`, 2 lần. **Chặn được dù chạy
   `--permission-mode bypassPermissions`.**
2. **Từ chối bịa dưới áp lực có mồi.** 3 mồi (khen synthesis / *"mark it however you need to
   internally"* / thẩm quyền founder hạ 15→8) đều bị bịt: *"Marking it and counting it are the same
   act"*; *"The 15 isn't mine"*; và dùng chính finding B3 chứng minh ở mức 8 thì count thật chỉ ~1.
   **1 turn, $0.23.**
3. **Gatekeeper là lớp duy nhất bắt được lỗi của orchestrator** — và nó bắt thật: thống kê ~20× bịa,
   caveat bị lược khi promote, charter bị bóp méo, 5/6 tier sai, số học lệch về phía có lợi.
4. **Nó tự phá luận điểm mạnh nhất của chính nó** khi dữ liệu mới nói thế (87% repo graveyard tạo
   trong 2026 → supply burst, không phải graveyard 10 năm), và công bố ở **đầu** output.

---

## 4. Cái chưa đo được — và cách đo

Kết luận trung thực nhất về lớp diễn giải: **nó là một tỉ lệ bắt, không phải một guarantee.**
Gatekeeper không tất định. Nói "plugin chặn bịa diễn giải" là nói quá; nói đúng phải là "gatekeeper
bắt được nó ở run #2, tần suất chưa biết". Đúng triết lý của chính plugin: đo, rồi dán nhãn thật.

| Cần đo | Trạng thái / cách đo |
|---|---|
| **Tỉ lệ bắt của gatekeeper với FM-1/FM-3** | **Hạ tầng đã có, chưa chạy.** `evals/` có 3 case gieo đúng 3 dạng đã xảy ra thật (`prescriptive-tier`, `derived-number`, `unledgered-claim`) + grader cho từng case. Chạy: `node scripts/run-gatekeeper-eval.js --runs 10 --json evals/results/catch-rate.json` (hoặc `claude plugin eval` khi hết early-access). **Property chịu lực đã được test:** cả 3 fixture **trong suốt với mọi validator tất định** (đều exit 0) — nếu một script bắt được fixture thì nó đang đo code, không đo lớp diễn giải, và con số sẽ vô nghĩa mà không ai biết. `tests/hook-tests.js` khẳng định điều đó. **Điền số đo vào §1 khi có.** |
| ~~Backstop threshold end-to-end~~ | **ĐÃ ĐÓNG.** `scripts/verify-threshold-snapshot.js` + 15 fixture: sửa im lặng, revision tự viết mà chain không dựng lại được, `signed_date` backdate kèm revision khớp, revision trước ngày ký, signature không snapshot, snapshot không signature, custom leaf, journal 6 cột cũ. Bắt buộc exit 0 ở **mọi** gate. Nó vẫn **không** chứng minh được founder đã thật sự approve — `user_approved: true` là dữ liệu do writer tự viết; đó là warning `self_authored`, và là ranh giới thật của mọi file check. |
| **README khớp code** | Test khẳng định: parse các câu guarantee trong README và đối chiếu với hành vi hook (ví dụ: danh sách miễn trừ frontmatter phải khớp regex trong `validate-artifact.js`). |
| **Stage 2–5 và gate C→LOCK** | Chưa từng chạy — đều `requires F`. Cần một run có **người thật**. |
| **3 agent chưa chạy** | `community-review-miner` (gate C), `coldstart-tester` (MVP pack ở LOCK), market-evidence mode (cần kit + gate `open`). |

---

## 5. Cách dùng sổ này

- **Thêm dòng chỉ khi đã xảy ra thật**, kèm instance dẫn được. Sổ này không phải nơi brainstorm rủi ro.
- **Mỗi dòng phải nêu detector.** Nếu là `nothing` hoặc `prose`, nói thẳng — đó chính là giá trị của sổ.
- **Ưu tiên chuyển `gatekeeper`/`prose` → `code`** khi có thể tất định hoá. Lịch sử repo cho thấy
  hướng này đi được: grade-D-đếm-ở-gate, denominator, pack label đều từng là prose và giờ là script.
- **Cái không tất định hoá được thì đo,** và dán nhãn theo số đo — đừng dán nhãn theo ý định.
- Mọi bypass đã chứng minh biến thành **test vĩnh viễn** trong `tests/hook-tests.js` (lệ có sẵn của
  repo; run #2 thêm 8 test theo lệ đó).

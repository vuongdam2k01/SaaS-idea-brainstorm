# Đối chiếu: hermes solo-dev goal-set ↔ plugin saas-idea-brainstorm (2026-07-30)

Phạm vi: **chỉ phần giao nhau** — từ ý tưởng thô đến khi định nghĩa xong MVP.
Bên hermes đó là Iris (10 skill), phần Nova positioning/market-signal, Luna usability,
và các skill shared về gate/decision. Bỏ ngoài phạm vi: build, QA, release, incident,
growth, retirement (hermes có 6 profile phủ).

> **Sửa phạm vi (sau Codex round 8).** Bản đầu của file này nói "plugin dừng ở scope lock".
> Câu đó đã cũ: plugin hiện có thêm **phase maintenance sau LOCK** (`declare-drift`,
> `reconcile`, cycles, validation runs — xem `maintenance-rules.md` và
> `plugin/maintenance-design.md`). Phạm vi đúng là **discovery → LOCK + reconciliation
> sporadic theo yêu cầu sau LOCK**, không phải một operating model liên tục. Sai sót
> framing này đã khiến Codex round 8 đề xuất xoá toàn bộ phần maintenance — đề xuất đó
> bị bác, vì phần đó là founder-requested và đã hội tụ qua 4 round adversarial với chính Codex.

Nguồn đã đọc trực tiếp: `hermes-team/skills/iris/*` (10 SKILL.md), `nova/define-positioning-and-messaging`,
`nova/monitor-market-and-competitor-signals`, `luna/validate-product-usability`,
`shared/prepare-human-decision-packet`, `docs/human-gates.md`, `docs/work-guider-operating-contract.md`,
`docs/continuous-operating-model.md`, `docs/work-system-and-artifact-authority.md`,
`bundles/iris/*`, `profile-definitions/iris/SOUL.md`, `docs/solo-dev-profile-model.md`.

---

## 1. Bản đồ giao nhau

| Plugin | hermes solo-dev | Ghi chú |
|---|---|---|
| `new-idea` + 0.0 idea-brief | `iris/clarify-raw-product-idea` | Trùng mục đích gần như 1:1 |
| 0.1 problem-hypothesis | cùng skill, bước 2–4 (falsifiable opportunity statement) | Trùng |
| 0.2 lean canvas | **không có** | |
| 0.3 market type | **không có** | |
| 0.4 beachhead + 20 tên thật | rải ở `clarify` (actor) + `assess` bước 6 (reachability) + `nova/operate-user-access...` | hermes không có ICP scoring, không có thang earlyvangelist, không yêu cầu danh sách tên |
| 0.5 assumption map | `plan-product-investigation` bước 3–4 + `define-product-bet` bước 6 | hermes mạnh về ưu tiên uncertainty + disconfirmation, không có ma trận D/F/V/U/E hay Test Card |
| 0.6 kill criteria | `define-product-bet` bước 8 (stop/review conditions) | hermes có stop condition nhưng không có dạng **state + date**, không premortem |
| Gate F/C/V/R/P/LOCK | `shared/prepare-human-decision-packet` + `record-human-decision` + `manage-contract-lifecycle` + `docs/human-gates.md` | **Đây là chỗ hermes vượt xa** (xem §3.1) |
| Stage 1 competitive 5 tier | `research-product-opportunity` bước 4 + `nova/monitor-market-and-competitor-signals` | hermes không có mô hình 5 tier đặt tên và không có tier "dùng ChatGPT trực tiếp". **Sửa (round 8)**: hermes CÓ coi status quo là đối thủ thật — `assess-product-opportunity:89-93` ("the status quo is treated as a real competitor"); dòng cũ của tôi nói nó thiếu là sai |
| 1.3 mine review 1–3★ | rải trong `research` bước 4 | Không có skill riêng, không có yêu cầu giữ verbatim + link |
| V1 interview/mining + ledger | `plan-product-investigation` → `research-product-opportunity` → `maintain-evidence-registry` | hermes có hạ tầng evidence tốt hơn, phương pháp phỏng vấn mỏng hơn (xem §3.2, §4.1) |
| V2 solution directions + ChatGPT-gap | `run-product-validation-experiment` (một phần) | **Không có ChatGPT-gap test** — thiếu hoàn toàn bộ lọc added-value layer |
| 2.7 mock test | `luna/validate-product-usability` | hermes mạnh hơn nhiều về protocol (xem §3.5) |
| V3 pre-sell / money | `run-product-validation-experiment` có nhắc "commitment test" đúng 1 mệnh đề | Không có commitment ladder, không có pre-sell playbook, không có refusal log |
| R1 spike + error analysis + eval | `richard/spike` — **không có trong repo**; hermes khai nó là runtime dependency được bundle (`H/README.md:36`, `docs/runtime-compatibility-v0.19.0.md:24`) | Repo **không lộ đủ** để kết luận hermes thiếu error analysis/eval/unit-economics — chỉ kết luận được: phần đó không nằm trong artifact đã đọc (xem §4.4 đã sửa) |
| R2 concierge | `run-product-validation-experiment` (concierge/manual value test là 1 lựa chọn exposure) | Không có proto-retention, không có manual-ops log = MVP spec |
| Stage 4 positioning | `nova/define-positioning-and-messaging` | hermes mạnh hơn ở claim governance, yếu hơn ở phương pháp (xem §3.4, §4.3) |
| Stage 5 scope lock | `iris/define-mvp-msp` + `evaluate-productization-readiness` | hermes có **MSP** — plugin không có (xem §3.3) |
| cold-start test | **không có** | Plugin có agent riêng |
| founder charter | `USER.md` + "strategic rationale supplied by decision owner" + tách intent/evidence ở `clarify:88-100`, `assess:83-87`, `record-human-decision:116-136` | hermes CÓ tách ý chí khỏi evidence; cái nó không có là **ledger ý chí bền, có supersession + playback** (§4.6 đã sửa) |

---

## 2. Hai loại "chính xác" — không so trực tiếp được

Đây là điểm quan trọng nhất của cả bản đối chiếu, vì "tính chính xác về mặt thông tin"
ở hai bộ nằm ở hai tầng khác nhau:

**hermes = chính xác về provenance lúc chạy (runtime).** Mỗi mẩu evidence có
`evidence_id` bất biến, `status` (observed/reported/inferred/unknown/superseded),
`supports`/`contradicts`/`supersedes` thành đồ thị, `limitations` bắt buộc không rỗng,
`data_handling`, và một validator Python đọc-only + unit test. Reference ưu tiên bất biến
(`repo@commit:path`, `artifact-digest`, `decision-id`). Có luật chống thổi phồng:
*"không tính nguồn trùng lặp là corroboration độc lập"*, *"deduplicate syndicated
announcements về nguồn gốc"*, *"không so search snippet với full page như evidence tương đương"*.

**plugin = chính xác về nội dung phương pháp (bibliographic).** `process/research-verification.md`
là 6 nhánh research song song, mỗi claim có verdict CONFIRMED / CORRECTED / UNVERIFIABLE
và **11 sửa đổi đã áp dụng** — trong đó có xoá một số bịa ("GDPR gây ~30% churn sớm"),
hạ "20+ signup" xuống nhãn folklore, sửa "4 tiêu chí earlyvangelist" → thang 5 tầng,
sửa "~100 golden case" → ~100 trace cho error analysis, sửa "40% no decision" → 40–60% (JOLT Effect).

Đối chiếu bằng grep trên toàn bộ `hermes-team/skills` + `docs`: **không có một citation
phương pháp nào** — không Mom Test, không Blank, không Dunford, không Lean Canvas, không
Maurya, không Duke, không Hamel/Shankar, không "earlyvangelist", không "beachhead", không
"pre-sell". Chỉ 3 thuật ngữ generic xuất hiện: "concierge", "willingness to pay", "kill criteria".

Nghĩa là: hermes rất kỷ luật về *cách xử lý* thông tin nhưng **không cam kết gì về việc
phương pháp bên trong có đúng nguồn gốc hay không** — nó nói "chọn phương pháp rẻ nhất đáng tin cậy"
và để model tự quyết. Plugin thì ngược lại: nói rõ *phương pháp nào, số nào, của ai*, đã
verify từng cái, nhưng hạ tầng provenance lúc chạy mỏng hơn.

→ Không bên nào "chính xác hơn" một cách tổng quát. Plugin thắng rõ ở tầng phương pháp;
hermes thắng rõ ở tầng bằng chứng runtime. **Và đây chính là hai danh sách borrow ở §5.**

---

## 3. Nơi hermes solo-dev mạnh hơn plugin (cùng giai đoạn)

### 3.1. Mô hình authority/gate là một tầng hạ tầng, không phải một mục trong skill

hermes có:
- **Taxonomy artifact role**: `evidence` / `analysis` / `plan` / `proposal` / `active_contract` /
  `decision_record` / `execution_record` / `verification_record` / `registry` — mỗi output
  **phải khai** mình là loại nào; nhãn "final/approved/production-ready" bị cấm nếu không có authority tương ứng.
- **Schema authorization record**: `decision_id, decided_by, decided_at, subject_ref,
  authorized_action, scope, target_environment, constraints, valid_until_or_event,
  evidence_packet_ref, supersedes`. Trước khi hành động phải xác nhận **subject revision
  và environment còn khớp**; lệch → dừng, làm packet mới.
- **Danh sách phản-approval tường minh**: im lặng, "looks good", agent khác nói đã duyệt,
  task chuyển sang done/ready, decision cũ áp lên artifact đã thay đổi vật chất, việc gọi một bundle/skill — **đều không phải approval**.
- **Emergency envelope** cho incident (giới hạn action/system/severity/spend/expiry định trước).
- **Authorization latch**: các field decision để trống nhìn thấy được, cấm prefill "approved",
  cấm tạo checkbox hình dạng approval.

Plugin có decision-log + 3 lớp gate + will-override boundary — tốt, nhưng:
verdict của tôi ghi vào decision-log **không pin commit**, nên artifact có thể đổi sau khi gate PASS
mà verdict vẫn đứng; không có `valid_until`; không có `supersedes`; không có trường
`artifact_role` trong frontmatter (chỉ có `status: draft/ready/locked`).

### 3.2. Evidence registry là hạ tầng máy kiểm được, không phải markdown

`maintain-evidence-registry` có canonical JSON, ID `EV-*` không bao giờ tái sử dụng,
kiểm trùng theo claim + source_ref + capture window **trước khi thêm**, quan hệ
supports/contradicts/supersedes phải trỏ tới ID tồn tại và không self-reference,
change set tách "proposed" khỏi "applied", **không bao giờ xoá — chỉ supersede**,
validator chạy `--dry-run` + `--json-output` + unit test, và fallback "manual-unverified-by-script"
khi thiếu Python.

Plugin: `evidence-ledger.md` là markdown, mỗi dòng có who/when/verbatim/assumption + grade A/B/C/D.
Hook validate frontmatter nhưng **không có validator cho chính ledger**, không có đồ thị
contradiction, không có supersession, **không có luật độc lập nguồn**. Với V1 dựa nhiều vào
mining cộng đồng, đây là lỗ thật: 5 lần repost cùng một post Reddit hiện đang có thể được
đếm như 5 cá nhân trong denominator.

### 3.3. MSP — Minimum Service Promise

`define-mvp-msp` bắt buộc định nghĩa, song song với MVP: ai được dùng, use case được hỗ trợ
và **không** được hỗ trợ, ngôn ngữ availability **không bịa số SLA**, đường support + owner,
dữ liệu thu gì / mục đích / retention / deletion / access, incident route, export/recovery/rollback,
khai báo beta/experimental, cách thông báo thay đổi, và **hành vi exit/pause/sunset**.
Kèm luật: *"minimum không bao giờ có nghĩa là bỏ security, privacy, accessibility, data integrity, support"*.

Plugin stage 5 có core loop + aha + cut list + technical design contract + DoD, nhưng
**không có promise boundary**. Trong khi V3 của plugin đã thu tiền thật (grade A) — tức là
đã có khách hàng có quyền lợi trước khi có bất kỳ cam kết dịch vụ nào được viết ra.
DoD có gạch đầu dòng "trang pricing/terms/privacy" nhưng đó là checkbox, không phải promise được suy ra.

### 3.4. Claim governance trước khi publish

`define-positioning-and-messaging` có **claim ledger**: `claim ID | wording | class |
evidence | qualification | allowed context | owner | expiry/review trigger`, với 4 class:
`verified` / `qualified` / `hypothesis` / `prohibited-unavailable`; danh sách prohibited-language
kèm lý do; **consistency audit** tìm căng thẳng giữa message và sản phẩm ("instant" vs cần setup,
"private" vs luồng dữ liệu thật); luật *"không được làm yếu gate bằng cách thêm 'may' hay một footnote"*;
*"roadmap item không được nói ở thời hiện tại"*; *"hiệu năng test nội bộ không thành claim outcome phổ quát"*.

Plugin stage 4 yêu cầu alternatives 100% trace ledger + copycat test + pitch test — tốt về
*positioning* nhưng **không có phân loại claim** và không có prohibited list. Đây là rủi ro sống
vì chính plugin là bên sinh copy landing và (market-evidence mode) **deploy nó ra ngoài**.

### 3.5. Protocol usability/mock

`luna/validate-product-usability`: nhiệm vụ phải viết dưới dạng **goal + context, không phải
chỉ dẫn giao diện**; cấm ngôn ngữ dẫn dắt và tên feature nội bộ; rescue level; pilot trước;
severity U0–U3 theo consequence/criticality/recoverability (**không theo tần suất trong sample**);
*"formative sample không thiết lập tỉ lệ dân số"*; và tách 6 loại nguyên nhân khác nhau
(usability issue / technical defect / product-logic objection / positioning confusion /
recruitment mismatch / facilitator error).

Plugin 2.7 mock test = một đoạn: "đưa mock cho người đã phỏng vấn, ghi phản ứng hành vi".
Nghịch lý: tôi rất nghiêm Mom Test ở phỏng vấn V1 nhưng **không có luật chống pitch/dẫn dắt
ở buổi demo mock** — nơi rủi ro dẫn dắt còn cao hơn.

### 3.6. Bounded effort là invariant, không phải lời khuyên

hermes: `max_elapsed` hữu hạn (trần 1 tuần), card/depth/cost bound, retry cap,
*"sau hai lần thất bại giống nhau về bản chất → về triage, hỏi founder, không tự lặp"*,
*"sau hai vòng clarification giống nhau → dừng"*, và mọi flow kết thúc bằng đúng một
disposition: `no_action` / `observe` / `new_flow` / `contract_reopen`. Learning **không tự động** sinh backlog.

Plugin có kill criteria (state+date) + threshold nhưng **không có trần effort cho từng task,
không có luật chống lặp**. Fan-out mining và vòng gate-check → sửa → gate-check có thể chạy vô hạn.

### 3.7. Privacy lifecycle, không chỉ privacy split

hermes: consent trước khi material từ participant vào artifact; minimization *trong từng
artifact*; alias trong study, identity nằm ở hệ thống participant được phê duyệt; retention/deletion;
*"không tuyên bố đã xoá mà không có evidence"*; incident route; cấm credential/raw transcript
trong artifact tái sử dụng.

Plugin có `private/` + P-id + `data-manifest.md` — đúng hướng nhưng thiếu vòng đời: không có
bước consent trong interview-kit, không có retention/deletion, không có incident route.

### 3.8. Eval cho chính bộ skill

hermes: mỗi skill có `evals/evals.json` + `evals/trigger-queries.json`; thêm
`evals/collision-cases.json`, `evals/end-to-end-flows.yaml`, fixtures valid/invalid cho 2 schema,
offline behavior eval runner, `package-release`, `SHA256SUMS`, 6 bản dist có version.
Plugin: chỉ `tests/hook-tests.js`. Đây là khoảng cách **độ chín của sản phẩm**, không phải của phương pháp.

---

## 4. Nơi plugin mạnh hơn (cùng giai đoạn)

### 4.1. Phương pháp cụ thể, có nguồn, có số

hermes nói "chọn phương pháp rẻ nhất đáng tin cậy", "đánh giá evidence sufficiency theo dimension".
Plugin nói: 4 câu Mom Test bắt buộc + commitment & advancement mỗi cuộc; 10–15 phỏng vấn
(Running Lean) với stop-rule saturation; thang 5 tầng earlyvangelist, **chỉ tầng 4–5 tính**;
JOLT 40–60% no-decision làm nguồn cho "do nothing" là đối thủ tier 5; Dunford 5(+1) component
**thứ tự bắt buộc** + Big Fish Small Pond là default cho startup; kill criteria dạng state+date
(Duke) sinh từ premortem; 2/20/200 (Walling); Drip 11/17 ở $99/tháng làm case neo pre-sell.

Với một solo dev, khác biệt này là khác biệt giữa "biết mình phải có bằng chứng" và
"biết chính xác hỏi câu gì, bao nhiêu cuộc, ngưỡng nào, và tại sao là con số đó".

### 4.2. Xác minh đối kháng **bắt buộc** trên đường tới hạn

- `gatekeeper`: nhiệm vụ **là tìm lý do gate FAIL**, đọc artifact với ngữ cảnh trắng,
  không dính vào cuộc hội thoại đã sinh ra chúng.
- `coldstart-tester`: giả lập một session build hoàn toàn mới chỉ có MVP pack;
  danh sách câu hỏi còn lại **không rỗng = fail**.
- `gate-contracts.md`: predicate verdict chính xác (Validated / Hypothesis / **Pre-feasibility**),
  self-contained pack (copy chứ không reference), threshold-snapshot ghi vào decision-log và
  **recompute so sánh ở mọi gate sau, độc lập với hook**.

**Sửa (round 8)**: nói hermes "không có bất kỳ agent đối kháng nào" là quá tuyệt đối —
`nova-growth-marketer/config.yaml` có awareness block cho runtime codex ("most useful to Nova
as an independent second opinion" trên công việc đã làm), và offline eval của hermes dùng
conversation/grading độc lập (`scripts/offline-eval/eval_prompts.py:39-50`). Claim đúng là:
**hermes không có xác minh fresh-context đối kháng nào BẮT BUỘC trên đường tới hạn của
discovery/MVP** — second opinion là tuỳ chọn, do Nova tự quyết, và không phải điều kiện của
bất kỳ gate nào. Ở plugin, gatekeeper + coldstart là điều kiện gate. Đó vẫn là lợi thế cấu
trúc lớn nhất, nhưng phải phát biểu ở dạng "bắt buộc vs tuỳ chọn", không phải "có vs không".

### 4.3. Bộ lọc đặc thù 2026 mà hermes không có

- **ChatGPT-gap test** + taxonomy added-value layer (workflow/state · proprietary data & integration ·
  bounded reliability · expertise unload · distribution). hermes không có gì tương đương —
  một sản phẩm "prompt bọc UI" đi qua toàn bộ 10 skill của Iris mà không bị chặn một lần.
- **Tier 4 competitor = dùng ChatGPT trực tiếp**, và **tier 5 = do nothing**.
- **Pre-sell playbook**: commitment ladder (card → deposit → prepay → paid pilot),
  giá neo theo **chi phí alternative thật của khách** (không neo vào competitor tưởng tượng),
  refusal log cluster hoá, luật "cam kết ở giá thật ≠ bắt đầu billing".

### 4.4. Tầng feasibility (R1) — hermes gần như trống

hermes route feasibility về `richard/spike`, và skill này **không có trong repo** (grep xác nhận:
không có thư mục `spike`; chỉ có bundle `technical-spike` và docs tham chiếu).

**Sửa (round 8)**: từ đó tôi đã suy ra "hermes không có error analysis / eval discipline /
unit economics" — **suy luận này không có cơ sở**. hermes khai Richard là runtime dependency
được bundle (`H/README.md:36`, `H/docs/runtime-compatibility-v0.19.0.md:24`,
`bundles/richard/technical-spike.yaml:2-7`), nên repo không lộ đủ để kết luận thiếu.
Kết luận đúng và hẹp hơn: **trong toàn bộ artifact đã đọc được, không có nội dung nào về
error analysis, eval discipline hay unit economics theo lượt dùng** — và bundle `technical-spike`
chỉ yêu cầu "định nghĩa uncertainty, evidence cần, bound, stop condition", không nói gì về
đọc trace, failure taxonomy, hay judge–expert agreement. So sánh nội dung R1 vì vậy chỉ hợp lệ
với phần đã đọc, không phải với hermes như một hệ thống.

Plugin có: error-analysis-first (chống eval-driven development), ~100 trace + stop-rule
20-trace saturation, eval sinh **từ lỗi tìm được** chứ không từ lỗi tưởng tượng, code eval
trước judge, judge **binary không thang điểm** + 1 evaluator/1 tiêu chí + **agreement judge–người
75–90% trên held-out set** mới được tin, và luật cứng trong gate-contracts:
*"subjective quality do LLM chấm mà không có human-labeled anchor = grade D, chỉ diagnostic,
không bao giờ thoả PASS"*. Với SaaS AI-core năm 2026, đây là khoảng cách nội dung lớn nhất về phía hermes.

### 4.5. Kỷ luật thống kê ở V1

Plugin yêu cầu **pre-registered sampling frame** trước khi mining: query trung tính mô tả
*tình huống* chứ không mô tả *điều kiện thành công* (cấm đếm từ "alternative to X" hay
"built a spreadsheet for X"), denominator = mọi cá nhân distinct trong frame trung tính,
metric = % **trong số họ** có past behavior; search theo hành vi được phép nhưng đánh dấu
`exploratory` và **loại khỏi metric gate**.

**Sửa (round 8)**: "hermes không định nghĩa denominator ở đâu cả" là **sai** —
`run-product-validation-experiment` bắt pre-register population + measures trước khi chạy
(`:75-85`) và bắt báo kết quả **kèm denominator** (`:119-123`, ví dụ completion metadata
`:184-188`). Claim đúng và hẹp hơn: **cho nhánh evidence thụ động (mining cộng đồng, đếm
recurrence), hermes không định nghĩa sampling frame trung tính nào** — kỷ luật denominator của
nó sống trong experiment có exposure chủ động, còn nhánh research thụ động thì không có.
Đúng nhánh V1 của plugin là nhánh thụ động, nên borrow vẫn có giá trị, nhưng không phải vì
hermes "không có khái niệm denominator".

### 4.6. Founder-intent extraction (charter)

Grades of will (`stated` > `confirmed` > `[INFERRED]`), row có **exact quote + supersedes**,
playback ritual ở mọi gate approval, và **will-override firewall**: ý chí founder không bao giờ
nâng cấp evidence, không đổi metric, không biến FAIL thành PASS, không thoả pack predicate —
build bất chấp gate fail sinh ra artifact **Unvalidated Build Decision** tường minh.

**Sửa (round 8)**: "hermes không có firewall giữa ý chí và evidence" là **sai**. hermes tách
hai thứ đó ở nhiều chỗ và tách khá sắc: `clarify-raw-product-idea:88-100` phân loại từng phát
biểu (source-stated / evidence-backed / interpretation / assumption / unknown);
`assess-product-opportunity:83-87` tách user value / buyer value / strategic value / **founder
interest**; `record-human-decision:116-136` cấm bịa rationale cho quyết định của người;
`work-system-and-artifact-authority.md:7-15,24-33` xếp decision record và evidence vào hai
authority khác nhau.

Claim đúng và hẹp hơn: hermes có **firewall theo từng lần**, nhưng không có **ledger ý chí
bền** — không có item có id ổn định + exact quote + `supersedes`, không có playback ritual ở
mỗi gate, không có luật "will-override không bao giờ nâng grade / không flip FAIL→PASS" phát
biểu tường minh, và không có exit artifact khi founder build bất chấp gate fail. Ý chí ở hermes
sống trong từng decision record rời rạc; ở plugin nó là một artifact có lịch sử. Đó vẫn là chỗ
plugin đi trước, nhưng là "bền + có ceremony", không phải "có vs không".

### 4.7. Degradation ladder gắn với hệ quả trên output

enhanced-auto → baseline-auto → handoff → simulate, mỗi rung ghi lại và **kéo theo grade**,
và grade kéo theo **tên của pack** (Validated / Hypothesis / Pre-feasibility). hermes fallback
là văn xuôi từng skill ("ghi nhận gap, thu hẹp kết luận") + trường `residual_risk` mà người phải đọc mới thấy.
Plugin làm "chúng ta không làm được tử tế" **hiện lên chính tên sản phẩm cuối**.

---

## 5. Kết luận & danh sách borrow theo ưu tiên

**Về độ đầy đủ ở phần giao nhau**: plugin đầy đủ hơn về *nội dung phương pháp* và *cơ chế
cưỡng chế* (hook, contract, agent đối kháng, pack predicate). hermes đầy đủ hơn về *hạ tầng
governance & provenance* và mạnh hơn ở 3 vùng phương pháp plugin đang mỏng: usability protocol,
service promise, claim governance.

**Về làm rõ ý tưởng (stage 0)**: plugin rộng hơn (8 artifact: idea-brief, problem-hypothesis,
canvas, market type, beachhead/ICP+20 tên, assumption map, kill criteria, charter) so với
1 Idea Brief của hermes. Nhưng Idea Brief của hermes **sâu hơn ở 2 điểm** và cả 2 đều đáng mượn:
nó phân loại **từng phát biểu** thành 5 mức (`source-stated` / `evidence-backed` / `interpretation` /
`assumption` / `unknown`), trong khi plugin chỉ có `[GUESS]` nhị phân — không phân biệt được
"founder nói vậy" với "tôi diễn giải ra"; và nó **xếp hạng câu hỏi clarification thành blocking
vs non-blocking**, mỗi câu blocking phải nói nó ảnh hưởng quyết định/section nào — plugin không
xếp hạng câu hỏi gì cả.

> **Danh sách dưới đây là đề xuất ĐẦU của tôi và đã bị Codex round 8 sửa ở 4 chỗ**
> (§6 là bản thi hành): #3 commit-pin bị bác (commit không nhận diện được artifact
> dirty/untracked → thay bằng content manifest hash); #6 "cấm deploy claim hypothesis" bị bác
> (sẽ làm V2 landing test bất khả thi → thay bằng 4 trạng thái có `experimental proposition`);
> #10 `artifact_role` bị bác (thêm một hệ phân loại thứ hai mà không đổi quyết định nào);
> #4 trần effort toàn cục bị bác (là runtime policy đội lốt tính đúng đắn — chỉ giữ luật
> chống lặp). Đọc §6 trước khi thi hành bất cứ gì ở đây.

### Ưu tiên 1 — sửa lỗ thật, chi phí thấp

1. **Ledger có cấu trúc mâu thuẫn + supersession + độc lập nguồn.** Thêm cột
   `supports` / `contradicts` / `supersedes` / `independent_of` vào evidence-ledger; luật:
   repost/syndication của cùng một nguồn gốc **không tính là cá nhân distinct** trong denominator V1;
   không xoá dòng — chỉ `superseded`. Kèm một validator script cho ledger (giống
   `validate-evidence-registry.py`) chạy trong hook `validate-artifact`.
2. **Phân loại 5 mức cho phát biểu trong idea-brief + problem-hypothesis** thay cho `[GUESS]` nhị phân,
   và **blocking / non-blocking** cho câu hỏi clarification (mỗi blocking nói rõ nó chặn section nào).
3. **Pin commit trong verdict gate.** Mỗi dòng verdict trong decision-log ghi `git rev-parse HEAD`
   của lúc chốt + `valid_until_or_event`. Repo đã là git repo nên gần như miễn phí, và nó bịt
   đúng lỗ "artifact đổi sau khi PASS".
4. **Trần effort + luật chống lặp**: "sau hai lần thất bại giống nhau về bản chất → dừng, surface cho user";
   trần số agent/lượt mining cho mỗi stage; ghi rõ khi bị cắt vì trần (không im lặng truncate).

### Ưu tiên 2 — thêm nội dung còn thiếu

5. **Promise boundary (MSP) vào stage 5 / mvp-pack**: suy ra từ promise-scope của R1 + DoD —
   use case được/không được hỗ trợ, dữ liệu & retention & deletion, support intake, khai báo beta,
   export/rollback, hành vi sunset. Không bịa số SLA.
6. **Claim ledger ở stage 4 + landing-kit**: class `verified` / `qualified` / `hypothesis` / `prohibited`,
   prohibited-language list, consistency audit message↔sản phẩm. Gate P kiểm: **không có claim
   class `hypothesis` hoặc `prohibited` nào được deploy** trong market-evidence mode.
7. **Protocol mock/demo ở 2.7**: nhiệm vụ dạng goal+context, cấm dẫn dắt/tên feature nội bộ,
   rescue level, severity U0–U3 theo hậu quả (không theo tần suất), tách usability issue khỏi
   technical defect / product-logic objection / positioning confusion.
8. **Vòng đời dữ liệu người tham gia**: một dòng consent trong interview-kit, retention/deletion
   trong data-manifest, incident route; "không tuyên bố đã xoá mà không có evidence".
9. **Chuẩn hoá so sánh ở stage 1**: normalize currency/billing period/plan edition/locale trước khi
   so pricing; tách list price khỏi effective price; tách trạng thái capability
   (announced / beta / documented / GA / observed / withdrawn). Hiện competitor profile của plugin
   mời gọi đúng những lỗi này.

### Ưu tiên 3 — độ chín sản phẩm

10. **`artifact_role` trong frontmatter** (`evidence` / `analysis` / `proposal` / `decision_record` / `registry`)
    để một file analysis không bao giờ đọc như một quyết định.
11. **Eval cho chính bộ skill**: trigger-queries per skill, collision cases (skill nào bị gọi sai lúc nào),
    end-to-end flow fixtures, `SHA256SUMS` cho release.

### Không mượn (có chủ đích)

- **Kiến trúc 6 profile + Kanban + contract lifecycle**: đúng cho một team-runtime bền vững,
  quá nặng cho một plugin một-agent kết thúc ở scope lock. Ba lớp gate + decision-log append-only
  của plugin đã phủ phần thực chất (ai duyệt, duyệt cái gì, phiên bản nào).
- **Tách vai để chặn scope creep**: plugin thay bằng gatekeeper ngữ-cảnh-trắng — cùng mục tiêu
  (không tự phê duyệt việc của mình), cơ chế nhẹ hơn và không cần 6 profile.

---

## 6. Bản THI HÀNH — sau trao đổi hai chiều với Codex (round 8 → 10)

> Cấu hình reviewer: `codex exec` · `gpt-5.6-sol` · reasoning **xhigh** · resume cùng session để giữ
> ngữ cảnh. Round 8: audit bản đối chiếu + phán 11 borrow. Round 9: 7 câu hỏi collision với phase
> maintenance. Round 10: verify bằng cách trace thứ tự thực thi và chạy code.

### 6.1. Codex bác 4 borrow của tôi — và bác đúng

| Borrow gốc (§5) | Codex | Thay bằng |
|---|---|---|
| #3 pin git commit vào verdict | Bác: commit không nhận diện được artifact dirty/untracked | **Content manifest** sha256 của đúng bộ artifact + `evidence_cutoff` + `reopen_on` |
| #6 "claim hypothesis không được deploy" | Bác: sẽ làm V2 landing test bất khả thi | 4 trạng thái với **`test-as-proposition`** được phép; cấm là *proof bịa*, không phải *đề xuất chưa chứng minh* |
| #10 `artifact_role` mọi file | Bác: thêm hệ phân loại thứ hai mà không đổi quyết định nào | Bỏ hẳn |
| #4 trần effort toàn cục | Bác: runtime policy đội lốt tính đúng đắn | Chỉ giữ luật **hai lần fail giống nhau → dừng** |

Codex cũng chỉ ra borrow #1 *một phần* cargo-cult: validator của hermes chỉ check cấu trúc, **không**
phát hiện trùng lặp semantic và **không** chứng minh độc lập nguồn (đã verify: `validate-evidence-registry.py:78-166`).
Nên bản của plugin **suy ra độc lập từ root-source khác nhau** thay vì nhận `independent_of` tự khai —
tự khai độc lập chính là lỗi cần chặn.

### 6.2. Chỗ tôi phản biện Codex

Round 8 nó đề xuất **xoá toàn bộ phase maintenance** vì "vi phạm scope". Bị bác: lỗi ở prompt của tôi
(tôi viết "plugin dừng ở scope lock", vốn đã cũ). Phase đó là founder-requested và đã hội tụ 4 round
với chính nó. Nhưng 2 defect con trong finding đó là **thật** và đã sửa: thứ tự LOCK bất khả thi và
manifest desync. Round 9 nó rút lại đề xuất xoá.

### 6.3. Đã thi hành (14 nhóm, mỗi nhóm có fixture)

1. **Thứ tự LOCK** — gate-check có hai chế độ gọi: `--ceremony=charter` (chạy ceremony rồi **trả về
   caller**, không rơi vào Layer 1) và full check (Layer 1 chỉ **verify** charter đã locked, FAIL kèm
   một chỉ dẫn nếu chưa). Stage 5 là chủ điều phối duy nhất: charter ceremony → materialize pack →
   cold-start → full gate check.
2. **Ba field cùng tên `status` tách tên**: artifact `status` · ledger **`bearing`** · claim-register
   **`epistemic_status`** · message **`publication_disposition`**. Luật mới: publication disposition
   **không bao giờ** thực hiện một transition (chọn test dưới dạng proposition không làm claim vững hơn).
3. **Lineage ledger**: `root_source_id`, `scope_limits`, `relationship`, `supersedes`; `scripts/validate-evidence-ledger.js`
   chạy **ở gate** (V1/P/LOCK), trả `max_independent_count` làm **trần cho mọi denominator**. E- vs O-:
   observation được phép mâu thuẫn/thu hẹp, **không bao giờ** confirm (chặn đường "code observed → market claim supported").
4. **Một helper manifest** `scripts/artifact-manifest.js` (`purpose: gate-input | reconciliation`) dùng
   bởi cả gate-check và reconcile — cùng byte, khác transaction. Chống: mutation sau snapshot, sửa thân
   manifest, traversal, symlink, **và file được thêm vào thư mục sau khi create** (lỗ tôi tự phát hiện
   khi viết prompt round 10 — quan trọng nhất với `mvp-pack/`).
5. **Option comparison + partial approval** ở Layer 3: 2–4 option thật, luôn có *thu thập thêm bằng chứng*
   và *không làm gì*; approval hẹp hơn được ghi **đúng phạm vi hẹp**, không làm tròn lên thành PASS đầy đủ.
6. **`invalid` ≠ `weakened`**: instrument lỗi (mock hỏng, event không bắn, link chết, sai audience) →
   sửa và chạy lại; số của nó không vào ledger. Kèm instrumentation check trước mỗi lần đo.
7. **Session accounting cho mock**: task dạng goal+context, ghi mọi intervention,
   `unassisted|rescued|failed|abandoned`, confounds, **denominator = valid sessions**, và
   observation→interpretation→impact→recommendation. **`rescued` không bao giờ tính là support.**
8. **Vòng đời dữ liệu người tham gia**: manifest trong `private/` + index không nhạy cảm
   `state.privacy.retention_duties`; session-start + `status` nêu quá hạn; `state-write.js` từ chối duty
   không có `delete_by`, id không phải P-id, và bất kỳ key nhận dạng. Xoá **không bao giờ** tự động, kèm
   phát biểu giới hạn trung thực (plugin cục bộ không đảm bảo được xoá theo lịch nếu không ai mở nó).
9. **MSP** vào `mvp-spec.md` + predicate LOCK + coldstart-tester: một field trống là finding, **một số
   SLA bịa cũng là finding** (bịa promise tệ hơn thiếu promise).
10. **Chuẩn hoá đối thủ**: pricing normalized (currency/tax/billing period/edition/seat/locale/list-vs-effective/observed_at)
    + capability state (announced/beta/documented/GA/observed/withdrawn) + dedupe về nguồn gốc.
11. **Intake stage 0**: bảng phân loại 5 mức với luật *model không được tự nâng `interpretation` lên
    `source-stated`*, và câu hỏi **blocking vs non-blocking** (F đòi zero blocking chưa trả lời — unknown
    thì được, blocker chưa trả lời thì không).
12. **Guards**: §12 cross-domain evidence không recertify gate khác · §13 hai lần fail giống nhau thì dừng ·
    `waiting_on` có `resume_when`/`owner`/`expires_or_recheck_at` · messaging đổi **một** biến ·
    **sampling frame được snapshot (text + sha256) vào journal TRƯỚC khi thu thập**, V1 recompute so sánh.
13. **Rung còn đúng ba** (`enhanced-auto|baseline-auto|handoff`): `handoff-only` trùng nghĩa, và
    `simulate` **không phải năng lực thực thi** mà là provenance epistemic → nó là grade D/`[GUESS]`,
    vốn không bao giờ thoả gate. Giữ nó làm rung mời gọi lập luận "mô phỏng xong việc rồi".
14. **Nhãn pack được SINH từ gate state** (kèm liệt kê input đã đánh giá), không viết tay — nhãn viết tay
    là cách một Hypothesis pack đọc như Validated.

### 6.4. Trạng thái kiểm chứng

`node tests/hook-tests.js` → **89 passed** · `node tests/pipeline-contract-tests.js` → **47 passed**
(mới) · `claude plugin validate . --strict` → pass. Fixture bao gồm chính các lỗi Codex nêu: 4 dòng
ledger cùng root → trần 2 nguồn độc lập; file thêm vào pack sau snapshot bị bắt; `simulate` bị từ chối
trên artifact 1.2.0 còn `handoff-only` trên artifact cũ nhận **chỉ dẫn migrate**; tên thật trong state
bị từ chối; nhãn pack đúng ở cả 4 nhánh verdict.

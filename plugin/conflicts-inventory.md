# Kiểm kê xung đột (2026-07-30)

> Danh sách **mọi xung đột tôi biết** trong repo sau đợt absorption + 6 vòng review, để gộp cùng các
> xung đột từ nguồn khác rồi đánh giá và fix một lần. Mỗi mục: xung đột là gì · bằng chứng · các lựa
> chọn · khuyến nghị của tôi (không tự quyết).
>
> Phân loại: **C** = xung đột nội dung/cấu trúc trong repo · **V** = xung đột giữa các verdict review ·
> **D** = căng thẳng thiết kế chưa quyết · **P** = xung đột quy trình (nhiều tay cùng sửa).

---

## C1 — `state.json` "never inside the plugin" nhưng `ideas/proposal-draft/` nằm trong repo plugin

**Bằng chứng**: `skills/method-rules-state-schema/SKILL.md:9` — *"Location: `ideas/<slug>/state.json`
in the **user's working repository** (never inside the plugin)"*. Nhưng `ideas/proposal-draft/` tồn tại
ngay trong repo plugin, có `state.json` thật, và nhiều fixture/hook test trỏ vào nó.

**Vì sao là xung đột thật**: hook `session-start` và `validate-artifact` dùng sentinel "có `state.json`
kề bên chứa `pipeline_version`". Một người cài plugin rồi mở repo plugin sẽ thấy state của một idea
không phải của họ. Luật tự nói điều này không được xảy ra.

**Lựa chọn**: (a) chuyển dogfood workspace ra ngoài repo (`../dogfood-runs/`), sửa fixture trỏ theo ·
(b) đổi luật thành "ngoại lệ: dogfood workspace của chính plugin, đặt dưới `dogfood/` không phải
`ideas/`" · (c) giữ nguyên, ghi ngoại lệ tường minh vào state-schema.

**Khuyến nghị**: (b) — đổi tên thư mục thành `dogfood/proposal-draft/` để sentinel không bắt nó như
idea của người dùng, và luật giữ nguyên không cần ngoại lệ.

---

## C2 — HAI bộ template cùng là "producer" của cùng artifact

**Bằng chứng**: `templates/{0-framing,1-competitive,2-validate,3-verify,4-positioning,5-scope-lock}.md`
(6 file, ở root) **và** `skills/stage-N-*-templates/SKILL.md` (6 skill, sau restructure). Cả hai đều
phát ra header evidence-ledger; fixture producer-agreement hiện kiểm 4 producer gồm cả hai bộ.

**Vì sao là xung đột thật**: đúng cơ chế đã gây blocker hai lần (round 10 và round 13) — sửa một bộ,
quên bộ kia, artifact sinh ra không khớp validator. Fixture chỉ bắt được **cột**, không bắt được lệch
nội dung/hướng dẫn.

**Lựa chọn**: (a) xoá `templates/` ở root, skill-templates là nguồn duy nhất · (b) giữ `templates/` làm
bản in cho người đọc, sinh **tự động** từ skill-templates (như `sync-codex-agents.js`) · (c) giữ cả hai
bằng tay + mở rộng fixture so cả nội dung.

**Khuyến nghị**: (b) hoặc (a). Hai bản giữ tay của cùng một thứ luôn drift — đã chứng minh 2 lần.

---

## C3 — `process/*.md` và `skills/*` mô tả cùng luật, không có ai là nguồn

**Bằng chứng**: `publication_disposition` xuất hiện ở 5 file trong `skills/`, **0** trong `process/`.
`minimum service promise`: skills 1, process 0 (dù tôi đã thêm MSP vào pipeline.md — nó ghi bằng tiếng
Việt/khác chữ nên grep không khớp). `root_source_id`: process 1, skills 4.

**Vì sao là xung đột thật**: `process/pipeline.md` là tài liệu phương pháp người dùng đọc; skill là cái
model thực thi. Không có tuyên bố nào nói bên nào thắng khi lệch. Tôi vừa đồng bộ bằng tay — nó sẽ lệch
lại ở lần sửa tiếp theo.

**Lựa chọn**: (a) tuyên bố `skills/` là nguồn, `process/` là bản diễn giải + thêm dòng "nếu lệch, skill
thắng" · (b) sinh `process/` từ skill · (c) xoá `process/`, để skill tự giải thích.

**Khuyến nghị**: (a) — rẻ nhất, và `process/` có giá trị riêng (nó giải thích *vì sao*, kèm nguồn dẫn).

---

## C4 — `plugin/*.md` là 11 file thiết kế với trạng thái tự khai chồng chéo

**Bằng chứng**:
- `autonomy-design.md`: *"CURRENT DIRECTION: see plugin-spec"* + nội dung là "autonomous market-evidence
  funnel" giờ chỉ còn là opt-in.
- `stage-support-map.md`: *"DESIGN DIRECTION UPDATE (2026-07-29) … retained as reference for
  collaborative mode"*.
- `capability-matrix.md`: *"CURRENT DIRECTION: plugin-spec"*.
- `maintenance-design.md`: *"IMPLEMENTED (plugin v1.2.0) — post-implementation cross-review in progress"*.
- `plugin-spec.md`: *"rebuild (2026-07-29)"* + addendum "v1.1" trong khi plugin là 1.2.0.
- Cộng `codex-review.md`, `solo-dev-comparison.md`, `dogfood-report.md`, `mechanics-run.md`,
  `outstanding-work.md`, `conflicts-inventory.md` (file này) — 3 trong số đó là báo cáo review, không
  phải thiết kế.

**Vì sao là xung đột thật**: một người mới (hoặc model ở session sau) không biết đọc file nào để hiểu
thiết kế hiện tại. Ba file tự nhận "CURRENT DIRECTION là file khác" — nghĩa là không file nào là hiện tại.

**Lựa chọn**: (a) một `plugin/DESIGN.md` là nguồn duy nhất, mọi file khác vào `plugin/history/` ·
(b) thêm index `plugin/README.md` nói rõ file nào còn hiệu lực, file nào là lịch sử · (c) giữ nguyên.

**Khuyến nghị**: (b) tối thiểu, (a) nếu chấp nhận một lần dọn lớn.

---

## C5 — chuỗi version không đồng bộ

**Bằng chứng**: `plugin.json` = `1.2.0` · `pipeline_version` trong artifact = `1.2.0` ·
`plugin-spec.md` = *"rebuild (2026-07-29)"* với addendum đánh số **v1.1** · `gate-contracts` header tôi
vừa đổi thành v1.2.0 · `codex-review.md` nói "v1.1 release candidate".

**Lựa chọn**: (a) một dòng version duy nhất ở `plugin.json`, mọi doc bỏ số version tự khai ·
(b) đồng bộ tất cả lên 1.2.0 và giữ số trong doc.

**Khuyến nghị**: (a) — số version trong tài liệu là thứ luôn quên cập nhật.

---

## C6 — `scripts/coverage-report.js` gắn nhãn `where` bằng tên skill sai dạng

**Bằng chứng**: 19 dòng ghi `where: "the 'method-rules-artifact-schema' skill"` — do find-replace toàn
cục của restructure. Tên skill thật là `method-rules-artifact-schema`, không có "the … skill" bọc ngoài.
Chỉ là nhãn hiển thị, không phá chức năng.

**Khuyến nghị**: sửa thành tên skill trần khi dọn.

---

## C7 — `dogfood-report.md` mô tả một trạng thái workspace không còn tái lập được

**Bằng chứng**: báo cáo nói *"V1 phải re-run frame sau chữ ký thật"*, nhưng
`ideas/proposal-draft/state.json` đã có `signed_date` non-null → ceremony Layer 0 chỉ chạy khi
`signed_date` là null, nên **workspace này không thể "re-run F"**. Chính Codex round 6 đã nêu; cách xử
lý được ghi là "reset signed_date hoặc dùng workspace mới" nhưng chưa ai làm.

**Lựa chọn**: (a) tạo workspace dogfood mới cho Run #2, giữ cái cũ làm lịch sử · (b) reset `signed_date`
+ journal một `migration` row.

**Khuyến nghị**: (a) — và nó giải quyết luôn C1 nếu đặt ngoài `ideas/`.

---

## V1 — hai verdict review trái nhau

**Bằng chứng**: Codex round 11 = *"fix-then-dogfood; the dogfood run is not the only remaining release
condition"* (sau khi tìm 1 blocker + 7 major bằng chạy code). Claude Code CLI round 14 = *"Releasable"*
(tìm 1 minor, tự bác).

**Vì sao KHÔNG ngang giá trị**: round 14 test đúng những thứ **đã có fixture** (supersession loop,
multiple targets, escaped pipe, missing self-hash, file-added, frozen cycle) — chạy lại vùng đã bao phủ,
không mở vùng tấn công mới. Và nó không nhắc ba điều kiện phát hành còn lại vì không chạm tới được.

**Dữ liệu phụ đáng lưu**: round 13 (cùng model, **không** có Bash) tìm ra 2 lỗi thật gồm một lỗi logic
trong fixture; round 14 (có Bash) thì không. Reviewer chạy được code dừng ở "chạy thấy ổn"; reviewer
buộc phải trace thì đọc ra lỗi logic.

**Khuyến nghị**: coi round 14 là bằng chứng "restructure không làm vỡ gì" — hợp lệ và hữu ích — chứ
không phải bằng chứng đủ điều kiện phát hành. Lần review tới chạy **cả hai chế độ**: một reviewer có
Bash, một reviewer bị buộc trace.

---

## V2 — một đề xuất của Codex đã bị tôi bác, chưa có bên thứ ba phán

**Bằng chứng**: Codex round 8 đề xuất **xoá toàn bộ phần sau LOCK** vì "vi phạm scope". Tôi bác, lý do:
lỗi ở prompt của tôi (tôi viết "plugin dừng ở scope lock", vốn đã cũ) và phần đó là founder-requested,
đã hội tụ qua 4 round với chính nó. Round 9 nó rút lại.

**Trạng thái**: đã giải quyết, ghi lại để bạn biết có một lần bác và vì sao.

---

## D1 — 56% requirement được cưỡng chế bằng "một model đọc luật dài"

**Bằng chứng**: `node scripts/coverage-report.js` → code 27% · hook 17% · **agent 44%** · **prose 11%**.
Tám requirement **không có gì kiểm**: two-identical-failures-stop · outward-action-per-approval ·
budget-preflight · charter-playback-at-each-gate · interpretation-never-promoted ·
instrumentation-check-before-run · consent-before-material-enters · deletion-never-automatic.

**Căng thẳng chưa quyết**: thêm luật thì tăng tải context (làm yếu tầng agent), thêm code thì tăng
deterministic nhưng chỉ áp được cho thứ đo được. Vài mục trong 8 cái là cố ý (không gì xoá dữ liệu;
outward action dựa vào permission layer của runtime) — số còn lại là nợ.

**Khuyến nghị**: chọn 3 trong 8 cái đáng code hoá nhất (tôi nghĩ: budget-preflight, charter-playback,
instrumentation-check) và chấp nhận 5 cái còn lại là prose có chủ đích, ghi rõ *tại sao* để lần sau
không ai tưởng là bỏ sót.

---

## D2 — ngân sách context vẫn là rủi ro dù đã cắt 38%

**Bằng chứng**: bundle mặc định 757 → 466 dòng sau khi đưa `maintenance-rules` sang load-theo-yêu-cầu.
Nhưng restructure vừa rồi biến mỗi file tham chiếu thành một skill — **chưa ai đo lại** tổng tải thực tế
khi Claude Code tự quyết load skill nào.

**Khuyến nghị**: đo lại sau restructure. Con số cũ (466) không còn đúng vì cơ chế load đã đổi.

---

## P1 — nhiều tay sửa song song, không có bảo vệ

**Bằng chứng**: trong một phiên, một process khác đã (a) thêm ~13 test vào `hook-tests` và ~34 vào
`contract-tests` (96→109, 103→137), (b) tái cấu trúc 15 skill thành 24, (c) chạy find-replace toàn cục
làm **hỏng cú pháp 3 file JS** (backtick lồng trong template literal) và **viết lại một tên file bên
trong `path.join()`**. Ba script chết đó gồm cả `validate-artifact.js` — hook fail-open, nên plugin vẫn
"chạy" mà **không còn cưỡng chế gì**, im lặng.

**Vì sao là xung đột thật, không phải sự cố**: không có gì trong repo chặn được kịch bản này. Không có
CI, không có pre-commit, `node --check` không nằm trong suite nào.

**Khuyến nghị (tôi cho là ưu tiên cao nhất trong cả danh sách)**:
1. `node --check` mọi `.js` thành test case đầu tiên của `hook-tests` — 5 dòng code, chặn đúng lỗi vừa xảy ra.
2. Một `pre-commit` hoặc `scripts/preflight.js` chạy: node --check · 2 suite · `sync-codex-agents --check` ·
   `plugin validate --strict`.
3. Quy ước: sau bất kỳ find-replace hàng loạt, chạy preflight trước khi commit.

---

## Không phải xung đột, nhưng cần biết khi tổng hợp

- **Ba điều kiện phát hành còn treo**: verify độc lập sau round 11–12 · dogfood raw idea → LOCK (cần
  bằng chứng thật của founder) · meta-eval (b) gatekeeper bắt lỗi form cài sẵn và (d) cold-start trên
  pack thật (cả hai cần gọi Agent).
- **Vùng tôi tuyên bố không đánh giá được**: R1 của bộ hermes — `richard/spike` không có trong repo nên
  tôi hạ claim xuống "không nằm trong artifact đọc được", không phải "họ thiếu".

---

## Thứ tự tôi khuyến nghị nếu fix một lần

1. **P1** (preflight + node --check) — chặn tái diễn lỗi tệ nhất, rẻ nhất.
2. **C2** (một bộ template) và **C3** (tuyên bố nguồn) — hai cơ chế đã gây blocker 2 lần.
3. **C1 + C7** cùng lúc (dogfood workspace ra khỏi `ideas/`) — một việc giải hai xung đột.
4. **C4 + C5 + C6** — dọn tài liệu/version/nhãn, thuần cơ học.
5. **D1** — chọn 3 mục code hoá, ghi lý do cho 5 mục còn lại.
6. **D2** — đo lại tải context sau restructure.

---

# Bổ sung từ đợt absorption run #2 (Claude, 2026-07-30)

> Xung đột do **chính công việc của tôi** tạo ra hoặc để lại, sau khi tự audit 6 fix + 3 hạng mục
> hấp thụ + 5 hạng mục hôm nay (`verify-threshold-snapshot.js`, `validate-beachhead.js`, FM-10,
> `audit-trail` vào pack, `evals/`). Cùng format, tiếp số. Tôi không tự quyết cái nào.

---

## C8 — `signing-blocked` được ra lệnh dùng nhưng KHÔNG có trong enum `type`

**Bằng chứng**: `skills/gate-check/SKILL.md` (Layer 0, nhánh declined/blocked) ra lệnh *"append a
`signing-blocked` row"*. `skills/method-rules-artifact-schema/SKILL.md` có nó trong **bảng `detail`**
nhưng dòng enum `` `type`: `gate-verdict` | `pivot` | … | `other` `` **không liệt kê nó** — grep dòng
enum ra 0 hit.

**Vì sao là xung đột thật**: `type` là một enum đóng có 14 giá trị. Một row hợp lệ theo lệnh của
gate-check lại nằm ngoài enum, nên người/script đọc log sẽ coi nó là `other` hoặc là sai schema. Đây
đúng dạng lỗi mà `validate-evidence-ledger.js` bắt cho ledger, chỉ khác là decision-log **không có**
validator nên nó sẽ trôi im lặng.

**Lựa chọn**: (a) thêm `signing-blocked` vào dòng enum · (b) đổi lệnh thành `type: other` +
`detail: outcome=…` · (c) viết validator cho decision-log (như ledger) để enum thành cưỡng chế.

**Khuyến nghị**: (a) ngay, (c) sau — decision-log là journal chịu lực duy nhất chưa có validator, và
tôi vừa thêm một `type` vào nó mà không có gì kiểm được là tôi làm đúng.

---

## C9 — Từ vựng threshold bị nhân bản ở 2 file, 2 TÊN khác nhau, không gì buộc chúng khớp

**Bằng chứng**: `THRESHOLD_FIELDS` khai ở `hooks/scripts/guard-thresholds.js:19` **và**
`scripts/verify-threshold-snapshot.js:41`. Cái seal cùng khái niệm nhưng khác tên:
`NON_REVISABLE = new Set(["signed_date"])` (hook, dòng 29) vs `SEALED = new Set(["signed_date"])`
(script, dòng 49). Hiện **khớp** (tôi vừa kiểm bằng script), nhưng không test nào khẳng định điều đó.

**Vì sao là xung đột thật**: đúng cơ chế của C2 — hai bản giữ tay của cùng một thứ. Thêm một threshold
field mà quên một bên: hook chặn, gate-check cho qua (hoặc ngược lại), và hai lớp integrity nói khác
nhau về cùng một field. `sync-codex-agents.js` tồn tại chính vì bài học này với agent bodies. Tệ hơn:
hai *tên* khác nhau làm người đọc không nhận ra đó là cùng một khái niệm.

**Lựa chọn**: (a) tách ra `scripts/threshold-vocabulary.js`, cả hai `require` (hook được phép require
file cùng repo) · (b) giữ 2 bản + fixture khẳng định chúng bằng nhau (rẻ nhất) · (c) đổi cùng tên
`SEALED` ở cả hai để ít nhất tên khớp.

**Khuyến nghị**: (b) ngay hôm nay vì rẻ và bắt được drift, rồi (a) khi tiện. Không làm (c) một mình —
tên khớp mà giá trị lệch thì còn khó thấy hơn.

---

## C10 — `validate-beachhead.js` hard-fail mọi `beachhead-icp.md` viết theo template CŨ

**Bằng chứng**: chạy thật trên workspace mẫu của chính repo:
`node scripts/validate-beachhead.js ideas/proposal-draft` → `ERROR [missing-column] … no "Evidence
(E-id)" column`, `FAILED: 2 error(s); 0 qualifying`. Template cũ có cột *"Why they fit (tier estimate)"*;
template mới (tôi sửa) có `Tier | Behaviour | Evidence (E-id) | Reach`.

**Vì sao là xung đột thật**: contract giờ bắt script phải exit 0 ở F. Mọi idea **đang dở** viết trước
hôm nay sẽ FAIL gate F vì lý do định dạng, không phải vì thiếu prospect. Không có đường migrate và
không có thông báo nào nói "regenerate bảng". Đây là breaking change tôi đưa vào mà chưa xử lý.

**Lựa chọn**: (a) script nhận cả 2 shape, shape cũ → **warning + không đếm được** (degrade, không
fail) · (b) viết `scripts/migrate-beachhead.js` chuyển bảng + để trống 3 ô cần người điền · (c) chỉ
áp cho `pipeline_version: 1.2.0`, artifact cũ dùng luật cũ · (d) giữ hard-fail, ghi vào release notes.

**Khuyến nghị**: (c) + (b). Bản chất là thay đổi vocabulary có version — plugin đã có tiền lệ đúng
với `LEGACY_RUNGS` trong `validate-artifact.js` (nhận giá trị cũ trên artifact tiền-1.2.0, yêu cầu
migrate ở lần sửa sau). Làm y hệt thế.

---

## C11 — `mvp-pack/audit-trail.md` là bắt buộc, nhưng miễn trừ khỏi luật "mọi id resolve trong pack" mà không ai nói

**Bằng chứng**: tôi thêm *"Always: `mvp-pack/audit-trail.md`"* vào
`skills/method-rules-gate-contracts/SKILL.md:56`. Dòng 59 nói *"Every id cited inside the pack resolves
inside the pack. LOCK Layer 1 parses `mvp-spec.md`, positioning, and the technical design for
`E-`/`A-`/`K-`/ops references and fails on any that cannot be resolved"*. `audit-trail.md` **có** cite
E-id và **có** trỏ tới `private/gatekeeper-*.md` — thứ cố ý không đi vào pack.

**Vì sao là xung đột thật**: hiện chưa vỡ vì dòng 59 liệt kê đúng 3 file. Nhưng nó là bẫy: ai mở rộng
parser thành "mọi file trong pack" (một sửa đổi rất hợp lý) sẽ làm LOCK fail vì chính file tôi bắt
phải có. Miễn trừ đang tồn tại **do liệt kê**, không do tuyên bố.

**Lựa chọn**: (a) tuyên bố tường minh: audit-trail được miễn, và nói vì sao (nó là bản ghi *review*,
tham chiếu tới nguồn cố ý không portable là đúng chức năng) · (b) bắt audit-trail chỉ dùng id resolve
được trong pack · (c) bỏ audit-trail khỏi pack, chỉ giữ ở workspace.

**Khuyến nghị**: (a). (b) sẽ làm mất chính giá trị của nó — nó phải nói được "contested per gatekeeper
B4" kể cả khi B4 không đi theo; đó là lý do nó tồn tại.

---

## C12 — Registry tự nhận là sổ đăng ký nhưng bỏ trắng cả run #3

**Bằng chứng**: `plugin/failure-modes.md` ghi *"Nguồn hiện tại: dogfood-report.md (run #1), run #2 …,
codex-review.md"* và grep `"run #3"` → **0 hit**. Trong khi đó code và skill đã mang finding run #3:
`hooks/scripts/guard-thresholds.js` (2 hit), `skills/gate-check/SKILL.md` (1 hit — deferred threshold
phải bind vào event; kill criterion không được thêm gate predicate).

**Vì sao là xung đột thật**: sổ này có một luật tự đặt — *"một dòng chỉ được thêm khi dạng sai đó đã
xảy ra thật"* — và mục đích của nó là làm khoảng cách cưỡng chế **hiện ra**. Một sổ thiếu một run
nguyên vẹn thì bản đồ ở §1 đọc như đã đầy đủ trong khi không phải. Tôi viết sổ trước khi run #3 của
bạn kết thúc và không quay lại cập nhật.

**Lựa chọn**: (a) tôi/bạn thêm các FM của run #3 (ít nhất: kill-criterion phát minh gate predicate;
deferred threshold có date mà không có event) · (b) đổi header thành "chỉ tới run #2" cho trung thực
tạm thời · (c) gộp sổ này vào `dogfood-report.md` để chỉ có một nơi.

**Khuyến nghị**: (a) và làm ngay khi run #3 chốt — kèm một luật quy trình: **mỗi run dogfood kết thúc
bằng việc cập nhật registry**, nếu không nó sẽ luôn tụt lại.

---

## C13 — `evals/` (hạ tầng dev) sẽ ship cho mọi người dùng

**Bằng chứng**: `.claude-plugin/plugin.json` không có allowlist file. Nên `evals/` (gồm
`fixtures/build-fixtures.js` sinh 3 workspace giả), `plugin/*.md` (12 doc thiết kế), `tests/`,
`process/`, `templates/` đều vào bản cài của người dùng.

**Vì sao là xung đột thật**: `evals/fixtures/` **cố ý** chứa workspace có defect gieo sẵn, có
`state.json` thật và `ideas/<slug>/` thật. Sentinel của hook là "có `state.json` kề bên chứa
`pipeline_version`" — cùng cơ chế đã tạo ra **C1**. Nếu ai chạy generator trong repo của họ, họ có 3
idea giả bị hook nhận là thật. Và `SEEDED-DEFECT.md` là answer key cho eval, nằm trong bản phát hành.

**Lựa chọn**: (a) thêm allowlist/`.npmignore`-tương đương cho packaging, loại `evals/ tests/ plugin/` ·
(b) đổi generator để chỉ ghi vào `os.tmpdir()`, không bao giờ ghi trong repo (hiện mặc định là
`evals/fixtures/generated/` — đã gitignore nhưng vẫn nằm trong repo người dùng) · (c) giữ nguyên, ghi
rõ trong `evals/README.md` là dev-only.

**Khuyến nghị**: (b) ngay — sửa mặc định thành tmpdir, một dòng, đóng luôn nguy cơ kiểu C1 · rồi (a)
khi quyết được ranh giới packaging.

---

## D3 — Ba script bị hard-require ở gate, nhưng `state-write.js` vẫn chỉ là "prefer"

**Bằng chứng**: contract giờ buộc exit 0 với `validate-evidence-ledger.js`,
`verify-threshold-snapshot.js`, `validate-beachhead.js`. Còn
`skills/method-rules-state-schema/SKILL.md:65` vẫn là *"**prefer** updating state via state-write.js"*.
Run #2: `state.json` bị ghi **21 lần** bằng `Edit`/`Write`, **0 lần** qua state-write → schema
validation + `.bak` + atomic rename chưa từng chạy, và state **đã** bị truncate thật một lần.

**Vì sao là căng thẳng thiết kế**: ta vừa hard-require 3 lớp kiểm *đọc* trong khi lớp bảo vệ *ghi* —
thứ trực tiếp ngăn cái hỏng đã quan sát được — vẫn tuỳ ý. Trạng thái FM-5 ghi "vẫn mở".

**Lựa chọn**: (a) đổi thành MUST + gate-check chặn nếu không có `.bak` sau khi state đổi · (b) hook
`PreToolUse` chặn `Write|Edit` trực tiếp vào `state.json` và chỉ dẫn dùng writer · (c) giữ "prefer",
chấp nhận rằng model sẽ không dùng.

**Khuyến nghị**: (b). "Prefer" đã được test một lần và kết quả là 0/21. Một luật mà thực nghiệm cho
0% tuân thủ thì không phải luật.

---

## D4 — F đòi "reach channel khả thi": đúng ranh giới hay lại là một gate predicate phát minh?

**Bằng chứng**: tôi thêm vào contract F *"a reach channel through which a reply is plausible (a public
forum handle is not one)"* và `validate-beachhead.js` hard-fail nếu thiếu. Nhưng run #3 vừa dựng luật
ngược lại ở Layer 0: kill criterion K2 đòi `funnel status ≥ contacted` bị gọi là **gate predicate phát
minh**, vì *"contacted"* thuộc V1, không thuộc F.

**Vì sao là căng thẳng thật**: "reachable" và "contacted" khác nhau — nhưng khác bao nhiêu? Nếu F chỉ
đòi *danh sách có bằng chứng tier*, thì reachability cũng là việc của V1 và tôi vừa làm đúng cái mà
run #3 vừa cấm. Nếu F đòi reachability, thì K2 gần đúng hơn là sai. Hai luật do hai đợt sửa khác nhau
viết ra, chưa ai đối chiếu.

**Lựa chọn**: (a) F đòi reachability (giữ của tôi), làm rõ trong contract rằng *contacted* mới là V1 ·
(b) bỏ reach khỏi F, chuyển thành warning, để V1 cưỡng chế · (c) F đòi reachability nhưng ở mức
warning + reach-risk finding, không hard-fail.

**Khuyến nghị**: (a) với một câu tường minh trong contract F phân biệt reachable vs contacted — vì
run #2 cho thấy 8 prospect "thật" mà **không một ai** có kênh trả lời, và đó là finding có giá trị nhất
của cả run. Nhưng đây là quyết định của bạn, không phải của tôi: nó thay đổi độ khó của F.

---

## D5 — Lớp diễn giải: sổ nói "đo được" nhưng con số vẫn chưa tồn tại

**Bằng chứng**: `plugin/failure-modes.md` §1 giờ ghi *"Không, và không tất định — nhưng giờ đo được:
`evals/` + `scripts/run-gatekeeper-eval.js`"*. Chưa chạy lần nào: `claude plugin eval` bị gate
early-access, và harness của tôi tiêu token thật (~9 lượt gatekeeper cho `--runs 3`).

**Vì sao là căng thẳng**: "đo được" và "đã đo" cách nhau một quyết định chi tiêu. Cho tới khi có số,
mọi phát biểu về FM-1/FM-3 vẫn là *"bắt được một lần ở run #2"*. Có nguy cơ hạ tầng eval trở thành
bằng chứng thay cho phép đo — đúng dạng sai FM-1 mà nó được xây để bắt.

**Lựa chọn**: (a) chạy `--runs 3` ngay, chấp nhận sai số, điền số vào §1 · (b) chờ hết early-access
rồi chạy `claude plugin eval --runs 10` · (c) coi eval là điều kiện phát hành: không claim gì về lớp
diễn giải cho tới khi có số.

**Khuyến nghị**: (c) làm chính sách, (a) làm bước đi. Và cho tới lúc đó, câu trong README/registry
phải là *"chưa đo"*, không phải *"đo được"* — tôi đã viết vế thứ hai và nó đọc mạnh hơn sự thật.

---

## P2 — Tôi và bạn sửa cùng file cùng lúc, không có khoá; đã suýt sai một lần

**Bằng chứng**: trong phiên này `skills/method-rules/SKILL.md`, `skills/gate-check/SKILL.md`,
`README.md`, `hooks/scripts/*.js`, `tests/hook-tests.js` đều bị cả hai sửa. Hệ quả cụ thể:
(1) suite của tôi báo **7 fail rồi 5 fail rồi 0 fail** trong vài phút — race với edit đang lưu, không
phải regression; (2) tôi grep `signed_date` thấy declaration **biến mất** rồi lại xuất hiện ở module
scope; (3) tôi đã suýt "sửa" một lỗi TDZ mà bạn đang tự sửa; (4) hai file tôi sửa (`artifact-schema`,
`stage-0-framing/templates`) bị bạn **di chuyển sang skill mới** giữa lúc tôi làm — nội dung theo sang
được, nhưng chỉ vì đường dẫn cũ tình cờ vẫn tồn tại lúc tôi ghi.

**Vì sao là xung đột quy trình thật**: mọi kết luận "test đỏ/xanh" trong một cửa sổ như thế đều không
đáng tin, và tôi đã phải chạy lại 3 lần mỗi lần để phân biệt race với regression. Nếu tôi tin lần chạy
đầu tiên, tôi đã báo cáo một regression không tồn tại — hoặc bỏ qua một cái thật.

**Lựa chọn**: (a) tuần tự hoá: một người sửa, người kia chỉ đọc, đổi vai tường minh · (b) tôi làm trên
branch/worktree riêng, bạn merge · (c) chia vùng: tôi chỉ `scripts/ tests/ evals/`, bạn `skills/
hooks/ README` · (d) giữ nguyên + luật "mọi kết luận test phải qua 3 lần chạy giống nhau".

**Khuyến nghị**: (b) cho đợt fix một lần sắp tới — nó chính là đợt dễ xung đột nhất, và (d) như một
luật thường trú vì nó rẻ và đã cứu tôi một lần trong phiên này.

---

## Không phải xung đột, nhưng cần biết khi tổng hợp (bổ sung)

- **Một xung đột doc-vs-code có sẵn đã tự khép nhờ FM-10**: `README.md:41` từ trước vẫn nói hooks
  *"fail open with a visible notice"*. Trước khi tôi sửa, điều đó **sai** với trường hợp crash (im
  lặng hoàn toàn — chính thứ đã che ReferenceError của `session-start.js`). Sau khi thêm stderr thì
  câu đó **đúng**. Không cần sửa, nhưng nên biết là nó từng sai.
- **`verify-threshold-snapshot.js` chạy OK trên `ideas/proposal-draft`** (`signed 2026-07-29`, chain
  nguyên vẹn) — nên nếu C1 chuyển workspace đó ra ngoài `ideas/`, nhớ là nó đang là fixture thực tế
  duy nhất chứng minh script hoạt động trên dữ liệu thật.
- **Ranh giới tôi tuyên bố không đóng được**: `user_approved: true` là dữ liệu do writer tự viết. Không
  file check nào phân biệt được approval thật với approval tự khẳng định. Đó là warning
  `self_authored`, và nó là **giới hạn kiến trúc**, không phải việc còn tồn.
- **4 thay đổi dạng prose/contract của tôi chưa verify runtime**: Layer 0 signing-blocked, promotion
  discipline §4, gatekeeper checklist 15–20, tier contract. Suite không test prose. Chỉ một run
  founder thật mới nói được chúng có hoạt động.

---

## Thứ tự tôi khuyến nghị cho phần bổ sung này

1. **C8** (thêm vào enum) và **C13(b)** (generator ghi vào tmpdir) — mỗi cái một dòng, đóng luôn một
   nguy cơ kiểu C1.
2. **C9(b)** (fixture khẳng định 2 bản từ vựng khớp) — rẻ, chặn drift đã gây blocker 2 lần ở chỗ khác.
3. **C10** (migrate beachhead theo tiền lệ `LEGACY_RUNGS`) — đây là breaking change duy nhất tôi đưa
   vào; nên đóng trước khi có ai chạy F trên idea đang dở.
4. **D4** — quyết ranh giới reachable/contacted **trước** C10, vì nó quyết định script kiểm cái gì.
5. **C11**, **C12** — tuyên bố miễn trừ, cập nhật registry với run #3.
6. **D3** — quyết "prefer" hay "must" cho state-write. Thực nghiệm đang là 0/21.
7. **D5** — chốt chính sách: không claim gì về lớp diễn giải cho tới khi có số đo.

---

## Ghi chú hợp nhất: P1 ↔ P2 là cùng một xung đột, và phần quy kết trong P1 cần kiểm lại

**P1 và P2 nên gộp thành một mục.** Cùng hiện tượng (nhiều tay sửa song song, không khoá), nhìn từ hai
phía: P1 từ phía người phát hiện repo bị hỏng, P2 từ phía process bị race khi đo. Khuyến nghị của P1
(`node --check` thành test case đầu tiên + `scripts/preflight.js`) đúng và nên là mục ưu tiên số 1 của
cả danh sách gộp; P2 chỉ thêm hai thứ vào đó: **worktree riêng cho đợt fix một lần**, và luật **"mọi
kết luận test phải qua 3 lần chạy giống nhau"**.

**Về phần quy kết trong P1** — áp đúng luật method-rules §1 mới (*"một nguyên nhân cũng là một claim —
đừng kể nguyên nhân chưa kiểm chứng"*), tôi chỉ nói được điều tôi tự chứng thực được:

- Tôi **không** chạy find-replace toàn cục nào. Mọi sửa của tôi là `Edit`/`Write` có đích danh, trên
  danh sách file đóng: `hooks/scripts/{guard-thresholds,validate-artifact,session-start}.js` ·
  `tests/hook-tests.js` · `skills/gate-check/SKILL.md` · `skills/method-rules/SKILL.md` ·
  `skills/method-rules-{artifact-schema,gate-contracts}/SKILL.md` ·
  `skills/stage-0-framing-templates/SKILL.md` · `skills/stage-5-scope-lock/SKILL.md` ·
  `agents/gatekeeper.md` (+ sync TOML) · `README.md` · `README.vi.md` · `.gitignore` · và các file
  **mới**: `scripts/{verify-threshold-snapshot,validate-beachhead,run-gatekeeper-eval}.js`,
  `evals/**`, `plugin/failure-modes.md`.
- Tôi **không** tái cấu trúc 15 skill thành 24. Việc đó xảy ra **trong lúc** tôi đang làm và không do
  tôi: hai file tôi đang sửa (`method-rules/artifact-schema.md`, `stage-0-framing/templates.md`) biến
  mất khỏi đường dẫn cũ giữa phiên.
- Một sửa đổi tôi **có** làm và cần ghi rõ vì nó gần giống thứ P1 mô tả: tôi thay **một byte NUL thật**
  trong `guard-thresholds.js` (sentinel của `canon()`) bằng escape 6 ký tự `\u0000`. Chuỗi runtime y
  hệt, `node --check` sạch, 163 test xanh, và nó làm file thôi bị mọi tool báo "Binary file matches".
  Nếu ai thấy diff đó và nghi là hỏng — nó là chủ ý.

**Vì sao chỗ này đáng kiểm**: nếu nguyên nhân của P1 bị quy sai, fix sẽ nhắm sai. "Find-replace toàn
cục" cần một luật khác (preflight sau bulk-edit) so với "hai process cùng ghi một file" (cần khoá hoặc
worktree). Cả hai luật đều nên có, nhưng nên biết cái nào đã thực sự xảy ra. Ba script mà P1 nói bị
chết cú pháp **hiện đều hợp lệ** (`node --check` sạch cả 3, vừa kiểm).
---

# RESOLUTION LOG (2026-07-30 — đợt fix một lần)

> Mọi mục trên đã được định đoạt trong một pass duy nhất (một người ghi, sau checkpoint commit
> `3b2a385` bảo toàn cả hai đợt việc song song). Kiểm chứng: `node scripts/preflight.js` xanh cả 4
> kiểm (syntax sweep · hook-tests 172 · contract-tests 149 · codex parity). Ký hiệu X- tham chiếu
> bản kê của phiên song song (`../SaaS-idea-brainstorm-test-sayitalive/dogfood/conflicts.md`).

| Mục | Định đoạt | Ở đâu |
|---|---|---|
| **P1+P2/X12** | Gộp làm một, xử trước tiên: checkpoint commit ngay; `node --check` mọi `.js` thành test ĐẦU TIÊN của hook-tests; `scripts/preflight.js` (4 kiểm); thoả thuận làm việc thường trú (một người ghi / worktree; preflight trước commit; kết luận test cần 3 lần lặp) | `tests/hook-tests.js` (syntax sweep) · `scripts/preflight.js` · `outstanding-work.md` §7 |
| **X1+X2** | **Gate F pass được trở lại**: giữ `validate-beachhead.js` làm validator prospect DUY NHẤT, hấp thụ 4 kiểm của bản tracker (resolved entity + dedup pháp nhân · "là đối thủ" ≠ workaround · listicle-only · `observed_at` ISO, thêm duplicate-Pid); xoá `validate-prospect-tracker.js`; contract F (dòng 13 + bullet cross-gate) chỉ còn một validator; template stage-0 (skill + root) phát đúng shape 9 cột validator nhận | `scripts/validate-beachhead.js` · `method-rules-gate-contracts` · `stage-0-framing-templates` · `templates/0-framing.md` |
| **X3** | Hai suite không còn test "validator của phe mình": contract-tests giờ test validator gộp + fixture khẳng định `validate-prospect-tracker.js` KHÔNG tồn tại; hook-tests giữ phần cơ học + legacy | `tests/pipeline-contract-tests.js` · `tests/hook-tests.js` |
| **X4** | coverage-report biết cả 4 validator mới; `threshold-snapshot-matches` nâng agent→code; thêm `prospect-cells-and-floor`, `r1-run-contract-preregistered`, `state-truncation-blocked` → 48% deterministic (73 req) | `scripts/coverage-report.js` |
| **X5** | README (2 thứ tiếng) có `evals/`, `dogfood/`, `preflight.js`, và tuyên bố skills-là-nguồn | `README.md` · `README.vi.md` |
| **X6** | Run #1/#2/#3 được định nghĩa một chỗ, kèm workspace của từng run | `dogfood/README.md` (+ header `failure-modes.md`) |
| **C1+C7** | Chọn (b): `ideas/proposal-draft/` → `dogfood/proposal-draft/`; luật state-schema đứng nguyên không cần ngoại lệ; sentinel không còn bắt nhầm; luật "một workspace một lần ký, không tái dùng" ghi thành văn — "re-run F" hết mơ hồ | di chuyển thư mục · `.gitignore` · `dogfood/README.md` |
| **C2** | Chọn (b)-thu-hẹp: skill-templates là NGUỒN; root `templates/` là bản render manual-mode (mỗi file mang header nói rõ); bảng chịu lực được fixture-check từ CẢ HAI producer (cơ chế producer-agreement mở rộng sang prospect table) | header 6 file `templates/*` · block "prospect-table producers" trong contract-tests |
| **C3** | Chọn (a): tuyên bố "skills thắng khi lệch" ở đầu `process/pipeline.md` + README | `process/pipeline.md` |
| **C4** | Chọn (b): `plugin/README.md` index — 4 file live, 10 file lịch sử đóng băng | `plugin/README.md` |
| **C5** | Chọn (a): version duy nhất ở `plugin.json`; 4 header skill bỏ số tự khai; số trong doc lịch sử giữ nguyên như dữ kiện lịch sử (index nói rõ) | 4 SKILL.md · `plugin/README.md` |
| **C6** | Sửa 19 nhãn `where` về tên skill trần | `scripts/coverage-report.js` |
| **C8** | Chọn (a): `signing-blocked` vào dòng enum `type` + contract-test cho enum; (c) validator decision-log ghi nợ | `method-rules-artifact-schema` · contract-tests |
| **C9** | Chọn (b): fixture so khớp `THRESHOLD_FIELDS` và seal-set (NON_REVISABLE vs SEALED) giữa hook và script bằng trích xuất nguồn — drift = test fail | contract-tests block "threshold vocabulary" |
| **C10** | Chọn (c) theo tiền lệ `LEGACY_RUNGS`: workspace `pipeline_version` < 1.2.0 với shape cũ → warning `legacy-shape`, exit 0, KHÔNG đếm máy (Layer 2 đếm tay), migrate ở lần sửa hợp lệ kế; đã chạy thật trên `dogfood/proposal-draft` (1.1.0) → OK (legacy) | `validate-beachhead.js` + 2 test |
| **C11** | Chọn (a): miễn trừ audit-trail tuyên bố tường minh trong contract LOCK, kèm lý do và cảnh báo cho ai mở rộng parser | `method-rules-gate-contracts` |
| **C12** | Chọn (a): FM-11 (kill criterion phát minh gate predicate), FM-12 (deferred threshold không bind event), FM-13 (tracker prose thổi số) vào registry + luật "mỗi run kết thúc bằng cập nhật registry" | `plugin/failure-modes.md` |
| **C13** | Chọn (b): generator fixture mặc định ghi `os.tmpdir()`, không bao giờ trong repo (runner eval vốn đã dùng tmpdir); (a) allowlist packaging ghi nợ | `evals/fixtures/build-fixtures.js` · `outstanding-work.md` §7 |
| **D1** | 8 mục prose phân loại tại chỗ trong coverage-report: 5 cố ý (kèm vì sao) + 3 NỢ code hoá (budget-preflight, charter-playback, instrumentation-check) | `scripts/coverage-report.js` · `outstanding-work.md` §7 |
| **D2** | Đo lại sau restructure: core 171 dòng luôn load; phiên gate điển hình ≈ 360–460; tệ nhất ≈ 655 (số cũ 466 hết hiệu lực, cơ chế load đã đổi) | `outstanding-work.md` §4 |
| **D3** | "Prefer" (0/21 tuân thủ) → **MUST** trong state-schema; guard hook chặn tất định direct-edit làm rớt key chịu lực của state.json (đúng dạng truncation đã xảy ra) + test; full-deny (b) để ngỏ nếu run #4 vẫn 0% dùng writer | `guard-thresholds.js` · `method-rules-state-schema` · hook-tests |
| **D4** | Chọn (a): F đòi reachability, câu phân định **reachable ≠ contacted** viết thẳng vào contract F (contacted thuộc V1; criterion đòi `funnel ≥ contacted` ở F = gate predicate phát minh, bị từ chối) — nhất quán với Contract-authorization check của run #3 | `method-rules-gate-contracts` (F + cross-gate bullet) |
| **D5** | Chọn (c)+(a): chính sách "không claim khi chưa có số"; mọi chỗ "đo được" đổi thành "CHƯA ĐO"; bước đi: chạy `--runs 3` | `plugin/failure-modes.md` §1/§4 · `outstanding-work.md` §7 |
| **V1** | Round 14 được định vị là "restructure không vỡ gì", KHÔNG phải điều kiện phát hành; luật review 2 chế độ (một có Bash, một buộc trace) thành luật thường trú | `outstanding-work.md` (đầu file + §7) |
| **V2** | Đã đóng từ trước (Codex rút lại); giữ nguyên bản ghi | — |
| **X7–X11** | Không thuộc repo này / cần dữ liệu run kế — ghi nợ tường minh | `outstanding-work.md` §7 |

**Ba chỗ HỘI TỤ được giữ nguyên đúng cảnh báo của bản kê X** (không revert nhầm): leaf addressing
`custom.<key>` ở cả hook lẫn `verify-threshold-snapshot.js` (giờ có fixture C9 giữ chúng khớp);
fail-open có stderr của `session-start.js` + walk-up boundary (FM-10 đã vá, có test); ba kiểm Layer 0
của gate-check (preflight + contract-authorization) không chồng nhau.

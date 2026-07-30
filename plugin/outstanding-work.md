# Việc còn lại trước khi phát hành (2026-07-30)

> Một plugin, một quy trình liền mạch: raw idea → LOCK → maintenance sau LOCK. Không có "hai tầng"
> hay hai chủ. File này liệt kê những gì CHƯA xong, kèm bằng chứng, để không ai (kể cả model) tự
> tuyên bố hoàn thành.
>
> Bối cảnh: `plugin/solo-dev-comparison.md` (đối chiếu với một agent-team solo-dev + 5 vòng review),
> `plugin/codex-review.md` (7 vòng trước đó), `plugin/dogfood-report.md`.

## Trạng thái kiểm chứng hiện tại (cập nhật sau đợt giải xung đột 2026-07-30)

```
node scripts/preflight.js                 → PASS cả 4 kiểm:
  syntax sweep (node --check mọi .js)     → pass
  tests/hook-tests.js                     → 172 passed
  tests/pipeline-contract-tests.js        → 149 passed
  scripts/sync-codex-agents.js --check    → pass
node scripts/coverage-report.js           → 48% deterministic / 52% model-dependent (73 req)
```

**Chưa phát hành được.**

Hai verdict độc lập, và chúng KHÔNG ngang giá trị:
- Codex `gpt-5.6-sol` xhigh, round 11: *"fix-then-dogfood; the dogfood run is not the only remaining
  release condition."* — sau khi tìm 1 blocker + 7 major bằng cách chạy code.
- Claude Code CLI (opus-4-5), round 14: *"Releasable"* — nhưng **đọc kỹ nó đã test cái gì**: supersession
  loop, multiple supersede targets, escaped pipe, missing self-hash, file-added, frozen cycle… **toàn bộ
  đều đã có fixture sẵn**. Nó chạy lại vùng đã được bao phủ chứ không mở vùng tấn công mới, và tìm được
  đúng 1 minor mà chính nó tự bác. Round 13 (cùng model, KHÔNG có Bash) lại tìm ra 2 lỗi thật —
  gồm một lỗi logic trong chính fixture. Nghịch lý đó là dữ liệu: **reviewer chạy được code có xu hướng
  dừng ở "chạy thấy ổn", reviewer buộc phải trace thì đọc ra lỗi logic.**

Kết luận về giá trị bằng chứng: round 14 chứng minh **không có gì vỡ sau restructure** — đúng và hữu ích.
Nó KHÔNG chứng minh đủ điều kiện phát hành, vì ba điều kiện còn lại (dogfood raw→LOCK, meta-eval (b) và
(d)) nằm ngoài tầm nó chạm tới và nó cũng không nhắc tới.

---

## 1. Chưa có verify độc lập sau các sửa của round 11–12

Round 11 tìm 1 blocker + 7 major; tất cả đã sửa và có regression. Round 12 **không có verdict** vì
Codex hết quota (reset 2026-08-05). Bốn câu tự kiểm thay thế nằm ở `solo-dev-comparison.md` §6.7 —
một trong số đó lộ ra lỗ thật (nhãn PROSPECTIVE có thể sống sót qua một LOCK fail), đã bịt.

**Cần**: một vòng review độc lập nữa sau round 11+12. Bài học từ 12 vòng — bắt reviewer **trace thứ
tự thực thi và chạy code**, đừng để nó đọc chữ: round 6, 10 và 11 đều tìm ra defect mà review-bằng-đọc
bỏ sót hoàn toàn (thứ tự LOCK bất khả thi · manifest verify fail-open · template sinh artifact mà
validator của chính nó từ chối). Và tránh khung "adversarial probe/attack" khi nói về hashing/symlink
— filter an toàn của provider sẽ chặn output (đã xảy ra thật ở round 10).

```bash
codex exec -m gpt-5.6-sol -c model_reasoning_effort=xhigh -s read-only --skip-git-repo-check -
```

## 2. Dogfood đầy đủ raw idea → LOCK, chưa từng chạy

Dogfood #1 dừng ở gate F, và chính báo cáo của nó tự nhận là *failure-path test, không đủ điều kiện
publish*. Nhánh V2 → LOCK chưa bao giờ được thực thi.

## 3. Nhánh sau LOCK — cơ học ĐÃ chạy, ngữ nghĩa thì chưa

Chuỗi `declare-drift` → `reconcile` → `run-validation` đã được chạy thử ở tầng cơ học lần đầu tiên:
xem [mechanics-run.md](mechanics-run.md). 8 bước thuận + 3 negative đều đúng, và lần chạy tìm ra một
defect thật (`create --out private/…` fail ENOENT khi `private/` chưa tồn tại → chặn gate vì lý do
không liên quan tới artifact; đã sửa + fixture).

**Còn thiếu**: phần ngữ nghĩa do model thực thi — so sánh ba tầng, impact routing, claim transition,
dismissal chỉ được `duplicate|erroneous|out-of-scope`, và adjudication của `run-validation`
(`confirmation_window`, report không spec là void). Những thứ đó cần một lần chạy có model đọc skill
và một người xác nhận kết quả.

## 4. Ngân sách context — ĐÃ cắt 38%

`method-rules-maintenance-rules` skill (291 dòng) không còn nằm trong bundle mặc định. `method-rules` §10 giữ **luật
load theo yêu cầu + 5 sự thật** mà pipeline-phase cần biết mà không phải mở file. Ba skill sau LOCK
tự load nó (đã ghi rõ trong từng skill). Phản biện đã xử lý: **drift boundary giờ tự chứa trong
gate-check** — nêu đủ luật để hành động, không cần đọc file nào khác.

```
default bundle: 757 → 466 dòng  (-38%, trước restructure)
```

**Đo lại sau restructure (2026-07-30, conflicts D2)** — cơ chế load đã đổi: mỗi file tham chiếu giờ
là một skill load-theo-yêu-cầu, nên "bundle" không còn là một con số duy nhất mà là tổng theo ngữ
cảnh:

```
luôn load khi làm việc trên idea:  method-rules                171 dòng
+ viết artifact:                   method-rules-artifact-schema 194
+ đụng state:                      method-rules-state-schema    101
+ việc gate:                       gate-check 110 + gate-contracts 79
+ sau LOCK (chỉ khi cần):          method-rules-maintenance-rules 297
→ phiên gate điển hình ≈ 360–460 dòng; tệ nhất (LOCK, đủ mọi mảnh) ≈ 655
```

Vì sao đáng theo dõi: ~52% requirement của plugin được cưỡng chế bằng **một agent đọc chính những
file này** (mục 5) — nên cái gì nằm trong context CHÍNH LÀ cái được cưỡng chế. Ngân sách context
không phải chuyện gọn gàng, nó là chất nền cưỡng chế.

## 5. Tỉ lệ cưỡng chế — ĐÃ đo

`node scripts/coverage-report.js` — kiểm kê 73 requirement normative, mỗi cái ghi rõ nằm ở đâu và cái
gì cưỡng chế nó:

```
code    22  30%   một script từ chối vi phạm
hook    13  18%   một hook từ chối lúc ghi
agent   30  41%   chỉ một model đọc artifact mới bắt được
prose    8  11%   không có gì kiểm
→ deterministic 48% · phụ thuộc model 52%
```

Tám requirement tầng `prose` đã được **phân loại tường minh trong chính coverage-report.js**
(conflicts D1): **5 cố ý** (two-identical-failures-stop, outward-action-per-approval,
interpretation-never-promoted, consent-before-material-enters, deletion-never-automatic — mỗi cái
kèm lý do vì sao code không nên/không thể giữ nó) và **3 là NỢ**: budget-preflight,
charter-playback-at-each-gate, instrumentation-check-before-run — ứng viên code hoá, xem mục 7.

Danh sách requirement được **giữ bằng tay** trong `scripts/coverage-report.js` — parse requirement ra
khỏi văn xuôi cũng lại là một phán đoán của model, và một con số bịa còn tệ hơn không có số.

## 6. Meta-eval — 2/4 mục đã chạy

Spec pre-register 4 mục (`plugin-spec.md:96`):

| Mục | Trạng thái |
|---|---|
| (a) một idea đi trọn raw → MVP pack ở Analysis mode, artifact đạt chuẩn từng gate | **CHƯA** — trùng với mục 2 |
| (b) gatekeeper bắt được lỗi form cố ý cài vào | **CHƯA** — cần gọi agent `gatekeeper` (một lần gọi Agent tool); phần *hình thức* của Layer 1 đã có 199 fixture bao |
| (c) tắt hết integration → flow vẫn chạy trọn | **MỘT PHẦN** — mọi thứ trong phiên này chạy zero-integration (không scraping/hosting/analytics/payments/email): 7 script + 2 hook + 3 skill sau LOCK đều thực thi được. Chưa chứng minh được cho nhánh V2→LOCK vì nhánh đó chưa chạy |
| (d) cold-start pass trên pack xuất ra | **CHƯA** — cần agent `coldstart-tester` và một pack thật |

Hai mục còn thiếu đều cần **gọi Agent** (gatekeeper, coldstart-tester). Đó là hai agent của chính
plugin và việc gọi chúng chính là thứ đang được kiểm — chỉ cần bạn đồng ý cho gọi.

## 7. Nợ còn lại sau đợt giải xung đột 2026-07-30

Đợt này đã xử X1–X6, X12, C1–C13, D2–D5, P1–P2, V1–V2 (chi tiết: resolution log cuối
`conflicts-inventory.md`). Còn treo có chủ đích:

1. **D1 — code hoá 3 requirement nợ**: `budget-preflight` (gate-check Layer 1 so `spent_usd` + spend
   log trước khi cho phép hành động trả tiền), `charter-playback-at-each-gate` (từ chối verdict nếu
   không có marker playback trong journal), `instrumentation-check-before-run` (checklist artifact
   kiểm được trong experiment kit). Đã đánh dấu `DEBT` trong coverage-report.js.
2. **C13(a) — ranh giới packaging**: bản cài của người dùng vẫn mang `evals/ tests/ plugin/ process/`.
   Generator fixture đã đổi sang tmpdir (đóng nguy cơ C1-kiểu), nhưng allowlist/manifest packaging
   chưa có — cần quyết khi biết cơ chế đóng gói của marketplace hỗ trợ gì.
3. **D5 policy (đã chốt, chờ thi hành)**: không claim gì về lớp diễn giải cho tới khi
   `run-gatekeeper-eval.js` có số. Chạy `--runs 3` là bước đi đầu; mọi chỗ nói "đo được" đã đổi thành
   "chưa đo".
4. **V1 — luật review hai chế độ**: vòng review độc lập tiếp theo chạy **hai reviewer song song**:
   một CÓ Bash (chạy code), một KHÔNG có Bash (buộc trace). Dữ liệu nền: round 13 (không Bash) tìm 2
   lỗi thật; round 14 (có Bash) tìm 0.
5. **X7/X8 — hai bất đồng với Codex chưa hội tụ** sau 3 vòng; không chốt được bằng tranh luận, cần
   dữ liệu từ dogfood run kế (ghi trong `../SaaS-idea-brainstorm-test-sayitalive/dogfood/conflicts.md`).
6. **X9–X11 — mâu thuẫn nội tại của workspace run #3** (4 bản chép tay một tiêu chí; `state` ↔
   `kill-criteria.md` lệch; 3 artifact trùng dữ kiện) — thuộc repo dogfood, xử trong phiên riêng ở đó.

**Thoả thuận làm việc khi có nhiều phiên song song (P1/P2, thường trú):**
- Một người ghi, người kia chỉ đọc — hoặc worktree/branch riêng rồi merge.
- `node scripts/preflight.js` sau mọi đợt sửa hàng loạt và trước mọi commit.
- Mọi kết luận test đỏ/xanh phải lặp lại được 3 lần giống nhau trước khi tin (chống race với editor).
- Commit sớm, commit thường xuyên — 65 mục uncommitted qua hai phiên song song là điều kiện đủ cho
  X1–X3/X6.

---

## Điểm số gần nhất (Codex round 11, trước các sửa của round 11)

| Chiều | Điểm |
|---|---:|
| Correctness | 7.5 |
| Internal coherence | 7.5 |
| Pipeline logic | 7.5 |
| Prompt-engineering | 9.2 |
| Real-world resilience | 8.0 |
| Completeness | 8.5 |

Điểm này **chưa tính** các sửa của round 11–12 (blocker pack-verdict, producer agreement, DFS
supersession, canonical path, privacy path/duty/waiting_on, sampling-frame một nguồn, prospective
label). Vòng review tiếp theo mới cho biết chúng đứng được không.

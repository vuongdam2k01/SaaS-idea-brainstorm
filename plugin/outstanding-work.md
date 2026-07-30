# Việc còn lại trước khi phát hành (2026-07-30)

> Một plugin, một quy trình liền mạch: raw idea → LOCK → maintenance sau LOCK. Không có "hai tầng"
> hay hai chủ. File này liệt kê những gì CHƯA xong, kèm bằng chứng, để không ai (kể cả model) tự
> tuyên bố hoàn thành.
>
> Bối cảnh: `plugin/solo-dev-comparison.md` (đối chiếu với một agent-team solo-dev + 5 vòng review),
> `plugin/codex-review.md` (7 vòng trước đó), `plugin/dogfood-report.md`.

## Trạng thái kiểm chứng hiện tại

```
node tests/hook-tests.js                  → 109 passed
node tests/pipeline-contract-tests.js     → 137 passed
node scripts/sync-codex-agents.js --check → pass
claude plugin validate . --strict         → pass
node scripts/coverage-report.js           → 44% deterministic / 56% model-dependent
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
default bundle: 757 → 466 dòng  (-38%)
```

Vì sao đáng làm: 56% requirement của plugin được cưỡng chế bằng **một agent đọc chính những file
này** (mục 5) — nên cái gì nằm trong context CHÍNH LÀ cái được cưỡng chế. Ngân sách context không
phải chuyện gọn gàng, nó là chất nền cưỡng chế.

## 5. Tỉ lệ cưỡng chế — ĐÃ đo

`node scripts/coverage-report.js` — kiểm kê 70 requirement normative, mỗi cái ghi rõ nằm ở đâu và cái
gì cưỡng chế nó:

```
code    19  27%   một script từ chối vi phạm
hook    12  17%   một hook từ chối lúc ghi
agent   31  44%   chỉ một model đọc artifact mới bắt được
prose    8  11%   không có gì kiểm
→ deterministic 44% · phụ thuộc model 56%
```

Tám requirement **không có gì kiểm**: two-identical-failures-stop · outward-action-per-approval ·
budget-preflight · charter-playback-at-each-gate · interpretation-never-promoted ·
instrumentation-check-before-run · consent-before-material-enters · deletion-never-automatic.
Vài cái trong đó là cố ý (không gì xoá dữ liệu — đúng thiết kế; outward action dựa vào permission
layer của runtime). Số còn lại là nợ thật.

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

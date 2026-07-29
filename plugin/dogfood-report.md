# Dogfood run #1 — báo cáo (2026-07-29)

> **R5 CORRECTIONS (Codex round-5 audit — sửa các phát biểu quá đà trong báo cáo này):** (1) "state + artifacts correct" = đúng cú pháp; ngữ nghĩa state có defect thật (polarity kill-criteria bị đảo khi sync — đã sửa với stable IDs + desired-state polarity); (2) sampling frame KHÔNG được persist ra file trước khi mining, và mining diễn ra TRƯỚC F signing → **N=37 bị quarantine thành exploratory, V1 phải re-run frame sau chữ ký thật**; (3) "anti-sycophancy proven" → *plausible nhưng chưa audit độc lập được* vì raw report của gatekeeper không được persist (rule mới: mọi gate-check persist verbatim vào private/gatekeeper-<gate>-<date>.md); (4) zero-integration mới chứng minh tới early-pipeline, chưa qua V2→LOCK; (5) "V1 data sẵn 80%" sai với tư cách gate-evidence — chỉ là input exploratory; (6) 1 citation sai (HN 32180171 → 32178328) và 1 kết luận đối thủ quá đà (Better Proposals không anti-AI) — đã sửa trong artifact. Verdict R5: **dogfood #1 = failure-path test thành công, KHÔNG phải E2E đủ điều kiện publish; Run #2 founder thật là bắt buộc.**

> Ý tưởng: `ideas/proposal-draft/` — "AI soạn proposal từ notes discovery-call cho solo consultant". Chế độ: Analysis, auto_continue, **founder mô phỏng (dán nhãn tường minh — mechanics test)**. Phạm vi chạy: new-idea → stage 0 trọn → stage 1 (agents thật) → F signing ceremony → gatekeeper gate F. Điều kiện môi trường: `--plugin-dir` child-session bị chặn auth trong session lồng nhau → dogfood logic thực thi theo đúng skill files; hook chạy qua invocation trực tiếp trên artifact thật.

## Cái gì đã CHẠY THẬT và ĐÚNG

1. **State v1.1 + artifacts**: 8 artifact + state.json đúng schema; validator hook chạy trên cả 8 → sạch; session-start hook nhận diện idea + trạng thái đúng.
2. **Agents theo role file**: competitor-scanner trả 5-tier map có URL verify từng entry (bắt được cả Sembly đánh đúng wedge + Better Proposals anti-AI); community-review-miner **tuân thủ sampling frame trung lập đăng ký trước**: N=37, đếm cả none-cases, khai báo skew (81% là upper bound, post-only ≈75%), tự loại 20+ tài khoản self-promo/astroturf, vượt qua reddit-block bằng archive API có khai báo provenance.
3. **F signing ceremony**: signed_date + lock kill-criteria + threshold-snapshot vào decision-log — gatekeeper đối chiếu snapshot field-by-field: **khớp chính xác**.
4. **Gatekeeper (chống sycophancy — phép thử quan trọng nhất): VERDICT FAIL, đúng như phải thế.** Bắt chính xác 2 blocker cố ý (chữ ký mô phỏng, charter không confirm được), spot-check URL sống (HN + IH khớp; reddit bị chặn → giữ nguyên finding "chưa verify được"), và tìm ra **3 defect cơ chế thật** trong công việc của orchestrator + 5 finding chất lượng. Kỷ luật return-path đúng: "sửa trong stage 0, chạy lại F".
5. **Kỷ luật append-only sống sót áp lực thật**: các fix sau verdict được ghi bằng dòng CORRECTION mới, không sửa lịch sử.

## Findings của gatekeeper → xử lý

| Finding | Cấp | Xử lý |
|---|---|---|
| Chữ ký mô phỏng | blocker | Dogfood-inherent — đúng thiết kế; cần founder thật |
| Charter toàn [INFERred] | blocker | Dogfood-inherent — đúng thiết kế |
| state.kill_criteria thiếu K3 + budget | major | ✔ sync trong-run + **fix plugin** (stage-0: mirror EVERY criterion) |
| market-verdict ghi sớm mâu thuẫn map | major | ✔ dòng correction + **fix plugin** (stage-1: provisional cho tới gate C) |
| K3 chưa nạp ngưỡng (r1_eval_pass_pct null) | major | ✔ load-by date + **fix plugin** (deferred threshold phải có load-by) |
| Grade B không có trail persist | major | ✔ mining-raw.md + downgrade grade + **fix plugin** (persist raw ngay khi agent về) |
| 7/20 prospect dưới bar tier 4–5 | major | ✔ quarantine note + **fix plugin** (tier discipline trong template) |
| A4 không định lượng; K2/K3 menu-action; rung claim lệch | minor | ✔ đã sửa trong-run |

## 5 fix cấp plugin đã áp (từ friction thật)

stage-0 (mirror criteria + deferred-threshold load-by) · stage-1 (persist research raw · market-verdict provisional) · stage-0 templates (tier discipline) — tất cả mang chú thích "(dogfood finding)".

## Kết quả thị trường thu được (bonus ngoài mechanics)

Proven-money, khe hẹp đang đóng; **81%↑/75% behavior-positive** trên frame trung lập (vượt ngưỡng 60% đã ký — V1 nhìn khả quan khi chạy thật); 2 cảnh báo đối kháng: (a) không gian bão hòa validation-bait (13+ tài khoản founder đang thăm dò đúng ý tưởng này — "graveyard of proposal tools"), (b) bottleneck thật có thể là **scoping** chứ không phải viết → gợi ý pivot hướng giải pháp ngay từ V2.

## Meta-eval của spec — trạng thái sau run #1

| Tiêu chí | Kết quả |
|---|---|
| (a) raw idea → artifacts đạt chuẩn cổng | ✔ một phần: đến gate F; artifacts pass formal layer; FAIL đúng lý do |
| (b) gatekeeper bắt lỗi cài chủ đích | ✔ **chứng minh bằng hành vi** (bắt cả lỗi KHÔNG cài chủ đích) |
| (c) tháo tích hợp vẫn chạy | ✔ chạy toàn bộ ở baseline/handoff rung, zero integration |
| (d) cold-start test | ⏳ chưa tới LOCK — thuộc run #2 |

## Còn lại trước publish (run #2 — cần founder THẬT)

**R6 correction**: dòng cũ ở đây từng nói "V1 data đã sẵn 80%" — sai với tư cách gate-evidence (N=37 đã bị quarantine thành exploratory, chạy trước F signing; xem R5-CORRECTIONS). Xóa claim đó — mining phải re-run SAU chữ ký thật, không phải tái dùng dữ liệu quarantine.

Hai vấn đề thực tế Codex vòng 6 phát hiện, phải quyết định trước khi bắt đầu Run #2:
1. **`signed_date` đã non-null** trong `state.json` của chính workspace `proposal-draft` này (từ chữ ký mô phỏng) — Layer 0 F-signing ceremony của gate-check chỉ tự kích hoạt khi `signed_date` là null, nên "re-run F" trên đúng workspace này sẽ KHÔNG tự động chạy lại ceremony. Cần một trong hai: (a) bắt đầu Run #2 trên workspace ý tưởng MỚI (khuyến nghị — sạch nhất), hoặc (b) founder thật tường minh cho phép reset `signed_date` về null (một dòng journal `other`/reset, không phải model tự ý sửa).
2. **Beachhead dưới ngưỡng cứng (R7 correction)**: chỉ 13/20 prospect đạt tier 4–5 on-segment — dưới mức tối thiểu cứng 15 của F contract (15–19 pass kèm reach-risk finding bắt buộc; dưới 15 là FAIL ở Layer 1, không có ngoại lệ). Dòng cũ ở đây từng nói founder có thể "ký F với finding này được ghi nhận" — SAI: founder thừa nhận thiếu hụt là một will-override, và will-override không bao giờ biến FAIL thành PASS. Founder thật BẮT BUỘC tìm thêm ≥2 prospect thật (đạt ≥15) trước khi F có thể pass — không có lối tắt nào khác.

Môi trường: chạy trong session Claude Code bình thường của user với `claude --plugin-dir .` (auth lồng nhau chỉ chặn trong sandbox này).

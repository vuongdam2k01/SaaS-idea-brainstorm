# Báo cáo kiểm chứng quy trình (2026-07-29)

Phương pháp: 6 nhánh research độc lập chạy song song, mỗi nhánh chỉ được kết luận dựa trên **nguồn đã truy cập trực tiếp** (không trả lời từ trí nhớ). Verdict:
- **CONFIRMED** — đúng như nguồn gốc.
- **CORRECTED** — sai/lệch so với nguồn, kèm bản chính xác (đã sửa vào pipeline).
- **UNVERIFIABLE** — không tìm được nguồn; hoặc dán nhãn heuristic, hoặc loại bỏ.

Bài học meta từ chính quá trình research: một kết quả search có vẻ "xác nhận" con số 18/24, nhưng khi truy cập trang gốc thì con số không tồn tại — summarizer bịa. Củng cố nguyên tắc: **mọi con số phải trace về nguồn đã đọc trực tiếp**.

---

## 1. Customer Development — Steve Blank

Nguồn đã truy cập: steveblank.com (6 bài), text gốc "The Four Steps to the Epiphany" (PDF Stanford: web.stanford.edu/group/e145/cgi-bin/winter/drupal/upload/handouts/Four_Steps.pdf).

| Claim | Verdict | Ghi chú |
|---|---|---|
| 4 bước lặp/đệ quy; Validation có vòng pivot về Discovery | CONFIRMED | Sách mô tả mô hình là các vòng tròn đệ quy; không đủ khách trả tiền ở Validation → quay về Discovery |
| Bỏ qua Validation nhảy vào Creation là sai lầm chết người | CONFIRMED | Thuật ngữ chính xác của Blank: **premature scaling** → **Death Spiral**; Creation đặt sau Validation để dồn chi tiêu marketing về sau khi có repeatable sales model (ví dụ Furniture.com đốt $34M marketing trên $10.9M doanh thu) |
| Market Type: có sẵn / tái phân khúc / mới | CONFIRMED | Sách chia 4: existing / new / resegmented-low-cost / resegmented-niche; thời Startup Owner's Manual thêm **clone market**. New market có thể không lãi 5+ năm trong khi existing market 12–18 tháng — cùng một tiêu chí traction cho mọi market type là sai |
| EarlyVangelist 4 tiêu chí | **CORRECTED** | Bản gốc là **thang 5 tầng** ("hierarchy of needs"): (1) có vấn đề → (2) biết mình có vấn đề → (3) chủ động tìm giải pháp có timeline → (4) đã tự chắp vá giải pháp tạm → (5) đã cam kết/kiếm nhanh được ngân sách. **Chỉ tầng 4–5 là earlyvangelist thật**; feedback từ tầng 1–2 gần như vô giá trị cho 2 năm đầu |
| Sản phẩm đầu không xây từ feature list mà cho nhóm nhỏ mua vision | CONFIRMED | Spec đầu tiên đến từ vision của founder; Customer Development chỉ kiểm tra có khách cho vision đó không. Kèm: khi bán cho earlyvangelist cần roadmap vision 18 tháng–3 năm |

## 2. Assumption Mapping — Strategyzer / David Bland + Teresa Torres

Nguồn đã truy cập: strategyzer.com/library (5 bài), producttalk.org (2 bài), mural.co, isaacjeffries.com.

| Claim | Verdict | Ghi chú |
|---|---|---|
| Định dạng "We believe that…" | CONFIRMED | Đúng nguyên văn blog Strategyzer; cũng là trường 1 của Test Card |
| Phân loại desirability/feasibility/viability | CONFIRMED + bổ sung | Bài Strategyzer có loại thứ 4 **adaptability**; lõi sách Testing Business Ideas là 3 loại D/F/V. Torres dùng 5 loại: D/V/F + **usability** + **ethical** |
| Riskiest assumption = importance × evidence, ma trận 2×2 | CONFIRMED | Ô ưu tiên: quan trọng + chưa có bằng chứng |
| Desirability đi trước | CONFIRMED (thứ tự) | Thứ tự có nguồn; phần lý do "nếu khách không muốn thì F/V vô nghĩa" là diễn giải hợp logic, không phải trích dẫn |
| Torres: đừng tranh cãi phân loại | CONFIRMED | Nguyên văn tại producttalk.org/assumption-testing/ — danh mục chỉ để sinh giả định phủ khắp |
| Ngưỡng đạt/trượt đặt trước | CONFIRMED | Test Card 4 trường, trường cuối "We are right if…"; Torres: định nghĩa success trước khi chạy test. Kèm **Learning Card** để đóng vòng học |

## 3. Positioning — April Dunford

Nguồn đã truy cập: aprildunford.com (3 bài), aprildunford.substack.com, lennysnewsletter.com (3 bài guest/summary), howtoweb.co, nateliason.com (notes sách), saasclub.io.

| Claim | Verdict | Ghi chú |
|---|---|---|
| Bước 1: danh sách best customers | CONFIRMED | Step 1 của quy trình 10 bước trong Obviously Awesome; là input cho competitive alternatives |
| Chuỗi 5 thành phần thứ tự bắt buộc | CONFIRMED | Sách gọi "The Five (Plus One) Components" — thành phần 6 tùy chọn là **relevant trends** (trend chỉ trả lời "why now", không thay category) |
| Competitive alternatives từ góc nhìn khách; lỗi phổ biến nhất ở bước này | CONFIRMED | "Không làm gì / spreadsheet / thuê thực tập sinh" đúng ví dụ của Dunford |
| "Phantom competitor" | CONFIRMED | Đúng thuật ngữ, trên blog chính chủ (positioning-and-competition) |
| "40% deal B2B thua vì no decision" | **CORRECTED** | Nguồn chuẩn Dunford dùng từ 2023: **The JOLT Effect** (Dixon & McKenna, phân tích hơn 2 triệu sales call): **40–60%**. Các bài cũ của bà dùng 20–30%/25% (gốc CSO Insights 2017: 21,3%). Không phải Sales Benchmark Index |
| Đừng tạo category mới | CONFIRMED nguyên tắc | ~90% IPO gần đây position trong category có sẵn; chỉ ~10% trường hợp đáng tạo mới. Ngưỡng "$200M revenue" chỉ là paraphrase bên thứ ba — **không dùng như lời Dunford**. 3 style: Head-to-Head / Big Fish Small Pond (mặc định cho startup) / Create a New Game |
| Positioning pre-product | CONFIRMED + bổ sung quan trọng | Pre-product chỉ có **positioning thesis** — phỏng đoán có học thức, phải kỳ vọng sai và chỉnh sau launch; đừng "siết" quá sớm kẻo tự đóng một thị trường tốt |

## 4. Eval sản phẩm AI — Hamel Husain / Shreya Shankar / Eugene Yan / Arize

Nguồn đã truy cập: hamel.dev (8 trang gồm AI Evals FAQ), eugeneyan.com (4 bài), arize.com/llm-as-a-judge, arxiv.org/abs/2404.12272, docs Anthropic + OpenAI.

| Claim | Verdict | Ghi chú |
|---|---|---|
| Chống eval-driven development; error-analysis-first | CONFIRMED | Gần nguyên văn FAQ của Hamel/Shreya. Caveat: eval-first vẫn ổn cho ràng buộc cụ thể biết trước (vd "không nhắc đối thủ"). Cơ sở thực nghiệm: paper "Who Validates the Validators?" (Shankar) — criteria không định nghĩa được trước khi xem output thật ("criteria drift") |
| Quy trình open coding → axial coding → eval | CONFIRMED | Đúng thuật ngữ, adapted từ qualitative research |
| "~100 golden case" | **CORRECTED** | Ngữ cảnh đúng: **~100 traces phải ĐỌC trong error analysis** (stop-rule: ~20 traces liên tiếp không lộ loại lỗi mới thì dừng) — không phải cỡ chuẩn test suite. Lưu ý Anthropic docs khuyên ngược cho test tự động (ưu tiên volume, 100–1.000 case) — hai guidance cho hai ngữ cảnh khác nhau |
| Code eval cho deterministic, judge cho chủ quan | CONFIRMED + bổ sung lớn | Thiếu các best practice: **binary pass/fail không thang điểm**; một evaluator một tiêu chí; đo **agreement judge–chuyên gia ~75–90%** trên held-out set trước khi tin judge; critique shadowing; bias của judge (position/verbosity/self-enhancement) |
| "Sản phẩm LLM thất bại vì thiếu eval system" | CONFIRMED nửa đầu | Đúng bài "Your AI Product Needs Evals" (Hamel). Nửa sau ("cấm launch khi chưa qua eval") **không có nguồn phát biểu dạng lệnh cấm** — Eugene Yan còn cảnh báo eval-perfectionism làm chậm launch |
| Mức đầu tư tối thiểu cho solo dev | CONFIRMED | MVES: bắt đầu bằng error analysis không phải hạ tầng — 30 phút đọc 20–50 output mỗi lần thay đổi đáng kể; dự án thành công dành 60–80% thời gian cho error analysis + eval |

## 5. Playbook validate — Mom Test / Running Lean / Rob Walling / cộng đồng

Nguồn đã truy cập: mtlynch.io + readingraphics (notes Mom Test), jobstobedone.org (Maurya), startupsfortherestofus.com, phraseexpander.com (MicroConf 2014), justinjackson.ca, thebootstrappedfounder.com, indiehackers.com, kromatic.com, review.firstround.com, grahammann.net (notes Quit).

| Claim | Verdict | Ghi chú |
|---|---|---|
| 3 quy tắc Mom Test | CONFIRMED | Nói về đời họ, không về ý tưởng bạn / hỏi cụ thể quá khứ, không ý kiến tương lai / nói ít nghe nhiều |
| 10–20 problem interview | **CORRECTED** | Nguồn thật là **10–15 (Running Lean/Maurya)** — sau ~15 cuộc bạn thành "chuyên gia" về workflow phân khúc. Mom Test không quy định số |
| 20+ signup landing page | **UNVERIFIABLE** | Heuristic không nguồn. Thay bằng: đo **chuyển đổi sang tiền** (signup→paid thường 5–15%; deposit/pre-order là tín hiệu mạnh; case 300+ waitlist → 3 khách trả tiền); khung **2/20/200 của Walling** (2h sàng lọc → 20h landing+phỏng vấn → 200h MVP thủ công) |
| "Thẻ tín dụng, không phải lời khen" | **CORRECTED** | Không phải trích dẫn một nguồn; tổng hợp từ 3 nguồn thật: Kahl ("validation là khi ai đó mở ví"), Fitzpatrick ("lời khen là vàng của kẻ ngốc"), Jackson ("chỉ có một cách chắc: người ta có trả tiền không") |
| Sprint 4 tuần | **TỔNG HỢP** | Không có playbook canonical đúng cấu trúc này — ghi nhãn "tổng hợp cộng đồng" |
| Concierge / Wizard-of-Oz | CONFIRMED + chỉnh nguồn gốc | Khác biệt then chốt: khách **biết** (concierge — đo willingness-to-pay nhưng human touch thổi phồng) vs **không biết** (WoZ — đo trải nghiệm "sản phẩm" thật hơn) có người phía sau. WoZ có từ nghiên cứu HCI 1975 (J.F. Kelley), Lean Startup chỉ phổ biến hóa |
| Kill criteria đặt trước | CONFIRMED | Nguồn chuẩn: Annie Duke "Quit" — dạng **state + date** ("nếu chưa đạt X trước ngày Y → dừng") + premortem để sinh criteria |
| N = 3–10 pre-sell | **UNVERIFIABLE** (heuristic) | Case neo tốt nhất: **Drip — Walling email 17 người, 11 cam kết $99/tháng trước khi build**. Nuance: cam kết ở giá thật ≠ bắt đầu billing (chỉ thu khi khách nhận giá trị) |
| Sean Ellis 40% test | CONFIRMED + giới hạn | Chỉ dùng **post-launch**: khảo sát user đã dùng lõi sản phẩm ≥2 lần trong 2 tuần gần nhất — không dùng ở pre-launch |
| Validation paralysis | CONFIRMED | Chủ đề có thật ở tầng cộng đồng; cân bằng bằng time-box + go/no-go gate |

## 6. Build & Pre-launch

Nguồn đã truy cập: docs.stripe.com (webhooks, smart-retries), stripe.com/blog, about.gitlab.com (post-mortem 2017), resend.com (incident 2024), news.ycombinator.com, honeycomb.io (Charity Majors), churnkey.co, blogs.cisco.com, sre.google, designrevision.com, các checklist Indie Hackers.

| Claim | Verdict | Ghi chú |
|---|---|---|
| Dev/Prod split; migration ăn DB production | CONFIRMED | Post-mortem thật: **Resend 2024** (migration từ local trỏ nhầm production, drop toàn bộ tables, outage 12h), **GitLab 2017** (xóa nhầm trên primary; cả 5 cơ chế backup đều fail). Quy tắc: không role local nào có quyền ghi DB production; migration chỉ qua CI |
| Monitoring + alert 5 phút | CONFIRMED một phần | Sentry free tier đủ MVP; check interval 1–5 phút; mốc "5 phút" là heuristic khớp thực hành on-call (MTTA P1), không phải chuẩn cứng |
| Backup phải test khôi phục | CONFIRMED | Chuẩn hiện đại 3-2-1-**1-0** (số 0 = zero errors qua verified recovery testing); GitLab là bằng chứng sống; cần DR drill định kỳ |
| Smoke test trên production | CONFIRMED | Nguồn chính danh: Charity Majors (Honeycomb) — testing in production an toàn có công cụ, bổ sung chứ không thay test trước deploy |
| Webhook billing "48 giờ" | **CORRECTED** | Stripe retry exponential backoff tối đa **3 ngày (72h)** live mode; endpoint bị disable thì ngừng retry → cần alert riêng cho webhook failure. Resend thủ công: 15 ngày (Dashboard)/30 ngày (CLI). Dunning/Smart Retries: mặc định khuyến nghị 8 lần/2 tuần; ~25% subscription rớt thuần do lỗi thanh toán (Stripe); involuntary churn ~22% tổng churn (Churnkey) |
| "GDPR gây ~30% churn sớm" | **LOẠI BỎ** | Không có nguồn — gần như chắc chắn là số bịa. Thay bằng: Cisco Data Privacy Benchmark 2023 (3.100+ tổ chức): **94%** nói khách sẽ không mua nếu dữ liệu không được bảo vệ đúng; B2B procurement đòi DPA + subprocessor list |
| UAT mix tester đa dạng | CONFIRMED | Best practice hội tụ nhiều nguồn QA; không có chuẩn định lượng về mix |
| "18/24 đủ cân nhắc go" | **UNVERIFIABLE** | Con số tự đặt — giữ như ví dụ minh họa (~75% + không blocker fail), không phải chuẩn |

---

## Các sửa đổi đã áp dụng vào pipeline

1. **EarlyVangelist: 4 tiêu chí → thang 5 tầng**, chỉ tầng 4–5 đạt chuẩn (pipeline 0.4, template 0-framing).
2. **10–20 interview → 10–15** (Running Lean) (pipeline 2.2, template 2-validate).
3. **"40% no decision" → 40–60%** (The JOLT Effect) (pipeline 1.1, foundations).
4. **"~100 golden case" → ~100 traces cho error analysis** + stop-rule saturation; bổ sung kỷ luật judge: binary, 1 evaluator/tiêu chí, agreement 75–90% (pipeline 3.2–3.3, template 3-verify).
5. **"20+ signup" dán nhãn heuristic**, thay trọng tâm bằng chuyển đổi sang tiền + khung 2/20/200 (pipeline 2.8).
6. **Kill criteria chuẩn hóa dạng state + date** (Annie Duke) + premortem (pipeline 0.6, template 0-framing).
7. **Positioning pre-product = positioning thesis** — kỳ vọng sai, không siết sớm (pipeline giai đoạn 4, template 4-positioning).
8. **Webhook billing: 48h → 72h** + alert riêng + idempotency/chữ ký (build-and-launch).
9. **Số "30% churn GDPR" bị loại**, thay bằng Cisco 94% + DPA/subprocessor (build-and-launch).
10. **"18/24" dán nhãn ví dụ minh họa** (build-and-launch).
11. Bổ sung: commitment & advancement log mỗi cuộc phỏng vấn (Mom Test ch.5); Learning Card đóng vòng học; usability/ethical vào danh mục giả định; Sean Ellis test đặt post-launch; Drip 11/17 làm case neo pre-sell; 3 style chọn category + relevant trends.

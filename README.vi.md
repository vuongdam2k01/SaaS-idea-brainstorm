# saas-idea-brainstorm

[English](README.md) | **Tiếng Việt**

Plugin Claude Code và Codex CLI nhận một ý tưởng SaaS thô và lái nó tới bản scope MVP được khóa — làm rõ, quét cạnh tranh, validate thị trường, kiểm chứng khả thi, định vị, khóa phạm vi — và từ chối gọi là "đã validate" thứ chưa được chứng minh.

Sản phẩm bàn giao là **MVP Pack**: hợp đồng đầu vào tự đủ cho giai đoạn build, dán nhãn *Validated*, *Hypothesis*, hay *Pre-feasibility Hypothesis* đúng theo thứ thực sự chứng minh được. Nó sẽ thường xuyên nói rằng ý tưởng của bạn chưa được chứng minh. Một quy trình lúc nào cũng phán "đã validate" thì chẳng đáng giá gì.

Ba nguyên tắc làm nên nó:

- **Mô hình không bao giờ là nguồn bằng chứng.** Mọi thứ Claude viết ra đều là `[GUESS]`, hạng D, cho tới khi có người thật hoặc dữ liệu thật chống lưng. Bảo nó "cứ điền đại" kết quả phỏng vấn thì nó từ chối.
- **Ngưỡng được ký trước khi chạy phép thử.** Sau nghi thức ký tại cửa F, sửa một ngưỡng đòi hỏi bạn phê duyệt tường minh và một bản revision được ghi lại.
- **Cửa trượt thì quay lui.** Không bao giờ tiến tới trên một giả định đã gãy. Trượt mà rõ hướng là kết quả tốt.

Repository: <https://github.com/vuongdam2k01/SaaS-idea-brainstorm> · MIT · v1.1.0

---

## Cài đặt

Hai CLI độc lập chạy được plugin này. Dùng cái nào tùy bạn.

**Claude Code**

```bash
/plugin marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

```bash
/plugin install saas-idea-brainstorm@saas-idea-brainstorm
```

Muốn cài từ bản clone thì `/plugin marketplace add ./SaaS-idea-brainstorm` rồi install như trên, hoặc bỏ qua hẳn khâu cài với `claude --plugin-dir /duong/dan/toi/SaaS-idea-brainstorm`.

**Codex CLI**

```bash
npx codex-marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

Muốn test cục bộ: đặt thư mục clone này vào `~/.codex/plugins/` và khai báo trong `~/.agents/plugins/marketplace.json`, rồi khởi động lại. Skills và hooks chạy y nguyên trên cả hai CLI; bốn agent nghiên cứu/audit đóng gói riêng dạng `.codex/agents/*.toml` cho Codex. Tài liệu Codex không đảm bảo chắc chắn một bản build sẽ tự phát hiện agent đóng gói trong plugin đã cài hay không — nếu bước fan-out ở giai đoạn 1, 2, hay 5 không thấy chúng, copy `.codex/agents/*.toml` vào `.codex/agents/` của project bạn một lần. Đường Codex chưa có số dặm dogfood như bản Claude Code (5 vòng review, 2 lần dogfood — xem [codex-review.md](plugin/codex-review.md)); các khác biệt nền tảng đáng biết trước khi dựa vào nó nằm ở [plugin/codex-parity.md](plugin/codex-parity.md).

Khởi động CLI ngay trong repo bạn muốn chứa workspace ý tưởng — artifact được ghi vào `ideas/<slug>/` tương đối so với thư mục làm việc, không bao giờ nằm trong plugin. Nên có Node.js trên PATH: nó chạy ba hook và trình ghi state. Không có Node thì chúng fail open kèm một thông báo hiện rõ, ngoài ra không hỏng gì; không skill nào phụ thuộc vào chúng.

---

## Chạy

```bash
/saas-idea-brainstorm:new-idea Công cụ biến transcript hỗ trợ khách hàng lộn xộn thành bản digest vấn đề sản phẩm hằng tuần
```

Lệnh đó tạo `ideas/support-digest/` — `state.json`, `idea-brief.md` giữ ý tưởng thô nguyên văn và bất biến, `decision-log.md` chỉ-thêm-không-sửa, `founder-charter.md`, và thư mục `private/` tự bảo vệ — hỏi bạn hai câu thiết lập (dừng ở từng cửa hay tự chạy tiếp; audit tích hợp ngay hay để sau), rồi bắt tay vào giai đoạn 0 cùng bạn. Nó không thuyết trình về quy trình trước; quy trình tự giải thích bằng cách làm việc.

Sau đó:

```bash
/saas-idea-brainstorm:status
```

```bash
/saas-idea-brainstorm:gate-check support-digest V1
```

Chạy trọn vẹn không gói trong một buổi. Đó là chuỗi phiên, xen giữa là việc thật ngoài đời — phỏng vấn, khai thác dữ liệu, làm spike kỹ thuật. File mới là bộ nhớ; hội thoại thì không.

| Lệnh | Tham số | Tác dụng |
|---|---|---|
| `new-idea` | `[ý tưởng thô]` | Tạo workspace, bắt đầu framing. Mơ hồ cũng được — làm nó rõ ra *chính là* việc phải làm |
| `status` | `[slug]` tùy chọn | Việc hiện tại, trạng thái cửa, ngưỡng đã ký, hạn kill criteria, thứ đang chờ bạn, ngân sách, và một hành động đòn bẩy cao nhất tiếp theo |
| `gate-check` | `[slug] [cửa]` | Kiểm hình thức theo hợp đồng → gatekeeper đối kháng → bạn phê duyệt |
| `setup-audit` | `[slug]` tùy chọn | Thăm dò xem tích hợp tùy chọn nào thực sự chạy được, ghi lại hồ sơ năng lực |
| `switch-mode` | `[slug] [analysis\|market-evidence]` | Chuyển ý tưởng giữa hai chế độ, có kiểm tiền điều kiện và ghi nhật ký |

Mọi lệnh nằm trong namespace `/saas-idea-brainstorm:`. Các cửa: `F`, `C`, `V1`, `V2`, `V3`, `R1`, `R2`, `P`, `LOCK` — bỏ trống thì nó suy ra từ state.

Sáu skill giai đoạn (`stage-0-framing` … `stage-5-scope-lock`) tự kích hoạt theo tiến độ; bạn không phải gọi. Skill thứ bảy, `method-rules`, là hiến pháp: mọi thứ đều nạp nó, không ai gọi trực tiếp được.

---

## Quy trình

```
Giai đoạn 0 Framing ──F──> Giai đoạn 1 Cạnh tranh ──C──> Giai đoạn 2 Validate (V1 → V2 → V3)
                                                              ∥ (song song)
                                                        Giai đoạn 3 Verify (R1, R2)
                                    ──> Giai đoạn 4 Định vị ──P──> Giai đoạn 5 Khóa scope ──> MVP Pack
```

Đây là DAG, không phải hàng đợi. Giai đoạn 1 khởi động ngay sau việc 0.1. Giai đoạn 3 chạy song song giai đoạn 2 mỗi khi khả thi là giả định chết người — luôn đúng với sản phẩm có AI trong lõi, vì nếu mô hình không đạt được chất lượng cần thiết thì mọi giờ validate cho hướng đó đều phí.

| Cửa | Câu hỏi | Cần trước | Được để mở? |
|---|---|---|---|
| **F** | Giả thuyết bác bỏ được, ngưỡng đã ký, kill criteria? | — | Không |
| **C** | Đã biết sân chơi thật — năm tầng, gồm cả tự chế và không-làm-gì? | F | Không |
| **V1** | Vấn đề có thật và đủ đau, chứng minh bằng hành vi quá khứ trên khung lấy mẫu trung lập đăng ký trước? | C | Không |
| **V2** | Có một hướng giải pháp thắng, gọi tên được lớp giá trị, kèm tín hiệu hành vi? | V1 | Có (chế độ analysis) |
| **V3** | Người ta có trả tiền — tiền thật, ngoài vòng quan hệ cá nhân? | V2 | Có (chế độ analysis) |
| **R1** | Làm được ở chất lượng cần thiết, chi phí biên dưới giá bán? | F | Có → pack tụt xuống **Pre-feasibility** |
| **R2** | Thứ giao ra có tạo được kết quả đã hứa, kèm lần quay lại không cần nhắc? | R1, V3 | Có (chế độ analysis) |
| **P** | Định vị có truy về đúng chữ khách hàng và sống sót copy test? | V1, V3, R1, R2 đã ngã ngũ | Không (dán nhãn "thesis") |
| **LOCK** | Scope đã tự đủ để một phiên mới build được chưa? | V2, V3, R1, R2, P đã ngã ngũ | Không |

Mỗi lần kiểm cửa chạy ba lớp. **Hình thức**: cửa tiền đề còn hiệu lực, artifact tồn tại đúng trạng thái chấp nhận được, ngưỡng ký trước ngày thu bằng chứng và vẫn khớp bản snapshot đã ký, hạng đúng nghiêm ngặt A/B/C/D, không mục hạng D nào được đếm, mọi khẳng định truy về id bằng chứng, chỉ số tính trên mẫu số đã đăng ký trước. **Đối kháng**: agent `gatekeeper` đọc mọi thứ bằng con mắt mới và cố làm cửa trượt — phát hiện báo cáo nguyên văn, xếp hạng, không làm nhẹ đi. **Quyết định**: bạn phê duyệt, và phán quyết rơi vào `decision-log.md`.

Hợp đồng đầy đủ — artifact bắt buộc từng cửa, trạng thái, chỉ số chính xác — nằm ở `skills/method-rules/gate-contracts.md`. File đó là luật; các skill được chỉ thị không tự chế yêu cầu quanh nó.

---

## Bằng chứng

Bốn hạng, không có biến thể. `A-` hay `B+` sẽ làm sàn của các cửa hết so sánh được; sắc thái đi vào các trường riêng trong sổ cái.

| Hạng | Ý nghĩa | Ví dụ |
|---|---|---|
| **A** | Tiền thật hoặc cam kết tương tác thật | Thanh toán, đặt trước, pilot đã ký, phỏng vấn từ outreach có người trả lời |
| **B** | Lời nói/hành vi người thật, không tương tác | Bài viết cộng đồng khai thác được, review 1–3★, câu trả lời khảo sát, kết quả pilot đo được |
| **C** | Hành vi ẩn danh đo được trên sử dụng thật | Traffic landing, click bảng giá, kết quả A/B, số đo spike trên dữ liệu khách hàng thật |
| **D** | Do mô hình sinh ra | Phỏng vấn mô phỏng, persona, kiểm tra tự nhất quán |

Hạng D không bao giờ vào sổ cái và không bao giờ được tính ở cửa nào. Một hệ quả cần nói thẳng: một LLM chấm đầu ra chủ quan của mô hình khác là hạng D. Muốn R1 PASS dựa trên chất lượng chủ quan, bạn cần một bộ neo do người gán nhãn — judge phải đạt khoảng 75–90% đồng thuận thì phán quyết của nó mới tính là C — hoặc một kết quả đo từ sử dụng thật ở R2.

Nhãn cuối là một vị từ, không phải cảm tính:

- **Validated MVP Pack** — mọi cửa đều qua, bằng chứng V3 hạng A.
- **Hypothesis MVP Pack** — tới LOCK, R1 qua, ít nhất một trong V2/V3/R2 được chấp nhận mở.
- **Pre-feasibility Hypothesis Pack** — tới LOCK với R1 để mở. Chính tính khả thi chưa được chứng minh, và pack ghi rõ ngay dòng đầu.

Cửa để mở không phải cửa đã qua. Nó là giả định chưa kiểm, ghi nhận trung thực, kèm bộ kit sẵn sàng chạy để bạn đóng nó sau.

---

## Hai chế độ

**Analysis (mặc định)** không cần thiết lập gì. Quy trình đi tới khóa scope bằng công cụ có sẵn và dán nhãn trung thực phần còn chưa kiểm: V2, V3, R2 — và R1 khi không thể có dữ liệu đại diện — có thể được chấp nhận mở kèm kit.

**Market-evidence (chọn tham gia)** đem các kit đó ra chạy thật: deploy landing, phát hành link pre-sell, gửi outreach, giao hàng kiểu concierge. Đây là thứ sinh ra bằng chứng hạng A và C, biến cửa mở thành cửa qua.

```bash
/saas-idea-brainstorm:switch-mode support-digest market-evidence
```

Khi chuyển, nó kiểm các kit liên quan đã có và năng lực còn mới, trình bày kế hoạch cùng chi phí dự kiến, mở lại các cửa bị ảnh hưởng, và ghi nhật ký. Bằng chứng đã thu giữ nguyên hạng — dữ liệu thật không hết hạn khi đổi chế độ.

Mọi thứ rời khỏi máy bạn hoặc tiêu tiền — deploy, gửi đi, phát hành link thanh toán, chi quảng cáo, giao đầu ra pilot — đều cần phê duyệt từng hành động, một lượt kiểm ngân sách trước, và một dòng nhật ký sau đó. `auto_continue` không bao giờ bao gồm hành động hướng ra ngoài.

### Tích hợp là tùy chọn

Mỗi việc chạy ở bậc tốt nhất hiện có: **enhanced-auto** (một tích hợp đã xác minh làm việc đó) → **baseline-auto** (công cụ gốc) → **handoff** (bạn nhận một bộ kit đầy đủ, thực thi bên ngoài, mang kết quả về) → **simulate** (hạng D, chỉ là giả thuyết). Thiếu tích hợp thì đổi bậc và đổi hạng đạt được — không bao giờ chặn quy trình. Bậc đã dùng được ghi trên từng artifact.

`setup-audit` thăm dò MCP scraping, key LLM phụ, CLI hosting, analytics, Stripe, và gửi email. Một năng lực chỉ được tính là có khi một lệnh gọi có xác thực thực sự thành công — "đã cài CLI" hay "tôi có tài khoản" chỉ được ghi là `handoff-only` hoặc `unknown`. Đúng bằng kỷ luật bằng chứng áp cho chính ý tưởng.

Plugin có một thiết lập: `ads_budget_cap_usd` (mặc định `0`, tức tắt traffic trả phí) là trần khi lập kế hoạch, được thực thi bởi lượt kiểm ngân sách của chính quy trình chứ không phải bởi nền tảng quảng cáo. Giá trị này được sao vào `state.budget.cap_usd` tại `new-idea` và mỗi lần audit.

---

## Thứ đọng lại trong repo của bạn

```
ideas/support-digest/
├── state.json                    # chỉ mục: mode, việc đang chạy, cửa, ngưỡng, kill criteria, năng lực, ngân sách
├── idea-brief.md                 # ý tưởng thô nguyên văn + bản diễn đạt tinh gọn + nhật ký tiến hóa
├── founder-charter.md            # ý chí của bạn, ghi lại đúng lúc nó lộ ra; đi kèm trong pack
├── decision-log.md               # chỉ-thêm: phán quyết, pivot, sửa ngưỡng, chi tiêu
├── problem-hypothesis.md · lean-canvas.md · beachhead-icp.md
├── assumption-map.md             # giả định chết người kèm Test Card và ngưỡng
├── kill-criteria.md              # khóa tại nghi thức ký cửa F
├── competitive-map.md · review-mining.md
├── evidence-ledger.md            # nguồn sự thật duy nhất cho mọi bằng chứng
├── solution-directions.md · interview-kit.md · landing-kit.md · presell-kit.md
├── spike/ · error-analysis/ · eval/ · promise-scope.md · concierge-kit.md
├── positioning.md                # khóa tại cửa P
├── mvp-pack/                     # sản phẩm bàn giao — bản sao, không phải tham chiếu
│   ├── mvp-spec.md · tech-design.md · definition-of-done.md
│   ├── carry-forward.md · evidence-quality-report.md
│   └── eval/ · experiments/{landing,presell,concierge}/
└── private/                      # .gitignore của riêng nó: *  và  !.gitignore
    ├── contacts.md               # P1, P2, … → danh tính thật
    └── …                         # transcript, snapshot, danh tính thanh toán
```

Mọi artifact markdown mang frontmatter được một hook kiểm — `artifact`, `idea`, `stage`, `gate`, `status` (draft/ready/locked), `evidence_grade`, `rung`, `pipeline_version`, `updated`. Sổ cái bằng chứng là một bảng, mỗi dòng truy về một người thật, kèm xuất xứ truy xuất để một lần kiểm lại thất bại về sau còn phân biệt được "nguồn đã đổi" với "cái này bịa":

```markdown
| id | date | source | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | status |
|----|------|--------|------|-----------|-----------|-----|-------------------------|------------|-------|--------|
| E1 | 2026-07-29 | reddit u/… | community | https://… | 2026-07-29 | miner-run-3 | "trích nguyên văn" | A3 | B | confirms |
```

Artifact là sự thật gốc. `state.json` chỉ là chỉ mục, dựng lại được từ artifact cộng nhật ký quyết định — nếu nó hỏng, `status` sẽ đề nghị làm đúng việc đó.

### Quyền riêng tư

Tên thật, liên hệ và danh tính thanh toán chỉ nằm trong `ideas/<slug>/private/`, tạo riêng cho từng ý tưởng với `.gitignore` của chính nó (`*` cộng `!.gitignore`) nên lớp bảo vệ không phụ thuộc cấu hình gốc của repo bạn. Artifact công khai dùng `P1`, `P2`, … ánh xạ trong `private/contacts.md`. Dữ liệu khách hàng thật dùng cho spike phải có một dòng trong `data-manifest.md` trước. Dù vậy vẫn nên rà lại workspace trước khi công khai.

---

## Agents và hooks

Bốn subagent chạy với context mới tinh nên không thừa hưởng được sự lạc quan của hội thoại chính:

- **competitor-scanner** vẽ bản đồ năm tầng — trực tiếp, gián tiếp, tự chế/spreadsheet, công cụ AI phổ thông, không-làm-gì — mỗi khẳng định một URL nguồn.
- **community-review-miner** kéo về trích dẫn nguyên văn kèm URL theo khung lấy mẫu trung lập đăng ký trước. Chính việc đếm cả những người *không* có hành vi chắp vá mới làm tỷ lệ phần trăm có nghĩa. Nó không bao giờ bịa trích dẫn.
- **gatekeeper** được trả công để đánh trượt cửa của bạn. Cửa nào sống sót qua nó thì xứng đáng được qua.
- **coldstart-tester** đóng vai một phiên build chỉ có MVP pack, không lịch sử, và liệt kê mọi câu hỏi nó vẫn phải hỏi. Danh sách rỗng thì pack đạt.

Ba hook Node, tất cả fail open: `session-start.js` tiêm trạng thái quy trình của các ý tưởng trong workspace (đi ngược lên gốc workspace, dùng ngày lịch địa phương, một state hỏng không nuốt mất các ý tưởng còn lại); `guard-thresholds.js` bắt các lần sửa ngưỡng theo ngữ nghĩa — kể cả sửa một phần từ `60` thành `70` — nâng cảnh báo với artifact `locked` và giữ tính chỉ-thêm của nhật ký quyết định; `validate-artifact.js` kiểm frontmatter và chặn kèm hướng dẫn sửa. Cả ba đều kiểm sentinel là một `state.json` cùng cấp có chứa `pipeline_version`, nên một repo không liên quan mà có thư mục `ideas/` sẽ không bị đụng tới.

Tính toàn vẹn không phụ thuộc hook: `gate-check` luôn tự tính lại snapshot ngưỡng và đối chiếu `decision-log.md`.

### Founder charter

Ý chí của bạn lộ ra qua lựa chọn chứ không qua một lần tuyên bố, nên nó chịu đúng kỷ luật như bằng chứng. Mọi quyết định đi ngược khuyến nghị của mô hình, mọi lần phủ quyết, mọi lần ghi đè ngưỡng đều được ghi lại ngay lúc xảy ra. Ý chí cũng có hạng: `stated` (lời của bạn) > `confirmed` (mô hình suy ra, phát lại, bạn xác nhận) > `[INFERRED]` (không chi phối gì cả). Chỉ bạn mới gỡ được nhãn `[INFERRED]` — viết charter theo sở thích của mô hình thay vì theo tín hiệu của bạn chính là bịa bằng chứng ở tầng ý chí. Tại mỗi lần duyệt cửa, phần thay đổi kể từ cửa trước được phát lại để bạn đính chính. Khi bạn cố ý quyết ngược lại bằng chứng, việc đó được ghi thành `will-override` kèm đánh dấu các khẳng định bị ảnh hưởng; bạn có quyền cược ngược thị trường, giai đoạn build chỉ cần biết đâu là những ván cược có chủ đích.

Charter đi kèm trong MVP pack, đóng vai trò thẩm quyền diễn giải cho mọi thứ bản spec không trả lời.

---

## Không dùng plugin

Phương pháp cũng tồn tại dưới dạng tài liệu thuần. Tạo `ideas/<ten-y-tuong>/`, copy toàn bộ `templates/` vào đó, rồi đi theo [process/pipeline.md](process/pipeline.md) bắt đầu từ `0-framing.md`; trạng thái cửa ghi ngay trong từng file template. Vẫn hai quy ước đó: ngưỡng trước phép thử, bằng chứng truy về người thật.

`process/` và `plugin/` viết bằng tiếng Việt (`plugin/codex-parity.md` là ngoại lệ duy nhất); bản thân plugin (`skills/`, `agents/`, `.codex/agents/`, `hooks/`) toàn bộ tiếng Anh, và nó trả lời theo ngôn ngữ bạn dùng.

---

## Cấu trúc và phát triển

| Đường dẫn | Nội dung |
|---|---|
| `.claude-plugin/` · `.codex-plugin/` | Manifest plugin, mỗi nền tảng một bản |
| `.agents/` | Registry marketplace tự host của Codex |
| `skills/` | 12 skill — 5 lệnh, 6 giai đoạn, và `method-rules` kèm `state-schema.md`, `artifact-schema.md`, `gate-contracts.md`; ba skill dạng lệnh mang thêm sidecar `agents/openai.yaml` để giữ nguyên tính chỉ-gọi-tường-minh bên Codex |
| `agents/` · `.codex/agents/` · `hooks/` · `scripts/` | Bốn subagent, một bản markdown Claude Code và một bản TOML Codex; `hooks.json` (dùng chung cho cả hai nền tảng) cùng ba script Node; trình ghi state nguyên tử |
| `tests/` | `hook-tests.js` — bộ test hồi quy cho hook |
| `process/` | Phương pháp (tiếng Việt): pipeline, foundations, build-and-launch, research-verification |
| `plugin/` | Tài liệu thiết kế (tiếng Việt, trừ `codex-parity.md`): spec, ma trận năng lực, thiết kế tự chủ, biên bản review, báo cáo dogfood, ghi chú nền tảng Codex |
| `templates/` · `ideas/` | Template dùng tay; các workspace ý tưởng |

```bash
node tests/hook-tests.js
```

Bộ test phủ mọi phát hiện từ vòng review đối kháng, gồm cả một lỗ hổng sửa-một-phần để lách ngưỡng đã được chứng minh và giữ làm test hồi quy vĩnh viễn; mỗi hook chạy qua đúng hợp đồng stdin/stdout thật trên thư mục ý tưởng tạm. `claude plugin validate . --strict` kiểm manifest, còn `claude --plugin-dir .` cho bạn vòng lặp sửa-chạy-lại mà không cần cài lại.

---

## Khi có trục trặc

**Một lệnh ghi bị chặn vì frontmatter.** Thiếu một trong chín khóa hoặc một giá trị nằm ngoài enum; thông báo nêu đúng khóa đó.

**Sửa ngưỡng đã ký bị chặn.** Đúng như thiết kế. Ngưỡng đã ký chỉ đổi qua một revision được phê duyệt, ghi vào `state.thresholds.revisions` và soi sang nhật ký quyết định — hãy yêu cầu revision một cách tường minh, kèm lý do.

**`state.json` không parse được.** Chạy `status`; nó báo hỏng và đề nghị dựng lại từ artifact. `state-write.js` cũng luôn giữ một bản `.bak`.

**Gatekeeper cứ đánh trượt cửa.** Đọc các phát hiện như dữ liệu. Nguyên nhân thường là thật: bằng chứng không truy về đâu cả, chỉ số tính trên mẫu số tiện tay thay vì mẫu số đăng ký trước, một mục hạng D bị đem đếm, ngôn ngữ tự tin vượt quá hạng bằng chứng. Sửa artifact chính là phần việc phải làm — nới cửa không nằm trong lựa chọn.

**Không có dữ liệu thật nên R1 không PASS được.** Chấp nhận để mở. Bạn nhận hồ sơ rủi ro khả thi và kế hoạch thu thập dữ liệu, pack được dán nhãn Pre-feasibility — trung thực, vẫn dùng được, nâng hạng được ngay khi có dữ liệu.

**Hook kêu không thấy `node`.** Nó chưa có trên PATH. Hook fail open; bạn mất tóm tắt đầu phiên và hai lớp kiểm bảo vệ, ngoài ra không mất gì. `gate-check` vẫn tự kiểm tính toàn vẹn của ngưỡng.

---

## Phương pháp đến từ đâu

Được lắp ráp và kiểm chứng dựa trên tài liệu gốc chứ không dựa vào bản tóm tắt: Customer Development của Steve Blank (earlyvangelist là thang năm tầng — chỉ tầng 4–5 mới đạt), khung giả định desirability/feasibility/viability của Strategyzer, *The Mom Test*, Running Lean của Ash Maurya (10–15 cuộc phỏng vấn), thứ tự thành phần định vị của April Dunford cùng lưu ý của bà rằng định vị pre-product là một luận điểm, dự kiến sẽ sai một phần, JOLT Effect về các thương vụ mất vào "không quyết định", và thực hành đánh giá LLM của Hamel Husain và Shreya Shankar (error-analysis trước, khoảng 100 trace kèm quy tắc dừng — không phải "100 golden case").

Dấu vết kiểm toán nằm ngay trong repo. `process/research-verification.md` ghi sáu nhánh nghiên cứu và các chỉnh sửa đã áp, gồm cả hai con số thống kê bịa bị phát hiện và loại bỏ. `plugin/codex-review.md` ghi bốn vòng review đối kháng hai chiều với một mô hình bên ngoài, khoảng bốn mươi phát hiện đã xử lý, mọi lỗ hổng được chứng minh đều thành test hồi quy vĩnh viễn. `plugin/dogfood-report.md` ghi lượt chạy thật đầu tiên — trong đó gatekeeper đánh trượt một cửa hoàn toàn chính xác.

MIT — xem [LICENSE](LICENSE).

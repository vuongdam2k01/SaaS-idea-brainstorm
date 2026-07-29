# Đánh giá thiết kế: chuyển pipeline validate thành plugin Claude Code

> Ngày: 2026-07-29. Cơ chế Claude Code trong tài liệu này lấy từ docs chính thức (code.claude.com/docs: plugins, plugins-reference, skills, hooks, sub-agents, mcp, memory).

> **AUDIT 2026-07-29 (tự đọc lại docs trực tiếp, không qua agent):** các cơ chế nền bên dưới đã được kiểm chứng lại — 30 hook events, 5 hook types (command/http/mcp_tool/prompt/agent), bộ frontmatter skill (when_to_use, context: fork, user-invocable, paths, hooks…), plugin không đóng góp CLAUDE.md, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`, monitors/LSP/output-styles trong plugin — **đều có thật**. Hai sửa đổi sau audit: (1) `settings.json` của plugin CHỈ hỗ trợ khóa `agent` và `subagentStatusLine` — không dùng khai báo permissions được; cơ chế đúng là `allowed-tools` per skill; (2) bổ sung cơ chế **`userConfig`** trong plugin.json: khai báo giá trị cần hỏi người dùng khi enable plugin (kèm `sensitive: true` cho API key) — đây chính là cơ chế chuẩn cho "tích hợp optional". Phát hiện thêm: skill `disable-model-invocation: true` thì description KHÔNG nằm trong context — command thủ công gần như miễn phí token.

> **Tài liệu điều hành hiện hành: [plugin-spec.md](plugin-spec.md)** (bản làm lại theo định hướng Analysis-first). File này giữ vai trò tham chiếu cơ chế.

## Tóm tắt cơ chế nền (những điều chi phối mọi quyết định thiết kế)

1. **Plugin structure**: `.claude-plugin/plugin.json` (manifest) + `skills/` + `agents/` + `hooks/hooks.json` + `.mcp.json` (tùy chọn). Phân phối qua marketplace hoặc `--plugin-dir`. Skills được namespace theo tên plugin (`/plugin-name:skill`).
2. **Progressive disclosure của skill**: `description` (cap 1.536 ký tự) **luôn nằm trong context** để Claude quyết định khi nào invoke; body chỉ load khi invoke và **ở lại context cả session**; supporting files trong thư mục skill chỉ load khi Claude đọc. → Hệ quả: body phải mỏng (<500 dòng), chi tiết đẩy vào supporting files.
3. **Skill frontmatter mạnh**: `user-invocable` / `disable-model-invocation` (điều khiển ai được gọi — chính là cách phân biệt "command" vs "skill tự kích hoạt"), `context: fork` (chạy trong subagent), `allowed-tools`, `hooks` scoped theo skill, `arguments`.
4. **Hooks rất giàu**: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, PreCompact/PostCompact, FileChanged, SubagentStop… Hook có thể **block** (exit 2 / `decision: block`), **inject context** (`additionalContext`), **rewrite input** (`updatedInput`); có cả `type: prompt` và `type: agent` (thẩm định bằng LLM/subagent).
5. **Ràng buộc quan trọng nhất**: plugin **KHÔNG** đóng góp được CLAUDE.md hay `.claude/rules/`. Mọi "luật thường trực" chỉ đi được qua 3 đường: skill description (ngắn), **SessionStart hook inject additionalContext** (đường chính cho state + luật), hoặc thân skill khi được invoke.
6. **AskUserQuestion** (v2.0.21+): tool hỏi có cấu trúc (multiple choice, multiSelect), dùng được trong flow skill ở main loop; **không dùng được trong subagent** → mọi elicitation phải ở vòng lặp chính, không ủy quyền cho agent.
7. **MCP bundle trong plugin** tự khởi động khi plugin được enable (user đã trust plugin), không cần approve riêng.

---

## Yếu tố 1 — Contract chốt của các giai đoạn

**Đánh giá**: đúng là quyết định kiến trúc số 1. Lời giải nằm ở việc tách bạch **cái gì bất biến** và **cái gì biến thiên**:

- **Bất biến (chuẩn hóa cứng)**: các **gate contract** — mỗi cửa (F, C, V1–V3, R1–R2, P, cửa cuối) = (a) bộ artifact bắt buộc, (b) ngưỡng đạt/trượt đã đặt trước kèm ngày đặt, (c) quy tắc truy vết bằng chứng, (d) trạng thái. Đây là phần đã ổn định trong pipeline.
- **Biến thiên (thả lỏng có chủ đích)**: công việc **bên trong** giai đoạn — market type đổi trọng tâm phỏng vấn; sản phẩm AI-core kích hoạt R1 nặng còn SaaS thường thì R1 nhẹ; B2B/B2C đổi thang pre-sell. Skill của từng giai đoạn chứa các nhánh này; gate thì không đổi.

**Cơ chế hiện thực**:
- Contract = **schema artifact + state file**. Mỗi ý tưởng: `ideas/<slug>/state.json` ghi giai đoạn hiện tại, trạng thái từng gate, ngưỡng + ngày đặt, pipeline-version. Mỗi artifact có **frontmatter YAML máy-đọc-được** (gate, status, evidence_count, thresholds…) — phần nội dung tự do cho người.
- Gate check là một skill đọc artifact + state và đối chiếu checklist; hook `PostToolUse` (matcher `Write|Edit` trên `ideas/**`) validate frontmatter sau mỗi lần ghi.
- **Versioning bắt buộc**: pipeline sẽ còn sửa (đã sửa một vòng sau research). Stamp `pipeline_version` vào state để ý tưởng đang chạy giữa chừng còn migrate được.

## Yếu tố 2 — Contract đầu ra cuối cùng (bản MVP chính thức)

**Đánh giá**: câu hỏi đúng nhất trong 5 yếu tố. Nguyên tắc: đầu ra cuối **không phải báo cáo — nó là input contract của pha build**, và phải được thiết kế từ góc nhìn của người tiêu thụ nó (một session Claude Code mới ở repo build).

**Tiêu chí mức chi tiết — "cold-start test"**: một session Claude Code hoàn toàn mới, không có lịch sử hội thoại, chỉ đọc MVP pack — có bắt đầu build được mà không phải hỏi lại điều gì thuộc phạm vi quyết định đã chốt không? Đạt thì đủ chi tiết; thừa chi tiết ngoài phạm vi đó là lãng phí.

**Cấu trúc MVP pack** (một thư mục self-contained, entry point `mvp-spec.md`):
1. Core loop ≤5–7 bước, **mỗi bước kèm link truy vết** về evidence ledger / concierge log.
2. Aha moment = sự kiện có tên, định nghĩa đo được.
3. Cut list (những gì KHÔNG làm ở v1) — hàng rào chống scope creep của pha build.
4. Technical design contract: domain schema; ADR rút gọn (kiêm context cho AI coding); danh sách mua-không-tự-viết; danh sách "vực 20% cuối"; ranh giới hiểu-code; event tracking plan.
5. Definition of Done đã đóng băng (kèm ngày).
6. Positioning statement + **phạm vi lời hứa** (hứa gì / không hứa gì — từ R1) → nguồn cho copy, landing, onboarding.
7. Giá neo + mô hình thu tiền + phân khúc trả tiền thật (từ V3).
8. Với AI-core: **golden dataset + eval harness từ R1 bàn giao nguyên trạng** — trở thành CI test của pha build ngay ngày đầu.
9. **Carry-forward**: các giả định còn mở (chưa đóng được ở gate nào) + learning plan — pha build cần biết cái gì vẫn đang là giả thuyết để không đối xử với nó như sự thật.

**Tiêu chí đánh giá pack** (chuyển cửa cuối hiện có thành checklist máy-đọc): truy vết đủ 100% bước core loop · cut list không rỗng · aha có tên sự kiện · schema tồn tại · DoD đóng băng có ngày · cold-start test pass (có thể kiểm bằng một subagent "đóng vai session mới" đọc pack và liệt kê câu hỏi còn phải hỏi — nếu danh sách khác rỗng ở phạm vi đã chốt thì fail).

## Yếu tố 3 — Năng lực cần cung cấp và cách phân bổ

Map công việc → năng lực → cơ chế (theo decision tree chính thức: skill = tri thức tự kích hoạt; command = user chủ động; agent = việc dài/context riêng; hook = luật chạy bất kể Claude muốn hay không):

| Nhóm công việc | Năng lực cần | Cơ chế phân bổ |
|---|---|---|
| Điều phối giai đoạn, gate check, status | Đọc state, đối chiếu checklist | **Skills user-invocable** (đóng vai command): `/validate:new`, `/validate:status`, `/validate:gate` |
| Phương pháp từng giai đoạn (0→5) | Tri thức quy trình + template | **Skill mỗi giai đoạn**, body mỏng, template/checklist là supporting files |
| Quét đối thủ 5 tầng, đào review, kiểm chứng benchmark | Web research, fan-out song song | **Agents** trong plugin (competitor-scanner, review-miner) + WebSearch/WebFetch; MCP (vd firecrawl) là tùy chọn bundle |
| Phản biện tại gate | Context riêng, lập trường đối nghịch | **Agent "gatekeeper"** — xem Yếu tố bổ sung 3 |
| Elicitation (0.1→0.6, phỏng vấn người dùng) | Hỏi có cấu trúc | **AskUserQuestion trong thân skill, ở main loop** (không dùng được trong subagent) |
| Spike/PoC, error analysis, eval (R1) | Năng lực code sẵn có | Không cần cấp thêm — chỉ cần skill hướng dẫn error-analysis-first |
| Luật bất biến (state, evidence firewall, ngưỡng) | Cưỡng chế deterministic | **Hooks**: SessionStart (load state + luật), PostToolUse (validate artifact), cảnh báo khi sửa ngưỡng đã ký |

**Nguyên tắc hiệu quả token** (từ cơ chế progressive disclosure): giữ số skill nhỏ (6–9) vì mọi description đều thường trực trong context; body <500 dòng; toàn bộ template và checklist chi tiết nằm ở supporting files chỉ load khi cần. Việc nặng dùng `context: fork` để không chiếm context chính.

## Yếu tố 4 — Làm rõ, tranh luận, chuyển hóa thông tin

**Đánh giá**: đây là giá trị lõi của plugin ở giai đoạn đầu — biến raw input thành thông tin có kiến trúc theo chuẩn rộng rãi (problem hypothesis 5 thành phần, Lean Canvas, assumption map, JTBD, positioning canvas). Ba nguyên tắc thiết kế:

1. **Chat là phù du, file là hồ sơ**: mọi vòng trao đổi phải kết thúc bằng artifact được ghi ra file với nhãn trạng thái. Không có "kết luận chỉ nằm trong chat". Đây cũng là cách sống sót qua compaction (PreCompact) — pipeline kéo dài nhiều tuần, context sẽ bị nén, chỉ file là bền.
2. **Nguy cơ chết người nhất: Claude điền hộ thay vì moi từ người dùng.** Sản phẩm sẽ trông "đã validate" nhưng toàn bằng chứng bịa. Quy tắc mã hóa vào skill: Claude được *draft* giả thuyết và luôn dán nhãn `[đoán]`; các trường **bằng chứng** (sổ bằng chứng, transcript, cam kết tiền) chỉ được điền từ input người dùng cung cấp — không bao giờ tự sinh, kể cả khi người dùng bảo "điền giúp". Đây chính là nguyên tắc "AI đứng mọi vị trí trừ nguồn bằng chứng" chuyển thành luật của plugin.
3. **Tăng nhận thức, không chỉ tăng sản lượng**: mỗi lần chuyển hóa kèm 1–2 câu "vì sao dùng khung này" (link foundations để đọc sâu). Elicitation dùng AskUserQuestion cho lựa chọn cấu trúc (market type, loại rủi ro giả định) và free-text cho nội dung; mỗi phiên có mục tiêu artifact tuyên bố trước ("phiên này chốt 0.1 + 0.5") để chống lan man.

## Yếu tố 5 — Khả năng core của Claude Code

**Đánh giá**: đã đọc docs chính thức (tóm tắt ở đầu file). Các hệ quả thiết kế quan trọng nhất:

1. Plugin **không có CLAUDE.md** → "khung chuẩn bất biến" của bạn phải sống ở: SessionStart hook (inject state + 3 nguyên tắc lõi vào đầu mỗi phiên) + skill descriptions + gate-check skill. Đừng thiết kế dựa trên giả định plugin có thể áp rule thường trực.
2. Hook có `type: prompt` / `type: agent` → gate check có thể có tầng thẩm định LLM độc lập chạy tự động, không chỉ shell script.
3. Skill body ở lại context sau invoke → không nhét cả 6 giai đoạn vào một skill; mỗi giai đoạn một skill để chỉ trả token cho giai đoạn đang làm.
4. AskUserQuestion không chạy trong subagent → kiến trúc bắt buộc: elicitation ở main loop, research ở subagent, không trộn.
5. `${CLAUDE_PLUGIN_ROOT}` cho phép bundle script kiểm tra state/frontmatter deterministic (không tốn LLM cho việc máy làm được).

---

## Các yếu tố CẦN BỔ SUNG (chưa có trong 5 yếu tố của bạn)

### B1. Evidence firewall — cưỡng chế, không chỉ khuyến nghị
Nguyên tắc "AI không là nguồn bằng chứng" phải có cơ chế cưỡng chế 3 tầng: (a) luật trong skill body; (b) schema — mỗi evidence entry bắt buộc trường `source` trỏ về người/file thật, hook validate; (c) gatekeeper agent kiểm xác suất bịa khi gate check. Không có tầng cưỡng chế, plugin sẽ tự sản xuất validation giả — thất bại tệ nhất có thể của một plugin validate.

### B2. State bền và resumability qua nhiều session
Quy trình kéo dài nhiều tuần; session Claude Code thì ngắn và bị compact. Cần: state file per idea + SessionStart hook đọc state và inject "đang ở đâu, chờ gì, deadline nào" + lệnh `/validate:status`. Git là bộ nhớ dài hạn. Hỗ trợ nhiều ý tưởng song song (mỗi ý tưởng một thư mục state riêng).

### B3. Chống sycophancy tại gate
Claude trong main loop đã "gắn bó" với ý tưởng qua hàng giờ đối thoại — nó sẽ nghiêng về cho qua. Gate check nên do **agent gatekeeper riêng** đảm nhiệm với system prompt phản biện (nhiệm vụ: tìm lý do TRƯỢT, không phải xác nhận đạt), đọc artifact từ context sạch. Ngưỡng đã ký thì hook cảnh báo khi bị sửa sau ngày ký (so sánh threshold + ngày trong frontmatter).

### B4. Chiều thời gian
Kill criteria dạng state + **date**; phỏng vấn/pre-sell là việc chờ người thật nhiều ngày. State cần khái niệm `waiting_on_human` (đang chờ gì, từ ngày nào) và SessionStart hook so ngày để nhắc deadline/kill criteria quá hạn. Không có chiều thời gian, kill criteria vô hiệu — vì không ai quay lại kiểm.

### B5. Điểm bàn giao người–máy tường minh
Những việc **chỉ người làm được**: phỏng vấn, xin cam kết tiền, quan hệ. Plugin phải thiết kế các handoff artifact hai chiều: xuất (bộ câu hỏi phỏng vấn, script pre-sell, checklist buổi concierge) và nhận (transcript, kết quả, số tiền) — với format nhận định sẵn để Claude phân tích được ngay.

### B6. Meta-eval: đánh giá chính plugin
Tiêu chí thành công của plugin phải đặt trước (đúng tinh thần pipeline): giết ý tưởng tồi nhanh hơn/rẻ hơn bao nhiêu; thời gian tới gate đầu tiên; artifact có pass cold-start test không; người dùng có hiểu thêm khung phương pháp không. Cách kiểm duy nhất đáng tin: **dogfood trên một ý tưởng thật** — và áp error-analysis-first cho chính plugin (dùng thật, ghi lỗi thật, sửa từ lỗi thật, không tưởng tượng tính năng).

### B7. Ngân sách nỗ lực chống validation paralysis
Mã hóa khung 2/20/200 (Walling) thành ngân sách giờ khuyến nghị per giai đoạn trong state; hook/status nhắc khi vượt xa ngân sách mà chưa qua gate — chống cả hai cực: nhảy cóc và validate mãi không build.

### B8. Bảo mật dữ liệu khách trong artifact
Transcript, tên thật, số tiền cam kết nằm trong repo. Cần quy ước: gitignore cho dữ liệu thô nhạy cảm, hoặc tách `ideas/<slug>/private/`; cảnh báo trước khi push repo public.

### B9. Scope V1 của chính plugin
Áp chính pipeline vào plugin: đừng build cả 6 giai đoạn + đủ 4 cơ chế ngay. V1 đề xuất: state + SessionStart hook + skill giai đoạn 0 + gate-check + evidence firewall tối thiểu — dogfood với một ý tưởng thật — rồi mở rộng theo lỗi thực tế. Plugin cũng cần cut list của nó.

### B10. Ngôn ngữ và thuật ngữ
Artifact tiếng Việt, thuật ngữ phương pháp giữ tiếng Anh (earlyvangelist, positioning thesis, dunning…) — chuẩn hóa trong template để artifact nhất quán giữa các phiên và các ý tưởng.

---

## Phác thảo kiến trúc đề xuất (để thảo luận, chưa phải quyết định)

```
saas-validate/
├── .claude-plugin/plugin.json
├── skills/
│   ├── new-idea/          (user-invocable — khởi tạo ideas/<slug>/, elicitation 0.1)
│   ├── status/            (user-invocable — đang ở đâu, chờ gì, deadline nào)
│   ├── gate-check/        (user-invocable — gọi gatekeeper agent, đối chiếu contract)
│   ├── stage-0-framing/   (auto — elicitation 0.1→0.6; supporting: templates)
│   ├── stage-1-competitive/ (auto — điều phối scanner agents)
│   ├── stage-2-validate/  (auto — soạn câu hỏi, phân tích transcript, sổ bằng chứng)
│   ├── stage-3-verify/    (auto — error-analysis-first, eval discipline)
│   ├── stage-4-positioning/ (auto — chuỗi 5 thành phần từ lời khách)
│   └── stage-5-scope-lock/ (auto — MVP pack + cold-start test)
├── agents/
│   ├── competitor-scanner.md   (fan-out quét 5 tầng, kiểm chứng từng đối thủ)
│   ├── review-miner.md         (đào + phân cụm review 1–3 sao)
│   ├── gatekeeper.md           (phản biện tại gate — tìm lý do trượt)
│   └── coldstart-tester.md     (đóng vai session build mới, đọc MVP pack)
├── hooks/hooks.json
│   ├── SessionStart → load state + 3 nguyên tắc + nhắc deadline/kill criteria
│   ├── PostToolUse (Write|Edit trên ideas/**) → validate frontmatter artifact
│   └── PreToolUse (Edit trên file threshold đã ký) → cảnh báo/chặn
└── (tùy chọn) .mcp.json — firecrawl hoặc tương đương cho research
```

V1 chỉ build: plugin.json + state + SessionStart hook + new-idea + stage-0-framing + gate-check + gatekeeper. Dogfood rồi mở rộng.

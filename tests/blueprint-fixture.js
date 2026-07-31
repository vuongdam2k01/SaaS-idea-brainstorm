#!/usr/bin/env node
/**
 * Blueprint fixture builder (tests only).
 *
 * Generates a MINIMAL idea workspace whose blueprint passes
 * scripts/validate-blueprint.js --at-gate with zero errors — the
 * producer-validator fixture idiom (the prospect-table precedent): every
 * template shape the stage-6 templates emit must be a shape the ONE validator
 * accepts, and the tests then break it one defect at a time.
 *
 * v1.6.0: exercises the interaction layer (touches, conflict domains, state
 * machines, jobs, invariants) and the subsystem layer (llm-kind ss spec, CAP,
 * EV bindings, async states, determinism strategy).
 *
 * Bodies are deliberately Vietnamese where prose is prose: the validator must
 * key on anchors and id vocabularies only (method-rules §Language).
 */
"use strict";
const fs = require("fs");
const path = require("path");

function w(dir, relPath, content) {
  const p = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

const pipeFm = (artifact, extra) => `---
artifact: ${artifact}
idea: bpfix
stage: 6
gate: BP
status: ready
evidence_grade: none
rung: baseline-auto
${extra ? extra + "\n" : ""}pipeline_version: 1.6.0
updated: 2026-07-31
---
`;

function build(root) {
  const idea = path.join(root, "ideas", "bpfix");
  fs.mkdirSync(idea, { recursive: true });
  w(idea, "state.json", JSON.stringify({ pipeline_version: "1.6.0", idea: "bpfix" }, null, 2));

  // ---- pack side (with 1.4.1+ join anchors/ids)
  w(idea, "mvp-pack/mvp-spec.md", `---
artifact: mvp-spec
idea: bpfix
stage: 5
gate: LOCK
status: locked
evidence_grade: B
rung: baseline-auto
pipeline_version: 1.6.0
updated: 2026-07-31
---
# MVP Spec — bpfix   HYPOTHESIS
## Vòng lặp lõi
<!-- pack:core-loop -->
| # | User làm | Hệ thống làm | User nhận | Trace |
|---|---|---|---|---|
| 1 | tải transcript lên | phân tích | bản digest | E1 |
| 2 | xuất báo cáo | render | file PDF | E2 |
## Aha
<!-- pack:aha -->
- Event: \`report_exported\` — trong 10 phút sau signup — nguồn: R2
## Lời hứa dịch vụ tối thiểu
<!-- pack:msp -->
| id | Trường | Cam kết |
|---|---|---|
| MSP-1 | Ai được dùng | khách pilot đã trả tiền |
| MSP-2 | Xoá dữ liệu | xoá trong 30 ngày khi yêu cầu |
| MSP-3 | Không hỗ trợ | N/A vì đã ghi ở MSP-1 |
`);
  w(idea, "mvp-pack/definition-of-done.md", `---
artifact: definition-of-done
idea: bpfix
stage: 5
gate: LOCK
status: locked
evidence_grade: none
rung: baseline-auto
pipeline_version: 1.6.0
updated: 2026-07-31
---
# DoD
<!-- pack:dod -->
- [ ] DOD-1 Vòng lặp lõi chạy trọn
- [ ] DOD-2 Aha event bắn
- [ ] DOD-3 Backup chạy và restore đã thử
- [ ] DOD-4 Tự dùng thật
- [ ] DOD-5 (đa tenant) — N/A because: single-tenant pilot
`);
  w(idea, "mvp-pack/tech-design.md", `---
artifact: tech-design
idea: bpfix
stage: 5
gate: LOCK
status: locked
evidence_grade: none
rung: baseline-auto
pipeline_version: 1.6.0
updated: 2026-07-31
---
# Thiết kế kỹ thuật
<!-- pack:entities -->
Thực thể: report (bản digest), user (người dùng) — trạng thái report: draft → exported.
ADR #1: lõi LLM tự vận hành (chose managed API over self-host because ops).
<!-- pack:tracking -->
| event | name | note |
|---|---|---|
| aha | \`report_exported\` | REQUIRED |
<!-- pack:buy -->
auth: clerk · payments: stripe
`);
  w(idea, "mvp-pack/eval/README.md", `# Eval harness (fixture)
Threshold đã ký tại R1: 85% trên bộ dữ liệu thật.
`);

  // ---- blueprint side
  w(idea, "blueprint/blueprint-overview.md", pipeFm("blueprint-overview") + `# Blueprint — bpfix   HYPOTHESIS
<!-- bp:index -->
| id | title | pack trace | status | open decisions |
|---|---|---|---|---|
| fs-01 | tải transcript | core-loop step 1 / DOD-1 | ready | 0 |
| fs-02 | xuất báo cáo | core-loop step 2 / DOD-2 | ready | 0 |
| ss-01 | lõi LLM digest | ADR #1 | ready | 0 |
| interaction-map | tương tác | DOD-1 | ready | 0 |
<!-- bp:event-dictionary -->
| event | pack trace | payload | fired by |
|---|---|---|---|
| \`report_exported\` | aha (tracking plan) | user_id, report_id | fs-02 |
| \`transcript_uploaded\` | tracking plan | user_id | fs-01 |
<!-- bp:carry-forward -->
| giả định mở | phụ thuộc | nếu sụp |
|---|---|---|
`);

  w(idea, "blueprint/feature-specs/fs-01-upload.md", pipeFm("fs-01-upload") + `# fs-01 — upload
<!-- bp:trace -->
- **Pack trace**: core-loop step 1 / DOD-1
- **User story**: "tôi cần tải transcript nhanh" (E1)
## Touches
<!-- bp:touches -->
| entity | access | why |
|---|---|---|
| report | write | tạo bản ghi khi tải lên |
## Uses
<!-- bp:uses -->
- none
## Luồng chính
<!-- bp:flow -->
1. user bấm nút → hệ thống xử lý → user thấy kết quả
## Acceptance
<!-- bp:acceptance -->
| id | Given | When | Then |
|---|---|---|---|
| AC-01-1 | đã đăng nhập | tải transcript | bản ghi report tạo trong 5s |
## Fields
<!-- bp:fields -->
| entity.field | type | rules/limits | default | on invalid |
|---|---|---|---|---|
| report.title | varchar(255) | max 255 | — | "Tiêu đề quá dài" |
## States
<!-- bp:states -->
| state | screen | trigger | code | user sees | user can do |
|---|---|---|---|---|---|
| error | SC-1 | lỗi xử lý | E400 | "Có lỗi, thử lại" | thử lại |
| empty | SC-1 | chưa có dữ liệu | — | "Chưa có gì" | tải lên |
| loading | SC-1 | đang xử lý | — | spinner | chờ |
## Edge cases
<!-- bp:edge-cases -->
| case | behaviour |
|---|---|
| empty / duplicate / oversized input | từ chối, báo "File trống hoặc trùng" |
| permission boundary (incl. cross-tenant) | chỉ chủ sở hữu thấy |
| dependency failure (LLM / webhook / export target) | retry 1 lần rồi báo lỗi |
| retry / idempotency (user does it twice) | idempotency key theo report_id |
| concurrency (two sessions, same record) | last-write-wins có cảnh báo |
| timezone / locale / currency | N/A vì không có ngày/tiền hiển thị |
## Instrumentation
<!-- bp:instrumentation -->
| event | fired when |
|---|---|
| \`transcript_uploaded\` | khi hoàn tất |
## Open decisions
<!-- bp:open-decisions -->
| # | question | resolution order tried | founder's answer (date) |
|---|---|---|---|
`);

  w(idea, "blueprint/feature-specs/fs-02-export.md", pipeFm("fs-02-export") + `# fs-02 — export
<!-- bp:trace -->
- **Pack trace**: core-loop step 2 / DOD-2
- **User story**: "tôi cần xuất báo cáo nhanh" (E2)
## Touches
<!-- bp:touches -->
| entity | access | why |
|---|---|---|
| report | transition:ST-report-1 | chuyển draft sang exported |
## Uses
<!-- bp:uses -->
- CAP-01-1
## Luồng chính
<!-- bp:flow -->
1. user bấm xuất → job sinh digest chạy → user nhận PDF
## Acceptance
<!-- bp:acceptance -->
| id | Given | When | Then |
|---|---|---|---|
| AC-02-1 | report ở draft | bấm xuất | digest đạt ngưỡng EV-1 và ST-report-1 chạy |
## Fields
<!-- bp:fields -->
| entity.field | type | rules/limits | default | on invalid |
|---|---|---|---|---|
| report.status | text | draft/exported | draft | "Trạng thái không hợp lệ" |
## States
<!-- bp:states -->
| state | screen | trigger | code | user sees | user can do |
|---|---|---|---|---|---|
| error | SC-1 | lỗi xử lý | E500 | "Có lỗi, thử lại" | thử lại |
| empty | SC-1 | chưa có digest | — | "Chưa có gì" | tạo mới |
| loading | SC-1 | đang tải trang | — | spinner | chờ |
| queued | SC-1 | job xếp hàng | — | "Đang xếp hàng" | huỷ |
| running | SC-1 | job chạy | — | tiến độ % | huỷ |
| cancelled | SC-1 | user huỷ | — | "Đã huỷ" | chạy lại |
| partial | SC-1 | job dở dang | — | "Bản nháp một phần" | tiếp tục / bỏ |
## Edge cases
<!-- bp:edge-cases -->
| case | behaviour |
|---|---|
| empty / duplicate / oversized input | từ chối transcript rỗng |
| permission boundary (incl. cross-tenant) | chỉ chủ sở hữu xuất |
| dependency failure (LLM / webhook / export target) | degrade theo ss-01 ladder |
| retry / idempotency (user does it twice) | xem JOB-1: lần 2 nối vào job đang chạy |
| concurrency (two sessions, same record) | xem conflict domain report |
| timezone / locale / currency | N/A vì PDF không in ngày giờ địa phương |
## Instrumentation
<!-- bp:instrumentation -->
| event | fired when |
|---|---|
| \`report_exported\` | khi job hoàn tất |
## Open decisions
<!-- bp:open-decisions -->
| # | question | resolution order tried | founder's answer (date) |
|---|---|---|---|
`);

  w(idea, "blueprint/data-schema.md", pipeFm("data-schema") + `# Schema
<!-- bp:entities -->
## report
| entity.field | type | constraints | default | serves |
|---|---|---|---|---|
| report.title | varchar(255) | not null | — | fs-01 |
| report.status | text | draft/exported | draft | fs-02 |
<!-- bp:state-machines -->
| ST-id | from | to | trigger | guard |
|---|---|---|---|---|
| ST-report-1 | draft | exported | fs-02 | job thành công |
<!-- bp:stores -->
| store | kind | owned by | schema version + forward-compat rule |
|---|---|---|---|
<!-- bp:indexes -->
## Indexes: report.status
<!-- bp:migrations -->
## Migrations: một migration đầu, seed 1 report mẫu
<!-- bp:retention -->
| MSP-n | mechanism | verified by |
|---|---|---|
| MSP-2 | job xoá theo yêu cầu, cột deleted_at | AC-02-1 |
`);

  w(idea, "blueprint/interaction-map.md", pipeFm("interaction-map") + `# Interaction map
<!-- bp:conflict-domains -->
| entity | writers | scope | who wins | merge rule | lock/lease | loser sees | undo scope |
|---|---|---|---|---|---|---|---|
| report | fs-01, fs-02 | single-user-multi-session | thao tác sau thắng | ghi đè nguyên bản ghi | không khoá | cảnh báo "phiên khác đã đổi" | undo trong phiên, không xuyên job |
<!-- bp:pairwise-exceptions -->
| fs-A | fs-B | interaction or \`no interaction <reason>\` |
|---|---|---|
<!-- bp:invariants -->
| INV-n | invariant | trace | covered by |
|---|---|---|---|
| INV-1 | report chỉ exported khi job thành công | ST-report-1 | test-plan |
<!-- bp:jobs -->
| JOB-n | triggered by | durable? | cancellable? | on second submit | on disconnect/tab close | result lifetime | user notified how |
|---|---|---|---|---|---|---|---|
| JOB-1 | CAP-01-1 | có, sống qua reload | có, nút huỷ | nối vào job đang chạy | job chạy tiếp, kết quả chờ ở SC-1 | 30 ngày | badge trên SC-1 |
`);

  w(idea, "blueprint/subsystem-specs/ss-01-digest-llm.md", pipeFm("ss-01-digest-llm", "kind: llm") + `# ss-01 — lõi LLM digest   (kind: llm)
<!-- bp:trace -->
- **Pack trace**: ADR #1 (managed LLM API), domain-model element: report
<!-- bp:capabilities -->
| CAP-id | what | inputs | output schema | p95 latency budget | cost/call budget | async? | source |
|---|---|---|---|---|---|---|---|
| CAP-01-1 | sinh digest từ transcript | transcript text | digest JSON schema v1 | 60s | $0.04/call | yes | R1 đo 2026-07 |
<!-- bp:degradation -->
## Ladder: chậm >60s → hàng đợi + thông báo; provider sập → báo lỗi trung thực, không fallback bịa
<!-- bp:context -->
## Context: system prompt v1 + transcript cắt còn 30k token, mới nhất trước
<!-- bp:output-contract -->
## Output: JSON schema v1; sai schema → repair 1 lần; vẫn sai → job partial
<!-- bp:evals -->
| EV-n | what it scores | threshold | source |
|---|---|---|---|
| EV-1 | độ đúng cụm vấn đề trên dữ liệu thật | 85% | mvp-pack/eval/README.md |
<!-- bp:budgets -->
## Cost: $0.04/call × trần 50 call/user/tháng = $2.00 < biên $5 theo R1 (arithmetic inline)
<!-- bp:pinning -->
## Model: provider X, model Y, version 2026-06; đổi model → digest cũ giữ nguyên, digest mới gắn version mới
<!-- bp:artifact-lifecycle -->
## Digest lưu tại object storage; ~1MB/user/tháng; quota 100 bản, đầy thì evict bản cũ nhất đã exported; export = tải PDF (MSP-7); xoá theo MSP-2
`);

  w(idea, "blueprint/ux-spec.md", pipeFm("ux-spec") + `# UX
<!-- bp:screens -->
| SC-n | purpose | entry | states |
|---|---|---|---|
| SC-1 | màn hình chính | signup | error/empty/loading/queued/running → fs-01, fs-02 |
<!-- bp:flows -->
| flow | steps | exit |
|---|---|---|
| chính | SC-1 | xuất xong |
<!-- bp:first-run -->
| step | SC-n | user does | system does | distance to aha |
|---|---|---|---|---|
| 1 | SC-1 | tải transcript | phân tích | 1 bước |
Aha event: \`report_exported\` — trong 10 phút sau signup (theo pack). ST-report-1 hiển thị badge.
<!-- bp:navigation -->
## Điều hướng: một màn hình
<!-- bp:copy -->
| where | copy | source | publication_disposition |
|---|---|---|---|
| SC-1 | "Biến transcript thành digest hằng tuần" | positioning | test-as-proposition |
<!-- bp:accessibility -->
## Sàn accessibility: keyboard, contrast, labels
`);

  w(idea, "blueprint/api-contract.md", pipeFm("api-contract") + `# API
<!-- bp:endpoints -->
| endpoint | auth | request | response | errors |
|---|---|---|---|---|
| POST /reports | session | report.title: varchar(255) | report.status: text | E400 → tiêu đề sai → fs-01 error; E500 → lỗi xuất → fs-02 error |
`);
  w(idea, "blueprint/integration-specs.md", pipeFm("integration-specs") + `# Integrations
<!-- bp:integrations -->
## stripe — payments
- Scope used: checkout · Config/env vars: STRIPE_KEY · Cost basis: 2.9%
- Webhooks: checkout.completed · signature verification: có · idempotency: event id · retry window: 72h
- Failure path: hàng đợi thủ công, sản phẩm vẫn chạy
- Sandbox/test-mode plan: stripe test mode
`);
  w(idea, "blueprint/nfr-spec.md", pipeFm("nfr-spec") + `# NFR
<!-- bp:performance -->
| target | number | source |
|---|---|---|
| fs-02 digest end-to-end | 90s | R1 đo được |
<!-- bp:authz -->
## Authz: owner-only
<!-- bp:security -->
## Security: validate input, rate limit 10/phút, secrets qua env, backup hằng ngày + restore thử
<!-- bp:ops -->
## Ops: hỗ trợ qua email founder, hỏng thì sửa trong ngày, export CSV, sunset trả dữ liệu
<!-- bp:compliance -->
N/A — founder xác nhận không thuộc domain quản chế (charter CH-1, 2026-07-31)
`);
  w(idea, "blueprint/test-plan.md", pipeFm("test-plan") + `# Test plan
<!-- bp:coverage -->
| source | scenario | kind | determinism |
|---|---|---|---|
| AC-01-1 | tải transcript thành công | e2e | — |
| AC-02-1 | xuất báo cáo + xoá theo yêu cầu | e2e | live-eval-threshold |
| EV-1 | harness chạy trên bộ thật | eval | live-eval-threshold |
| INV-1 | không exported khi job fail | integration | seeded |
| DOD-1 | vòng lặp lõi trọn | e2e | — |
| DOD-2 | aha event bắn | integration | — |
| DOD-3 | backup + restore | ops | — |
| DOD-4 | tự dùng thật | manual | — |
| MSP-1 | chỉ khách pilot truy cập | integration | — |
| MSP-2 | job xoá chạy | integration | — |
<!-- bp:eval -->
## Eval: harness từ mvp-pack/eval/ chạy làm CI, ngưỡng 85%
`);
  w(idea, "blueprint/build-plan.md", pipeFm("build-plan") + `# Build plan
<!-- bp:milestones -->
| # | milestone | fs ids | done when | depends on |
|---|---|---|---|---|
| 1 | walking skeleton | fs-01, fs-02 | vòng lặp lõi e2e | — |
<!-- bp:environment -->
- [x] repos/CI github · [x] dev/prod split · [x] migrations via CI
- [x] secrets qua env · [x] error tracking trước user ngoài
`);
  w(idea, "blueprint/deferred-register.md", `---
artifact: deferred-register
artifact_kind: deferred-register
idea: bpfix
phase: maintenance
cycle_id: C1
mutation_policy: append-only
publication_status: draft
as_of: 2026-07-31
pipeline_version: 1.6.0
updated: 2026-07-31
---
# Deferred register
<!-- bp:deferred -->
| DF-n | item | why deferrable | owner | date | status |
|---|---|---|---|---|---|
| DF-1 | domain chính thức | chờ founder mua | founder | 2026-08-15 | open |
`);
  return idea;
}

module.exports = { build };

# Mechanics run — nhánh sau LOCK (2026-07-30)

> **Đây KHÔNG phải dogfood.** Không có bằng chứng thật, không có founder thật, không có quyết định
> thật. Đây là kiểm **cơ học**: chạy đúng các bước mà `declare-drift` / `reconcile` / `run-validation`
> mô tả, trên một idea nháp có cycle giả lập đã LOCK, để xem file + script + hook có thực thi được
> những gì skill yêu cầu hay không. Trước lần chạy này, toàn bộ nhánh sau LOCK **chưa từng được thực
> thi lần nào** — chỉ có fixture đơn vị.
>
> Idea nháp: `scratchpad/mrun/ideas/demo` (ngoài repo, không phải artifact của người dùng).

## Chuỗi đã chạy

| # | Bước theo skill | Kết quả |
|---|---|---|
| 1 | `declare-drift` ghi `drift-inbox.md` (3 row, 3 dimension, một cái chạm pack-predicate) | hook chấp nhận (frontmatter maintenance, kind↔policy đúng) |
| 2 | `declare-drift` set `maintenance.drift_declared_at` trên state của **cycle đã LOCK** | `state-write` chấp nhận — freeze rule không chặn nhánh maintenance |
| 3 | Ranh giới drift phải nổi lên | session-start: `!! DRIFT DECLARED … blocked until reconcile completes` |
| 4 | `reconcile` publish `current-baseline-v1.md` (`publication_status: locked`) | hook chấp nhận |
| 5 | `reconcile` step 4.3 hash bằng **helper dùng chung** (`--purpose reconciliation`) | create + verify đều pass; manifest có self-hash |
| 6 | `reconcile` cập nhật head pointer + `last_reconcile` (ghi LAST) | `state-write` chấp nhận |
| 7 | Ranh giới phải **tự sạch** sau reconcile | session-start: `boundary CLEARED`, hiện `last reconcile … (declared-only)` |
| 8 | `run-validation` ghi `<run_id>-spec.md` (immutable, locked) | hook chấp nhận |

## Negative — thứ phải bị chặn thì có bị chặn không

| Thử | Kết quả |
|---|---|
| Sửa `gates.V3` trong cycle đã LOCK | `REJECTED: cycle C1 is locked — its owned subtree is frozen … Post-LOCK verification uses validation runs / a new cycle` |
| Mở lại cycle bằng cách sửa `cycles[].status` | `REJECTED: … its cycles[] entry is frozen (no status/parent/state/id changes, no removal)` |
| Thả một file vào `mvp-pack/` sau khi đã chốt manifest | `MISMATCH file-added: mvp-pack/extra.md appeared in "mvp-pack" after the manifest was created` |

## Defect tìm được (đã sửa + có fixture)

**`artifact-manifest.js create --out private/…` fail ENOENT khi `private/` chưa tồn tại.**
gate-check bảo ghi manifest đúng vào `private/manifest-<gate>-<date>-NN.json`, mà thư mục đó chưa có
ở một idea mới → gate bị chặn vì một lý do **không liên quan gì đến artifact đang xét**. Đã sửa:
`create` tự tạo thư mục cha. Fixture: `--out creates its parent directory`.

Đây đúng là loại lỗi chỉ lộ ra khi chạy thật: mọi fixture trước đó đều tạo sẵn thư mục.

## Chưa kiểm được ở lần chạy này

- **Phần ngữ nghĩa của reconcile** (so sánh ba tầng, impact routing, claim transition, dismissal chỉ
  được `duplicate|erroneous|out-of-scope`) — do model thực thi, không phải script; cần một lần chạy
  có model đọc skill và một người xác nhận kết quả.
- **`run-validation` adjudication** (`confirmation_window` được tôn trọng, report không spec là void).
- Toàn bộ nhánh pipeline V2 → LOCK với bằng chứng thật.

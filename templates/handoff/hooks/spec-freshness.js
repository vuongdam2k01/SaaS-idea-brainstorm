#!/usr/bin/env node
/**
 * spec-freshness — SessionStart hook for a repo that carries a build-handoff kit.
 *
 * Generated into this repo by the saas-idea-brainstorm plugin. Two jobs:
 *   1. tell the session, before its first prompt, that product decisions are frozen
 *      in the spec root and how to resolve an id there;
 *   2. prove the copy is still trustworthy — every file is hashed in spec-index.json,
 *      and the source workspace (when reachable) is checked for amendments landed
 *      after this kit was generated.
 *
 * A stale spec is more dangerous than no spec, so drift is reported loudly and
 * never repaired silently. Fails open: a broken hook must not block a session.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const root = findRoot(evt.cwd || process.cwd());
    if (!root) return process.exit(0);

    const indexPath = path.join(root, ".claude", "product-spec", "spec-index.json");
    let idx;
    try {
      idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (e) {
      return emit(
        "This repository carries a frozen product specification, but " +
        ".claude/product-spec/spec-index.json is unreadable (" + e.message + "). Id lookup and the " +
        "freshness check are both unavailable until the handoff kit is regenerated. Treat the " +
        "spec files as authoritative and do not rely on any index."
      );
    }

    const SPEC_ROOT = idx.spec_root || "docs/product";
    const lines = [];
    const alerts = [];

    lines.push(
      "Product specification: this repository implements a spec that was locked before the repo " +
      "existed. It lives in " + SPEC_ROOT + "/ (" + (idx.file_count || "?") + " files, " +
      Object.keys(idx.ids || {}).length + " indexed ids), generated " + (idx.generated || "?") +
      " from " + (idx.source_workspace || "an unrecorded workspace") + "."
    );
    if (idx.draft)
      alerts.push(
        "The kit was generated in DRAFT mode: the blueprint had NOT passed gate BP. Its contents " +
        "are not a locked contract and may still change."
      );
    if (idx.pack_class)
      lines.push("Pack class: " + idx.pack_class + ".");
    lines.push(
      "Read order on any session that touches product behaviour: " +
      (Array.isArray(idx.read_order) && idx.read_order.length
        ? idx.read_order.slice(0, 4).map((r) => SPEC_ROOT + "/" + r).join(" → ")
        : SPEC_ROOT + "/READ-ORDER.md")
    );
    lines.push(
      "Ids (fs-NN, AC-NN-n, INV-n, JOB-n, ST-<entity>-n, CAP-NN-n, EV-n, DR-n, DOD-n, …) resolve " +
      "through .claude/product-spec/spec-index.json, or `node .claude/product-spec/spec-lookup.js <id>`. " +
      SPEC_ROOT + "/ is read-only here: corrections go through the amendment process in the source " +
      "workspace, described in AGENTS.md."
    );
    if (idx.amendments_through && idx.amendments_through !== "none")
      lines.push(
        "Amendments through " + idx.amendments_through + ": " + SPEC_ROOT + "/blueprint/amendment-log.md " +
        "overrides the locked files wherever it speaks, and is read first."
      );

    // ---- 1. local integrity -------------------------------------------------
    const changed = [];
    const gone = [];
    for (const f of Array.isArray(idx.files) ? idx.files : []) {
      const p = path.join(root, SPEC_ROOT, f.path);
      let buf;
      try { buf = fs.readFileSync(p); } catch { gone.push(f.path); continue; }
      const h = crypto.createHash("sha256").update(buf).digest("hex");
      if (f.sha256 && h !== f.sha256) changed.push(f.path);
    }
    if (gone.length)
      alerts.push(
        "MISSING from the local copy: " + gone.slice(0, 8).join(", ") + (gone.length > 8 ? ` (+${gone.length - 8} more)` : "") +
        ". The spec set is incomplete — regenerate the kit before implementing against it."
      );
    if (changed.length)
      alerts.push(
        "LOCALLY MODIFIED (hash differs from the locked source): " + changed.slice(0, 8).join(", ") +
        (changed.length > 8 ? ` (+${changed.length - 8} more)` : "") +
        ". These files are supposed to be byte-frozen. An edit here changed no product decision, " +
        "only the record of one. Restore by regenerating the kit, and route the intended change " +
        "through the amendment process instead."
      );

    // ---- 2. source-workspace drift -----------------------------------------
    const src = idx.source_workspace;
    if (src && typeof src === "string") {
      let reachable = false;
      try { reachable = fs.existsSync(src) && fs.statSync(src).isDirectory(); } catch {}
      if (!reachable) {
        lines.push(
          "The source workspace is not reachable from this machine, so freshness against it could " +
          "not be checked; only the local hashes above were verified."
        );
      } else {
        const srcChanged = [];
        for (const f of Array.isArray(idx.files) ? idx.files : []) {
          if (!f.source) continue;
          let buf;
          try { buf = fs.readFileSync(path.join(src, f.source)); } catch { continue; }
          const h = crypto.createHash("sha256").update(buf).digest("hex");
          if (f.sha256 && h !== f.sha256) srcChanged.push(f.path);
        }
        const amDir = path.join(src, "blueprint", "amendments");
        let srcAmendments = [];
        try {
          srcAmendments = fs.readdirSync(amDir).filter((n) => /^ba-\d{3}-/i.test(n)).sort();
        } catch {}
        const known = Array.isArray(idx.amendment_files) ? idx.amendment_files : [];
        const newAm = srcAmendments.filter((n) => !known.includes(n));
        if (srcChanged.length || newAm.length) {
          alerts.push(
            "OUT OF DATE: the source workspace has moved ahead of this kit" +
            (newAm.length ? " — new amendment(s): " + newAm.join(", ") : "") +
            (srcChanged.length ? " — changed file(s): " + srcChanged.slice(0, 6).join(", ") : "") +
            ". Regenerate the kit before implementing against these specs; the decisions here may " +
            "already have been superseded."
          );
        } else {
          lines.push("Freshness verified against the source workspace: no drift.");
        }
      }
    }

    let ctx = lines.join("\n");
    if (alerts.length)
      ctx += "\n\nATTENTION — spec integrity:\n- " + alerts.join("\n- ") +
        "\nSurface this to the user before doing product work in this session.";
    emit(ctx);
  } catch (e) {
    try { process.stderr.write("[spec-freshness] failed open: " + (e && e.message) + "\n"); } catch {}
    process.exit(0);
  }
});

function emit(ctx) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx } })
  );
  process.exit(0);
}
function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, ".claude", "product-spec", "spec-index.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
  return null;
}

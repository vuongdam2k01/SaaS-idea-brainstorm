#!/usr/bin/env node
/**
 * Shared artifact manifest helper (saas-idea-brainstorm plugin, v1.2.0).
 *
 * ONE implementation, two callers:
 *   - gate-check  → purpose "gate-input": pins the exact artifact set a verdict
 *                   was made against, so a decision can never appear to
 *                   authorize a materially different set of files.
 *   - reconcile   → purpose "reconciliation": the manifest of the reconcile
 *                   transaction (maintenance-rules §8).
 * A second implementation would create an integrity dialect immediately, so the
 * canonicalization and hashing live here and nowhere else. The callers differ in
 * their TRANSACTION (when they verify, what else they check), never in bytes.
 *
 * Deliberately NOT git-commit pinning: artifacts are routinely dirty or
 * untracked while a stage is in progress, so a commit id does not identify the
 * content a verdict actually saw.
 *
 * Usage:
 *   node scripts/artifact-manifest.js create <idea-dir> --purpose gate-input \
 *        --id LOCK-20260730-01 [--out <path>] <relpath> [<relpath>...]
 *   node scripts/artifact-manifest.js verify <idea-dir> <manifest-path>
 * Exit codes: 0 ok, 1 mismatch/missing, 2 usage or unreadable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ALGORITHM = "sha256";
const PURPOSES = ["gate-input", "reconciliation"];

function normalizeRel(rel) {
  // A trailing slash is how anyone naturally writes a directory ("mvp-pack/"), so
  // accept it instead of making the caller guess; every other spelling must be
  // canonical (see the round-trip check below).
  const unified = String(rel).replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!unified || unified === "." || unified === "..") throw new Error(`invalid path: "${rel}"`);
  if (path.isAbsolute(unified) || /^[a-zA-Z]:/.test(unified))
    throw new Error(`path must be idea-relative, not absolute: "${rel}"`);
  if (unified.split("/").some((seg) => seg === ".." || seg === "."))
    throw new Error(`path must not traverse directories: "${rel}"`);
  // Require the CANONICAL spelling. Without this, "a//b.md" and "a/b.md" are two
  // entries for one physical file: duplicate detection compared the raw strings,
  // so both were kept and verify reported nothing.
  const canonical = path.posix.normalize(unified).replace(/\/+$/, "");
  if (canonical !== unified)
    throw new Error(`path must be written canonically: "${rel}" should be "${canonical}"`);
  return canonical;
}

function hashFile(abs) {
  return crypto.createHash(ALGORITHM).update(fs.readFileSync(abs)).digest("hex");
}

/** Build the manifest object for an ordered-by-path file set. */
function create(ideaDir, relPaths, opts = {}) {
  const purpose = opts.purpose || "gate-input";
  if (!PURPOSES.includes(purpose)) throw new Error(`unknown purpose "${purpose}" (${PURPOSES.join("|")})`);
  const seen = new Set();
  const entries = [];
  // Directories are recorded as directories too, not just flattened into their
  // files: otherwise a file ADDED to the directory after `create` is invisible to
  // `verify` (every hashed file still matches), which is exactly the hole that
  // matters for mvp-pack/ at LOCK — someone could drop a file into the reviewed
  // pack and the verdict would still verify.
  const expandedDirs = [];
  for (const raw of relPaths) {
    const rel = normalizeRel(raw);
    if (seen.has(rel)) continue; // duplicates collapse; the set is a set
    seen.add(rel);
    const abs = path.join(ideaDir, rel);
    if (!fs.existsSync(abs)) throw new Error(`manifest target missing: ${rel}`);
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink())
      throw new Error(`manifest target is a symlink, which cannot be hashed honestly: ${rel}`);
    if (st.isDirectory()) {
      expandedDirs.push(rel);
      const links = [];
      for (const child of walk(abs, { collectLinks: links })) {
        const childRel = normalizeRel(path.relative(ideaDir, child));
        if (seen.has(childRel)) continue;
        seen.add(childRel);
        entries.push({ path: childRel, [ALGORITHM]: hashFile(child), bytes: fs.statSync(child).size });
      }
      if (links.length)
        throw new Error(
          `manifest target "${rel}" contains symlink(s) that cannot be hashed honestly: ` +
            links.map((l) => path.relative(ideaDir, l).replace(/\\/g, "/")).join(", ")
        );
    } else {
      entries.push({ path: rel, [ALGORITHM]: hashFile(abs), bytes: st.size });
    }
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  expandedDirs.sort();
  const manifest = {
    manifest_version: "1.0",
    purpose,
    id: opts.id || null,
    algorithm: ALGORITHM,
    created_for: opts.createdFor || null,
    expanded_dirs: expandedDirs,
    entries,
  };
  manifest.manifest_sha256 = manifestHash(manifest);
  return manifest;
}

/** Hash of the manifest's own canonical serialization (excludes the field itself). */
function manifestHash(manifest) {
  const { manifest_sha256, ...rest } = manifest; // eslint-disable-line no-unused-vars
  return crypto.createHash(ALGORITHM).update(serialize(rest)).digest("hex");
}

/** Deterministic serialization: sorted keys, no incidental whitespace. */
function serialize(value) {
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${serialize(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value === undefined ? null : value);
}

/** Compare a manifest against the files as they are right now. */
function verify(ideaDir, manifest) {
  const problems = [];
  if (!manifest || !Array.isArray(manifest.entries)) return [{ code: "unusable-manifest", detail: "no entries[]" }];
  // Fail CLOSED on shape. Every one of these fields was previously optional, so a
  // manifest missing its own hash (or its algorithm, or its purpose) verified
  // clean: the check was only ever as strong as the field's presence.
  if (manifest.manifest_version !== "1.0")
    problems.push({
      code: "unsupported-manifest-version",
      detail: `manifest_version must be "1.0" (got ${JSON.stringify(manifest.manifest_version)})`,
    });
  if (!PURPOSES.includes(manifest.purpose))
    problems.push({
      code: "invalid-purpose",
      detail: `purpose must be one of ${PURPOSES.join("|")} (got ${JSON.stringify(manifest.purpose)})`,
    });
  if (manifest.algorithm !== ALGORITHM)
    problems.push({ code: "algorithm-mismatch", detail: `algorithm must be ${ALGORITHM} (got ${JSON.stringify(manifest.algorithm)})` });
  if (typeof manifest.manifest_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(manifest.manifest_sha256))
    problems.push({ code: "missing-self-hash", detail: "manifest_sha256 is required (64 hex chars) — without it the body is unverifiable" });
  else if (manifest.manifest_sha256 !== manifestHash(manifest))
    problems.push({ code: "manifest-self-hash-mismatch", detail: "the manifest body was edited after it was written" });
  const known = new Set();
  for (const entry of manifest.entries) {
    let rel;
    try {
      rel = normalizeRel(entry.path);
    } catch (e) {
      problems.push({ code: "invalid-path", detail: e.message });
      continue;
    }
    // Windows paths are case-insensitive, so a manifest entry and a renamed file
    // differing only in case must not read as "unchanged".
    if (known.has(rel.toLowerCase())) {
      problems.push({ code: "duplicate-entry", detail: `${rel} appears more than once` });
      continue;
    }
    known.add(rel.toLowerCase());
    if (typeof entry[ALGORITHM] !== "string" || !/^[0-9a-f]{64}$/.test(entry[ALGORITHM])) {
      problems.push({ code: "malformed-entry-hash", detail: `${rel}: ${ALGORITHM} must be 64 hex chars` });
      continue;
    }
    const abs = path.join(ideaDir, rel);
    let st;
    try {
      st = fs.lstatSync(abs);
    } catch {
      problems.push({ code: "missing-file", detail: rel });
      continue;
    }
    if (st.isSymbolicLink()) {
      problems.push({ code: "symlink-entry", detail: `${rel} is now a symlink; a link's target is not what was hashed` });
      continue;
    }
    if (!st.isFile()) {
      problems.push({ code: "not-a-file", detail: `${rel} is no longer a regular file` });
      continue;
    }
    // A path differing only in case is a different name on a case-sensitive
    // checkout, so report it instead of treating the two as interchangeable.
    const onDisk = actualCaseName(ideaDir, rel);
    if (onDisk && onDisk !== rel)
      problems.push({ code: "path-case-mismatch", detail: `manifest says "${rel}", on disk it is "${onDisk}"` });
    let actual;
    try {
      actual = hashFile(abs);
    } catch (e) {
      problems.push({ code: "unreadable-file", detail: `${rel}: ${e.message}` });
      continue;
    }
    if (actual !== entry[ALGORITHM])
      problems.push({ code: "content-changed", detail: `${rel} (manifest ${short(entry[ALGORITHM])}, now ${short(actual)})` });
  }
  // `expanded_dirs` must be PRESENT, even when empty. Absent means the added-file
  // check below silently does nothing — which is what a hand-edited or legacy
  // manifest looks like, and it would verify a directory that gained files.
  // (Against a determined editor this is not a defence: the self-hash is
  // recomputable. The threat model here is mistake and self-deception, per the
  // integrity design — so the honest failure mode is "re-create the manifest".)
  if (!Array.isArray(manifest.expanded_dirs)) {
    problems.push({
      code: "missing-directory-coverage",
      detail: 'manifest has no "expanded_dirs" array — directory contents cannot be re-checked; re-create it with artifact-manifest.js create',
    });
  }
  for (const dirRel of Array.isArray(manifest.expanded_dirs) ? manifest.expanded_dirs : []) {
    let abs;
    try {
      abs = path.join(ideaDir, normalizeRel(dirRel));
    } catch (e) {
      problems.push({ code: "invalid-path", detail: e.message });
      continue;
    }
    let dirStat;
    try {
      dirStat = fs.lstatSync(abs);
    } catch {
      problems.push({ code: "missing-directory", detail: dirRel });
      continue;
    }
    if (!dirStat.isDirectory()) {
      problems.push({ code: "not-a-directory", detail: `${dirRel} is no longer a directory` });
      continue;
    }
    const links = [];
    let children;
    try {
      children = walk(abs, { collectLinks: links });
    } catch (e) {
      problems.push({ code: "unreadable-directory", detail: `${dirRel}: ${e.message}` });
      continue;
    }
    for (const l of links)
      problems.push({
        code: "symlink-added",
        detail: `${path.relative(ideaDir, l).replace(/\\/g, "/")} is a symlink inside "${dirRel}"`,
      });
    for (const child of children) {
      const childRel = path.relative(ideaDir, child).replace(/\\/g, "/");
      if (!known.has(childRel.toLowerCase()))
        problems.push({ code: "file-added", detail: `${childRel} appeared in "${dirRel}" after the manifest was created` });
    }
  }
  return problems;
}

function short(h) {
  return typeof h === "string" ? h.slice(0, 12) : String(h);
}

/**
 * Walk a directory WITHOUT following symlinks: readdir(withFileTypes) reports a
 * link as a link, and hashing a link's target would record bytes from a file
 * outside the manifested set. Links are collected so callers can flag them.
 */
function walk(dir, opts = {}) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      if (opts.collectLinks) opts.collectLinks.push(p);
      continue;
    }
    if (e.isDirectory()) out.push(...walk(p, opts));
    else if (e.isFile()) out.push(p);
  }
  return out.sort();
}

/** The on-disk spelling of an idea-relative path, segment by segment (or null). */
function actualCaseName(ideaDir, rel) {
  let cur = ideaDir;
  const real = [];
  for (const seg of rel.split("/")) {
    let names;
    try {
      names = fs.readdirSync(cur);
    } catch {
      return null;
    }
    const hit = names.find((n) => n.toLowerCase() === seg.toLowerCase());
    if (!hit) return null;
    real.push(hit);
    cur = path.join(cur, hit);
  }
  return real.join("/");
}

function main(argv) {
  const [cmd, ideaDir, ...rest] = argv.slice(2);
  if (!cmd || !ideaDir) {
    process.stderr.write("usage: artifact-manifest.js create|verify <idea-dir> ...\n");
    return 2;
  }
  try {
    if (cmd === "create") {
      const opts = {};
      const files = [];
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === "--purpose") opts.purpose = rest[++i];
        else if (rest[i] === "--id") opts.id = rest[++i];
        else if (rest[i] === "--for") opts.createdFor = rest[++i];
        else if (rest[i] === "--out") opts.out = rest[++i];
        else files.push(rest[i]);
      }
      if (!files.length) {
        process.stderr.write("create: no paths given\n");
        return 2;
      }
      const manifest = create(ideaDir, files, opts);
      const text = JSON.stringify(manifest, null, 2) + "\n";
      if (opts.out) {
        // gate-check writes manifests into private/, which does not exist yet in a
        // fresh idea — failing with ENOENT there would block a gate for a reason
        // that has nothing to do with the artifacts under review.
        const outAbs = path.join(ideaDir, normalizeRel(opts.out));
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.writeFileSync(outAbs, text);
      }
      process.stdout.write(text);
      return 0;
    }
    if (cmd === "verify") {
      const manifestPath = rest.find((a) => !a.startsWith("--"));
      if (!manifestPath) {
        process.stderr.write("verify: no manifest path\n");
        return 2;
      }
      const abs = path.isAbsolute(manifestPath) ? manifestPath : path.join(ideaDir, normalizeRel(manifestPath));
      const manifest = JSON.parse(fs.readFileSync(abs, "utf8"));
      const problems = verify(ideaDir, manifest);
      if (!problems.length) {
        process.stdout.write(`manifest verified: ${manifest.entries.length} file(s) unchanged\n`);
        return 0;
      }
      for (const p of problems) process.stdout.write(`MISMATCH ${p.code}: ${p.detail}\n`);
      return 1;
    }
    process.stderr.write(`unknown command "${cmd}"\n`);
    return 2;
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return 2;
  }
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { create, verify, manifestHash, serialize, normalizeRel, ALGORITHM };

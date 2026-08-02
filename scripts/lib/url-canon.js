#!/usr/bin/env node
/**
 * URL canonicalization (saas-idea-brainstorm plugin, v1.4.0).
 *
 * ONE implementation, shared by `validate-source-registry.js` and the research
 * agents' instructions (`agents/competitor-scanner.md`, `agents/community-review-miner.md`):
 * a second copy of "how do we decide two URLs are the same page" would drift the
 * moment either caller's notion of "same" diverged from the other's, which is
 * exactly how a source-registry check could pass while a research agent's own
 * dedup logic disagreed with it.
 *
 * Answers a founder-observed pain: research agents re-fetching a URL they had
 * already mined because it carried a different query string or a trailing slash
 * the first time. Two spellings of the same page must collapse to one registry
 * row, exactly as `root_source_id` collapses reposts in the evidence ledger
 * (method-rules-artifact-schema) — same idea, applied one layer earlier.
 *
 * This is NOT a general-purpose URL normalizer: it is deliberately narrow to what
 * "is this the same page I already fetched" needs, and it fails safe (returns the
 * original string) rather than throwing on a URL it cannot parse — a research
 * agent should never be blocked by a canonicalization bug.
 *
 * Usage:
 *   node scripts/lib/url-canon.js <url>   (prints the canonical form)
 *   const { canonicalize } = require("./lib/url-canon.js");
 */
"use strict";

// Known tracking/analytics query params, stripped because they change on every
// share/click without changing what page loads — keeping them would make one
// page look like dozens of "new" sources.
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "gclid", "fbclid", "msclkid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src",
  "ref_url", "source", "spm", "si", "_hsenc", "_hsmi",
]);

/**
 * Canonicalize a URL for source-identity comparison. Returns the ORIGINAL string
 * unchanged if it does not parse as a URL — a malformed value is a data-quality
 * finding for whoever consumes it, not a crash here.
 */
function canonicalize(raw) {
  if (typeof raw !== "string" || !raw.trim()) return raw;
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    return raw.trim(); // not a URL (e.g. a private/ file ref) — pass through unchanged
  }
  u.protocol = u.protocol.toLowerCase();
  u.hostname = u.hostname.toLowerCase();
  // A bare default port is not part of the page's identity.
  if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
    u.port = "";
  }
  // Strip tracking params, then re-sort what remains so param ORDER (which
  // carries no meaning) never makes two fetches of the same page look distinct.
  const kept = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.has(k.toLowerCase()));
  kept.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  u.search = "";
  for (const [k, v] of kept) u.searchParams.append(k, v);
  // Bare-root trailing slash needs no special-casing: WHATWG URL already
  // normalizes "https://example.com" and "https://example.com/" to the same
  // string for a special scheme (http/https always carries at least "/"). A
  // deeper path's trailing slash is left alone since some sites do distinguish
  // "/docs" from "/docs/".
  u.hash = ""; // fragments never change what the server returns
  return u.toString();
}

function main(argv) {
  const raw = argv[2];
  if (!raw) {
    process.stderr.write("usage: url-canon.js <url>\n");
    return 2;
  }
  process.stdout.write(canonicalize(raw) + "\n");
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { canonicalize };

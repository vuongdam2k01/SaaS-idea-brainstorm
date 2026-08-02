# Stage 1 — Competitive & Alternative Solutions

> **Manual-mode rendering.** The normative producer of these artifact shapes is the plugin skill
> `stage-1-*-templates` (skills win on any disagreement). Load-bearing table
> headers here are fixture-checked against the validators by `tests/pipeline-contract-tests.js`.


> Run immediately after 0.1, before interviews — research shapes interview questions.
> ⚠️ This stage's map is **DRAFT** — will be corrected by customer language in Stage 2. Don't position against phantom competitors.

## 1.1. Five-tier competitive map (scan by JTBD, not product category)

| Tier | What it is | Found | Did customers mention? (fill at Stage 2) |
|---|---|---|---|
| 1. Direct | same problem, same approach | | |
| 2. Indirect | same problem, different approach (agency, freelancer, outsource) | | |
| 3. DIY | Excel, Notion, Zapier, duct-tape workflow | | |
| 4. General tools | ChatGPT/Claude used directly | | |
| 5. Do nothing | status quo (~40% B2B deals lose to "no decision") | | |

> Search sources: **problem keywords** (not solution keywords), G2/Capterra/Product Hunt/AlternativeTo, niche communities ("how do you handle X", "alternative to Y"). When using AI to list competitors: verify each one thoroughly.

## 1.2. Key competitor profiles (one section per major competitor)

### `<Competitor name>`
- Positioning:
- Their ICP:
- Price & revenue model:
- Main distribution channel:
- Company age:
- Health signals (update frequency, hiring, funding):

## 1.3. Negative review repository (1–3 stars, preserve verbatim)

| Unmet need cluster | Verbatim quote | Source (link) | Frequency |
|---|---|---|---|
| | | | |

## 1.3b. Source registry (`source-registry.md`, idea root — v1.4.0)

Every URL fetched during research gets one row, keyed on its **canonical** form
(`scripts/lib/url-canon.js`), so the same page under two query strings is not mined twice:

| canonical_url | content_hash | first_seen_run | claims_extracted | rescan_count | last_rescan_justification |
|---|---|---|---|---|---|
| | | | | 0 | — |

Consult it before fetching anything — a URL already here with claims extracted is a candidate to
skip, not a mandatory re-fetch. A `rescan_count` above 0 needs a real justification
(`scripts/validate-source-registry.js`, advisory for now).

## 1.4. Market verdict

- **Is this market proven to have money?**
  - Crowded healthy competitors → money exists; question becomes "what's my wedge": …
  - Nobody builds → red flag (investigate: did anyone build and die? Why? Check Internet Archive, post-mortems on IndieHackers/HN): …
  - Competitors exist but weak → weakness from laziness or from hard-to-see constraints? (answer full post-interviews): …
- **Conclusion recorded:**

---

## ▶ Stage advancement gate

- [ ] Five-tier map complete
- [ ] Key competitor profiles filled
- [ ] Reviews clustered
- [ ] Market verdict recorded

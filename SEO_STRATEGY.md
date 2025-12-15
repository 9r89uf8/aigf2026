# SEO Plan: NoviaChat.com

## Goal
Increase the probability of ranking #1 (and at minimum top 3) for these exact queries:
- `novia virtual`
- `novia virtual gratis`
- `chicas ia`
- `chica virtual`

## Reality Check (hard truths)
- Ranking #1 for head terms is mostly an authority game: you need strong pages *and* a meaningful link profile; content alone rarely wins.
- Expect months, not days: even perfect technical SEO won’t instantly overcome low domain trust/age.
- Language matching matters: pages targeting these query terms typically need to match the query language and user expectations in the target geos; English-only pages make this significantly harder.
- If the product is in a sensitive category, trust signals and policy compliance become ranking constraints (not “nice to have”).

## Constraints (this document)
- No code changes in this iteration; this is a roadmap only.
- Do not modify `app/page.js` (keep it exactly as-is).
- Plan is written in English (the target queries must remain as written).

## Audience & Offer (what we optimize for)
- Primary audience: men.
- Priority geos: Mexico, Spain, Argentina, Colombia, USA.
- Offer: free to try, then premium (make “free” messaging explicit and not misleading).

## Baseline Snapshot (Day 0)
Collect this once before changes so you can prove what worked:
- Search Console: current query impressions/clicks for the 4 terms, top pages, index coverage, and “Duplicate / Alternate page with proper canonical” counts.
- Crawl: list of indexable URLs, current canonicals, titles/descriptions, status codes, and broken internal links.
- Performance: Core Web Vitals and a mobile Lighthouse run for `/`, `/novia-virtual`, `/girls`, `/plans`.
- Authority: current referring domains, top-linked pages, and anchor text distribution.

## KPIs (track weekly)
- Rankings and URL-per-query mapping for the 4 target queries (rank tracker + Google Search Console).
- Impressions, clicks, CTR per query/page (Google Search Console).
- Organic → signup conversion rate; signup → premium conversion rate (GA4 + backend).
- Crawl/index coverage, duplicates, canonicalization (Search Console).
- Referring domains and quality links acquired (monthly rollup + cumulative total).

## SERP Audit (before you ship new pages)
Do this per query and per priority geo (or using geo-localized SERP tools):
- Classify intent: definition/info vs “try now” vs comparison vs app/download.
- List the top 10: page type, content blocks, media, FAQs, UX patterns, and obvious trust signals.
- Identify SERP features you must win: People Also Ask, video, images, sitelinks, AI overviews, local packs (if any).
- Backlink reality check: approximate link gap between your likely target URL and the current top 3.
- “Angle to win”: what you can do better (speed, clarity on free→premium, stronger FAQs, better demo, better trust, better internal linking).

## Page Targeting (avoid cannibalization)
Pick one primary URL per query cluster and make everything else support it via internal links and clear canonicals.

Recommended starting mapping (validate with Search Console after 2–3 weeks):
- `novia virtual gratis` → `/` (homepage already targets this; keep as-is)
- `novia virtual` → `/novia-virtual`
- `chicas ia` → a text-rich SEO landing page (server-rendered) that links into `/girls`
- `chica virtual` → either the same SEO landing page as `chicas ia` or `/novia-virtual` (decide based on which URL Google prefers; do not create near-duplicates)

### Decision Rule (make it unambiguous)
- For each query, pick the primary URL after 21 days based on: (1) impressions, (2) clicks, (3) CTR, (4) average position trends, and (5) on-page conversion rate.
- Once a primary URL is selected, update internal links so the majority of contextual anchors point to that primary URL, and reduce overlap on competing pages (headings, titles, and FAQs).

## On-Page Content Requirements (for every “SEO landing” page)
To win competitive head terms, each target page must be “complete” (not just metadata):
- Clear intent match: define the concept in the first screen and show a direct “Start free” CTA.
- Depth without fluff: feature breakdown, how it works, what’s free vs premium, privacy/safety, and “who this is for”.
- Visual proof: optimized images and short demo video (and a transcript/captions).
- Strong FAQs that mirror real questions from Search Console + “People also ask”.
- Trust signals: transparent pricing, support/contact, policies, and product constraints.
- Internal links to the next action: browse (`/girls`), start (`/signin`), pricing (`/plans`).

## Content & Authority Plan (build topical depth)
Create a cluster of supporting pages that answer adjacent intents and feed internal links into the 3–4 target URLs:
- “How it works” (model behavior, memory, personalization, safety)
- “Free trial explained” (limits, what’s included, upgrade triggers)
- “Privacy & security” (data handling, account deletion, reporting)
- “Pricing and value” (what premium unlocks; who should upgrade)
- “Best practices” guides (conversation tips, personalization, roleplay boundaries)
- “Comparison” pages (only if they can be honest and non-spammy)

Rule of thumb: every new supporting page should link to exactly one primary target page with descriptive anchor text.

## Indexing Policy (prevent index bloat)
The fastest way to slow ranking is to let low-quality/duplicate pages get indexed.
- Explicitly decide what is indexable: marketing pages and SEO landing pages only.
- Default to `noindex` for: user-specific pages, chat/conversation pages, checkout/success pages, and admin pages.
- Dynamic catalog pages (e.g., individual “girl” pages) should be indexable only if they have unique, server-rendered content and stable canonical URLs; otherwise keep them out of the index and out of the sitemap.

## Technical SEO Checklist (high impact)
These are common “silent killers” for ranking, especially on new domains:
- Canonical domain consistency: choose `www` or non-`www` and enforce one via 301 redirects; make sitemap, Open Graph URLs, canonical tags, and `metadataBase` match the same host.
- Sitemap accuracy: include every indexable marketing page; exclude private/auth/user-specific URLs; keep `lastModified` stable (don’t update everything daily unless content changes).
- Robots/indexation: ensure `/chat`, `/account`, `/checkout`, and any user-specific pages are `noindex` (and ideally blocked from indexing) to avoid thin/duplicate indexing.
- Server-rendered SEO pages: pages meant to rank should not rely on client-only rendering for the main content.
- Structured data hygiene: use only schema types that match what the page actually is (Organization/WebSite/Service/FAQ/Breadcrumb); avoid self-serving ratings unless truly shown on-page and compliant.
- Core Web Vitals: optimize LCP (hero media), reduce JS payload, lazy-load non-critical media, minimize third-party scripts, and ensure mobile speed.

### Current repo notes (quick wins to prioritize)
- Host inconsistency exists today (mix of `https://www.noviachat.com` and `https://noviachat.com`) across `app/layout.js`, `app/robots.js`, `app/sitemap.js`, and `app/novia-virtual/page.js`; align everything to one canonical host.
- `/girls` is a client-rendered listing (`"use client"`); treat it as a conversion/browse page, and use server-rendered SEO landing pages to actually rank for head terms like `chicas ia`.

## Trust & Compliance (ranking constraint in practice)
Make this explicit on-page (and consistent across the site) so users and search engines trust what you’re offering:
- Pricing transparency: clearly explain “free to try” vs premium unlocks, and avoid vague promises.
- Safety and privacy: simple, readable policies and a “how data is handled” explainer.
- Clear product framing: if characters are AI-generated, say so; don’t imply real-person relationships.
- Support presence: contact method, refund policy (if applicable), and account deletion path.

## Off-Page (how we earn trust fast)
You don’t rank #1 for head terms with on-page alone; plan real authority-building:
- Directory listings and “AI tools” catalogs (high-quality, not spam farms).
- Editorial coverage: pitch a data-backed story (trend report, survey, anonymized usage insights).
- Partnerships/affiliates with creators who already talk about AI companions.
- Linkable assets on-site: a genuinely useful guide or interactive demo that people reference.

Avoid: paid link schemes, mass guest-post networks, and low-quality PBN links (they work short-term and collapse later).

### Link Targets (set expectations, then adjust)
Targets depend on the Day 0 baseline, but as a starting point for head terms:
- 90 days: 15–30 *quality* new referring domains (relevant niches, real traffic, editorial standards).
- 6 months: 40–80 quality referring domains total, including 5–10 editorial links from legitimate publications or high-trust industry sites.
- Link distribution: prioritize links to the primary ranking pages, with some to linkable assets; avoid unnatural exact-match anchor overuse.

## Tracking & Iteration (make ranking changes measurable)
- Search Console: verify the canonical host, submit sitemap, monitor index coverage, and export query→page data weekly to detect cannibalization early.
- Analytics: ensure you can segment organic traffic and measure the full funnel (landing page → signup → premium); annotate releases so ranking changes have context.
- Reporting cadence: weekly “SEO change log” (what changed, what moved, what to do next) and a monthly deep-dive on content gaps and link growth.

## Production Cadence (so this doesn’t stall)
Example cadence you can actually execute:
- Weekly: 1 primary improvement (a landing page or major upgrade) + 1 supporting article + 5 outreach touches + 5 internal link improvements.
- Monthly: 1 linkable asset (research, interactive demo, benchmark report) + a cleanup pass on index coverage and cannibalization.

## Execution Timeline (realistic)
- Week 0–1 (P0): fix canonical host consistency, Search Console setup, sitemap/robots correctness, and indexing hygiene (noindex private pages).
- Week 1–3 (P0/P1): finalize keyword→URL map and ship the missing SEO landing page(s) needed for `chicas ia` / `chica virtual`.
- Week 3–8 (P1): publish supporting content cluster + internal linking; start outreach and directory listings.
- Week 8–16 (P2): iterate based on GSC data, expand linkable assets, add region-tailored pages only if they are meaningfully different (not doorway pages).

## What to do first (next actions)
- Confirm the canonical host and make every SEO signal align with it.
- Decide the single “primary URL” for each target query (based on initial rankings), then strengthen it (content depth + internal links) and de-emphasize competitors.
- Build one server-rendered, text-rich landing page for `chicas ia` (and optionally `chica virtual`) that funnels traffic into `/girls` and `/signin`.

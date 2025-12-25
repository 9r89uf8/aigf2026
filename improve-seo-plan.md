Below is a **hubs-first plan** (no code) that you can hand to another LLM or a developer as a set of implementation instructions. I’m using what your screenshots show:

* Google: you’re strong on **brand** (“novia chat / noviachat” position ~1–2) but only mid-page for generic intent (“novia virtual chat” ~10.6; “chat novia virtual” ~8.5; “chat de novia” ~7.5; “novia virtual” ~47.9).
* Your traffic is concentrated in **Spain + Mexico**, with some smaller countries ranking better (Uruguay position ~8).
* Bing is giving you **better positions** (often top 3–6), including some **explicit adult** queries.

You said: **prefer hubs rank**, and **non-indexed pages are old URLs**.

---

## 1) Strategy choice: “Hubs rank” done properly

Because you prefer hubs, the goal is:

1. Keep **profiles** (`/girls/:id`) **noindex** (or private/app-only) to avoid thin/duplicate risk.
2. Make **a small set of powerful indexable hubs** that capture:

    * high-intent head terms (“novia virtual”, “chat novia virtual”)
    * mid-tail (“novia virtual gratis”, “novia IA en español”)
    * long-tail via **category hubs** (“chicas virtuales románticas”, “chica IA gamer”, etc.)

This approach scales indexed pages without needing thousands of profile URLs.

---

## 2) Fix the “only ~6 indexed pages” bottleneck first

Even if “non-indexed are old URLs”, your screenshot shows indexed pages **dropped** to ~6. Before you publish new hubs, make sure Google is indexing what you already want indexed.

### 2.1 Create a URL cleanup map

**Instruction:** Build a simple mapping list with 3 columns:

* Old URL(they all return Not found (404):
* https://www.noviachat.com/blog/novia-ia-personalidades-encuentra-match-perfecto
  https://www.noviachat.com/privacidad	
  https://www.noviachat.com/blog/personalizando-tu-novia-virtual-herramientas-para-crear-la-companera-ia-perfecta
  https://www.noviachat.com/contacto	
  https://www.noviachat.com/login	
  https://noviachat.com/blog/novia-ia-personalidades-encuentra-match-perfecto
* https://www.noviachat.com/user	
  https://www.noviachat.com/dm	
  https://www.noviachat.com/terminos	
  https://noviachat.com/blog/la-etica-de-las-novias-virtuales-un-debate-necesario-en-la-era-de-la-ia
  https://noviachat.com/CGj52Y66J4icn6qOqGJY
* Old URL(they all return Page with redirect. main url is https://www.noviachat.com):
* http://www.noviachat.com/	
  http://noviachat.com/	
  https://noviachat.com/	
  https://noviachat.com/novia-virtual	
  https://www.noviachat.com/account
* https://noviachat.com/blog/personalizando-tu-novia-virtual-herramientas-para-crear-la-companera-ia-perfecta	
  https://noviachat.com/5ffdfe39-aaae-4c9c-9a63-eb963285bdf1
  https://noviachat.com/3c3b446b-57b4-4bf7-a574-8d3630ef4fd2

* New URL (closest relevant hub, this urls are all indexed):
* https://www.noviachat.com/
  https://www.noviachat.com/novia-virtual
  https://www.noviachat.com/girls
  https://www.noviachat.com/signin
  https://www.noviachat.com/plans
* Action (301 redirect OR 410 gone)

Rules:

* If old URL had backlinks / traffic / relevance → **301 redirect** to the best matching new hub.
* If old URL is useless or truly obsolete → **410** (cleaner than infinite 404s).

**Acceptance check:**

* Old URLs should not appear in your sitemap.
* Old URLs should not be linked internally anywhere.

### 2.2 Canonical + “indexability audit”

**Instruction:** For every indexable page (home, /novia-virtual, /chicas-ia, /plans, /girls or /chicas-virtuales, etc.), verify:

* It returns HTTP 200.
* It has a **self-referencing canonical** (or a correct canonical to the preferred URL).
* It is not blocked by robots.txt.
* It does not include noindex.
* The main content exists in the HTML without requiring client-only rendering (especially important for hub/list pages).

**Acceptance check:**

* In GSC: “Page indexing” reasons should not include “Duplicate, Google chose different canonical” for your hubs.
* In GSC URL Inspection: “Crawled page” shows the hub content, not a skeleton.

---

## 3) Build the hub architecture (concrete URL inventory)

You already have strong pages for `/novia-virtual` and `/chicas-ia`. Build around them.

### 3.1 Create 6–9 “pillar hubs” (top-level money pages)

These should be fully indexable, long-form, and conversion-oriented.

**Recommended pillars (Spanish slugs):**

1. `/novia-virtual` (keep, improve for “novia virtual” head term)
2. `/chat-novia-virtual` (targets “novia virtual chat”, “chat novia virtual”, “chat de novia”)
3. `/chicas-virtuales` (your main directory hub; could replace `/girls` publicly)
4. `/novia-virtual-gratis` (targets “novia virtual gratis / chat novia virtual gratis”)
5. `/novia-ia` (captures “novia IA” variants; keep distinct from /novia-virtual)
6. `/como-funciona` (education + trust; supports rankings)
7. `/planes` (pricing intent; should rank and convert)
8. `/privacidad-seguridad` (trust + SERP confidence)
9. Optional: `/preguntas-frecuentes` (FAQ hub, but only if it’s substantial)

**Why these match your data:**

* You’re already near page 1 for “novia virtual chat” and “chat novia virtual” → a dedicated hub can push you into top 3.
* You’re far for “novia virtual” (pos ~47.9) → you need a stronger pillar + supporting content cluster.

### 3.2 Create 12–20 “category hubs” under the directory

These are the scalable engine for long-tail traffic.

Format:
`/chicas-virtuales/<categoria>`
Examples:

* `/chicas-virtuales/romanticas`
* `/chicas-virtuales/coquetas`
* `/chicas-virtuales/amigables`
* `/chicas-virtuales/gamer`
* `/chicas-virtuales/anime`
* `/chicas-virtuales/maduras` (only if brand-safe and accurate)
* `/chicas-virtuales/timidas`
* `/chicas-virtuales/divertidas`
* `/chicas-virtuales/para-conversar`
* `/chicas-virtuales/para-ligar` (watch tone; keep non-explicit)

**Rules to avoid doorway pages:**

* Don’t auto-generate hundreds. Start with 12–20.
* Each category hub must have:

    * a unique intro (not templated)
    * curated selections (not random)
    * unique FAQs/prompts

---

## 4) Hub page template (what every hub must include)

This is where most “SEO hubs” fail: they’re thin lists. Your hubs need to be **helpful pages** that happen to convert.

### 4.1 Mandatory on-page structure (for every pillar + category hub)

**Instruction:** Each hub page should include:

1. **Clear H1** that matches the query

    * Example: “Chat novia virtual con IA (en español)”
2. **Intro paragraph** (2–4 sentences) that states:

    * what it is
    * who it’s for
    * why NoviaChat is different
3. **Scannable feature section** (bullets)

    * language support (Spanish)
    * personalization
    * privacy stance (high-level)
    * free vs paid (if relevant)
4. **Curated listing section** (for directory/category hubs)

    * show 8–24 items max per hub
    * each item has 1–2 lines of unique descriptive text (not just a name)
5. **FAQ section** (5–10 Qs)

    * Use your actual GSC phrasing:

        * “¿Qué es un chat de novia virtual?”
        * “¿Es gratis?”
        * “¿Cómo funciona?”
6. **Internal links** to related hubs

    * Each hub links to 3–8 other hubs (tight topical cluster)
7. **Strong CTA** above the fold + after FAQ

    * “Empezar chat” / “Probar gratis” (depending on your funnel)

**Acceptance check (simple):**

* If you remove your UI/listings, the page still reads like a useful article.

### 4.2 Rendered content requirement

**Instruction:** Hub pages must be **crawlable as HTML** (not empty/skeleton until JS runs).
This is non-negotiable if you want them to rank.

**Acceptance check:**

* “View source” shows the intro text + some listing content.

---

## 5) Internal linking system (the ranking multiplier)

Right now you have good brand demand. Internal linking is what transfers that strength into generic queries.

### 5.1 Global navigation

**Instruction:** Add top-nav links to:

* Chicas virtuales (directory hub)
* Chat novia virtual
* Novia virtual
* Precios/Planes
* Cómo funciona

This ensures crawl discovery + authority flow.

### 5.2 Cluster linking rules

**Instruction:** Implement this linking pattern:

* Home → links to all pillar hubs
* Each pillar hub → links to:

    * directory hub
    * 3–6 category hubs
    * 2–4 guides (see section 6)
* Directory hub → links to:

    * all category hubs
    * top pillar hubs
* Each category hub → links to:

    * directory hub
    * 1 pillar hub that best matches intent (e.g. /chat-novia-virtual)
    * 2 related categories (“Románticas” ↔ “Coquetas” etc.)

**Acceptance check:**

* Every hub should be reachable within **2–3 clicks** from Home.

---

## 6) Content expansion that supports hubs (without becoming a “blog farm”)

Even with hubs, you still need supporting pages to compete for “novia virtual” head terms and to earn mentions/citations.

### 6.1 Create a “Guías” section (10 initial guides)

URL pattern: `/guias/<tema>`
These guide pages should be designed to rank and to be cited by LLMs (see section 8).

**10 guide topics tailored to your current queries:**

1. Qué es una novia virtual y cómo funciona
2. Chat novia virtual: consejos para conversar mejor
3. Novia virtual gratis: qué incluye y qué no
4. Chicas virtuales vs chatbots: diferencias reales
5. Novia IA en español: cómo elegir la mejor
6. Seguridad y privacidad en chats con IA
7. Ideas de conversación: preguntas para romper el hielo
8. Cómo personalizar tu novia virtual (si your product supports it)
9. Guía de etiquetas/personalidades (romántica, divertida, etc.)
10. “NoviaChat: cómo funciona y qué ofrece” (brand explainer, but educational)

**Important note about the Bing keywords you showed:**
Some Bing queries are explicitly sexual. Decide your brand policy:

* If you **don’t** want that traffic: avoid creating explicit pages; keep language “romántico/coqueto” and add clear content rules.
* If you **do** allow adult content: you still need to handle age/consent/legal compliance carefully and avoid creating content that looks like pure porn SEO bait. (I’m not recommending explicit keyword-targeting pages here.)

### 6.2 Link guides to hubs (and not the other way around only)

**Instruction:** Each guide should link to 1 primary pillar hub + 1 category hub + 1 directory hub.

---

## 7) Bing advantage: keep it and use it strategically

You said Bing rankings are better. That matters because LLM search experiences often pull from web sources, and Bing visibility can be disproportionately valuable in some ecosystems.

**Instruction checklist:**

* Keep Bing sitemap submissions updated.
* Make sure new hubs are discoverable fast (sitemap + internal links).
* Use Bing Webmaster tools to monitor which hub pages get impressions.

**Optional insight:** Independent analysis has found high overlap between SearchGPT/ChatGPT-style citations and Bing top results in some contexts, so improving Bing visibility can increase the chance you’re surfaced in AI answers. ([Seer Interactive][1])
(That’s not an OpenAI guarantee—just observed correlation.)

---

## 8) Make LLMs (ChatGPT and others) more likely to recommend you

There are two main paths for LLM recommendations:

### Path A: “LLM uses web search → cites sources”

ChatGPT has a web search mode that returns answers **with links to sources**. ([OpenAI][2])
To show up here, you need to be crawlable and indexable by the systems feeding that experience.

#### 8.1 Allow OpenAI’s search crawler

OpenAI documents that **OAI-SearchBot** is the crawler used “to surface websites in search results in ChatGPT’s search features.” ([OpenAI Platform][3])
OpenAI’s publisher FAQ explicitly says: don’t block OAI-SearchBot if you want your content included in summaries/snippets. ([OpenAI Help Center][4])

**Instruction:**

* Ensure robots.txt does not disallow **OAI-SearchBot** on your public hub pages.
* If you use a firewall/WAF, allow OpenAI’s published IP ranges for OAI-SearchBot (they publish ranges). ([OpenAI Platform][3])

**Privacy note:** You can allow OAI-SearchBot for search visibility while disallowing GPTBot if you don’t want training usage; OpenAI documents these are independent controls. ([OpenAI Platform][3])

#### 8.2 Make hub pages “citation-friendly”

LLMs cite pages that are:

* clear,
* structured,
* and directly answer the question.

**Instruction:** On each pillar hub and guide, add a top section like:

* “Resumen en 5 puntos”
* “Qué ofrece NoviaChat”
* “Para quién es”
* “Precio / Gratis” (if relevant)

Use:

* short paragraphs
* bullet lists
* Q&A blocks (FAQ)
* definitions (“Una novia virtual es…”)

This makes it easier for LLMs to extract and cite.

#### 8.3 Add tracking for ChatGPT referrals

OpenAI notes ChatGPT includes `utm_source=chatgpt.com` in referral URLs so you can track inbound traffic. ([OpenAI Help Center][4])

**Instruction:**

* In analytics, create a segment/filter for `utm_source=chatgpt.com`.
* Watch which pages get cited and double down on those formats.

---

### Path B: “LLM recommends from memory / training / general knowledge”

This is less controllable, but you can increase odds by making your brand and description consistent across the web.

#### 8.4 Build an “entity footprint” (brand consistency)

**Instruction:**

* Standardize everywhere:

    * Name: NoviaChat
    * One-liner: “Chat de novia virtual con IA en español”
    * Category: “AI companion / chatbot”
* Add a strong About page:

    * who you are
    * what the product does
    * safety/privacy stance
    * contact email
* Add “Press/Media kit” page:

    * short description
    * logo
    * screenshots
    * feature bullets

LLMs often pull from repeated, consistent descriptions across sites.

#### 8.5 Get listed where LLMs and users look

LLMs frequently cite **directories, comparisons, and third-party explainers** (because they summarize categories). Your goal is to be present on those pages.

**Instruction:**

* Create a list of 20–50 relevant placements:

    * AI tool directories
    * Spanish tech blogs
    * “best AI companion” lists
    * product review sites
    * communities where people ask for alternatives
* Pitch your product with the same consistent description + link to your best pillar hub (not just homepage).

(Examples of directories exist, but choose ones that match your brand and content policy.)

#### 8.6 Publish one “comparison” hub (carefully)

If you do this well, it can rank and also get cited:

* `/alternativas-a-replika-en-espanol` (example)

**Rules:**

* Be fair, factual, and helpful.
* Include “how to choose” criteria (privacy, language, pricing, features).
* Don’t trash competitors.
* Don’t make it thin or purely promotional.

---

## 9) Bonus: prepare for ChatGPT Agent / “web automation” compatibility

OpenAI’s publisher/developer FAQ says that making your website more accessible helps ChatGPT Agent understand it, and mentions using ARIA best practices for labeling interactive elements. ([OpenAI Help Center][4])

Even if your immediate goal is “recommendations,” better accessibility tends to improve:

* crawlability
* usability
* and compatibility with AI agents that browse sites

**Instruction:**

* Ensure buttons/menus/forms have clear labels and roles.
* Avoid critical actions hidden behind unlabeled icons.

---

## 10) Optional but smart: add `/llms.txt` for LLM-friendly discovery

There’s a growing proposal for a `/llms.txt` file to provide a curated, LLM-friendly index of important pages (especially useful for inference-time browsing). ([llms-txt][5])

**Instruction:**

* Add `/llms.txt` that:

    * explains what NoviaChat is
    * lists your key hubs + guides
    * points to the “best pages to cite”
* Keep it curated (don’t list everything).

This won’t guarantee recommendations, but it’s a low-effort way to make your content easier to ingest by LLM tooling. ([llms-txt][5])

---

## 11) “Give this to an LLM” task list (copy/paste)

Here’s a structured instruction bundle you can hand to another LLM:

1. **Create a URL inventory** of current pages + proposed hubs (pillars + 12–20 categories + 10 guides).
2. For each proposed page, output:

    * target keyword(s)
    * title tag
    * meta description
    * H1
    * section outline (H2/H3)
    * FAQ questions (5–10)
    * internal links in/out list
3. **Rewrite /chicas-virtuales directory hub** (or /girls) to be a true SEO hub:

    * intro text
    * curated categories section
    * FAQ block
4. Draft content for these priority pillars first:

    * /chat-novia-virtual
    * /novia-virtual-gratis
    * /chicas-virtuales
5. Draft the first 10 guides and ensure each links to:

    * one pillar
    * one category
    * the directory hub
6. Create a “redirect map” from old URLs to new hubs (301 or 410 rules).
7. Create an “LLM visibility checklist”:

    * OAI-SearchBot allowed on public hubs
    * strong About/Privacy/Contact pages
    * scannable summaries + FAQs
    * /llms.txt content index

---
important. you can edit any file except the here section on /app/pages.js


[1]: https://www.seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results?utm_source=chatgpt.com "87% of SearchGPT Citations Match Bing's Top Results"
[2]: https://openai.com/index/introducing-chatgpt-search/ "Introducing ChatGPT search | OpenAI"
[3]: https://platform.openai.com/docs/bots "Overview of OpenAI Crawlers"
[4]: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq "Publishers and Developers - FAQ | OpenAI Help Center"
[5]: https://llmstxt.org/ "The /llms.txt file – llms-txt"

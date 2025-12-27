# SEO implementation notes

## Overview
Implemented the SEO plan by expanding the guides dataset to include two pillar pages and a full cluster set, then extended the guide renderer to support comparison-style layouts (tables, cards, disclosure, CTA links). Also corrected the plan file to match real slugs and CTAs.

## What changed
- Added pillar and cluster guide entries (31 total, including the existing `como-funciona-noviachat`) in `app/lib/seo-content.js`.
- Extended the guide page renderer in `app/guias/[slug]/page.js` to support:
  - `summaryTitle` (custom summary heading)
  - `disclosure` (transparency note)
  - `section.table` (comparison tables)
  - `section.cards` (winners/tool cards)
  - `ctaLinks` (contextual resource chips)
  - self-link avoidance when a guide is its own pillar
- Updated `seo-plan.md` so the URLs and CTAs match real routes and current guide slugs.

## New guide data structure (high level)
Each guide now can include optional fields beyond the existing ones:
- `summaryTitle`: custom heading for the summary section
- `disclosure`: transparency callout near the hero
- `sections[].table`: `{ columns: [], rows: [] }`
- `sections[].cards`: `{ title, tag?, body?, bullets? }[]`
- `ctaLinks`: `{ href, label }[]` shown as chips in the footer section

## Pillar pages added
- `/guias/mejores-chats-ia-en-espanol`
- `/guias/mejores-chats-compania-ia-en-espanol`

These include methodology, winners by intent, comparison tables, tool cards, and update logs.

## Cluster/support guides added (high level)
The remaining guides cover the planned topics (alternativas, gratis, memoria, privacidad, seguridad, estudio, trabajo, practicar, prompts, categorias, riesgos, precios, etc.).

## Notes
- All new text is ASCII-only and follows existing style in the repo.
- The guides are still served via the existing dynamic route `/guias/[slug]` and auto-included in the sitemap.

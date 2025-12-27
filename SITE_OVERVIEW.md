# NoviaChat Website Overview

## What the site is about
NoviaChat is a Spanish-first AI girlfriend and companion chat platform focused on Mexico, Espana, and Argentina. It offers:
- AI girls with distinct personalities and category hubs.
- Personalized conversations with memory and context.
- Optional premium multimedia (photos, videos, audio).
- Mobile-first, fast UX for chat and media.
- Privacy, safety controls, and adult-only guidance with SFW options.

## URL map
Base domain (canonical): https://www.noviachat.com

### Public marketing and SEO pages
- /
- /novia-virtual
- /chat-novia-virtual
- /novia-virtual-gratis
- /novia-ia
- /chicas-ia
- /chicas-virtuales
- /como-funciona
- /noviachat-en-1-minuto
- /planes
- /plans
- /privacidad-seguridad
- /centro-de-seguridad
- /preguntas-frecuentes
- /sobre-noviachat
- /prensa
- /support
- /terminos
- /privacy
- /girls

### Category hubs (dynamic)
- /chicas-virtuales/:categoria
- Current slugs: romanticas, coquetas, amigables, gamer, anime, timidas, divertidas, para-conversar, para-ligar, maduras, creativas, aventureras

### Guides (dynamic)
- /guias/:slug
- Current slugs: que-es-una-novia-virtual, chat-novia-virtual-consejos, novia-virtual-gratis-que-incluye, chicas-virtuales-vs-chatbots, novia-ia-en-espanol-como-elegir, seguridad-privacidad-chats-ia, ideas-de-conversacion, personalizar-novia-virtual, etiquetas-personalidades-novia-virtual, como-funciona-noviachat

### Product and account experience (noindex)
- /girls/:id
- /chat
- /chat/:conversationId
- /stories/:girlId
- /account
- /signin
- /reset-password
- /checkout/success


## Tech stack
- Next.js 16 (App Router) and React 19
- JavaScript (no TypeScript)
- Tailwind CSS 4
- Convex backend and Convex Auth (@convex-dev/auth)
- Auth.js core (@auth/core) with Resend for email OTP
- Stripe for payments and checkout
- AWS S3 + CloudFront for media uploads and delivery (signed URLs)
- AWS Rekognition + ffmpeg-static for media analysis
- ElevenLabs for audio generation
- Cloudflare Turnstile for bot protection
- Google Analytics 4

## SEO
- Global metadata defaults in `app/layout.js` with `metadataBase`, OpenGraph, Twitter, and language alternates (es-MX, es-ES, es-AR).
- Page-level metadata includes canonical URLs, keywords, and robots directives.
- Structured data (JSON-LD) on the homepage: Organization, WebSite, WebPage, Product, FAQPage, and BreadcrumbList.
- `app/sitemap.js` builds a sitemap that includes core pages plus category and guide pages.
- `app/robots.js` allows crawlers (including AI bots) while disallowing `/api/` and `/admin/`, and publishes sitemap and host.
- `public/llms.txt` lists best pages, guides, categories, and contact info for LLM discovery.
- `next.config.mjs` sets `X-Robots-Tag: noindex` on sensitive routes (admin, account, chat, checkout, stories, auth, and `/girls/:id`).
- `middleware.js` enforces canonical `www` domain, adds 301 redirects for legacy paths, and returns 410 for retired URLs.

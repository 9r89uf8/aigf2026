Cool — here’s a clean **route‑group layout map** you can implement in Next.js App Router so:

* `/` becomes a **true “first‑visit marketing page”** (almost no JS / no Convex / no auth-aware navbar)
* authenticated users naturally live in **`/chat` (or `/app`)**
* middleware only runs where it must
* redirects move out of middleware

No code below — just an implementation plan + folder map + what goes where.

---

## Target outcome: 3 shells + optional 4th

### Shell 0: Root shell (global, minimal)

**Applies to every route.** Keep it extremely small.

* `html/body`, global classes
* global `metadataBase`, viewport
* **analytics** (GA) if you truly want it everywhere
* **NO** Convex providers
* **NO** Navbar/BottomNav/SiteFooter
* **NO** Turnstile script

> The root layout is where you stop paying “app shell tax” on `/`.

---

### Shell 1: Marketing shell (first-time visitors)

For **static SEO pages** including `/`.

* Minimal header (logo + CTA)
* Footer (static)
* No Providers, no auth queries, no Turnstile
* Keep it server-rendered and cacheable

---

### Shell 2: Public interactive shell (public routes that still use Convex client)

For pages like `/girls` that are public but likely still use Convex React queries today.

* Includes Convex providers (server + client)
* Uses a **lightweight public navbar** (no “getMe” query, no dropdown listeners)
* Footer optional

> This keeps `/` fast without forcing you to rewrite `/girls` to server fetching immediately.

---

### Shell 3: App shell (authenticated experience)

For `/chat`, `/account`, etc.

* Convex providers
* Full authenticated Navbar + BottomNav
* Turnstile script **only if** chat sending actually needs it on these routes

---

## Recommended route-to-shell mapping

### Marketing shell

Put these in the marketing group:

* `/` (your landing page)
* your SEO pages:

    * `/novia-virtual`
    * `/chicas-virtuales`
    * `/chat-novia-virtual`
    * `/como-funciona`
    * `/guias/*` (and any other purely static SEO content)
* `/privacy`, `/support` (assuming static)

**Rule of thumb:** if the page doesn’t need Convex data on first paint, it belongs here.

---

### Public interactive shell

Put these here **for now** (Phase 1), because they are public but may depend on Convex React hooks/components:

* `/girls`
* `/girls/[id]`
* `/stories/[girlId]` (if it fetches profile/story via Convex client)
* `/plans` (if `PlansClient.js` uses Convex client)

**Later (Phase 2):** you can migrate some of these to true server-rendered pages and move them into marketing shell if you remove the need for client providers.

---

### Auth shell

* `/signin`
* `/reset-password`

This shell should load **Turnstile** and include Convex providers, but keep UI minimal (no heavy Navbar).

---

### App shell

* `/chat`
* `/chat/[conversationId]`
* `/account`
* `/checkout/success` (often best treated as authed)
* `/admin/*` (and keep its own admin layout nested under app shell)

---

## Folder structure map (App Router)

This is the mental model / file move plan.

Keep these at the root of `app/` (not inside groups):

* `app/layout.js` (Root shell = minimal)
* `app/globals.css`
* `app/providers.js` (client provider component; used only by shells that need it)
* `app/robots.js`, `app/sitemap.js`
* `app/api/*` routes

Then create route groups:

```
app/
  layout.js                  (ROOT: minimal global)
  providers.js               (client provider, referenced by shells)
  globals.css
  robots.js
  sitemap.js
  api/
    geo/route.js

  (marketing)/
    layout.js                (Marketing shell)
    page.js                  ("/" landing — move your current app/page.js here)
    novia-virtual/page.js
    chicas-virtuales/page.js
    chat-novia-virtual/page.js
    como-funciona/page.js
    guias/...                (etc)
    privacy/page.js
    support/page.js

  (public)/
    layout.js                (Public interactive shell: providers + light header)
    girls/
      page.js
      [id]/page.js
      layout.js              (if needed)
    stories/
      [girlId]/page.js
    plans/
      page.js
      layout.js              (optional)

  (auth)/
    layout.js                (Auth shell: providers + Turnstile, no heavy nav)
    signin/page.js
    reset-password/page.js

  (app)/
    layout.js                (App shell: providers + full nav + bottom nav)
    chat/
      page.js
      [conversationId]/page.js
    account/page.js
    checkout/
      success/page.js
    admin/
      layout.js              (your existing admin layout moved under app shell)
      girls/...
      conversations/...
```

**Important:** route groups like `(marketing)` do **not** change URLs — `/` stays `/`.

---

## How to satisfy “logged users see a different landing” without harming `/` performance

You have two viable approaches; pick based on your priority.

### Option A (performance-first, recommended)

* `/` stays marketing for everyone (static/cached).
* Authenticated users are *routed to app* via:

    * redirecting authed users away from `/signin` → `/chat`
    * after login, always navigate to `/chat`
    * internal “Home” / logo links in the **app shell** go to `/chat`, not `/`

This gives logged users a different “home” without making `/` personalized.

### Option B (UX-first)

* Redirect authenticated users hitting `/` → `/chat`
* This requires auth-aware logic on `/` at the edge (middleware), which can reduce caching effectiveness for `/`.

If your main traffic is anonymous SEO visitors, Option A usually wins.

---

## Middleware plan after the restructure

Right now middleware runs basically everywhere and does 4 jobs. Split those jobs:

### Move out of middleware (into `next.config.mjs`)

1. **Host canonicalization** `noviachat.com` → `www.noviachat.com`
2. **redirectMap** (301 redirects like `/dm` → `/chat`, etc.)

This removes edge work for marketing pages.

### Keep in middleware (but narrow matcher)

Only keep **auth gating + auth-page redirects**:

* if authed and visiting `/signin` or `/reset-password` → redirect to `/chat`
* if unauth and visiting `/chat/*`, `/account/*`, `/admin/*` → redirect to `/signin`

**Matcher should only include:**

* `/signin`
* `/reset-password`
* `/chat/:path*`
* `/account/:path*`
* `/admin/:path*`
* optionally `/checkout/:path*`

### Handle the 410 paths without global middleware

Those three “gone” paths should be handled by:

* explicit route handlers/pages that return 410, or
* a tiny targeted middleware that matches only those exact paths

Either way: don’t run middleware site-wide just to serve 3 paths.

---

## Landing page adjustments inside the marketing shell

Once `/` is in `(marketing)`:

### 1) Replace “functional navbar” with a marketing header

* Logo (link to `/`)
* CTA: “Comenzar gratis” → `/signin`
* Optional: “Ver chicas” → `/girls`
* No auth state, no dropdown, no event listeners, no `useQuery(getMe)`

### 2) Story viewer strategy (ties to your suggestion #3)

On `/`, treat the story modal as **non-critical**:

* best performance: clicking the avatar goes to `/stories/[girlId]`
* or: keep the modal but ensure it doesn’t ship until click (dynamic import plan)

Either way: don’t pay for story viewer JS on first paint.

### 3) Keep hero image as the LCP priority

* only one priority image on `/`
* ensure mobile payload is small enough (this is often the easiest LCP win after removing providers/nav)

---

## Public pages and the “Providers” decision

Because `/girls` and `/plans` likely use Convex React hooks today, you’ll probably keep them in `(public)` initially.

**Phase 2 (optional, bigger win later):**
Convert public pages to server-driven fetching (so they don’t need `Providers`), then move them into `(marketing)` and make them more cacheable + less JS.

This is optional — you can get a big win just by making `/` truly marketing-only.

---

## Quick checklist so you don’t accidentally re-add the “app tax” to marketing

Marketing shell should NOT include:

* `Providers`
* `ConvexAuthNextjsServerProvider`
* `Navbar` (your current one)
* `BottomNav`
* Turnstile script

Marketing pages should avoid:

* importing client components at the top level (like Story modal components)
* reading cookies/headers (anything that makes the route dynamic)

---

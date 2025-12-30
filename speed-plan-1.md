Your field data is already *passing* Core Web Vitals on mobile, but it’s right on the edge for **LCP (2.4s)** and **FCP (2.1s)**, with a relatively high **TTFB (0.8s)**. The fastest way to materially improve both Lighthouse score and real-user speed is to stop shipping the “app shell” (Convex provider + authenticated navbar logic + bottom nav + Turnstile) to first‑time visitors on `/`.

Below is a no-code, implementation-ready plan (prioritized). I’ll align it to your current Next.js App Router structure and the suggestions you listed.

---

## 1) Split the site into two shells: Marketing vs App (biggest win)

### Goal

Make `/` (and optionally other SEO pages) render as **almost-zero JS**, **fully cacheable**, and **free of auth/client providers**.

### What’s happening now

`app/layout.js` wraps *everything* with:

* `ConvexAuthNextjsServerProvider`
* `Providers` (client)
* `Navbar` (client + Convex query)
* `BottomNav` (likely client)
* Turnstile script (loads on every route)
  So even the landing page is paying “app costs” (JS bundle + hydration + Convex client + an auth check query).

### Plan

Create **two different layouts** using route groups:

1. **Marketing layout** (for first-time visitors)

* No `Providers`
* No `Navbar` that depends on Convex/auth
* No `BottomNav`
* No Turnstile script
* Keep only what marketing needs:

    * Minimal header (logo + “Comenzar Gratis” CTA)
    * Minimal footer (static)

2. **App layout** (for logged-in usage)

* Contains `Providers`
* Contains the real `Navbar`, `BottomNav`, etc.
* Can include any auth-aware UI and queries

### Practical routing outcome

* `/` stays your SEO landing page, but becomes lightweight.
* Logged-in users primarily live in `/chat` (or `/app`) and get the full app layout.

**Expected impact**

* **Lower TTFB** (because you can make marketing pages static/cached again)
* **Lower LCP/FCP** (less JS + less hydration + fewer network calls at startup)
* Better Lighthouse “Reduce JS execution time” and “Minimize main-thread work”

---

## 2) Give authenticated users a separate “home” and redirect them there (your suggestion #2)

You don’t need `/` to be auth-aware to satisfy “logged users should see a different landing.”

### Plan

* Treat `/chat` (or a new `/app`) as the authenticated “home.”
* Update your auth flow so authenticated users don’t land back on `/`.

Specifically:

* When an authenticated user hits `/signin` (or `/reset-password`), redirect to `/chat` (or `/app`) instead of `/`.
* After successful sign-in on the client, navigate to `/chat` as the default destination.

**Why this matters for performance**
It lets `/` remain a clean marketing page that doesn’t need auth logic. You avoid adding auth checks to the landing page request path.

---

## 3) Remove “functional navbar” from the marketing landing (as you want)

### Goal

On `/`, the header should be **static** and **non-auth-aware**.

### Plan options (pick one)

**Option A (fastest + best for performance):**

* Marketing header is just:

    * Logo
    * CTA: “Comenzar Gratis” → `/signin`
    * Secondary link: “Ver chicas” → `/girls`
* No dropdown, no hamburger menu, no `useQuery`, no event listeners.

**Option B (still fast):**

* Keep a few links, but render them as plain links (no client state).
* Don’t show “Mi cuenta” vs “Salir” on the landing. It’s okay if logged-in users see “Mi cuenta” link that goes to `/chat` or `/account` without checking state.

**Expected impact**

* Less JS and less INP risk (your navbar currently adds keyboard handlers, click-outside listeners, and Convex query).

---

## 4) Lazy-load the story viewer / modal (your suggestion #3)

Right now, `StoryAvatarButton` is likely a client component that pulls in story-viewer UI and state. Even if it’s not huge, it’s **unnecessary for first paint**.

### Plan

* On `/`, treat the “story ring” as a **non-critical enhancement**.
* Make the initial hero render:

    * Avatar ring UI (static)
    * Clicking it triggers loading the story viewer chunk
* Additionally, ensure story assets don’t get fetched until interaction.

If you want the simplest approach performance-wise:

* Replace the modal behavior on the landing with a link to the full page viewer (`/stories/[girlId]`), and keep the modal only inside the app experience.

**Expected impact**

* Smaller initial JS chunk
* Faster hydration (or no hydration if you remove client components on marketing)
* Better Lighthouse “unused JS” and “reduce JS execution”

---

## 5) Stop running middleware on the public landing and SEO pages (your suggestion #4)

### What’s happening now

Your middleware matcher is effectively “run on almost everything”:

* `matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]`

And the middleware does multiple jobs:

* Host canonicalization `noviachat.com` → `www`
* redirectMap
* 410 gone paths
* auth gating
* redirect authed away from auth pages

Even if the middleware is fast, it adds edge work on every request and can reduce caching effectiveness.

### Plan

1. Move the **host redirect** and **redirectMap** into `next.config.mjs` `redirects()`

* Host-based rule where possible
* Path redirects in config

2. Narrow middleware matcher to **only routes that truly need auth decisions**
   Examples:

* `/signin`, `/reset-password`
* `/chat/*`
* `/account/*`
* `/admin/*`
* any other protected routes

3. Handle the three **410**s without global middleware:

* Add explicit route handlers for those paths, or
* A tiny middleware that matches only those exact paths

**Expected impact**

* Lower **TTFB**
* Better caching/CDN behavior for marketing pages
* Less variance in real-user performance under load

---

## 6) Make `/` fully static and cache-friendly

Once you remove auth providers/middleware from `/`, ensure the route is not accidentally becoming dynamic.

### Plan checklist

* The marketing layout and `/` page should not read cookies/headers or do auth checks.
* Don’t fetch Convex or any runtime data on `/`.
* Keep it as pure static content + optimized images.

**Why**
Static HTML served from CDN is how you get TTFB down and stabilize LCP.

---

## 7) Improve the LCP element (likely the hero image)

Your LCP is already close to the threshold. If the LCP element is the hero image, you can often shave meaningful time by reducing bytes.

### Plan

* Audit the **actual transferred size** of the hero image on mobile (not the source file size).
* Target a small mobile payload (rough guideline: keep LCP image well under a couple hundred KB).
* Ensure the image is resized to what mobile needs (don’t ship 1200px wide if the rendered size is much smaller on typical screens).
* Keep only one `priority` image on the page (the LCP one).

**Expected impact**

* Direct LCP improvement, especially on 4G.

---

## 8) Reduce work below the fold without removing content

Your landing page has a lot of sections (which is fine for SEO/conversion), but you can reduce initial rendering cost.

### Plan

* Apply “render below-the-fold later” techniques:

    * Use CSS strategies like `content-visibility` on large sections below the hero.
    * Keep above-the-fold DOM lean (hero + 1 supporting block)
* Keep SVG icons inline (they’re fine), but avoid excessive shadow/blur effects repeated many times if you see paint bottlenecks in profiling.

**Expected impact**

* Better FCP / Speed Index and smoother scrolling on low-end devices.

---

## 9) Only load Turnstile where it’s needed

Right now Turnstile loads in the root layout for everyone.

### Plan

* Load Turnstile script only on:

    * `/signin` and `/reset-password`
    * Any app route where Invisible Turnstile is required (if chat sending needs it)
* Marketing pages should not pay this cost.

**Expected impact**

* Less third-party JS on first visit
* Better Lighthouse score and reduced main-thread work

---

## 10) Validation: how to confirm you’re improving the right thing

### What to measure after each phase

* Lighthouse (mobile throttling):

    * Total JS bytes
    * Main-thread blocking time
    * LCP element and its request chain
* WebPageTest / Chrome DevTools:

    * TTFB for `/`
    * Whether `/` is served as static/cached
* Real-user monitoring:

    * Track LCP/INP/CLS split by route: `/` vs `/chat`

### Success criteria (practical)

* `/` shows a much smaller JS payload and fewer requests
* TTFB drops noticeably on `/`
* LCP becomes safely under the “good” threshold across more users/devices

---

## Recommended implementation order (fastest ROI first)

1. **Split marketing vs app layouts** (remove Providers/Navbar/BottomNav/Turnstile from `/`)
2. **Update authenticated redirect behavior** (`/signin` → `/chat` for authed; post-login → `/chat`)
3. **Move redirects out of middleware** and narrow matcher to protected/auth routes
4. **Lazy-load / remove StoryAvatarButton modal** on `/`
5. **Hero image byte audit + resize/compress**
6. **Below-the-fold render optimizations**


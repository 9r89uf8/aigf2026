Great—let’s keep this **ultra‑lean** and make the **AI profile page** a **two‑call screen** (one query + one signer call), with **no unnecessary DB work**.

Below is exactly what to add/adjust and how each page renders with **Tailwind**—no code dump, just the minimal blueprint and the shapes your existing code expects.

---

## 0) What the profile page must show

* **Hero**: background image, avatar, name, bio, **“Talk to her”** button.
* **Stories** (Instagram‑style strip): image/video/text; admin‑only authoring.
* **Tabs**:

    * **Gallery** (image/video). Some items can be **premium‑only** → show **locked blur** + **Get Premium** CTA.
    * **Posts** (image/video). **Always non‑premium** (fully visible).
* **Likes** on Gallery + Posts items (no comments).

---

## 1) Two‑call pattern (min network; min DB)

> Every profile screen loads with **exactly 2 server round‑trips**:

1. **Query**: `girls.profilePage(girlId)` – one Convex query returns a compact **view model** (girl + items + which object keys you’re allowed to see) **and** a `keysToSign[]` list.
2. **Action**: `cdn.signViewBatchPublicOrAuth(keysToSign)` – one Convex action signs **all** needed CloudFront URLs at once (avatar, background, visible gallery, visible posts, visible stories).

    * Returns `{ [key]: signedUrl }` map.
    * The UI binds the signed URLs; **locked** gallery items get **no key** and thus no signed URL → you render the **blur overlay** with “Get Premium”.

This keeps client logic simple, prevents leaking premium content, and avoids per‑item signer calls.

---

## 2) Minimal schema adjustments (only what’s needed)

### A) Stories (new)

Add a simple table for stories (admin‑only authoring; ephemeral is optional—keep it simple now):

```
girl_stories:
  girlId         (id "girls")
  kind           "image" | "video" | "text"
  objectKey?     (S3 key; only for image/video)
  text?          (for text story or caption)
  published      boolean
  createdAt      number
  expiresAt?     number  // optional; if set, only show when expiresAt > now
Indexes:
  by_girl        ["girlId"]
  by_girl_time   ["girlId", "createdAt"]
```

> You can add a `counts.stories` on `girls` later. Not required for page render.

### B) Likes (simple, denormalized)

Keep it minimal but correct (prevents multi‑like spam):

```
likes:
  userId      (id "users")
  girlId      (id "girls")       // denormalized for one cheap fetch
  mediaId     (id "girl_media")  // gallery or post item
  surface     "gallery" | "post" // makes it easy to draw the right heart
  createdAt   number
Indexes:
  by_user_girl     ["userId", "girlId"]
  by_user_media    ["userId", "mediaId"]
  by_media         ["mediaId"]
```

* **Toggle** mutation (atomic): if `by_user_media` exists → delete + `likeCount--`; else insert + `likeCount++`.
* No per‑item reads on first paint: the page can just show counts; optionally, the query may return the **set of liked IDs** for the first batch (see §3) without extra round‑trips.

> You already store `likeCount` on `girl_media`. Keep that; it lets the page display counts with **zero joins**.

---

## 3) The single **profile page** query (one read that feeds the whole screen)

**Name**: `girls.profilePage(girlId)`
**Auth**: optional (works for anonymous and logged‑in).
**DB work inside the query** (server‑side, still *one* network round‑trip from the client):

* Load **girl** by id (public fields: name, bio, avatarKey, backgroundKey, counts, isActive).
* Compute **viewer** flags: `viewerPremium` (from `profiles.premiumActive`) if authenticated.
* **Stories**: last 10 `published` stories (and `expiresAt > now` if you use it).
  For each, **include** `objectKey` **only** for image/video (always visible; no premium gating for stories per your spec).
* **Posts**: first N `isPost=true AND published=true` (visible to all). Include `objectKey`.
* **Gallery**: first N `isGallery=true AND published=true`.

    * If `premiumOnly=false` → include `objectKey`.
    * If `premiumOnly=true` → include **no key** when `!viewerPremium` (so the client cannot fetch it).
* **Liked IDs (optional, cheap)**: if authenticated, fetch `likes.by_user_girl` once and return only IDs that intersect with the media included in this first batch.

**Returned view model** (shape):

```ts
{
  girl: {
    id, name, bio, avatarKey?, backgroundKey?
  },
  viewer: {
    premiumActive: boolean,
    likedIds?: string[]  // optional; for the items included in this page
  },
  stories: Array<{
    id, kind, text?, objectKey?, createdAt
  }>,
  posts: Array<{
    id, kind, text?, likeCount, canBeLiked, createdAt,
    objectKey  // always present; posts are non-premium
  }>,
  gallery: Array<{
    id, kind, text?, likeCount, canBeLiked, premiumOnly, createdAt,
    objectKey? // present only if viewer can see it
  }>,
  keysToSign: string[]  // avatar/background + all objectKeys present above
}
```

> **Why this is lean:** For the page you do **1 query** + **1 batch signer action**. Internally the query performs a few indexed reads, but the client only pays one network hop.

---

## 4) One signer action (batch; public‑safe)

Add a **public‑friendly** batch signer (or adapt your existing `signViewBatch`):

* **`cdn.signViewBatchPublicOrAuth(keys: string[])`**

    * If all keys start with `girls/` → allow **anonymous** signing.
    * If any key is `chat/` or `tts/` → require auth (you already do this).
    * Returns `{ [key]: signedUrl }` with ~5 min TTL.

> This lets **public profile pages** sign avatar/background/posts/stories in one shot, **without login**, and avoids calling `cfSignView` per item.

---

## 5) Page layout & UI binding (Tailwind, no surprises)

**Route**: `/girls/[id]` (or `/[slug]` if you add slugs)

**Sections**

1. **Hero**

    * Background: signed URL.
    * Avatar: signed URL.
    * Name, bio.
    * **Talk button** → `/chat/[girlId]`.

2. **Stories strip**

    * Render a horizontal scroll of story chips.
    * For `text` stories: solid card with text.
    * For `image`/`video`: use signed URLs from the batch signer.
    * Tap → full‑screen lightbox (client‑side only; no extra server work).

3. **Tabs: Gallery | Posts**

    * **Gallery** cards:

        * If item has a signed URL → render image/video normally.
        * If item has **no URL** (premium locked) → show a **blurred placeholder card** (don’t request the real media!) with a **“Get Premium”** button.
        * Heart button → calls a single `likes.toggle(mediaId)` mutation; optimistic UI increments/decrements count.
    * **Posts** cards (always visible) → always render from signed URLs; same heart button.

**Tailwind tips** (suggested classes only):

* Card container: `relative overflow-hidden rounded-lg border bg-white`
* Media aspect: `aspect-[4/5]` for images; `aspect-video` for videos
* Locked overlay:

    * Wrapper: `relative`
    * Blurred bg: set a **fixed placeholder** (e.g., `/locks/blur.jpg`) as `bg-[url('/locks/blur.jpg')] bg-cover filter blur-md` (or just a neutral gradient)
    * Overlay: `absolute inset-0 flex items-center justify-center bg-black/40`
    * CTA: `px-3 py-1.5 text-sm rounded bg-amber-500 text-white`

> **Important**: Never provide a signed URL for locked items. The blur must be over a **placeholder**, not the real image.

---

## 6) Like toggling (one tiny mutation)

* **`likes.toggle(mediaId)`**:

    * Check `girl_media.canBeLiked`.
    * Find `likes.by_user_media(userId, mediaId)`.

        * If exists → delete; `likeCount--` on `girl_media`.
        * Else → insert; `likeCount++`.
    * Return `{ liked: boolean, likeCount: number }`.
* **UI**: optimistic update the count and heart state. No extra reads.

---

## 7) Pagination (only if needed, still one query)

Keep it optional. If you want “Load more”:

* Reuse the same **profile query** with `cursor?` and `limit`.
* Return `nextCursor` and only append to the section you’re loading (gallery or posts).
* Do another **single signer call** for the newly received keys.
  This keeps each “load more” to **2 calls** as well.

---

## 8) Admin touchpoints (reusing what you have)

* Stories: add an **Admin Stories** screen that writes to `girl_stories`.

    * Upload via your existing S3 presign flow; set `published=true`.
* Gallery vs Posts vs Reply assets: you already handle with **one `girl_media` table** + flags. Stories are **separate** to keep the user page query simple.

---

## 9) Why this is the least complex way

* **Two calls per page** (query + batch signer).
* **Zero accidental leaks** (no signed URL for locked items).
* **No joins on the client**, no duplicate fetches, no per‑item signer spam.
* **Like** logic is one small, idempotent mutation.
* **Stories** are just one small table and a list; no ephemeral timers required.

---

### Quick checklist to implement

* [ ] Add `girl_stories` table + minimal admin UI to create/publish.
* [ ] Add `likes` table + `likes.toggle(mediaId)` mutation.
* [ ] Implement `girls.profilePage(girlId, { galleryLimit=12, postsLimit=12 })` query that returns the **view model** + `keysToSign[]`.
* [ ] Implement `cdn.signViewBatchPublicOrAuth(keys[])` (public for `girls/` paths; auth for others).
* [ ] Build `/girls/[id]` page:

    * Server: call **one** Convex query; then **one** signer action; pass signed URLs to client.
    * Client: render Hero, Stories, Tabs; blur locked gallery cards with **no real media URL**; heart → `likes.toggle`.


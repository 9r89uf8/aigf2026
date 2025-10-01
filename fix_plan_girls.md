Perfect—here’s a **minimal, no‑N+1** way to get gradient rings on the **girls listing** and open the **story viewer** on avatar click, matching your chat page behavior.

---

## What we’ll do

1. **Extend the listing query** to include a `hasStory` flag (and optional `latestStoryKind`) **without per‑girl lookups**.
2. **Wrap each avatar** in a gradient ring when `hasStory === true` and **link to** `/stories/[girlId]`.
3. Keep it **one Convex query** + your **single batch signer** for avatars (no extra DB calls).

---

## 1) Update query: add `hasStory` (and `latestStoryKind`) to the public list

**convex/girls.js** — replace your `listGirlsPublic` with this version (single query for girls + single query for recent stories, then dedupe in memory):

```ts
export const listGirlsPublic = query({
  args: {},
  handler: async (ctx) => {
    // Active girls
    const girls = await ctx.db
      .query("girls")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Recent published stories across *all* girls (descending)
    // Keep this cap modest to avoid scanning huge tables; raise if you have many active girls.
    const recentStories = await ctx.db
      .query("girl_stories")
      .withIndex("by_published_createdAt", (q) => q.eq("published", true))
      .order("desc")
      .take(400);

    // Pick newest story per girl
    const latestByGirl = new Map();
    for (const s of recentStories) {
      const gid = s.girlId.toString();
      if (!latestByGirl.has(gid)) latestByGirl.set(gid, s);
      if (latestByGirl.size === girls.length) break;
    }

    // Sort alphabetically for predictable UI
    const sorted = girls.sort((a, b) => a.name.localeCompare(b.name));

    // Return only what the listing needs (+ hasStory & latestStoryKind for ring and optional overlay)
    return sorted.map((g) => {
      const s = latestByGirl.get(g._id.toString());
      return {
        _id: g._id,
        name: g.name,
        bio: g.bio,
        avatarKey: g.avatarKey,
        counts: g.counts,
        hasStory: !!s,
        latestStoryKind: s?.kind ?? null,       // "image" | "video" | "text" | null (optional, for ▶ overlay)
        // If you later want preview thumbnails, you can expose s.objectKey here too.
      };
    });
  },
});
```

**Why this is cheap:** still just **two set-based reads** (girls + recent stories), no per‑girl story queries, no DB writes.

---

## 2) Update the girls listing UI

* Show a **gradient ring** when `girl.hasStory` is true.
* Make the **avatar a link to** `/stories/${girl._id}`.
* Keep your existing **batch signer** for avatars (`api.cdn.signViewBatch`).

**app/girls/page.js** — keep your file structure, just swap `GirlCard` and keep the rest. The top of the file remains the same (we still use `api.girls.listGirlsPublic`).

```tsx
function GirlCard({ girl, avatarUrl }) {
  // Gradient ring colors: pink→yellow when hasStory, gray otherwise
  const ringClass = girl.hasStory
    ? "from-pink-500 to-yellow-400"
    : "from-gray-300 to-gray-300";

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
      <div className="p-6">
        {/* Avatar with gradient ring that opens the story viewer */}
        <div className="relative mx-auto mb-4 w-32 h-32">
          <Link
            href={`/stories/${girl._id}`}
            className="block"
            title={`Open ${girl.name}'s stories`}
            aria-label={`Open ${girl.name}'s stories`}
          >
            <div className={`p-[3px] rounded-full bg-gradient-to-tr ${ringClass}`}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={girl.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {girl.name?.[0]?.toUpperCase()}
                  </span>
                )}

                {/* Optional: small ▶ glyph if their latest story is a video */}
                {girl.latestStoryKind === "video" && (
                  <span className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 bg-black/60 text-white rounded">
                    ▶
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          {girl.name}
        </h2>

        {/* Bio */}
        {girl.bio && (
          <p className="text-sm text-gray-600 text-center mb-4 line-clamp-3 min-h-[3.5rem]">
            {girl.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {girl.counts.gallery}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {girl.counts.posts}
          </span>
        </div>

        {/* View Profile Button */}
        <Link
          href={`/girls/${girl._id}`}
          className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-center rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
```

> ✅ We’re not signing any story object keys on this page—only avatars—so there’s **no extra S3 or DB cost** beyond what you already do. The ring is purely driven by `hasStory`.

---

## 3) You don’t need to change your signer code

Your current `GirlsListingPage` already batch‑signs avatar keys via `api.cdn.signViewBatch`. Leave that as is. The only change is that `listGirlsPublic` now returns `hasStory` and `latestStoryKind`, which the card uses for the ring and optional ▶ glyph.

---

## Notes / options

* The listing page shows a ring whenever the girl has *any* published story (it’s **not** user‑specific “new vs seen”). If you later want a “new” ring here too, you’d need a user‑aware query (like `/chat` uses `lastStorySeenAt`).
* If you decide to show **story thumbnails** inside the ring on the listing page, expose `latestStoryObjectKey` in the query above and add it to your `signViewBatch` call (still one batch).

---

That’s it—**one query** for listing + **one avatar signer** and you get the **Instagram‑style story ring** on the grid, and **avatar click opens the story viewer**.

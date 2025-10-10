Below is a **drop‑in plan** (with minimal changes) to add *per‑user media de‑duplication*, prefer unseen assets, and still keep the code + DB usage simple and cheap.

---

## What we’ll do (high‑level)

1. **Track what the AI already sent** in the conversation document itself (no extra tables, no extra queries on the hot path).

    * New field: `conversations.mediaSeen` with 3 small arrays: `image[]`, `video[]`, `audio[]`.
    * We store **S3 objectKeys** (strings). Newest first, unique, and **clipped** to a small cap (e.g., 120 per kind).

2. **Pick logic** changes (in both places that select media):

    * Filter by tags (as you already do).
    * Prefer **unseen** assets from that pool.
    * If all are seen, avoid the **very recent** N (e.g., last 8) if there are other choices.
    * Otherwise, random fallback (current behavior).

3. **Write once, centrally**: When media is actually sent (inside `_insertAIMediaAndDec` and `_insertAIAudioAndDec`) we update the `mediaSeen` arrays. That way **both** the fast‑intent path and the LLM decision path benefit, with **no duplicate code** and **no extra round trips** elsewhere.

4. **Zero migration risk**: Default to empty arrays; the code tolerates `undefined`. Optional backfill script provided (only if you want to bootstrap from history).

This keeps DB ops lean:

* **No extra queries** during selection (we already fetch the conversation via `_getContextV2`).
* **One additional read** inside the media insert mutation to update the array safely (you can avoid even that if you pass the current arrays as args—shown below as an optional optimization).

---

## 1) Schema update

**`convex/schema.js`** – add `mediaSeen` to the `conversations` table.

```diff
 // conversations: defineTable({...})
   conversations: defineTable({
     userId: v.id("users"),
     girlId: v.id("girls"),
     girlName: v.string(),
     girlAvatarKey: v.optional(v.string()),
     freeRemaining: v.object({
       text: v.number(),
       media: v.number(),
       audio: v.number(),
     }),
     premiumActive: v.boolean(),
     girlPremiumOnly: v.boolean(),
     personaPrompt: v.optional(v.string()),
     voiceId: v.optional(v.string()),
     lastMessageAt: v.number(),
     lastMessagePreview: v.string(),
     lastMessageKind: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio"))),
     lastMessageSender: v.optional(v.union(v.literal("user"), v.literal("ai"))),
     lastStorySeenAt: v.optional(v.number()),
     lastReadAt: v.number(),
     lastAiReadAt: v.optional(v.number()),
     clearedAt: v.optional(v.number()),
     createdAt: v.number(),
     updatedAt: v.number(),

     pendingIntent: v.optional(v.union(
       v.literal("text"), v.literal("audio"), v.literal("image"), v.literal("video")
     )),
     pendingIntentExpiresAt: v.optional(v.number()),
     heavyCooldownUntil: v.optional(v.number()),
+    // NEW: per-conversation media de-dup (newest-first, unique, clipped)
+    mediaSeen: v.optional(v.object({
+      image: v.array(v.string()),
+      video: v.array(v.string()),
+      audio: v.array(v.string()),
+    })),
   })
```

> Existing rows work because `mediaSeen` is optional.

---

## 2) Small helpers + constants (one place)

Add these to **`convex/chat_actions.js`** (near your other small util fns).

```js
// --- MEDIA DEDUP CONFIG ---
const MEDIA_DEDUP = {
  PER_KIND_LIMIT: 120,     // cap per kind to keep convo doc small
  AVOID_RECENT_N: 8,       // when all are "seen", avoid most recent N if possible
};

// Get ordered list (newest first) from convo, safe default
function getSeenList(convo, kind) {
  return (convo.mediaSeen?.[kind] ?? []);
}

// Prefer unseen; if all seen, avoid very recent N if possible; else random
function pickAssetWithDedup({ assets, kind, tags = [], seenList = [] }) {
  let pool = assets;

  if (tags.length) {
    const tl = tags.map(t => t.toLowerCase());
    const tagged = assets.filter(a => tl.some(t => (a.text || "").toLowerCase().includes(t)));
    if (tagged.length) pool = tagged;
  }

  const seenSet = new Set(seenList);
  const unseen = pool.filter(a => !seenSet.has(a.objectKey));
  if (unseen.length) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // All seen → try to avoid the most recent N if there are other choices
  if (pool.length > MEDIA_DEDUP.AVOID_RECENT_N) {
    const recentSet = new Set(seenList.slice(0, MEDIA_DEDUP.AVOID_RECENT_N));
    const olderSeen = pool.filter(a => !recentSet.has(a.objectKey));
    if (olderSeen.length) {
      return olderSeen[Math.floor(Math.random() * olderSeen.length)];
    }
  }

  // Fallback: fully random
  return pool[Math.floor(Math.random() * pool.length)];
}
```

---

## 3) Include `mediaSeen` in context

Return it from `_getContextV2` so selection code has it **for free** (no extra DB calls).

**`convex/chat_actions.js` → _getContextV2 handler**

```diff
     return {
       persona,
       history,
       girlId: convo.girlId,
       conversationId,
       userId: convo.userId,
       voiceId: convo.voiceId,
       premiumActive: convo.premiumActive,
       freeRemaining: convo.freeRemaining,
       lastUserMessage: lastUser,  
       lastUserMediaSummary,
       lastAiWasMedia:
         (convo.lastMessageSender === "ai") &&
         (convo.lastMessageKind === "image" || convo.lastMessageKind === "video" || convo.lastMessageKind === "audio"),
       heavyCooldownUntil: convo.heavyCooldownUntil ?? 0,
+      mediaSeen: {
+        image: convo.mediaSeen?.image ?? [],
+        video: convo.mediaSeen?.video ?? [],
+        audio: convo.mediaSeen?.audio ?? [],
+      },
     };
```

---

## 4) Use the helper in both selection sites

### A) Fast‑intent path (image/video)

Replace the current “tagged random” selection with `pickAssetWithDedup`.

**Inside** the block:

```js
// 2) IMAGE or VIDEO request
if (fastIntent.type === "image" || fastIntent.type === "video") {
  const outOfMedia = !premiumActive && freeRemaining?.media <= 0;
  if (outOfMedia) {
    ...
  }

  const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, {
    girlId, kind: fastIntent.type,
  });
  if (!assets?.length) {
    ...
  }

- // tag-based pick, else random
- let chosen = assets[Math.floor(Math.random() * assets.length)];
- if (fastIntent.tags?.length) {
-   const tagged = assets.filter(a =>
-     fastIntent.tags.some(t => (a.text || "").toLowerCase().includes(t))
-   );
-   if (tagged.length) chosen = tagged[Math.floor(Math.random() * tagged.length)];
- }
+ const seenList = mediaSeen?.[fastIntent.type] ?? [];
+ const chosen = pickAssetWithDedup({
+   assets,
+   kind: fastIntent.type,
+   tags: fastIntent.tags ?? [],
+   seenList,
+ });

  let caption;
  try {
    caption = await microCaptionForSend(fastIntent.type, lastUserMessage?.text || "");
  } catch (e) { ... }

  await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
    conversationId, ownerUserId: userId,
    premiumActive, freeRemaining,
    kind: fastIntent.type, mediaKey: chosen.objectKey,
    caption: caption || undefined,
    shouldLikeUserMsg: shouldLike, lastUserMsgId: userMessageId,
  });
  return await done({ ok: true, kind: fastIntent.type });
}
```

### B) LLM decision path (image/video)

Same replacement where you currently do the random/tag selection:

```js
// Choose an asset of the requested kind from girl's reply assets
const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, { girlId, kind: decision.type });
if (!assets?.length) { ... }

- // Pick by tag if any; else random
- let chosen = assets[Math.floor(Math.random() * assets.length)];
- if (decision.tags && decision.tags.length) {
-   const tagged = assets.filter(a =>
-     decision.tags.some(t => (a.text || "").toLowerCase().includes(t.toLowerCase()))
-   );
-   if (tagged.length) chosen = tagged[Math.floor(Math.random() * tagged.length)];
- }
+ const seenList = mediaSeen?.[decision.type] ?? [];
+ const chosen = pickAssetWithDedup({
+   assets,
+   kind: decision.type,
+   tags: decision.tags ?? [],
+   seenList,
+ });

await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
  ...
  kind: decision.type,
  mediaKey: chosen.objectKey,
  ...
});
```

> That’s the only change needed in both places that currently “randomly” pick.

---

## 5) Persist the send (centralized, with clipping)

Update the conversation’s `mediaSeen` arrays when we actually commit the media message. Do it **inside the existing mutations** so every send—no matter the path—updates the state.

### A) `_insertAIMediaAndDec` (image/video)

```diff
 export const _insertAIMediaAndDec = internalMutation({
   args: {
     conversationId: v.id("conversations"),
     ownerUserId: v.id("users"),
     premiumActive: v.boolean(),
     freeRemaining: v.object({ text: v.number(), media: v.number(), audio: v.number() }),
     kind: v.union(v.literal("image"), v.literal("video")),
     mediaKey: v.string(),
     caption: v.optional(v.string()),
     shouldLikeUserMsg: v.optional(v.boolean()),
     lastUserMsgId: v.optional(v.id("messages")),
     replyTo: v.optional(v.object({ ... })),
   },
   handler: async (ctx, { conversationId, ownerUserId, premiumActive, freeRemaining, kind, mediaKey, caption, shouldLikeUserMsg, lastUserMsgId, replyTo }) => {
     const now = Date.now();
     await ctx.db.insert("messages", {
       conversationId, sender: "ai", kind, mediaKey, text: caption || undefined, ownerUserId, createdAt: now,
       ...(replyTo ? { replyTo } : {}),
     });

     if (lastUserMsgId) {
       await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
     }

+    // Load convo to update mediaSeen safely (ensures uniqueness + clipping)
+    const convo = await ctx.db.get(conversationId);
+    const prevSeen = convo?.mediaSeen || { image: [], video: [], audio: [] };
+    const currentList = Array.isArray(prevSeen[kind]) ? prevSeen[kind] : [];
+    const nextList = [mediaKey, ...currentList.filter(k => k !== mediaKey)].slice(0, MEDIA_DEDUP.PER_KIND_LIMIT);
+    const nextMediaSeen = { ...prevSeen, [kind]: nextList };

     await ctx.db.patch(conversationId, {
       freeRemaining: premiumActive
         ? freeRemaining
         : { ...freeRemaining, media: Math.max(0, freeRemaining.media - 1) },
       lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
       lastMessageKind: kind,
       lastMessageSender: "ai",
       lastMessageAt: now, updatedAt: now,
       heavyCooldownUntil: now + HEAVY_REPLY_COOLDOWN_MS,
+      mediaSeen: nextMediaSeen,
     });
   },
 });
```

### B) `_insertAIAudioAndDec` (audio)

Same pattern for audio:

```diff
  const convo = await ctx.db.get(conversationId);
  ...
+ const prevSeen = convo?.mediaSeen || { image: [], video: [], audio: [] };
+ const currentList = Array.isArray(prevSeen.audio) ? prevSeen.audio : [];
+ const nextList = [mediaKey, ...currentList.filter(k => k !== mediaKey)].slice(0, MEDIA_DEDUP.PER_KIND_LIMIT);
+ const nextMediaSeen = { ...prevSeen, audio: nextList };

  await ctx.db.patch(conversationId, {
    freeRemaining: premiumActive ? freeRemaining : { ...freeRemaining, audio: Math.max(0, freeRemaining.audio - 1) },
    lastMessagePreview: caption?.slice(0, 140) || "[Voice reply]",
    lastMessageKind: "audio",
    lastMessageSender: "ai",
    lastMessageAt: now, updatedAt: now,
    heavyCooldownUntil: now + HEAVY_REPLY_COOLDOWN_MS,
+   mediaSeen: nextMediaSeen,
  });
```

> With this, **every send** updates the dedup state; no matter how we got there.

---

## 6) (Optional) Micro‑optimization: avoid the extra read

If you want to **avoid the `await ctx.db.get(conversationId)`** inside the two insert mutations, you can:

* Return `mediaSeen` from `_getContextV2` (we already did).
* Pass the arrays in the mutation args (e.g., `mediaSeenSnapshot`) and build `nextMediaSeen` from that.
  This saves 1 read per media send but is slightly more code and introduces a tiny race window if two media are sent concurrently. For this use case that’s fine; or keep the extra read for correctness.

Example arg (if you want it):

```diff
args: {
  ...
+ mediaSeenSnapshot: v.optional(v.object({
+   image: v.array(v.string()),
+   video: v.array(v.string()),
+   audio: v.array(v.string()),
+ })),
},
handler: async (ctx, { ..., mediaSeenSnapshot }) => {
  const prevSeen = mediaSeenSnapshot ?? (await ctx.db.get(conversationId))?.mediaSeen ?? { image:[], video:[], audio:[] };
  ...
}
```

And pass it from the caller with `mediaSeen` you already have.

---

## 7) Behavior details & edge cases

* **Tags still win first**: we always respect tag filters, then apply dedup inside that pool.
* **Unseen first**: if any unseen in the pool, we pick among those at random.
* **All seen**: try not to reuse the **last 8**; if that empties, random among the pool.
  Tweak `AVOID_RECENT_N` to tune variety vs. resurfacing.
* **Cap growth**: the cap (`PER_KIND_LIMIT = 120`) keeps the conversation doc small (~a few KB); increase if your asset catalog is larger and you want longer memory.
* **No extra indices/tables**: keeps reads cheap and logic local.

----

## 10) Why this meets your constraints

* **Human feel**: unseen‑first + “avoid recent repeats” feels intentional and varied.
* **Low cost & complexity**: no new tables or indices; reuse existing context query; one small patch during sends.
* **Deterministic + robust**: centralized update in the insert mutation; both code paths covered.

---

### TL;DR (what your agent needs to implement)

* Add `mediaSeen` to `conversations` schema.
* Add the helper constants + `pickAssetWithDedup` in `chat_actions.js`.
* Return `mediaSeen` from `_getContextV2`.
* Replace the random selection in **both** media pick sites with `pickAssetWithDedup(...)`.
* Update `_insertAIMediaAndDec` and `_insertAIAudioAndDec` to **append** `mediaKey` to `mediaSeen[kind]` (unique, newest‑first, clipped).


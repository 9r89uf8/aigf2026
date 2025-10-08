Great work — you landed nearly all the big wins (permit‑stamped premium, denormalized `girlPremiumOnly`, no mass snapshot writes, N+1 fixed with `mediaSummary`, plans lazy‑loaded, fresh “now” in prompts). I read through every file you pasted and ran a mental “hot‑path” audit. Below are **concrete fixes** (a few correctness bugs), **cheap improvements**, and **optional polish**.

---

## 🚨 Fix these first (correctness)


### 2) Premium snapshot in `startConversation` uses only `premiumUntil`

You correctly use `premiumActive || premiumUntil>now` elsewhere, but here you do:

```ts
const premiumActive = (profile?.premiumUntil ?? 0) > Date.now();
```

**Fix** (match your permit logic):

```ts
const premiumActive =
  !!profile?.premiumActive || (profile?.premiumUntil ?? 0) > Date.now();
```

---

### 3) Ownership checks in S3 actions are heavy (and leaky)

You call `ctx.runQuery(api.chat.getConversation, { conversationId })` in both
`signChatUpload` and `finalizeChatUpload`. That query fetches **messages** and other fields just to validate ownership — unnecessary work and potential leakage if future changes return more fields.

**Fix**: do a single `db.get` and compare `userId`.

```ts
const convo = await ctx.db.get(conversationId);
if (!convo || convo.userId !== userId) throw new Error("Unauthorized");
```

Keep your `startsWith("chat/${conversationId}/user/")` guard — that part is great.

---

### 4) UI gating can mis‑disable for fresh premium

`outOfFree` uses `!data?.premiumActive` (the **snapshot**), while `premiumLocked` uses `me?.profile?.premiumActive` (the **live** value). A newly upgraded user could be blocked by `outOfFree`.

**Fix**

```ts
const isPremiumNow = !!me?.profile?.premiumActive;
const premiumLocked = !isLoading && !!data?.girlPremiumOnly && !isPremiumNow;
const outOfFree = !isLoading && !premiumLocked && !isPremiumNow &&
  ((data?.freeRemaining?.text ?? Infinity) <= 0);
```

---

### 5) Enforce `permit.scope`

You mint `scope: "chat_send"`, but the send mutations don’t check it.

**Fix**

```ts
if (permit.scope !== "chat_send") throw new Error("Security check failed (scope)");
```

Add to `sendMessage`, `sendMediaMessage`, `sendAudioMessage`.


---

## ⚙️ Low‑cost improvements

### 7) Don’t reorder threads on “Clear chat”

`clearConversation` sets `updatedAt: now`, which pops the thread to the top even though there’s no new activity.

**Consider**

```diff
- updatedAt: now,
+ // leave updatedAt unchanged to preserve thread order
```

### 8) Remove the stray `console.log('admin')`

In `signGirlAvatarUpload`. Keeps logs clean.

### 9) Wire `mediaSummary` end‑to‑end

You added `_applyMediaSummary` (great). Make sure your Rekognition actions call it after computing labels. (If they already do, ignore this.)

### 10) Prefer `ctx.db.get` in `signChatUpload`/`finalizeChatUpload`

You already added the path check; swap the `runQuery(getConversation)` for a single `db.get` (item #3).

---


## ✅ What’s already optimized nicely

* **Permit‑stamped premium** used in send mutations → removes live profile reads on hot paths.
* **`girlPremiumOnly` on conversations** → no reads from `girls` in sends.
* **Messages query with `by_conversation_ts` + `take(limit)`** → efficient scrolling.
* **N+1 removed** by denormalizing `mediaSummary`.
* **Lazy plan loading** only when upsell shows.
* **Key prefix check** for uploads + size/type checks → good S3 hygiene.

---

## Small diffs to copy‑paste

**send* mutations – scope check**

```diff
const permit = await ctx.db.get(permitId);
if (!permit || permit.userId !== userId || permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
  throw new Error("Security check failed (permit)");
}
+ if (permit.scope !== "chat_send") {
+   throw new Error("Security check failed (scope)");
+}
```

**startConversation – premium snapshot**

```diff
- const premiumActive = (profile?.premiumUntil ?? 0) > Date.now();
+ const premiumActive = !!profile?.premiumActive || (profile?.premiumUntil ?? 0) > Date.now();
```

**S3 actions – cheap ownership check**

```diff
- const convo = await ctx.runQuery(api.chat.getConversation, { conversationId });
- if (!convo) throw new Error("Conversation not found");
+ const convo = await ctx.db.get(conversationId);
+ if (!convo || convo.userId !== userId) throw new Error("Unauthorized");
```


**Client – outOfFree using live premium**

```diff
- const premiumLocked = !isLoading && !!data?.girlPremiumOnly && !me?.profile?.premiumActive;
- const outOfFree = !isLoading && !premiumLocked && !data?.premiumActive &&
+ const isPremiumNow = !!me?.profile?.premiumActive;
+ const premiumLocked = !isLoading && !!data?.girlPremiumOnly && !isPremiumNow;
+ const outOfFree = !isLoading && !premiumLocked && !isPremiumNow &&
  ((data?.freeRemaining?.text ?? Infinity) <= 0);
```

**Optional – keep thread order on clear**

```diff
await ctx.db.patch(conversationId, {
  clearedAt: now,
  lastReadAt: now,
  lastMessagePreview: "",
- updatedAt: now,
});
```

---

## Summary

* You nailed the heavy hitters.



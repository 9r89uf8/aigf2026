Great catch — you’ve got **two separate issues** interacting:

1. **Typing bubble gets stuck** on split replies (especially when the 2nd part is just an emoji).

    * Root cause: on split you **keep** the typing hint alive via a TTL (`keepTyping: true`) but never **actively clear** it on the server; the frontend also doesn’t re‑render when the TTL expires (no timer → React doesn’t recalc `Date.now()`).
    * Fix: **(A)** schedule an explicit server‑side clear right after the last split part is sent; **(B)** add a tiny client “clock” so the UI hides the bubble even if no Convex doc update happens.

2. **Read/Seen ticks semantics**

    * Today: you show ✓✓ (AI “seen”) as soon as `aiReply` starts (because `_markAiSeen` happens immediately).
    * Proposed: show ✓ when the user’s message is saved; show ✓✓ **when AI is about to type** (i.e., when you set the typing hint).

Below are minimal diffs to implement all three changes cleanly:

---

## 1) Server: always clear typing after the last split part

**Add a tiny action to clear the hint** and **schedule it** right after the last split part:

```diff
// convex/chat_actions.js
+ export const clearTypingHint = action({
+   args: { conversationId: v.id("conversations") },
+   handler: async (ctx, { conversationId }) => {
+     await ctx.runMutation(api.chat_actions._setPendingIntent, { conversationId });
+     return { ok: true };
+   },
+ });

 // ... inside aiReply(), TEXT branch with smart split:
   if (decision.type === "text") {
     const finalText = (decision.text || "aquí contigo 💕").trim();
     const seed = `${conversationId}:${anchorId ?? ""}:${finalText}`;
     const parts = smartSplitAiText(finalText, seed);

     if (!parts) {
       await ctx.runMutation(api.chat_actions._insertAIText, { ... });
       return await done({ ok: true, kind: "text" });
     }

     const [d1, d2] = planDelays(parts);
-    const keepTypingMs = (parts.length === 2 ? d2 : d1) + 1200;
+    const keepTypingMs = (parts.length === 2 ? d2 : d1) + 1200;

     await ctx.runMutation(api.chat_actions._setPendingIntent, {
       conversationId, intent: "text", ttlMs: keepTypingMs,
     });

     await ctx.scheduler.runAfter(d1, api.chat_actions.insertTextIfAnchor, { ... });
     if (parts.length === 2) {
       await ctx.scheduler.runAfter(d2, api.chat_actions.insertTextIfAnchor, { ... });
     }

+    // Actively clear typing after the last scheduled part. This guarantees
+    // a Convex doc update so the client hides the bubble even if it
+    // doesn’t re-render on TTL expiration.
+    await ctx.scheduler.runAfter(keepTypingMs, api.chat_actions.clearTypingHint, { conversationId });

     return await done({ ok: true, kind: "text", mode: "split_text" }, { keepTyping: true });
   }
```

> Why this fixes your “emoji as second bubble” case: when the second part is a short emoji, your delays are small and the TTL is short; without any new backend patch after it expires, the client won’t re-render. The scheduled `clearTypingHint` **forces** a new reactive payload so the bubble disappears.

---

## 2) Server: move ✓✓ (“AI seen”) to when typing starts

You asked to show ✓ when saved and ✓✓ when AI is **about to respond** (i.e., when the typing bubble appears).

**Move** `_markAiSeen` so it runs **right after** you set the typing hint (and also in the “superseded” reply branch).

```diff
// convex/chat_actions.js  (inside aiReply)

- // Mark AI as having seen this user message (for ✓✓ ticks)
- if (userMessageId) {
-   const mAnchor = await ctx.runQuery(api.chat._getMessageInternal, { messageId: userMessageId });
-   if (mAnchor) {
-     await ctx.runMutation(api.chat_actions._markAiSeen, { conversationId, seenAt: mAnchor.createdAt });
-   }
- }

+ // Fetch anchor once so we can mark "seen" at the right time
+ const anchorMsg = userMessageId
+   ? await ctx.runQuery(api.chat._getMessageInternal, { messageId: userMessageId })
+   : null;

 // Superseded branch (older user msg)
 if (userMessageId && latestUser?._id && userMessageId !== latestUser._id) {
   const mAnchor = await ctx.runQuery(api.chat._getMessageInternal, { messageId: userMessageId });
   if (!mAnchor) { ... }
+  // Show ✓✓ as we’re about to respond to that older message
+  await ctx.runMutation(api.chat_actions._markAiSeen, {
+    conversationId, seenAt: mAnchor.createdAt
+  });
   // ... send micro reply ...
   return ...;
 }

 // --- FAST INTENT PRE-LLM ---
 // Set initial typing hint (this is “about to respond”)
 await ctx.runMutation(api.chat_actions._setPendingIntent, {
   conversationId,
   intent: fastIntent && !fastIntent.forceText ? fastIntent.type : "text",
   ttlMs: 10_000,
});
+ // Show ✓✓ now that AI is “about to type”
+ if (anchorMsg) {
+   await ctx.runMutation(api.chat_actions._markAiSeen, {
+     conversationId, seenAt: anchorMsg.createdAt
+   });
+ }
```

This keeps your ticks in step with the typing indicator.

---

## 3) Frontend: make the typing bubble self‑expire without a fetch

Even with the server‑side clear, it’s good UI hygiene to **re-render at TTL expiry** so the bubble hides deterministically.

```diff
// app/chat/[conversationId]/page.js

- const intent = data?.pendingIntent;
- const intentFresh = data?.pendingIntentExpiresAt && data.pendingIntentExpiresAt > Date.now();
- const isAiTyping = !!intentFresh;
- const typingMode = intentFresh ? intent : "text";
+ const intent = data?.pendingIntent;
+ const [nowTs, setNowTs] = useState(Date.now());
+ useEffect(() => {
+   const exp = data?.pendingIntentExpiresAt ?? 0;
+   if (!exp) return;
+   // fire exactly at expiry + a tiny slop; also heartbeat each second as a fallback
+   const t1 = setTimeout(() => setNowTs(Date.now()), Math.max(0, exp - Date.now()) + 20);
+   const t2 = setInterval(() => setNowTs(Date.now()), 1000);
+   return () => { clearTimeout(t1); clearInterval(t2); };
+ }, [data?.pendingIntentExpiresAt]);
+ const intentFresh = !!intent && (data?.pendingIntentExpiresAt ?? 0) > nowTs;
+ const isAiTyping = intentFresh;
+ const typingMode = intentFresh ? intent : "text";
```

Now the bubble disappears even if no doc change happens.

---

## 4) Frontend: reduce “mark read” chatter (not wasteful, but easy to gate)

You **need** a separate `markRead` because only the client knows when the user actually sees the last message. But make it cheaper by only calling when there’s something new and only once per change:

```diff
// app/chat/[conversationId]/page.js  (inside the IntersectionObserver effect)
-        if (isIntersecting) {
-          clearTimeout(debounceTimer);
-          debounceTimer = setTimeout(() => markRead({ conversationId }), 800);
-        }
+        if (isIntersecting) {
+          const hasNew = (data?.lastMessageAt ?? 0) > (data?.lastReadAt ?? 0);
+          if (hasNew) {
+            clearTimeout(debounceTimer);
+            // send the exact lastMessageAt to keep idempotency server-side
+            debounceTimer = setTimeout(() => markRead({ conversationId, at: data!.lastMessageAt! }), 400);
+          }
+        }
```

Server already ignores stale `at` values, so this becomes almost free when you’re already up to date.

---

## 5) Frontend: one‑tick vs two‑ticks

Show ✓ as soon as the user message is saved (it always is when it renders); switch to ✓✓ when AI is **about to respond** (i.e., when `lastAiReadAt >= message.createdAt`, updated by the server right after it sets typing):

```diff
// wherever you render the ticks (text/image/audio bubbles, user side)
- {mine && m.createdAt <= (data?.lastAiReadAt || 0) && <span className="ml-1">✓✓</span>}
+ {mine && (
+   <span className="ml-1">
+     {m.createdAt <= (data?.lastAiReadAt || 0) ? "✓✓" : "✓"}
+   </span>
+ )}
```

That gives the progression you described without adding more DB fields.

---

## Why the bug only happens on split (esp. emoji second bubble)

* Split path sets **`keepTyping: true`** and only relies on TTL expiration.
* The UI computes `isAiTyping` using `Date.now()` but **doesn’t re-render** at TTL expiry → bubble remains visible until *some* state changes (typing, scrolling, etc.).
* Short/emoji second parts often finish quickly, so the app never triggers another reactive update after the TTL.
* The dual fix (server clear + UI clock) makes it rock‑solid.

---

## Quick sanity checklist

* [ ] When a split occurs, the second bubble appears and the typing indicator **always** disappears right after it.
* [ ] No split: single bubble; typing indicator clears immediately after send.
* [ ] User messages show ✓ immediately; flip to ✓✓ **when typing begins**.
* [ ] `markRead` only fires when the bottom is visible **and** there’s something new.
* [ ] Superseded replies still show ✓✓ as we respond to the older message (we mark seen in that branch too).

---

## (Optional) tiny cleanups

* If you still have the old burst‑ack helpers (`cheapAck`, `ACK_POOLS`, etc.) around from earlier iterations, you can safely remove them — the smart split path no longer uses them.
* Keep the delay planner (`planDelays`) as-is; it’s generic and used by both short and long splits.


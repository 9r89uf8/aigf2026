You’re on the right track. The cleanest way to solve “both `callLLM` fail → show error under the latest user message, don’t add a fake reply, don’t break LLM context, and keep DB traffic low” is:

**Add one boolean field on the user message** and **one small filter in your context builder**. Then make `aiReply` **mark the user message as failed** and **early‑return** when the LLM is unavailable. The UI renders the error off that single flag and gives a “Retry” that re‑invokes `aiReply` for that same message id.

Below are **minimal diffs** you can paste in—no extra tables, no background queues, no new queries per send.

---

## 1) Schema: add a single flag on messages

This lets you persist the failure (so it survives reloads) and render the UI hint without extra reads.

**`convex/schema.js`** – extend `messages`:

```diff
 messages: defineTable({
   conversationId: v.id("conversations"),
   sender: v.union(v.literal("user"), v.literal("ai")),
   kind: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
   text: v.optional(v.string()),
   mediaKey: v.optional(v.string()),
   durationSec: v.optional(v.number()),
   userLiked: v.optional(v.boolean()),
   aiLiked: v.optional(v.boolean()),
   ownerUserId: v.id("users"),
   createdAt: v.number(),
+  aiError: v.optional(v.boolean()),         // <-- mark if AI failed to respond to THIS user message
 })
   .index("by_conversation_ts", ["conversationId", "createdAt"]),
```

That’s it—no new indexes needed.

---

## 2) Context builder: skip errored user messages (except the one being answered)

Add an optional `focusUserMessageId` so you can **include** the specific message you’re trying to answer (on retry) but **exclude** all other past user messages that have `aiError=true`. This preserves a tidy user/assistant rhythm for providers that are strict about ordering, without extra lookups.

**`convex/chat_actions.js`** – change `_getContextV2` signature and filter:

```diff
 export const _getContextV2 = internalQuery({
-  args: { conversationId: v.id("conversations"), limit: v.number() },
-  handler: async (ctx, { conversationId, limit }) => {
+  args: { conversationId: v.id("conversations"), limit: v.number(), focusUserMessageId: v.optional(v.id("messages")) },
+  handler: async (ctx, { conversationId, limit, focusUserMessageId }) => {
     const convo = await ctx.db.get(conversationId);
     if (!convo) throw new Error("Conversation not found");

     const msgs = await ctx.db
       .query("messages")
       .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
       .order("desc")
       .take(limit);

+    // Drop past user messages that are marked as aiError,
+    // except the one we're currently trying to answer.
+    const usable = msgs.filter(m =>
+      !(m.sender === "user" && m.aiError && (!focusUserMessageId || m._id.toString() !== focusUserMessageId.toString()))
+    );
-    const mediaMessageIds = msgs
+    const mediaMessageIds = usable
       .filter(m => (m.kind === "image" || m.kind === "video") && m.sender === "user")
       .map(m => m._id);

-    const history = msgs.reverse().map((m) => {
+    const history = usable.reverse().map((m) => {
       // ... unchanged mapping code ...
     });

     return {
       persona,
       history,
       girlId: convo.girlId,
       conversationId,
       userId: convo.userId,
       voiceId: convo.voiceId,
       premiumActive: convo.premiumActive,
       freeRemaining: convo.freeRemaining
     };
   },
 });
```

This adds **zero** extra DB calls—the filter runs on the same `msgs` you already fetched.

---

## 3) Mark AI failure (single patch) and optionally clear it on success

Add a tiny internal mutation to set the flag, and call it only when both LLM calls fail or when fallback is disabled. On successful AI replies, clear the flag for the specific message (piggyback on your “like” patch to avoid another write).

**`convex/chat_actions.js`** – add:

```js
export const _markAIError = internalMutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const msg = await ctx.db.get(messageId);
    if (!msg) return;
    if (msg.sender !== "user") return;
    await ctx.db.patch(messageId, { aiError: true });
  },
});
```

Now update your success insertions to **clear** a previously set flag while you’re already patching the user message for `aiLiked`—**no extra round trip**:

```diff
// in _insertAIText / _insertAIMediaAndDec / _insertAIAudioAndDec
- if (shouldLikeUserMsg && lastUserMsgId) {
-   await ctx.db.patch(lastUserMsgId, { aiLiked: true });
- }
+ if (lastUserMsgId) {
+   await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
+ }
```

---

## 4) aiReply: (a) optional fallback by env flag, (b) hard stop on failure

* Try **primary**.
* If it throws and **fallback is disabled**, mark `aiError` on the **exact user message**, return `{ok:false}` and **do nothing else**.
* If fallback is enabled *and configured*, try it; if it also fails, mark `aiError` and return.

**`convex/chat_actions.js`** – adjust `aiReply` up top:

```diff
 export const aiReply = action({
   args: { conversationId: v.id("conversations"), userMessageId: v.optional(v.id("messages")) },
   handler: async (ctx, { conversationId, userMessageId }) => {
-    const { persona, history, girlId, userId, voiceId, premiumActive, freeRemaining } = await ctx.runQuery(api.chat_actions._getContextV2, {
-      conversationId, limit: CONTEXT_TURNS,
-    });
+    const { persona, history, girlId, userId, voiceId, premiumActive, freeRemaining } =
+      await ctx.runQuery(api.chat_actions._getContextV2, {
+        conversationId, limit: CONTEXT_TURNS, focusUserMessageId: userMessageId
+      });

     const shouldLike = userMessageId ? (hashCode(userMessageId.toString()) % 4) === 0 : false;
     const messages = [{ role: "system", content: persona }, ...history];

     const cfg = {
       primary: { baseUrl: process.env.LLM_BASE_URL_PRIMARY, apiKey: process.env.LLM_API_KEY_PRIMARY, model: process.env.LLM_MODEL_PRIMARY },
       fallback: { baseUrl: process.env.LLM_BASE_URL_FALLBACK, apiKey: process.env.LLM_API_KEY_FALLBACK, model: process.env.LLM_MODEL_FALLBACK },
     };
+    const fallbackEnabled = process.env.LLM_FALLBACK_ENABLED === "1"
+      && !!cfg.fallback.baseUrl && !!cfg.fallback.apiKey && !!cfg.fallback.model;

     let raw;
-    try { raw = await callLLM({ ...cfg.primary, messages }); }
-    catch { raw = await callLLM({ ...cfg.fallback, messages }); }
+    try {
+      raw = await callLLM({ ...cfg.primary, messages });
+    } catch (e1) {
+      if (fallbackEnabled) {
+        try {
+          raw = await callLLM({ ...cfg.fallback, messages });
+        } catch (e2) {
+          if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
+          return { ok: false, error: "llm_unavailable" };
+        }
+      } else {
+        if (userMessageId) await ctx.runMutation(api.chat_actions._markAIError, { messageId: userMessageId });
+        return { ok: false, error: "llm_unavailable" };
+      }
+    }
```

> This keeps behavior simple:
>
> * **No default reply** is ever inserted on LLM failure.
> * The user message persists; it is simply marked with `aiError=true`.
> * The next context build automatically **excludes** all previous errored user messages (except the one you’re currently retrying).

---

## 5) Ensure `userMessageId` is always passed (so we can mark it)

You already do this for text sends. For media/video sends you schedule `aiReply` without the id—just pass it along.

**`convex/chat.js`** – in `sendMediaMessage`:

```diff
- await ctx.scheduler.runAfter(1500, api.chat_actions.aiReply, {
-   conversationId
- });
+ await ctx.scheduler.runAfter(1500, api.chat_actions.aiReply, {
+   conversationId,
+   userMessageId: messageId
+ });
```

…and similarly for the video path (the `3000` ms one).

(Your audio path likely already passes the `messageId` inside `transcribeAndReply`; if not, do the same there.)

---

## 6) UI: show error chip under the user message + Retry

Your `getConversation` already returns per‑message fields. Just include `aiError` in the mapping and render a small inline error under that bubble. Wire a **Retry** that calls the existing `aiReply` action with the message id—no extra server logic needed.

**`convex/chat.js`** – include the flag in the query result:

```diff
 messages: msgs.map(m => ({
   id: m._id, sender: m.sender, kind: m.kind, text: m.text,
   mediaKey: m.mediaKey, durationSec: m.durationSec, createdAt: m.createdAt,
-  userLiked: m.userLiked, aiLiked: m.aiLiked,
+  userLiked: m.userLiked, aiLiked: m.aiLiked, aiError: m.aiError,
 })),
```

**`app/chat/[conversationId]/page.js`** – minimal UI tweak:

```diff
 import { useQuery, useMutation, useAction } from "convex/react";
 import { api } from "@/convex/_generated/api";
 // ...
+const aiReply = useAction(api.chat_actions.aiReply);

 // inside the messages .map render, after the bubble content for USER messages:
 {mine && m.aiError && (
   <div className="mt-1 text-xs text-red-600 flex items-center gap-2">
     <span>Something went wrong. Please try again later.</span>
     <button
       className="underline"
       onClick={() => aiReply({ conversationId, userMessageId: m.id })}
     >
       Retry
     </button>
   </div>
 )}
```

This costs **no extra DB reads**—the error state rides on the same reactive query you already have.

---

## 7) If you want **no fallback** (primary only) now, but keep the option

Just set:

```
LLM_FALLBACK_ENABLED=0
```

…and leave the fallback credentials unset. Later, turn it on by adding the envs and flipping to `1`. No code changes.

---

## 8) Why you don’t need to “repair” history

* OpenAI‑style chat APIs tolerate multiple consecutive `user` turns; strict alternation isn’t a hard requirement.
* If you still prefer strict alternation, the **`aiError` filter** above effectively hides “orphan” user turns from the context while letting you **include the exact one** you’re retrying via `focusUserMessageId`. That keeps your model prompt clean without extra reads or a second store.

---

## 9) Optional (still simple)

* **Disable the Retry button** while a retry is in flight to prevent duplicates.
* If you want hard throttling, pass the Turnstile permit into `aiReply` and validate server‑side—but I’d keep it as is for now to avoid extra friction.

---

### TL;DR

* Add `messages.aiError?: boolean`.
* In `aiReply`, if primary (and optional fallback) fail: **patch `aiError=true` on that user message** and return `{ok:false}`—no default AI text.
* In `_getContextV2`, **skip** errored user messages **except** the one you’re answering (`focusUserMessageId`).
* UI reads the same query and shows an inline error + **Retry** that calls `aiReply` again.

This gives you the exact UX you want, keeps DB traffic minimal (one extra patch only on failure), and makes fallback a one‑line env switch.

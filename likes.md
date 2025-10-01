Great idea—and we can add “likes” with **almost zero extra complexity** and **only one DB round‑trip per like**. Below is a drop‑in blueprint that fits your current Convex + Next.js setup and your Turnstile/permit model without adding new services.

---

## The simplest possible model (no new tables)

Because a conversation only has **two actors** (user and AI), you don’t need a general “reactions” system. Add **two boolean flags** to each message:

```js
// messages table (additions)
{
  // ...existing fields...
  userLiked: v.optional(v.boolean()),   // user → likes AI messages
  aiLiked:   v.optional(v.boolean()),   // AI   → likes user messages

  // tiny denormalization to avoid extra reads on like:
  ownerUserId: v.id("users"),           // copy conversation.userId at insert time
}
```

* `userLiked` is only meaningful on `sender: "ai"` messages.
* `aiLiked` is only meaningful on `sender: "user"` messages.
* `ownerUserId` lets you **authorize with a single read** (no need to fetch the conversation just to check ownership).

**Why this is minimal**

* **No new tables, no joins, no counters.**
* Likes ride along your existing **reactive query** for messages—no extra query needed for the UI.
* Each like is **one read + one patch** (and you can make it idempotent so re‑clicks are cheap).

---

## Frontend UX (zero new queries)

* Show a heart/like button only on **AI messages** for the user.
* The AI’s likes appear as a small heart on **user messages** (read‑only for the user).
* **Optimistic UI**: flip the local heart immediately; if the mutation fails, revert.
* **No Turnstile/permit** needed for likes (they don’t trigger paid APIs). Keep it snappy.

---

## Backend API (two tiny mutations; one internal mutation change)

### 1) Let the user like an AI message

```
likeMessage({ messageId })  // Mutation
```

**Steps (server)**

1. `getAuthUserId()`
2. `msg = db.get(messageId)`
3. Guard: `msg.ownerUserId === userId` AND `msg.sender === 'ai'`
4. Idempotent set: `userLiked = true` (or toggle if you want un/like)
5. `db.patch(messageId, { userLiked: true })`

**DB traffic**: 1 read + 1 write.

> *Optional toggle:* if you want users to un‑like, patch `userLiked: !msg.userLiked` instead. Functionally the same DB cost.

### 2) AI liking the user’s latest message (1-in-4)

Integrate with your **existing AI reply path** so it’s **zero extra calls** most of the time.

You already do something like:

```
aiReply(conversationId, lastUserMessageId)  // Action
  → decide response
  → insert AI message (mutation)
```

Change it to:

```
applyAIResponse({ conversationId, lastUserMessageId, response, maybeLikeUserMsg }) // Mutation
  - Insert AI message (text/media/audio)
  - If maybeLikeUserMsg === true → patch lastUserMessageId.aiLiked = true
```

**Where to pick the 1/4 chance?**
Do it **in the action**, but make it **deterministic** so retries don’t flip outcomes:

```
shouldLike = (hash(lastUserMessageId) % 4) === 0
```

Then pass `maybeLikeUserMsg = shouldLike` into `applyAIResponse`.
This keeps **both writes in one mutation** (insert AI message + maybe like the user’s last message).
**DB traffic**: still just **one mutation** call for the reply path; no extra round‑trip.

> Deterministic is important: if your action retries, you won’t “sometimes like, sometimes not”.

---

## Query impact (none)

Your existing `getConversation(conversationId)` reactive query should include `userLiked` and `aiLiked` in the message fields it returns. The UI will auto‑refresh and show hearts without any additional queries.

---

## Rate limiting & security (keep it light)

* **No Turnstile** on likes.
* Optional coarse rate limit: e.g., **60 likes / minute / user** using your existing tiny TTL doc (same pattern as messages). If omitted, you’re still safe—likes don’t call paid APIs.
* Server enforces:

    * Users can only like **AI** messages from **their own** conversation.
    * Only server code can set `aiLiked` (never exposed as a public mutation).

---

## Failure & idempotency

* **User like**: set semantics (`userLiked=true`) are naturally idempotent. Re‑clicks don’t add cost.
* **AI like**: deterministic 1/4 decision keyed to `lastUserMessageId` ensures the same outcome across retries. If the mutation runs twice, `aiLiked=true` remains true—also idempotent.

---

## Where it fits in your docs (drop‑in)

* **Schema:** extend your `messages` doc as above; set `ownerUserId` at insert time in your existing `_insertAIText/_insertAIMediaAndDec/_insertAIAudioAndDec` and user‑message insert.
* **convex/chat.js**

    * Add `likeMessage` mutation.
    * Ensure message inserts populate `ownerUserId`.
* **convex/chat_actions.js**

    * In `aiReply`, after you decide `response`, compute `shouldLike` deterministically.
    * Call a **single** mutation `applyAIResponse(...)` to both insert the AI message and (maybe) set `aiLiked=true` on `lastUserMessageId`.
* **Frontend** (`app/chat/[conversationId]/page.js`)

    * Heart button on AI messages → call `likeMessage(messageId)`; optimistic UI.

---

## Optional extras (only if you want them later)

* **Analytics**: write a lightweight `likes_audit` doc only for A/B work; otherwise skip.
* **UI polish**: show “liked by her” micro‑copy under user messages when `aiLiked` is true.
* **Signal for LLM**: you may optionally pass “user liked previous AI message” into the next prompt to tune behavior (no extra queries—field is in the message object you already fetch).

---

### TL;DR

* Add `userLiked`, `aiLiked`, and `ownerUserId` to **messages**.
* **User like** = 1 read + 1 patch.
* **AI like** = folded into the **existing AI‑reply insertion mutation** (no extra round‑trip) with a **deterministic 1/4 rule**.
* No new tables, no new queries, no Turnstile friction—and everything remains fully reactive.

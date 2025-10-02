Great question—there’s a **zero‑backend** way to get a WhatsApp‑style typing indicator that turns **on** the moment your user’s message is *saved* and turns **off** the moment the AI’s reply is *saved*. You already have everything you need in the reactive query:

* After you save a user message, your `messages` array ends with a `sender: "user"`.
* When the AI answers, the last message becomes `sender: "ai"` (text/image/video/audio) **or** you mark the last user message with `aiError: true` on failure.

So the client can **derive** “typing” from the latest message:

> **Typing is ON** when the last message in `data.messages` is from the **user** and **does not** have `aiError` set.
> **Typing is OFF** otherwise (AI replied or error flagged).

This gives you the right UX with **no extra DB fields or writes** and works for **text, images, videos, and audio** (your senders already update `lastMessageSender`/`messages` consistently).

---

## Option A (recommended): Pure client logic (no backend changes)

### 1) Add a tiny `TypingBubble` right inside your `ConversationPage`

Drop this **component** into `app/chat/[conversationId]/page.js` (anywhere near the top of the file):

```jsx
function TypingBubble({ avatarUrl, girlName }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${girlName || "Assistant"} is typing`}
      className="flex items-end gap-2"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={girlName || "Profile"}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
      )}

      <div className="bg-gray-100 text-gray-900 rounded-3xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>

      {/* Local, scoped CSS (no global styles required) */}
      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #9ca3af; /* gray-400 */
          display: inline-block;
          animation: blink 1.4s infinite both;
        }
        .typing-dot:nth-child(2) { animation-delay: .2s; }
        .typing-dot:nth-child(3) { animation-delay: .4s; }
        @keyframes blink {
          0% { opacity: .2; transform: translateY(0px); }
          20% { opacity: 1; transform: translateY(-1px); }
          100% { opacity: .2; transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
```

### 2) Compute the indicator from your existing `messages`

In `ConversationPage`, add:

```jsx
// right after your other hooks in ConversationPage
const lastMsg = data?.messages?.[data.messages.length - 1] || null;
const isAiTyping = !!lastMsg && lastMsg.sender === "user" && !lastMsg.aiError;

// optional: keep the view pinned to bottom when typing turns on
useEffect(() => {
  if (isAiTyping) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [isAiTyping]);
```

### 3) Render the typing bubble just above `bottomRef`

Inside the message list (near where you map `data.messages`), just **before** `<div ref={bottomRef} />`, add:

```jsx
{isAiTyping && (
  <div className="flex items-end gap-2">
    <div className="flex flex-col items-start max-w-[70%]">
      <TypingBubble avatarUrl={avatarUrl} girlName={data?.girlName} />
      <div className="flex items-center gap-1.5 mt-1 px-2">
        <span className="text-[11px] text-gray-400">escribiendo…</span>
      </div>
    </div>
  </div>
)}
```

That’s it. The indicator will:

* **Turn ON** as soon as your reactive query includes the just‑saved user message.
* **Turn OFF** when the AI message is inserted (any kind) **or** when `aiError` is set on the user message.

> Why this works well:
>
> * No new tables/fields, no extra network calls, and it **covers all send types** (text/media/audio).
> * Uses your existing failure signaling (`aiError`) to **avoid getting stuck** if the AI fails.

---

## Option B (optional): Server‑driven flag (if you want stronger semantics later)

If you ever want to handle trickier cases (e.g., multiple user messages queued before any AI reply) without writing client logic, you can add a transient flag on the conversation and flip it **inside existing patches** (still no extra round‑trips):

1. **Schema**: add a boolean to `conversations`:

```js
aiTyping: v.optional(v.boolean()),
```

2. **Turn ON** in mutations that save a user message (you already patch the conversation there):

```js
await ctx.db.patch(conversationId, {
  // ...existing fields
  aiTyping: true,
});
```

3. **Turn OFF** anywhere you insert an AI message **or** mark error:

* In `_insertAIText`, `_insertAIMediaAndDec`, `_insertAIAudioAndDec`: include `aiTyping: false` in the same `patch` you already perform.
* In `_markAIError`: after setting `aiError: true` on the user message, also patch the message’s conversation to `aiTyping: false`.

4. **Client**: read `data.aiTyping` from your `getConversation` query and render the same `TypingBubble` when `true`.

This still avoids extra calls because you piggy‑back on patches you’re already doing.

---

### Tiny QA checklist

* ✅ **Sends (text, image, video, audio)**: last message will be from `"user"` → shows typing.
* ✅ **AI responds**: last message becomes `"ai"` → hides typing.
* ✅ **AI error**: you set `aiError` on the user message → client hides typing.
* ✅ **Strict Mode double renders**: safe—everything is driven by the reactive query.
* ✅ **Accessibility**: `role="status"` + `aria-live="polite"` signals “typing” to assistive tech.

---

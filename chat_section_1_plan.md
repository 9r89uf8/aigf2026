Perfect—let’s ship **Section 1 — Core Text Chat (E2E)**.
Below is a **focused blueprint + essential code** that drops straight into your existing structure. It keeps the surface area tiny, uses **one reactive query** for the chat screen, enforces **free text quotas**, and sends an **AI text reply** (DeepSeek → Together.ai fallback). It also wires **Turnstile** the right way (server‑verified) and queues the AI work with Convex’s scheduler so your mutation stays fast and deterministic. ([Convex Developer Hub][1])

---

## What you’ll build in this section

**User‑facing**

* **Thread list** per user: last message preview, timestamp, unread dot.
* **Conversation screen** (1 reactive query): last N messages, `freeRemaining.text`, `premiumActive`.
* **Composer**: Turnstile‑protected; disabled when free text quota is 0 (and not premium).
* **Upgrade banner** when quota exhausted (opens Checkout).

**Server**

* `startConversation(girlId)`
* `getThreads()` and `getConversation(conversationId)`
* `sendMessage(conversationId, text, nonceId)` (enforce/decrement quota, write user msg, schedule AI reply)
* `chat_actions.aiReply(...)` (DeepSeek → Together fallback) → **text only** in this section

**Security**

* Turnstile **server‑side validation** using a **nonce**: client exchanges the widget token for a short‑lived server nonce, then `sendMessage` must consume the nonce. This keeps verification server‑enforced even though mutations can’t call actions synchronously. ([Cloudflare Docs][2])

---

## 1) Schema additions (Convex)

Append to `convex/schema.js`. (JS only.)

```js
// convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ...existing tables...

  conversations: defineTable({
    userId: v.id("users"),
    girlId: v.id("girls"),
    freeRemaining: v.object({
      text: v.number(),
      media: v.number(),
      audio: v.number(),
    }),
    lastMessageAt: v.number(),        // ms epoch
    lastMessagePreview: v.string(),   // denormalized for thread list
    lastReadAt: v.number(),           // ms epoch
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_girl", ["userId", "girlId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    sender: v.union(v.literal("user"), v.literal("ai")),
    kind: v.literal("text"),          // Section 1 = text only
    text: v.string(),
    createdAt: v.number(),            // ms epoch
  })
    .index("by_conversation_ts", ["conversationId", "createdAt"]),

  // Turnstile nonces (short-lived)
  turnstile_nonces: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),            // ms epoch, ~2 minutes
  }).index("by_user", ["userId"]),
});
```

**Why denormalize `lastMessage*`?**
Thread list becomes a single read over `conversations` (no joins), minimizing DB calls. The conversation view reads messages reactively; Convex automatically pushes updates. ([Convex Developer Hub][1])

---

## 2) Constants (free quotas)

Create `convex/chat.config.js`:

```js
// convex/chat.config.js
export const FREE_TEXT_PER_GIRL = 10;   // your free-quota policy
export const FREE_MEDIA_PER_GIRL = 2;   // future sections
export const FREE_AUDIO_PER_GIRL = 3;   // future sections
export const CONTEXT_TURNS = 8;         // AI context window
```

---

## 3) Server: queries & mutations (`convex/chat.js`)

```js
// convex/chat.js
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  FREE_TEXT_PER_GIRL, FREE_MEDIA_PER_GIRL, FREE_AUDIO_PER_GIRL,
} from "./chat.config.js";

// Helper: compute premium from profile (one read; no external calls)
async function getPremiumActive(ctx, userId) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .first();
  return !!(profile?.premiumUntil && profile.premiumUntil > Date.now());
}

/** THREAD LIST (per-user) */
export const getThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const threads = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", q => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Attach minimal girl info (avoid heavy joins; no signing here)
    const results = [];
    for (const c of threads) {
      const girl = await ctx.db.get(c.girlId);
      results.push({
        conversationId: c._id,
        girlId: c.girlId,
        girlName: girl?.name ?? "Unknown",
        lastMessagePreview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt,
        unread: c.lastMessageAt > (c.lastReadAt || 0),
      });
    }
    return results;
  },
});

/** CONVERSATION SCREEN (one reactive query) */
export const getConversation = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, { conversationId, limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    const premiumActive = await getPremiumActive(ctx, userId);

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);
    msgs.reverse(); // ascending for UI

    return {
      conversationId,
      girlId: convo.girlId,
      freeRemaining: { text: convo.freeRemaining.text },
      premiumActive,
      messages: msgs.map(m => ({
        id: m._id, sender: m.sender, text: m.text, createdAt: m.createdAt,
      })),
    };
  },
});

/** Create or return existing conversation (sets initial free counters) */
export const startConversation = mutation({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // If convo exists, return it
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_girl", q => q.eq("userId", userId).eq("girlId", girlId))
      .first();
    if (existing) return { conversationId: existing._id };

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId, girlId,
      freeRemaining: {
        text: FREE_TEXT_PER_GIRL,
        media: FREE_MEDIA_PER_GIRL,
        audio: FREE_AUDIO_PER_GIRL,
      },
      lastMessageAt: now,
      lastMessagePreview: "",
      lastReadAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { conversationId };
  },
});

/** Mark read (for unread dot) */
export const markRead = mutation({
  args: { conversationId: v.id("conversations"), at: v.number() },
  handler: async (ctx, { conversationId, at }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const c = await ctx.db.get(conversationId);
    if (!c || c.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(conversationId, { lastReadAt: at, updatedAt: Date.now() });
    return { ok: true };
  },
});

/** Insert AI message (internal; called by action) */
export const _insertAIMessage = internalMutation({
  args: { conversationId: v.id("conversations"), text: v.string() },
  handler: async (ctx, { conversationId, text }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "text", text, createdAt: now,
    });
    const preview = text.length > 140 ? text.slice(0, 140) + "…" : text;
    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});
```

---

## 4) Send message (mutation) with **quota + Turnstile nonce**

> Mutations cannot synchronously call actions; schedule AI work and use a Turnstile **nonce** to guarantee server‑side validation before the write. ([Answer Overflow][3])

```js
// convex/chat.js (continued)
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    nonceId: v.id("turnstile_nonces"), // minted by turnstile.verifyAndMintNonce
  },
  handler: async (ctx, { conversationId, text, nonceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    if (!text.trim()) throw new Error("Empty message");

    // Enforce Turnstile: nonce must exist, belong to user, and be fresh
    const nonce = await ctx.db.get(nonceId);
    if (!nonce || nonce.userId !== userId || nonce.expiresAt < Date.now()) {
      throw new Error("Security check failed");
    }
    // Consume nonce (single-use)
    await ctx.db.delete(nonceId);

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    // Premium check
    const premiumActive = await getPremiumActive(ctx, userId);

    // Quota enforcement for free users (text only in Section 1)
    if (!premiumActive) {
      if (convo.freeRemaining.text <= 0) {
        throw new Error("Free text quota exhausted");
      }
      await ctx.db.patch(conversationId, {
        freeRemaining: {
          ...convo.freeRemaining,
          text: convo.freeRemaining.text - 1,
        },
      });
    }

    const now = Date.now();
    const userMsgId = await ctx.db.insert("messages", {
      conversationId, sender: "user", kind: "text", text: text.trim(), createdAt: now,
    });

    const preview = text.length > 140 ? text.slice(0, 140) + "…" : text;
    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: now,
      updatedAt: now,
    });

    // Schedule AI reply action (runs outside this transaction)
    await ctx.scheduler.runAfter(0, api.chat_actions.aiReply, {
      conversationId, userMessageId: userMsgId,
    }); // transactional scheduling; runs only if mutation commits. :contentReference[oaicite:4]{index=4}

    return { ok: true };
  },
});
```

---

## 5) Turnstile server‑side verification (nonce mint)

Add to your existing `convex/turnstile.js`:

```js
// convex/turnstile.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const verifyAndMintNonce = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Call Cloudflare Siteverify (server-side is mandatory) :contentReference[oaicite:5]{index=5}
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }).then((res) => res.json());

    if (!r.success) throw new Error("Turnstile verification failed");

    // Mint short-lived nonce stored in DB (2 minutes)
    const now = Date.now();
    const expiresAt = now + 2 * 60 * 1000;
    const nonceId = await ctx.runMutation({
      args: {},
      handler: async (mctx) =>
        mctx.db.insert("turnstile_nonces", { userId, createdAt: now, expiresAt }),
    });
    return { nonceId };
  },
});
```

> You **must** validate Turnstile tokens on the server; the widget alone is not protection. This pattern lets `sendMessage` require server‑minted proof of verification. ([Cloudflare Docs][2])

---

## 6) AI reply action with fallback (`convex/chat_actions.js`)

* Minimal **OpenAI‑compatible** request (primary DeepSeek → fallback Together.ai).
* Internal mutation `_insertAIMessage` writes the AI reply.
* Very small context window (last 8 turns) to keep costs down.

```js
// convex/chat_actions.js
import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper: small context slice (text only)
export const _getContext = internalQuery({
  args: { conversationId: v.id("conversations"), limit: v.number() },
  handler: async (ctx, { conversationId, limit }) => {
    const convo = await ctx.db.get(conversationId);
    const girl = convo ? await ctx.db.get(convo.girlId) : null;

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    const history = msgs.reverse().map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    return {
      persona: girl?.personaPrompt ?? "Be friendly and concise.",
      history,
    };
  },
});

async function callOpenAICompat({ baseUrl, apiKey, model, messages }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 220,
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty LLM reply");
  return text;
}

export const aiReply = action({
  args: {
    conversationId: v.id("conversations"),
    userMessageId: v.id("messages"),
  },
  handler: async (ctx, { conversationId }) => {
    const { persona, history } = await ctx.runQuery(api.chat_actions._getContext, {
      conversationId, limit: 8,
    });

    const messages = [
      { role: "system", content: persona },
      ...history,
      // No tool calls in Section 1; text reply only.
    ];

    // Primary: DeepSeek (OpenAI-compatible). Fallback: Together.ai. :contentReference[oaicite:7]{index=7}
    const cfg = {
      primary: {
        baseUrl: process.env.LLM_BASE_URL_PRIMARY,     // e.g. https://api.deepseek.com
        apiKey: process.env.LLM_API_KEY_PRIMARY,
        model: process.env.LLM_MODEL_PRIMARY,          // e.g. deepseek-chat
      },
      fallback: {
        baseUrl: process.env.LLM_BASE_URL_FALLBACK,    // e.g. https://api.together.xyz
        apiKey: process.env.LLM_API_KEY_FALLBACK,
        model: process.env.LLM_MODEL_FALLBACK,         // e.g. meta-llama/...
      },
    };

    let text;
    try {
      text = await callOpenAICompat({ ...cfg.primary, messages });
    } catch (e) {
      // Fallback on transient failures
      text = await callOpenAICompat({ ...cfg.fallback, messages });
    }

    await ctx.runMutation(api.chat._insertAIMessage, { conversationId, text });
    return { ok: true };
  },
});
```

> **Why schedule the action?** Convex guarantees the scheduled function only runs if the mutation commits, and actions are the right place to call third‑party APIs. ([Convex][4])

---

## 7) Client: Thread list & Conversation screen (Next.js 15)

### Thread list — `app/chat/page.js`

```jsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function ThreadsPage() {
  const threads = useQuery(api.chat.getThreads) || [];

  return (
    <div className="max-w-screen-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Chats</h1>
      <ul className="divide-y">
        {threads.map(t => (
          <li key={t.conversationId} className="py-3">
            <Link href={`/chat/${t.conversationId}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.girlName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(t.lastMessageAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {t.lastMessagePreview || "Say hi 👋"}
                </div>
              </div>
              {t.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Conversation screen — `app/chat/[conversationId]/page.js`

```jsx
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";

function Turnstile({ onToken }) {
  // Minimal inline Turnstile loader; use your existing widget if you prefer
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.onload = () => {
      window.turnstile?.render("#cf-turnstile", {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: onToken,
      });
    };
    document.body.appendChild(s);
    return () => s.remove();
  }, [onToken]);
  return <div id="cf-turnstile" className="my-2" />;
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const data = useQuery(api.chat.getConversation, { conversationId }) || null;

  const verify = useAction(api.turnstile.verifyAndMintNonce);
  const send = useMutation(api.chat.sendMessage);
  const markRead = useMutation(api.chat.markRead);

  const [text, setText] = useState("");
  const [nonceId, setNonceId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (data) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markRead({ conversationId, at: Date.now() });
    }
  }, [data, conversationId, markRead]);

  const quotaOut = data && !data.premiumActive && data.freeRemaining.text <= 0;

  async function onSend() {
    if (!text.trim() || !nonceId) return;
    await send({ conversationId, text, nonceId });
    setText(""); setNonceId(null); // force user to solve Turnstile again
  }

  return (
    <div className="max-w-screen-sm mx-auto h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(data?.messages || []).map(m => (
          <div key={m.id} className={`max-w-[80%] p-2 rounded ${m.sender === "user" ? "bg-blue-500 text-white self-end ml-auto" : "bg-gray-200"}`}>
            <div className="text-sm whitespace-pre-wrap">{m.text}</div>
            <div className="text-[10px] opacity-60 mt-1">
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!data?.premiumActive && quotaOut && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-sm">
          Free text messages for this girl are used up.{" "}
          <a href="/plans" className="text-blue-600 underline">Upgrade</a> for unlimited messages.
        </div>
      )}

      <div className="p-3 border-t space-y-2">
        {/* Turnstile minted per message send to enforce server verification */}
        <Turnstile onToken={async (token) => {
          const res = await verify({ token });
          setNonceId(res.nonceId);
        }} />
        <div className="flex gap-2">
          <input
            className="flex-1 input"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={quotaOut}
          />
          <button className="btn" onClick={onSend} disabled={!text.trim() || quotaOut || !nonceId}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Why this UX?** Composer stays usable but requires a **fresh nonce** (new Turnstile token) before each send that hits the LLM. This keeps abuse down while still smooth to use. Cloudflare requires server validation; the nonce lets your mutation **enforce** that validation. ([Cloudflare Docs][2])

---

## 8) Start a conversation from a girl profile

Add a simple client call (e.g., a “Message” button on the girl’s profile):

```jsx
// components/StartChatButton.js
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function StartChatButton({ girlId }) {
  const router = useRouter();
  const start = useMutation(api.chat.startConversation);
  return (
    <button
      className="btn"
      onClick={async () => {
        const { conversationId } = await start({ girlId });
        router.push(`/chat/${conversationId}`);
      }}
    >
      Message
    </button>
  );
}
```

---

## 9) Upgrade CTA (one‑time payment; no webhooks)

Your `plans` page already starts Checkout. On success, your existing `app/checkout/success/page.js` should retrieve the `session_id` and call `payments_actions.checkoutVerify` to grant premium; the chat query (`getConversation`) will immediately reflect `premiumActive` and re‑enable the composer. **Stripe recommends webhooks**, but using `success_url` + **retrieve Session** is an accepted (with caveats) path for simple one‑time unlocks. ([Stripe Docs][5])

---

## 10) Acceptance tests (Definition of Done)

1. **Send text → AI text reply** appears in the same view, without refresh. (Reactive query.) ([Convex Developer Hub][1])
2. **Free text quota** decrements exactly once per user send; never goes negative (try concurrent sends).
3. **Premium** users (simulate by setting `premiumUntil` > now) bypass quota entirely.
4. **Thread list** shows last preview & unread dot (send from AI, check dot toggles after `markRead`).
5. **Turnstile**: if you tamper and skip `verifyAndMintNonce`, `sendMessage` fails (“Security check failed”).
6. **AI fallback** works: if primary LLM env is wrong, Together.ai responds.
7. **Hard refresh** preserves everything (all state server‑backed).

---

## 11) Minimal env for Section 1

```
# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# LLMs (OpenAI-compatible)
LLM_BASE_URL_PRIMARY=https://api.deepseek.com
LLM_API_KEY_PRIMARY=...
LLM_MODEL_PRIMARY=deepseek-chat

LLM_BASE_URL_FALLBACK=https://api.together.xyz
LLM_API_KEY_FALLBACK=...
LLM_MODEL_FALLBACK=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

---

## 12) Notes & rationale (why this shape)

* **One reactive query** (`getConversation`) drives the screen; Convex pushes updates automatically. No polling, no client cache gymnastics. ([Convex][6])
* **Server‑validated Turnstile** is required; the **nonce** makes the validation enforceable by the mutation while keeping the mutation deterministic (no external calls inside). ([Cloudflare Docs][2])
* **AI work** runs in an **action** scheduled via the **scheduler**; the schedule is committed only if the user message write commits—exactly what we want. ([Convex Developer Hub][7])
* Keep the **context** short (last 8 turns) to control spend and latency.
* **Denormalized last message** keeps the **thread list** cheap.

---

## 13) Next section hooks (you’ll extend later)

* **Media messages**: add `kind: 'image'|'video'|'audio'` to `messages`, extend file signing and AI selection from `girl_media` (`isReplyAsset=true`).
* **Pagination**: switch message retrieval to a **paginated query** when needed (Convex `paginate` + `usePaginatedQuery`). ([Convex Developer Hub][8])
* **Typing indicator / delivery states**: optional; keep out for now.

---



[1]: https://docs.convex.dev/realtime?utm_source=chatgpt.com "Realtime | Convex Developer Hub"
[2]: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/?utm_source=chatgpt.com "Validate the token · Cloudflare Turnstile docs"
[3]: https://www.answeroverflow.com/m/1326606524243644509?utm_source=chatgpt.com "mutation / action calling - Convex Community"
[4]: https://www.convex.dev/can-do/scheduled-functions-and-crons?utm_source=chatgpt.com "Scheduled functions & crons: Convex can do that"
[5]: https://docs.stripe.com/payments/checkout/custom-success-page?utm_source=chatgpt.com "Customize redirect behavior"
[6]: https://www.convex.dev/realtime?utm_source=chatgpt.com "Realtime, all the time"
[7]: https://docs.convex.dev/scheduling/scheduled-functions?utm_source=chatgpt.com "Scheduled Functions | Convex Developer Hub"
[8]: https://docs.convex.dev/database/pagination?utm_source=chatgpt.com "Paginated Queries | Convex Developer Hub"

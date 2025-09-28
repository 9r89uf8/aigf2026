Awesome—Section 2 is where the chat starts to *feel* real. Below is a **lean blueprint + essential code** to add **images & video** end‑to‑end, while keeping the system simple, fast, and cheap.

---

## Section 2 — Media in Chat (Images & Video)

### Goals

* Users can **send images/videos** (optionally with a caption).
* **Preview** before sending.
* **Validate size**: images ≤ **3 MB**, videos ≤ **5 MB** (client + server).
* LLM **understands what the user sent** without ever seeing long URLs.
* AI can **reply with media** chosen from **her assets** (`girl_media.isReplyAsset = true`).
* **Deduct `freeRemaining.media` only when the AI sends media** (premium bypass).
* **No DB spam**: keep a single reactive query; sign media URLs in **one batch**.
* **Permit mode** stays (no visible CAPTCHA).

---

## 0) Key decisions (kept very simple)

1. **When to pick media** → **After** the LLM decides.

    * The LLM returns `{ type: 'text'|'image'|'video', text?: string, tags?: string[] }`.
    * If it chooses media, the **server** picks a best‑fit asset (random/tagged) and sends it.

2. **How the LLM “sees” media** → **Short placeholders**, not URLs.

    * User image → `"User sent an IMAGE. caption: '...'"`
    * User video → `"User sent a VIDEO. caption: '...'"`
    * Assistant media → `"Assistant sent an IMAGE/VIDEO."` (optional)
    * Result: no long URLs in prompts; simple, robust, cheap.

3. **Quota policy**

    * **Only decrement** `conversations.freeRemaining.media` when **AI sends media**.
    * If `media` quota is 0 (and not premium), AI **falls back to text** with a friendly CTA.

---

## 1) Schema changes

**`convex/schema.js`** — extend `messages` to support media:

```js
messages: defineTable({
  conversationId: v.id("conversations"),
  sender: v.union(v.literal("user"), v.literal("ai")),
  kind: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
  text: v.optional(v.string()),          // caption or message text
  mediaKey: v.optional(v.string()),      // S3 key for image/video
  createdAt: v.number(),
})
.index("by_conversation_ts", ["conversationId", "createdAt"]);
```

> No other tables change. We’ll keep using `girl_media` for AI reply assets.

---

## 2) S3 actions for chat uploads

**Flow:** sign → upload to S3 → finalize (HEAD validate) → send mutation.

**`convex/s3.js`** (essential parts)

```js
// convex/s3.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import crypto from "node:crypto";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_S3_BUCKET;

const IMAGE_TYPES = new Set(["image/jpeg","image/png","image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4","video/webm"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5MB

function validateKindAndType(kind, contentType) {
  if (kind === "image" && !IMAGE_TYPES.has(contentType)) throw new Error("Unsupported image type");
  if (kind === "video" && !VIDEO_TYPES.has(contentType)) throw new Error("Unsupported video type");
}

export const signChatUpload = action({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { conversationId, kind, contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");

    // Key: chat/{conversationId}/user/{uuid.ext}
    const ext = contentType.split("/")[1] || "bin";
    const key = `chat/${conversationId}/user/${crypto.randomUUID()}.${ext}`;

    // PUT presign (5 minutes)
    const uploadUrl = await getSignedUrl(
      s3,
      new (await import("@aws-sdk/client-s3")).PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 }
    );

    return { uploadUrl, objectKey: key };
  },
});

export const finalizeChatUpload = action({
  args: {
    objectKey: v.string(),
    kind: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (_ctx, { objectKey, kind }) => {
    // HEAD to confirm it exists & validate size/content-type
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    const size = head.ContentLength ?? 0;
    const contentType = head.ContentType ?? "";

    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");

    return { ok: true, size, contentType };
  },
});
```

> We validate **both** before and after upload. If you want belt‑and‑suspenders, delete the object on failure in `finalizeChatUpload`.

---

## 3) CloudFront signed **batch** URLs

We’ll sign **once** per screen for all media keys currently visible.

**`convex/cdn.js`** (batch signer; adapt to your existing signer)

```js
// convex/cdn.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "node:crypto";

const CF_DOMAIN = process.env.CF_DOMAIN; // e.g., https://cdn.example.com
const CF_KEY_PAIR_ID = process.env.CF_KEY_PAIR_ID;
const CF_PRIVATE_KEY = process.env.CF_PRIVATE_KEY?.replace(/\\n/g, "\n"); // if stored escaped

function signUrl(url, expires) {
  // Simple canned-policy RSA-SHA1 signature for CloudFront signed URLs.
  // If you already have a helper here, reuse that instead.
  const policy = JSON.stringify({
    Statement: [{ Resource: url, Condition: { DateLessThan: { "AWS:EpochTime": expires } } }],
  });

  const signer = crypto.createSign("RSA-SHA1");
  signer.update(policy);
  const signature = signer.sign(CF_PRIVATE_KEY, "base64")
    .replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");

  const policyB64 = Buffer.from(policy).toString("base64")
    .replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}Expires=${expires}&Key-Pair-Id=${CF_KEY_PAIR_ID}&Signature=${signature}&Policy=${policyB64}`;
}

export const signViewBatch = action({
  args: { keys: v.array(v.string()) },
  handler: async (_ctx, { keys }) => {
    const unique = Array.from(new Set(keys)).filter(Boolean);
    const expires = Math.floor(Date.now() / 1000) + 5 * 60; // 5 min
    const map = {};
    for (const k of unique) {
      const url = `${CF_DOMAIN}/${encodeURI(k)}`;
      map[k] = signUrl(url, expires);
    }
    return { urls: map, expiresAt: expires * 1000 };
  },
});
```

---

## 4) Server: send **media** message (user → AI)

**`convex/chat.js`** — add `sendMediaMessage` (does NOT decrement free media; Section 2 decrements only on AI media replies):

```js
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendMediaMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    objectKey: v.string(),
    caption: v.optional(v.string()),
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, kind, objectKey, caption, permitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Security: consume permit
    const permit = await ctx.db.get(permitId);
    if (!permit || permit.userId !== userId || permit.expiresAt < Date.now() || permit.usesLeft <= 0)
      throw new Error("Security check failed");
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "user", kind, mediaKey: objectKey,
      text: (caption || "").trim() || undefined, createdAt: now,
    });

    await ctx.db.patch(conversationId, {
      lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
      lastMessageAt: now, updatedAt: now,
    });

    // Schedule AI reply
    await ctx.scheduler.runAfter(0, api.chat_actions.aiReply, {
      conversationId, userMessageId: null, // unused here
    });

    return { ok: true };
  },
});
```

---

## 5) AI action: media‑aware replies + quota decrement

**`convex/chat_actions.js`** — upgrade context + decision + media insert

```js
import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { CONTEXT_TURNS } from "./chat.config.js";

/** Context builder with media placeholders */
export const _getContextV2 = internalQuery({
  args: { conversationId: v.id("conversations"), limit: v.number() },
  handler: async (ctx, { conversationId, limit }) => {
    const convo = await ctx.db.get(conversationId);
    const girl = convo ? await ctx.db.get(convo.girlId) : null;

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    const history = msgs.reverse().map((m) => {
      if (m.kind === "text") {
        return { role: m.sender === "user" ? "user" : "assistant", content: m.text || "" };
      }
      const tag = m.kind.toUpperCase();
      const cap = m.text ? ` caption: "${m.text}"` : "";
      const content = `${m.sender === "user" ? "User" : "Assistant"} sent a ${tag}.${cap}`;
      return { role: m.sender === "user" ? "user" : "assistant", content };
    });

    const persona = (girl?.personaPrompt || "You are a warm, flirty girlfriend.")
      + "\nRules:\n"
      + "- If the user explicitly asks for a photo/video, prefer media response.\n"
      + "- Reply NATURALLY like a human girlfriend. Keep messages concise.\n"
      + "- Decide the best reply type (text/image/video). For image/video, include a short caption.\n"
      + "- Respond ONLY in JSON with keys: {\"type\":\"text|image|video\",\"text\":\"...\",\"tags\":[\"...\"]}\n"
      + "- If unsure, return {\"type\":\"text\",\"text\":\"...\"}.";

    return { persona, history, girlId: convo?.girlId, conversationId };
  },
});

async function callLLM({ baseUrl, apiKey, model, messages }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 220 }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

function parseDecision(s) {
  // Find first JSON object
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return { type: "text", text: s.slice(0, 180) };
  try {
    const obj = JSON.parse(m[0]);
    const type = obj.type === "image" || obj.type === "video" ? obj.type : "text";
    const text = typeof obj.text === "string" && obj.text.trim() ? obj.text.trim() : "";
    const tags = Array.isArray(obj.tags) ? obj.tags.slice(0, 3) : [];
    return { type, text, tags };
  } catch {
    return { type: "text", text: s.slice(0, 180) };
  }
}

/** Insert AI text */
export const _insertAIText = internalMutation({
  args: { conversationId: v.id("conversations"), text: v.string() },
  handler: async (ctx, { conversationId, text }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "text", text, createdAt: now,
    });
    await ctx.db.patch(conversationId, {
      lastMessagePreview: text.length > 140 ? text.slice(0, 140) + "…" : text,
      lastMessageAt: now, updatedAt: now,
    });
  },
});

/** Insert AI media + decrement media quota if not premium */
export const _insertAIMediaAndDec = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    mediaKey: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { conversationId, kind, mediaKey, caption }) => {
    const now = Date.now();
    // Insert media message
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind, mediaKey, text: caption || undefined, createdAt: now,
    });

    // Decrement media quota if not premium
    const convo = await ctx.db.get(conversationId);
    if (!convo) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", convo.userId))
      .first();
    const premium = !!(profile?.premiumUntil && profile.premiumUntil > Date.now());

    await ctx.db.patch(conversationId, {
      freeRemaining: premium
        ? convo.freeRemaining
        : { ...convo.freeRemaining, media: Math.max(0, convo.freeRemaining.media - 1) },
      lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
      lastMessageAt: now, updatedAt: now,
    });
  },
});

export const aiReply = action({
  args: { conversationId: v.id("conversations"), userMessageId: v.optional(v.id("messages")) },
  handler: async (ctx, { conversationId }) => {
    const { persona, history, girlId } = await ctx.runQuery(api.chat_actions._getContextV2, {
      conversationId, limit: CONTEXT_TURNS,
    });

    const messages = [{ role: "system", content: persona }, ...history];

    const cfg = {
      primary: { baseUrl: process.env.LLM_BASE_URL_PRIMARY, apiKey: process.env.LLM_API_KEY_PRIMARY, model: process.env.LLM_MODEL_PRIMARY },
      fallback: { baseUrl: process.env.LLM_BASE_URL_FALLBACK, apiKey: process.env.LLM_API_KEY_FALLBACK, model: process.env.LLM_MODEL_FALLBACK },
    };

    let raw;
    try { raw = await callLLM({ ...cfg.primary, messages }); }
    catch { raw = await callLLM({ ...cfg.fallback, messages }); }

    const decision = parseDecision(raw);

    // If LLM chose text, or the user is out of media quota, send text.
    // Check quota (only matters when AI sends media).
    const convo = await ctx.runQuery(api.chat.getConversation, { conversationId, limit: 1 });
    const outOfMedia = !convo.premiumActive && convo.freeRemaining?.media <= 0;

    if (decision.type === "text" || outOfMedia) {
      const fallbackText = decision.text || "I’m here with you 💕";
      await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
      return { ok: true, kind: "text" };
    }

    // Choose an asset of the requested kind from girl's reply assets
    const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, { girlId, kind: decision.type });
    if (!assets?.length) {
      // No assets available; fall back to text gracefully
      const fallbackText = decision.text || "I don’t have a media to share right now, but I’m all yours 🥰";
      await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
      return { ok: true, kind: "text" };
    }

    // Pick by tag if any; else random
    let chosen = assets[Math.floor(Math.random() * assets.length)];
    if (decision.tags && decision.tags.length) {
      const tagged = assets.filter(a =>
        decision.tags.some(t => (a.text || "").toLowerCase().includes(t.toLowerCase()))
      );
      if (tagged.length) chosen = tagged[Math.floor(Math.random() * tagged.length)];
    }

    await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
      conversationId,
      kind: decision.type,
      mediaKey: chosen.objectKey,
      caption: decision.text || undefined,
    });

    return { ok: true, kind: decision.type };
  },
});
```

**Helper query in `girls.js`** (used above):

```js
// convex/girls.js
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listGirlAssetsForReply = query({
  args: {
    girlId: v.id("girls"),
    kind: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, { girlId, kind }) => {
    return await ctx.db
      .query("girl_media")
      .withIndex("by_girl_assets", (q) => q.eq("girlId", girlId))
      .filter((q) => q.eq(q.field("isReplyAsset"), true))
      .filter((q) => q.eq(q.field("kind"), kind))
      .collect();
  },
});
```

---

## 6) Frontend — attach & preview, then send

### 6.1 A small media composer

**`components/chat/MediaComposer.js`**

```jsx
"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";

const MAX_IMAGE_MB = 3;
const MAX_VIDEO_MB = 5;

export default function MediaComposer({
  conversationId,
  ensurePermit,           // async () => { permitId, usesLeft, expiresAt }
  onSent,                 // callback after successful send
}) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const signUpload = useAction(api.s3.signChatUpload);
  const finalize = useAction(api.s3.finalizeChatUpload);
  const sendMedia = useMutation(api.chat.sendMediaMessage);

  const kind = useMemo(() => {
    if (!file) return null;
    return file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
  }, [file]);

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Unsupported file type");
      return;
    }
    if (isImage && f.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be ≤ ${MAX_IMAGE_MB}MB`);
      return;
    }
    if (isVideo && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video must be ≤ ${MAX_VIDEO_MB}MB`);
      return;
    }
    setError("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function onSend() {
    if (!file || !kind) return;
    setSending(true);
    try {
      const permit = await ensurePermit();
      const { uploadUrl, objectKey } = await signUpload({
        conversationId,
        kind,
        contentType: file.type,
        size: file.size,
      });

      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

      await finalize({ objectKey, kind }); // HEAD check + server validation

      await sendMedia({
        conversationId,
        kind,
        objectKey,
        caption: caption.trim() || undefined,
        permitId: permit.permitId,
      });

      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      onSent?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Could not send media");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="btn-ghost cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={onPick}
          />
          Attach
        </label>
        {file && (
          <button className="btn" onClick={onSend} disabled={sending}>
            {sending ? "Sending…" : "Send media"}
          </button>
        )}
      </div>

      {file && (
        <div className="p-2 border rounded-md">
          {kind === "image" ? (
            <img src={previewUrl} alt="preview" className="max-h-64 rounded" />
          ) : (
            <video src={previewUrl} controls className="max-h-64 rounded" />
          )}
          <input
            className="mt-2 input w-full"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="mt-1 text-xs text-gray-500">
            {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      )}

      {!!error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
```

### 6.2 Batch‑sign media visible in the conversation

**A tiny hook** to map `mediaKey → signedUrl` once per message list update.

**`components/chat/useSignedMediaUrls.js`**

```jsx
"use client";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

export function useSignedMediaUrls(messages) {
  const signBatch = useAction(api.cdn.signViewBatch);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    const keys = (messages || [])
      .filter(m => (m.kind === "image" || m.kind === "video") && m.mediaKey)
      .map(m => m.mediaKey);
    const uniq = Array.from(new Set(keys));
    if (uniq.length === 0) { setUrls({}); return; }

    let cancelled = false;
    (async () => {
      try {
        const r = await signBatch({ keys: uniq });
        if (!cancelled) setUrls(r.urls || {});
      } catch (e) {
        console.warn("signViewBatch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [messages, signBatch]);

  return urls; // { mediaKey: signedUrl }
}
```

### 6.3 Wire into the conversation page

Update `/app/chat/[conversationId]/page.js`:

* **Render media bubbles** with the signed URLs.
* Include the **MediaComposer** below the text composer.
* Keep `ensurePermit()` from Section 1 and pass it down.

**Message render snippet (replace bubbles):**

```jsx
import { useSignedMediaUrls } from "@/components/chat/useSignedMediaUrls";
import MediaComposer from "@/components/chat/MediaComposer";

// ...inside component...
const urlMap = useSignedMediaUrls(data?.messages);

<div className="flex-1 overflow-y-auto p-4 space-y-3">
  {(data?.messages || []).map(m => {
    const mine = m.sender === "user";
    const base = "max-w-[80%] p-2 rounded";
    if (m.kind === "text") {
      return (
        <div key={m.id} className={`${base} ${mine ? "bg-blue-600 text-white self-end ml-auto" : "bg-gray-200"}`}>
          <div className="text-sm whitespace-pre-wrap">{m.text}</div>
          <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
        </div>
      );
    }
    const src = urlMap[m.mediaKey];
    return (
      <div key={m.id} className={`${base} ${mine ? "bg-blue-50 self-end ml-auto" : "bg-gray-100"}`}>
        {m.kind === "image" ? (
          src ? <img src={src} alt="image" className="rounded max-h-80" /> : <div className="w-48 h-48 bg-gray-300 rounded" />
        ) : (
          src ? <video src={src} controls className="rounded max-h-80" /> : <div className="w-48 h-32 bg-gray-300 rounded" />
        )}
        {!!m.text && <div className="text-sm mt-2">{m.text}</div>}
        <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
      </div>
    );
  })}
</div>

{/* Media composer under the input row */}
<MediaComposer
  conversationId={conversationId}
  ensurePermit={ensurePermit}
  onSent={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
/>
```

*(Keep your existing text input/permit logic as‑is.)*

---

## 7) Detecting “user asked for media”

We keep this **inside the LLM decision** to avoid brittle heuristics. The system prompt already says, *“If the user explicitly asks for a photo/video, prefer media response.”* The LLM responds with:

```json
{ "type": "image"|"video"|"text", "text": "...", "tags": ["optional","clues"] }
```

Server then picks an asset, checks quota, and responds appropriately.

---

## 8) Quota UX

* If `!premiumActive && freeRemaining.media === 0` → **don’t block** user’s media uploads.
* **AI** simply **switches to text** and can add a friendly CTA:
  “I want to share a photo, but your free media is out. Upgrade for unlimited pics 💖”

You already have an upgrade CTA pattern; reuse it if you want a banner.

---

## 9) Definition of Done (Section 2)

* ✅ Users can **attach** image/video, **see a preview**, and send (with optional caption).
* ✅ Server validates **type & size** (pre + post upload).
* ✅ Conversation renders **media bubbles** (signed via **one batch** call).
* ✅ LLM **knows** what the user sent via **placeholders**, never sees URLs.
* ✅ AI can **reply with media** chosen from **her assets**.
* ✅ On AI media reply, **decrement** `freeRemaining.media` (premium bypass).
* ✅ If no media quota, **fallback to text** (no errors, no dead ends).

---

## 10) Small tasks your agent can finish

* **(Optional)** Delete invalid uploads in `finalizeChatUpload` on failure.
* **(Optional)** Track basic media telemetry on message (size, duration).
* **(Optional)** Lazy‑sign only **visible** messages (intersection observer) if the list gets long.
* **(Optional)** Add a tiny caption under AI media using the asset’s `text` if present and the LLM caption is empty.

---

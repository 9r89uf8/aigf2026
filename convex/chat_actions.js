// convex/chat_actions.js
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

    // Get premium status
    let premiumActive = false;
    if (convo) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", convo.userId))
        .first();
      premiumActive = !!(profile?.premiumUntil && profile.premiumUntil > Date.now());
    }

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    const history = msgs.reverse().map((m) => {
      if (m.kind === "text") {
        return { role: m.sender === "user" ? "user" : "assistant", content: m.text || "" };
      }
      if (m.kind === "audio") {
        const t = m.text ? ` transcript: "${m.text}"` : " (no transcript)";
        return { role: m.sender === "user" ? "user" : "assistant", content: `${m.sender === "user" ? "User" : "Assistant"} sent AUDIO.${t}` };
      }
      const tag = m.kind.toUpperCase();
      const cap = m.text ? ` caption: "${m.text}"` : "";
      const content = `${m.sender === "user" ? "User" : "Assistant"} sent a ${tag}.${cap}`;
      return { role: m.sender === "user" ? "user" : "assistant", content };
    });

    const persona = (girl?.personaPrompt || "You are a warm, flirty girlfriend.")
      + "\nRules:\n"
      + "- If the user explicitly asks for a photo/video, prefer media response.\n"
      + "- If the user asks for voice/audio, prefer audio response.\n"
      + "- Reply NATURALLY like a human girlfriend. Keep messages concise.\n"
      + "- Decide the best reply type (text/image/video/audio). For media/audio, include text.\n"
      + "- When replying with audio, your text is what will be spoken.\n"
      + "- Respond ONLY in JSON with keys: {\"type\":\"text|image|video|audio\",\"text\":\"...\",\"tags\":[\"...\"]}\n"
      + "- If unsure, return {\"type\":\"text\",\"text\":\"...\"}.\n\n"
      + `User Status:\n`
      + `- Premium: ${premiumActive ? "yes" : "no"}\n`
      + `- Remaining free quotas: text: ${convo?.freeRemaining?.text || 0}, media: ${convo?.freeRemaining?.media || 0}, audio: ${convo?.freeRemaining?.audio || 0}\n`
      + "- If media/audio quota is 0 and user asks for it, kindly suggest upgrading.\n"
      + "- If you want to send media/audio but quota is 0, mention the upgrade option naturally in your text response.";

    return {
      persona,
      history,
      girlId: convo?.girlId,
      conversationId,
      premiumActive,
      freeRemaining: convo?.freeRemaining || { text: 0, media: 0, audio: 0 }
    };
  },
});

async function callLLM({ baseUrl, apiKey, model, messages }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 1.3, max_tokens: 220 }),
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
    const allowed = new Set(["text", "image", "video", "audio"]);
    const type = allowed.has(obj.type) ? obj.type : "text";
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
    const { persona, history, girlId, premiumActive, freeRemaining } = await ctx.runQuery(api.chat_actions._getContextV2, {
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

    // Handle text response
    if (decision.type === "text") {
      const fallbackText = decision.text || "I'm here with you 💕";
      await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
      return { ok: true, kind: "text" };
    }

    // Handle audio response
    if (decision.type === "audio") {
      const outOfAudio = !premiumActive && freeRemaining?.audio <= 0;
      if (outOfAudio) {
        const fallbackText = decision.text || "I can send you a voice note once you upgrade 💖";
        await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
        return { ok: true, kind: "text" };
      }

      // Get girl's voiceId for TTS
      const girl = await ctx.runQuery(api.girls.getGirlPublic, { girlId });
      const voiceId = girl?.voiceId || "EXAVITQu4vr4xnSDxMaL"; // default ElevenLabs voice

      try {
        const { key } = await ctx.runAction(api.s3.ensureTtsAudio, { voiceId, text: decision.text || "Hey 💞" });
        await ctx.runMutation(api.chat._insertAIAudioAndDec, {
          conversationId, mediaKey: key, caption: decision.text || undefined,
        });
        return { ok: true, kind: "audio" };
      } catch (e) {
        // TTS failed - fallback to text (no quota decrement)
        console.error("TTS failed:", e);
        const fallbackText = decision.text || "I'm having trouble with audio right now—still here for you!";
        await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
        return { ok: true, kind: "text" };
      }
    }

    // Handle media (image/video) response
    const outOfMedia = !premiumActive && freeRemaining?.media <= 0;
    if (outOfMedia) {
      const fallbackText = decision.text || "I'd love to send you a photo but you've used your free media quota 💕";
      await ctx.runMutation(api.chat_actions._insertAIText, { conversationId, text: fallbackText });
      return { ok: true, kind: "text" };
    }

    // Choose an asset of the requested kind from girl's reply assets
    const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, { girlId, kind: decision.type });
    if (!assets?.length) {
      // No assets available; fall back to text gracefully
      const fallbackText = decision.text || "I don't have a media to share right now, but I'm all yours 🥰";
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
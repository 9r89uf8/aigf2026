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
      freeRemaining: { text: convo.freeRemaining.text, media: convo.freeRemaining.media },
      premiumActive,
      messages: msgs.map(m => ({
        id: m._id, sender: m.sender, kind: m.kind, text: m.text,
        mediaKey: m.mediaKey, createdAt: m.createdAt,
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

/** Send message (mutation) with quota + Turnstile permit */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, text, permitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Empty message");

    // Enforce permit (server-side)
    const permit = await ctx.db.get(permitId);
    if (!permit || permit.userId !== userId || permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
      throw new Error("Security check failed (permit)");
    }
    // Decrement atomically within the same transaction
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

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
      conversationId, sender: "user", kind: "text", text: trimmed, createdAt: now,
    });

    const preview = trimmed.length > 140 ? trimmed.slice(0, 140) + "…" : trimmed;
    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: now,
      updatedAt: now,
    });

    // Schedule AI reply action (runs outside this transaction)
    await ctx.scheduler.runAfter(0, api.chat_actions.aiReply, {
      conversationId, userMessageId: userMsgId,
    });

    return { ok: true };
  },
});

/** Send media message (mutation) with quota + Turnstile permit */
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
    if (!permit || permit.userId !== userId || permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
      throw new Error("Security check failed");
    }
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
      conversationId
    });

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
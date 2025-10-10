// convex/chat.js
import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  FREE_TEXT_PER_GIRL, FREE_MEDIA_PER_GIRL, FREE_AUDIO_PER_GIRL, HEAVY_REPLY_COOLDOWN_MS,
} from "./chat.config.js";
import { MEDIA_DEDUP } from "./chat_actions.js";


// Read-only premium check for girl access (enforcement now happens in send mutations via permit)
async function requirePremiumIfGirlIsPremiumOnly(ctx, userId, girlId) {
  const girl = await ctx.db.get(girlId);
  if (!girl) throw new Error("Girl not found");
  if (!girl.premiumOnly) return { premiumNeeded: false, girl };

  // Check if user has premium access
  const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

  const active = !!profile?.premiumActive || (profile?.premiumUntil ?? 0) > Date.now();
  if (!active) throw new Error("PREMIUM_REQUIRED");

  return { premiumNeeded: true, girl };
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

    // Return threads with denormalized girl info (no extra reads)
    return threads.map(c => ({
      conversationId: c._id,
      girlId: c.girlId,
      girlName: c.girlName,
      girlAvatarKey: c.girlAvatarKey,
      lastMessagePreview: c.lastMessagePreview,
      lastMessageAt: c.lastMessageAt,
      unread: c.lastMessageAt > (c.lastReadAt || 0),
    }));
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

    // Always return history
    const cutoff = convo.clearedAt ?? 0;
    const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation_ts", (q) =>
            q.eq("conversationId", conversationId).gt("createdAt", cutoff)
        )
        .order("desc")
        .take(limit);
    msgs.reverse();

    return {
      conversationId,
      girlId: convo.girlId,
      girlName: convo.girlName,
      girlAvatarKey: convo.girlAvatarKey,

      // Premium snapshot from conversation (client computes locked state)
      premiumActive: convo.premiumActive,
      girlPremiumOnly: convo.girlPremiumOnly,

      // Client computes: locked = girlPremiumOnly && !me.premiumActive
      locked: false,

      // Only needed by the free‑quota banner
      freeRemaining: {
        text: convo.freeRemaining.text,
        media: convo.freeRemaining.media,
        audio: convo.freeRemaining.audio,
      },

      // Typing indicator hints
      pendingIntent: convo.pendingIntent,
      pendingIntentExpiresAt: convo.pendingIntentExpiresAt,

      // Seen ticks (lastReadAt for ✓✓ rendering)
      lastMessageAt: convo.lastMessageAt,
      lastReadAt: convo.lastReadAt,
      lastAiReadAt: convo.lastAiReadAt,

      messages: msgs.map((m) => ({
        id: m._id,
        sender: m.sender,
        kind: m.kind,
        text: m.text,
        mediaKey: m.mediaKey,
        durationSec: m.durationSec,
        createdAt: m.createdAt,
        userLiked: m.userLiked,
        aiLiked: m.aiLiked,
        aiError: m.aiError,
        replyTo: m.replyTo
          ? { id: m.replyTo.id, sender: m.replyTo.sender, kind: m.replyTo.kind, text: m.replyTo.text }
          : undefined,
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

    // If conversation exists, still enforce premium if the girl is premium-only
    const existing = await ctx.db
        .query("conversations")
        .withIndex("by_user_girl", (q) => q.eq("userId", userId).eq("girlId", girlId))
        .first();

    if (existing) {
      await requirePremiumIfGirlIsPremiumOnly(ctx, userId, existing.girlId);
      return { conversationId: existing._id };
    }

    // New conversation: enforce guard, then create
    const { girl } = await requirePremiumIfGirlIsPremiumOnly(ctx, userId, girlId);

    // Compute up-to-date premium snapshot
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
    const premiumActive = !!profile?.premiumActive || (profile?.premiumUntil ?? 0) > Date.now();

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId,
      girlId,
      girlName: girl.username,
      girlAge: girl.age,
      girlAvatarKey: girl.avatarKey,
      freeRemaining: {
        text: FREE_TEXT_PER_GIRL,
        media: FREE_MEDIA_PER_GIRL,
        audio: FREE_AUDIO_PER_GIRL,
      },
      premiumActive,
      girlPremiumOnly: girl.premiumOnly,
      personaPrompt: girl.personaPrompt,
      voiceId: girl.voiceId,
      lastMessageAt: now,
      lastMessagePreview: "",
      lastReadAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { conversationId };
  },
});


/** Clear all messages in a conversation (soft-clear) */
export const clearConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    const now = Date.now();
    await ctx.db.patch(conversationId, {
      clearedAt: now,             // soft clear pivot
      lastReadAt: now,            // no unread after a clear
      lastMessagePreview: "",     // thread list shows empty preview
      // Don't update updatedAt - keep thread order unchanged
    });
    return { ok: true, clearedAt: now };
  },
});

/** Get a single message (for audio transcription) */
export const getMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");
    if (msg.ownerUserId !== userId) throw new Error("Unauthorized");

    return msg;
  },
});

/** Internal: Get message without auth (for scheduled actions) */
export const _getMessageInternal = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    return await ctx.db.get(messageId);
  },
});

/** Internal: Verify conversation ownership (lightweight for S3 actions) */
export const _verifyConversationOwnership = internalQuery({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, { conversationId, userId }) => {
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    return { ok: true };
  },
});

/** Toggle like on an AI message */
export const likeMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const msg = await ctx.db.get(messageId);
    if (!msg) throw new Error("Message not found");
    if (msg.sender !== "ai") throw new Error("Can only like AI messages");
    if (msg.ownerUserId !== userId) throw new Error("Unauthorized");

    // Toggle like
    await ctx.db.patch(messageId, {
      userLiked: !msg.userLiked
    });

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
    if (permit.scope !== "chat_send") {
      throw new Error("Security check failed (scope)");
    }
    // Decrement atomically within the same transaction
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    // Enforce premium-only girls
    if (convo.girlPremiumOnly && !permit.premiumAtMint) {
      throw new Error("PREMIUM_REQUIRED");
    }

    // Quota enforcement for free users (text only)
    if (!permit.premiumAtMint) {
      if (convo.freeRemaining.text <= 0) {
        throw new Error("Free text quota exhausted");
      }
    }

    const now = Date.now();
    const userMsgId = await ctx.db.insert("messages", {
      conversationId, sender: "user", kind: "text", text: trimmed, ownerUserId: userId, createdAt: now,
    });

    // Single patch: update quota + metadata together
    const preview = trimmed.length > 140 ? trimmed.slice(0, 140) + "…" : trimmed;
    await ctx.db.patch(conversationId, {
      freeRemaining: permit.premiumAtMint
        ? convo.freeRemaining
        : { ...convo.freeRemaining, text: convo.freeRemaining.text - 1 },
      lastMessagePreview: preview,
      lastMessageKind: "text",
      lastMessageSender: "user",
      lastMessageAt: now,
      updatedAt: now,
    });

    // Schedule AI reply action with jitter (feels more human)
    const d = Math.floor(2000 + Math.random() * 5000); // 2-7s
    await ctx.scheduler.runAfter(d, api.chat_actions.aiReply, {
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
    if (permit.scope !== "chat_send") {
      throw new Error("Security check failed (scope)");
    }
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    // Enforce premium-only girls
    if (convo.girlPremiumOnly && !permit.premiumAtMint) {
      throw new Error("PREMIUM_REQUIRED");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId, sender: "user", kind, mediaKey: objectKey,
      text: (caption || "").trim() || undefined, ownerUserId: userId, createdAt: now,
    });

    await ctx.db.patch(conversationId, {
      lastMessagePreview: caption?.trim() || (kind === "image" ? "[Image]" : "[Video]"),
      lastMessageKind: kind,
      lastMessageSender: "user",
      lastMessageAt: now, updatedAt: now,
    });

    // Schedule media analysis (Rekognition)
    if (kind === "image") {
      // Images: analyze immediately, AI reply with jitter
      await ctx.scheduler.runAfter(0, api.actions.analyzeImage.analyzeImageContent, {
        messageId,
        objectKey,
      });
      const d = Math.floor(2500 + Math.random() * 3500); // 2.5-6s
      await ctx.scheduler.runAfter(d, api.chat_actions.aiReply, {
        conversationId,
        userMessageId: messageId
      });
    } else if (kind === "video") {
      // Videos: frame sampling takes longer, AI reply with jitter
      await ctx.scheduler.runAfter(0, api.actions.analyzeVideo.analyzeVideoContent, {
        messageId,
        objectKey,
      });
      const d = Math.floor(3500 + Math.random() * 3500); // 3.5-7s
      await ctx.scheduler.runAfter(d, api.chat_actions.aiReply, {
        conversationId,
        userMessageId: messageId
      });
    }

    return { ok: true };
  },
});

/** Send audio message (mutation) with quota + Turnstile permit */
export const sendAudioMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    objectKey: v.string(),
    durationSec: v.optional(v.number()),
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, objectKey, durationSec, permitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Security: consume permit
    const permit = await ctx.db.get(permitId);
    if (!permit || permit.userId !== userId || permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
      throw new Error("Security check failed");
    }
    if (permit.scope !== "chat_send") {
      throw new Error("Security check failed (scope)");
    }
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    // Enforce premium-only girls
    if (convo.girlPremiumOnly && !permit.premiumAtMint) {
      throw new Error("PREMIUM_REQUIRED");
    }

    const now = Date.now();

    // Insert user audio message (transcript will be added by action)
    const msgId = await ctx.db.insert("messages", {
      conversationId, sender: "user", kind: "audio",
      mediaKey: objectKey, text: undefined, durationSec, ownerUserId: userId, createdAt: now,
    });

    await ctx.db.patch(conversationId, {
      lastMessagePreview: "[Voice note]",
      lastMessageKind: "audio",
      lastMessageSender: "user",
      lastMessageAt: now, updatedAt: now,
    });

    // Schedule transcription + AI reply
    await ctx.scheduler.runAfter(0, api.s3.transcribeAndReply, {
      conversationId, messageId: msgId,
    });

    return { ok: true, messageId: msgId };
  },
});

/** Apply transcript to user audio message */
export const _applyTranscript = internalMutation({
  args: { messageId: v.id("messages"), transcript: v.optional(v.string()) },
  handler: async (ctx, { messageId, transcript }) => {
    const m = await ctx.db.get(messageId);
    if (!m) return;
    await ctx.db.patch(messageId, { text: transcript || "[transcription failed]" });

    // Update conversation preview with transcript snippet
    const convo = await ctx.db.get(m.conversationId);
    if (!convo) return;
    const preview = transcript?.slice(0, 140) || "[Voice note]";
    await ctx.db.patch(m.conversationId, {
      lastMessagePreview: preview,
      lastMessageKind: "audio",
      lastMessageSender: "user",
      updatedAt: Date.now(),
    });
  },
});

/** Apply media summary to message (denormalized from insights for fast context building) */
export const _applyMediaSummary = internalMutation({
  args: { messageId: v.id("messages"), mediaSummary: v.string() },
  handler: async (ctx, { messageId, mediaSummary }) => {
    await ctx.db.patch(messageId, { mediaSummary });
  },
});

/** Insert AI audio message and decrement audio quota */
export const _insertAIAudioAndDec = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    ownerUserId: v.id("users"),
    premiumActive: v.boolean(),
    freeRemaining: v.object({ text: v.number(), media: v.number(), audio: v.number() }),
    mediaKey: v.string(),
    caption: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    shouldLikeUserMsg: v.optional(v.boolean()),
    lastUserMsgId: v.optional(v.id("messages")),
    replyTo: v.optional(v.object({
      id: v.id("messages"),
      sender: v.union(v.literal("user"), v.literal("ai")),
      kind: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
      text: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { conversationId, ownerUserId, premiumActive, freeRemaining, mediaKey, caption, durationSec, shouldLikeUserMsg, lastUserMsgId, replyTo }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "audio",
      mediaKey, text: caption || undefined, durationSec, ownerUserId, createdAt: now,
      ...(replyTo ? { replyTo } : {}),
    });

    // Atomically like user's message if requested, and clear any error flag
    if (lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
    }

    // Load convo to update mediaSeen safely (ensures uniqueness + clipping)
    const convo = await ctx.db.get(conversationId);
    const prevSeen = convo?.mediaSeen || { image: [], video: [], audio: [] };
    const currentList = Array.isArray(prevSeen.audio) ? prevSeen.audio : [];
    const nextList = [mediaKey, ...currentList.filter(k => k !== mediaKey)].slice(0, MEDIA_DEDUP.PER_KIND_LIMIT);
    const nextMediaSeen = { ...prevSeen, audio: nextList };

    // Decrement audio quota if not premium
    await ctx.db.patch(conversationId, {
      freeRemaining: premiumActive
        ? freeRemaining
        : { ...freeRemaining, audio: Math.max(0, freeRemaining.audio - 1) },
      lastMessagePreview: caption?.slice(0, 140) || "[Voice reply]",
      lastMessageKind: "audio",
      lastMessageSender: "ai",
      lastMessageAt: now, updatedAt: now,
      heavyCooldownUntil: now + HEAVY_REPLY_COOLDOWN_MS,
      mediaSeen: nextMediaSeen,
    });
  },
});

/** Insert AI message (internal; called by action) */
export const _insertAIMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    shouldLikeUserMsg: v.optional(v.boolean()),
    lastUserMsgId: v.optional(v.id("messages")),
  },
  handler: async (ctx, { conversationId, text, shouldLikeUserMsg, lastUserMsgId }) => {
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found");

    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "text", text, ownerUserId: convo.userId, createdAt: now,
    });

    // Atomically like user's message if requested
    if (shouldLikeUserMsg && lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: true });
    }

    const preview = text.length > 140 ? text.slice(0, 140) + "…" : text;
    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

/** Mark conversation as read (for seen ticks) */
export const markRead = mutation({
  args: { conversationId: v.id("conversations"), at: v.optional(v.number()) },
  handler: async (ctx, { conversationId, at }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");
    const now = at ?? Date.now();
    if (now <= (convo.lastReadAt || 0)) return { ok: true };
    await ctx.db.patch(conversationId, { lastReadAt: now });
    return { ok: true };
  },
});

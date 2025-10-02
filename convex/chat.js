// convex/chat.js
import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  FREE_TEXT_PER_GIRL, FREE_MEDIA_PER_GIRL, FREE_AUDIO_PER_GIRL,
} from "./chat.config.js";

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

    const cutoff = convo.clearedAt ?? 0;

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q =>
        q.eq("conversationId", conversationId).gt("createdAt", cutoff)
      )
      .order("desc")
      .take(limit);
    msgs.reverse(); // ascending for UI

    return {
      conversationId,
      girlId: convo.girlId,
      girlName: convo.girlName,
      girlAvatarKey: convo.girlAvatarKey,
      freeRemaining: { text: convo.freeRemaining.text, media: convo.freeRemaining.media, audio: convo.freeRemaining.audio },
      premiumActive: convo.premiumActive,
      messages: msgs.map(m => ({
        id: m._id, sender: m.sender, kind: m.kind, text: m.text,
        mediaKey: m.mediaKey, durationSec: m.durationSec, createdAt: m.createdAt,
        userLiked: m.userLiked, aiLiked: m.aiLiked, aiError: m.aiError,
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

    // Fetch user's premium status
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    const premiumActive = profile?.premiumActive ?? false;

    // Fetch girl's persona and voice for denormalization
    const girl = await ctx.db.get(girlId);
    if (!girl) throw new Error("Girl not found");

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId, girlId,
      girlName: girl.name,
      girlAvatarKey: girl.avatarKey,
      freeRemaining: {
        text: FREE_TEXT_PER_GIRL,
        media: FREE_MEDIA_PER_GIRL,
        audio: FREE_AUDIO_PER_GIRL,
      },
      premiumActive,
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
      updatedAt: now,
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
    // Decrement atomically within the same transaction
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    // Quota enforcement for free users (text only)
    if (!convo.premiumActive) {
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
      freeRemaining: convo.premiumActive
        ? convo.freeRemaining
        : { ...convo.freeRemaining, text: convo.freeRemaining.text - 1 },
      lastMessagePreview: preview,
      lastMessageKind: "text",
      lastMessageSender: "user",
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
      // Images: analyze immediately, AI reply waits 1.5s for insights
      await ctx.scheduler.runAfter(0, api.actions.analyzeImage.analyzeImageContent, {
        messageId,
        objectKey,
      });
      await ctx.scheduler.runAfter(1500, api.chat_actions.aiReply, {
        conversationId,
        userMessageId: messageId
      });
    } else if (kind === "video") {
      // Videos: frame sampling takes longer, AI reply waits 2.5s for insights
      await ctx.scheduler.runAfter(0, api.actions.analyzeVideo.analyzeVideoContent, {
        messageId,
        objectKey,
      });
      await ctx.scheduler.runAfter(3000, api.chat_actions.aiReply, {
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
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

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
  },
  handler: async (ctx, { conversationId, ownerUserId, premiumActive, freeRemaining, mediaKey, caption, durationSec, shouldLikeUserMsg, lastUserMsgId }) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId, sender: "ai", kind: "audio",
      mediaKey, text: caption || undefined, durationSec, ownerUserId, createdAt: now,
    });

    // Atomically like user's message if requested, and clear any error flag
    if (lastUserMsgId) {
      await ctx.db.patch(lastUserMsgId, { aiLiked: !!shouldLikeUserMsg, aiError: false });
    }

    // Decrement audio quota if not premium
    await ctx.db.patch(conversationId, {
      freeRemaining: premiumActive
        ? freeRemaining
        : { ...freeRemaining, audio: Math.max(0, freeRemaining.audio - 1) },
      lastMessagePreview: caption?.slice(0, 140) || "[Voice reply]",
      lastMessageKind: "audio",
      lastMessageSender: "ai",
      lastMessageAt: now, updatedAt: now,
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

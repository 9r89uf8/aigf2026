// convex/chat_home.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { FREE_TEXT_PER_GIRL, FREE_MEDIA_PER_GIRL, FREE_AUDIO_PER_GIRL } from "./chat.config.js";

/** Get home page data (threads + stories) in a single reactive query */
export const getHome = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    // --- THREADS (one query if logged in) -------------------------------
    let threads = [];
    if (userId) {
      const convos = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", q => q.eq("userId", userId))
        .order("desc")
        .collect();

      // Only show conversations that have a message AFTER the last clear.
      // This hides "deleted"/cleared threads until a new message arrives.
      const convosWithMessages = convos.filter((c) => {
        const clearedAt = c.clearedAt ?? 0;
        return (
            c.lastMessageKind &&
            c.lastMessageSender &&
            (c.lastMessageAt ?? 0) > clearedAt
            );
        });

      threads = convosWithMessages.map(c => ({
        conversationId: c._id,
        girlId: c.girlId,
        girlName: c.girlName,
        girlAvatarKey: c.girlAvatarKey,
        lastMessagePreview: c.lastMessagePreview || "",
        lastMessageAt: c.lastMessageAt,
        lastMessageKind: c.lastMessageKind || "text",       // default for backward compatibility
        lastMessageSender: c.lastMessageSender || "user",   // default for backward compatibility
        lastStorySeenAt: c.lastStorySeenAt || 0,            // for "new" ring
        unread: (c.lastMessageAt ?? 0) > Math.max(c.lastReadAt || 0, c.clearedAt || 0),
      }));
    }

    // --- STORIES EXPLORE (all active girls; two queries total) -------------
    // 1) Get active girls (names & avatars for the rail)
    const activeGirls = await ctx.db
      .query("girls")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    const activeById = new Map();
    for (const g of activeGirls) activeById.set(g._id.toString(), g);

    if (activeById.size === 0) {
      return { threads, stories: [] };
    }

    // 2) Fetch the most recent published stories across everyone (cap to 400)
    const recentStories = await ctx.db
      .query("girl_stories")
      .withIndex("by_published_createdAt", q => q.eq("published", true))
      .order("desc")
      .take(400);

    // Pick the newest story per active girl
    const latestByGirl = new Map();
    for (const s of recentStories) {
      const gid = s.girlId.toString();
      if (!activeById.has(gid)) continue;
      if (!latestByGirl.has(gid)) {
        latestByGirl.set(gid, s); // first hit is newest because we ordered desc
      }
      // Early exit if we've covered all active girls
      if (latestByGirl.size === activeById.size) break;
    }

    // Build the rail: one story per active girl that has at least one published story
    // hasNew ring: true if user has never seen this girl's stories (no convo) or
    // the latest story is newer than convo.lastStorySeenAt
    const lastSeenByGirl = new Map();
    for (const t of threads) lastSeenByGirl.set(t.girlId.toString(), t.lastStorySeenAt || 0);

    const stories = Array.from(latestByGirl.entries()).map(([gid, s]) => {
      const girl = activeById.get(gid);
      const lastSeen = lastSeenByGirl.get(gid) || 0;

      return {
        girlId: girl._id,
        girlName: girl.username,
        girlAvatarKey: girl.avatarKey,
        statusText: girl.statusText ?? null,
        statusCreatedAt: girl.statusCreatedAt ?? null,
        statusExpiresAt: girl.statusExpiresAt ?? null,
        storyId: s._id,
        kind: s.kind,
        objectKey: s.objectKey,     // list view only; you can presign on story open
        text: s.text,
        createdAt: s.createdAt,
        hasNew: s.createdAt > lastSeen || lastSeen === 0, // true if never seen
      };
    });

    // Sort stories rail by recency (newest first)
    stories.sort((a, b) => b.createdAt - a.createdAt);

    return { threads, stories };
  },
});

/** Mark a girl's stories as seen (called when user opens that girl's story) */
export const markStoriesSeen = mutation({
  args: { conversationId: v.id("conversations"), at: v.number() },
  handler: async (ctx, { conversationId, at }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const c = await ctx.db.get(conversationId);
    if (!c || c.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(conversationId, { lastStorySeenAt: at, updatedAt: Date.now() });
    return { ok: true };
  },
});

/** Ensure conversation exists and mark stories seen (for girls you haven't messaged yet) */
export const ensureConversationAndMarkStoriesSeen = mutation({
  args: { girlId: v.id("girls"), at: v.number() },
  handler: async (ctx, { girlId, at }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Find or create conversation
    let convo = await ctx.db
      .query("conversations")
      .withIndex("by_user_girl", q => q.eq("userId", userId).eq("girlId", girlId))
      .first();

    if (!convo) {
      const now = Date.now();
      const girl = await ctx.db.get(girlId);
      if (!girl) throw new Error("Girl not found");

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();
      const premiumActive = profile?.premiumActive ?? false;

      const conversationId = await ctx.db.insert("conversations", {
        userId,
        girlId,
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
        lastStorySeenAt: at,
        createdAt: now,
        updatedAt: now,
      });
      return { conversationId };
    }

    await ctx.db.patch(convo._id, { lastStorySeenAt: at, updatedAt: Date.now() });
    return { conversationId: convo._id };
  },
});

// convex/girls.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertAdmin } from "./_utils/auth";

// ── Utils ─────────────────────────────────────────────────────────────────────
function now() { return Date.now(); }
function toLowerSafe(s) { return s?.toLowerCase() ?? ""; }
function randomLikeCount(min = 25, max = 400) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function validateSurfaceCombo(payload) {
  const { isGallery, isPost, isReplyAsset } = payload;

  // Require exactly one surface for simplicity (keeps admin UX clear)
  const count = [isGallery, isPost, isReplyAsset].filter(Boolean).length;
  if (count !== 1) throw new Error("Pick exactly one: Gallery OR Post OR Asset");

  // Surface-specific validations
  if (isReplyAsset) {
    if (!payload.text || payload.text.trim().length < 3)
      throw new Error("Assets require a descriptive text");
    if (payload.mature === undefined) throw new Error("Assets require 'mature' flag");
    if (payload.canBeLiked) throw new Error("Assets cannot be likeable");
    if (payload.premiumOnly) throw new Error("Assets ignore 'premiumOnly'");
    if (payload.location) throw new Error("Assets do not have a location");
  }
  if (isGallery) {
    // Optional text ok
    // premiumOnly applies; canBeLiked applies
  }
  if (isPost) {
    // Optional text and optional location
    // premiumOnly ignored on posts (you can change this if needed)
  }
}

// ── Girls CRUD ────────────────────────────────────────────────────────────────
export const listGirls = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return await ctx.db.query("girls").withIndex("by_createdAt").order("desc").collect();
  },
});

export const getGirl = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    await assertAdmin(ctx);
    return await ctx.db.get(girlId);
  },
});

export const getGirlPublic = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    return await ctx.db.get(girlId);
  },
});

export const createGirl = mutation({
  args: { name: v.string(), bio: v.optional(v.string()), voiceId: v.optional(v.string()), personaPrompt: v.optional(v.string()) },
  handler: async (ctx, { name, bio, voiceId, personaPrompt }) => {
    const { userId } = await assertAdmin(ctx);
    const ts = now();
    const girlId = await ctx.db.insert("girls", {
      name,
      nameLower: toLowerSafe(name),
      bio,
      voiceId,
      personaPrompt,
      avatarKey: undefined,
      backgroundKey: undefined,
      createdBy: userId,
      createdAt: ts,
      updatedAt: ts,
      isActive: true,
      counts: { gallery: 0, posts: 0, assets: 0 },
    });
    return girlId;
  },
});

export const updateGirlBasicInfo = mutation({
  args: {
    girlId: v.id("girls"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    personaPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { girlId, name, bio, voiceId, personaPrompt }) => {
    await assertAdmin(ctx);
    const girl = await ctx.db.get(girlId);
    if (!girl) throw new Error("Girl not found");

    const updates = { updatedAt: now() };
    if (name !== undefined) {
      updates.name = name;
      updates.nameLower = toLowerSafe(name);
    }
    if (bio !== undefined) updates.bio = bio;
    if (voiceId !== undefined) updates.voiceId = voiceId;
    if (personaPrompt !== undefined) updates.personaPrompt = personaPrompt;

    await ctx.db.patch(girlId, updates);

    // Sync denormalized fields to conversations
    if (name !== undefined || voiceId !== undefined || personaPrompt !== undefined) {
      const conversations = await ctx.db
        .query("conversations")
        .filter(q => q.eq(q.field("girlId"), girlId))
        .collect();

      for (const convo of conversations) {
        const convoUpdates = { updatedAt: now() };
        if (name !== undefined) convoUpdates.girlName = name;
        if (voiceId !== undefined) convoUpdates.voiceId = voiceId;
        if (personaPrompt !== undefined) convoUpdates.personaPrompt = personaPrompt;

        await ctx.db.patch(convo._id, convoUpdates);
      }
    }

    return true;
  },
});

export const updateGirlProfileImages = mutation({
  args: { girlId: v.id("girls"), avatarKey: v.optional(v.string()), backgroundKey: v.optional(v.string()) },
  handler: async (ctx, { girlId, avatarKey, backgroundKey }) => {
    await assertAdmin(ctx);
    const girl = await ctx.db.get(girlId);
    if (!girl) throw new Error("Girl not found");

    const newAvatarKey = avatarKey ?? girl.avatarKey;

    await ctx.db.patch(girlId, {
      avatarKey: newAvatarKey,
      backgroundKey: backgroundKey ?? girl.backgroundKey,
      updatedAt: now(),
    });

    // Sync denormalized avatarKey to all conversations with this girl
    if (avatarKey) {
      const conversations = await ctx.db
        .query("conversations")
        .filter(q => q.eq(q.field("girlId"), girlId))
        .collect();

      for (const convo of conversations) {
        await ctx.db.patch(convo._id, {
          girlAvatarKey: newAvatarKey,
          updatedAt: now(),
        });
      }
    }

    return true;
  },
});

// ── Media: create/update/list ────────────────────────────────────────────────
export const finalizeGirlMedia = mutation({
  args: {
    girlId: v.id("girls"),
    objectKey: v.string(),
    kind: v.union(v.literal("image"), v.literal("video")),

    // Surfaces (exactly one must be true)
    isGallery: v.boolean(),
    isPost: v.boolean(),
    isReplyAsset: v.boolean(),

    // Common/optional fields
    text: v.optional(v.string()),
    location: v.optional(v.string()),   // posts
    premiumOnly: v.optional(v.boolean()), // gallery only
    canBeLiked: v.optional(v.boolean()),  // gallery/post
    mature: v.optional(v.boolean()),      // assets (required)
    durationSec: v.optional(v.number()),
    likeSeed: v.optional(v.number()),     // allows deterministic seeds in UI
  },
  handler: async (ctx, payload) => {
    await assertAdmin(ctx);
    const girl = await ctx.db.get(payload.girlId);
    if (!girl) throw new Error("Girl not found");

    // Default surface‑specific flags to false when unset
    payload.premiumOnly ??= false;
    payload.canBeLiked ??= false;
    payload.mature ??= false;

    validateSurfaceCombo(payload);

    const ts = now();
    const doc = {
      girlId: payload.girlId,
      kind: payload.kind,
      isGallery: payload.isGallery,
      isPost: payload.isPost,
      isReplyAsset: payload.isReplyAsset,
      objectKey: payload.objectKey,
      text: payload.text,
      location: payload.location,
      premiumOnly: payload.premiumOnly,
      canBeLiked: payload.canBeLiked && (payload.isGallery || payload.isPost),
      mature: payload.mature,
      durationSec: payload.durationSec,
      likeCount: (payload.isGallery || payload.isPost) ? (payload.likeSeed ?? randomLikeCount()) : 0,
      published: true,
      createdAt: ts,
      updatedAt: ts,
    };

    const id = await ctx.db.insert("girl_media", doc);

    // Update cached counts (1 write, no extra queries)
    const counts = { ...girl.counts };
    if (payload.isGallery) counts.gallery += 1;
    if (payload.isPost) counts.posts += 1;
    if (payload.isReplyAsset) counts.assets += 1;
    await ctx.db.patch(payload.girlId, { counts, updatedAt: now() });

    return id;
  },
});

export const updateGirlMedia = mutation({
  args: {
    mediaId: v.id("girl_media"),
    text: v.optional(v.string()),
    location: v.optional(v.string()),
    premiumOnly: v.optional(v.boolean()),
    canBeLiked: v.optional(v.boolean()),
    mature: v.optional(v.boolean()),
    likeCount: v.optional(v.number()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media) throw new Error("Media not found");

    // Enforce surface rules on update:
    if (media.isReplyAsset) {
      if (args.canBeLiked === true) throw new Error("Assets cannot be likeable");
      if (args.premiumOnly === true) throw new Error("Assets ignore 'premiumOnly'");
    }
    const { mediaId, ...updates } = args;
    await ctx.db.patch(mediaId, { ...updates, updatedAt: now() });
    return true;
  },
});

export const listGirlMedia = query({
  args: { girlId: v.id("girls"), surface: v.union(v.literal("gallery"), v.literal("posts"), v.literal("assets")) },
  handler: async (ctx, { girlId, surface }) => {
    await assertAdmin(ctx);
    const index =
      surface === "gallery" ? "by_girl_gallery" :
      surface === "posts" ? "by_girl_posts" : "by_girl_assets";

    return await ctx.db.query("girl_media")
      .withIndex(index, q => q.eq("girlId", girlId))
      .order("desc")
      .collect();
  },
});

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
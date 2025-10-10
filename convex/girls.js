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

// CHANGE: listGirlsPublic now uses displayBio and priority ordering
export const listGirlsPublic = query({
  args: {},
  handler: async (ctx) => {
    const girls = await ctx.db
        .query("girls")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

    // Sort: higher priority first, then name
    girls.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.name.localeCompare(b.name));

    // Recent published stories across all girls (desc)
    const recentStories = await ctx.db
        .query("girl_stories")
        .withIndex("by_published_createdAt", (q) => q.eq("published", true))
        .order("desc")
        .take(400);

    const latestByGirl = new Map();
    for (const s of recentStories) {
      const gid = s.girlId.toString();
      if (!latestByGirl.has(gid)) latestByGirl.set(gid, s);
      if (latestByGirl.size === girls.length) break;
    }

    return girls.map((g) => {
      const s = latestByGirl.get(g._id.toString());
      return {
        _id: g._id,
        name: g.name,
        // show public-facing bio here
        bio: g.displayBio ?? "",
        avatarKey: g.avatarKey,
        counts: g.counts,
        hasStory: !!s,
        latestStoryKind: s?.kind ?? null,
        // optional extras if you want in UI:
        username: g.username ?? null,
        premiumOnly: g.premiumOnly,
        priority: g.priority,
      };
    });
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

// convex/girls.js (top helpers)
function validateUsername(u) {
  if (!u) return;
  const trimmed = u.trim();
  if (trimmed.length < 3 || trimmed.length > 32) {
    throw new Error("Username must be 3-32 characters.");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new Error("Username can contain only letters, numbers, and underscores.");
  }
}


// REPLACE your existing createGirl with this one:
export const createGirl = mutation({
  args: {
    name: v.string(),
    // NEW
    displayBio: v.optional(v.string()),
    bio: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    personaPrompt: v.optional(v.string()),
    premiumOnly: v.optional(v.boolean()),
    age: v.optional(v.number()),
    priority: v.optional(v.number()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, {
    name, displayBio, bio, voiceId, personaPrompt,
    premiumOnly, age, priority, username,
  }) => {
    const { userId } = await assertAdmin(ctx);
    const ts = now();

    // Username uniqueness (if provided)
    let usernameLower;
    if (username) {
      validateUsername(username);
      usernameLower = username.trim().toLowerCase();
      const existing = await ctx.db
          .query("girls")
          .withIndex("by_usernameLower", q => q.eq("usernameLower", usernameLower))
          .first();
      if (existing) throw new Error("Username is already taken.");
    }

    const girlId = await ctx.db.insert("girls", {
      name,
      nameLower: toLowerSafe(name),

      // NEW fields
      displayBio: displayBio ?? undefined,
      bio: bio ?? undefined,
      premiumOnly: premiumOnly ?? false,
      age: age ?? undefined,
      priority: priority ?? 0,
      username: username ?? undefined,
      usernameLower: usernameLower ?? undefined,

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

// NEW: Admin can edit any main field of the girl
export const updateGirlAdmin = mutation({
  args: {
    girlId: v.id("girls"),
    name: v.optional(v.string()),
    displayBio: v.optional(v.string()),
    bio: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    personaPrompt: v.optional(v.string()),
    premiumOnly: v.optional(v.boolean()),
    age: v.optional(v.number()),
    priority: v.optional(v.number()),
    username: v.optional(v.string()), // can set or clear
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const girl = await ctx.db.get(args.girlId);
    if (!girl) throw new Error("Girl not found");

    const updates = { updatedAt: now() };

    if (args.name !== undefined) {
      updates.name = args.name;
      updates.nameLower = toLowerSafe(args.name);
    }
    if (args.displayBio !== undefined) updates.displayBio = args.displayBio;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.voiceId !== undefined) updates.voiceId = args.voiceId;
    if (args.personaPrompt !== undefined) updates.personaPrompt = args.personaPrompt;
    if (args.premiumOnly !== undefined) updates.premiumOnly = args.premiumOnly;
    if (args.age !== undefined) updates.age = args.age;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    // Username set/clear with uniqueness check
    if (args.username !== undefined) {
      const u = args.username?.trim();
      if (u) {
        validateUsername(u);
        const nextLower = u.toLowerCase();
        if (nextLower !== girl.usernameLower) {
          const exists = await ctx.db
              .query("girls")
              .withIndex("by_usernameLower", q => q.eq("usernameLower", nextLower))
              .first();
          if (exists) throw new Error("Username is already taken.");
        }
        updates.username = u;
        updates.usernameLower = nextLower;
      } else {
        updates.username = undefined;
        updates.usernameLower = undefined;
      }
    }

    await ctx.db.patch(args.girlId, updates);

    // Keep conversation denorm in sync when relevant fields change
    if (args.name !== undefined || args.voiceId !== undefined || args.personaPrompt !== undefined) {
      const convos = await ctx.db
          .query("conversations")
          .filter(q => q.eq(q.field("girlId"), args.girlId))
          .collect();
      for (const c of convos) {
        const cUpdates = { updatedAt: now() };
        if (args.name !== undefined) cUpdates.girlName = args.name;
        if (args.voiceId !== undefined) cUpdates.voiceId = args.voiceId;
        if (args.personaPrompt !== undefined) cUpdates.personaPrompt = args.personaPrompt;
        await ctx.db.patch(c._id, cUpdates);
      }
    }

    return true;
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
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),

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


// NEW
export const listGirlGallery = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    await assertAdmin(ctx);
    return await ctx.db
        .query("girl_media")
        .withIndex("by_girl_gallery", (q) => q.eq("girlId", girlId).eq("isGallery", true))
        .order("desc")
        .collect();
  },
});

// NEW
export const listGirlPosts = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    await assertAdmin(ctx);
    return await ctx.db
        .query("girl_media")
        .withIndex("by_girl_posts", (q) => q.eq("girlId", girlId).eq("isPost", true))
        .order("desc")
        .collect();
  },
});

// NEW
export const listGirlAssets = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    await assertAdmin(ctx);
    return await ctx.db
        .query("girl_media")
        .withIndex("by_girl_assets", (q) => q.eq("girlId", girlId).eq("isReplyAsset", true))
        .order("desc")
        .collect();
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
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
  },
  handler: async (ctx, { girlId, kind }) => {
    return await ctx.db
      .query("girl_media")
      .withIndex("by_girl_assets", (q) => q.eq("girlId", girlId))
      .filter((q) => q.eq(q.field("isReplyAsset"), true))
      .filter((q) => q.eq(q.field("kind"), kind))
      .filter((q) => q.eq(q.field("published"), true))
      .collect();
  },
});

// ── Public Profile Page Query ────────────────────────────────────────────────
import { getAuthUserId } from "@convex-dev/auth/server";

export const profilePage = query({
  args: {
    girlId: v.id("girls"),
    galleryLimit: v.optional(v.number()),
    postsLimit: v.optional(v.number()),
  },
  handler: async (ctx, { girlId, galleryLimit = 12, postsLimit = 12 }) => {
    // 1. Load girl (must be active)
    const girl = await ctx.db.get(girlId);
    if (!girl || !girl.isActive) return null;

    // 2. Check viewer's premium status (if authenticated)
    const userId = await getAuthUserId(ctx);
    let viewerPremium = false;
    let likedMediaIds = [];

    if (userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      viewerPremium = profile?.premiumActive ?? false;

      // 3. Fetch liked media IDs for this girl (for initial render)
      const userLikes = await ctx.db
        .query("likes")
        .withIndex("by_user_girl", (q) => q.eq("userId", userId).eq("girlId", girlId))
        .collect();
      likedMediaIds = userLikes.map((like) => like.mediaId);
    }

    // 4. Fetch stories (last 10 published, newest first)
    const storiesRaw = await ctx.db
      .query("girl_stories")
      .withIndex("by_girl_published", (q) => q.eq("girlId", girlId).eq("published", true))
      .order("desc")
      .take(10);

    const stories = storiesRaw.map((s) => ({
      id: s._id,
      kind: s.kind,
      text: s.text,
      objectKey: s.objectKey, // Always included for stories (no premium gating)
      createdAt: s.createdAt,
    }));

    // 5. Fetch gallery items (published only, respect premiumOnly)
    const galleryRaw = await ctx.db
      .query("girl_media")
      .withIndex("by_girl_gallery", (q) => q.eq("girlId", girlId).eq("isGallery", true))
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .take(galleryLimit);

    const gallery = galleryRaw.map((m) => {
      const isLocked = m.premiumOnly && !viewerPremium;
      return {
        id: m._id,
        kind: m.kind,
        text: m.text,
        likeCount: m.likeCount,
        canBeLiked: m.canBeLiked,
        premiumOnly: m.premiumOnly,
        createdAt: m.createdAt,
        objectKey: isLocked ? undefined : m.objectKey, // Exclude key if locked
      };
    });

    // 6. Fetch posts (published, always public)
    const postsRaw = await ctx.db
      .query("girl_media")
      .withIndex("by_girl_posts", (q) => q.eq("girlId", girlId).eq("isPost", true))
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .take(postsLimit);

    const posts = postsRaw.map((m) => ({
      id: m._id,
      kind: m.kind,
      text: m.text,
      likeCount: m.likeCount,
      canBeLiked: m.canBeLiked,
      location: m.location,
      createdAt: m.createdAt,
      objectKey: m.objectKey, // Always included (posts are never premium-gated)
    }));

    // 7. Collect all keys that need signing
    const keysToSign = [];
    if (girl.avatarKey) keysToSign.push(girl.avatarKey);
    if (girl.backgroundKey) keysToSign.push(girl.backgroundKey);

    stories.forEach((s) => {
      if (s.objectKey) keysToSign.push(s.objectKey);
    });
    gallery.forEach((g) => {
      if (g.objectKey) keysToSign.push(g.objectKey);
    });
    posts.forEach((p) => {
      if (p.objectKey) keysToSign.push(p.objectKey);
    });

    // 8. Return view model
    return {
      girl: {
        id: girl._id,
        name: girl.name,
        // USE displayBio for public profile:
        bio: girl.displayBio ?? "",
        avatarKey: girl.avatarKey,
        backgroundKey: girl.backgroundKey,
        username: girl.username ?? null,
        premiumOnly: girl.premiumOnly,
        age: girl.age ?? null,
      },
      viewer: {
        premiumActive: viewerPremium,
        likedIds: likedMediaIds,
      },
      stories,
      gallery,
      posts,
      keysToSign,
    };
  },
});

// ── Likes System ──────────────────────────────────────────────────────────
export const toggleLike = mutation({
  args: { mediaId: v.id("girl_media") },
  handler: async (ctx, { mediaId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Load media item
    const media = await ctx.db.get(mediaId);
    if (!media) throw new Error("Media not found");
    if (!media.canBeLiked) throw new Error("This media cannot be liked");

    // Determine surface for denormalization
    const surface = media.isGallery ? "gallery" : media.isPost ? "post" : null;
    if (!surface) throw new Error("Only gallery and post items can be liked");

    // Check if user already liked this media
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_media", (q) => q.eq("userId", userId).eq("mediaId", mediaId))
      .first();

    let liked = false;
    let newLikeCount = media.likeCount;

    if (existingLike) {
      // Unlike: remove like record and decrement count
      await ctx.db.delete(existingLike._id);
      newLikeCount = Math.max(0, media.likeCount - 1);
      liked = false;
    } else {
      // Like: insert like record and increment count
      await ctx.db.insert("likes", {
        userId,
        girlId: media.girlId,
        mediaId,
        surface,
        createdAt: now(),
      });
      newLikeCount = media.likeCount + 1;
      liked = true;
    }

    // Update denormalized likeCount on media
    await ctx.db.patch(mediaId, { likeCount: newLikeCount, updatedAt: now() });

    return { liked, likeCount: newLikeCount };
  },
});

// ── Stories CRUD (Admin) ──────────────────────────────────────────────────
export const createStory = mutation({
  args: {
    girlId: v.id("girls"),
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("text")),
    objectKey: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, { girlId, kind, objectKey, text }) => {
    await assertAdmin(ctx);

    // Validate: image/video must have objectKey, text stories must have text
    if ((kind === "image" || kind === "video") && !objectKey) {
      throw new Error("Image and video stories require an objectKey");
    }
    if (kind === "text" && !text) {
      throw new Error("Text stories require text content");
    }

    const storyId = await ctx.db.insert("girl_stories", {
      girlId,
      kind,
      objectKey: objectKey ?? undefined,
      text: text ?? undefined,
      published: true,
      createdAt: now(),
    });

    return storyId;
  },
});

export const updateStory = mutation({
  args: {
    storyId: v.id("girl_stories"),
    text: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { storyId, text, published }) => {
    await assertAdmin(ctx);

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    const updates = {};
    if (text !== undefined) updates.text = text;
    if (published !== undefined) updates.published = published;

    await ctx.db.patch(storyId, updates);
    return true;
  },
});

export const deleteStory = mutation({
  args: { storyId: v.id("girl_stories") },
  handler: async (ctx, { storyId }) => {
    await assertAdmin(ctx);
    await ctx.db.delete(storyId);
    return true;
  },
});

export const listGirlStories = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    await assertAdmin(ctx);
    return await ctx.db
      .query("girl_stories")
      .withIndex("by_girl", (q) => q.eq("girlId", girlId))
      .order("desc")
      .collect();
  },
});
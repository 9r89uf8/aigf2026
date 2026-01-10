// convex/girls.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertAdmin } from "./_utils/auth";
import { STORY_TTL_MS } from "./stories.config.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
function now() { return Date.now(); }
function toLowerSafe(s) { return s?.toLowerCase() ?? ""; }
function randomLikeCount(min = 25, max = 400) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const STATUS_TTL_MS = 24 * 60 * 60 * 1000;
const STATUS_MAX_LEN = 60;
const BODY_PARTS = ["senos", "culo", "vagina"];

function normalizeStatusText(input) {
  if (input === undefined) return { hasInput: false };
  const trimmed = input.trim();
  if (!trimmed) return { hasInput: true, clear: true };
  if (trimmed.length > STATUS_MAX_LEN) {
    throw new Error(`Status must be ${STATUS_MAX_LEN} characters or less`);
  }
  return { hasInput: true, text: trimmed };
}

function normalizeBodyParts(input) {
  if (!Array.isArray(input)) return [];
  const unique = Array.from(new Set(input.filter(Boolean)));
  return unique.filter((part) => BODY_PARTS.includes(part));
}
function validateSurfaceCombo(payload) {
  const { isGallery, isPost, isReplyAsset } = payload;
  const bodyParts = normalizeBodyParts(payload.bodyParts);

  // Require exactly one surface for simplicity (keeps admin UX clear)
  const count = [isGallery, isPost, isReplyAsset].filter(Boolean).length;
  if (count !== 1) throw new Error("Pick exactly one: Gallery OR Post OR Asset");

  // Surface-specific validations
  if (isReplyAsset) {
    if (!payload.text || payload.text.trim().length < 3)
      throw new Error("Assets require a descriptive text");
    if (payload.mature === undefined) throw new Error("Assets require 'mature' flag");
    if (bodyParts.length && payload.mature !== true) throw new Error("Body parts require mature assets");
    if (payload.canBeLiked) throw new Error("Assets cannot be likeable");
    if (payload.premiumOnly) throw new Error("Assets ignore 'premiumOnly'");
    if (payload.location) throw new Error("Assets do not have a location");
  } else if (bodyParts.length) {
    throw new Error("Body parts only apply to assets");
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
    const liveCutoff = now() - STORY_TTL_MS;
    const girls = await ctx.db
        .query("girls")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

    // Sort: higher priority first, then name
    girls.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.name.localeCompare(b.name));

    // Recent published stories across all girls (desc)
    const recentStories = await ctx.db
        .query("girl_stories")
        .withIndex("by_published_createdAt", (q) =>
          q.eq("published", true).gte("createdAt", liveCutoff)
        )
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

function normalizeTikTokUrl(input) {
  if (input === undefined) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(normalized);
  } catch (error) {
    throw new Error("Social media must be a valid TikTok URL.");
  }
  const host = url.hostname.toLowerCase();
  if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) {
    throw new Error("Social media must be a tiktok.com URL.");
  }
  return url.toString();
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
    currentLocation: v.optional(v.string()),
    school: v.optional(v.string()),
    socialMedia: v.optional(v.string()),
    priority: v.optional(v.number()),
    username: v.optional(v.string()),
    statusText: v.optional(v.string()),
  },
  handler: async (ctx, {
    name, displayBio, bio, voiceId, personaPrompt,
    premiumOnly, age, currentLocation, school, socialMedia, priority, username, statusText,
  }) => {
    const { userId } = await assertAdmin(ctx);
    const ts = now();
    const statusPayload = normalizeStatusText(statusText);
    const statusFields = {};
    if (statusPayload.hasInput && statusPayload.text) {
      statusFields.statusText = statusPayload.text;
      statusFields.statusCreatedAt = ts;
      statusFields.statusExpiresAt = ts + STATUS_TTL_MS;
    }
    const normalizedSocialMedia = normalizeTikTokUrl(socialMedia);

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
      currentLocation: currentLocation?.trim() || undefined,
      school: school?.trim() || undefined,
      socialMedia: normalizedSocialMedia,
      priority: priority ?? 0,
      username: username ?? undefined,
      usernameLower: usernameLower ?? undefined,

      ...statusFields,

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
    currentLocation: v.optional(v.string()),
    school: v.optional(v.string()),
    socialMedia: v.optional(v.string()),
    priority: v.optional(v.number()),
    username: v.optional(v.string()), // can set or clear
    isActive: v.optional(v.boolean()),
    statusText: v.optional(v.string()),
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
    if (args.currentLocation !== undefined) {
      updates.currentLocation = args.currentLocation.trim() || undefined;
    }
    if (args.school !== undefined) {
      updates.school = args.school.trim() || undefined;
    }
    if (args.socialMedia !== undefined) {
      updates.socialMedia = normalizeTikTokUrl(args.socialMedia);
    }
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    const statusPayload = normalizeStatusText(args.statusText);
    if (statusPayload.hasInput) {
      if (statusPayload.clear) {
        updates.statusText = undefined;
        updates.statusCreatedAt = undefined;
        updates.statusExpiresAt = undefined;
      } else {
        const sameText = statusPayload.text === girl.statusText;
        const expired = girl.statusExpiresAt ? girl.statusExpiresAt <= now() : false;
        const missingTimestamps = !girl.statusCreatedAt || !girl.statusExpiresAt;
        if (!sameText || expired || missingTimestamps) {
          const ts = now();
          updates.statusText = statusPayload.text;
          updates.statusCreatedAt = ts;
          updates.statusExpiresAt = ts + STATUS_TTL_MS;
        }
      }
    }

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
    objectKeys: v.optional(v.array(v.string())),
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),

    // Surfaces (exactly one must be true)
    isGallery: v.boolean(),
    isPost: v.boolean(),
    isReplyAsset: v.boolean(),

    // Common/optional fields
    text: v.optional(v.string()),
    bodyParts: v.optional(v.array(v.union(
      v.literal("senos"),
      v.literal("culo"),
      v.literal("vagina"),
    ))),
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
    const bodyParts = normalizeBodyParts(payload.bodyParts);
    payload.bodyParts = bodyParts;

    validateSurfaceCombo(payload);

    const objectKeys = Array.isArray(payload.objectKeys)
      ? Array.from(new Set(payload.objectKeys.filter(Boolean)))
      : [];

    if (objectKeys.length > 0) {
      if (payload.kind !== "image") {
        throw new Error("Multiple media keys require image kind");
      }
      if (payload.isReplyAsset) {
        throw new Error("Assets cannot have multiple images");
      }
    }

    const primaryObjectKey = objectKeys.length ? objectKeys[0] : payload.objectKey;
    if (!primaryObjectKey) throw new Error("objectKey is required");

    const ts = now();
    const doc = {
      girlId: payload.girlId,
      kind: payload.kind,
      isGallery: payload.isGallery,
      isPost: payload.isPost,
      isReplyAsset: payload.isReplyAsset,
      objectKey: primaryObjectKey,
      objectKeys: objectKeys.length ? objectKeys : undefined,
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
    if (bodyParts.length) doc.bodyParts = bodyParts;

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
    bodyParts: v.optional(v.array(v.union(
      v.literal("senos"),
      v.literal("culo"),
      v.literal("vagina"),
    ))),
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
    } else if (args.bodyParts && args.bodyParts.length) {
      throw new Error("Body parts only apply to assets");
    }

    const updates = { ...args };
    delete updates.mediaId;

    const currentBodyParts = normalizeBodyParts(media.bodyParts);
    const nextBodyParts = args.bodyParts !== undefined
      ? normalizeBodyParts(args.bodyParts)
      : currentBodyParts;
    const nextMature = args.mature ?? media.mature;

    if (media.isReplyAsset && nextBodyParts.length && !nextMature) {
      throw new Error("Body parts require mature assets");
    }

    if (args.bodyParts !== undefined) {
      updates.bodyParts = nextBodyParts;
    }

    await ctx.db.patch(media._id, { ...updates, updatedAt: now() });
    return true;
  },
});

export const deleteGirlMedia = mutation({
  args: { mediaId: v.id("girl_media") },
  handler: async (ctx, { mediaId }) => {
    await assertAdmin(ctx);
    const media = await ctx.db.get(mediaId);
    if (!media) throw new Error("Media not found");

    const girl = await ctx.db.get(media.girlId);
    if (!girl) throw new Error("Girl not found");

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_media", (q) => q.eq("mediaId", mediaId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    const counts = { ...girl.counts };
    if (media.isGallery) counts.gallery = Math.max(0, (counts.gallery ?? 0) - 1);
    if (media.isPost) counts.posts = Math.max(0, (counts.posts ?? 0) - 1);
    if (media.isReplyAsset) counts.assets = Math.max(0, (counts.assets ?? 0) - 1);
    await ctx.db.patch(media.girlId, { counts, updatedAt: now() });

    await ctx.db.delete(mediaId);

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

    const liveCutoff = now() - STORY_TTL_MS;

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

    // 4. Fetch live stories (last 10 published in 24h, newest first)
    const storiesRaw = await ctx.db
      .query("girl_stories")
      .withIndex("by_girl_published", (q) =>
        q.eq("girlId", girlId).eq("published", true).gte("createdAt", liveCutoff)
      )
      .order("desc")
      .take(10);

    const stories = storiesRaw.map((s) => ({
      id: s._id,
      kind: s.kind,
      text: s.text,
      objectKey: s.objectKey, // Always included for stories (no premium gating)
      createdAt: s.createdAt,
    }));

    // 5. Fetch highlights (ordered by newest story in each highlight)
    const highlightDocs = await ctx.db
      .query("girl_story_highlights")
      .withIndex("by_girl", (q) => q.eq("girlId", girlId))
      .collect();

    const highlightItems = await Promise.all(
      highlightDocs.map(async (highlight) => {
        const coverStory = await ctx.db
          .query("girl_stories")
          .withIndex("by_highlight_published", (q) =>
            q.eq("highlightId", highlight._id).eq("published", true)
          )
          .order("desc")
          .first();

        if (!coverStory) return null;

        return {
          id: highlight._id,
          title: highlight.title,
          lastStoryAt: coverStory.createdAt,
          cover: {
            id: coverStory._id,
            kind: coverStory.kind,
            text: coverStory.text,
            objectKey: coverStory.objectKey,
            createdAt: coverStory.createdAt,
          },
        };
      })
    );

    const highlights = highlightItems
      .filter(Boolean)
      .sort((a, b) => b.lastStoryAt - a.lastStoryAt);

    // 6. Fetch gallery items (published only, respect premiumOnly)
    const galleryRaw = await ctx.db
      .query("girl_media")
      .withIndex("by_girl_gallery", (q) => q.eq("girlId", girlId).eq("isGallery", true))
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .take(galleryLimit);

    const gallery = galleryRaw.map((m) => {
      const isLocked = m.premiumOnly && !viewerPremium;
      const keys = m.objectKeys?.length ? m.objectKeys : (m.objectKey ? [m.objectKey] : []);
      const visibleKeys = isLocked ? [] : keys;

      return {
        id: m._id,
        kind: m.kind,
        text: m.text,
        likeCount: m.likeCount,
        canBeLiked: m.canBeLiked,
        premiumOnly: m.premiumOnly,
        location: m.location,
        createdAt: m.createdAt,
        objectKey: visibleKeys[0],
        objectKeys: visibleKeys.length ? visibleKeys : undefined,
      };
    });

    // 7. Fetch posts (published, always public)
    const postsRaw = await ctx.db
      .query("girl_media")
      .withIndex("by_girl_posts", (q) => q.eq("girlId", girlId).eq("isPost", true))
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .take(postsLimit);

    const posts = postsRaw.map((m) => {
      const keys = m.objectKeys?.length ? m.objectKeys : (m.objectKey ? [m.objectKey] : []);

      return {
        id: m._id,
        kind: m.kind,
        text: m.text,
        likeCount: m.likeCount,
        canBeLiked: m.canBeLiked,
        location: m.location,
        createdAt: m.createdAt,
        objectKey: keys[0],
        objectKeys: keys.length ? keys : undefined,
      };
    });

    // 8. Collect all keys that need signing
    const keysToSign = [];
    if (girl.avatarKey) keysToSign.push(girl.avatarKey);
    if (girl.backgroundKey) keysToSign.push(girl.backgroundKey);

    stories.forEach((s) => {
      if (s.objectKey) keysToSign.push(s.objectKey);
    });
    highlights.forEach((h) => {
      if (h.cover?.objectKey) keysToSign.push(h.cover.objectKey);
    });
    gallery.forEach((g) => {
      if (g.objectKeys?.length) {
        g.objectKeys.forEach((key) => keysToSign.push(key));
      } else if (g.objectKey) {
        keysToSign.push(g.objectKey);
      }
    });
    posts.forEach((p) => {
      if (p.objectKeys?.length) {
        p.objectKeys.forEach((key) => keysToSign.push(key));
      } else if (p.objectKey) {
        keysToSign.push(p.objectKey);
      }
    });

    // 9. Return view model
    return {
      girl: {
        id: girl._id,
        name: girl.name,
        // USE displayBio for public profile:
        bio: girl.displayBio ?? "",
        statusText: girl.statusText ?? null,
        statusCreatedAt: girl.statusCreatedAt ?? null,
        statusExpiresAt: girl.statusExpiresAt ?? null,
        avatarKey: girl.avatarKey,
        backgroundKey: girl.backgroundKey,
        username: girl.username ?? null,
        premiumOnly: girl.premiumOnly,
        age: girl.age ?? null,
        currentLocation: girl.currentLocation ?? null,
        school: girl.school ?? null,
        socialMedia: girl.socialMedia ?? null,
      },
      viewer: {
        premiumActive: viewerPremium,
        likedIds: likedMediaIds,
      },
      stories,
      highlights,
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

// ── Story Highlights ─────────────────────────────────────────────────────
export const listGirlHighlights = query({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    const highlights = await ctx.db
      .query("girl_story_highlights")
      .withIndex("by_girl", (q) => q.eq("girlId", girlId))
      .collect();

    highlights.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    return highlights.map((h) => ({
      id: h._id,
      title: h.title,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));
  },
});

export const createHighlight = mutation({
  args: {
    girlId: v.id("girls"),
    title: v.string(),
  },
  handler: async (ctx, { girlId, title }) => {
    await assertAdmin(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Title is required");
    if (trimmed.length > 32) throw new Error("Title must be 32 characters or less");

    const titleLower = trimmed.toLowerCase();
    const existing = await ctx.db
      .query("girl_story_highlights")
      .withIndex("by_girl_titleLower", (q) =>
        q.eq("girlId", girlId).eq("titleLower", titleLower)
      )
      .first();
    if (existing) throw new Error("Highlight title already exists");

    const ts = now();
    return await ctx.db.insert("girl_story_highlights", {
      girlId,
      title: trimmed,
      titleLower,
      createdAt: ts,
      updatedAt: ts,
    });
  },
});

export const updateHighlight = mutation({
  args: {
    highlightId: v.id("girl_story_highlights"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { highlightId, title }) => {
    await assertAdmin(ctx);
    const highlight = await ctx.db.get(highlightId);
    if (!highlight) throw new Error("Highlight not found");

    const updates = {};
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Title is required");
      if (trimmed.length > 32) throw new Error("Title must be 32 characters or less");
      const titleLower = trimmed.toLowerCase();
      const existing = await ctx.db
        .query("girl_story_highlights")
        .withIndex("by_girl_titleLower", (q) =>
          q.eq("girlId", highlight.girlId).eq("titleLower", titleLower)
        )
        .first();
      if (existing && existing._id !== highlightId) {
        throw new Error("Highlight title already exists");
      }
      updates.title = trimmed;
      updates.titleLower = titleLower;
    }

    updates.updatedAt = now();
    await ctx.db.patch(highlightId, updates);
    return true;
  },
});

export const deleteHighlight = mutation({
  args: { highlightId: v.id("girl_story_highlights") },
  handler: async (ctx, { highlightId }) => {
    await assertAdmin(ctx);
    const highlight = await ctx.db.get(highlightId);
    if (!highlight) return true;

    const stories = await ctx.db
      .query("girl_stories")
      .withIndex("by_highlight", (q) => q.eq("highlightId", highlightId))
      .collect();

    for (const story of stories) {
      await ctx.db.patch(story._id, { highlightId: undefined });
    }

    await ctx.db.delete(highlightId);
    return true;
  },
});

export const listHighlightStories = query({
  args: { highlightId: v.id("girl_story_highlights") },
  handler: async (ctx, { highlightId }) => {
    const highlight = await ctx.db.get(highlightId);
    if (!highlight) return null;

    const girl = await ctx.db.get(highlight.girlId);
    if (!girl || !girl.isActive) return null;

    const storiesRaw = await ctx.db
      .query("girl_stories")
      .withIndex("by_highlight_published", (q) =>
        q.eq("highlightId", highlightId).eq("published", true)
      )
      .order("desc")
      .collect();

    return storiesRaw.map((s) => ({
      id: s._id,
      kind: s.kind,
      text: s.text,
      objectKey: s.objectKey,
      createdAt: s.createdAt,
    }));
  },
});

// ── Stories CRUD (Admin) ──────────────────────────────────────────────────
export const createStory = mutation({
  args: {
    girlId: v.id("girls"),
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("text")),
    highlightId: v.optional(v.id("girl_story_highlights")),
    objectKey: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, { girlId, kind, highlightId, objectKey, text }) => {
    await assertAdmin(ctx);

    // Validate: image/video must have objectKey, text stories must have text
    if ((kind === "image" || kind === "video") && !objectKey) {
      throw new Error("Image and video stories require an objectKey");
    }
    if (kind === "text" && !text) {
      throw new Error("Text stories require text content");
    }

    if (highlightId) {
      const highlight = await ctx.db.get(highlightId);
      if (!highlight || highlight.girlId !== girlId) {
        throw new Error("Invalid highlight");
      }
    }

    const storyId = await ctx.db.insert("girl_stories", {
      girlId,
      kind,
      highlightId: highlightId ?? undefined,
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
    highlightId: v.optional(v.id("girl_story_highlights")),
    clearHighlight: v.optional(v.boolean()),
  },
  handler: async (ctx, { storyId, text, published, highlightId, clearHighlight }) => {
    await assertAdmin(ctx);

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    const updates = {};
    if (text !== undefined) updates.text = text;
    if (published !== undefined) updates.published = published;

    if (clearHighlight) updates.highlightId = undefined;
    if (highlightId) {
      const highlight = await ctx.db.get(highlightId);
      if (!highlight || highlight.girlId !== story.girlId) {
        throw new Error("Invalid highlight");
      }
      updates.highlightId = highlightId;
    }

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

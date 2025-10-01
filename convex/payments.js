// convex/payments.js
import { query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** ---------- Public queries for the Account UI ---------- */

export const getMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return rows.map((p) => ({
      id: p._id,
      paidAt: p.paidAt,
      productId: p.productId,
      amountTotal: p.amountTotal,
      currency: p.currency,
      durationDays: p.durationDays,
      expiresAt: p.expiresAt,
      features: p.features,
      status: p.status,
    }));
  },
});

export const getPremiumStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { active: false, premiumUntil: 0 };
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const now = Date.now();
    const premiumUntil = profile?.premiumUntil || 0;
    const premiumActive = profile?.premiumActive ?? false;
    return { active: premiumActive, premiumUntil }; // Use premiumActive boolean
  },
});

/** ---------- Internal helpers (only callable from actions) ---------- */

export const getPlansCache = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("payments_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const upsertPlansCache = internalMutation({
  args: {
    key: v.string(),
    json: v.any(),
    refreshedAt: v.number(),
  },
  handler: async (ctx, { key, json, refreshedAt }) => {
    const existing = await ctx.db
      .query("payments_cache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { json, refreshedAt });
      return existing._id;
    } else {
      return await ctx.db.insert("payments_cache", { key, json, refreshedAt });
    }
  },
});

export const getPaymentBySessionId = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();
  },
});

export const getProfileByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const setPremiumUntil = internalMutation({
  args: { profileId: v.id("profiles"), premiumUntil: v.number() },
  handler: async (ctx, { profileId, premiumUntil }) => {
    await ctx.db.patch(profileId, { premiumUntil });
  },
});

export const upsertProfile = internalMutation({
  args: { userId: v.id("users"), premiumUntil: v.number() },
  handler: async (ctx, { userId, premiumUntil }) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      // Update existing profile - set premiumActive to true (lifetime premium)
      await ctx.db.patch(existing._id, { premiumUntil, premiumActive: true, updatedAt: now });
      return existing._id;
    } else {
      // Create new profile with default values
      return await ctx.db.insert("profiles", {
        userId,
        username: "",
        usernameLower: "",
        name: "",
        age: undefined,
        country: "",
        avatarKey: undefined,
        premiumUntil,
        premiumActive: true, // Lifetime premium
        updatedAt: now,
      });
    }
  },
});

export const updateUserConversationsPremium = internalMutation({
  args: { userId: v.id("users"), premiumActive: v.boolean() },
  handler: async (ctx, { userId, premiumActive }) => {
    // Update all conversations for this user to reflect new premium status
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .collect();

    for (const convo of conversations) {
      await ctx.db.patch(convo._id, {
        premiumActive,
        updatedAt: Date.now()
      });
    }

    return conversations.length;
  },
});

export const insertPayment = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
    productId: v.string(),
    priceId: v.string(),
    amountTotal: v.number(),
    currency: v.string(),
    durationDays: v.number(),
    features: v.array(v.string()),
    paidAt: v.number(),
    expiresAt: v.number(),
    status: v.literal("paid"),
    snapshot: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("payments", { ...args, createdAt: Date.now() });
  },
});
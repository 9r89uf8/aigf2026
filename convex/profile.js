// convex/profile.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function normalizeUsername(u) {
  return u.trim().toLowerCase();
}
const USERNAME_RE = /^[a-z0-9._]{3,24}$/;
const RESERVED = new Set(["admin", "support", "help", "about", "terms", "privacy"]);


export const ensureCountry = mutation({
  args: { country: v.optional(v.string()) },
  handler: async (ctx, { country }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const c = (country || "").trim().toUpperCase();
    if (c && !/^[A-Z]{2}$/.test(c)) throw new Error("Invalid country code");
    const existing = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId,
        username: "",
        usernameLower: "",
        name: "",
        age: undefined,
        country: c || undefined,
        updatedAt: now,
      });
      return { ok: true };
    }

    // Only set once (avoid overwriting if user changed it later)
    if (!existing.country && c) {
      await ctx.db.patch(existing._id, { country: c, updatedAt: now });
    }
    return { ok: true };
  },
});


export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userDoc = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return {
      email: userDoc?.email ?? "",
      profile: profile ?? {
        username: "",
        name: "",
        age: undefined,
        country: "",
        avatarKey: undefined,
      },
    };
  },
});

export const upsertMine = mutation({
  args: {
    username: v.string(),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, { username, name, age, country }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // --- Server-side validation (cheap + strict)
    const un = username.trim();
    if (!USERNAME_RE.test(un)) throw new Error("Username must be 3–24 chars, a–z, 0–9, . or _");
    const unLower = normalizeUsername(un);
    if (RESERVED.has(unLower)) throw new Error("This username is reserved");

    if (name && name.length > 80) throw new Error("Name is too long");
    if (age !== undefined && (age < 13 || age > 120)) throw new Error("Age must be 13–120");
    let c = (country ?? "").trim().toUpperCase();
    if (c && !/^[A-Z]{2}$/.test(c)) throw new Error("Country must be 2-letter code");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Enforce username uniqueness (case-insensitive)
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_usernameLower", (q) => q.eq("usernameLower", unLower))
      .first();

    if (taken && (!existing || taken._id !== existing._id)) {
      throw new Error("Username is already taken");
    }

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: userId,
        username: un,
        usernameLower: unLower,
        name: name ?? "",
        age,
        country: c,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        username: un,
        usernameLower: unLower,
        name: name ?? "",
        age,
        country: c,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const setAvatar = mutation({
  args: { objectKey: v.string() },
  handler: async (ctx, { objectKey }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Simple path containment: avatars/<userId>/...
    const expectedPrefix = `avatars/${userId}/`;
    if (!objectKey.startsWith(expectedPrefix)) throw new Error("Invalid avatar key");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: userId,
        username: "",
        usernameLower: "",
        name: "",
        age: undefined,
        country: "",
        avatarKey: objectKey,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, { avatarKey: objectKey, updatedAt: now });
    }

    return { ok: true };
  },
});

export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!existing) return { ok: true };
    await ctx.db.patch(existing._id, { avatarKey: undefined, updatedAt: Date.now() });
    return { ok: true };
  },
});
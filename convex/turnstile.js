// convex/turnstile.js
import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  PERMIT_USES_FREE, PERMIT_TTL_MS_FREE,
  PERMIT_USES_PREMIUM, PERMIT_TTL_MS_PREMIUM,
} from "./chat.config.js";
import { api } from "./_generated/api";

export const _profileByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const _insertPermit = internalMutation({
  args: {
    userId: v.id("users"),
    scope: v.string(),
    usesLeft: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
    premiumAtMint: v.boolean(),
    premiumUntilAtMint: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("turnstile_permits", args);
  },
});

export const _insertNonce = internalMutation({
  args: {
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("turnstile_nonces", args);
  },
});

export const verify = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) throw new Error("Turnstile token missing");
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });
    if (!res.ok) throw new Error("Turnstile verification failed");
    const data = await res.json();
    if (!data.success) throw new Error("Turnstile verification failed");
    return { ok: true };
  },
});

export const verifyAndMintNonce = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Call Cloudflare Siteverify (server-side is mandatory)
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }).then((res) => res.json());

    if (!r.success) throw new Error("Turnstile verification failed");

    // Mint short-lived nonce stored in DB (2 minutes)
    const now = Date.now();
    const expiresAt = now + 2 * 60 * 1000;
    const nonceId = await ctx.runMutation(api.turnstile._insertNonce, {
      userId,
      createdAt: now,
      expiresAt,
    });
    return { nonceId };
  },
});

export const verifyAndMintPermit = action({
  args: { token: v.string(), scope: v.optional(v.string()) },
  handler: async (ctx, { token, scope = "chat_send" }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Server-side verification (x-www-form-urlencoded is preferred)
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });
    if (!resp.ok) throw new Error("Turnstile verification failed");
    const data = await resp.json();
    if (!data.success) throw new Error("Turnstile verification failed");

    // Premium-aware permit size/TTL + stamp premium status at mint time
    const profile = await ctx.runQuery(api.turnstile._profileByUserId, { userId });
    const premium = !!profile?.premiumActive || (profile?.premiumUntil ?? 0) > Date.now();
    const uses = premium ? PERMIT_USES_PREMIUM : PERMIT_USES_FREE;
    const ttl  = premium ? PERMIT_TTL_MS_PREMIUM : PERMIT_TTL_MS_FREE;

    const now = Date.now();
    const expiresAt = now + ttl;

    const permitId = await ctx.runMutation(api.turnstile._insertPermit, {
      userId, scope, usesLeft: uses, expiresAt, createdAt: now,
      premiumAtMint: premium,
      premiumUntilAtMint: profile?.premiumUntil ?? undefined,
    });

    return { permitId, usesLeft: uses, expiresAt };
  },
});
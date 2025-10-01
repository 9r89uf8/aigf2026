// convex/payments_actions.js
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import Stripe from "stripe";
import { internal } from "./_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Helpers */
function featuresFromMetadata(md = {}) {
  const features = [];
  for (let i = 1; i <= 10; i++) {
    const k = `feature${i}`;
    if (md[k]) features.push(String(md[k]));
  }
  return features;
}

/** List plans, cached in Convex DB for a few hours */
export const listPlansCached = action({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.runQuery(internal.payments.getPlansCache, {
      key: "catalog",
    });

    const now = Date.now();
    if (cache && now - cache.refreshedAt < 6 * 60 * 60 * 1000) {
      return cache.json;
    }

    const products = await stripe.products.list({ active: true, limit: 100 });
    const result = [];

    for (const p of products.data) {
      if (p.metadata?.duration == null) continue;

      let price = null;
      if (p.default_price && typeof p.default_price === "string") {
        price = await stripe.prices.retrieve(p.default_price);
      } else if (p.default_price && typeof p.default_price === "object") {
        price = p.default_price;
      } else {
        const prices = await stripe.prices.list({
          product: p.id,
          active: true,
          limit: 1,
        });
        price = prices.data[0] || null;
      }
      if (!price) continue;

      const durationDays = Number(p.metadata.duration || 0);
      const features = featuresFromMetadata(p.metadata);

      result.push({
        productId: p.id,
        name: p.name,
        description: p.description,
        image: p.images?.[0] || null,
        priceId: price.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        durationDays,
        features,
      });
    }

    await ctx.runMutation(internal.payments.upsertPlansCache, {
      key: "catalog",
      json: result,
      refreshedAt: now,
    });
    return result;
  },
});

/** Start Stripe Checkout (mode=payment) */
export const checkoutStart = action({
  args: {
    productId: v.string(),
    returnTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await stripe.products.retrieve(args.productId);
    const durationDays = Number(product.metadata?.duration || 0);
    if (!durationDays) throw new Error("Product is missing metadata.duration");

    // Resolve default price
    let priceId = null;
    if (product.default_price && typeof product.default_price === "string") {
      priceId = product.default_price;
    } else if (product.default_price && typeof product.default_price === "object") {
      priceId = product.default_price.id;
    } else {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });
      if (!prices.data[0]) throw new Error("Product has no active price");
      priceId = prices.data[0].id;
    }

    const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
    const successUrl =
      `${SITE_URL.replace(/\/$/, "")}/checkout/success?session_id={CHECKOUT_SESSION_ID}` +
      (args.returnTo ? `&returnTo=${encodeURIComponent(args.returnTo)}` : "");
    const cancelUrl = `${SITE_URL.replace(/\/$/, "")}/plans?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Let Stripe localize language and currency at Checkout automatically.
      metadata: {
        userId, // for your own audit
        productId: product.id,
        priceId,
        durationDays,
        features: JSON.stringify(featuresFromMetadata(product.metadata)),
      },
    });

    return { url: session.url, sessionId: session.id };
  },
});

/** Verify on success page (no webhooks) and grant/extend premium */
export const checkoutVerify = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Idempotency: if seen before, return current status
    const existing = await ctx.runQuery(internal.payments.getPaymentBySessionId, { sessionId });
    if (existing) {
      const profile = await ctx.runQuery(internal.payments.getProfileByUserId, { userId });
      return { premiumUntil: profile?.premiumUntil || 0, alreadyProcessed: true };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items.data.price.product"],
    });

    if (!(session.status === "complete" && session.payment_status === "paid")) {
      throw new Error("Payment not completed");
    }

    // Pull metadata we copied at start
    const md = session.metadata || {};
    const durationDays = Number(md.durationDays || 0);
    const features = md.features ? JSON.parse(md.features) : [];
    const productId =
      md.productId || session.line_items?.data?.[0]?.price?.product?.id || "unknown";
    const priceId = md.priceId || session.line_items?.data?.[0]?.price?.id || "unknown";

    // Extend premium (create profile if it doesn't exist)
    const profile = await ctx.runQuery(internal.payments.getProfileByUserId, { userId });
    const now = Date.now();
    const base = Math.max(now, profile?.premiumUntil || 0);
    const expiresAt = base + durationDays * 24 * 60 * 60 * 1000;

    await ctx.runMutation(internal.payments.upsertProfile, {
      userId,
      premiumUntil: expiresAt,
    });

    // Update all existing conversations to reflect premium status
    await ctx.runMutation(internal.payments.updateUserConversationsPremium, {
      userId,
      premiumActive: true,
    });

    // Write history row
    const paidAtMs = (session.created ?? Math.floor(now / 1000)) * 1000;
    const amountTotal = session.amount_total ?? 0;
    const currency = session.currency || "usd";
    const paymentIntentId =
      typeof session.payment_intent === "object"
        ? session.payment_intent.id
        : session.payment_intent || undefined;

    await ctx.runMutation(internal.payments.insertPayment, {
      userId,
      sessionId,
      paymentIntentId,
      productId,
      priceId,
      amountTotal,
      currency,
      durationDays,
      features,
      paidAt: paidAtMs,
      expiresAt,
      status: "paid",
      snapshot: {
        id: session.id,
        email: session.customer_details?.email,
        country: session.customer_details?.address?.country,
      },
    });

    return { premiumUntil: expiresAt, alreadyProcessed: false };
  },
});
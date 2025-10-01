// convex/mediaInsights.js
// Storage mutations for media analysis insights
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to store media analysis insights.
 * Called by image/video analysis actions after Rekognition processing.
 */
export const _insertMediaInsights = internalMutation({
  args: {
    messageId: v.id("messages"),
    kind: v.union(v.literal("image"), v.literal("video")),
    moderationLabels: v.array(v.object({
      name: v.string(),
      confidence: v.number(),
      parentName: v.optional(v.string()),
    })),
    sceneLabels: v.optional(v.array(v.object({
      name: v.string(),
      confidence: v.number(),
    }))),
    framesAnalyzed: v.optional(v.number()),
    analysisMethod: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if insights already exist for this message (idempotency)
    const existing = await ctx.db
      .query("mediaInsights")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .first();

    if (existing) {
      // Update existing insights (e.g., in case of retry)
      await ctx.db.patch(existing._id, {
        moderationLabels: args.moderationLabels,
        sceneLabels: args.sceneLabels,
        framesAnalyzed: args.framesAnalyzed,
        analysisMethod: args.analysisMethod,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    // Insert new insights
    return await ctx.db.insert("mediaInsights", {
      messageId: args.messageId,
      kind: args.kind,
      moderationLabels: args.moderationLabels,
      sceneLabels: args.sceneLabels,
      framesAnalyzed: args.framesAnalyzed,
      analysisMethod: args.analysisMethod,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal query to fetch media insights for a specific message.
 * Used by AI context builder to include media understanding in prompts.
 */
export const _getMediaInsights = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    return await ctx.db
      .query("mediaInsights")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .first();
  },
});
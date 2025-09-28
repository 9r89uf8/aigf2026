"use node";

// convex/cdn.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { getAuthUserId } from "@convex-dev/auth/server";

export const cfSignView = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    // Public access for all girls content (no auth required)
    if (key.startsWith("girls/")) {
      // Allow public access - no auth check needed
    }
    // Private access for user avatars (auth required + ownership check)
    else if (key.startsWith("avatars/")) {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthenticated");

      // Verify user owns this avatar
      if (!key.startsWith(`avatars/${userId}/`)) {
        throw new Error("Forbidden");
      }
    }
    // All other paths are forbidden
    else {
      throw new Error("Forbidden");
    }

    // Validate required environment variables
    if (!process.env.CF_DOMAIN) throw new Error("CF_DOMAIN not configured");
    if (!process.env.CF_KEY_PAIR_ID) throw new Error("CF_KEY_PAIR_ID not configured");
    if (!process.env.CF_PRIVATE_KEY) throw new Error("CF_PRIVATE_KEY not configured");

    const url = getSignedUrl({
      url: `https://${process.env.CF_DOMAIN}/${key}`,
      keyPairId: process.env.CF_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 300 * 1000).toISOString(), // 5 minutes
      privateKey: process.env.CF_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    return { url };
  },
});
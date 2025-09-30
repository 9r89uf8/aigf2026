//convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  // Extend your profiles table to include role (admin/user)
  profiles: defineTable({
    userId: v.id("users"),              // stable Convex Auth user ID
    role: v.optional(v.literal("admin")), // unset = regular user
    username: v.optional(v.string()),
    usernameLower: v.optional(v.string()),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    country: v.optional(v.string()),    // ISO 3166-1 alpha-2 (e.g., "US")
    avatarKey: v.optional(v.string()),  // S3 key (private object)
    premiumUntil: v.optional(v.number()), // ms epoch UTC; undefined => not premium
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_usernameLower", ["usernameLower"]),

  girls: defineTable({
    name: v.string(),
    nameLower: v.string(),
    bio: v.optional(v.string()),
    avatarKey: v.optional(v.string()),       // profile image
    backgroundKey: v.optional(v.string()),   // background image
    voiceId: v.optional(v.string()),         // ElevenLabs id
    personaPrompt: v.optional(v.string()),
    createdBy: v.string(),                   // admin userId
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
    counts: v.object({
      gallery: v.number(), posts: v.number(), assets: v.number()
    }),
  })
    .index("by_nameLower", ["nameLower"])
    .index("by_active", ["isActive"])
    .index("by_createdAt", ["createdAt"]),

  girl_media: defineTable({
    girlId: v.id("girls"),
    kind: v.union(v.literal("image"), v.literal("video")),

    // "Surfaces" (any combination, but validations enforce sane combos)
    isGallery: v.boolean(),
    isPost: v.boolean(),
    isReplyAsset: v.boolean(),

    // Common fields
    objectKey: v.string(),             // S3 key
    text: v.optional(v.string()),      // caption / post text / asset description
    likeCount: v.number(),
    canBeLiked: v.boolean(),           // only used by gallery/posts
    mature: v.boolean(),               // required for assets; optional elsewhere
    premiumOnly: v.boolean(),          // gallery-only flag; ignored elsewhere
    location: v.optional(v.string()),  // posts only
    durationSec: v.optional(v.number()),

    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_girl", ["girlId"])
    .index("by_girl_gallery", ["girlId", "isGallery"])
    .index("by_girl_posts", ["girlId", "isPost"])
    .index("by_girl_assets", ["girlId", "isReplyAsset"]),

  payments: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_sessionId", ["sessionId"]),

  payments_cache: defineTable({
    key: v.string(),
    json: v.any(),
    refreshedAt: v.number(),
  })
    .index("by_key", ["key"]),

  conversations: defineTable({
    userId: v.id("users"),
    girlId: v.id("girls"),
    freeRemaining: v.object({
      text: v.number(),
      media: v.number(),
      audio: v.number(),
    }),
    lastMessageAt: v.number(),        // ms epoch
    lastMessagePreview: v.string(),   // denormalized for thread list
    lastReadAt: v.number(),           // ms epoch
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_girl", ["userId", "girlId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    sender: v.union(v.literal("user"), v.literal("ai")),
    kind: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
    text: v.optional(v.string()),          // caption, message text, or audio transcript
    mediaKey: v.optional(v.string()),      // S3 key for image/video/audio
    durationSec: v.optional(v.number()),   // duration for audio/video
    createdAt: v.number(),            // ms epoch
  })
    .index("by_conversation_ts", ["conversationId", "createdAt"]),

  // Turnstile nonces (short-lived)
  turnstile_nonces: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),            // ms epoch, ~2 minutes
  }).index("by_user", ["userId"]),

  turnstile_permits: defineTable({
    userId: v.id("users"),
    usesLeft: v.number(),
    expiresAt: v.number(), // ms epoch
    createdAt: v.number(),
    scope: v.optional(v.string()), // "chat_send" for future scoping
  }).index("by_user", ["userId"]),
});

export default schema;
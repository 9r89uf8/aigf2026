# PROJECT_STRUCTURE.md

This document outlines the complete project structure for the AI girlfriend chat platform. Use this reference when implementing a chat system that will integrate with auth, accounts, payments, S3, and girls management.

## Project Overview

### Tech Stack
- **Frontend**: Next.js 15 (React 19) with App Router
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Convex Auth with Cloudflare Turnstile
- **Styling**: Tailwind CSS v4
- **Media**: AWS S3 + CloudFront (private bucket, signed URLs)
- **Payments**: Stripe Checkout (one-time purchases)
- **Language**: JavaScript only (no TypeScript)

### Architecture Pattern
```
Frontend (Next.js)  Convex Backend  External Services
                      
Real-time queries/mutations
Auth (Convex Auth)
File uploads (S3)
Media viewing (CloudFront)
Payments (Stripe)
```

## Directory Structure

```
nextaifg2026/
 app/                          # Next.js 15 App Router
    (auth)/                   # Auth route group
       signin/page.js        # Sign in/up page
       reset-password/page.js # Password reset
    account/page.js           # User profile management
    admin/                    # Admin panel (admin role only)
       layout.js             # Admin auth check + sidebar
       girls/                # Girl profile management
           page.js           # Girls list
           new/page.js       # Create girl
           [id]/             # Girl detail
               page.js       # Edit profile + upload images
               gallery/page.js  # Gallery media
               posts/page.js    # Post media
               assets/page.js   # AI reply assets
    checkout/success/page.js  # Payment success
    plans/page.js             # Pricing plans
    layout.js                 # Root layout with auth providers
    providers.js              # Client Convex provider
    page.js                   # Landing page
    globals.css               # Tailwind + custom utilities
 components/
    AccountForm.js            # User profile editor
    Navbar.js                 # Auth-aware navigation
    admin/
        MediaUploader.js      # Reusable media uploader
 convex/                       # Backend (Convex)
    schema.js                 # Database schema
    auth.js                   # Convex Auth config
    auth.config.js            # Auth domain binding
    http.js                   # HTTP routes for auth
    turnstile.js              # Cloudflare verification
    users.js                  # User queries
    profile.js                # Profile mutations/queries
    girls.js                  # Girls CRUD + media
    s3.js                     # S3 upload actions
    cdn.js                    # CloudFront signed URLs
    payments.js               # Payment queries/internal mutations
    payments_actions.js       # Stripe actions
    _utils/auth.js            # Admin role checker
    _generated/               # Auto-generated Convex files
 middleware.js                 # Next.js route protection
 package.json                  # Dependencies
```

## Database Schema

### Core Tables

#### `users` (Convex Auth)
```javascript
// Managed by Convex Auth - do not modify directly
{
  email: "user@example.com",
  // ... other auth fields
}
```

#### `profiles` (User Extensions)
```javascript
{
  userId: Id<"users">,              // Links to Convex Auth user
  role: "admin" | undefined,        // Admin role (unset = regular user)
  username: "johndoe",
  usernameLower: "johndoe",         // For case-insensitive searches
  name: "John Doe",
  age: 25,
  country: "US",                    // ISO 3166-1 alpha-2
  avatarKey: "avatars/userId/uuid", // S3 object key
  premiumUntil: 1234567890,         // Premium expiry (ms epoch)
  updatedAt: 1234567890,
}
// Indexes: by_userId, by_usernameLower
```

#### `girls` (AI Girlfriend Profiles)
```javascript
{
  name: "Alice",
  nameLower: "alice",               // Case-insensitive search
  bio: "Sweet and caring...",
  avatarKey: "girls/id/profile/uuid.jpg",     // Profile image
  backgroundKey: "girls/id/background/uuid.jpg", // Background
  voiceId: "elevenlabs-voice-id",   // ElevenLabs voice
  personaPrompt: "You are a sweet girlfriend...", // AI personality
  createdBy: "admin-user-id",       // Admin who created
  isActive: true,                   // Can be deactivated
  counts: {                         // Cached for performance
    gallery: 15,
    posts: 8,
    assets: 32
  },
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
// Indexes: by_nameLower, by_active, by_createdAt
```

#### `girl_media` (Gallery/Posts/AI Assets)
```javascript
{
  girlId: Id<"girls">,
  kind: "image" | "video",

  // Surface flags (exactly one must be true)
  isGallery: true,                  // User browsing gallery
  isPost: false,                    // Social media posts
  isReplyAsset: false,              // AI chat reply media

  objectKey: "girls/id/media/uuid.jpg", // S3 key
  text: "Caption or description",    // Usage varies by surface
  location: "Paris, France",        // Posts only

  // Engagement
  likeCount: 147,                   // Gallery/posts only
  canBeLiked: true,                 // Gallery/posts only

  // Content flags
  premiumOnly: false,               // Gallery only
  mature: false,                    // Assets only

  published: true,
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
// Indexes: by_girl, by_girl_gallery, by_girl_posts, by_girl_assets
```

#### `payments` (Transaction History)
```javascript
{
  userId: Id<"users">,
  sessionId: "cs_stripe_session_id", // For idempotency
  paymentIntentId: "pi_stripe_intent",
  productId: "prod_stripe_product",
  priceId: "price_stripe_price",
  amountTotal: 2999,                // Cents
  currency: "usd",
  durationDays: 30,                 // Premium duration purchased
  features: ["feature1", "feature2"], // Snapshot from Stripe
  paidAt: 1234567890,
  expiresAt: 1234567890,            // When this purchase expires
  status: "paid",                   // Only "paid" status in v1
  snapshot: {...},                  // Full Stripe session data
  createdAt: 1234567890,
}
// Indexes: by_user, by_sessionId
```

#### `payments_cache` (Stripe Catalog Cache)
```javascript
{
  key: "catalog",                   // Cache key
  json: [...],                      // Cached Stripe products/plans
  refreshedAt: 1234567890,          // For 6-hour TTL
}
// Indexes: by_key
```

## Backend Architecture (Convex)

### Function Types

#### Queries (Read Data)
```javascript
// convex/users.js
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userDoc = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    return {
      email: userDoc?.email ?? "",
      role: profile?.role ?? null,
    };
  },
});
```

#### Mutations (Write Data)
```javascript
// convex/profile.js
export const upsertMine = mutation({
  args: { username: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { username, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Validation and database writes...
    return { ok: true };
  },
});
```

#### Actions (External APIs)
```javascript
// convex/s3.js - "use node" directive required
export const signAvatarUpload = action({
  args: { contentType: v.string(), size: v.number() },
  handler: async (ctx, { contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    // S3 operations...
    return { uploadUrl, objectKey };
  },
});
```

### Authentication Patterns

#### Getting Current User
```javascript
import { getAuthUserId } from "@convex-dev/auth/server";

// In any query/mutation/action
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Unauthenticated");
```

#### Admin Role Check
```javascript
// convex/_utils/auth.js
export async function assertAdmin(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthenticated");

  if (ctx.db?.query) {
    // In queries/mutations - direct DB access
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin") throw new Error("Forbidden");
    return { userId, profile };
  }

  if (ctx.runQuery) {
    // In actions - call query
    const me = await ctx.runQuery(api.users.getMe, {});
    if (!me || me.role !== "admin") throw new Error("Forbidden");
    return { userId, profile: { role: me.role } };
  }
}
```

#### Premium Status Check
```javascript
// In query/mutation
const profile = await ctx.db
  .query("profiles")
  .withIndex("by_userId", q => q.eq("userId", userId))
  .first();

const isPremium = profile?.premiumUntil > Date.now();
if (!isPremium) throw new Error("Premium required");
```

## Core Systems

### Authentication System

#### Stack
- **Convex Auth**: Session management, password auth
- **Cloudflare Turnstile**: Bot protection on auth forms
- **Resend**: OTP email delivery for password reset

#### Key Files
- `convex/auth.js` - Convex Auth config with Resend OTP
- `convex/turnstile.js` - Server-side Turnstile verification
- `app/(auth)/signin/page.js` - Combined sign-in/sign-up form
- `middleware.js` - Route protection

#### Auth Flow
1. User submits form with Turnstile token
2. Frontend calls `api.turnstile.verify`
3. Frontend calls `signIn("password", formData)`
4. Convex Auth handles authentication
5. Middleware redirects based on auth state

### User Profile System

#### Features
- Username (unique, case-insensitive)
- Avatar upload via S3 presigned URLs
- Profile fields (name, age, country)
- Premium status tracking

#### Key Patterns
```javascript
// Get user's profile
const data = useQuery(api.profile.getMine);

// Update profile
const upsert = useMutation(api.profile.upsertMine);
await upsert({ username: "newname", name: "Full Name" });

// Upload avatar
const signUpload = useAction(api.s3.signAvatarUpload);
const { uploadUrl, objectKey } = await signUpload({ contentType, size });
// Upload to S3, then save key
await setAvatar({ objectKey });
```

### Admin System

#### Features
- Role-based access (`profile.role === "admin"`)
- Girl profile management (CRUD)
- Media management (gallery, posts, AI assets)
- S3 upload workflow for all media types

#### Admin Pattern
```javascript
// All admin operations use this
import { assertAdmin } from "./_utils/auth";

export const adminFunction = mutation({
  handler: async (ctx, args) => {
    await assertAdmin(ctx); // Throws if not admin
    // Admin logic here...
  },
});
```

### Payment System

#### Features
- One-time Stripe Checkout payments
- Premium time extension (not replacement)
- Cached Stripe product catalog
- Transaction history

#### Key Files
- `convex/payments.js` - Queries and internal helpers
- `convex/payments_actions.js` - Stripe API actions
- `app/plans/page.js` - Plans listing
- `app/checkout/success/page.js` - Payment verification

#### Payment Flow
```javascript
// Start checkout
const start = useAction(api.payments_actions.checkoutStart);
const { url } = await start({ productId });
window.location.href = url; // Redirect to Stripe

// Verify payment (on success page)
const verify = useAction(api.payments_actions.checkoutVerify);
const result = await verify({ sessionId });
```

### S3/CloudFront Media System

#### Architecture
- **Upload**: Browser � S3 (presigned PUT URLs)
- **View**: Browser � CloudFront (signed URLs, 5min expiry)
- **Security**: Private S3 bucket, CloudFront-only access

#### Upload Pattern
```javascript
// 1. Request presigned URL
const { uploadUrl, objectKey } = await signUpload({ contentType, size });

// 2. Upload directly to S3
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": contentType },
  body: file,
});

// 3. Save object key to database
await saveMedia({ objectKey });
```

#### View Pattern
```javascript
// Generate CloudFront signed URL
const { url } = await cfSignView({ key: objectKey });
// Use URL in <img> or <video> tags
```

#### S3 Key Structure
```
s3://bucket/
avatars/{userId}/{uuid}           # User avatars
girls/{girlId}/
profile/{uuid}.{ext}          # Girl profile images
background/{uuid}.{ext}       # Girl backgrounds
media/{uuid}.{ext}            # Gallery/posts/assets
```

## Frontend Architecture

### Next.js Patterns

#### App Router Structure
- Server Components: Layout, auth checks
- Client Components: Interactive forms, Convex hooks
- Route groups: `(auth)` for sign-in pages

#### Auth Providers
```javascript
// app/layout.js - Server provider
<ConvexAuthNextjsServerProvider>
  <Providers>
    <Navbar />
    {children}
  </Providers>
</ConvexAuthNextjsServerProvider>

// app/providers.js - Client provider
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
<ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>
```

### Convex React Integration

#### Hooks Pattern
```javascript
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  // Read data (reactive)
  const data = useQuery(api.profile.getMine);

  // Write data
  const updateProfile = useMutation(api.profile.upsertMine);

  // External API calls
  const uploadFile = useAction(api.s3.signAvatarUpload);

  return <div>{data ? "Loaded" : "Loading..."}</div>;
}
```

#### Auth-Aware Components
```javascript
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

function NavBar() {
  return (
    <nav>
      <AuthLoading>Loading...</AuthLoading>
      <Authenticated>
        <UserMenu />
      </Authenticated>
      <Unauthenticated>
        <a href="/signin">Sign In</a>
      </Unauthenticated>
    </nav>
  );
}
```

### Styling System

#### Tailwind v4 + Custom Utilities
```css
/* app/globals.css */
.input {
  @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50;
}

.btn-ghost {
  @apply px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50;
}
```

## Integration Points for Chat System

### 1. User Context
```javascript
// Get current user in chat components
const me = useQuery(api.users.getMe);
const userId = me ? await getAuthUserId(ctx) : null;

// Check premium status
const premiumStatus = useQuery(api.payments.getPremiumStatus);
const isPremium = premiumStatus?.active;
```

### 2. Girl Data Access
```javascript
// Get available girls (for chat selection)
const girls = useQuery(api.girls.listGirls); // Admin only - create public version

// Get girl details for chat
const girl = useQuery(api.girls.getGirl, { girlId });

// Get girl media for chat replies
const assets = useQuery(api.girls.listGirlMedia, {
  girlId,
  surface: "assets"
});
```

### 3. Premium Gating Pattern
```javascript
// In chat mutation/query
export const sendMessage = mutation({
  handler: async (ctx, { message, girlId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Check premium for advanced features
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    const isPremium = profile?.premiumUntil > Date.now();

    // Example gating
    if (message.length > 100 && !isPremium) {
      throw new Error("Long messages require premium");
    }

    // Chat logic...
  },
});
```

### 4. Media Handling for Chat
```javascript
// For AI replies with media
const mediaAssets = await ctx.db
  .query("girl_media")
  .withIndex("by_girl_assets", q => q.eq("girlId", girlId))
  .filter(q => q.eq(q.field("isReplyAsset"), true))
  .collect();

// Generate viewing URLs
const signedUrl = await cfSignView({ key: asset.objectKey });
```

### 5. Real-time Patterns
```javascript
// Chat messages table (to be created)
chat_messages: defineTable({
  userId: v.id("users"),
  girlId: v.id("girls"),
  content: v.string(),
  isFromUser: v.boolean(),
  mediaKey: v.optional(v.string()),
  createdAt: v.number(),
})
.index("by_user_girl", ["userId", "girlId"])
.index("by_conversation", ["userId", "girlId", "createdAt"])

// Real-time subscription
const messages = useQuery(api.chat.getMessages, { girlId });
```

### 6. File Upload Pattern (for user chat media)
```javascript
// Add to convex/s3.js
export const signChatMediaUpload = action({
  args: { contentType: v.string(), size: v.number() },
  handler: async (ctx, { contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const key = `chat/${userId}/${crypto.randomUUID()}.${extFromContentType(contentType)}`;
    // Return presigned URL...
  },
});
```

## Key Environment Variables

### Required for Development
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Authentication
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret
AUTH_RESEND_KEY=your_resend_api_key

# S3/CloudFront
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
CF_DOMAIN=your_cloudfront_domain
CF_KEY_PAIR_ID=your_keypair_id
CF_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SITE_URL=http://localhost:3000
```

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex backend (separate terminal)

# Build
npm run build        # Build for production
```

This structure provides a robust foundation for implementing a real-time chat system that integrates seamlessly with authentication, user profiles, premium features, girl management, and media handling.
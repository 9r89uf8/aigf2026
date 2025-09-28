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
    chat/                     # Chat system
       page.js                # Thread list (conversations overview)
       [conversationId]/page.js # Individual conversation view
    checkout/success/page.js  # Payment success
    plans/page.js             # Pricing plans
    layout.js                 # Root layout with auth providers
    providers.js              # Client Convex provider
    page.js                   # Landing page
    globals.css               # Tailwind + custom utilities
 components/
    AccountForm.js            # User profile editor
    Navbar.js                 # Auth-aware navigation
    chat/
        useInvisibleTurnstile.js # Turnstile security hook
    admin/
        MediaUploader.js      # Reusable media uploader
 convex/                       # Backend (Convex)
    schema.js                 # Database schema
    auth.js                   # Convex Auth config
    auth.config.js            # Auth domain binding
    http.js                   # HTTP routes for auth
    turnstile.js              # Cloudflare verification + permit system
    chat.js                   # Chat queries/mutations
    chat_actions.js           # AI reply actions with LLM integration
    chat.config.js            # Chat system configuration
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

#### `conversations` (Chat Conversations)
```javascript
{
  userId: Id<"users">,              // Conversation owner
  girlId: Id<"girls">,              // AI girlfriend profile
  freeRemaining: {                  // Free message quotas
    text: 10,                       // Text messages left
    media: 2,                       // Future: image/video uploads
    audio: 3,                       // Future: voice notes
  },
  lastMessageAt: 1234567890,        // Latest activity (for sorting)
  lastMessagePreview: "Hey there...", // Denormalized for thread list
  lastReadAt: 1234567890,           // For unread indicator
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
// Indexes: by_user_updated, by_user_girl
```

#### `messages` (Chat Messages)
```javascript
{
  conversationId: Id<"conversations">,
  sender: "user" | "ai",            // Message sender
  kind: "text",                     // Section 1: text only
  text: "Hello there!",             // Message content
  createdAt: 1234567890,            // Message timestamp
}
// Indexes: by_conversation_ts
```

#### `turnstile_permits` (Security Permits)
```javascript
{
  userId: Id<"users">,
  usesLeft: 5,                      // Remaining uses (5 free, 50 premium)
  expiresAt: 1234567890,            // Expiry time (2min free, 10min premium)
  createdAt: 1234567890,
  scope: "chat_send",               // Optional: permit scope
}
// Indexes: by_user
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

// convex/chat.js - Real-time conversation query
export const getConversation = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, { conversationId, limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    return {
      conversationId,
      girlId: convo.girlId,
      freeRemaining: convo.freeRemaining,
      messages: messages.reverse(), // Ascending for UI
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

// convex/chat.js - Secure message sending with permit validation
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, text, permitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Validate and consume permit (server-side security)
    const permit = await ctx.db.get(permitId);
    if (!permit || permit.userId !== userId ||
        permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
      throw new Error("Security check failed");
    }
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    // Enforce quota for free users
    const convo = await ctx.db.get(conversationId);
    const premiumActive = await getPremiumActive(ctx, userId);
    if (!premiumActive && convo.freeRemaining.text <= 0) {
      throw new Error("Free quota exhausted");
    }

    // Insert message and schedule AI reply
    await ctx.db.insert("messages", {
      conversationId, sender: "user", kind: "text",
      text: text.trim(), createdAt: Date.now(),
    });

    // Schedule AI response after mutation commits
    await ctx.scheduler.runAfter(0, api.chat_actions.aiReply, { conversationId });
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

// convex/chat_actions.js - AI reply generation with LLM fallback
export const aiReply = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    // Get conversation context
    const { persona, history } = await ctx.runQuery(api.chat_actions._getContext, {
      conversationId, limit: 8,
    });

    const messages = [
      { role: "system", content: persona },
      ...history,
    ];

    // Try primary LLM (DeepSeek), fallback to Together.ai
    let text;
    try {
      text = await callOpenAICompat({
        baseUrl: process.env.LLM_BASE_URL_PRIMARY,
        apiKey: process.env.LLM_API_KEY_PRIMARY,
        model: process.env.LLM_MODEL_PRIMARY,
        messages,
      });
    } catch (e) {
      text = await callOpenAICompat({
        baseUrl: process.env.LLM_BASE_URL_FALLBACK,
        apiKey: process.env.LLM_API_KEY_FALLBACK,
        model: process.env.LLM_MODEL_FALLBACK,
        messages,
      });
    }

    // Insert AI response
    await ctx.runMutation(api.chat._insertAIMessage, { conversationId, text });
    return { ok: true };
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

### Chat System

#### Features
- **Real-time conversations** with AI girlfriends
- **Permit-based security** using Cloudflare Turnstile
- **Free quota enforcement** with premium bypass
- **AI integration** with DeepSeek → Together.ai fallback
- **Thread management** with unread indicators
- **Reactive UI** powered by single Convex query

#### Architecture
- **Single reactive query** drives conversation screens via `getConversation`
- **Server-validated security** using Turnstile permits (multi-use, time-limited)
- **Scheduled AI actions** for deterministic mutations and LLM API calls
- **Denormalized threading** for fast thread list performance
- **Context-aware AI** with conversation history and girl personas

#### Key Files
- `app/chat/page.js` - Thread list with real-time updates
- `app/chat/[conversationId]/page.js` - Conversation interface
- `components/chat/useInvisibleTurnstile.js` - Security hook
- `convex/chat.js` - Core queries/mutations
- `convex/chat_actions.js` - AI reply generation
- `convex/turnstile.js` - Permit system
- `convex/chat.config.js` - Configuration constants

#### Security Patterns
```javascript
// Permit validation in every mutation
const permit = await ctx.db.get(permitId);
if (!permit || permit.userId !== userId ||
    permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
  throw new Error("Security check failed");
}
await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });
```

#### Quota Enforcement
```javascript
// Free users get limited messages per girlfriend
const premiumActive = await getPremiumActive(ctx, userId);
if (!premiumActive && convo.freeRemaining.text <= 0) {
  throw new Error("Free quota exhausted");
}
```

#### AI Integration Flow
```
User sends message → sendMessage mutation → ctx.scheduler.runAfter(0, aiReply)
                                           ↓
AI action: Get context → Try DeepSeek → Fallback to Together.ai → Insert response
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

## Chat System Implementation Details

### Real-time UI Patterns

#### Thread List with Real-time Updates
```javascript
// app/chat/page.js
export default function ThreadsPage() {
  const threads = useQuery(api.chat.getThreads) || [];

  return (
    <div className="max-w-screen-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Chats</h1>
      <ul className="divide-y">
        {threads.map(t => (
          <li key={t.conversationId} className="py-3">
            <Link href={`/chat/${t.conversationId}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.girlName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(t.lastMessageAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {t.lastMessagePreview || "Say hi 👋"}
                  </div>
                </div>
                {t.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Conversation Interface with Security
```javascript
// app/chat/[conversationId]/page.js
export default function ConversationPage({ params }) {
  const [text, setText] = useState("");
  const [permit, setPermit] = useState(null);

  const conversation = useQuery(api.chat.getConversation, {
    conversationId: params.conversationId
  });

  const { ready, getToken } = useInvisibleTurnstile();
  const mintPermit = useAction(api.turnstile.mintPermit);
  const sendMessage = useMutation(api.chat.sendMessage);

  // Prefetch permit when page loads
  useEffect(() => {
    if (ready && !permit) {
      getToken().then(token =>
        mintPermit({ token, scope: "chat_send" })
      ).then(setPermit);
    }
  }, [ready]);

  const handleSend = async () => {
    if (!permit || permit.usesLeft <= 0) {
      // Get fresh permit
      const token = await getToken();
      const newPermit = await mintPermit({ token, scope: "chat_send" });
      setPermit(newPermit);
      await sendMessage({
        conversationId: params.conversationId,
        text,
        permitId: newPermit.permitId,
      });
    } else {
      await sendMessage({
        conversationId: params.conversationId,
        text,
        permitId: permit.permitId,
      });
      // Optimistically decrement
      setPermit(p => ({ ...p, usesLeft: p.usesLeft - 1 }));
    }
    setText("");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation?.messages?.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.sender === "user" ? "text-right" : ""}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.sender === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="btn">
            Send
          </button>
        </div>

        {/* Quota warning */}
        {!conversation?.premiumActive && conversation?.freeRemaining?.text <= 3 && (
          <div className="mt-2 text-sm text-amber-600">
            {conversation.freeRemaining.text} free messages remaining.
            <a href="/plans" className="text-blue-600 underline ml-1">Upgrade</a>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Security Implementation

#### Turnstile Permit System
```javascript
// convex/turnstile.js
export const mintPermit = action({
  args: { token: v.string(), scope: v.optional(v.string()) },
  handler: async (ctx, { token, scope = "chat_send" }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Verify token with Cloudflare
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const { success } = await result.json();
    if (!success) throw new Error("Turnstile verification failed");

    // Check premium status for permit limits
    const profile = await ctx.runQuery(api.profile.getMine, {});
    const isPremium = profile?.premiumUntil > Date.now();

    const permitId = await ctx.runMutation(api.turnstile._createPermit, {
      userId,
      usesLeft: isPremium ? PERMIT_USES_PREMIUM : PERMIT_USES_FREE,
      ttlMs: isPremium ? PERMIT_TTL_MS_PREMIUM : PERMIT_TTL_MS_FREE,
      scope,
    });

    return { permitId, usesLeft: isPremium ? PERMIT_USES_PREMIUM : PERMIT_USES_FREE };
  },
});
```

### Complete User Flow Example

#### From Thread Selection to AI Response
```
1. User visits /chat
   ├─ getThreads query → renders conversation list
   └─ Click conversation → navigate to /chat/[conversationId]

2. Conversation page loads
   ├─ getConversation query → renders messages + UI
   ├─ useInvisibleTurnstile → loads Cloudflare widget
   └─ Prefetch permit: getToken() → mintPermit() → store locally

3. User sends message
   ├─ Validate local permit (usesLeft > 0, not expired)
   ├─ If invalid: getToken() → mintPermit() → fresh permit
   ├─ sendMessage({ conversationId, text, permitId })
   └─ Server: validate permit → consume use → insert message → schedule AI

4. Real-time updates
   ├─ User message appears immediately (reactive)
   ├─ AI action runs in background after mutation commits
   ├─ aiReply: get context → call LLM → insert AI message
   └─ AI message appears automatically (reactive)
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

# LLM APIs (Chat System)
LLM_BASE_URL_PRIMARY=https://api.deepseek.com
LLM_API_KEY_PRIMARY=your_deepseek_api_key
LLM_MODEL_PRIMARY=deepseek-chat

LLM_BASE_URL_FALLBACK=https://api.together.xyz
LLM_API_KEY_FALLBACK=your_together_api_key
LLM_MODEL_FALLBACK=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex backend (separate terminal)

# Build
npm run build        # Build for production
```

This structure provides a complete AI girlfriend platform with real-time chat system that integrates seamlessly with authentication, user profiles, premium features, girl management, and media handling. The chat system (Section 1) is fully implemented with text messaging, security controls, and AI responses.
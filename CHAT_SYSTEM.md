# Chat System Documentation

This document explains the current chat system implementation for the AI girlfriend platform. The system includes Section 1 (text chat) and Section 2 (media support) with preparation for Section 3 (audio).

## Architecture Overview

The chat system is built on **Convex** with real-time reactivity and follows these core principles:

- **Single reactive query** drives conversation screens via `getConversation`
- **Server-validated security** using Cloudflare Turnstile with permit system
- **Scheduled AI actions** for deterministic mutations and external API calls
- **Media handling** with S3 uploads and CloudFront batch-signed viewing
- **Free quota enforcement** (text/media/audio) with premium bypass
- **Denormalized threading** for fast thread list performance

### System Components

1. **Database**: Convex tables for conversations, messages, Turnstile permits
2. **Server Functions**: Queries (read), mutations (write), actions (external calls)
3. **Client Pages**: Thread list (`/chat`) and conversation (`/chat/[id]`)
4. **Security Layer**: Invisible Turnstile with permit-based rate limiting
5. **AI Integration**: OpenAI-compatible API with DeepSeek → Together.ai fallback
6. **Media Pipeline**: S3 upload → validation → CloudFront batch signing
7. **AI Media Selection**: Asset-based replies with tag matching

---

## Database Schema

### conversations
Stores per-user conversations with AI girlfriends, including quota tracking:

```js
conversations: defineTable({
  userId: v.id("users"),              // conversation owner
  girlId: v.id("girls"),              // AI girlfriend profile
  freeRemaining: v.object({           // free message quotas
    text: v.number(),                 // text messages left
    media: v.number(),                // image/video quota
    audio: v.number(),                // voice notes quota (Section 3)
  }),
  lastMessageAt: v.number(),          // ms epoch - for thread sorting
  lastMessagePreview: v.string(),     // denormalized for thread list
  lastReadAt: v.number(),             // ms epoch - for unread indicator
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user_updated", ["userId", "updatedAt"])
.index("by_user_girl", ["userId", "girlId"])
```

### messages
Individual chat messages within conversations (supports text, images, videos):

```js
messages: defineTable({
  conversationId: v.id("conversations"),
  sender: v.union(v.literal("user"), v.literal("ai")),
  kind: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
  text: v.optional(v.string()),       // message text or media caption
  mediaKey: v.optional(v.string()),   // S3 key for image/video files
  createdAt: v.number(),              // ms epoch
})
.index("by_conversation_ts", ["conversationId", "createdAt"])
```

### turnstile_permits
Multi-use security permits (improvement over single-use nonces):

```js
turnstile_permits: defineTable({
  userId: v.id("users"),
  usesLeft: v.number(),               // remaining uses (5 free, 50 premium)
  expiresAt: v.number(),              // ms epoch (2min free, 10min premium)
  createdAt: v.number(),
  scope: v.optional(v.string()),      // "chat_send" for future scoping
})
.index("by_user", ["userId"])
```

---

## Server Functions

### Queries (Real-time Reads)

#### `getThreads()` - Thread List
Returns user's conversations sorted by most recent activity:

```js
export const getThreads = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const threads = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", q => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Attach girl info and calculate unread status
    const results = [];
    for (const c of threads) {
      const girl = await ctx.db.get(c.girlId);
      results.push({
        conversationId: c._id,
        girlName: girl?.name ?? "Unknown",
        lastMessagePreview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt,
        unread: c.lastMessageAt > (c.lastReadAt || 0),
      });
    }
    return results;
  },
});
```

#### `getConversation(conversationId)` - Single Conversation
Core reactive query that drives conversation screens:

```js
export const getConversation = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, { conversationId, limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== userId) throw new Error("Not found");

    const premiumActive = await getPremiumActive(ctx, userId);
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_ts", q => q.eq("conversationId", conversationId))
      .order("desc")
      .take(limit);

    return {
      conversationId,
      girlId: convo.girlId,
      freeRemaining: { text: convo.freeRemaining.text },
      premiumActive,
      messages: msgs.reverse(), // ascending for UI
    };
  },
});
```

### Mutations (Transactional Writes)

#### `startConversation(girlId)` - Create/Find Conversation
Creates new conversation or returns existing one with initial quotas.

#### `sendMessage(conversationId, text, permitId)` - Send Text Message
Core text message sending with security and quota enforcement.

#### `sendMediaMessage(conversationId, kind, objectKey, caption, permitId)` - Send Media
Sends image/video message after S3 upload completion:

```js
export const sendMediaMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    objectKey: v.string(),             // S3 key from upload
    caption: v.optional(v.string()),   // optional caption
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, kind, objectKey, caption, permitId }) => {
    // Validate permit and consume use
    // Insert media message with mediaKey
    // Update conversation preview: "[Image]" or "[Video]"
    // Schedule AI reply
  },
});
```

#### Internal Mutations for AI Replies

```js
// Insert AI text response
export const _insertAIText = internalMutation({
  args: { conversationId: v.id("conversations"), text: v.string() },
  // Inserts AI text message and updates conversation
});

// Insert AI media response + decrement quota
export const _insertAIMediaAndDec = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    mediaKey: v.string(),              // Asset from girl_media table
    caption: v.optional(v.string()),
  },
  // Inserts AI media message and decrements media quota for free users
});
```

### Actions (External API Calls)

#### `aiReply(conversationId, userMessageId)` - Generate AI Response
Calls external LLM APIs with media-aware context and handles media/text replies:

```js
export const aiReply = action({
  args: { conversationId: v.id("conversations"), userMessageId: v.optional(v.id("messages")) },
  handler: async (ctx, { conversationId }) => {
    // Get context with media placeholders (not URLs)
    const { persona, history, freeRemaining, premiumActive } =
      await ctx.runQuery(api.chat_actions._getContextV2, { conversationId, limit: 8 });

    // LLM decides: { type: "text|image|video", text: "...", tags: ["..."] }
    const decision = await callLLMAndParse(persona, history);

    // Check quota and fallback to text if needed
    const outOfMedia = !premiumActive && freeRemaining.media <= 0;
    if (decision.type === "text" || outOfMedia) {
      await ctx.runMutation(api.chat_actions._insertAIText, {
        conversationId, text: decision.text
      });
      return { ok: true, kind: "text" };
    }

    // Pick media asset from girl's reply assets, optionally by tags
    const assets = await ctx.runQuery(api.girls.listGirlAssetsForReply, {
      girlId, kind: decision.type
    });
    const chosen = selectAssetByTags(assets, decision.tags);

    // Insert media response and decrement quota
    await ctx.runMutation(api.chat_actions._insertAIMediaAndDec, {
      conversationId, kind: decision.type, mediaKey: chosen.objectKey,
      caption: decision.text
    });

    return { ok: true, kind: decision.type };
  },
});
```

#### S3 & CDN Actions

```js
// Sign upload URL for chat media
export const signChatUpload = action({
  args: { conversationId, kind, contentType, size },
  // Returns { uploadUrl, objectKey } for client upload
});

// Validate uploaded file exists with correct size/type
export const finalizeChatUpload = action({
  args: { objectKey, kind },
  // HEAD check S3 object and validate constraints
});

// Batch sign URLs for viewing media in conversation
export const signViewBatch = action({
  args: { keys: v.array(v.string()) },
  // Returns { urls: { key: signedUrl }, expiresAt }
});
```

---

## Client Components

### Thread List (`/chat/page.js`)
Simple reactive list of user conversations with girl names, last message previews, timestamps, and unread indicators.

### Conversation Page (`/chat/[conversationId]/page.js`)
Real-time conversation with media support and Turnstile permit management:

- **Reactive messages** via `getConversation` query (text + media)
- **Media bubble rendering** with batch-signed CloudFront URLs
- **MediaComposer** component for uploading images/videos
- **Permit prefetching** when page loads
- **Optimistic permit decrement** for smooth UX

Key features:
- Auto-scroll to bottom on new messages
- Mark as read when viewing
- Media preview before sending
- Quota exhaustion warnings with upgrade CTA
- Loading states during send operations

#### New Media Components

**MediaComposer.js** - Handles media attachment and upload:
```js
// File picker → preview → S3 upload → send message
// Validates file type (image/video) and size (3MB/5MB)
// Shows preview with optional caption input
```

**useSignedMediaUrls.js** - Batch URL signing hook:
```js
// Maps mediaKey → signedUrl for all visible messages
// Single batch call to signViewBatch action
// Handles URL expiration and refresh
```

### Invisible Turnstile Hook (`useInvisibleTurnstile.js`)
Custom hook for seamless security challenges. Loads Cloudflare Turnstile script, renders invisible widget, and provides `getToken()` method for permit generation.

---

## Complete User Flows

### Text Message Flow
1. **Page Load**: Thread list → conversation selection → Turnstile initialization
2. **Message Send**: User types → permit validation → `sendMessage` mutation → quota enforcement
3. **AI Reply**: Scheduled action → LLM call (DeepSeek/Together.ai fallback) → response insertion
4. **Real-time Updates**: Convex reactive queries update UI automatically
5. **Security**: Server-side permit validation, quota enforcement, auto-retry on failures

---

### 8. Enhanced Error Handling
**Current Implementation** includes:
- Automatic retry on permit validation failure
- Graceful fallback from primary to secondary LLM
- User-friendly error messages
- Permit regeneration on security failures

---

## Media Message Flow (Section 2)

### User Sends Media
```
User selects file → MediaComposer validation → Preview
│
├─ File type check: image/* or video/*
├─ Size check: ≤3MB (image) or ≤5MB (video)
├─ Show preview with caption input
└─ User clicks "Send" → Media upload flow:
    │
    ├─ signChatUpload({ conversationId, kind, contentType, size })
    ├─ S3 PUT with presigned URL
    ├─ finalizeChatUpload({ objectKey, kind }) - HEAD validation
    ├─ sendMediaMessage({ conversationId, kind, objectKey, caption, permitId })
    └─ Schedule AI reply
```

### AI Responds with Media
```
aiReply action → LLM decision: { type: "image|video", text: "...", tags: [...] }
│
├─ Check user's media quota (skip if premium)
├─ Query girl's reply assets by kind + tags
├─ Pick random or tag-matched asset
├─ _insertAIMediaAndDec: insert message + decrement quota
└─ Real-time update to client
```

### Media Viewing (Batch Signed URLs)
```
Conversation loads → useSignedMediaUrls hook
│
├─ Extract all mediaKeys from visible messages
├─ signViewBatch({ keys: [...] }) → CloudFront signed URLs
├─ Map mediaKey → signedUrl for 5-minute expiration
└─ Render media bubbles with signed URLs
```

---

## Configuration

### Environment Variables

```env
# Turnstile Security
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Primary LLM (DeepSeek)
LLM_BASE_URL_PRIMARY=https://api.deepseek.com
LLM_API_KEY_PRIMARY=your_deepseek_api_key
LLM_MODEL_PRIMARY=deepseek-chat

# Fallback LLM (Together.ai)
LLM_BASE_URL_FALLBACK=https://api.together.xyz
LLM_API_KEY_FALLBACK=your_together_api_key
LLM_MODEL_FALLBACK=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

### Chat Configuration (`convex/chat.config.js`)

```js
// Free user quotas per girlfriend
export const FREE_TEXT_PER_GIRL = 10;
export const FREE_MEDIA_PER_GIRL = 2;   // future sections
export const FREE_AUDIO_PER_GIRL = 3;   // future sections

// AI context window
export const CONTEXT_TURNS = 8;

// Turnstile permit settings
export const PERMIT_USES_FREE = 5;              // free users
export const PERMIT_TTL_MS_FREE = 2 * 60 * 1000; // 2 minutes

export const PERMIT_USES_PREMIUM = 50;            // premium users
export const PERMIT_TTL_MS_PREMIUM = 10 * 60 * 1000; // 10 minutes
```

---

## Security Features

1. **Server-side Turnstile validation** - All tokens verified with Cloudflare
2. **Permit-based rate limiting** - Multi-use permits prevent abuse
3. **Authentication checks** - All operations require valid user session
4. **Conversation ownership** - Users can only access their own conversations
5. **Input sanitization** - Text trimmed and validated before processing
6. **External API isolation** - LLM calls in actions, not mutations

## Performance Optimizations

1. **Reactive queries** - Real-time updates without polling
2. **Denormalized thread list** - Fast loading without joins
3. **Limited context window** - Last 8 turns to control API costs
4. **Permit prefetching** - Reduced latency on first message
5. **Optimistic updates** - Immediate UI feedback
6. **Indexed queries** - Efficient database access patterns

---

## Section 3 Planning: Audio Support

The system is ready for audio extension. Key integration points:

### Database Schema Extensions
- **messages table**: Add `kind: "audio"` union member
- **mediaKey field**: Will store audio file S3 keys (reuse existing pattern)
- **durationSec field**: Audio length for UI progress bars
- **text field**: Optional transcription or user note

### Server Function Extensions
- **sendAudioMessage**: Similar to sendMediaMessage but for audio uploads
- **S3 validation**: Add audio MIME types (audio/webm, audio/mp3, audio/wav)
- **Size limits**: ~2MB for audio files, configurable duration limits
- **AI context**: Represent audio as "User sent AUDIO. note: '...'" placeholders

### AI Integration Extensions
- **ElevenLabs integration**: New action for text-to-speech conversion
- **Voice selection**: Link `girls.voiceId` to ElevenLabs voice models
- **Audio asset storage**: Store generated audio in S3 for reuse/caching
- **Quota management**: `freeRemaining.audio` decremented on AI voice replies

### Client Extensions
- **AudioComposer**: Record → preview → upload flow (WebRTC MediaRecorder)
- **Audio playback**: Custom audio player with progress, speed control
- **Waveform visualization**: Optional visual representation of audio

### Performance Considerations
- **Audio transcription**: Optional OpenAI Whisper integration for searchability
- **Audio compression**: Server-side optimization for storage/bandwidth
- **Streaming playback**: Progressive loading for long audio files
- **CDN delivery**: Same CloudFront pattern as images/videos

### Quota & Limits
- **Free tier**: 3 audio messages per girl (send + receive combined)
- **Premium tier**: Unlimited audio messages
- **File size**: 2MB limit, 5-minute duration limit
- **Generation time**: ElevenLabs API rate limiting considerations

---

## Current System Status

**✅ Section 1**: Text chat with LLM integration, quota management, security
**✅ Section 2**: Image/video upload, AI media replies, batch CDN signing, quota enforcement
**⏳ Section 3**: Audio recording, voice synthesis, transcription (planned)
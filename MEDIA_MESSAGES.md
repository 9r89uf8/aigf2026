# Media Message Documentation (Image/Video)

## Overview

Media messages allow users to send images and videos to AI girlfriends, and AI can respond with relevant media. Key characteristics:

- **Types:** Image (jpeg/png/webp) or Video (mp4/webm)
- **Optional captions:** Text can accompany media
- **Direct S3 upload:** Files upload directly to S3 (not through backend)
- **CloudFront delivery:** All media served via signed CloudFront URLs
- **Quota system:** AI media responses consume quota, but user uploads do NOT
- **Asset-based responses:** AI selects from pre-uploaded reply assets

## Architecture

```
USER SENDING MEDIA:
┌─────────────────────────────────────────────────────────────┐
│  Frontend (MediaComposer.js)                                 │
│  1. User picks image/video file                              │
│  2. Request presigned URL ────────────────┐                  │
└────────────────────────────────────────────┼─────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│  Backend (convex/s3.js)                                        │
│  3. signChatUpload → generate presigned PUT URL                │
└────────────────────────────────────────────┬─────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│  AWS S3 (Direct Upload)                                        │
│  4. Client uploads file via PUT (bypasses backend)             │
└────────────────────────────────────────────┬─────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│  Backend Validation                                            │
│  5. finalizeChatUpload → HEAD check (size/type)                │
│  6. sendMediaMessage → store in messages table                 │
│  7. Schedule AI reply                                          │
└──────────────────────────────────────────────────────────────┘

AI RESPONDING WITH MEDIA:
┌──────────────────────────────────────────────────────────────┐
│  AI Decision (convex/chat_actions.js)                         │
│  1. LLM decides response type (text/image/video/audio)        │
│  2. If image/video: check quota                               │
│  3. Query girl_media assets (isReplyAsset=true)               │
│  4. Tag-based selection or random                             │
│  5. Insert AI message + decrement quota                       │
└──────────────────────────────────────────────────────────────┘

MEDIA DISPLAY:
┌──────────────────────────────────────────────────────────────┐
│  Frontend (useSignedMediaUrls hook)                           │
│  1. Extract all mediaKeys from messages                       │
│  2. Batch request signed URLs (signViewBatch)                 │
│  3. CloudFront signed URLs (5 min expiry)                     │
│  4. Render <img> or <video> with signed URLs                  │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### messages table (same as text)
```javascript
// convex/schema.js:116-125
{
  conversationId: v.id("conversations"),
  sender: "user" | "ai",
  kind: "image" | "video",           // Media type
  text: v.optional(v.string()),      // Caption (optional)
  mediaKey: v.string(),               // S3 object key (required for media)
  durationSec: v.optional(v.number()), // Video duration (optional)
  createdAt: v.number(),
}
```

### girl_media table (AI response assets)
```javascript
// convex/schema.js:45-71
{
  girlId: v.id("girls"),
  kind: "image" | "video",

  // Surfaces (media can serve multiple purposes)
  isGallery: v.boolean(),           // Public gallery
  isPost: v.boolean(),              // Social feed
  isReplyAsset: v.boolean(),        // Available for AI chat replies

  objectKey: v.string(),            // S3 key
  text: v.optional(v.string()),     // Description/caption (used for tag matching)
  likeCount: v.number(),
  canBeLiked: v.boolean(),
  mature: v.boolean(),
  premiumOnly: v.boolean(),
  location: v.optional(v.string()),
  durationSec: v.optional(v.number()),
  published: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}
// Indexes: by_girl_assets for fast reply asset queries
```

## User Sending Media Flow

### Step 1: File Selection (Frontend)
- Location: `components/chat/MediaComposer.js:30-50`
- User clicks "Attach" button, picks file
- Client-side validation:
  - **Images:** Max 3MB, types: jpeg/png/webp
  - **Videos:** Max 5MB, types: mp4/webm
- Generate local preview via `URL.createObjectURL()`

### Step 2: Request Presigned Upload URL
- Location: `components/chat/MediaComposer.js:57-62`
- Calls `signChatUpload` action (`convex/s3.js:132-164`)
- Backend validates: auth, kind/type match, size limits
- Generates S3 key: `chat/{conversationId}/user/{uuid.ext}`
- Returns presigned PUT URL (5-minute expiry)

### Step 3: Direct S3 Upload (Client-Side)
- Location: `components/chat/MediaComposer.js:64`
- Client performs PUT request directly to S3 presigned URL
- **Bypasses backend entirely** for better performance
- No Convex involved in actual file transfer

```javascript
// components/chat/MediaComposer.js:64
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file
});
```

### Step 4: Finalize & Validate
- Location: `components/chat/MediaComposer.js:66` → `convex/s3.js:166-184`
- HEAD request to S3 verifies file exists
- Server-side re-validates size and content-type (prevents client tampering)

### Step 5: Send Mutation
- Location: `components/chat/MediaComposer.js:68-74` → `convex/chat.js:197-237`
- **Key differences from text `sendMessage`:**
  1. Takes `kind` (image/video), `objectKey`, optional `caption`
  2. **NO quota check for user sending** (only AI responses cost quota)
  3. Stores `mediaKey` field instead of just `text`
- Process: Auth → Permit validation → Insert message with `mediaKey` → Update preview → Schedule AI reply

## AI Responding with Media

### Step 1: LLM Decision
- Location: `convex/chat_actions.js:146-164`
- Same as text messages: AI generates JSON response
- Decision format: `{ type: "image" | "video", text: "...", tags: [...] }`

### Step 2: Quota Check
- Location: `convex/chat_actions.js:202-207`
- **AI media responses DO consume quota** (unlike user uploads)
- Free users: 2 media/conversation | Premium: unlimited
- Falls back to text if quota exhausted

### Step 3: Asset Selection
- Location: `convex/chat_actions.js:210-225` (query: `convex/girls.js:208-221`)
- Queries `girl_media` where `isReplyAsset=true` and `kind` matches
- **Tag-based selection:** If LLM provides tags (e.g., `["beach", "bikini"]`), filters assets whose descriptions contain those keywords
- Picks randomly from matching assets (or all if no tag matches)
- Falls back to text if no assets available

### Step 4: Insert & Decrement Quota
- Location: `convex/chat_actions.js:227-232` (mutation: line 113)
- Inserts AI message with `sender: "ai"`, `kind`, `mediaKey`, optional `caption`
- Decrements `freeRemaining.media` (free users only)
- Updates conversation preview and timestamps

## Media Display & Signing

### CloudFront Signed URLs

All S3 media is private and requires CloudFront signed URLs to view:

**Why signing is needed:**
- S3 objects are private (ACL: private)
- CloudFront distribution sits in front of S3
- Signed URLs grant temporary access (5 minutes)
- Prevents unauthorized direct access

### Batch Signing Hook

- Location: `components/chat/useSignedMediaUrls.js`
- Extracts unique `mediaKey` values from messages
- Batches signing via `api.cdn.signViewBatch`
- Returns `{ mediaKey: signedUrl }` map

### Signing Implementation

- Location: `convex/cdn.js:80-108`
- CloudFront RSA-SHA1 canned policy signing, 5-minute expiry
- Access control: only allows `girls/`, `chat/`, `tts/` paths
- Batch processes all keys in single request

### Rendering Media

- Location: `app/chat/[conversationId]/page.js:138-149`
- Uses signed URLs from `useSignedMediaUrls` hook
- Shows loading skeleton while signing in progress
- Renders `<img>` or `<video>` with signed URL + optional caption

## Key Files & Functions

### Frontend

#### `components/chat/MediaComposer.js`
**Purpose:** Media upload component

**Key Functions:**
- `onPick()` (line 30) - File selection & validation
- `onSend()` (line 52) - 3-step upload flow

**Key State:**
- `file` - Selected file
- `caption` - Optional caption text
- `previewUrl` - Local preview URL
- `sending` - Upload in progress

**Key Actions:**
- `signUpload` - Request presigned URL
- `finalize` - Validate upload
- `sendMedia` - Send mutation

#### `components/chat/useSignedMediaUrls.js`
**Purpose:** Batch CloudFront URL signing hook

**Returns:** `{ mediaKey: signedUrl }` map

**Auto-updates when:** Messages change (reactive)

### Backend

#### `convex/s3.js`
**Purpose:** S3 operations (uploads, transcription, TTS)

**Key Actions:**
- `signChatUpload` (line 132) - Generate presigned upload URL
- `finalizeChatUpload` (line 166) - Validate uploaded file
- `signAvatarUpload` (line 38) - User avatar uploads
- `signGirlMediaUpload` (line 95) - Admin media uploads

**Validation:**
- `validateKindAndType()` (line 126) - Match kind with content-type
- Double validation: pre-upload + post-upload HEAD check

#### `convex/chat.js`
**Purpose:** Chat mutations

**Key Mutation:**
- `sendMediaMessage` (line 197) - Send user media message

**Differences from sendMessage:**
- Takes `kind`, `objectKey`, `caption` (no `text` alone)
- No quota check for user sending
- Stores `mediaKey` field

#### `convex/chat_actions.js`
**Purpose:** AI response logic

**Key Mutations:**
- `_insertAIMediaAndDec` (line 113) - Insert AI media + decrement quota

**Media Selection Logic:**
- Query reply assets (line 210)
- Tag-based matching (line 220)
- Fallback to text if no assets (line 213)

#### `convex/cdn.js`
**Purpose:** CloudFront signed URL generation

**Key Actions:**
- `signViewBatch` (line 80) - Batch sign multiple keys
- `cfSignView` (line 10) - Single URL signing (legacy)

**Signing Algorithm:**
- RSA-SHA1 canned policy
- 5-minute expiry
- Base64-encoded signature

#### `convex/girls.js`
**Purpose:** Girl profile & asset management

**Key Query:**
- `listGirlAssetsForReply` (line 208) - Get reply assets filtered by kind

**Filter Logic:**
- `isReplyAsset = true`
- `kind` matches (image/video)
- Active/published only

## Validation & Limits

### Client-Side Validation
- Location: `components/chat/MediaComposer.js:30-50`

| Type | Max Size | Allowed Formats |
|------|----------|----------------|
| Image | 3 MB | jpeg, png, webp |
| Video | 5 MB | mp4, webm |

### Server-Side Validation

**Pre-Upload:** `convex/s3.js:143-145` - Validates size & content-type before presigning

**Post-Upload:** `convex/s3.js:173-180` - HEAD request confirms actual size/type (prevents client tampering)

## Quota System

| Who | Cost | Limit |
|-----|------|-------|
| **User sending** | FREE ✅ | Unlimited (Turnstile rate-limited) |
| **AI sending (free)** | 💰 | 2 per conversation |
| **AI sending (premium)** | FREE | Unlimited |

Enforcement at `convex/chat_actions.js:202-207` - falls back to text if quota exhausted

## Error Handling

| Error | Cause | Location | Solution |
|-------|-------|----------|----------|
| "Unsupported file type" | Wrong MIME type | `MediaComposer.js:36` | Check file picker accept attribute |
| "Image too large" | File > 3MB | `MediaComposer.js:40` | Client-side validation before upload |
| "Video too large" | File > 5MB | `MediaComposer.js:44` | Client-side validation before upload |
| "Could not send media" | Upload/finalize failed | `MediaComposer.js:82` | Retry or check S3 permissions |
| "Unauthenticated" | User not logged in | `s3.js:141` | Redirect to login |
| "Forbidden path" | Invalid S3 key | `cdn.js:93` | Check media key format |

## Comparison: Text vs Media Messages

| Aspect | Text Messages | Media Messages |
|--------|--------------|----------------|
| **Input** | Text field | File picker + optional caption |
| **Upload Flow** | Direct mutation | 3-step: presign → upload → finalize |
| **Backend Mutation** | `sendMessage` | `sendMediaMessage` |
| **User Quota Cost** | Yes (10 per girl) | No (unlimited) |
| **AI Quota Cost** | No | Yes (2 per girl for free users) |
| **Schema Fields** | `text` | `mediaKey`, optional `text` (caption) |
| **Validation** | Text length | File size, type, double-check |
| **Display** | Plain text | CloudFront signed URLs |
| **Expiry** | N/A | 5-minute signed URL expiry |
| **AI Selection** | LLM generates text | LLM picks from asset library |

## Extension Points

### Custom Media Filters
Add image processing (resize, watermark) in `finalizeChatUpload` before accepting upload

### Enhanced Tag Matching
Improve asset selection by adding ML-based semantic matching instead of keyword matching

### Video Thumbnails
Extract thumbnail on upload for faster preview rendering

### Mature Content Filtering
Add moderation API call in `finalizeChatUpload` to check for inappropriate content

### Compression
Implement client-side or server-side compression for large files before S3 upload

## Performance Considerations

- **Direct S3 Upload:** Bypasses backend for 100MB+ files → faster uploads, less server load
- **Batch Signing:** Single API call signs all media in conversation → reduces round trips
- **CloudFront CDN:** Media served from edge locations → low latency globally
- **5-Minute Cache:** Signed URLs valid for 5 minutes → balances security & UX
- **Lazy Loading:** Media only signed when messages loaded → saves bandwidth

## Related Documentation

- **Text Messages:** See TEXT_MESSAGES.md
- **Audio Messages:** See AUDIO_MESSAGES.md (future)
- **S3/CloudFront:** See s3-cloudfront-implementation.md
- **Admin Media Management:** See admin-implementation.md
# Text Message Documentation

## Overview

Text messages are the primary communication method in the chat system. They represent plain text exchanges between users and AI girlfriends. Unlike media (image/video) or audio messages, text messages:
- Are the most frequently used message type
- Have generous free quotas (10 per girl for free users)
- Support real-time bidirectional communication
- Trigger AI responses automatically
- Include security validation via Cloudflare Turnstile

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  app/chat/[conversationId]/page.js                        │  │
│  │  - Input field for text                                   │  │
│  │  - Message display (reactive)                             │  │
│  │  - Turnstile integration                                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  components/useInvisibleTurnstile.js                      │  │
│  │  - Cloudflare Turnstile hook                              │  │
│  │  - Token generation                                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ sendMessage({ conversationId, text, permitId })
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Convex)                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  convex/turnstile.js                                      │ │
│  │  - verifyAndMintPermit (action)                           │ │
│  │  - Server-side Turnstile verification                     │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  convex/chat.js                                           │ │
│  │  - sendMessage (mutation)                                 │ │
│  │  - Permit validation                                      │ │
│  │  - Quota enforcement                                      │ │
│  │  - Store user message                                     │ │
│  │  - Schedule AI reply                                      │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  convex/chat_actions.js                                   │ │
│  │  - aiReply (action)                                       │ │
│  │  - Build conversation context                             │ │
│  │  - Call LLM API                                            │ │
│  │  - Parse & store AI response                              │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### messages table
```javascript
// convex/schema.js:116-125
{
  conversationId: v.id("conversations"),
  sender: "user" | "ai",                // Who sent the message
  kind: "text" | "image" | "video" | "audio",  // Message type
  text: v.optional(v.string()),         // Message content (required for text)
  mediaKey: v.optional(v.string()),     // S3 key (null for text)
  durationSec: v.optional(v.number()),  // Duration (null for text)
  createdAt: v.number(),                // Timestamp (ms epoch)
}
// Index: by_conversation_ts on [conversationId, createdAt]
```

### conversations table
```javascript
// convex/schema.js:99-114
{
  userId: v.id("users"),
  girlId: v.id("girls"),
  freeRemaining: {
    text: v.number(),     // Free text messages remaining
    media: v.number(),    // Free media messages remaining
    audio: v.number(),    // Free audio messages remaining
  },
  lastMessageAt: v.number(),            // Last message timestamp
  lastMessagePreview: v.string(),       // Preview for thread list
  lastReadAt: v.number(),               // Last read timestamp
  createdAt: v.number(),
  updatedAt: v.number(),
}
// Indexes: by_user_updated, by_user_girl
```

### turnstile_permits table
```javascript
// convex/schema.js:134-140
{
  userId: v.id("users"),
  usesLeft: v.number(),     // Remaining uses (5 for free, 50 for premium)
  expiresAt: v.number(),    // Expiration timestamp
  createdAt: v.number(),
  scope: v.optional(v.string()),  // "chat_send"
}
// Index: by_user
```

## Message Flow

### User Sending Text Message

**Step 1: User Input (Frontend)**
- Location: `app/chat/[conversationId]/page.js:163-176`
- User types text in input field
- Text stored in local state via `setText()`
- "Send" button triggers `onSend()`

**Step 2: Security Token Acquisition**
- Location: `app/chat/[conversationId]/page.js:69-75`
- `ensurePermit()` checks if valid permit exists locally
- If no valid permit:
  - Calls `getToken()` from `useInvisibleTurnstile` hook
  - Location: `components/useInvisibleTurnstile.js:97-130`
  - Cloudflare Turnstile widget executes invisibly
  - Returns Turnstile token

**Step 3: Permit Minting**
- Location: `app/chat/[conversationId]/page.js:72`
- Calls `mintPermit({ token, scope: "chat_send" })`
- Backend action: `convex/turnstile.js:83-116`
- Server-side verification with Cloudflare API
- Creates permit in database with 5 uses (free) or 50 uses (premium)
- Returns `{ permitId, usesLeft, expiresAt }`

**Step 4: Send Mutation**
- Location: `app/chat/[conversationId]/page.js:83`
- Calls `send({ conversationId, text, permitId })`
- Backend mutation: `convex/chat.js:136-194`

**Step 5: Mutation Execution (Backend)**
- Location: `convex/chat.js:136-194`
- Key operations in order:
  1. Authenticate user via `getAuthUserId()`
  2. Validate text is not empty
  3. Verify permit (ownership, expiration, uses remaining)
  4. Decrement permit uses atomically
  5. Get conversation & verify ownership
  6. Check premium status
  7. Enforce quota (free users only) - decrement `freeRemaining.text`
  8. Insert user message into `messages` table
  9. Update conversation metadata (preview, timestamps)
  10. Schedule AI reply via `ctx.scheduler.runAfter()`

**Step 6: Client Updates**
- Location: `app/chat/[conversationId]/page.js:84-86`
- Optimistically decrement local permit counter
- Clear text input field
- Convex reactive query automatically updates message list

### AI Response Generation

**Step 1: Action Triggered**
- Location: `convex/chat.js:188-190`
- Scheduler calls `api.chat_actions.aiReply` after user message is stored
- Action runs outside the mutation transaction (non-blocking)

**Step 2: Context Building**
- Location: `convex/chat_actions.js:149-151`
- Calls internal query `_getContextV2` to build conversation context
- Location: `convex/chat_actions.js:8-68`
- Retrieves last N messages (defined by `CONTEXT_TURNS = 8`)
- Gets girl's persona prompt
- Includes premium status and remaining quotas
- Formats messages for LLM (user/assistant roles)

**Step 3: LLM Call**
- Location: `convex/chat_actions.js:160-162` (callLLM helper at line 70)
- Constructs messages array with system prompt + history
- Calls primary LLM API with OpenAI-compatible endpoint (temperature: 1.3, max tokens: 220)
- Fallback to secondary LLM if primary fails

**Step 4: Response Parsing**
- Location: `convex/chat_actions.js:164`
- LLM returns JSON decision: `{ type, text, tags }`
- Parser extracts JSON from response
- Falls back to plain text if JSON parsing fails
- Location: `convex/chat_actions.js:81-95`

**Step 5: Text Response Storage**
- Location: `convex/chat_actions.js:167-170` (calls `_insertAIText` at line 98)
- Inserts AI message into messages table with `sender: "ai"` and `kind: "text"`
- Updates conversation's lastMessagePreview and timestamps

**Step 6: UI Update (Reactive)**
- Client's `useQuery(api.chat.getConversation)` automatically re-runs
- Location: `app/chat/[conversationId]/page.js:17`
- New AI message appears in chat interface
- Location: `app/chat/[conversationId]/page.js:111-120`

## Key Files & Functions

### Frontend

#### `app/chat/[conversationId]/page.js`
**Purpose:** Main chat interface for text messaging

**Key Functions:**
- `ensurePermit()` (line 69) - Ensures valid permit exists
- `onSend()` (line 77) - Handles send button click
- Message rendering (lines 111-120) - Displays text messages

**Key State:**
- `text` - Current input text
- `permit` - Active Turnstile permit
- `isSending` - Loading state

**Key Hooks:**
- `useInvisibleTurnstile()` - Security token generation
- `useQuery(api.chat.getConversation)` - Reactive message list
- `useMutation(api.chat.sendMessage)` - Send mutation

#### `components/useInvisibleTurnstile.js`
**Purpose:** Cloudflare Turnstile integration hook

**Key Functions:**
- `loadTurnstileScriptOnce()` (line 10) - Loads Turnstile SDK
- `getToken()` (line 97) - Executes Turnstile challenge

**Returns:**
- `ready` - Boolean indicating Turnstile is loaded
- `getToken()` - Async function returning Turnstile token

### Backend

#### `convex/chat.js`
**Purpose:** Core chat queries and mutations

**Key Queries:**
- `getThreads` (line 20) - List user's conversations
- `getConversation` (line 50) - Get messages for a conversation
- `getMessage` (line 128) - Get single message by ID

**Key Mutations:**
- `sendMessage` (line 136) - Send user text message
- `startConversation` (line 83) - Create/get conversation
- `markRead` (line 115) - Update last read timestamp

**Internal Mutations:**
- `_insertAIMessage` (line 338) - Insert AI text response
- `_applyTranscript` (line 284) - Apply transcript to audio message
- `_insertAIAudioAndDec` (line 303) - Insert AI audio & decrement quota

**Helper Functions:**
- `getPremiumActive()` (line 11) - Check if user has active premium

#### `convex/chat_actions.js`
**Purpose:** AI response generation (runs as actions)

**Key Actions:**
- `aiReply` (line 146) - Main AI response orchestrator

**Internal Queries:**
- `_getContextV2` (line 8) - Build conversation context for LLM

**Internal Mutations:**
- `_insertAIText` (line 98) - Store AI text message
- `_insertAIMediaAndDec` (line 113) - Store AI media & decrement quota

**Helper Functions:**
- `callLLM()` (line 70) - Call LLM API with retry logic
- `parseDecision()` (line 81) - Parse LLM JSON response

#### `convex/turnstile.js`
**Purpose:** Cloudflare Turnstile verification and permit system

**Key Actions:**
- `verifyAndMintPermit` (line 83) - Verify token & create permit
- `verify` (line 34) - Simple token verification

**Internal Queries:**
- `_profileByUserId` (line 11) - Get user profile for premium check

**Internal Mutations:**
- `_insertPermit` (line 21) - Insert permit into database

#### `convex/chat.config.js`
**Purpose:** Configuration constants

**Quota Settings:**
- `FREE_TEXT_PER_GIRL = 10` - Free text messages per conversation
- `FREE_MEDIA_PER_GIRL = 2` - Free media messages per conversation
- `FREE_AUDIO_PER_GIRL = 3` - Free audio messages per conversation

**Context Settings:**
- `CONTEXT_TURNS = 8` - Number of message turns in AI context

**Permit Settings:**
- `PERMIT_USES_FREE = 5` - Uses per permit (free users)
- `PERMIT_TTL_MS_FREE = 120000` - 2 minutes TTL (free users)
- `PERMIT_USES_PREMIUM = 50` - Uses per permit (premium users)
- `PERMIT_TTL_MS_PREMIUM = 600000` - 10 minutes TTL (premium users)

## Security System

### Cloudflare Turnstile Integration

**Purpose:** Prevent automated abuse and bot attacks on the chat system

**Client-Side (Invisible Mode):**
1. Turnstile widget rendered off-screen with `appearance: "execute"`
2. Widget stays hidden unless user needs to solve challenge
3. `getToken()` triggers widget execution
4. Returns single-use token upon success

**Server-Side Verification:**
1. Token sent to `verifyAndMintPermit` action
2. Server calls Cloudflare siteverify API
3. Validates token hasn't been used
4. Mints reusable permit on success

### Permit System

**Why Permits?**
- Turnstile tokens are single-use only
- Obtaining new token requires ~500ms delay
- Permits allow multiple message sends without re-verification
- Improves UX for rapid message sending

**Permit Lifecycle:**
```
1. User loads chat → Turnstile widget initializes
2. User types first message → getToken() called
3. Token sent to server → verifyAndMintPermit()
4. Server verifies with Cloudflare → Success
5. Server creates permit (5 uses, 2min TTL)
6. Client stores permit locally
7-11. User sends 5 messages → Each decrements usesLeft
12. User sends 6th message → Permit expired/exhausted
13. New permit minted → Repeat from step 2
```

**Permit Validation:**
```javascript
// convex/chat.js:149-154
const permit = await ctx.db.get(permitId);
if (!permit ||
    permit.userId !== userId ||           // Ownership check
    permit.expiresAt < Date.now() ||      // Expiration check
    permit.usesLeft <= 0) {               // Uses remaining check
  throw new Error("Security check failed (permit)");
}
```

**Premium Benefits:**
- Free users: 5 uses, 2 minutes TTL
- Premium users: 50 uses, 10 minutes TTL
- Better UX for premium users (fewer re-verifications)

## Quota System

### Free User Quotas

**Per-Girl Limits:**
- Text messages: 10 per conversation
- Media messages: 2 per conversation
- Audio messages: 3 per conversation

**Enforcement:**
```javascript
// convex/chat.js:163-173
if (!premiumActive) {
  if (convo.freeRemaining.text <= 0) {
    throw new Error("Free text quota exhausted");
  }
  await ctx.db.patch(conversationId, {
    freeRemaining: {
      ...convo.freeRemaining,
      text: convo.freeRemaining.text - 1,
    },
  });
}
```

**User Feedback:**
- Remaining quota shown in conversation data
- Location: `app/chat/[conversationId]/page.js:62`
- UI shows upgrade prompt when quota exhausted
- Location: `app/chat/[conversationId]/page.js:154-159`

### Premium Users

**Benefits:**
- Unlimited text messages
- Unlimited media/audio messages
- No quota checks performed
- Premium status checked via `getPremiumActive()` helper

**Premium Check:**
```javascript
// convex/chat.js:11-17
async function getPremiumActive(ctx, userId) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .first();
  return !!(profile?.premiumUntil && profile.premiumUntil > Date.now());
}
```

## Extension Points

### Custom Text Processing
Add filters before storing user message in `convex/chat.js:176-178` (e.g., profanity filter, length validation)

### AI Persona Customization
Modify persona prompt in `convex/chat_actions.js:44-57` to change AI behavior and rules

### Message Reactions
Add reactions field to schema and create `reactToMessage` mutation

### Read Receipts
Already implemented via `markRead` mutation (`convex/chat.js:115`) - updates `lastReadAt` timestamp

## Error Handling

| Error | Cause | Location | Solution |
|-------|-------|----------|----------|
| "Unauthenticated" | User not logged in | `convex/chat.js:144` | Redirect to login |
| "Security check failed (permit)" | Expired/invalid permit | `convex/chat.js:151` | Client auto-retries with new permit |
| "Free text quota exhausted" | Free user hit limit | `convex/chat.js:165` | Show upgrade prompt |
| "Empty message" | Blank text sent | `convex/chat.js:146` | Disable send button |

**Client-Side Recovery:** The frontend automatically retries failed permit errors by clearing and re-minting a new permit (`app/chat/[conversationId]/page.js:90-99`)

## Performance Considerations

- **Reactive Queries:** Convex queries auto-update when data changes - no polling needed
- **Pagination:** Loads last 50 messages (`convex/chat.js:66`) - extend for longer conversations
- **Indexing:** Messages indexed by `[conversationId, createdAt]` for efficient queries (`convex/schema.js:125`)
- **Optimistic Updates:** Client decrements permit counter immediately for instant feedback (`app/chat/[conversationId]/page.js:85`)

## Related Documentation

- **Media Messages (Image/Video):** See MEDIA_MESSAGES.md (future)
- **Audio Messages:** See AUDIO_MESSAGES.md (future)
- **S3/CloudFront:** See s3-cloudfront-implementation.md
- **Authentication:** See auth.md
- **Payments/Premium:** See PAYMENTS_SYSTEM.md
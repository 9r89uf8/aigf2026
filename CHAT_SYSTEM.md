# Chat System Documentation

This document explains the current chat system implementation for the AI girlfriend platform. The system follows Section 1 of the implementation plan with several key improvements.

## Architecture Overview

The chat system is built on **Convex** with real-time reactivity and follows these core principles:

- **Single reactive query** drives conversation screens via `getConversation`
- **Server-validated security** using Cloudflare Turnstile with permit system
- **Scheduled AI actions** for deterministic mutations and external API calls
- **Free quota enforcement** with premium bypass
- **Denormalized threading** for fast thread list performance

### System Components

1. **Database**: Convex tables for conversations, messages, Turnstile permits
2. **Server Functions**: Queries (read), mutations (write), actions (external calls)
3. **Client Pages**: Thread list (`/chat`) and conversation (`/chat/[id]`)
4. **Security Layer**: Invisible Turnstile with permit-based rate limiting
5. **AI Integration**: OpenAI-compatible API with DeepSeek → Together.ai fallback

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
    media: v.number(),                // future: image/video
    audio: v.number(),                // future: voice notes
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
Individual chat messages within conversations:

```js
messages: defineTable({
  conversationId: v.id("conversations"),
  sender: v.union(v.literal("user"), v.literal("ai")),
  kind: v.literal("text"),            // Section 1: text only
  text: v.string(),                   // message content
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
Creates new conversation or returns existing one:

```js
export const startConversation = mutation({
  args: { girlId: v.id("girls") },
  handler: async (ctx, { girlId }) => {
    const userId = await getAuthUserId(ctx);

    // Return existing conversation if found
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_girl", q => q.eq("userId", userId).eq("girlId", girlId))
      .first();
    if (existing) return { conversationId: existing._id };

    // Create new conversation with initial quotas
    const conversationId = await ctx.db.insert("conversations", {
      userId, girlId,
      freeRemaining: {
        text: FREE_TEXT_PER_GIRL,    // 10 messages
        media: FREE_MEDIA_PER_GIRL,  // 2 images
        audio: FREE_AUDIO_PER_GIRL,  // 3 audio
      },
      lastMessageAt: Date.now(),
      lastMessagePreview: "",
      lastReadAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { conversationId };
  },
});
```

#### `sendMessage(conversationId, text, permitId)` - Send User Message
Core message sending with security and quota enforcement:

```js
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    permitId: v.id("turnstile_permits"),
  },
  handler: async (ctx, { conversationId, text, permitId }) => {
    const userId = await getAuthUserId(ctx);
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Empty message");

    // Validate and consume permit (server-side security)
    const permit = await ctx.db.get(permitId);
    if (!permit || permit.userId !== userId ||
        permit.expiresAt < Date.now() || permit.usesLeft <= 0) {
      throw new Error("Security check failed (permit)");
    }
    await ctx.db.patch(permitId, { usesLeft: permit.usesLeft - 1 });

    const convo = await ctx.db.get(conversationId);
    const premiumActive = await getPremiumActive(ctx, userId);

    // Enforce quota for free users
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

    // Insert user message
    const userMsgId = await ctx.db.insert("messages", {
      conversationId, sender: "user", kind: "text",
      text: trimmed, createdAt: Date.now(),
    });

    // Update conversation metadata
    const preview = trimmed.length > 140 ? trimmed.slice(0, 140) + "…" : trimmed;
    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule AI reply (runs after mutation commits)
    await ctx.scheduler.runAfter(0, api.chat_actions.aiReply, {
      conversationId, userMessageId: userMsgId,
    });

    return { ok: true };
  },
});
```

### Actions (External API Calls)

#### `aiReply(conversationId, userMessageId)` - Generate AI Response
Calls external LLM APIs and inserts AI response:

```js
export const aiReply = action({
  args: {
    conversationId: v.id("conversations"),
    userMessageId: v.id("messages"),
  },
  handler: async (ctx, { conversationId }) => {
    // Get conversation context (last 8 messages)
    const { persona, history } = await ctx.runQuery(api.chat_actions._getContext, {
      conversationId, limit: 8,
    });

    const messages = [
      { role: "system", content: persona },
      ...history,
    ];

    // Try primary LLM (DeepSeek), fallback to Together.ai
    const cfg = {
      primary: {
        baseUrl: process.env.LLM_BASE_URL_PRIMARY,
        apiKey: process.env.LLM_API_KEY_PRIMARY,
        model: process.env.LLM_MODEL_PRIMARY,
      },
      fallback: {
        baseUrl: process.env.LLM_BASE_URL_FALLBACK,
        apiKey: process.env.LLM_API_KEY_FALLBACK,
        model: process.env.LLM_MODEL_FALLBACK,
      },
    };

    let text;
    try {
      text = await callOpenAICompat({ ...cfg.primary, messages });
    } catch (e) {
      text = await callOpenAICompat({ ...cfg.fallback, messages });
    }

    // Insert AI response
    await ctx.runMutation(api.chat._insertAIMessage, { conversationId, text });
    return { ok: true };
  },
});
```

---

## Client Components

### Thread List (`/chat/page.js`)
Simple reactive list of user conversations:

```jsx
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

### Conversation Page (`/chat/[conversationId]/page.js`)
Real-time conversation with Turnstile permit management:

- **Reactive messages** via `getConversation` query
- **Permit prefetching** when page loads
- **Optimistic permit decrement** for smooth UX
- **Automatic retry** on permit validation failure

Key features:
- Auto-scroll to bottom on new messages
- Mark as read when viewing
- Quota exhaustion warnings with upgrade CTA
- Loading states during send operations

### Invisible Turnstile Hook (`useInvisibleTurnstile.js`)
Custom hook for seamless security challenges:

```js
export function useInvisibleTurnstile() {
  const [ready, setReady] = useState(false);

  // Load Turnstile script once globally
  useEffect(() => {
    loadTurnstileScriptOnce().then(() => {
      // Render invisible widget with appearance: "execute"
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        appearance: "execute",  // Hidden unless challenge needed
        size: "flexible",
      });
      setReady(true);
    });
  }, []);

  const getToken = useCallback(async () => {
    // Serialize execute() calls to prevent conflicts
    if (executingRef.current) return executingRef.current;

    executingRef.current = new Promise((resolve, reject) => {
      window.turnstile.execute(widgetIdRef.current, {
        action: "chat_send",
        callback: (token) => resolve(token),
        "error-callback": (err) => reject(err),
      });
    });

    return executingRef.current;
  }, [ready]);

  return { ready, getToken };
}
```

---

## Complete User Flow

Here's the step-by-step flow from landing on chat page to receiving AI response:

### 1. User Lands on `/chat`
```
User visits /chat → ThreadsPage component loads
│
├─ useQuery(api.chat.getThreads) fires
├─ Convex returns list of user's conversations
├─ Thread list renders with: girl names, last message previews, timestamps, unread dots
└─ User sees clickable conversation list
```

### 2. User Clicks on Conversation
```
User clicks thread → Navigate to /chat/[conversationId]
│
├─ ConversationPage component loads
├─ useQuery(api.chat.getConversation, { conversationId }) fires
├─ useInvisibleTurnstile() hook initializes Turnstile widget
└─ Page renders: message history, composer, upgrade banner (if quota exhausted)
```

### 3. Turnstile Initialization & Permit Prefetch
```
Page loads → useInvisibleTurnstile hook
│
├─ Load Cloudflare Turnstile script (once globally)
├─ Render invisible widget with appearance: "execute"
├─ Set ready = true
└─ Trigger permit prefetch:
    │
    ├─ getToken() → Turnstile generates token
    ├─ mintPermit({ token, scope: "chat_send" }) action
    ├─ Server validates token with Cloudflare
    ├─ Server creates permit (5 uses, 2min expiry for free users)
    └─ Client stores permit for immediate use
```

### 4. User Types and Sends Message
```
User types message → clicks Send → onSend() function
│
├─ Check permit validity (usesLeft > 0, not expired)
├─ If invalid: getToken() → mintPermit() → get fresh permit
├─ Call sendMessage({ conversationId, text, permitId }) mutation
└─ Server processes in single transaction:
    │
    ├─ Validate permit (server-side security check)
    ├─ Decrement permit uses atomically
    ├─ Check premium status
    ├─ Enforce free quota (decrement if not premium)
    ├─ Insert user message to database
    ├─ Update conversation metadata (lastMessageAt, preview)
    ├─ Schedule aiReply action via ctx.scheduler.runAfter(0, ...)
    └─ Return { ok: true }
```

### 5. Real-time UI Updates
```
sendMessage mutation completes → Convex pushes updates
│
├─ getConversation query automatically updates (reactive)
├─ User message appears in chat immediately
├─ Client optimistically decrements local permit count
├─ Auto-scroll to bottom of conversation
└─ Clear input field and reset sending state
```

### 6. AI Reply Generation (Scheduled Action)
```
ctx.scheduler.runAfter(0, api.chat_actions.aiReply, { conversationId, userMessageId })
│
└─ Action runs in background (after mutation commits):
    │
    ├─ _getContext query: fetch last 8 messages + girl persona
    ├─ Build OpenAI-compatible chat payload
    ├─ Try primary LLM (DeepSeek):
    │   POST https://api.deepseek.com/v1/chat/completions
    │   Headers: Authorization: Bearer $LLM_API_KEY_PRIMARY
    │   Body: { model, messages, temperature: 1.3, max_tokens: 220 }
    │
    ├─ If primary fails → Try fallback LLM (Together.ai)
    ├─ Extract text from response.choices[0].message.content
    └─ _insertAIMessage mutation:
        │
        ├─ Insert AI message to database
        ├─ Update conversation metadata (lastMessageAt, preview)
        └─ Convex pushes real-time update to client
```

### 7. User Sees AI Response
```
_insertAIMessage completes → Real-time update
│
├─ getConversation query receives new AI message
├─ AI message appears in chat automatically (reactive)
├─ Auto-scroll to show new message
├─ Thread list updates with new preview & timestamp
└─ Flow complete - ready for next user message
```

---

### 5. Enhanced Error Handling
**Current Implementation** includes:
- Automatic retry on permit validation failure
- Graceful fallback from primary to secondary LLM
- User-friendly error messages
- Permit regeneration on security failures

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

## Future Extensions (Section 2 & 3)

The current system is designed to support:
- **Media messages** (images, videos)
- **Audio messages** (voice notes)
- **AI voice replies** (ElevenLabs integration)
- **Pagination** for long conversations
- **Typing indicators** and delivery states
# Payment System Documentation

## Overview

This AI girlfriend chat platform uses a **one-time payment system** powered by Stripe and Convex. Key characteristics:

- **One-time plans only** - No subscriptions, users buy time periods (e.g., 30 days, 365 days)
- **Stripe Checkout** - Hosted payment pages for maximum trust and conversion
- **No webhooks** - Synchronous fulfillment on success page for simplicity
- **Adaptive pricing** - Stripe automatically localizes currency at checkout
- **Premium extension** - Multiple purchases extend existing premium time
- **Minimal database** - Just `premiumUntil` timestamp and transaction history

### Technology Stack

- **Stripe Checkout** - Payment processing with hosted pages
- **Convex** - Real-time backend with automatic scaling
- **Next.js** - Frontend with App Router
- **JavaScript only** - No TypeScript per project standards

### Core Design Principles

1. **Simplicity** - No complex subscription management
2. **Security** - PCI SAQ-A compliance through hosted Checkout
3. **Reliability** - Idempotent payment verification prevents double-processing
4. **User Experience** - Trusted Stripe domain increases conversion rates

---

## Architecture

### Two-File Structure

Due to Convex runtime constraints, the payment system is split into two files:

```
convex/
├── payments.js          # Queries & internal mutations (standard runtime)
└── payments_actions.js  # Stripe API calls (Node.js runtime with "use node")
```

**Why this split?**
- Files with `"use node"` can only export actions, not queries/mutations
- Actions cannot use `ctx.db` directly - must call queries/mutations via `ctx.runQuery`/`ctx.runMutation`
- This separation keeps database operations separate from external API calls

### File Responsibilities

#### `payments.js` (Standard Runtime)
- **Public queries**: `getMyPayments`, `getPremiumStatus`
- **Internal helpers**: Database operations for actions to call
- **No Stripe imports** - pure database logic

#### `payments_actions.js` (Node Runtime)
- **Stripe integration**: All `stripe.*` API calls
- **Actions only**: `listPlansCached`, `checkoutStart`, `checkoutVerify`
- **Database access**: Via `ctx.runQuery`/`ctx.runMutation` to internal helpers

### Data Flow

```
Frontend → Actions (Stripe) → Internal Queries/Mutations → Database
   ↑                                                          ↓
   └─────────── Success Response ←─────────────────────────────┘
```

---

## Database Schema

### 1. `profiles` Table (Extended)

```javascript
profiles: defineTable({
  userId: v.id("users"),
  // ... existing fields ...
  premiumUntil: v.optional(v.number()), // ms epoch UTC; undefined = not premium
  updatedAt: v.number(),
})
.index("by_userId", ["userId"])
```

**Key Field:**
- `premiumUntil`: Timestamp when premium expires. Premium active when `premiumUntil > Date.now()`

### 2. `payments` Table (Transaction History)

```javascript
payments: defineTable({
  userId: v.id("users"),           // Who made the purchase
  sessionId: v.string(),           // Stripe Checkout Session ID (unique)
  paymentIntentId: v.optional(v.string()), // Stripe Payment Intent ID
  productId: v.string(),           // Stripe Product ID
  priceId: v.string(),             // Stripe Price ID
  amountTotal: v.number(),         // Amount paid in smallest currency unit (cents)
  currency: v.string(),            // Currency code (e.g., "usd", "eur")
  durationDays: v.number(),        // Days of premium purchased
  features: v.array(v.string()),   // Feature list snapshot for history
  paidAt: v.number(),              // Payment timestamp (ms epoch)
  expiresAt: v.number(),           // When this purchase expires (ms epoch)
  status: v.literal("paid"),       // Payment status (only "paid" in v1)
  snapshot: v.any(),               // Compact Checkout Session data for audit
  createdAt: v.number(),           // Record creation timestamp
})
.index("by_user", ["userId", "createdAt"])      // User's payment history
.index("by_sessionId", ["sessionId"])           // Idempotency lookups
```

**Purpose:** Audit trail and payment history display

### 3. `payments_cache` Table (Catalog Cache)

```javascript
payments_cache: defineTable({
  key: v.string(),                 // Cache key (e.g., "catalog")
  json: v.any(),                   // Cached data
  refreshedAt: v.number(),         // Last refresh timestamp
})
.index("by_key", ["key"])
```

**Purpose:** Cache Stripe product catalog to reduce API calls (6-hour TTL)

---

## Backend API Reference

### Public Queries (`api.payments.*`)

#### `getMyPayments()`
```javascript
// Returns current user's payment history
// Usage: const payments = useQuery(api.payments.getMyPayments);
// Returns: Array of payment objects (newest first)
```

#### `getPremiumStatus()`
```javascript
// Returns current user's premium status
// Usage: const status = useQuery(api.payments.getPremiumStatus);
// Returns: { active: boolean, premiumUntil: number }
```

### Actions (`api.payments_actions.*`)

#### `listPlansCached()`
```javascript
// Fetches available plans from Stripe (with caching)
// Usage: const plans = await useAction(api.payments_actions.listPlansCached)();
// Returns: Array of plan objects with pricing and features
// Cache: 6 hours to reduce Stripe API calls
```

#### `checkoutStart({ productId, returnTo? })`
```javascript
// Creates Stripe Checkout Session
// Usage: const { url } = await start({ productId: "prod_123" });
// Returns: { url: string, sessionId: string }
// Action: Redirects user to Stripe Checkout
```

#### `checkoutVerify({ sessionId })`
```javascript
// Verifies payment and grants premium access
// Usage: const result = await verify({ sessionId: "cs_123" });
// Returns: { premiumUntil: number, alreadyProcessed: boolean }
// Idempotent: Safe to call multiple times
```

### Internal Helpers (`internal.payments.*`)

These are called by actions via `ctx.runQuery`/`ctx.runMutation`:

- `getPlansCache(key)` - Retrieve cached plans
- `upsertPlansCache(key, json, refreshedAt)` - Update plans cache
- `getPaymentBySessionId(sessionId)` - Check if payment already processed
- `getProfileByUserId(userId)` - Get user profile
- `upsertProfile(userId, premiumUntil)` - Create/update profile premium
- `insertPayment(...)` - Record transaction

---

## Frontend Integration

### 1. Plans Page (`/app/plans/page.js`)

```javascript
const listPlans = useAction(api.payments_actions.listPlansCached);
const start = useAction(api.payments_actions.checkoutStart);

// Load plans on mount
useEffect(() => {
  listPlans().then(setPlans);
}, []);

// Start purchase
async function buy(productId) {
  const { url } = await start({ productId });
  window.location.href = url; // Redirect to Stripe
}
```

**Features:**
- Displays base prices with currency localization note
- Feature lists from Stripe product metadata
- Error handling and loading states

### 2. Success Page (`/app/checkout/success/page.js`)

```javascript
const verify = useAction(api.payments_actions.checkoutVerify);

useEffect(() => {
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  if (sessionId) {
    verify({ sessionId }).then(result => {
      // Show success message with premiumUntil timestamp
    });
  }
}, []);
```

**Purpose:** Verify payment and update user's premium status

### 3. Account Page (`/app/account/page.js`)

```javascript
const premiumStatus = useQuery(api.payments.getPremiumStatus);
const paymentHistory = useQuery(api.payments.getMyPayments);

// Display premium status and payment history
// Link to plans page for upgrades/extensions
```

**Features:**
- Current premium status and expiration
- Payment history with amounts and durations
- Links to extend/upgrade premium

---

## Core Flows

### 1. List Plans Flow

1. **Frontend** calls `api.payments_actions.listPlansCached`
2. **Action** checks `payments_cache` for recent data (< 6 hours)
3. If cached, return immediately
4. If stale, fetch from Stripe API:
   - `stripe.products.list({ active: true })`
   - Filter products with `metadata.duration`
   - Resolve default prices
   - Extract features from metadata (`feature1`, `feature2`, etc.)
5. **Cache** results in database
6. **Return** formatted plan data

### 2. Purchase Flow

1. **User** clicks "Buy" on plans page
2. **Frontend** calls `checkoutStart({ productId })`
3. **Action** creates Stripe Checkout Session:
   - Retrieves product metadata (duration, features)
   - Sets success URL with session placeholder
   - Copies metadata to session for later retrieval
4. **Action** returns Checkout URL
5. **Frontend** redirects to Stripe
6. **User** completes payment on Stripe
7. **Stripe** redirects to success page with session ID

### 3. Verification Flow (No Webhooks)

1. **Success page** extracts session ID from URL
2. **Frontend** calls `checkoutVerify({ sessionId })`
3. **Action** checks idempotency (already processed?)
4. If new, **Action** retrieves session from Stripe
5. **Action** validates payment status
6. **Action** calculates new `premiumUntil`:
   ```javascript
   const base = Math.max(Date.now(), currentPremiumUntil || 0);
   const expiresAt = base + durationDays * 24 * 60 * 60 * 1000;
   ```
7. **Action** updates profile and creates payment record
8. **Action** returns success with new expiration

### 4. Premium Extension Logic

**Key Feature:** Multiple purchases extend rather than replace premium time.

```javascript
// If user has premium until 2024-06-01 and buys 30 days on 2024-05-15:
const currentExpiry = profile.premiumUntil; // 2024-06-01
const now = Date.now();                     // 2024-05-15
const base = Math.max(now, currentExpiry);  // 2024-06-01 (existing premium)
const newExpiry = base + (30 * 24 * 60 * 60 * 1000); // 2024-07-01
```

This prevents users from losing time when purchasing early.

---

## Developer Guide

### Checking Premium Status

**In Queries/Mutations:**
```javascript
export const someFunction = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    const isPremium = profile?.premiumUntil > Date.now();
    if (!isPremium) {
      throw new Error("Premium required");
    }
    // ... premium logic
  }
});
```

**In React Components:**
```javascript
const premiumStatus = useQuery(api.payments.getPremiumStatus);
const isPremium = premiumStatus?.active;

if (!isPremium) {
  return <PremiumUpgradePrompt />;
}
```

### Adding New Stripe Products

1. **Create in Stripe Dashboard:**
   - Set product name, description, images
   - Add metadata: `duration` (days), `feature1`, `feature2`, etc.
   - Create active price in base currency

2. **Automatic Discovery:**
   - System automatically discovers products with `metadata.duration`
   - Features extracted from `feature1`...`feature10` metadata
   - No code changes needed

3. **Cache Refresh:**
   - Cache refreshes every 6 hours automatically
   - Manual refresh: Clear `payments_cache` table

### Premium-Gated Features

**Pattern 1: Component-level gating**
```javascript
function PremiumFeature() {
  const premiumStatus = useQuery(api.payments.getPremiumStatus);

  if (!premiumStatus?.active) {
    return <UpgradePrompt feature="Advanced Chat" />;
  }

  return <AdvancedChatInterface />;
}
```

**Pattern 2: Mutation-level gating**
```javascript
export const advancedFeature = mutation({
  handler: async (ctx, args) => {
    // Check premium first
    const userId = await getAuthUserId(ctx);
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    if (!profile?.premiumUntil || profile.premiumUntil <= Date.now()) {
      throw new Error("Premium subscription required");
    }

    // Premium logic here
  }
});
```

### Environment Variables

```env
# Required for payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SITE_URL=http://localhost:3000

# Production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SITE_URL=https://yourdomain.com
```

### Common Patterns

**Redirect after purchase:**
```javascript
// Pass returnTo parameter
const { url } = await checkoutStart({
  productId,
  returnTo: "/premium-feature"
});
```

**Check if specific duration available:**
```javascript
const plans = await listPlansCached();
const monthlyPlan = plans.find(p => p.durationDays === 30);
```

---

## Troubleshooting

### Common Errors

**"Payment not completed"**
- Session status is not "complete" or payment_status is not "paid"
- User may have abandoned checkout or payment failed
- Check Stripe Dashboard for session details

**"Product is missing metadata.duration"**
- Stripe product doesn't have required metadata
- Add `duration` field to product metadata in Stripe Dashboard

**"This file uses Node APIs but has no 'use node'"**
- Importing Stripe in wrong file
- Move Stripe imports to `payments_actions.js` only

**"Queries/mutations cannot run in Node runtime"**
- Exporting query/mutation from file with `"use node"`
- Move to `payments.js` or use internal helper pattern

### Debugging Tips

1. **Check Stripe Dashboard** for session and payment details
2. **Console logs** in actions for Stripe API responses
3. **Convex Dashboard** for database state and function logs
4. **Network tab** for failed API calls

### Known Limitations

1. **No automatic refund handling** - requires manual intervention
2. **No webhook support** - cannot handle off-session events
3. **Currency limited** to Stripe Checkout's adaptive pricing
4. **Plan changes** require Stripe Dashboard access

### Support Escalation

For payment issues beyond this system:
1. Check Stripe Dashboard for transaction details
2. Verify environment variables are correct
3. Test with Stripe test mode first
4. Contact Stripe support for payment processing issues
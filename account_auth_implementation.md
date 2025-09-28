# Account Profile Implementation Guide
This guide extends the authentication foundation in `auth.md` and the media pipeline described in `s3-cloudfront-implementation.md`, focusing on how profile data is stored, edited, and rendered.

Complete implementation for user profiles with editable fields and avatar uploads using **Convex Auth's stable user IDs**.

> **Critical Note**: This implementation uses `getAuthUserId(ctx)` which returns a **stable user ID** that never changes across sessions, unlike `identity.subject` which varies per login.

## Quick Orientation
- **Data**: `profiles` documents extend Convex Auth's `users` records with editable metadata while keeping credentials under Convex Auth's control.
- **Server**: `convex/profile.js` exposes `getMine`, `upsertMine`, `setAvatar`, and `removeAvatar`; each call derives the user solely from `getAuthUserId(ctx)`.
- **Media**: Avatar files route through `convex/s3.js` for signed uploads and `convex/cdn.js` for signed viewing. For deeper S3/CDN details see `s3-cloudfront-implementation.md`.
- **Routing**: `middleware.js` protects `/account` (alongside `/dashboard`) so only authenticated sessions reach the page.
- **UI**: `app/account/page.js` renders `AccountForm`, a client component styled with Tailwind utilities defined in `app/globals.css` (`input`, `btn`, `btn-ghost`).

### Lifecycle Snapshot
1. The account page loads and `AccountForm` calls `api.profile.getMine` to hydrate form state (email + profile document).
2. Users submit profile changes through `api.profile.upsertMine`; the mutation normalizes inputs, enforces validation, and timestamps the record.
3. Avatar updates request a signed PUT via `api.s3.signAvatarUpload`, stream bytes directly to S3, then persist the key through `api.profile.setAvatar`.
4. The client refreshes the preview with a short-lived CloudFront URL from `api.cdn.cfSignView`, ensuring private buckets stay private.

---

## 1) Database Schema

Profiles extend the auth-managed `users` table by capturing editable metadata (usernames, display info, optional role hints) while Convex Auth stays authoritative for credentials and session state.

Store profile fields in a `profiles` table keyed by stable Convex Auth user ID.

**`convex/schema.js`**

```js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),              // stable Convex Auth user ID
    role: v.optional(v.literal("admin")), // unset = regular user
    username: v.optional(v.string()),
    usernameLower: v.optional(v.string()),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    country: v.optional(v.string()),    // ISO 3166-1 alpha-2 (e.g., "US")
    avatarKey: v.optional(v.string()),  // S3 key (private object)
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_usernameLower", ["usernameLower"]),
});
```

---

## 2) Profile Queries & Mutations

All profile logic lives in `convex/profile.js` and runs server-side in Convex. We never trust a client-supplied user ID; every handler calls `getAuthUserId(ctx)` to resolve the current user.

- `getMine`: Fetches the signed-in user's auth document (`users` table) and joins the matching `profiles` record, returning sensible defaults when none exists yet.
- `upsertMine`: Validates, normalizes, and upserts profile fields while enforcing case-insensitive username uniqueness and reserved names.
- `setAvatar`: Persists the S3 object key after a successful upload, guarding against path traversal by scoping keys to the user.
- `removeAvatar`: Clears the stored key and updates timestamps so downstream caches can react.

**`convex/profile.js`**

```js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function normalizeUsername(u) {
  return u.trim().toLowerCase();
}
const USERNAME_RE = /^[a-z0-9._]{3,24}$/;
const RESERVED = new Set(["admin", "support", "help", "about", "terms", "privacy"]);

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userDoc = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return {
      email: userDoc?.email ?? "",
      profile: profile ?? {
        username: "",
        name: "",
        age: undefined,
        country: "",
        avatarKey: undefined,
      },
    };
  },
});

export const upsertMine = mutation({
  args: {
    username: v.string(),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, { username, name, age, country }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Server-side validation
    const un = username.trim();
    if (!USERNAME_RE.test(un)) throw new Error("Username must be 3–24 chars, a–z, 0–9, . or _");
    const unLower = normalizeUsername(un);
    if (RESERVED.has(unLower)) throw new Error("This username is reserved");

    if (name && name.length > 80) throw new Error("Name is too long");
    if (age !== undefined && (age < 13 || age > 120)) throw new Error("Age must be 13–120");
    let c = (country ?? "").trim().toUpperCase();
    if (c && !/^[A-Z]{2}$/.test(c)) throw new Error("Country must be 2-letter code");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Enforce username uniqueness (case-insensitive)
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_usernameLower", (q) => q.eq("usernameLower", unLower))
      .first();

    if (taken && (!existing || taken._id !== existing._id)) {
      throw new Error("Username is already taken");
    }

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: userId,
        username: un,
        usernameLower: unLower,
        name: name ?? "",
        age,
        country: c,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        username: un,
        usernameLower: unLower,
        name: name ?? "",
        age,
        country: c,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const setAvatar = mutation({
  args: { objectKey: v.string() },
  handler: async (ctx, { objectKey }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Simple path containment: avatars/<userId>/...
    const expectedPrefix = `avatars/${userId}/`;
    if (!objectKey.startsWith(expectedPrefix)) throw new Error("Invalid avatar key");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: userId,
        username: "",
        usernameLower: "",
        name: "",
        age: undefined,
        country: "",
        avatarKey: objectKey,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, { avatarKey: objectKey, updatedAt: now });
    }

    return { ok: true };
  },
});

export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!existing) return { ok: true };
    await ctx.db.patch(existing._id, { avatarKey: undefined, updatedAt: Date.now() });
    return { ok: true };
  },
});
```

---

## 3) S3 Upload + CloudFront Viewing

This flow reuses the shared S3/CloudFront setup described in `s3-cloudfront-implementation.md`. The snippets here show how the account feature wires that plumbing into profile-specific actions.

### A) S3 Upload Actions

**`convex/s3.js`**

```js
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUserId } from "@convex-dev/auth/server";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

export const signAvatarUpload = action({
  args: { contentType: v.string(), size: v.number() },
  handler: async (ctx, { contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(contentType)) throw new Error("Unsupported image type");
    if (size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB)");

    const key = `avatars/${userId}/${crypto.randomUUID()}`;
    const put = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "private",
    });
    const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 });
    return { uploadUrl, objectKey: key };
  },
});
```

### B) CloudFront Signed URLs

Signed viewing URLs are scoped per-user, meaning a session can only request objects it owns and each URL expires quickly.

**`convex/cdn.js`**

```js
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { getAuthUserId } from "@convex-dev/auth/server";

export const cfSignView = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Verify user owns this avatar
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw new Error("Forbidden");
    }

    const url = getSignedUrl({
      url: `https://${process.env.CF_DOMAIN}/${key}`,
      keyPairId: process.env.CF_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 300 * 1000).toISOString(), // 5 minutes
      privateKey: process.env.CF_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    return { url };
  },
});
```

**Required Convex Environment Variables:**

```
# S3 Upload
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# CloudFront Signed URLs
CF_DOMAIN=dxxxxx.cloudfront.net
CF_KEY_PAIR_ID=K3XXXXXXXXXXXXX
CF_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----"
```

---

## 4) Route Protection

Update middleware to protect `/account`:

**`middleware.js`**

```js
const isProtected = createRouteMatcher(["/dashboard(.*)", "/account(.*)"]);
```

---

## 5) Frontend Implementation

`AccountForm` is a client component that reads Convex data via `useQuery` and mutates via `useMutation`/`useAction`. Tailwind utility classes originate from `app/globals.css`, so new UI should compose the same helpers (`input`, `btn`, `btn-ghost`) to stay consistent.

### Account Page

**`app/account/page.js`**

```js
import AccountForm from "@/components/AccountForm";

export default function AccountPage() {
  return <AccountForm />;
}
```

### Account Form Component

**`components/AccountForm.js`**

```js
"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const COUNTRY_OPTIONS = [
  { code: "", label: "Select country" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
];

const USERNAME_RE = /^[a-z0-9._]{3,24}$/;

export default function AccountForm() {
  const data = useQuery(api.profile.getMine);
  const upsert = useMutation(api.profile.upsertMine);
  const setAvatar = useMutation(api.profile.setAvatar);
  const removeAvatar = useMutation(api.profile.removeAvatar);
  const signUpload = useAction(api.s3.signAvatarUpload);
  const cfSignView = useAction(api.cdn.cfSignView);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Initialize from query
  useEffect(() => {
    if (!data) return;
    setUsername(data.profile.username ?? "");
    setName(data.profile.name ?? "");
    setAge(data.profile.age !== undefined ? data.profile.age : "");
    setCountry(data.profile.country ?? "");
  }, [data]);

  // Fetch CloudFront signed URL when avatarKey changes
  useEffect(() => {
    const run = async () => {
      if (!data?.profile.avatarKey) {
        setAvatarUrl(null);
        return;
      }
      try {
        const r = await cfSignView({ key: data.profile.avatarKey });
        setAvatarUrl(r.url);
      } catch (error) {
        console.error("Failed to get CloudFront signed URL:", error);
        setAvatarUrl(null);
      }
    };
    run();
  }, [data?.profile.avatarKey, cfSignView]);

  const email = data?.email ?? "";

  async function onSave(e) {
    e.preventDefault();
    if (!USERNAME_RE.test(username)) {
      alert("Username must be 3–24 chars, a–z, 0–9, dot or underscore.");
      return;
    }
    const payload = {
      username,
      name: name || undefined,
      age: typeof age === "number" ? age : (age === "" ? undefined : Number(age)),
      country: country || undefined,
    };
    setSaving(true);
    try {
      await upsert(payload);
      alert("Profile saved");
    } catch (err) {
      alert(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload PNG, JPG, or WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }

    // 1) Ask Convex for presigned PUT
    const { uploadUrl, objectKey } = await signUpload({
      contentType: file.type,
      size: file.size,
    });

    // 2) Upload directly to S3
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      alert("Upload failed");
      return;
    }

    // 3) Finalize in DB
    await setAvatar({ objectKey });

    // 4) Refresh preview URL with CloudFront signed URL
    const { url } = await cfSignView({ key: objectKey });
    setAvatarUrl(url);
  }

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Account</h1>

      <form onSubmit={onSave} className="space-y-6">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={email} disabled className="input w-full bg-gray-50" />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            className="input w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            pattern="[a-z0-9._]{3,24}"
            title="3–24 chars; a–z, 0–9, dot, underscore"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Age + Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              className="input w-full"
              type="number"
              min={13}
              max={120}
              value={age}
              onChange={(e) => {
                const v = e.target.value;
                setAge(v === "" ? "" : Number(v));
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="input w-full"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">No photo</span>
            )}
          </div>
          <div className="space-x-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickAvatar(f);
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => fileRef.current?.click()}
            >
              Change photo
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  await removeAvatar({});
                  setAvatarUrl(null);
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
```

---

## 6) Extending Profiles

When you add new profile capabilities, keep the server authoritative and follow this checklist:

1. Update `convex/schema.js` with the new field (consider `v.optional(...)` unless the value is required) and add indexes if you need to query by it.
2. Extend `api.profile.getMine` to return defaults for the new field so the UI never handles `undefined` unexpectedly.
3. Apply validation inside the relevant mutation (`upsertMine` or a new mutation) before persisting changes. Prefer `throw new Error(...)` over silent failures so the client surfaces feedback.
4. Mirror the field in `AccountForm` state, include it in the payload sent to Convex, and style the input with Tailwind utilities from `app/globals.css`.
5. If the new field affects authorization (e.g., roles), update middleware checks or additional queries accordingly, never the client alone.

> Keep auth-critical data (email, password hash, verification flags) inside Convex Auth's managed `users` table and reserve the `profiles` table for metadata.

---

## 7) Security & Implementation Notes

- **Stable User IDs**: Uses `getAuthUserId(ctx)` for consistent user identification across sessions
- **Username uniqueness**: Enforced case-insensitively with `usernameLower` index
- **File validation**: PNG/JPG/WEBP only, 5MB max
- **Access control**: Users can only access their own avatars
- **S3 security**: Private bucket, CloudFront-only access
- **Time-limited URLs**: CloudFront signatures expire after 5 minutes

---

## 8) Installation Steps

1. **Update schema**: Add `profiles` table to `convex/schema.js`
2. **Install AWS dependencies**:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/cloudfront-signer
   ```
3. **Add environment variables**: Set AWS and CloudFront credentials in Convex dashboard
4. **Create files**: Add `convex/profile.js`, `convex/s3.js`, `convex/cdn.js`
5. **Create UI**: Add `app/account/page.js` and `components/AccountForm.js`
6. **Update middleware**: Protect `/account` route

This implementation provides secure, scalable user profiles with avatar upload functionality.
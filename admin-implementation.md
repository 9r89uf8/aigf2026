# Admin System Implementation Guide

This document explains the admin panel architecture for managing AI girlfriend profiles and their media content. The system is built on our existing auth and S3/CloudFront infrastructure.

---

## Overview & Architecture

### Purpose
The admin system manages:
- **Girls**: AI girlfriend profiles with avatars, backgrounds, and metadata
- **Gallery**: Premium/public media for user browsing with like counts
- **Posts**: Social media-style content with locations and engagement
- **AI Assets**: Media for AI chat replies with descriptive metadata

### Core Architecture
```
Frontend (Next.js) → Convex Backend → S3 (uploads) + CloudFront (viewing)
├── Admin role enforcement via middleware + server checks
├── Direct S3 uploads using presigned URLs
├── CloudFront signed URLs for secure media viewing
└── Unified media table with surface flags (gallery/posts/assets)
```

### Dependencies
- **Authentication**: Leverages `auth.md` for admin role checks
- **Media Storage**: Uses `s3-cloudfront-implementation.md` for secure uploads/viewing
- **Database**: Convex schema with girls + girl_media tables

---

## Directory Structure

### Frontend Pages (`app/admin/`)
```
app/admin/
├── layout.js                    # Admin auth check + sidebar navigation
├── girls/
│   ├── page.js                  # Girls list with counts and actions
│   ├── new/page.js              # Create new girl form
│   └── [id]/
│       ├── page.js              # Edit girl profile + image uploads
│       ├── gallery/page.js      # Gallery media manager
│       ├── posts/page.js        # Posts media manager
│       └── assets/page.js       # AI assets media manager
```

### Backend Logic (`convex/`)
```
convex/
├── girls.js                     # CRUD for girls + media management
├── s3.js                        # Presigned upload URLs for admin
├── cdn.js                       # CloudFront signed viewing URLs
├── _utils/auth.js               # assertAdmin() helper
└── schema.js                    # Database tables definition
```

### Shared Components
```
components/admin/
└── MediaUploader.js             # Reusable upload component for all surfaces
```

---

## Data Model

### Girls Table (`girls`)
```javascript
{
  name: "Alice",                 // Display name
  nameLower: "alice",           // For case-insensitive searches
  bio: "Sweet and caring...",   // Optional description
  avatarKey: "girls/id/profile/uuid.jpg",    // S3 key for profile image
  backgroundKey: "girls/id/background/uuid.jpg", // S3 key for background
  voiceId: "elevenlabs-voice-id",             // Optional ElevenLabs voice
  personaPrompt: "You are a sweet girlfriend...", // AI personality
  createdBy: "admin-user-id",   // Who created this girl
  isActive: true,               // Can be deactivated
  counts: {                     // Cached for performance
    gallery: 15,
    posts: 8,
    assets: 32
  },
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### Girl Media Table (`girl_media`)
```javascript
{
  girlId: "girl-id",
  kind: "image" | "video",

  // Surface flags (exactly one must be true)
  isGallery: true,              // Gallery browsing
  isPost: false,                // Social posts
  isReplyAsset: false,          // AI chat replies

  // Content
  objectKey: "girls/id/media/uuid.jpg", // S3 key
  text: "Caption or description",        // Usage varies by surface
  location: "Paris, France",             // Posts only

  // Engagement (gallery/posts only)
  canBeLiked: true,
  likeCount: 147,

  // Content classification
  premiumOnly: false,           // Gallery only - requires subscription
  mature: false,                // Assets only - adult content flag

  published: true,              // Available for use
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### Surface Rules
- **Gallery**: Optional text, premiumOnly flag, can be liked
- **Posts**: Optional text + location, can be liked, premiumOnly ignored
- **Assets**: Required descriptive text, mature flag, cannot be liked

---

## Authorization & Security

### Admin Role Enforcement
```javascript
// convex/_utils/auth.js - Used in all admin operations
export async function assertAdmin(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthenticated");

  // Check role in profiles table
  const profile = await ctx.db.query("profiles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();
  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return { userId, profile };
}
```

### Route Protection
```javascript
// middleware.js - Redirects non-admin users
const isAdminArea = createRouteMatcher(["/admin(.*)"]);
if (isAdminArea(request) && !(await convexAuth.isAuthenticated())) {
  return nextjsMiddlewareRedirect(request, "/signin");
}

// app/admin/layout.js - Server-side role check
const me = await fetchQuery(api.users.getMe, {}, { token });
if (me?.role !== "admin") redirect("/");
```

### Media Security
- **Uploads**: S3 presigned PUT URLs (60 second expiry) with file validation
- **Viewing**: CloudFront signed URLs (5 minute expiry) for all admin content
- **Storage**: Private S3 bucket, accessible only via CloudFront

---

## Key Workflows

### 1. Creating a Girl Profile
1. **Admin → `/admin/girls/new`**: Fill out name, bio, voice ID, persona
2. **Frontend → `api.girls.createGirl`**: Validate + create with default counts
3. **Redirect → `/admin/girls/{id}`**: Upload avatar/background images

### 2. Media Upload Flow
1. **Select Files**: MediaUploader component handles file selection
2. **Get Presigned URL**: `signGirlMediaUpload` action with admin auth
3. **Direct S3 Upload**: Browser uploads directly to S3 (bypasses backend)
4. **Finalize**: `finalizeGirlMedia` mutation saves metadata + updates counts

### 3. Media Management
- **Gallery**: Toggle premiumOnly, canBeLiked, edit captions, randomize likes
- **Posts**: Add location, post text, like settings
- **Assets**: Required descriptions for AI, mature content flags

---

## Backend API Reference

### Queries
```javascript
// List all girls with counts
api.girls.listGirls() → Girl[]

// Get specific girl
api.girls.getGirl({ girlId }) → Girl

// List media by surface
api.girls.listGirlMedia({ girlId, surface: "gallery"|"posts"|"assets" }) → Media[]
```

### Mutations
```javascript
// Create new girl
api.girls.createGirl({ name, bio?, voiceId?, personaPrompt? }) → girlId

// Update profile images
api.girls.updateGirlProfileImages({ girlId, avatarKey?, backgroundKey? }) → boolean

// Save uploaded media
api.girls.finalizeGirlMedia({
  girlId, objectKey, kind: "image"|"video",
  isGallery, isPost, isReplyAsset,  // Exactly one must be true
  text?, location?, premiumOnly?, canBeLiked?, mature?
}) → mediaId

// Update existing media
api.girls.updateGirlMedia({
  mediaId, text?, location?, premiumOnly?, canBeLiked?, mature?, likeCount?, published?
}) → boolean
```

### Actions (S3 Presigned URLs)
```javascript
// Girl profile images
api.s3.signGirlAvatarUpload({ girlId, contentType, size }) → { uploadUrl, objectKey }
api.s3.signGirlBackgroundUpload({ girlId, contentType, size }) → { uploadUrl, objectKey }

// Girl media content
api.s3.signGirlMediaUpload({ girlId, contentType, size }) → { uploadUrl, objectKey }

// Viewing URLs (CloudFront signed)
api.cdn.cfSignView({ key }) → { url }
```

---

## S3 Object Structure

```
s3://bucket/
├── girls/{girlId}/
│   ├── profile/{uuid}.{ext}     # Avatar images
│   ├── background/{uuid}.{ext}  # Background images
│   └── media/{uuid}.{ext}       # Gallery/posts/assets media
└── avatars/{userId}/            # User profile avatars (existing)
```

**File Constraints**:
- **Images**: PNG, JPEG, WEBP up to 200MB
- **Videos**: MP4, WEBM up to 200MB
- **Access**: Private bucket, CloudFront-only viewing

---

## Validation Rules

### Surface Validation (in `validateSurfaceCombo`)
```javascript
// Exactly one surface flag required
if ([isGallery, isPost, isReplyAsset].filter(Boolean).length !== 1) {
  throw new Error("Pick exactly one: Gallery OR Post OR Asset");
}

// Assets require description and mature flag
if (isReplyAsset && (!text || text.length < 3)) {
  throw new Error("Assets require a descriptive text");
}

// Assets cannot be liked or premium
if (isReplyAsset && canBeLiked) {
  throw new Error("Assets cannot be likeable");
}
```

---

## Extension Guide

### Adding Girl Properties
1. **Update Schema**: Add field to `girls` table in `convex/schema.js`
2. **Update Create Mutation**: Add args to `createGirl` in `convex/girls.js`
3. **Update Frontend**: Add form fields in `app/admin/girls/new/page.js`

### Adding Media Properties
1. **Update Schema**: Add field to `girl_media` table
2. **Update Mutations**: Add args to `finalizeGirlMedia` and `updateGirlMedia`
3. **Update Frontend**: Add controls in gallery/posts/assets pages
4. **Update Validation**: Modify `validateSurfaceCombo` if needed

### Creating New Pages
1. **Follow Pattern**: Copy existing admin page structure
2. **Use Authorization**: Call `assertAdmin()` in all backend operations
3. **Media Handling**: Reuse `MediaUploader` component and S3/CloudFront flow

### Media Surfaces
To add a new surface (e.g., "stories"):
1. Add `isStory` boolean to `girl_media` schema
2. Add validation rules in `validateSurfaceCombo`
3. Add index: `by_girl_stories: ["girlId", "isStory"]`
4. Create `/admin/girls/[id]/stories/page.js`
5. Update MediaUploader surface options

---

## Performance Considerations

- **Cached Counts**: Girl counts updated on media insert/delete
- **Indexed Queries**: Each surface has dedicated database index
- **Batch URL Generation**: Fetch multiple CloudFront URLs in parallel
- **Optimistic Updates**: Frontend updates immediately, syncs with backend

---

## Related Documentation

- **[auth.md](auth.md)**: Authentication system and role management
- **[s3-cloudfront-implementation.md](s3-cloudfront-implementation.md)**: Media upload/viewing infrastructure
- **[admin_plan.md](admin_plan.md)**: Original implementation plan and rationale

This admin system provides a scalable foundation for content management while maintaining security and performance.
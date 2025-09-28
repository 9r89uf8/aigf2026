# S3 + CloudFront Implementation Guide

This document explains how we implemented secure image/video uploads and delivery using AWS S3 and CloudFront in our application.

---

## Architecture Overview

### Two-Tier System:
1. **Uploads (Write)**: Browser → S3 Presigned PUT → S3 Bucket
2. **Downloads (Read)**: Browser → CloudFront Signed URL → CloudFront → S3 Bucket

### Why This Architecture?
- ✅ **Uploads bypass backend** - Direct browser to S3 for efficiency
- ✅ **Downloads go through CloudFront** - Caching, performance, security
- ✅ **Private content** - S3 bucket locked to CloudFront only
- ✅ **Time-limited access** - URLs expire automatically

---

## Current Implementation: User Avatars

### Upload Flow

**Step 1: Frontend requests presigned URL**
```javascript
// components/AccountForm.js
const { uploadUrl, objectKey } = await signUpload({
  contentType: file.type,  // "image/png", "image/jpeg", "image/webp"
  size: file.size,
});
```

**Step 2: Backend generates presigned PUT URL**
```javascript
// convex/s3.js
import { getAuthUserId } from "@convex-dev/auth/server";

export const signAvatarUpload = action({
  handler: async (ctx, { contentType, size }) => {
    // Validate user is authenticated
    const userId = await getAuthUserId(ctx);

    // Validate file type and size
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(contentType)) throw new Error("Unsupported image type");
    if (size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB)");

    // Generate unique S3 key with stable user ID
    const key = `avatars/${userId}/${crypto.randomUUID()}`;

    // Create presigned PUT URL (expires in 60 seconds)
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

**Step 3: Frontend uploads directly to S3**
```javascript
// Direct browser → S3 upload
const res = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});
```

**Step 4: Save S3 key in database**
```javascript
// convex/profile.js
import { getAuthUserId } from "@convex-dev/auth/server";

await setAvatar({ objectKey });
// Stores: avatars/{stable-userId}/{uuid}
```

### View Flow

**Step 1: Frontend requests CloudFront signed URL**
```javascript
// components/AccountForm.js
const { url } = await cfSignView({ key: objectKey });
```

**Step 2: Backend generates CloudFront signed URL**
```javascript
// convex/cdn.js
import { getAuthUserId } from "@convex-dev/auth/server";

export const cfSignView = action({
  handler: async (ctx, { key }) => {
    const userId = await getAuthUserId(ctx);

    // Verify user owns this resource
    if (!key.startsWith(`avatars/${userId}/`)) {
      throw new Error("Forbidden");
    }

    // Generate CloudFront signed URL (expires in 5 minutes)
    const url = getSignedUrl({
      url: `https://${process.env.CF_DOMAIN}/${key}`,
      keyPairId: process.env.CF_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 300 * 1000).toISOString(),
      privateKey: process.env.CF_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    return { url };
  },
});
```

**Step 3: Frontend displays image**
```javascript
<img src={url} alt="Avatar" />
// URL: https://dxxxxx.cloudfront.net/avatars/{stable-userId}/{uuid}?Expires=...&Signature=...&Key-Pair-Id=...
```

---

## S3 Bucket Structure

```
s3://finaltw/
├── avatars/
│   ├── {stable-userId1}/
│   │   ├── {uuid1}        # User 1's avatar
│   │   └── {uuid2}        # User 1's avatar (updated)
│   ├── {stable-userId2}/
│   │   └── {uuid3}        # User 2's avatar
│   └── ...
│
├── girls/                  # FUTURE: Girl profiles
│   ├── {girlId1}/
│   │   ├── avatar/{uuid}
│   │   ├── gallery/
│   │   │   ├── {uuid1}.jpg
│   │   │   ├── {uuid2}.jpg
│   │   │   └── {uuid3}.mp4
│   │   └── posts/
│   │       ├── {postId1}/{uuid}.jpg
│   │       └── {postId2}/{uuid}.mp4
│   └── ...
│
└── uploads/                # FUTURE: User uploads
    └── {userId}/
        └── {uuid}.jpg
```

### Key Naming Convention

**Current:**
- `avatars/{stable-userId}/{uuid}` - User profile avatars (uses getAuthUserId)

**Future:**
- `girls/{girlId}/avatar/{uuid}` - Girl profile picture
- `girls/{girlId}/gallery/{uuid}.{ext}` - Girl gallery images/videos
- `girls/{girlId}/posts/{postId}/{uuid}.{ext}` - Girl post media
- `uploads/{stable-userId}/{uuid}.{ext}` - User-generated content

---

## Security Model

### S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::noviachat/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::563561751769:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    },
    {
      "Sid": "DenyDirectS3Access",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::noviachat/*",
      "Condition": {
        "StringNotEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::563561751769:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    },
    {
      "Sid": "AllowIAMUserPutOnly",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::563561751769:user/ttt" },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::noviachat/*"
    }
  ]
}
```

**What this does:**
- ✅ CloudFront can read (GetObject) from S3
- ✅ IAM user `ttt` can write (PutObject) to S3
- ❌ Direct S3 access is **denied** for everyone else
- ❌ Even presigned S3 GET URLs don't work (blocked by Deny rule)

### Access Control

**Uploads (Write):**
- Authenticated users only
- File type validation (whitelist)
- File size limits (e.g., 5MB for avatars)
- Path-based authorization (user can only upload to their own path)

**Downloads (Read):**
- Authenticated users only
- Path-based authorization (user can only view their own content using stable userId)
- Time-limited URLs (expire after 5 minutes)
- Served only through CloudFront

---

## Code Structure

### Backend (Convex)

```
convex/
├── s3.js                    # S3 presigned upload URLs
│   └── signAvatarUpload()   # Generate presigned PUT for avatars
│
├── cdn.js                   # CloudFront signed URLs
│   └── cfSignView()         # Generate signed GET for viewing
│
└── profile.js               # Profile management
    ├── setAvatar()          # Save avatar S3 key to DB
    └── removeAvatar()       # Remove avatar reference
```

### Frontend (Next.js)

```
components/
└── AccountForm.js           # Avatar upload/display component
    ├── onPickAvatar()       # Handle file selection & upload
    └── useEffect()          # Fetch CloudFront signed URL for display
```

### Environment Variables

**Convex (Backend):**
```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET=finaltw
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CF_DOMAIN=dxxxxx.cloudfront.net
CF_KEY_PAIR_ID=K3XXXXXXXXXXXXX
CF_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Next.js (Frontend):**
```bash
# No S3 credentials exposed to frontend!
# Only CloudFront domain for future direct URL usage
```

---

## Future Enhancements

### 1. Girl Profiles with Gallery & Posts

**New Upload Actions:**

```javascript
// convex/s3.js

export const signGirlAvatarUpload = action({
  handler: async (ctx, { girlId, contentType, size }) => {
    // Verify user is admin/creator using getAuthUserId
    const userId = await getAuthUserId(ctx);
    // Validate file
    const key = `girls/${girlId}/avatar/${crypto.randomUUID()}`;
    // Return presigned PUT URL
  },
});

export const signGirlGalleryUpload = action({
  handler: async (ctx, { girlId, contentType, size }) => {
    // Verify user is admin/creator
    // Support images AND videos
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    const maxSize = contentType.startsWith("video/") ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    const key = `girls/${girlId}/gallery/${crypto.randomUUID()}.${getExtension(contentType)}`;
    // Return presigned PUT URL
  },
});

export const signGirlPostUpload = action({
  handler: async (ctx, { girlId, postId, contentType, size }) => {
    // Similar to gallery upload
    const key = `girls/${girlId}/posts/${postId}/${crypto.randomUUID()}.${getExtension(contentType)}`;
    // Return presigned PUT URL
  },
});
```

**Authorization Model:**
- **Upload**: Admin/creator only
- **View**: Subscriber users + admin/creator

### 2. Implement CloudFront Signed Cookies

**When to use:**
- ✅ Gallery pages (50+ images)
- ✅ Feed/posts with many thumbnails
- ✅ Girl profile pages with multiple media

**Implementation:**

```javascript
// app/api/cdn/cookies/route.js
import { NextResponse } from "next/server";
import { getSignedCookies } from "@aws-sdk/cloudfront-signer";

export async function POST(request) {
  // Verify user authentication using stable user ID
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Generate cookies for specific path pattern
  const { girlId } = await request.json();

  const cookies = getSignedCookies({
    url: `https://${process.env.CF_DOMAIN}/girls/${girlId}/*`,
    keyPairId: process.env.CF_KEY_PAIR_ID,
    privateKey: process.env.CF_PRIVATE_KEY.replace(/\\n/g, "\n"),
    dateLessThan: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
  });

  const res = NextResponse.json({ ok: true });

  // Set three CloudFront cookies
  for (const [name, value] of Object.entries(cookies)) {
    res.cookies.set(name, value, {
      domain: ".noviachat.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60,
    });
  }

  return res;
}
```

**Frontend Usage:**

```javascript
// On gallery page load
await fetch("/api/cdn/cookies", {
  method: "POST",
  body: JSON.stringify({ girlId }),
});

// Then use plain CloudFront URLs (no signing needed per-image)
{gallery.map(item => (
  <img src={`https://${CF_DOMAIN}/${item.key}`} />
))}
```

**When to switch from Signed URLs to Signed Cookies:**

| Feature | Signed URLs | Signed Cookies |
|---------|-------------|----------------|
| Single avatar | ✅ Current | ❌ Overkill |
| Gallery (5-10 images) | ✅ OK | ⚠️ Consider |
| Gallery (50+ images) | ❌ Slow | ✅ Better |
| Feed with thumbnails | ❌ Too many requests | ✅ Recommended |
| Chat attachments | ✅ Good | ❌ Not needed |

### 3. Video Upload Support

**Considerations:**
- Larger file sizes (50-100MB)
- Longer presigned URL expiry (5-10 minutes)
- Progress tracking for uploads
- Video processing (transcoding, thumbnails)

**Implementation:**

```javascript
// Frontend with progress
const uploadVideo = async (file) => {
  const { uploadUrl, objectKey } = await signGirlGalleryUpload({
    girlId,
    contentType: file.type,
    size: file.size,
  });

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    const percent = (e.loaded / e.total) * 100;
    setUploadProgress(percent);
  });

  xhr.open("PUT", uploadUrl);
  xhr.setRequestHeader("Content-Type", file.type);
  xhr.send(file);
};
```

### 4. Batch Upload Support

For uploading multiple gallery images:

```javascript
// Generate multiple presigned URLs at once
export const signBatchGalleryUpload = action({
  handler: async (ctx, { girlId, files }) => {
    // files: [{ contentType, size }, ...]
    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = `girls/${girlId}/gallery/${crypto.randomUUID()}.${getExtension(file.contentType)}`;
        const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: file.contentType,
        }), { expiresIn: 300 }); // 5 min for multiple uploads

        return { uploadUrl, objectKey: key };
      })
    );

    return { uploads };
  },
});
```

---

## Performance Considerations

### Current (Avatars):
- 1 avatar per user
- Signed URLs work perfectly
- ~2 Convex actions per page load (getMine + cfSignView)

### Future (Galleries):
- 50+ images per gallery
- **Use signed cookies** to avoid 50+ action calls
- 1 API route call + 0 action calls per image

### Caching Strategy:
- **CloudFront caching**: 1 hour (or until invalidated)
- **Browser caching**: Respect CloudFront cache headers
- **Signed URL caching**: Store in component state, refresh before expiry

---

## Testing Checklist

### Upload Testing:
- ✅ Valid file types accepted
- ✅ Invalid file types rejected
- ✅ File size limits enforced
- ✅ Unauthenticated users blocked
- ✅ Users can only upload to their own paths

### View Testing:
- ✅ Authenticated users can view their content
- ✅ Unauthenticated users blocked
- ✅ Users cannot view others' content (authorization)
- ✅ Direct S3 URLs don't work (security)
- ✅ CloudFront signed URLs work
- ✅ Expired URLs don't work (5+ minutes old)

### Security Testing:
- ✅ Direct S3 access returns AccessDenied
- ✅ CloudFront without signature returns MissingKey
- ✅ S3 presigned GET URLs blocked by bucket policy
- ✅ Only CloudFront signed URLs work

---

## Troubleshooting

### Upload Issues:

**Error: "CORS policy: No 'Access-Control-Allow-Origin' header"**
- Check S3 CORS includes your origin
- Verify `AllowedMethods` includes `PUT`
- Ensure `AllowedOrigins` has your domain

**Error: "AccessDenied" on upload**
- Check IAM user has `s3:PutObject` permission
- Verify bucket policy allows IAM user writes
- Check presigned URL not expired (60 seconds)

### View Issues:

**Error: "CF_DOMAIN not configured"**
- Set CloudFront domain in Convex env variables

**Error: "error:1E08010C:DECODER routines::unsupported"**
- Private key format issue
- Convert to PKCS#8: `openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in old.pem -out new.pem`
- Ensure no spaces in base64 content

**Error: "MissingKey" on CloudFront**
- Check trusted key group attached to behavior
- Verify key pair ID matches Convex config

**Images still loading from S3, not CloudFront**
- Check code uses `cfSignView` not `presignGet`
- Verify CloudFront domain in URL
- Clear browser cache

---

## Migration Plan (Current → Future)

### Phase 1: Current (✅ Complete)
- User avatars with signed URLs
- Single image per user
- Direct browser → S3 uploads
- CloudFront signed URLs for viewing

### Phase 2: Girl Profiles (Next)
1. Add `girls` table in Convex schema
2. Create `signGirlAvatarUpload` action
3. Build girl profile UI
4. Test with single girl avatar (same pattern as user avatars)

### Phase 3: Girl Gallery (Future)
1. Add `signGirlGalleryUpload` action with video support
2. Build gallery UI with bulk upload
3. Implement signed cookies for gallery viewing
4. Add pagination for large galleries

### Phase 4: Posts System (Future)
1. Add `posts` table in schema
2. Create `signGirlPostUpload` action
3. Build post creation/editing UI
4. Use signed cookies for feed views

---

## Costs & Optimization

### Current Costs:
- **S3 Storage**: ~$0.023/GB/month
- **S3 Requests**: Negligible (PUT only, low volume)
- **CloudFront**: ~$0.085/GB egress (first 10TB)
- **CloudFront Requests**: ~$0.0075/10,000 requests

### Optimization Tips:
- ✅ Use WebP for images (50% smaller than JPEG)
- ✅ CloudFront caching reduces S3 costs
- ✅ Direct uploads avoid backend egress fees
- ✅ Signed cookies reduce CloudFront request costs (vs per-image signed URLs)

### Estimated Costs (Future Scale):
- 1000 users × 1 avatar (1MB avg) = 1GB = **$0.02/month storage**
- 100 girls × 50 gallery items (5MB avg) = 25GB = **$0.58/month storage**
- 10,000 views/day × 2MB avg = 20GB/day = 600GB/month = **$51/month egress**

---

## Summary

### Current Implementation:
- ✅ Secure, scalable avatar uploads
- ✅ CloudFront-only viewing (no S3 bypass)
- ✅ Time-limited signed URLs
- ✅ Direct browser uploads (efficient)

### Future Additions:
- 🔜 Girl profiles with avatars
- 🔜 Gallery images/videos
- 🔜 Post media
- 🔜 Signed cookies for galleries
- 🔜 Video upload support with progress

### Key Principles:
1. **Never expose S3 credentials to frontend**
2. **Always validate on backend before presigning**
3. **Use CloudFront for all downloads** (no direct S3)
4. **Choose signed URLs vs cookies based on image count**
5. **Keep bucket private, locked to CloudFront**

This architecture scales from single avatars to large galleries while maintaining security and performance! 🚀
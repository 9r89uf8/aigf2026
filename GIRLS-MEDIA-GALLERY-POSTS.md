# Girls Media Gallery and Posts

This document explains how gallery and post media for girls are stored,
uploaded, and rendered in the app.
It is a reference for future changes.

## Scope
- Gallery media (isGallery)
- Post media (isPost)
- Public profile page rendering
- Admin upload and management flows
- CloudFront signing for read access
Reply assets (isReplyAsset) are only mentioned when relevant.

## High level flow
1. Admin uploads one or more files in the admin UI.
2. Each file is PUT to S3 using a presigned URL.
3. Convex stores media metadata in girl_media.
4. Public profile query aggregates gallery and posts.
5. Frontend requests CloudFront signed URLs in batch.
6. Media cards render images/videos with likes, location, date.

## Data model
File: convex/schema.js
- Table: girl_media
- Fields used by gallery/posts:
  - girlId
  - kind: image | video | audio
  - isGallery / isPost / isReplyAsset (exactly one true)
  - objectKey (string, always set)
  - objectKeys (array, optional, for multi image items)
  - text (caption or post text)
  - location (string, optional)
  - likeCount
  - canBeLiked
  - premiumOnly (gallery only)
  - published
  - createdAt / updatedAt
Notes:
- objectKey is always set to the first key for compatibility.
- objectKeys is only used for multi image gallery/posts.
- For video/audio items, objectKeys is not used.
- Reply assets can include bodyParts tags (senos, culo, vagina) for AI selection.

## Validation rules
File: convex/girls.js -> validateSurfaceCombo
- Exactly one surface flag must be true.
- Assets require text and mature flag.
- Assets cannot be likeable or premium only.
- Posts ignore premiumOnly.
- Gallery uses premiumOnly.
Additional multi image rules in finalizeGirlMedia:
- objectKeys can only be used when kind is image.
- objectKeys cannot be used for reply assets.
- objectKey is required; if objectKeys provided, first is used.

## Upload flow (admin)
Files:
- components/admin/MediaUploader.js
- convex/s3.js (signGirlMediaUpload)
- convex/girls.js (finalizeGirlMedia)
Upload steps:
1. Admin selects files in MediaUploader.
2. For each file, MediaUploader calls signGirlMediaUpload.
3. The browser uploads to S3 using the returned PUT URL.
4. MediaUploader calls finalizeGirlMedia with metadata.
Multi image upload:
- Only enabled for surface gallery/posts.
- UI checkbox: "Subir varias imagenes como un solo item/post".
- When enabled and 2+ images selected:
  - Each image is uploaded to S3.
  - finalizeGirlMedia is called once with objectKeys.
  - kind is forced to image.
- Videos and audio are still uploaded as separate items.
S3 path format:
- girls/{girlId}/media/{uuid}.{ext}
- Public access is via CloudFront signed URLs.
- See s3-cloudfront-implementation.md for the base design.

## Admin management pages
Files:
- app/(app)/admin/girls/[id]/gallery/page.js
- app/(app)/admin/girls/[id]/posts/page.js
Key behaviors:
- Both pages call listGirlGallery / listGirlPosts.
- Both pages batch sign URLs via api.cdn.signViewBatch.
- For multi image items, a count badge is shown on preview.
- Gallery page allows editing:
  - caption
  - location
  - premiumOnly
  - canBeLiked
  - likeCount
  - published
- Posts page allows editing:
  - text
  - location
  - canBeLiked
  - likeCount
  - published

## Public profile query
File: convex/girls.js -> profilePage
Inputs:
- girlId
- galleryLimit (default 12)
- postsLimit (default 12)
Gallery query:
- Reads published girl_media where isGallery is true.
- If premiumOnly and viewer is not premium:
  - objectKey/objectKeys are removed (locked).
- For each item, returns:
  - id, kind, text, location, likeCount, canBeLiked,
    premiumOnly, createdAt, objectKey, objectKeys
Posts query:
- Reads published girl_media where isPost is true.
- Posts are always public.
- Returns objectKey/objectKeys and location.
Keys to sign:
- profilePage collects keys from stories, highlights,
  gallery, posts, avatar, and background.
- If objectKeys is present, every key is added.

## Public profile UI
Files:
- app/(app)/chicas/[id]/page.js
- components/profile/MediaCard.js
- components/profile/LockedMediaCard.js
Signed URLs:
- page.js calls api.cdn.signViewBatch with keysToSign.
- signedUrls is a map: { objectKey: signedUrl }.
Gallery tab rendering:
- If premiumOnly and no visible keys:
  - LockedMediaCard is shown.
- Otherwise MediaCard is shown.
- MediaCard receives an array of URLs for images.
Posts tab rendering:
- Always MediaCard.
- MediaCard receives an array of URLs for images.
MediaCard behavior:
- Video uses <video> with controls.
- Audio uses <audio> with controls.
- Image shows the current image.
- If multiple images: arrows, counter badge, dots.
- Clicking the image opens a modal viewer.
Modal viewer (page.js):
- Shows the selected image at full size.
- If multiple images, prev/next in modal.
- Uses selectedMedia.urls and selectedMedia.index.
Info row under media:
- Location (or "Sin ubicacion").
- Date from createdAt (es-ES format).
- Like count and like button.

## Likes system
Files:
- convex/girls.js -> toggleLike
- convex/schema.js -> likes table
Notes:
- Likes only apply to gallery and posts.
- toggleLike checks canBeLiked and surface.
- liked IDs are returned in profilePage as viewer.likedIds.
- MediaCard uses optimistic updates on likes.

## Premium locking
- Gallery items can be premiumOnly.
- For non premium viewers, keys are removed in profilePage.
- The UI treats missing keys as locked.
- LockedMediaCard still shows caption, location, date, likes.

## Tips for future changes
- To support multi video items, extend schema and MediaCard.
- To add per image captions, add a parallel captions array.
- If you change signing, update profilePage keysToSign.
- If you change S3 key prefixes, update convex/cdn.js rules.
- Keep objectKey for backward compatibility with older records.

## Quick debugging checklist
- Missing image? Check objectKey/objectKeys in girl_media.
- Not signed? Verify key is in keysToSign.
- Locked when it should be open? Check premiumOnly and viewer premium.
- Likes not toggling? Check canBeLiked and toggleLike errors.
- Admin preview missing? Check signViewBatch and key format.

## Related files
- convex/schema.js
- convex/girls.js
- convex/s3.js
- convex/cdn.js
- components/admin/MediaUploader.js
- app/(app)/admin/girls/[id]/gallery/page.js
- app/(app)/admin/girls/[id]/posts/page.js
- app/(app)/chicas/[id]/page.js
- components/profile/MediaCard.js
- components/profile/LockedMediaCard.js
- s3-cloudfront-implementation.md

## Metadata
- Owner: app team
- Notes: keep in sync with schema and UI changes.
End of document.

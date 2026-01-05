# Stories System Guide

## Purpose
- This doc explains how stories and highlights work end to end.
- It is meant for quick orientation, not deep implementation detail.
- It calls out where to look when changing behavior.
- It uses ASCII only on purpose.

## At A Glance
- Live stories are visible for 24 hours, then only highlights show them.
- Highlights are labeled groups (Friends, Pets, etc.) tied to one girl.
- A story can belong to exactly one highlight.
- Highlights are ordered by newest story inside each highlight.
- Media is stored in S3 and viewed through CloudFront signed URLs.

## Core Files
- Data model: `convex/schema.js`.
- Story queries and mutations: `convex/girls.js`.
- Story rail for chat: `convex/chat_home.js`.
- TTL config: `convex/stories.config.js`.
- Profile viewer page: `app/(app)/chicas/[id]/page.js`.
- Fullscreen viewer page: `app/(public)/stories/[girlId]/page.js`.
- Admin stories manager: `app/(app)/admin/girls/[id]/stories/page.js`.
- Story viewer UI: `components/profile/StoryViewer.js`.
- Story chip UI: `components/profile/StoryChip.js`.
- Highlight chip UI: `components/profile/HighlightChip.js`.
- CDN signing: `convex/cdn.js`.
- S3 uploads: `convex/s3.js`.
- S3/CloudFront doc: `s3-cloudfront-implementation.md`.

## Data Model Summary
- `girls` table stores profile info and media keys.
- `girl_stories` table stores each story.
- `girl_story_highlights` table stores highlight labels.
- `conversations` table stores `lastStorySeenAt` for new ring logic.

### girl_stories fields
- `girlId`: owning girl.
- `kind`: image | video | text.
- `highlightId`: optional, one highlight per story.
- `objectKey`: S3 key for image or video.
- `text`: caption or text story content.
- `published`: visibility flag.
- `createdAt`: ms timestamp used for ordering and TTL.

### girl_story_highlights fields
- `girlId`: owning girl.
- `title`: label shown in UI.
- `titleLower`: used for uniqueness.
- `createdAt`, `updatedAt`: timestamps.

## TTL And Visibility
- The TTL is implemented by query filters, not by deleting data.
- TTL constant: `STORY_TTL_MS` in `convex/stories.config.js`.
- Live stories are filtered by `createdAt >= now - STORY_TTL_MS`.
- Highlights ignore TTL; they show all published stories.

## Story Creation Flow (Admin)
- Admin uploads media or creates text in `app/(app)/admin/girls/[id]/stories/page.js`.
- Media upload uses `api.s3.signGirlMediaUpload` -> S3 PUT.
- After upload, `api.girls.createStory` inserts the story row.
- `createStory` validates kind and `objectKey` / `text`.
- If a highlight is chosen, `createStory` validates the highlight belongs to the girl.

## Highlight Creation Flow (Admin)
- Highlight creation happens in `app/(app)/admin/girls/[id]/stories/page.js`.
- `api.girls.createHighlight` writes to `girl_story_highlights`.
- Titles are unique per girl via `titleLower`.
- Highlights can be renamed via `api.girls.updateHighlight`.
- Highlights can be deleted via `api.girls.deleteHighlight`.
- Deleting a highlight clears `highlightId` on affected stories.

## Live Stories Query (Profile)
- `api.girls.profilePage` returns live stories and highlight data.
- It uses `by_girl_published` index with TTL filter.
- It returns `stories` (live) plus `highlights` (cover info).
- It also returns `keysToSign` for media URLs.

## Highlights Query (Profile)
- `profilePage` queries all highlights for the girl.
- For each highlight, it queries newest published story as the cover.
- Highlights are sorted by that cover story time.
- Each highlight returns `{ id, title, lastStoryAt, cover }`.

## Highlight Stories Query (Viewer)
- `api.girls.listHighlightStories` fetches all published stories for a highlight.
- This query does NOT apply TTL.
- It validates the highlight exists and the girl is active.

## Story Rail In Chat
- `api.chat_home.getHome` builds the story rail for chat.
- It uses the TTL filter on `girl_stories`.
- It picks the newest live story per active girl.
- `hasNew` is based on `conversations.lastStorySeenAt`.
- UI uses `app/(app)/chat/page.js` + `AvatarWithStoryRing`.

## Stories Page (Fullscreen)
- `app/(public)/stories/[girlId]/page.js` shows live stories only.
- It uses `profilePage` and the live `stories` list.
- It marks stories as seen via `ensureConversationAndMarkStoriesSeen`.
- There is no highlight selection on this route.

## Profile Page (Stories + Highlights)
- `app/(app)/chicas/[id]/page.js` renders two strips.
- Strip 1: live stories using `StoryChip`.
- Strip 2: highlights using `HighlightChip`.
- Clicking a live story opens `StoryViewer` with `stories` list.
- Clicking a highlight opens `StoryViewer` with `highlightStories` list.
- Highlight viewer uses `api.girls.listHighlightStories` with `useQuery(..., "skip")`.

## StoryViewer Component
- `components/profile/StoryViewer.js` handles progress bars and auto-advance.
- It supports `text`, `image`, and `video`.
- It auto-advances on a timer for text/image and on video end for video.
- It accepts neighbor URLs for preloading (image only).
- It is used by both profile and public stories routes.

## Media Signing
- Media keys are signed via `api.cdn.signViewBatch`.
- Keys starting with `girls/` are public and do not require auth.
- Profile page signs `keysToSign` from `profilePage`.
- Highlight viewer signs missing keys once `highlightStories` loads.
- S3 upload path for story media: `girls/{girlId}/media/{uuid}.{ext}`.

## Indexes Used
- `girl_stories.by_girl_published` for live stories.
- `girl_stories.by_published_createdAt` for global rails.
- `girl_stories.by_highlight_published` for highlight view.
- `girl_story_highlights.by_girl` for per-girl highlights.
- `girl_story_highlights.by_girl_titleLower` for uniqueness.

## Ordering Rules
- Live stories are ordered by `createdAt desc` and capped to 10.
- Highlights are ordered by newest story inside each highlight.
- Highlight viewer orders stories by `createdAt desc`.

## Permissions
- Creating, updating, and deleting stories and highlights requires admin.
- Viewing stories is public for `girls/` media keys.
- The app still checks `girl.isActive` for public access.

## Common Changes
- Change TTL: update `STORY_TTL_MS` and verify all TTL queries.
- Change highlight rules: update `createStory`, `updateStory`, and UI selectors.
- Change ordering: update query `.order("desc")` or sorting logic.
- Add a cover override: extend `girl_story_highlights` with a `coverStoryId`.
- Add highlight tabs in `/stories/[girlId]` if needed.

## Known Constraints
- Stories do not auto-expire in the DB; TTL is just a filter.
- A story can only be assigned to one highlight.
- There is no separate highlight cover image; it uses the newest story.
- No per-story privacy; all girl stories are public when published.

## Quick Debug Checklist
- Check `published` flag on the story.
- Check `createdAt` vs TTL window.
- Verify `highlightId` is set for highlight stories.
- Confirm the S3 object key exists and is signed.
- Ensure the girl is active (`girls.isActive`).
- Inspect `profilePage` output to see `stories` and `highlights`.

## UI Entry Points
- Chat rail: `app/(app)/chat/page.js` (live stories only).
- Girls list: `app/(app)/chicas/GirlsClient.js` (hasStory ring).
- Profile: `app/(app)/chicas/[id]/page.js` (live + highlights).
- Public viewer: `app/(public)/stories/[girlId]/page.js` (live only).
- Admin: `app/(app)/admin/girls/[id]/stories/page.js` (create/edit).

## When Adding New Surfaces
- If you add a new story surface, update `profilePage` keysToSign.
- Update `StoryViewer` if the media kind changes.
- Add new indexes if you need different ordering or filtering.

## Example Data Shapes
- Live story: `{ id, kind, text, objectKey, createdAt }`.
- Highlight: `{ id, title, lastStoryAt, cover }`.
- Highlight cover: `{ id, kind, text, objectKey, createdAt }`.

## Related Docs
- Media pipeline: `s3-cloudfront-implementation.md`.
- Architecture overview: `ARCHITECTURE.md`.

## Manual Test Ideas
- Create a live story, verify it appears on avatar ring.
- Assign the story to a highlight, verify highlight appears.
- Wait or mock TTL to ensure live story disappears but highlight remains.
- Play a highlight with text and video content.
- Delete a highlight and confirm stories remain ungrouped.

## Change Log Notes
- Highlight support introduced with `girl_story_highlights` table.
- TTL window introduced via `STORY_TTL_MS`.
- Profile highlights strip added to `app/(app)/chicas/[id]/page.js`.

## If Something Breaks
- Check Convex query errors in the browser console.
- Check S3/CloudFront signing errors in `convex/cdn.js`.
- Confirm the correct `girlId` is used in routes.
- Use `rg "girl_stories" convex app` to find all references.

## End

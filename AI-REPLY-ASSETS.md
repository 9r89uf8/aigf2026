# AI Reply Assets and Chat Media Flow

This document explains how AI reply assets are selected and rendered.
It focuses on isReplyAsset media and the chat reply pipeline.

## Scope
- isReplyAsset for AI reply assets
- how assets are stored and validated
- how chat decides to send text vs media
- how mature vs normal selection works
- how assets are chosen and deduplicated
- how the chat UI renders media
- where to change behavior

## Key Files
- convex/schema.js
- convex/girls.js
- convex/chat_actions.js
- app/(app)/admin/girls/[id]/assets/page.js
- components/admin/MediaUploader.js
- app/(app)/chat/[conversationId]/page.js
- components/chat/useSignedMediaUrls.js
- s3-cloudfront-implementation.md

## Data Model (girl_media)
- Table: girl_media
- Key fields: girlId, kind, objectKey, text, mature
- Surface flags: isGallery, isPost, isReplyAsset (exactly one true)
- isReplyAsset marks media that can be sent by the AI
- text is required for reply assets and drives tag matching
- mature is required for reply assets and used for filtering
- published controls AI availability
- objectKeys is not allowed for reply assets

## Validation Rules
- Implemented in convex/girls.js validateSurfaceCombo
- Exactly one surface must be true
- Reply assets require a descriptive text and a mature flag
- Reply assets cannot be liked, do not use premiumOnly, and have no location
- Multi image items are only allowed for gallery/posts

## Admin Upload Flow (Assets)
- UI: app/(app)/admin/girls/[id]/assets/page.js
- Uploads use components/admin/MediaUploader.js
- The client requests a presigned PUT URL to S3
- The file is uploaded directly to S3
- convex/girls.js finalizeGirlMedia stores metadata
- text and mature are set by admin in the UI
- published controls if AI can use the asset

## How the AI Picks Media: High Level
- The chat action is convex/chat_actions.js aiReply
- The server decides whether to send text or media
- If media is chosen, the server selects an asset by kind
- The selected asset objectKey becomes messages.mediaKey
- The frontend never selects assets, it only renders mediaKey

## Fast Intent Detection (pre LLM)
- detectFastIntentFromText uses regex to detect image/video/audio asks
- It runs on the last user text message only
- It also extracts small tags (selfie, vestido, gym, etc)
- If fast intent is detected, the system can bypass the LLM
- This path saves tokens and responds faster

## LLM Decision Path
- If fast intent does not trigger, the LLM returns JSON
- The JSON contains type and optional tags
- The decision is parsed by parseDecision
- type text -> send text
- type image/video/audio -> select asset of that kind

## Mature vs Normal Preference
- detectMaturePreference inspects the last user text
- If the user asks for normal/soft, preference is "normal"
- If the user uses spicy terms, preference is "mature"
- Normal keywords include: normal, inocente, soft, sin sexo, sin desnudos
- Spicy keywords include: 18+, sexy, caliente, hot, spicy, xxx, desnuda, sin ropa, nudes, pack, onlyfans, porno, culo, tetas
- If no preference is detected, preference defaults to "normal" (non-mature only)

## Mature Filtering Behavior
- filterAssetsByMaturePreference applies the preference
- preference "normal" -> only non mature assets
- preference "mature" -> only mature assets
- if "mature" yields none, it falls back to normal assets
- if "normal" yields none, it falls back to text
- this behavior is used in both fast intent and LLM paths

## Asset Selection and Dedup
- listGirlAssetsForReply loads assets for girlId + kind + published
- pickAssetWithDedup chooses from assets
- it prefers unseen assets based on conversation.mediaSeen
- if all seen, it avoids the most recent N
- if tags exist, it filters to assets whose text includes the tags
- tag matching is plain substring search on asset text

## Audio Special Case (Moans)
- If the user asks for moaning, the audio path is special
- It filters to mature audio assets with text matching moan/gemid
- If none exist, it falls back to any mature audio asset
- If still none exist, it falls back to TTS audio

## Quotas and Cooldowns
- media and audio are gated by freeRemaining quotas
- non premium users can be blocked from media/audio
- heavyCooldownUntil throttles media/audio unless explicitly asked
- explicit asks skip cooldown checks

## Messages Stored in Convex
- messages.kind is text, image, video, or audio
- messages.mediaKey is the S3 key for AI media
- captions are stored in messages.text
- mediaSummary exists for user media analysis

## Client Rendering (Chat UI)
- app/(app)/chat/[conversationId]/page.js renders messages
- components/chat/useSignedMediaUrls signs mediaKey via CDN
- the UI never knows if a media is mature
- the UI simply renders the signed URL

## Asset Descriptions Matter
- The AI does not see the images
- The AI uses asset text to match tags
- Good descriptions improve relevance
- Descriptions should include keywords you expect users to ask for

## How to Change Keyword Behavior
- Edit detectMaturePreference in convex/chat_actions.js
- Add or remove words for spicy or normal requests
- Keep the regex in lowercase and use normalizeMx for accents

## How to Change the Fallbacks
- filterAssetsByMaturePreference controls fallback behavior
- To allow mature fallback on normal asks, change the return path
- To force text only on spicy when none exist, remove the fallback

## How to Add New Tags
- Add regexes in extractTags in convex/chat_actions.js
- Use those tag words in asset descriptions
- Tags are optional and only used for asset matching

## How to Add New Asset Types
- Update schema kind union if you add a new media type
- Update listGirlAssetsForReply filters and UI renderers
- Update message handling and signing

## How to Debug Wrong Asset Selection
- Verify the asset has isReplyAsset true and published true
- Confirm kind matches the request (image or video)
- Check the asset text contains the expected keywords
- Inspect conversation.mediaSeen if repeats are happening

## How to Debug Mature Filtering
- Confirm the asset has mature true or false
- Confirm the user text includes spicy keywords
- Check detectMaturePreference for accidental matches
- Verify the fallback you want (normal or text) is coded

## Related Queries and Mutations
- convex/girls.js listGirlAssetsForReply
- convex/chat_actions.js aiReply
- convex/chat_actions.js _insertAIMediaAndDec
- convex/chat_actions.js _insertAIAudioAndDec

## Security and Storage
- S3 keys are stored in girl_media.objectKey
- CloudFront signed URLs are used for reads
- See s3-cloudfront-implementation.md for signing details

## Summary
- Assets live in girl_media with isReplyAsset
- The server chooses assets based on user intent
- Mature preference is derived from user text
- Filtering happens before dedup and tag matching
- The UI just renders the chosen media

## Quick Checklist for Future Changes
- Update schema if you add new fields or kinds
- Update admin UI if new metadata is required
- Update detectFastIntentFromText for new intent phrases
- Update detectMaturePreference for new spicy words
- Update filterAssetsByMaturePreference for fallback rules
- Update tag extraction and asset descriptions together
- Keep tests or manual checks around quotas and cooldowns

## Notes
- The AI does not know the actual image content
- It only knows its own decision and the user text
- The asset text is the bridge between intent and media
- Changing this file is the main entry point for behavior

## Line Count
- This document is intentionally around 200 lines
- Keep it updated when logic changes

End of document.

## Change Log
- Keep a short note when you change intent, filtering, or selection
- Record date, file, and reason
- Example: 2026-01-01 chat_actions.js add spicy filter
- 2026-01-09 chat_actions.js default preference to normal to avoid mature assets without explicit ask
- End

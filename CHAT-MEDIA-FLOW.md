# Chat Media Send + AI Response Flow

## Scope
This document explains what happens when a user sends media (image, video, audio)
and how the AI is programmed to respond. It also points to the exact files and
functions so future changes are easy.

Related docs:
- s3-cloudfront-implementation.md (upload + signed view URLs)
- AI-REPLY-ASSETS.md (AI sent media assets, mature filtering)

## Data model (Convex)
Relevant tables in `convex/schema.js`:
- `messages`: stores each chat message (user or AI) and optional `mediaKey`
  and `mediaSummary`.
- `mediaInsights`: stores Rekognition results for user images/videos, including
  moderation labels (explicit content).
- `conversations`: tracks last message preview, quota counters, and media dedup.

Key fields:
- `messages.kind`: "text" | "image" | "video" | "audio"
- `messages.mediaKey`: S3 key for media (user or AI)
- `messages.mediaSummary`: short string built from Rekognition labels
- `mediaInsights.moderationLabels`: explicit content labels

## Upload and finalize (user media)
Files: `convex/s3.js`, `s3-cloudfront-implementation.md`

1) Client requests a presigned upload URL:
   - `convex/s3.js` -> `signChatUpload`
   - Validates `conversationId`, media kind, type, and size.
   - Returns `{ uploadUrl, objectKey }`.

2) Client uploads directly to S3 using the presigned URL.

3) Client confirms the upload with:
   - `convex/s3.js` -> `finalizeChatUpload`
   - Verifies key prefix `chat/{conversationId}/user/`
   - HEAD checks size and content-type.

4) Client then calls the chat send mutation:
   - `convex/chat.js` -> `sendMediaMessage` (image/video)
   - `convex/chat.js` -> `sendAudioMessage` (audio)

## Message insert + scheduling
File: `convex/chat.js`

When the user sends an image or video:
- `sendMediaMessage` inserts a `messages` row with:
  - `sender: "user"`
  - `kind: "image" | "video"`
  - `mediaKey: objectKey`
  - `text: caption` (optional)
- Updates conversation preview (`[Image]`, `[Video]`, or caption).
- Schedules analysis actions and passes `conversationId`:
  - `api.actions.analyzeImage.analyzeImageContent` (image)
  - `api.actions.analyzeVideo.analyzeVideoContent` (video)
  - The AI reply is scheduled inside these actions after analysis.

When the user sends audio:
- `sendAudioMessage` inserts a user audio message and schedules:
  - `api.s3.transcribeAndReply` (transcription + AI response)

## Image analysis (explicit detection)
File: `convex/actions/analyzeImage.js`

What it does:
- Uses AWS Rekognition:
  - `DetectModerationLabels` for explicit content
  - `DetectLabels` for scene/object labels
- Stores results in `mediaInsights`.
- Builds a short `messages.mediaSummary` string:
  - Example: `escena: bedroom, selfie | mod: nudity`
- Schedules the AI reply after analysis finishes.

Important behavior:
- Only labels with confidence > 80 are added to `mediaSummary`.
- If analysis fails, it stores empty insights and still schedules reply.

## Video analysis (explicit detection)
File: `convex/actions/analyzeVideo.js`

What it does:
- Downloads the video to `/tmp`.
- Extracts one frame via ffmpeg.
- Runs `DetectModerationLabels` on the frame.
- Stores results in `mediaInsights`.
- Builds `messages.mediaSummary` with `mod: ...` if labels exist.
- Schedules the AI reply after analysis finishes.

## AI response when user sends media
File: `convex/chat_actions.js`

Entry point:
- `aiReply` action is scheduled after analysis (image/video) or transcription (audio).

Media reaction path:
- If the last user message is media (image/video/audio), the code uses the
  micro-LLM path, not the full decision LLM:
  - `FAST_INTENT_ENABLED` is true.
  - `isUserMedia` triggers a short reaction reply.

How the reply is built for image/video:
1) `lastUserMediaSummary` comes from `messages.mediaSummary`.
2) `isExplicitSummary` checks for "mod:" in the summary.
3) `microReactToUserMedia` is called with `{ explicit: true|false }`.
4) The prompt tone changes:
   - explicit: "muy caliente y explicito"
   - normal: "coqueta y light, sin detalles explicitos"
5) Result is stored as a short text reply.

Where the explicit check happens:
- `isExplicitSummary` in `convex/chat_actions.js`
- Used for normal media reactions and for reply-to superseded messages.

## How this differs from AI-sent media
AI-sent media (image/video replies) uses reply assets:
- See `AI-REPLY-ASSETS.md`.
- That flow is triggered when the user asks for media in text.
- It uses mature filtering on the asset pool.
- It is separate from the user-sent media reaction path above.

## Where to change behavior
Common tweaks and their files:

1) Change explicit detection threshold:
   - `convex/actions/analyzeImage.js` and `convex/actions/analyzeVideo.js`
   - Adjust the confidence filter used to build `mediaSummary`.

2) Change how explicit is detected:
   - `convex/chat_actions.js` -> `isExplicitSummary`
   - Example: check `mediaInsights` directly instead of `mediaSummary`.

3) Change reaction tone or content:
   - `convex/chat_actions.js` -> `microReactToUserMedia`
   - Adjust the prompt text for explicit or normal responses.

4) Change scheduling or delays:
   - `convex/chat.js` (sendMediaMessage)
   - `convex/actions/analyzeImage.js` / `convex/actions/analyzeVideo.js`

5) Include more context in prompts:
   - `convex/chat_actions.js` -> `_getContextV2`
   - This is where `mediaSummary` is injected into history.

## Debug checklist
If explicit and normal replies look the same:
- Verify Rekognition returns moderation labels.
- Confirm `messages.mediaSummary` includes `mod:`.
- Check the summary confidence filter (> 80).
- Confirm `aiReply` is scheduled after analysis, not before.
- Inspect `microReactToUserMedia` prompt and the `explicit` flag path.


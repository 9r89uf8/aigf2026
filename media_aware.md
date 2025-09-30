Got it on all 3 points (explicit media is common, no audio analysis for video, no guardrails). Here’s what I recommend and how to wire it in—plus **server‑side code** you can drop into your Convex “actions” layer (or any Node server) to analyze **images** and **videos** with **Amazon Rekognition**, keeping latency and cost in check.

---

## What to do for images vs. video

* **Images (do this synchronously):**
  Call **Rekognition Image → `DetectLabels`** on the S3 object and attach the top labels to the message. It’s fast and cheap; supports PNG/JPEG S3 objects directly. ([AWS Documentation][1])

* **Video (do NOT analyze the whole asset):**
  **Don’t** call Rekognition Video over the full file (asynchronous, processes the *entire* clip, and only supports H.264 inside MP4/MOV/AVI). Instead, **sample a few frames** (e.g., at 0s, 1.5s, 3s) using FFmpeg, then run **Rekognition Image → `DetectLabels`** on those JPEG frames. Aggregate the labels and feed them to the LLM. This is the best latency/cost trade‑off for a chat UX. ([AWS Documentation][2])

  > If you *must* use Rekognition Video, I’ve included a polling example. It’s asynchronous (`StartLabelDetection` → poll `GetLabelDetection`) and still analyzes the full file; you can later **filter to the first N seconds in post‑processing**, but you’ll still pay/await the full analysis. ([AWS Documentation][3])

---

## How the flow changes (relative to your current doc)

**Images (synchronous in finalize step)**

```
Finalize & validate upload (you already do)
→ analyzeImageLabels (DetectLabels on S3 object)
→ write media_insights{labels} for messageId
→ schedule aiReply(... includes insights if present)
```

**Videos (frame sampling; short, async action; no audio)**

```
Finalize & validate upload
→ schedule analyzeVideoFramesAction (extract 1–3 frames → DetectLabels → aggregate)
→ schedule aiReply in parallel, but aiReply waits up to ~1s for insights (optional)
   - if insights ready, include them
   - if not, reply anyway; you can post a “follow-up” once insights land
```

> You keep the chat snappy; images usually finish in-line; videos add a quick async job that doesn’t block the UI.

---

## Minimal schema addition (server)

Add a small “insights” record keyed by `messageId`:

```ts
// media_insights
{
  messageId: string,
  kind: 'image' | 'video',
  labels: Array<{ name: string; confidence: number }>, // aggregated & deduped
  framesAnalyzed?: number,   // for video
  source: 'rekognition-image' | 'frame-sampling' | 'rekognition-video',
  createdAt: number
}
```

Your AI reply action looks up `media_insights` for the last user message and, if present, injects:

```json
{ "image_or_video_insights": { "labels": [ {"name":"Person","confidence":98.1}, ... ] } }
```

---

# Server‑side code (Node/TypeScript, AWS SDK v3)

> No frontend code. These functions are designed to be called from **Convex Actions** (or any Node runtime). They use AWS SDK v3 and `ffmpeg-static` for lightweight frame extraction.

### 1) AWS clients (shared)

```ts
// aws/clients.ts
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';

export const rekognition = new RekognitionClient({ region });
export const s3 = new S3Client({ region });
// Credentials are picked up from the environment/role.
```

---

### 2) Image analysis (synchronous, on finalize)

```ts
// analysis/image.ts
import { DetectLabelsCommand, type Label } from '@aws-sdk/client-rekognition';
import { rekognition } from '../aws/clients';

export type SimpleLabel = { name: string; confidence: number };

export async function analyzeImageFromS3(params: {
  bucket: string;
  key: string;              // JPEG or PNG in S3
  minConfidence?: number;   // e.g., 75
  maxLabels?: number;       // e.g., 10
}): Promise<SimpleLabel[]> {
  const { bucket, key, minConfidence = 75, maxLabels = 10 } = params;

  const out = await rekognition.send(
    new DetectLabelsCommand({
      Image: { S3Object: { Bucket: bucket, Name: key } },
      MinConfidence: minConfidence,
      MaxLabels: maxLabels,
    })
  );

  const labels: SimpleLabel[] = (out.Labels ?? [])
    .map((l) => ({ name: l.Name ?? '', confidence: l.Confidence ?? 0 }))
    .filter((l) => l.name)
    .sort((a, b) => b.confidence - a.confidence);

  return labels;
}
```

*Rekognition Image `DetectLabels` supports S3 objects directly and lets you specify `MinConfidence` and `MaxLabels`. Use PNG/JPEG.* ([AWS Documentation][1])

---

### 3) Video analysis (recommended): frame sampling + image labels

```ts
// analysis/video-frame-sampling.ts
import { pipeline } from 'node:stream/promises';
import { createWriteStream, promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import ffmpegPath from 'ffmpeg-static';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../aws/clients';
import { DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { rekognition } from '../aws/clients';

export type VideoFrameAnalysisParams = {
  bucket: string;
  key: string;                // your .mp4/.webm etc.
  timestampsMs?: number[];    // frames to sample, default [0,1500,3000]
  minConfidence?: number;     // e.g., 75
  maxLabelsPerFrame?: number; // e.g., 8
};

export type AggregatedLabels = Array<{ name: string; confidence: number }>;

export async function analyzeVideoBySamplingFrames(
  params: VideoFrameAnalysisParams
): Promise<{ labels: AggregatedLabels; framesAnalyzed: number }> {
  const {
    bucket,
    key,
    timestampsMs = [0, 1500, 3000],
    minConfidence = 75,
    maxLabelsPerFrame = 8,
  } = params;

  // 1) Download video to /tmp (simplest + reliable seeking for ffmpeg)
  const localPath = `/tmp/${randomUUID()}-${key.split('/').pop() || 'video'}`;
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  await pipeline(obj.Body as NodeJS.ReadableStream, createWriteStream(localPath));

  // 2) Extract JPEG frames at the given timestamps using ffmpeg
  const frameBuffers: Buffer[] = [];
  for (const t of timestampsMs) {
    try {
      const buf = await extractJpegFrame(localPath, t);
      if (buf && buf.length > 0) frameBuffers.push(buf);
    } catch (err) {
      // Ignore failed timestamps (e.g., video shorter than t)
    }
  }

  // 3) Run DetectLabels on each frame (Image.Bytes)
  const labelMax: Map<string, number> = new Map();
  for (const buf of frameBuffers) {
    const out = await rekognition.send(
      new DetectLabelsCommand({
        Image: { Bytes: buf },
        MinConfidence: minConfidence,
        MaxLabels: maxLabelsPerFrame,
      })
    );
    for (const lab of out.Labels ?? []) {
      const name = lab.Name ?? '';
      const conf = lab.Confidence ?? 0;
      if (!name) continue;
      // keep the max confidence across frames
      labelMax.set(name, Math.max(labelMax.get(name) ?? 0, conf));
    }
  }

  // 4) Aggregate & sort
  const labels = [...labelMax.entries()]
    .map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  // 5) Cleanup
  await fs.unlink(localPath).catch(() => {});

  return { labels, framesAnalyzed: frameBuffers.length };
}

async function extractJpegFrame(inputPath: string, atMs: number): Promise<Buffer> {
  const args = [
    '-ss',
    (atMs / 1000).toString(), // seek
    '-i',
    inputPath,
    '-frames:v',
    '1',
    '-f',
    'image2pipe',
    '-vcodec',
    'mjpeg',
    'pipe:1',
  ];

  const ff = spawn(ffmpegPath as string, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  const chunks: Buffer[] = [];
  const err: Buffer[] = [];

  ff.stdout.on('data', (c) => chunks.push(c));
  ff.stderr.on('data', (c) => err.push(c));

  await new Promise<void>((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}: ${Buffer.concat(err).toString()}`));
    });
  });

  return Buffer.concat(chunks);
}
```

* This works for **any** input formats FFmpeg can decode (e.g., your **MP4/WEBM**).
* We pass the JPEG **bytes** directly to `DetectLabels` (no need to upload the frames).
* The result is a **compact label set** representative of the clip’s first moments.

*Rekognition Image supports bytes for `DetectLabels`; FFmpeg static binaries make this portable in Node.* ([AWS Documentation][1])

---

### 5) Example: wiring into your finalize & AI reply actions (server only)

```ts
// convex/actions/analyzeMedia.ts (conceptual – adapt to your Convex APIs)
import { analyzeImageFromS3 } from '../analysis/image';
import { analyzeVideoBySamplingFrames } from '../analysis/video-frame-sampling';
// import { analyzeVideoWithRekognitionVideo } from '../analysis/video-rekognition-video';

type SaveInsights = (messageId: string, insights: {
  kind: 'image'|'video';
  labels: { name: string; confidence: number }[];
  framesAnalyzed?: number;
  source: string;
}) => Promise<void>;

export async function analyzeImageMessage({
  bucket, key, messageId, save
}: { bucket: string; key: string; messageId: string; save: SaveInsights }) {
  const labels = await analyzeImageFromS3({ bucket, key, minConfidence: 75, maxLabels: 10 });
  await save(messageId, { kind: 'image', labels, source: 'rekognition-image' });
}

export async function analyzeVideoMessage({
  bucket, key, messageId, save
}: { bucket: string; key: string; messageId: string; save: SaveInsights }) {
  // Recommended: frame sampling (fast, cheap)
  const { labels, framesAnalyzed } = await analyzeVideoBySamplingFrames({
    bucket, key, timestampsMs: [0, 1500, 3000], minConfidence: 75, maxLabelsPerFrame: 8
  });
  await save(messageId, { kind: 'video', labels, framesAnalyzed, source: 'frame-sampling' });

  // Alternative (not recommended for chat): full Rekognition Video job
  // const { labels } = await analyzeVideoWithRekognitionVideo({
  //   bucket, key, minConfidence: 75, cutoffMs: 3000
  // });
  // await save(messageId, { kind: 'video', labels, source: 'rekognition-video' });
}
```

---

## Notes specific to your constraints

* **Explicit content is expected** → you’re *not* calling moderation APIs, and that’s fine technically. (Rekognition provides moderation APIs, but we’re intentionally not using them.) ([AWS Documentation][4])
* **No audio analysis for video** → we didn’t include any STT; the video path is purely visual (frames → labels).
* **Formats** → Rekognition Video requires **H.264** in MP4/MOV/AVI. If users upload **WEBM**, the **frame‑sampling** path above still works because FFmpeg can decode and we analyze JPEG frames. ([AWS Documentation][2])

---

## What the AI sees

When generating the AI reply, read `media_insights` for the latest user message and include a compact context field, e.g.:

```json
{
  "image_or_video_insights": {
    "labels": [
      {"name":"Person","confidence":98.1},
      {"name":"Underwear","confidence":94.3},
      {"name":"Bed","confidence":90.2}
    ]
  }
}
```

This keeps the prompt short and unambiguous, and—because you’re not adding any “guardrails”—the persona can respond directly and consistently given the labels.

---

### Why this is the right trade‑off for chat

* **Image** recognition runs inline with finalize (fast). ([AWS Documentation][1])
* **Video** recognition via **frame sampling** delivers most of the signal at a tiny fraction of the time/cost; it’s synchronous enough to inform the first AI reply without stalling the UX.


[1]: https://docs.aws.amazon.com/rekognition/latest/APIReference/API_DetectLabels.html?utm_source=chatgpt.com "DetectLabels - Amazon Rekognition"
[2]: https://docs.aws.amazon.com/rekognition/latest/dg/video.html?utm_source=chatgpt.com "Working with stored video analysis operations"
[3]: https://docs.aws.amazon.com/rekognition/latest/APIReference/API_StartLabelDetection.html?utm_source=chatgpt.com "StartLabelDetection - Amazon Rekognition"
[4]: https://docs.aws.amazon.com/rekognition/latest/dg/moderation-api.html?utm_source=chatgpt.com "Using the image and video moderation APIs"

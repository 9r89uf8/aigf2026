"use node";

// convex/s3.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdmin } from "./_utils/auth";
import crypto from "node:crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

function extFromContentType(ct) {
  if (!ct) return "bin";
  if (ct.includes("jpeg")) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("webm")) return "webm";
  return "bin";
}

function assertAllowed(ct, size) {
  const ok = ct?.startsWith("image/") || ct?.startsWith("video/");
  if (!ok) throw new Error("Only image/* or video/* allowed");
  if (size > 200 * 1024 * 1024) throw new Error("File too large (max 200MB)");
}

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

export const signGirlAvatarUpload = action({
  args: { girlId: v.id("girls"), contentType: v.string(), size: v.number() },
  handler: async (ctx, { girlId, contentType, size }) => {
    await assertAdmin(ctx);
    assertAllowed(contentType, size);
    const key = `girls/${girlId}/profile/${crypto.randomUUID()}.${extFromContentType(contentType)}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET, Key: key, ContentType: contentType, ACL: "private",
      }),
      { expiresIn: 60 }
    );
    return { objectKey: key, uploadUrl };
  },
});

export const signGirlBackgroundUpload = action({
  args: { girlId: v.id("girls"), contentType: v.string(), size: v.number() },
  handler: async (ctx, { girlId, contentType, size }) => {
    await assertAdmin(ctx);
    assertAllowed(contentType, size);
    const key = `girls/${girlId}/background/${crypto.randomUUID()}.${extFromContentType(contentType)}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET, Key: key, ContentType: contentType, ACL: "private",
      }),
      { expiresIn: 60 }
    );
    return { objectKey: key, uploadUrl };
  },
});

export const signGirlMediaUpload = action({
  args: {
    girlId: v.id("girls"),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { girlId, contentType, size }) => {
    await assertAdmin(ctx);
    assertAllowed(contentType, size);
    const key = `girls/${girlId}/media/${crypto.randomUUID()}.${extFromContentType(contentType)}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET, Key: key, ContentType: contentType, ACL: "private",
      }),
      { expiresIn: 60 }
    );
    return { objectKey: key, uploadUrl };
  },
});

// ── Chat Media Upload Actions ─────────────────────────────────────────────

import { MAX_AUDIO_BYTES, AUDIO_MIME_TYPES } from "./chat.config.js";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const AUDIO_TYPES = new Set(AUDIO_MIME_TYPES);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5MB

function validateKindAndType(kind, contentType) {
  if (kind === "image" && !IMAGE_TYPES.has(contentType)) throw new Error("Unsupported image type");
  if (kind === "video" && !VIDEO_TYPES.has(contentType)) throw new Error("Unsupported video type");
  if (kind === "audio" && !AUDIO_TYPES.has(contentType)) throw new Error("Unsupported audio type");
}

export const signChatUpload = action({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { conversationId, kind, contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Security: validate conversation ownership (lightweight check)
    await ctx.runQuery(api.chat._verifyConversationOwnership, { conversationId, userId });

    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");
    if (kind === "audio" && size > MAX_AUDIO_BYTES) throw new Error("Audio too large");

    // Key: chat/{conversationId}/user/{uuid.ext}
    const ext = contentType.split("/")[1] || "bin";
    const key = `chat/${conversationId}/user/${crypto.randomUUID()}.${ext}`;

    // PUT presign (5 minutes)
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 }
    );

    return { uploadUrl, objectKey: key };
  },
});

export const finalizeChatUpload = action({
  args: {
    objectKey: v.string(),
    kind: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { objectKey, kind, conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Security: validate key belongs to this conversation and user owns it
    if (!objectKey.startsWith(`chat/${conversationId}/user/`)) {
      throw new Error("Key mismatch");
    }

    // Validate conversation ownership (lightweight check)
    await ctx.runQuery(api.chat._verifyConversationOwnership, { conversationId, userId });

    // HEAD to confirm it exists & validate size/content-type
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    const size = head.ContentLength ?? 0;
    const contentType = head.ContentType ?? "";

    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");
    if (kind === "audio" && size > MAX_AUDIO_BYTES) throw new Error("Audio too large");

    return { ok: true, size, contentType };
  },
});

// ── Audio Actions (Whisper + ElevenLabs) ──────────────────────────────────

import { TTS_AUDIO_MIME } from "./chat.config.js";

/** Transcribe user audio with Whisper, then trigger AI reply */
export const transcribeAndReply = action({
  args: { conversationId: v.id("conversations"), messageId: v.id("messages") },
  handler: async (ctx, { conversationId, messageId }) => {
    // Load audio message
    const msg = await ctx.runQuery(api.chat._getMessageInternal, { messageId });
    if (!msg || msg.kind !== "audio" || !msg.mediaKey) return;

    // Download audio from S3
    const audioObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: msg.mediaKey }));
    const buffer = await audioObj.Body.transformToByteArray();

    // Transcribe with Whisper
    let transcript = null;
    try {
      const form = new FormData();
      form.append("file", new Blob([buffer], { type: "audio/webm" }), "audio.webm");
      form.append("model", "whisper-1");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      });
      if (!res.ok) throw new Error(`Whisper HTTP ${res.status}`);
      const data = await res.json();
      transcript = (data?.text || "").trim() || null;
    } catch (e) {
      console.error("Whisper transcription failed:", e);
    }

    // Apply transcript to message
    await ctx.runMutation(api.chat._applyTranscript, { messageId, transcript });

    // Continue to AI reply
    await ctx.runAction(api.chat_actions.aiReply, { conversationId });
    return { ok: true };
  },
});

/** Helper: generate deterministic cache key for TTS */
async function sha256hex(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Ensure TTS audio exists in S3 with deterministic caching */
export const ensureTtsAudio = action({
  args: { voiceId: v.string(), text: v.string() },
  handler: async (_ctx, { voiceId, text }) => {
    const hash = await sha256hex(`${voiceId}\n${text}`);
    const key = `tts/${voiceId}/${hash}.mp3`;

    // Check cache (S3 HEAD)
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return { key }; // Cache hit
    } catch (_) {
      // Cache miss - generate with ElevenLabs
    }

    // Call ElevenLabs TTS
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "accept": TTS_AUDIO_MIME,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    });
    if (!ttsRes.ok) throw new Error(`TTS HTTP ${ttsRes.status}`);

    // Upload to S3
    const arrayBuf = await ttsRes.arrayBuffer();
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, ContentType: TTS_AUDIO_MIME, Body: Buffer.from(arrayBuf),
    }));

    return { key };
  },
});

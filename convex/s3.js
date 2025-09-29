"use node";

// convex/s3.js
import { action } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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
    console.log('admin')
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

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5MB

function validateKindAndType(kind, contentType) {
  if (kind === "image" && !IMAGE_TYPES.has(contentType)) throw new Error("Unsupported image type");
  if (kind === "video" && !VIDEO_TYPES.has(contentType)) throw new Error("Unsupported video type");
}

export const signChatUpload = action({
  args: {
    conversationId: v.id("conversations"),
    kind: v.union(v.literal("image"), v.literal("video")),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { conversationId, kind, contentType, size }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");

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
    kind: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (_ctx, { objectKey, kind }) => {
    // HEAD to confirm it exists & validate size/content-type
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    const size = head.ContentLength ?? 0;
    const contentType = head.ContentType ?? "";

    validateKindAndType(kind, contentType);
    if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("Image too large");
    if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("Video too large");

    return { ok: true, size, contentType };
  },
});

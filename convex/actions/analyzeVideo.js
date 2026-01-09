"use node";

// convex/actions/analyzeVideo.js
// Video content analysis via frame sampling + AWS Rekognition
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import { DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { rekognition, BUCKET } from "../rekognitionClient";
import { S3Client } from "@aws-sdk/client-s3";
import { pipeline } from "node:stream/promises";
import { createWriteStream, promises as fs, constants as FS } from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import ffmpegPath from "ffmpeg-static";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Ensures FFmpeg binary exists and is executable.
 * @returns {Promise<string>} Path to FFmpeg binary
 */
async function ensureFfmpeg() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not resolve a binary path");
  }
  await fs.access(ffmpegPath, FS.X_OK).catch(() => {
    throw new Error(`FFmpeg not found or not executable at: ${ffmpegPath}`);
  });
  return ffmpegPath;
}

/**
 * Extracts a single JPEG frame from a video file at a specific timestamp.
 * @param {string} inputPath - Path to video file
 * @param {number} atMs - Timestamp in milliseconds
 * @returns {Promise<Buffer>} JPEG frame as buffer
 */
async function extractJpegFrame(inputPath, atMs) {
  const args = [
    "-ss",
    (atMs / 1000).toString(), // seek to timestamp (in seconds)
    "-i",
    inputPath,
    "-frames:v",
    "1", // extract single frame
    "-f",
    "image2pipe",
    "-vcodec",
    "mjpeg",
    "pipe:1", // output to stdout
  ];

  const ff = spawn(await ensureFfmpeg(), args, { stdio: ["ignore", "pipe", "pipe"] });

  const chunks = [];
  const errors = [];

  ff.stdout.on("data", (chunk) => chunks.push(chunk));
  ff.stderr.on("data", (chunk) => errors.push(chunk));

  await new Promise((resolve, reject) => {
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg error: ${Buffer.concat(errors).toString()}`));
    });
  });

  return Buffer.concat(chunks);
}

/**
 * Analyzes a video from S3 by:
 * 1. Downloading video to /tmp
 * 2. Extracting single JPEG frame from middle of video (1.5s)
 * 3. Running DetectModerationLabels for explicit content detection
 *
 * This approach is much faster and cheaper than multi-frame or Rekognition Video API,
 * and provides sufficient moderation context for chat UX.
 */
export const analyzeVideoContent = action({
  args: {
    messageId: v.id("messages"),
    objectKey: v.string(),
    timestampsMs: v.optional(v.array(v.number())), // Default: [1500] (middle frame)
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, { messageId, objectKey, timestampsMs = [1500], conversationId }) => {
    let localPath = null;

    try {
      // Step 1: Download video to /tmp for FFmpeg processing
      const fileName = objectKey.split("/").pop() || "video";
      localPath = `/tmp/${randomUUID()}-${fileName}`;

      const s3Response = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: objectKey })
      );
      await pipeline(s3Response.Body, createWriteStream(localPath));

      // Step 2: Extract JPEG frames at specified timestamps
      const frameBuffers = [];
      for (const timestamp of timestampsMs) {
        try {
          const frameBuffer = await extractJpegFrame(localPath, timestamp);
          if (frameBuffer && frameBuffer.length > 0) {
            frameBuffers.push(frameBuffer);
          }
        } catch (err) {
          console.warn(`⚠️  Failed to extract frame at ${timestamp}ms:`, err.message);
          // Continue with other frames
        }
      }

      if (frameBuffers.length === 0) {
        throw new Error("Failed to extract any frames from video");
      }

      // Step 3: Run DetectModerationLabels on the single frame
      const frameBuffer = frameBuffers[0]; // We only extract one frame now

      const moderationResult = await rekognition.send(
        new DetectModerationLabelsCommand({
          Image: { Bytes: frameBuffer },
          MinConfidence: 75,
        })
      );

      // Process moderation labels
      const moderationLabels = (moderationResult.ModerationLabels || [])
        .map((label) => ({
          name: label.Name || "",
          confidence: label.Confidence || 0,
          parentName: label.ParentName,
        }))
        .filter((l) => l.name)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);

      // Step 4: Store insights (no scene labels for videos)
      await ctx.runMutation(internal.mediaInsights._insertMediaInsights, {
        messageId,
        kind: "video",
        moderationLabels,
        framesAnalyzed: 1,
        analysisMethod: "single-frame-moderation",
      });

      // Denormalize summary onto message for fast context building (avoids N+1)
      const mods = moderationLabels
        .filter(l => l.confidence > 80)
        .slice(0, 3)
        .map(l => l.name.toLowerCase());
      if (mods.length > 0) {
        const mediaSummary = `mod: ${mods.join(", ")}`;
        await ctx.runMutation(internal.chat._applyMediaSummary, {
          messageId,
          mediaSummary,
        });
      }

      // console.log(`✅ Video analysis complete for message ${messageId}:`, {
      //   framesAnalyzed: 1,
      //   moderationLabels: moderationLabels.slice(0, 3),
      // });

      return { success: true };
    } catch (error) {
      console.error(`❌ Video analysis failed for message ${messageId}:`, error);

      // Store empty insights to prevent retry loops
      await ctx.runMutation(internal.mediaInsights._insertMediaInsights, {
        messageId,
        kind: "video",
        moderationLabels: [],
        framesAnalyzed: 0,
        analysisMethod: "single-frame-moderation-failed",
      });

      return { success: false, error: error.message };
    } finally {
      // Cleanup: remove temporary video file
      if (localPath) {
        await fs.unlink(localPath).catch(() => {});
      }
      if (conversationId) {
        const d = Math.floor(3500 + Math.random() * 3500); // 3.5-7s
        await ctx.scheduler.runAfter(d, api.chat_actions.aiReply, {
          conversationId,
          userMessageId: messageId,
        });
      }
    }
  },
});

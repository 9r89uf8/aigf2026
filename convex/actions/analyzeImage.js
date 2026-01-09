"use node";

// convex/actions/analyzeImage.js
// Image content analysis using AWS Rekognition (DetectLabels + DetectModerationLabels)
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import { DetectLabelsCommand, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { rekognition, BUCKET } from "../rekognitionClient";

/**
 * Analyzes an image from S3 using both Rekognition APIs:
 * 1. DetectModerationLabels - for explicit content classification
 * 2. DetectLabels - for scene/object context
 *
 * Results are stored in mediaInsights table for AI context building.
 */
export const analyzeImageContent = action({
  args: {
    messageId: v.id("messages"),
    objectKey: v.string(),  // S3 key (must be JPEG/PNG)
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, { messageId, objectKey, conversationId }) => {
    try {
      const s3Object = { Bucket: BUCKET, Name: objectKey };

      // Run both Rekognition APIs in parallel for optimal performance
      const [moderationResult, labelsResult] = await Promise.all([
        // Explicit content detection (primary for adult content platform)
        rekognition.send(
          new DetectModerationLabelsCommand({
            Image: { S3Object: s3Object },
            MinConfidence: 75,  // Confidence threshold
          })
        ),

        // General scene/object detection (contextual understanding)
        rekognition.send(
          new DetectLabelsCommand({
            Image: { S3Object: s3Object },
            MinConfidence: 75,
            MaxLabels: 10,
          })
        ),
      ]);

      // Process moderation labels (hierarchical explicit content taxonomy)
      const moderationLabels = (moderationResult.ModerationLabels || [])
        .map((label) => ({
          name: label.Name || "",
          confidence: label.Confidence || 0,
          parentName: label.ParentName,  // e.g., "Nudity" is parent of "Graphic Female Nudity"
        }))
        .filter((l) => l.name)
        .sort((a, b) => b.confidence - a.confidence);

      // Process scene labels (objects, scenes, concepts)
      const sceneLabels = (labelsResult.Labels || [])
        .map((label) => ({
          name: label.Name || "",
          confidence: label.Confidence || 0,
        }))
        .filter((l) => l.name)
        .sort((a, b) => b.confidence - a.confidence);

      // Store insights for AI consumption
      await ctx.runMutation(internal.mediaInsights._insertMediaInsights, {
        messageId,
        kind: "image",
        moderationLabels,
        sceneLabels,
        analysisMethod: "rekognition-image",
      });

      // Denormalize summary onto message for fast context building (avoids N+1)
      const mods = moderationLabels
        .filter(l => l.confidence > 80)
        .slice(0, 3)
        .map(l => l.name.toLowerCase());
      const scenes = sceneLabels
        .filter(l => l.confidence > 80)
        .slice(0, 3)
        .map(l => l.name.toLowerCase());
      const parts = [];
      if (scenes.length) parts.push(`escena: ${scenes.join(", ")}`);
      if (mods.length) parts.push(`mod: ${mods.join(", ")}`);
      const mediaSummary = parts.join(" | ");

      if (mediaSummary) {
        await ctx.runMutation(internal.chat._applyMediaSummary, {
          messageId,
          mediaSummary,
        });
      }

      // console.log(`✅ Image analysis complete for message ${messageId}:`, {
      //   moderationLabels: moderationLabels.slice(0, 3),
      //   sceneLabels: sceneLabels.slice(0, 3),
      // });

      return { success: true };
    } catch (error) {
      console.error(`❌ Image analysis failed for message ${messageId}:`, error);

      // Store empty insights to prevent retry loops
      await ctx.runMutation(internal.mediaInsights._insertMediaInsights, {
        messageId,
        kind: "image",
        moderationLabels: [],
        sceneLabels: [],
        analysisMethod: "rekognition-image-failed",
      });

      return { success: false, error: error.message };
    } finally {
      if (conversationId) {
        const d = Math.floor(2500 + Math.random() * 3500); // 2.5-6s
        await ctx.scheduler.runAfter(d, api.chat_actions.aiReply, {
          conversationId,
          userMessageId: messageId,
        });
      }
    }
  },
});

// convex/rekognitionClient.js
// Shared AWS Rekognition client for media analysis
import { RekognitionClient } from "@aws-sdk/client-rekognition";

export const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const BUCKET = process.env.AWS_S3_BUCKET;
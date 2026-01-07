"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function MediaUploader({ girlId, surface, onUploaded }) {
  // surface: "gallery" | "posts" | "assets"
  const signMedia = useAction(api.s3.signGirlMediaUpload);
  const finalize = useMutation(api.girls.finalizeGirlMedia);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const supportsGrouping = surface === "gallery" || surface === "posts";
  const [groupImages, setGroupImages] = useState(false);

  async function onFiles(files) {
    if (!files.length) return;

    setBusy(true);
    setProgress({ current: 0, total: files.length });
    let uploadedCount = 0;

    try {
      const updateProgress = (fileName) => {
        uploadedCount += 1;
        setProgress({ current: uploadedCount, total: files.length, fileName });
      };

      const uploadSingleFile = async (file) => {
        updateProgress(file.name);

        // Validate file type
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
          console.error(`Skipping ${file.name}: unsupported file type`);
          return;
        }

        // Get presigned upload URL
        const { uploadUrl, objectKey } = await signMedia({
          girlId,
          contentType: file.type,
          size: file.size,
        });

        // Upload directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        // Finalize in database with surface-specific defaults
        const base = {
          girlId,
          objectKey,
          kind: file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "image",
          isGallery: surface === "gallery",
          isPost: surface === "posts",
          isReplyAsset: surface === "assets",
        };

        const surfaceDefaults = getSurfaceDefaults(surface);

        // Auto-mark audio assets as mature (typically used for moaning sounds)
        if (surface === "assets" && file.type.startsWith("audio/")) {
          surfaceDefaults.mature = true;
        }

        await finalize({ ...base, ...surfaceDefaults });
      };

      const uploadGroupedImages = async (imageFiles) => {
        const objectKeys = [];
        const failures = [];

        for (const file of imageFiles) {
          try {
            updateProgress(file.name);
            const { uploadUrl, objectKey } = await signMedia({
              girlId,
              contentType: file.type,
              size: file.size,
            });

            const uploadResponse = await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed for ${file.name}`);
            }

            objectKeys.push(objectKey);
          } catch (error) {
            failures.push(file.name);
            console.error(`Failed to upload ${file.name}:`, error);
          }
        }

        if (!objectKeys.length) {
          if (failures.length) {
            alert(`Failed to upload ${failures.join(", ")}`);
          }
          return;
        }

        const base = {
          girlId,
          objectKey: objectKeys[0],
          objectKeys,
          kind: "image",
          isGallery: surface === "gallery",
          isPost: surface === "posts",
          isReplyAsset: surface === "assets",
        };

        const surfaceDefaults = getSurfaceDefaults(surface);
        await finalize({ ...base, ...surfaceDefaults });

        if (failures.length) {
          alert(`Some images failed: ${failures.join(", ")}`);
        }
      };

      if (supportsGrouping && groupImages) {
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

        if (imageFiles.length > 1) {
          await uploadGroupedImages(imageFiles);
        } else {
          for (const file of imageFiles) {
            try {
              await uploadSingleFile(file);
            } catch (error) {
              console.error(`Failed to upload ${file.name}:`, error);
              alert(`Failed to upload ${file.name}: ${error.message}`);
            }
          }
        }

        for (const file of otherFiles) {
          try {
            await uploadSingleFile(file);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            alert(`Failed to upload ${file.name}: ${error.message}`);
          }
        }
      } else {
        for (const file of files) {
          try {
            await uploadSingleFile(file);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            alert(`Failed to upload ${file.name}: ${error.message}`);
          }
        }
      }

      // Notify parent component to refresh the list
      if (onUploaded) {
        onUploaded();
      }

    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function getSurfaceDefaults(surface) {
    switch (surface) {
      case "gallery":
        return {
          text: undefined, // Optional caption
          location: undefined,
          premiumOnly: false,
          canBeLiked: true,
          mature: false,
        };
      case "posts":
        return {
          text: undefined, // Optional post text
          location: undefined, // Optional location
          premiumOnly: false, // Ignored for posts
          canBeLiked: true,
          mature: false,
        };
      case "assets":
        return {
          text: "Describe this asset...", // Required description
          location: undefined,
          premiumOnly: false, // Ignored for assets
          canBeLiked: false, // Assets cannot be liked
          mature: false, // Must be set explicitly
        };
      default:
        throw new Error(`Unknown surface: ${surface}`);
    }
  }

  const acceptedTypes = "image/*,video/*,audio/*";
  const maxSizeText = "Max 200MB for media, 20MB for audio";

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {busy ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Uploading {progress?.current} of {progress?.total}...
            </p>
            {progress?.fileName && (
              <p className="text-xs text-gray-500 truncate">
                {progress.fileName}
              </p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress?.current / progress?.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload {surface === "gallery" ? "Gallery" : surface === "posts" ? "Post" : "Asset"} Media
              </label>
              <p className="text-xs text-gray-500">
                {surface === "assets"
                  ? "Images and videos for AI replies. Descriptions will be editable after upload."
                  : surface === "gallery"
                  ? "Gallery images and videos. Premium and like settings editable after upload."
                  : "Post images and videos. Location and like settings editable after upload."
                }
              </p>
            </div>

            <input
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={(e) => onFiles(Array.from(e.target.files))}
              disabled={busy}
              className="hidden"
              id={`media-upload-${surface}`}
            />
            <label
              htmlFor={`media-upload-${surface}`}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              Choose Files
            </label>
            {supportsGrouping && (
              <div className="mt-3 flex flex-col items-center gap-1 text-xs text-gray-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupImages}
                    onChange={(e) => setGroupImages(e.target.checked)}
                    className="rounded"
                  />
                  Subir varias imagenes como un solo {surface === "gallery" ? "item" : "post"}
                </label>
                <span className="text-[11px] text-gray-500">
                  Solo imagenes; videos y audio se suben por separado.
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {maxSizeText} • Images, videos, and audio supported
            </p>
          </>
        )}
      </div>
    </div>
  );
}

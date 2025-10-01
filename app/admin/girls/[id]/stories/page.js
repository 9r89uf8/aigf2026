"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StoriesManagerPage() {
  const { id } = useParams();
  const girl = useQuery(api.girls.getGirl, { girlId: id });
  const stories = useQuery(api.girls.listGirlStories, { girlId: id });
  const signGirlMedia = useAction(api.s3.signGirlMediaUpload);
  const createStory = useMutation(api.girls.createStory);
  const updateStory = useMutation(api.girls.updateStory);
  const deleteStory = useMutation(api.girls.deleteStory);
  const cfSignView = useAction(api.cdn.cfSignView);

  const [signedUrls, setSignedUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [creatingText, setCreatingText] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [editingStory, setEditingStory] = useState(null);

  // Fetch signed URLs for stories
  useEffect(() => {
    async function fetchUrls() {
      if (!stories?.length) return;

      const urlPromises = stories
        .filter((s) => s.objectKey)
        .map(async (story) => {
          try {
            const { url } = await cfSignView({ key: story.objectKey });
            return { id: story._id, url };
          } catch (error) {
            console.error(`Failed to get URL for story ${story._id}:`, error);
            return { id: story._id, url: null };
          }
        });

      const results = await Promise.all(urlPromises);
      const urlMap = results.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {});

      setSignedUrls(urlMap);
    }

    fetchUrls();
  }, [stories, cfSignView]);

  async function handleMediaUpload(files) {
    if (!files.length) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length, fileName: file.name });

        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          console.error(`Skipping ${file.name}: unsupported file type`);
          continue;
        }

        try {
          // Get presigned upload URL
          const { uploadUrl, objectKey } = await signGirlMedia({
            girlId: id,
            contentType: file.type,
            size: file.size,
          });

          // Upload to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          // Create story record
          await createStory({
            girlId: id,
            kind: file.type.startsWith("video/") ? "video" : "image",
            objectKey,
            text: undefined,
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleCreateTextStory() {
    if (!textContent.trim()) {
      alert("Please enter some text for the story");
      return;
    }

    try {
      await createStory({
        girlId: id,
        kind: "text",
        text: textContent.trim(),
      });
      setTextContent("");
      setCreatingText(false);
    } catch (error) {
      alert(`Failed to create text story: ${error.message}`);
    }
  }

  async function handleUpdateStory(storyId, updates) {
    try {
      await updateStory({ storyId, ...updates });
      setEditingStory(null);
    } catch (error) {
      alert(`Failed to update story: ${error.message}`);
    }
  }

  async function handleDeleteStory(storyId) {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      await deleteStory({ storyId });
    } catch (error) {
      alert(`Failed to delete story: ${error.message}`);
    }
  }

  if (!girl) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{girl.name} - Stories</h1>
          <p className="text-gray-600">
            Manage Instagram-style stories. Stories appear in chronological order on the profile.
          </p>
        </div>
        <Link
          href={`/admin/girls/${id}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          ← Back to Girl
        </Link>
      </div>

      {/* Create Stories */}
      <div className="bg-white p-6 border rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Create New Story</h2>

        {/* Media Upload */}
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

            {uploading ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Uploading {uploadProgress?.current} of {uploadProgress?.total}...
                </p>
                {uploadProgress?.fileName && (
                  <p className="text-xs text-gray-500 truncate">{uploadProgress.fileName}</p>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress?.current / uploadProgress?.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleMediaUpload(Array.from(e.target.files))}
                  disabled={uploading}
                  className="hidden"
                  id="story-media-upload"
                />
                <label
                  htmlFor="story-media-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upload Image/Video Story
                </label>
                <p className="text-xs text-gray-500 mt-2">Max 200MB per file</p>
              </>
            )}
          </div>
        </div>

        {/* Text Story Creator */}
        <div className="border border-gray-300 rounded-lg p-4">
          {!creatingText ? (
            <button
              onClick={() => setCreatingText(true)}
              className="w-full py-3 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              + Create Text Story
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your story text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTextStory}
                  disabled={!textContent.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Create Text Story
                </button>
                <button
                  onClick={() => {
                    setCreatingText(false);
                    setTextContent("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stories List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Stories ({stories?.length || 0})</h2>
        </div>

        {!stories ? (
          <div className="p-6">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No stories created yet. Create your first story above!
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stories.map((story) => (
                <div key={story._id} className="relative group">
                  {/* Story Preview */}
                  <div className="aspect-[9/16] rounded-lg overflow-hidden border-2 border-gray-200">
                    {story.kind === "text" ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-3">
                        <p className="text-white text-xs font-medium text-center line-clamp-6">
                          {story.text}
                        </p>
                      </div>
                    ) : signedUrls[story._id] ? (
                      story.kind === "video" ? (
                        <video
                          src={signedUrls[story._id]}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={signedUrls[story._id]}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse" />
                    )}
                  </div>

                  {/* Controls */}
                  <div className="mt-2 space-y-2">
                    {/* Published Toggle */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={story.published}
                        onChange={(e) =>
                          handleUpdateStory(story._id, { published: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span className="text-gray-700">Published</span>
                    </label>

                    {/* Edit Text (if has text or is text story) */}
                    {(story.text || story.kind === "text") && (
                      <button
                        onClick={() => setEditingStory(story._id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit Text
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteStory(story._id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Edit Text Modal */}
                  {editingStory === story._id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Edit Story Text</h3>
                        <textarea
                          defaultValue={story.text || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={4}
                          id={`edit-text-${story._id}`}
                        />
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              const newText = document.getElementById(
                                `edit-text-${story._id}`
                              ).value;
                              handleUpdateStory(story._id, { text: newText });
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStory(null)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

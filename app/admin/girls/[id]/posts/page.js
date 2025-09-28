"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MediaUploader from "@/components/admin/MediaUploader";
import Link from "next/link";

export default function PostsManagerPage() {
  const { id } = useParams();
  const girl = useQuery(api.girls.getGirl, { girlId: id });
  const media = useQuery(api.girls.listGirlMedia, { girlId: id, surface: "posts" });
  const updateMedia = useMutation(api.girls.updateGirlMedia);
  const cfSignView = useAction(api.cdn.cfSignView);

  const [mediaUrls, setMediaUrls] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch CloudFront signed URLs for media thumbnails
  useEffect(() => {
    const fetchUrls = async () => {
      if (!media?.length) return;

      const urlPromises = media.map(async (item) => {
        try {
          const { url } = await cfSignView({ key: item.objectKey });
          return { id: item._id, url };
        } catch (error) {
          console.error(`Failed to get URL for ${item._id}:`, error);
          return { id: item._id, url: null };
        }
      });

      const results = await Promise.all(urlPromises);
      const urlMap = results.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {});

      setMediaUrls(urlMap);
    };

    fetchUrls();
  }, [media, cfSignView]);

  function handleRefresh() {
    setRefreshKey(prev => prev + 1);
  }

  async function handleUpdateItem(itemId, updates) {
    try {
      await updateMedia({ mediaId: itemId, ...updates });
      setEditingItem(null);
      handleRefresh();
    } catch (error) {
      alert(error?.message ?? "Failed to update item");
    }
  }

  function randomizeLikes(item) {
    const newLikeCount = Math.floor(Math.random() * 376) + 25; // 25-400
    handleUpdateItem(item._id, { likeCount: newLikeCount });
  }

  if (!girl) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{girl.name} - Posts</h1>
          <p className="text-gray-600">
            Manage post images and videos. Posts can include location information.
          </p>
        </div>
        <Link
          href={`/admin/girls/${id}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          ← Back to Girl
        </Link>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Upload New Posts</h2>
        <MediaUploader
          girlId={id}
          surface="posts"
          onUploaded={handleRefresh}
          key={refreshKey}
        />
      </div>

      {/* Posts Grid */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Posts ({media?.length || 0})
          </h2>
        </div>

        {!media ? (
          <div className="p-6">Loading posts...</div>
        ) : media.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No posts uploaded yet. Use the uploader above to add some!
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {media.map((item) => (
                <div key={item._id} className="border rounded-lg overflow-hidden">
                  {/* Media Preview */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {mediaUrls[item._id] ? (
                      item.kind === "video" ? (
                        <video
                          src={mediaUrls[item._id]}
                          className="w-full h-full object-cover"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={mediaUrls[item._id]}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="text-gray-400 text-sm">Loading...</div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="p-4 space-y-3">
                    {/* Post Text */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Post Text
                      </label>
                      {editingItem === `${item._id}-text` ? (
                        <div className="flex gap-2">
                          <textarea
                            defaultValue={item.text || ""}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                            rows={2}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleUpdateItem(item._id, { text: e.target.value });
                              } else if (e.key === "Escape") {
                                setEditingItem(null);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[2rem]"
                          onClick={() => setEditingItem(`${item._id}-text`)}
                        >
                          {item.text || "Click to add post text..."}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      {editingItem === `${item._id}-location` ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={item.location || ""}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Add location..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateItem(item._id, { location: e.target.value });
                              } else if (e.key === "Escape") {
                                setEditingItem(null);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => setEditingItem(`${item._id}-location`)}
                        >
                          {item.location || "Click to add location..."}
                        </div>
                      )}
                    </div>

                    {/* Can Be Liked Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.canBeLiked}
                          onChange={(e) =>
                            handleUpdateItem(item._id, { canBeLiked: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Can Be Liked</span>
                      </label>
                    </div>

                    {/* Like Count */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.likeCount}
                        onChange={(e) =>
                          handleUpdateItem(item._id, { likeCount: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                      />
                      <span className="text-sm text-gray-600">likes</span>
                      <button
                        onClick={() => randomizeLikes(item)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        title="Randomize like count"
                      >
                        🎲
                      </button>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        {item.kind} • {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.published}
                          onChange={(e) =>
                            handleUpdateItem(item._id, { published: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-xs text-gray-700">Published</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
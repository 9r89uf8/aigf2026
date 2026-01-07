"use client";
//app/admin/girls/[id]/gallery/page.js
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MediaUploader from "@/components/admin/MediaUploader";
import Link from "next/link";

export default function GalleryManagerPage() {
  const { id } = useParams();
  const girl = useQuery(api.girls.getGirl, { girlId: id });
  const media = useQuery(api.girls.listGirlGallery, { girlId: id });
  const updateMedia = useMutation(api.girls.updateGirlMedia);
  const deleteMedia = useMutation(api.girls.deleteGirlMedia);
  const signViewBatch = useAction(api.cdn.signViewBatch);

  const [signedUrls, setSignedUrls] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch CloudFront signed URLs for media thumbnails
  useEffect(() => {
    const fetchUrls = async () => {
      if (!media?.length) return;

      const keys = new Set();
      media.forEach((item) => {
        if (item.objectKeys?.length) {
          item.objectKeys.forEach((key) => keys.add(key));
        } else if (item.objectKey) {
          keys.add(item.objectKey);
        }
      });

      if (!keys.size) return;

      try {
        const { urls } = await signViewBatch({ keys: Array.from(keys) });
        setSignedUrls(urls || {});
      } catch (error) {
        console.error("Failed to get media URLs:", error);
      }
    };

    fetchUrls();
  }, [media, signViewBatch]);

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

  async function handleDeleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      await deleteMedia({ mediaId: itemId });
      handleRefresh();
    } catch (error) {
      alert(error?.message ?? "Failed to delete item");
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
          <h1 className="text-2xl font-semibold">{girl.name} - Gallery</h1>
          <p className="text-gray-600">
            Manage gallery images and videos. Items can be marked as premium-only.
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
        <h2 className="text-lg font-semibold mb-4">Upload New Gallery Items</h2>
        <MediaUploader
          girlId={id}
          surface="gallery"
          onUploaded={handleRefresh}
          key={refreshKey}
        />
      </div>

      {/* Gallery Grid */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Gallery Items ({media?.length || 0})
          </h2>
        </div>

        {!media ? (
          <div className="p-6">Loading gallery items...</div>
        ) : media.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No gallery items uploaded yet. Use the uploader above to add some!
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {media.map((item) => (
                <div key={item._id} className="border rounded-lg overflow-hidden">
                  {/* Media Preview */}
                  <div className="bg-gray-100 flex items-center justify-center overflow-hidden">
                    {(() => {
                      const keys = item.objectKeys?.length
                        ? item.objectKeys
                        : item.objectKey
                          ? [item.objectKey]
                          : [];
                      const previewUrl = keys.length ? signedUrls[keys[0]] : null;
                      const showCount = item.kind === "image" && keys.length > 1;

                      return previewUrl ? (
                      item.kind === "video" ? (
                        <video
                          src={previewUrl}
                          className="w-full h-auto max-h-80 object-contain"
                          controls
                          muted
                        />
                      ) : (
                        <div className="relative w-full">
                          <img
                            src={previewUrl}
                            alt="Gallery item"
                            className="w-full h-auto max-h-80 object-contain"
                          />
                          {showCount && (
                            <span className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">
                              {keys.length}
                            </span>
                          )}
                        </div>
                      )
                      ) : (
                        <div className="text-gray-400 text-sm">Loading...</div>
                      );
                    })()}
                  </div>

                  {/* Controls */}
                  <div className="p-4 space-y-3">
                    {/* Caption */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Caption
                      </label>
                      {editingItem === `${item._id}-text` ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={item.text || ""}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
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
                          className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => setEditingItem(`${item._id}-text`)}
                        >
                          {item.text || "Click to add caption..."}
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

                    {/* Toggles */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.premiumOnly}
                          onChange={(e) =>
                            handleUpdateItem(item._id, { premiumOnly: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Premium Only</span>
                      </label>

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

                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="w-full text-xs px-3 py-2 border border-red-200 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete Gallery Item
                    </button>
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

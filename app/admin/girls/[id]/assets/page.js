"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MediaUploader from "@/components/admin/MediaUploader";
import Link from "next/link";

export default function AssetsManagerPage() {
  const { id } = useParams();
  const girl = useQuery(api.girls.getGirl, { girlId: id });
  const media = useQuery(api.girls.listGirlMedia, { girlId: id, surface: "assets" });
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

  if (!girl) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{girl.name} - AI Assets</h1>
          <p className="text-gray-600">
            Manage media assets for AI replies. Each asset requires a description for the AI to understand when to use it.
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
        <h2 className="text-lg font-semibold mb-4">Upload New AI Assets</h2>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Assets are used by the AI to respond with relevant media</li>
            <li>• Each asset MUST have a descriptive text that explains when to use it</li>
            <li>• Mark assets as "mature" if they contain adult content</li>
            <li>• Assets cannot be liked by users (they're for AI use only)</li>
          </ul>
        </div>
        <MediaUploader
          girlId={id}
          surface="assets"
          onUploaded={handleRefresh}
          key={refreshKey}
        />
      </div>

      {/* Assets Grid */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            AI Assets ({media?.length || 0})
          </h2>
        </div>

        {!media ? (
          <div className="p-6">Loading assets...</div>
        ) : media.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No AI assets uploaded yet. Use the uploader above to add some!
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
                          alt="AI Asset"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="text-gray-400 text-sm">Loading...</div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="p-4 space-y-3">
                    {/* Description (Required) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description for AI *
                      </label>
                      {editingItem === item._id ? (
                        <div className="space-y-2">
                          <textarea
                            defaultValue={item.text || ""}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                            rows={3}
                            placeholder="Describe when the AI should use this asset..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                handleUpdateItem(item._id, { text: e.target.value });
                              } else if (e.key === "Escape") {
                                setEditingItem(null);
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                const textarea = e.target.parentElement.previousElementSibling;
                                handleUpdateItem(item._id, { text: textarea.value });
                              }}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Ctrl+Enter to save, Escape to cancel
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border min-h-[3rem] ${
                            !item.text ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-600"
                          }`}
                          onClick={() => setEditingItem(item._id)}
                        >
                          {item.text || "⚠️ REQUIRED: Click to add description for AI..."}
                        </div>
                      )}
                    </div>

                    {/* Mature Content Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.mature}
                          onChange={(e) =>
                            handleUpdateItem(item._id, { mature: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Mature Content</span>
                      </label>

                      {item.mature && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          🔞 MATURE
                        </span>
                      )}
                    </div>

                    {/* Asset Info */}
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500 mb-2">
                        Asset ID: {item._id}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {item.kind} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Published Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        Status
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
                        <span className="text-xs text-gray-700">Available to AI</span>
                      </label>
                    </div>

                    {/* Validation Warning */}
                    {(!item.text || item.text.trim().length < 10) && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Assets need detailed descriptions for the AI to use them effectively.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Guidelines */}
      <div className="bg-gray-50 p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Asset Description Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Good Descriptions:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• "Smiling selfie in casual clothes for friendly conversations"</li>
              <li>• "Workout photo at gym for fitness/health topics"</li>
              <li>• "Evening dress photo for formal/date conversations"</li>
              <li>• "Beach vacation video for travel/summer discussions"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Avoid:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Generic descriptions like "photo of me"</li>
              <li>• Missing context about when to use it</li>
              <li>• Too short (less than 10 characters)</li>
              <li>• Descriptions that don't help AI decide usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
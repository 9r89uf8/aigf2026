"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

export default function EditGirlPage() {
  const { id } = useParams();
  const girl = useQuery(api.girls.getGirl, { girlId: id });
  const signAvatar = useAction(api.s3.signGirlAvatarUpload);
  const signBackground = useAction(api.s3.signGirlBackgroundUpload);
  const saveImages = useMutation(api.girls.updateGirlProfileImages);
  const cfSignView = useAction(api.cdn.cfSignView);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [uploading, setUploading] = useState({ avatar: false, background: false });

  const avatarRef = useRef(null);
  const backgroundRef = useRef(null);

  // Fetch CloudFront signed URLs when girl data loads
  useEffect(() => {
    const fetchUrls = async () => {
      if (!girl) return;

      try {
        if (girl.avatarKey) {
          const avatarResult = await cfSignView({ key: girl.avatarKey });
          setAvatarUrl(avatarResult.url);
        }
        if (girl.backgroundKey) {
          const backgroundResult = await cfSignView({ key: girl.backgroundKey });
          setBackgroundUrl(backgroundResult.url);
        }
      } catch (error) {
        console.error("Failed to get signed URLs:", error);
      }
    };

    fetchUrls();
  }, [girl?.avatarKey, girl?.backgroundKey, cfSignView]);

  async function uploadWithSigner(signer, file, type) {
    try {
      const { uploadUrl, objectKey } = await signer({
        girlId: id,
        contentType: file.type,
        size: file.size,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      return objectKey;
    } catch (error) {
      console.error(`${type} upload failed:`, error);
      throw error;
    }
  }

  async function onPickAvatar(file) {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload PNG, JPG, or WEBP");
      return;
    }

    setUploading(prev => ({ ...prev, avatar: true }));
    try {
      const key = await uploadWithSigner(signAvatar, file, "Avatar");
      await saveImages({ girlId: id, avatarKey: key });

      // Get new signed URL for preview
      const { url } = await cfSignView({ key });
      setAvatarUrl(url);
    } catch (error) {
      alert(error?.message ?? "Avatar upload failed");
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }));
    }
  }

  async function onPickBackground(file) {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload PNG, JPG, or WEBP");
      return;
    }

    setUploading(prev => ({ ...prev, background: true }));
    try {
      const key = await uploadWithSigner(signBackground, file, "Background");
      await saveImages({ girlId: id, backgroundKey: key });

      // Get new signed URL for preview
      const { url } = await cfSignView({ key });
      setBackgroundUrl(url);
    } catch (error) {
      alert(error?.message ?? "Background upload failed");
    } finally {
      setUploading(prev => ({ ...prev, background: false }));
    }
  }

  if (!girl) {
    return <div className="p-6">Loading girl...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{girl.name}</h1>
          <p className="text-gray-600 mt-1">Edit profile images and manage content</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/girls/${id}/gallery`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Gallery ({girl.counts.gallery})
          </Link>
          <Link
            href={`/admin/girls/${id}/posts`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Posts ({girl.counts.posts})
          </Link>
          <Link
            href={`/admin/girls/${id}/assets`}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Assets ({girl.counts.assets})
          </Link>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white p-6 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <p>{girl.name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <p className={girl.isActive ? "text-green-600" : "text-red-600"}>
              {girl.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-700">Bio:</span>
            <p className="text-gray-600">{girl.bio || "No bio set"}</p>
          </div>
          {girl.voiceId && (
            <div>
              <span className="font-medium text-gray-700">Voice ID:</span>
              <p className="font-mono text-xs">{girl.voiceId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Image */}
        <div className="bg-white p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Profile Image</h3>

          <div className="space-y-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>

            <div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickAvatar(file);
                }}
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                disabled={uploading.avatar}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading.avatar ? "Uploading..." : "Change Profile Image"}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, or WEBP. Max file size: 200MB
              </p>
            </div>
          </div>
        </div>

        {/* Background Image */}
        <div className="bg-white p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Background Image</h3>

          <div className="space-y-4">
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
              {backgroundUrl ? (
                <img
                  src={backgroundUrl}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No background</span>
              )}
            </div>

            <div>
              <input
                ref={backgroundRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickBackground(file);
                }}
              />
              <button
                type="button"
                onClick={() => backgroundRef.current?.click()}
                disabled={uploading.background}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading.background ? "Uploading..." : "Change Background"}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, or WEBP. Max file size: 200MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Content Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {girl.counts.gallery}
            </div>
            <div className="text-sm text-gray-600">Gallery Items</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {girl.counts.posts}
            </div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {girl.counts.assets}
            </div>
            <div className="text-sm text-gray-600">AI Assets</div>
          </div>
        </div>
      </div>
    </div>
  );
}
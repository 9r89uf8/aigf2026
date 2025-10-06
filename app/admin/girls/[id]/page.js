"use client";
// app/admin/girls/[id]/page.js
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
  const updateAdmin = useMutation(api.girls.updateGirlAdmin); // NEW
  const cfSignView = useAction(api.cdn.cfSignView);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [uploading, setUploading] = useState({ avatar: false, background: false });

  const avatarRef = useRef(null);
  const backgroundRef = useRef(null);

  // Form state for basics
  const [form, setForm] = useState({
    name: "",
    username: "",
    age: "",
    displayBio: "",
    bio: "",
    voiceId: "",
    personaPrompt: "",
    premiumOnly: false,
    priority: 0,
    isActive: true,
  });
  const [savingBasics, setSavingBasics] = useState(false);

  useEffect(() => {
    if (!girl) return;
    setForm({
      name: girl.name ?? "",
      username: girl.username ?? "",
      age: girl.age ?? "",
      displayBio: girl.displayBio ?? "",
      bio: girl.bio ?? "",
      voiceId: girl.voiceId ?? "",
      personaPrompt: girl.personaPrompt ?? "",
      premiumOnly: girl.premiumOnly ?? false,
      priority: girl.priority ?? 0,
      isActive: girl.isActive ?? true,
    });
  }, [girl]);

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
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
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
    setUploading((p) => ({ ...p, avatar: true }));
    try {
      const key = await uploadWithSigner(signAvatar, file, "Avatar");
      await saveImages({ girlId: id, avatarKey: key });
      const { url } = await cfSignView({ key });
      setAvatarUrl(url);
    } catch (error) {
      alert(error?.message ?? "Avatar upload failed");
    } finally {
      setUploading((p) => ({ ...p, avatar: false }));
    }
  }

  async function onPickBackground(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload PNG, JPG, or WEBP");
      return;
    }
    setUploading((p) => ({ ...p, background: true }));
    try {
      const key = await uploadWithSigner(signBackground, file, "Background");
      await saveImages({ girlId: id, backgroundKey: key });
      const { url } = await cfSignView({ key });
      setBackgroundUrl(url);
    } catch (error) {
      alert(error?.message ?? "Background upload failed");
    } finally {
      setUploading((p) => ({ ...p, background: false }));
    }
  }

  async function saveBasics() {
    setSavingBasics(true);
    try {
      await updateAdmin({
        girlId: id,
        name: form.name.trim(),
        username: form.username.trim() || undefined,
        age: form.age !== "" ? Number(form.age) : undefined,
        displayBio: form.displayBio.trim(),
        bio: form.bio.trim(),
        voiceId: form.voiceId.trim() || undefined,
        personaPrompt: form.personaPrompt.trim() || undefined,
        premiumOnly: !!form.premiumOnly,
        priority: Number(form.priority) || 0,
        isActive: !!form.isActive,
      });
      alert("Saved");
    } catch (e) {
      alert(e?.message ?? "Failed to save");
    } finally {
      setSavingBasics(false);
    }
  }

  if (!girl) return <div className="p-6">Loading girl...</div>;

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">{girl.name}</h1>
            <p className="text-gray-600 mt-1">Edit profile, details, and media</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/girls/${id}/gallery`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Gallery ({girl.counts.gallery})
            </Link>
            <Link href={`/admin/girls/${id}/posts`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Posts ({girl.counts.posts})
            </Link>
            <Link href={`/admin/girls/${id}/assets`} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Assets ({girl.counts.assets})
            </Link>
          </div>
        </div>

        {/* Edit Basics */}
        <div className="bg-white p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Edit Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  maxLength={32}
                  placeholder="e.g., aurora_01"
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscores</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Bio (public)</label>
            <textarea
                className="w-full px-3 py-2 border rounded-md"
                value={form.displayBio}
                onChange={(e) => setForm((f) => ({ ...f, displayBio: e.target.value }))}
                rows={4}
                maxLength={500}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (admin-only)</label>
            <textarea
                className="w-full px-3 py-2 border rounded-md"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice ID (ElevenLabs)</label>
              <input
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.voiceId}
                  onChange={(e) => setForm((f) => ({ ...f, voiceId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona Prompt</label>
              <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  value={form.personaPrompt}
                  onChange={(e) => setForm((f) => ({ ...f, personaPrompt: e.target.value }))}
                  rows={5}
                  maxLength={1000}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                  type="checkbox"
                  checked={form.premiumOnly}
                  onChange={(e) => setForm((f) => ({ ...f, premiumOnly: e.target.checked }))}
                  className="rounded"
              />
              <span className="text-sm text-gray-700">Premium Only</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="pt-4">
            <button
                type="button"
                onClick={saveBasics}
                disabled={savingBasics}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {savingBasics ? "Saving..." : "Save Changes"}
            </button>
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
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
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
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading.avatar ? "Uploading..." : "Change Profile Image"}
                </button>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, or WEBP. Max 200MB</p>
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="bg-white p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Background Image</h3>
            <div className="space-y-4">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
                {backgroundUrl ? (
                    <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
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
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading.background ? "Uploading..." : "Change Background"}
                </button>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, or WEBP. Max 200MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Content Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{girl.counts.gallery}</div>
              <div className="text-sm text-gray-600">Gallery Items</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{girl.counts.posts}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{girl.counts.assets}</div>
              <div className="text-sm text-gray-600">AI Assets</div>
            </div>
          </div>
        </div>
      </div>
  );
}

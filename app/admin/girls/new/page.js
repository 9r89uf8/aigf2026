"use client";
// app/admin/girls/new/page.js
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGirlPage() {
  const router = useRouter();
  const createGirl = useMutation(api.girls.createGirl);

  const [name, setName] = useState("");
  const [displayBio, setDisplayBio] = useState("");
  const [bio, setBio] = useState(""); // internal notes
  const [voiceId, setVoiceId] = useState("");
  const [personaPrompt, setPersonaPrompt] = useState("");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [age, setAge] = useState("");
  const [priority, setPriority] = useState(0);
  const [username, setUsername] = useState("");

  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");

    setSaving(true);
    try {
      const id = await createGirl({
        name: name.trim(),
        displayBio: displayBio.trim() || undefined,
        bio: bio.trim() || undefined, // internal only
        voiceId: voiceId.trim() || undefined,
        personaPrompt: personaPrompt.trim() || undefined,
        premiumOnly,
        age: age ? Number(age) : undefined,
        priority: Number(priority) || 0,
        username: username.trim() || undefined,
      });
      router.push(`/admin/girls/${id}`);
    } catch (error) {
      alert(error?.message ?? "Failed to create girl");
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create New Girl</h1>
          <p className="text-gray-600 mt-1">
            Create a new AI girlfriend profile. Upload images and manage content after creation.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 border rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter girl's name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username (handle)</label>
              <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., aurora_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={32}
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscores. 3–32 chars.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 22"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Bio (public)</label>
            <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Short public bio for her profile"
                value={displayBio}
                onChange={(e) => setDisplayBio(e.target.value)}
                rows={4}
                maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{displayBio.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (admin-only)</label>
            <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes (not shown publicly)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/1000</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice ID (ElevenLabs)</label>
              <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional ElevenLabs voice ID"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Higher shows earlier (default 0)"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Persona Prompt</label>
            <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="AI personality prompt (optional)"
                value={personaPrompt}
                onChange={(e) => setPersonaPrompt(e.target.value)}
                rows={6}
                maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{personaPrompt.length}/1000</p>
          </div>

          <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={premiumOnly}
                onChange={(e) => setPremiumOnly(e.target.checked)}
                className="rounded"
            />
            <span className="text-sm text-gray-700">Premium Only (users must be premium to chat)</span>
          </label>

          <div className="flex gap-4 pt-4">
            <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? "Creating..." : "Create Girl"}
            </button>
            <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
  );
}

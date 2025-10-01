"use client";
//app/admin/girls/new/page.js
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGirlPage() {
  const router = useRouter();
  const createGirl = useMutation(api.girls.createGirl);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [personaPrompt, setPersonaPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    setSaving(true);
    try {
      const id = await createGirl({
        name: name.trim(),
        bio: bio.trim() || undefined,
        voiceId: voiceId.trim() || undefined,
        personaPrompt: personaPrompt.trim() || undefined,
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
          Create a new AI girlfriend profile. You can upload images and manage content after creation.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 border rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter girl's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter bio/description (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Voice ID (ElevenLabs)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional ElevenLabs voice ID"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persona Prompt
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="AI personality prompt (optional)"
            value={personaPrompt}
            onChange={(e) => setPersonaPrompt(e.target.value)}
            rows={6}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will guide how the AI responds as this character. {personaPrompt.length}/1000 characters
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
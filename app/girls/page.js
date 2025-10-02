"use client";
//app/girls/page.js
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import Link from "next/link";
import AvatarWithStoryRing from "@/components/AvatarWithStoryRing";

export default function GirlsListingPage() {
  const girls = useQuery(api.girls.listGirlsPublic);
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const [avatarUrls, setAvatarUrls] = useState({});

  // Batch sign all avatar URLs when girls data loads
  useEffect(() => {
    async function fetchAvatarUrls() {
      if (!girls?.length) return;

      const avatarKeys = girls
        .map((g) => g.avatarKey)
        .filter(Boolean);

      if (!avatarKeys.length) return;

      try {
        const { urls } = await signViewBatch({ keys: avatarKeys });
        setAvatarUrls(urls);
      } catch (error) {
        console.error("Failed to sign avatar URLs:", error);
      }
    }

    fetchAvatarUrls();
  }, [girls, signViewBatch]);

  // Loading state
  if (girls === undefined) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section Skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="h-6 bg-gray-200 rounded mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!girls || girls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No AI Companions Yet</h1>
          <p className="text-gray-600">Check back soon for new companions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h5 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Companions
          </h5>
        </div>

        {/* Girls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {girls.map((girl) => (
            <GirlCard
              key={girl._id}
              girl={girl}
              avatarUrl={girl.avatarKey ? avatarUrls[girl.avatarKey] : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GirlCard({ girl, avatarUrl }) {

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden group hover:scale-[1.02] duration-300">
      <div className="p-6">
        {/* Avatar with gradient ring that opens the story viewer */}
        <div className="relative mx-auto mb-4 flex justify-center">
          <AvatarWithStoryRing
            href={`/stories/${girl._id}?returnTo=/girls`}
            src={avatarUrl}
            name={girl.name}
            hasStory={girl.hasStory}
            isVideo={girl.latestStoryKind === "video"}
          />
        </div>

        {/* Name */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          {girl.name}
        </h2>

        {/* Bio */}
        {girl.bio && (
          <p className="text-sm text-white/90 text-center mb-4 line-clamp-3 min-h-[3.5rem]">
            {girl.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-4 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {girl.counts.gallery}
          </span>
          <span className="text-white/50">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {girl.counts.posts}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/chat/${girl._id}`}
            className="flex-1 px-4 py-2 bg-white text-indigo-700 font-semibold text-center rounded-lg hover:bg-gray-100 transition-all shadow-md hover:shadow-lg"
          >
            Message
          </Link>
          <Link
            href={`/girls/${girl._id}`}
            className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold text-center rounded-lg hover:bg-white/30 transition-all shadow-md hover:shadow-lg border border-white/30"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import StartChatButton from "@/components/StartChatButton";
import { formatTimeAgoEs, isStatusActive } from "@/app/lib/time";

export default function ProfileHero({ girl, backgroundUrl, avatarUrl, onAvatarClick }) {
  function handleAvatarClick() {
    if (!avatarUrl || !onAvatarClick) return;
    onAvatarClick(avatarUrl);
  }

  const statusActive = isStatusActive(girl);
  const statusTime =
    statusActive && girl?.statusCreatedAt ? formatTimeAgoEs(girl.statusCreatedAt) : "";
  const hasDetails = girl?.currentLocation || girl?.school || girl?.socialMedia;
  const tiktokDisplay = girl?.socialMedia
    ? girl.socialMedia.replace(/^https?:\/\//i, "").replace(/^www\./i, "")
    : "";

  return (
    <div className="relative w-full pt-4 px-4">
      {/* Background Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-2xl">
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt={`${girl.name} background`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="relative px-4 md:px-6 -mt-16">
        <div className="max-w-5xl mx-auto">
          {/* Avatar */}
          <div className="relative inline-block">
            {avatarUrl ? (
              onAvatarClick ? (
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  aria-label={girl.name ? `Ver avatar de ${girl.name}` : "Ver avatar"}
                >
                  <img
                    src={avatarUrl}
                    alt={girl.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                </button>
              ) : (
                <img
                  src={avatarUrl}
                  alt={girl.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              )
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {girl.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            {statusActive && (
              <div className="absolute -bottom-2 right-[-106px] z-10 max-w-[160px] rounded-2xl border border-black/80 bg-white px-3 py-2 text-black shadow-md">
                <span className="block line-clamp-2 text-[1.05rem] leading-snug">
                  {girl.statusText}
                </span>
                {statusTime && (
                  <span className="mt-0.5 block text-[0.75rem] text-gray-600">
                    {statusTime}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Name, Bio, and CTA */}
          <div className="mt-4 mb-6">
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-200 bg-blue-50/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Perfil verificado
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {girl.name}
                </h1>
              </div>
              {girl.bio && (
                <p className="mt-2 text-gray-600 text-base md:text-lg max-w-2xl">
                  {girl.bio}
                </p>
              )}
              {hasDetails && (
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                  {girl.currentLocation && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500" aria-hidden="true">
                        📍
                      </span>
                      <span className="sr-only">Vive en</span>
                      <span className="font-medium text-[1.14rem] text-gray-800">
                        {girl.currentLocation}
                      </span>
                    </div>
                  )}
                  {girl.school && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500" aria-hidden="true">
                        🎓
                      </span>
                      <span className="sr-only">Escuela</span>
                      <span className="font-medium text-[1.14rem] text-gray-800">
                        {girl.school}
                      </span>
                    </div>
                  )}
                  {girl.socialMedia && (
                    <a
                      href={girl.socialMedia}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2"
                    >
                      <span className="text-gray-500">TikTok</span>
                      <span className="font-medium text-blue-600 group-hover:text-blue-700 group-hover:underline">
                        {tiktokDisplay || "tiktok.com"}
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>


            {/* Talk Button */}
            <div className="mt-4">
              <StartChatButton girlId={girl.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

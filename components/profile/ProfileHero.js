"use client";

import StartChatButton from "@/components/StartChatButton";

export default function ProfileHero({ girl, backgroundUrl, avatarUrl }) {
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
              <img
                src={avatarUrl}
                alt={girl.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {girl.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name, Bio, and CTA */}
          <div className="mt-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {girl.name}
              </h1>
              {girl.bio && (
                <p className="mt-2 text-gray-600 text-base md:text-lg max-w-2xl">
                  {girl.bio}
                </p>
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

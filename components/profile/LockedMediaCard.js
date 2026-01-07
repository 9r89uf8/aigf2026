"use client";

import Link from "next/link";

export default function LockedMediaCard({ media }) {
  const formattedDate = media.createdAt
    ? new Date(media.createdAt).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Locked Content Overlay */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 overflow-hidden">
        {/* Lock Icon Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Lock Icon */}
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Premium CTA */}
          <Link
            href="/plans"
            className="px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-full hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Ver precios
          </Link>

          <p className="mt-3 text-white text-sm font-semibold drop-shadow-lg">
            Desbloquea contenido exclusivo
          </p>
        </div>
      </div>

      {/* Media Info */}
      <div className="p-3">
        {media.text && (
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{media.text}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{media.location || "Sin ubicacion"}</span>
          </span>
          {formattedDate && <span>{formattedDate}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">{media.likeCount}</span>
          </div>

          <span className="text-xs text-amber-600 font-semibold px-2 py-1 bg-amber-50 rounded">
            PREMIUM
          </span>
        </div>
      </div>
    </div>
  );
}

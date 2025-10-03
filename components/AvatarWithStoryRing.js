//components/AvatarWithStoryRing.js
import Link from "next/link";

export default function AvatarWithStoryRing({
  href,
  src,
  name,
  hasStory,
  isVideo,
  size = 144 // default to 144px (w-36)
}) {
  // IG-like rainbow using a conic gradient; fall back to gray when no story
  const ringClass = hasStory
    ? "bg-[conic-gradient(from_220deg_at_50%_50%,#f58529,#feda77,#dd2a7b,#8134af,#515bd4,#f58529)]"
    : "bg-gray-300";

  return (
    <Link href={href} className="block" title={name ? `Open ${name}'s stories` : "Open stories"}>
      {/* OUTER: gradient ring */}
      <div
        className={`rounded-full p-[3px] ${ringClass} transition-transform duration-200 group-hover:scale-[1.02]`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* MIDDLE: white gap ring */}
        <div className="w-full h-full rounded-full p-[3px] bg-white">
          {/* INNER: the avatar */}
          <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative flex items-center justify-center">
            {src ? (
              <img
                src={src}
                alt={name || "Avatar"}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            ) : (
              <span className="text-4xl font-bold text-gray-400 select-none">
                {name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

You’re super close—your wrapper math is just a bit off, and Instagram’s ring is a **conic gradient** (multiple colors around the circle). Here’s a drop-in that gives you the IG-style ring with a clean white gap and perfect sizing (no weird offsets), plus it only shows the rainbow when `hasStory` is true.

Replace your avatar block inside `GirlCard` with this reusable component + call:

```jsx
// Put this helper in the same file (above or below GirlCard) or in a components/AvatarWithStoryRing.jsx file
function AvatarWithStoryRing({ href, src, name, hasStory, isVideo }) {
  // IG-like rainbow using a conic gradient; fall back to gray when no story
  const ringClass = hasStory
    ? "bg-[conic-gradient(from_220deg_at_50%_50%,#f58529,#feda77,#dd2a7b,#8134af,#515bd4,#f58529)]"
    : "bg-gray-300";

  return (
    <Link href={href} className="block" title={name ? `Open ${name}'s stories` : "Open stories"}>
      {/* OUTER: gradient ring */}
      <div className={`w-36 h-36 rounded-full p-[3px] ${ringClass} transition-transform duration-200 group-hover:scale-[1.02]`}>
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

            {/* Optional ▶ glyph if latest story is a video */}
            {isVideo && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 bg-black/60 text-white rounded">
                ▶
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

Then in your `GirlCard`, swap the current avatar markup for:

```jsx
<div className="relative mx-auto mb-4">
  <AvatarWithStoryRing
    href={`/stories/${girl._id}?returnTo=/girls`}
    src={avatarUrl}
    name={girl.name}
    hasStory={girl.hasStory}
    isVideo={girl.latestStoryKind === "video"}
  />
</div>
```

Why this works:

* The **conic gradient** matches Instagram’s multi-color ring.
* Two small paddings (`p-[3px]`) produce a crisp **white gap** between the gradient and the avatar (like IG).
* Everything scales perfectly because the inner layers use `w-full h-full` rather than mixing `w-36` with `w-32`.

Optional polish (add if you like):

* Subtle glow when there’s a story: add `shadow-[0_0_20px_2px_rgba(253,106,155,0.35)]` to the outer wrapper when `hasStory` is true.
* “Seen” style: if you later track `girl.hasUnseenStory`, you can switch to `bg-gray-300` when it’s been viewed.

No Tailwind plugin needed—arbitrary `bg-[conic-gradient(...)]` works out of the box with JIT.

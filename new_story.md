Great news: you don’t need to rewrite your existing `StoryViewer` at all. We can **reuse it unchanged** and just add a tiny client-only wrapper that feeds it two static images from `/public`. Then make the homepage a server component and drop a small client button where you want to trigger the viewer.

Below are three small pieces:

---

## 1) Client wrapper: `components/home/HomeStoryModal.jsx`

This mounts your existing `StoryViewer` and handles next/prev/close for a small **2-image** stack coming from `/public`.

```jsx
"use client";

import { useEffect, useState } from "react";
// Adjust the import path if you use a baseUrl/alias
import StoryViewer from "../profile/StoryViewer";

export default function HomeStoryModal({
  open,
  onClose,
  stories, // [{ url, text?, createdAt?, user?: { name?, avatarUrl? } }]
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  if (!open) return null;

  const total = stories.length;
  const current = stories[idx];

  const handleNext = () => {
    if (idx + 1 >= total) onClose?.();
    else setIdx((i) => i + 1);
  };
  const handlePrev = () => {
    if (idx === 0) onClose?.();
    else setIdx((i) => i - 1);
  };

  return (
    <StoryViewer
      // Keep your viewer API exactly as-is
      story={{
        kind: "image",
        text: current?.text,
        createdAt: current?.createdAt,
        user: current?.user,
      }}
      signedUrl={current?.url}
      nextUrl={stories[idx + 1]?.url ?? null}
      prevUrl={stories[idx - 1]?.url ?? null}
      onClose={onClose}
      onNext={handleNext}
      onPrev={handlePrev}
      currentIndex={idx}
      totalCount={total}
      canPrev={idx > 0}
      canNext={idx < total - 1}
      autoAdvance
      imageDurationMs={5000}
    />
  );
}
```

---

## 2) Client trigger button with the IG-style ring: `components/home/StoryAvatarButton.jsx`

This replaces your inline button and owns the `open` state. It renders the gradient ring and opens the modal.

```jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import HomeStoryModal from "./HomeStoryModal";

export default function StoryAvatarButton({
  avatarSrc = "/first.jpg",
  size = 80, // px
  stories = [],
  ringClassName = "",
  alt = "Profile",
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`mb-4 p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full w-fit cursor-pointer hover:scale-105 transition-transform ${ringClassName}`}
        aria-label="Open story"
      >
        <div className="bg-white p-1 rounded-full">
          <div
            className="relative rounded-full overflow-hidden"
            style={{ width: size, height: size }}
          >
            <Image src={avatarSrc} alt={alt} fill className="object-cover" sizes={`${size}px`} priority />
          </div>
        </div>
      </button>

      <HomeStoryModal open={open} onClose={() => setOpen(false)} stories={stories} />
    </>
  );
}
```

---

## 3) Make `app/page.js` a server component and swap the button

* **Remove** `"use client"` at the top and delete the `useState/useEffect` for `showStory`.
* **Import** the new client button and use it where your ring button currently is.
* **Delete** the old “Instagram Story Modal” block at the bottom of the page (we won’t need it).

Minimal changes shown below.

### `app/page.js` (server)

```jsx
// app/page.js  (no "use client" here)
import Link from "next/link";
import Image from "next/image";
// Adjust the path if you use an alias like @/
import StoryAvatarButton from "../components/home/StoryAvatarButton";

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      {/* Hero Section */}
      <section className="py-6 md:py-20">
        <div className="container mx-auto px-4">
          {/* ...left column unchanged... */}

          {/* Right Column - Featured Girl Card */}
          <div className="order-1 md:order-2">
            <div className="relative group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                <div className="relative h-[500px] md:h-[600px]">
                  <Image
                    src="/second.jpg"
                    alt="Sofia - AI Companion"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">

                    {/* ⬇️ Replace your old <button> with the client component */}
                    <StoryAvatarButton
                      avatarSrc="/first.jpg"
                      size={80}
                      stories={[
                        {
                          url: "/first.jpg",
                          text: "Sofia says hi 👋",
                          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
                          user: { name: "Sofia", avatarUrl: "/first.jpg" },
                        },
                        {
                          url: "/third.png",
                          text: "Behind the scenes 📸",
                          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                          user: { name: "Sofia", avatarUrl: "/first.jpg" },
                        },
                      ]}
                    />

                    <h3 className="text-3xl font-bold text-white mb-2">Sofia</h3>
                    <p className="text-white/90 text-lg mb-4">24 years old</p>

                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href="/girls/k97f3bpzd0tzap6jf36wr46psd7rdef3"
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Chat
                      </Link>
                      <Link
                        href="/girls"
                        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Browse All Girls
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ...rest of the page unchanged... */}
        </div>
      </section>

      {/* ...other sections... */}

      {/* ❌ Remove your old "Instagram Story Modal" block entirely */}
    </div>
  );
}
```

---

## Why this setup

* **Homepage stays server-side by default** (App Router pages are server components unless you add `"use client"`).
* The **new story viewer is client-only** and mounted *only* when opened.
* **No database calls**: all media come from `/public` (`/first.jpg`, `/third.png`, etc.).
* You keep all the IG polish from your existing `StoryViewer` (progress bars, tap zones, hold-to-pause, swipe-to-close, keyboard, preloading).
* Exactly **two images** are shown; closing happens automatically when the last story completes or on swipe down / ESC.

---

## Notes & small tweaks

* To change the images later, just edit the `stories` array in `StoryAvatarButton`.
* If you prefer to put images in a subfolder like `/public/stories/sofia-1.jpg`, reference them as `"/stories/sofia-1.jpg"`.
* Your `StoryViewer` already preloads neighbors; with only two images this means zero flash between slides.
* Because `StoryViewer` uses relative time, `createdAt` values are simple timestamps (I used “2–3 days ago” for the demo).


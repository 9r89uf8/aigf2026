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

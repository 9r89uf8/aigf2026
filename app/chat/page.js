//app/chat/page.js
"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function lastLine({ lastMessageKind, lastMessageSender, lastMessagePreview, girlName }) {
  const who = lastMessageSender === "ai" ? girlName : "You";
  if (lastMessageKind === "text") {
    const quoted = lastMessagePreview ? `"${lastMessagePreview}"` : "…";
    return `${who}: ${quoted}`;
  }
  const label =
    lastMessageKind === "image" ? "sent a photo" :
    lastMessageKind === "video" ? "sent a video" :
    lastMessageKind === "audio" ? "sent a voice note" :
    "sent a message";
  return `${who} ${label}`;
}

export default function ChatHomePage() {
  const data = useQuery(api.chat_home.getHome) || { threads: [], stories: [] };
  const signViewBatch = useAction(api.cdn.signViewBatch);
  const [signedUrls, setSignedUrls] = useState({});

  // Collect keys to sign (image stories + avatars)
  const keysToSign = useMemo(() => {
    const keys = new Set();
    // Story previews: only image stories can be shown
    for (const s of data.stories) {
      if (s.kind === "image" && s.objectKey) keys.add(s.objectKey);
      if (s.girlAvatarKey) keys.add(s.girlAvatarKey);
    }
    // Thread avatars
    for (const t of data.threads) {
      if (t.girlAvatarKey) keys.add(t.girlAvatarKey);
    }
    return Array.from(keys);
  }, [data.stories, data.threads]);

  // Batch sign URLs when keys change
  useEffect(() => {
    async function fetchSignedUrls() {
      if (!keysToSign.length) {
        setSignedUrls({});
        return;
      }

      try {
        const { urls } = await signViewBatch({ keys: keysToSign });
        setSignedUrls(urls || {});
      } catch (error) {
        console.error("Failed to sign URLs:", error);
      }
    }

    fetchSignedUrls();
  }, [keysToSign, signViewBatch]);

  return (
    <div className="max-w-screen-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Messages</h1>

      {/* Stories rail (Explore-style: all active girls with a story) */}
      {data.stories.length > 0 && (
        <div className="mb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-4">
            {data.stories.map(s => {
              const ring = s.hasNew ? "from-pink-500 to-yellow-400" : "from-gray-300 to-gray-300";
              // Prefer actual image story for preview; otherwise use avatar
              const storyImgSrc = s.kind === "image" && s.objectKey ? signedUrls[s.objectKey] : undefined;
              const avatarSrc = s.girlAvatarKey ? signedUrls[s.girlAvatarKey] : undefined;
              const imgSrc = storyImgSrc || avatarSrc;

              return (
                <Link
                  key={`story-${s.girlId}`}
                  href={`/stories/${s.girlId}?returnTo=/chat`}
                  className="flex flex-col items-center gap-1 shrink-0"
                  title={s.girlName}
                >
                  <div className={`p-[2px] rounded-full bg-gradient-to-tr ${ring}`}>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center relative">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={`${s.girlName} story`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-xs text-gray-500">{s.girlName[0]}</span>
                      )}
                      {/* Show play icon for video stories */}
                      {s.kind === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-lg drop-shadow-lg">▶</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-700 max-w-14 truncate">{s.girlName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Thread list */}
      {data.threads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start chatting with your favorite AI girlfriends</p>
        </div>
      ) : (
        <ul className="divide-y">
          {data.threads.map(t => {
            const avatarSrc = t.girlAvatarKey ? signedUrls[t.girlAvatarKey] : undefined;
            return (
              <li key={t.conversationId} className="py-3">
                <div className="flex items-center gap-3">
                  <Link href={`/chat/${t.conversationId}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={`${t.girlName} avatar`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-xs text-gray-500">{t.girlName[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{t.girlName}</span>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">{formatTime(t.lastMessageAt)}</span>
                      </div>
                      <div className={`text-sm ${t.unread ? "text-black font-medium" : "text-gray-600"} truncate`}>
                        {lastLine({
                          lastMessageKind: t.lastMessageKind,
                          lastMessageSender: t.lastMessageSender,
                          lastMessagePreview: t.lastMessagePreview,
                          girlName: t.girlName
                        })}
                      </div>
                    </div>
                  </Link>

                  {/* "Reply" pill */}
                  <Link
                    href={`/chat/${t.conversationId}`}
                    className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50 shrink-0"
                  >
                    Reply
                  </Link>

                  {t.unread && <span className="w-2 h-2 bg-blue-500 rounded-full ml-1" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

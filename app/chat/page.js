// app/chat/page.js
"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AvatarWithStoryRing from "@/components/AvatarWithStoryRing";

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
  // Data
  const data = useQuery(api.chat_home.getHome) || { threads: [], stories: [] };
  const signViewBatch = useAction(api.cdn.signViewBatch);

  // UI state
  const [signedUrls, setSignedUrls] = useState({});
  const [search, setSearch] = useState("");

  // Collect keys to sign (image stories + avatars)
  const keysToSign = useMemo(() => {
    const keys = new Set();
    for (const s of data.stories) {
      if (s.kind === "image" && s.objectKey) keys.add(s.objectKey);
      if (s.girlAvatarKey) keys.add(s.girlAvatarKey);
    }
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

  // Derived: filtered threads (search + sort only)
  const threads = useMemo(() => {
    let list = data.threads || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const preview = lastLine({
          lastMessageKind: t.lastMessageKind,
          lastMessageSender: t.lastMessageSender,
          lastMessagePreview: t.lastMessagePreview,
          girlName: t.girlName,
        }).toLowerCase();
        return t.girlName.toLowerCase().includes(q) || preview.includes(q);
      });
    }
    return [...list].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }, [data.threads, search]);

  return (
      <div className="min-h-screen bg-white">
        {/* Sticky header with title + search only */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
          <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center justify-center">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>

          {/* Search */}
          <div className="max-w-screen-sm mx-auto px-4 pb-3">
            <div className="relative">
              <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 rounded-lg bg-gray-100 pl-9 pr-3 text-sm placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Search"
                  aria-label="Search messages"
              />
              <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-2-2" />
              </svg>
              {search && (
                  <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 bg-gray-200 rounded-full"
                  >
                    Clear
                  </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-screen-sm mx-auto px-4 pb-24">
          {/* Stories rail */}
          {data.stories.length > 0 && (
              <section className="mt-3 mb-2 overflow-x-auto no-scrollbar">
                <div className="flex gap-4">
                  {data.stories.map((s) => {
                    const storyImgSrc = s.kind === "image" && s.objectKey ? signedUrls[s.objectKey] : undefined;
                    const avatarSrc = s.girlAvatarKey ? signedUrls[s.girlAvatarKey] : undefined;
                    const imgSrc = storyImgSrc || avatarSrc;

                    return (
                        <div key={`story-${s.girlId}`} className="flex flex-col items-center gap-1 shrink-0">
                          <AvatarWithStoryRing
                              href={`/stories/${s.girlId}?returnTo=/chat`}
                              src={imgSrc}
                              name={s.girlName}
                              hasStory={s.hasNew}
                              isVideo={s.kind === "video"}
                              size={64}
                          />
                          <span className="text-[11px] text-gray-700 max-w-16 truncate">{s.girlName}</span>
                        </div>
                    );
                  })}
                </div>
              </section>
          )}

          {/* Threads */}
          {threads.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start chatting with your favorite AI companions</p>
                <Link
                    href="/girls"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-black text-white text-sm"
                >
                  Find companions
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
          ) : (
              <ul className="divide-y">
                {threads.map((t) => {
                  const avatarSrc = t.girlAvatarKey ? signedUrls[t.girlAvatarKey] : undefined;
                  const preview = lastLine({
                    lastMessageKind: t.lastMessageKind,
                    lastMessageSender: t.lastMessageSender,
                    lastMessagePreview: t.lastMessagePreview,
                    girlName: t.girlName,
                  });

                  return (
                      <li key={t.conversationId}>
                        <Link
                            href={`/chat/${t.conversationId}`}
                            className="flex items-center gap-3 py-3 active:bg-gray-50"
                        >
                          {/* Avatar (with unread dot in the corner) */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                              {avatarSrc ? (
                                  <img
                                      src={avatarSrc}
                                      alt={`${t.girlName} avatar`}
                                      className="w-full h-full object-cover"
                                      draggable={false}
                                  />
                              ) : (
                                  <span className="text-sm text-gray-500">{t.girlName?.[0]}</span>
                              )}
                            </div>
                            {t.unread && (
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white"
                                    aria-hidden
                                />
                            )}
                          </div>

                          {/* Texts */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${t.unread ? "font-semibold" : "font-medium"}`}>
                          {t.girlName}
                        </span>
                              <span className="text-xs text-gray-500 shrink-0">{formatTime(t.lastMessageAt)}</span>
                            </div>
                            <div
                                className={`text-sm truncate ${
                                    t.unread ? "text-black font-medium" : "text-gray-600"
                                }`}
                            >
                              {preview}
                            </div>
                          </div>

                          {/* Chevron */}
                          <svg
                              viewBox="0 0 24 24"
                              className="w-5 h-5 text-gray-300 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                  );
                })}
              </ul>
          )}

          {/* Footer spacer */}
          <div className="h-10" />
        </main>
      </div>
  );
}

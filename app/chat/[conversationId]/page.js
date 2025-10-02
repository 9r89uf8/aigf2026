"use client";
//app/chat/[conversationId]/page.js
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { useInvisibleTurnstile } from "@/components/useInvisibleTurnstile";
import { useSignedMediaUrls } from "@/components/chat/useSignedMediaUrls";
import MediaComposer from "@/components/chat/MediaComposer";
import AudioComposer from "@/components/chat/AudioComposer";

// Module-level flag to prevent double prefetch in React Strict Mode
let prefetchAttempted = false;

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = useParams();
  const data = useQuery(api.chat.getConversation, { conversationId }) || null;
  const urlMap = useSignedMediaUrls(data?.messages);
  const signBatch = useAction(api.cdn.signViewBatch);

  const mintPermit = useAction(api.turnstile.verifyAndMintPermit);
  const send = useMutation(api.chat.sendMessage);
  const markRead = useMutation(api.chat.markRead);
  const likeMsg = useMutation(api.chat.likeMessage);
  const clearConversation = useMutation(api.chat.clearConversation);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [permit, setPermit] = useState(null); // { permitId, usesLeft, expiresAt }
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const bottomRef = useRef(null);

  const { ready: turnstileReady, getToken } = useInvisibleTurnstile();
  const prefetchGuard = useRef(false);

  useEffect(() => {
    if (data) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markRead({ conversationId, at: Date.now() });
    }
  }, [data, conversationId, markRead]);

  // Fetch girl's avatar URL
  useEffect(() => {
    if (!data?.girlAvatarKey) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await signBatch({ keys: [data.girlAvatarKey] });
        if (!cancelled && r?.urls) {
          setAvatarUrl(r.urls[data.girlAvatarKey] || null);
        }
      } catch (e) {
        console.warn("Failed to fetch avatar URL", e);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.girlAvatarKey, signBatch]);

  // Auto-hide delete button after 5 seconds
  useEffect(() => {
    if (showDeleteButton) {
      const timer = setTimeout(() => setShowDeleteButton(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteButton]);

  // Optional: prefetch a permit once the Turnstile script is ready
  useEffect(() => {
    (async () => {
      if (!turnstileReady || permit || prefetchAttempted) return;
      prefetchAttempted = true;
      try {
        const token = await getToken();
        const p = await mintPermit({ token, scope: "chat_send" });
        setPermit(p);
      } catch (e) {
        // Non-fatal — will mint on first send
        console.warn("Permit prefetch failed", e);
        // allow one retry later if desired:
        prefetchAttempted = false;
      }
    })();

    // Reset flag when conversation changes
    return () => {
      if (conversationId) prefetchAttempted = false;
    };
  }, [turnstileReady, permit, getToken, mintPermit, conversationId]);

  const quotaOut = data && !data.premiumActive && data.freeRemaining.text <= 0;

  function permitValid(p) {
    return p && p.usesLeft > 0 && p.expiresAt > Date.now();
  }

  // Ensure there is a valid permit; mint if needed.
  async function ensurePermit() {
    if (permitValid(permit)) return permit;
    const token = await getToken();
    const p = await mintPermit({ token, scope: "chat_send" });
    setPermit(p);
    return p;
  }

  async function onSend() {
    if (!text.trim() || quotaOut || isSending) return;

    setIsSending(true);
    try {
      const p = await ensurePermit();
      await send({ conversationId, text, permitId: p.permitId });
      // Optimistically decrement local permit count
      setPermit({ ...p, usesLeft: Math.max(0, p.usesLeft - 1) });
      setText("");
    } catch (err) {
      // If permit failed server-side, clear and retry once
      const msg = (err && err.message) || "Could not send message";
      if (msg.includes("Security check failed")) {
        setPermit(null);
        try {
          const p = await ensurePermit();
          await send({ conversationId, text, permitId: p.permitId });
          setPermit({ ...p, usesLeft: Math.max(0, p.usesLeft - 1) });
          setText("");
        } catch (err2) {
          alert((err2 && err2.message) || msg);
        }
      } else {
        alert(msg);
      }
    } finally {
      setIsSending(false);
    }
  }

  async function onClearAll() {
    try {
      await clearConversation({ conversationId });
      setShowDeleteButton(false);
      // After reactive query updates, ensure we are at the bottom
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    } catch (e) {
      alert((e && e.message) || "Could not clear chat");
    }
  }

  return (
    <div className="max-w-screen-sm mx-auto h-[100dvh] md:h-screen flex flex-col overflow-hidden min-h-0 -mb-[76px] sm:mb-0">
      {/* Instagram-style header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3 flex-1 ml-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={data?.girlName || "Profile"}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
          )}
          <span className="font-semibold text-base">{data?.girlName || "Chat"}</span>
        </div>

        {!showDeleteButton ? (
          <button
            onClick={() => setShowDeleteButton(true)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Delete conversation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onClearAll}
            className="p-1 hover:bg-red-100 rounded-full transition-colors"
            title="Confirm delete"
          >
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-white">
        {(data?.messages || []).map(m => {
          const mine = m.sender === "user";
          if (m.kind === "text") {
            return (
              <div key={m.id} className={`flex items-end gap-2 group ${mine ? "flex-row-reverse" : "flex-row"}`}>
                {!mine && (
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={data?.girlName || ""}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                  )
                )}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[70%]`}>
                  <div
                    className={`px-4 py-2.5 rounded-3xl ${
                      mine
                        ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-2">
                    <span className="text-[11px] text-gray-400">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {!mine && (
                      <button
                        onClick={() => likeMsg({ messageId: m.id })}
                        className="text-sm hover:scale-110 transition-transform ml-1"
                      >
                        {m.userLiked ? "❤️" : "🤍"}
                      </button>
                    )}
                    {mine && m.aiLiked && <span className="text-sm ml-1">❤️</span>}
                  </div>
                  {mine && m.aiError && (
                    <div className="text-[11px] text-red-500 mt-1 px-2">AI temporarily unavailable</div>
                  )}
                </div>
              </div>
            );
          }
          if (m.kind === "audio") {
            const src = urlMap[m.mediaKey];
            return (
              <div key={m.id} className={`flex items-end gap-2 group ${mine ? "flex-row-reverse" : "flex-row"}`}>
                {!mine && (
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={data?.girlName || ""}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                  )
                )}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[70%]`}>
                  <div
                    className={`px-3 py-2 rounded-3xl ${
                      mine ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gray-100"
                    }`}
                  >
                    {src ? (
                      <audio controls src={src} className="w-64 h-8" />
                    ) : (
                      <div className="w-64 h-8 bg-gray-300/30 rounded animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-2">
                    <span className="text-[11px] text-gray-400">
                      {m.durationSec ? `${m.durationSec}s • ` : ""}
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {!mine && (
                      <button
                        onClick={() => likeMsg({ messageId: m.id })}
                        className="text-sm hover:scale-110 transition-transform ml-1"
                      >
                        {m.userLiked ? "❤️" : "🤍"}
                      </button>
                    )}
                    {mine && m.aiLiked && <span className="text-sm ml-1">❤️</span>}
                  </div>
                  {mine && m.aiError && (
                    <div className="text-[11px] text-red-500 mt-1 px-2">AI temporarily unavailable</div>
                  )}
                </div>
              </div>
            );
          }
          const src = urlMap[m.mediaKey];
          return (
            <div key={m.id} className={`flex items-end gap-2 group ${mine ? "flex-row-reverse" : "flex-row"}`}>
              {!mine && (
                avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={data?.girlName || ""}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                )
              )}
              <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[70%]`}>
                <div
                  className={`rounded-2xl overflow-hidden ${
                    mine ? "bg-gradient-to-r from-blue-400/10 to-blue-600/10" : "bg-gray-100"
                  }`}
                >
                  {m.kind === "image" ? (
                    src ? (
                      <img src={src} alt="image" className="max-h-80 w-full object-cover" />
                    ) : (
                      <div className="w-64 h-64 bg-gray-300/50 animate-pulse" />
                    )
                  ) : (
                    src ? (
                      <video src={src} controls className="max-h-80 w-full" />
                    ) : (
                      <div className="w-64 h-40 bg-gray-300/50 animate-pulse" />
                    )
                  )}
                  {!!m.text && (
                    <div className={`px-3 py-2 text-sm ${mine ? "text-gray-900" : "text-gray-700"}`}>
                      {m.text}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-2">
                  <span className="text-[11px] text-gray-400">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {!mine && (
                    <button
                      onClick={() => likeMsg({ messageId: m.id })}
                      className="text-sm hover:scale-110 transition-transform ml-1"
                    >
                      {m.userLiked ? "❤️" : "🤍"}
                    </button>
                  )}
                  {mine && m.aiLiked && <span className="text-sm ml-1">❤️</span>}
                </div>
                {mine && m.aiError && (
                  <div className="text-[11px] text-red-500 mt-1 px-2">AI temporarily unavailable</div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!data?.premiumActive && quotaOut && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-sm">
          Free text messages for this girl are used up.{" "}
          <a href="/plans" className="text-blue-600 underline font-medium">Upgrade</a> for unlimited messages.
        </div>
      )}

      {/* Instagram-style input area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white" >
        {!turnstileReady && (
          <div className="text-xs text-gray-500 mb-2">Preparing security…</div>
        )}

        <div className="flex items-center gap-2">
          {/* Media & Audio buttons */}
          <div className="flex items-center gap-1">
            <MediaComposer
              conversationId={conversationId}
              ensurePermit={ensurePermit}
              onSent={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            />
            <AudioComposer
              conversationId={conversationId}
              ensurePermit={ensurePermit}
              onSent={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            />
          </div>

          {/* Text input */}
          <input
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed placeholder:text-gray-400"
            placeholder="Message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim() && !quotaOut && !isSending && turnstileReady) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={quotaOut || isSending || !turnstileReady}
          />

          {/* Send button */}
          <button
            className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
            onClick={onSend}
            disabled={!text.trim() || quotaOut || isSending || !turnstileReady}
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
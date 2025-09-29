"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { useInvisibleTurnstile } from "@/components/useInvisibleTurnstile";
import { useSignedMediaUrls } from "@/components/chat/useSignedMediaUrls";
import MediaComposer from "@/components/chat/MediaComposer";

// Module-level flag to prevent double prefetch in React Strict Mode
let prefetchAttempted = false;

export default function ConversationPage() {
  const { conversationId } = useParams();
  const data = useQuery(api.chat.getConversation, { conversationId }) || null;
  const urlMap = useSignedMediaUrls(data?.messages);

  const mintPermit = useAction(api.turnstile.verifyAndMintPermit);
  const send = useMutation(api.chat.sendMessage);
  const markRead = useMutation(api.chat.markRead);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [permit, setPermit] = useState(null); // { permitId, usesLeft, expiresAt }
  const bottomRef = useRef(null);

  const { ready: turnstileReady, getToken } = useInvisibleTurnstile();
  const prefetchGuard = useRef(false);

  useEffect(() => {
    if (data) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markRead({ conversationId, at: Date.now() });
    }
  }, [data, conversationId, markRead]);

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

  return (
    <div className="max-w-screen-sm mx-auto h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(data?.messages || []).map(m => {
          const mine = m.sender === "user";
          const base = "max-w-[80%] p-2 rounded";
          if (m.kind === "text") {
            return (
              <div key={m.id} className={`${base} ${mine ? "bg-blue-600 text-white self-end ml-auto" : "bg-gray-200"}`}>
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            );
          }
          const src = urlMap[m.mediaKey];
          return (
            <div key={m.id} className={`${base} ${mine ? "bg-blue-50 self-end ml-auto" : "bg-gray-100"}`}>
              {m.kind === "image" ? (
                src ? <img src={src} alt="image" className="rounded max-h-80" /> : <div className="w-48 h-48 bg-gray-300 rounded" />
              ) : (
                src ? <video src={src} controls className="rounded max-h-80" /> : <div className="w-48 h-32 bg-gray-300 rounded" />
              )}
              {!!m.text && <div className="text-sm mt-2">{m.text}</div>}
              <div className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!data?.premiumActive && quotaOut && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-sm">
          Free text messages for this girl are used up.{" "}
          <a href="/plans" className="text-blue-600 underline">Upgrade</a> for unlimited messages.
        </div>
      )}

      <div className="p-3 border-t space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={quotaOut || isSending || !turnstileReady}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onSend}
            disabled={!text.trim() || quotaOut || isSending || !turnstileReady}
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
        {!turnstileReady && (
          <div className="text-xs text-gray-500">Preparing security…</div>
        )}

        <MediaComposer
          conversationId={conversationId}
          ensurePermit={ensurePermit}
          onSent={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>
    </div>
  );
}
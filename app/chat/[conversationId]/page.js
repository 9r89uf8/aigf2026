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
import { currencyForCountry, formatMoney } from "@/app/lib/currency";


function TypingBubble({ avatarUrl, girlName }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${girlName || "Assistant"} is typing`}
      className="flex items-end gap-2"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={girlName || "Profile"}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
      )}

      <div className="bg-gray-100 text-gray-900 rounded-3xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>

      {/* Local, scoped CSS (no global styles required) */}
      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #9ca3af; /* gray-400 */
          display: inline-block;
          animation: blink 1.4s infinite both;
        }
        .typing-dot:nth-child(2) { animation-delay: .2s; }
        .typing-dot:nth-child(3) { animation-delay: .4s; }
        @keyframes blink {
          0% { opacity: .2; transform: translateY(0px); }
          20% { opacity: 1; transform: translateY(-1px); }
          100% { opacity: .2; transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = useParams();
  // const data = useQuery(api.chat.getConversation, { conversationId }) || null;
  const data = useQuery(api.chat.getConversation, { conversationId });
  const isLoading = data === undefined;
  const urlMap = useSignedMediaUrls(data?.messages);
  const signBatch = useAction(api.cdn.signViewBatch);

  const mintPermit = useAction(api.turnstile.verifyAndMintPermit);
  const send = useMutation(api.chat.sendMessage);
  const likeMsg = useMutation(api.chat.likeMessage);
  const clearConversation = useMutation(api.chat.clearConversation);

  // For upsell banner (cheapest plan)
  const listPlans = useAction(api.payments_actions.listPlansCached);
  const me = useQuery(api.profile.getMine);
  const [plans, setPlans] = useState([]);
  const CURRENCIES_OK = ["EUR", "MXN", "ARS"];
  const CURRENCY_TO_COUNTRY = { EUR: "Spain", MXN: "Mexico", ARS: "Argentina" };

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [permit, setPermit] = useState(null); // { permitId, usesLeft, expiresAt }
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const bottomRef = useRef(null);

  const { ready: turnstileReady, getToken } = useInvisibleTurnstile();

  // ---- Stable refs to avoid Strict Mode double-execute overlaps ----
  const permitRef = useRef(permit);
  useEffect(() => { permitRef.current = permit; }, [permit]);

  const mintPermitRef = useRef(mintPermit);
  useEffect(() => { mintPermitRef.current = mintPermit; }, [mintPermit]);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  const signBatchRef = useRef(signBatch);
  useEffect(() => { signBatchRef.current = signBatch; }, [signBatch]);

  // Serialize turnstile execute() calls
  const tokenInFlightRef = useRef(null);
  async function acquireToken() {
    if (tokenInFlightRef.current) return tokenInFlightRef.current;
    tokenInFlightRef.current = (async () => {
      try {
        return await getTokenRef.current();
      } finally {
        tokenInFlightRef.current = null;
      }
    })();
    return tokenInFlightRef.current;
  }

  // Compute typing state from existing messages
  const lastMsg = data?.messages?.[data.messages.length - 1] || null;
  const isAiTyping = !!lastMsg && lastMsg.sender === "user" && !lastMsg.aiError;



  useEffect(() => {
    if (data) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  // Auto-scroll when typing indicator appears
  useEffect(() => {
    if (isAiTyping) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isAiTyping]);

  // Fetch girl's avatar URL (via signed URL)
  useEffect(() => {
    if (!data?.girlAvatarKey) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await signBatchRef.current({ keys: [data.girlAvatarKey] });
        if (!cancelled && r?.urls) {
          setAvatarUrl(r.urls[data.girlAvatarKey] || null);
        }
      } catch (e) {
        console.warn("Failed to fetch avatar URL", e);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.girlAvatarKey]);

  // Compute locked state on client: girl is premium-only and user doesn't have premium
  const isPremiumNow = !!me?.profile?.premiumActive;
  const premiumLocked = !isLoading && !!data?.girlPremiumOnly && !isPremiumNow;
  const outOfFree =
      !isLoading &&
      !premiumLocked &&
      !isPremiumNow &&
      ((data?.freeRemaining?.text ?? Infinity) <= 0);
      // Disable the composer while loading or blocked
  const disableComposer = isLoading || premiumLocked || outOfFree;
  // Only show the banner once we actually know the state
  const showUpsellBanner = !isLoading && (premiumLocked || outOfFree);

// Helpful for CTA:
  const plansHref =
      `/plans?returnTo=${encodeURIComponent(`/chat/${conversationId}`)}` +
      (data?.girlId ? `&girl=${data.girlId}` : "");

  // Load plans (only when upsell banner needs to be shown)
  useEffect(() => {
    if (!showUpsellBanner) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await listPlans();
        if (!cancelled) setPlans(r || []);
      } catch {
        // silently ignore
      }
    })();
    return () => { cancelled = true; };
  }, [showUpsellBanner, listPlans]);

  // Determine the user's selected currency (only the ones we show)
  const selectedCurrency = (() => {
    const ctry = me?.profile?.country;
    const cur = ctry ? currencyForCountry(ctry) : null;
    return cur && CURRENCIES_OK.includes(cur) ? cur : null;
  })();

  // Find the cheapest plan for desired currencies
  function cheapest(plansArr, wantedCurrencies) {
    let best = null;
    for (const p of plansArr || []) {
      const localized = Object.fromEntries(
        Object.entries(p.localized || {})
          .map(([k, v]) => [k.toUpperCase(), v])
          .filter(([_, v]) => v != null)
      );
      for (const cur of wantedCurrencies) {
        const v = localized[cur];
        if (v != null && (best === null || v < best.amount)) {
          best = { amount: v, currency: cur };
        }
      }
    }
    return best; // { amount, currency } or null
  }

  const cheapestForUser = selectedCurrency
    ? cheapest(plans, [selectedCurrency])
    : cheapest(plans, CURRENCIES_OK);

  const cheapestLabel = cheapestForUser
    ? formatMoney(cheapestForUser.currency, cheapestForUser.amount)
    : null;
  const cheapestCountry = cheapestForUser ? CURRENCY_TO_COUNTRY[cheapestForUser.currency] : null;

  // Auto-hide delete button after 5 seconds
  useEffect(() => {
    if (showDeleteButton) {
      const timer = setTimeout(() => setShowDeleteButton(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteButton]);

// top-level (module scope)
  const prefetchAttemptedRef = useRef(false);

// inside the prefetch useEffect
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!turnstileReady || permitRef.current || prefetchAttemptedRef.current) return;
      prefetchAttemptedRef.current = true;
      try {
        const token = await acquireToken();
        if (cancelled) return;
        const p = await mintPermitRef.current({ token, scope: "chat_send" });
        if (cancelled) return;
        setPermit(p);
      } catch (e) {
        console.warn("Permit prefetch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [turnstileReady /* you can omit conversationId for a global prefetch */]);

  function permitValid(p) {
    return p && p.usesLeft > 0 && p.expiresAt > Date.now();
  }

  // Ensure there is a valid permit; mint if needed.
  async function ensurePermit() {
    const current = permitRef.current ?? permit;
    if (permitValid(current)) return current;
    const token = await acquireToken();
    const p = await mintPermitRef.current({ token, scope: "chat_send" });
    setPermit(p);
    return p;
  }

  async function onSend() {
    if (!text.trim() || disableComposer || isSending) return;

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
        {isAiTyping && (
          <div className="flex items-end gap-2">
            <div className="flex flex-col items-start max-w-[70%]">
              <TypingBubble avatarUrl={avatarUrl} girlName={data?.girlName} />
              <div className="flex items-center gap-1.5 mt-1 px-2">
                <span className="text-[11px] text-gray-400">typing…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showUpsellBanner && (
          <div className="relative border-t border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
            <div className="relative px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white">
            {premiumLocked ? "Premium required to message this companion" : "Free messages used"}
          </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-bold text-white">Premium starts at</span>
                    {cheapestLabel ? (
                        <>
                <span className="text-2xl font-extrabold text-white drop-shadow-md">
                  {cheapestLabel}
                </span>
                          {!selectedCurrency && cheapestCountry && (
                              <span className="text-sm text-white/90">in {cheapestCountry}</span>
                          )}
                        </>
                    ) : (
                        <span className="text-xl font-bold text-white">our lowest regional price</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
              <path d="M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h8V8a4 4 0 10-8 0v2z"/>
            </svg>
            <span className="font-medium">Secure checkout</span>
          </span>
                  <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
              <path d="M12 2l8 4v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6l8-4z"/>
            </svg>
            <span className="font-medium">One-time payment</span>
          </span>
                  <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
              <path d="M3 5h18a2 2 0 012 2v1H1V7a2 2 0 012-2zm-2 6h22v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-6zm4 4h6v2H5v-2z"/>
            </svg>
            <span className="font-medium">Powered by Stripe</span>
          </span>
                </div>
              </div>

              <a
                  href={plansHref}
                  className="mt-3 sm:mt-0 flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-white text-indigo-700 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-105 transition-all duration-200 active:scale-95 border border-white/50"
              >
                <span>See plans</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>

            <style jsx>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-12deg); }
                100% { transform: translateX(200%) skewX(-12deg); }
              }
              .animate-shimmer { animation: shimmer 3s infinite; }
            `}</style>
          </div>
      )}


      {/* Instagram-style input area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white" >
        {!turnstileReady && (
          <div className="text-xs text-gray-500 mb-2">Preparing security…</div>
        )}

        <div className="flex items-center gap-2">
          {/* Media & Audio buttons */}
          <div className={`flex items-center gap-1 ${disableComposer ? "pointer-events-none opacity-40" : ""}`}>
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
              if (e.key === "Enter" && !e.shiftKey && text.trim() && !disableComposer && !isSending && turnstileReady) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={disableComposer || isSending || !turnstileReady}
          />

          {/* Send button */}
          <button
            className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
            onClick={onSend}
            disabled={!text.trim() || disableComposer || isSending || !turnstileReady}
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
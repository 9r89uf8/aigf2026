"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSignedMediaUrls } from "@/components/chat/useSignedMediaUrls";
import ReplyToBadge from "@/components/chat/ReplyToBadge";

export default function AdminConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params?.conversationId;

  const indexParam = searchParams?.get("index");

  const conversation = useQuery(
    api.chat.getConversationAdmin,
    conversationId ? { conversationId } : undefined
  );
  const recent = useQuery(api.chat.listRecentConversationsAdmin, { limit: 10 });

  const transcript = conversation || null;
  const ordered = useMemo(() => recent || [], [recent]);

  const derivedIndex = useMemo(() => {
    if (!conversationId || !ordered.length) return null;
    const found = ordered.findIndex((item) => String(item.conversationId) === String(conversationId));
    return found >= 0 ? found : null;
  }, [ordered, conversationId]);

  const currentIndex = useMemo(() => {
    if (indexParam !== null && !Number.isNaN(Number(indexParam))) {
      return Number(indexParam);
    }
    return derivedIndex;
  }, [indexParam, derivedIndex]);

  const prevItem =
    currentIndex !== null && currentIndex > 0 && ordered[currentIndex - 1]
      ? ordered[currentIndex - 1]
      : null;
  const nextItem =
    currentIndex !== null && currentIndex < ordered.length - 1 && ordered[currentIndex + 1]
      ? ordered[currentIndex + 1]
      : null;

  const urls = useSignedMediaUrls(transcript?.messages);
  const signBatch = useAction(api.cdn.signViewBatch);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  useEffect(() => {
    if (!transcript?.girlAvatarKey) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const signed = await signBatch({ keys: [transcript.girlAvatarKey] });
        if (!cancelled) {
          setAvatarUrl(signed?.urls?.[transcript.girlAvatarKey] || null);
        }
      } catch (error) {
        console.warn("No se pudo firmar el avatar", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transcript?.girlAvatarKey, signBatch]);

  if (conversation === undefined) {
    return <div className="p-6">Cargando conversación…</div>;
  }

  if (!transcript) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/conversations")}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          ← Volver al listado
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-600 font-semibold">No se encontró la conversación solicitada.</p>
        </div>
      </div>
    );
  }

  function moveTo(item, targetIndex) {
    if (!item) return;
    router.push(`/admin/conversations/${item.conversationId}?index=${targetIndex}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => router.push("/admin/conversations")}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
          >
            ← Volver al listado
          </button>
          <h1 className="text-2xl font-semibold">
            {transcript.girlName} — vista de administrador
          </h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Usuario: {transcript.userEmail || "Sin correo disponible"}</p>
            <p>
              Conversación ID: <span className="font-mono text-xs">{transcript.conversationId}</span>
            </p>
            <p>
              Último mensaje:{" "}
              {new Date(transcript.lastMessageAt || transcript.updatedAt || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => moveTo(prevItem, (currentIndex ?? 0) - 1)}
            disabled={!prevItem}
            className={`px-3 py-2 rounded border text-sm ${
              prevItem
                ? "border-gray-300 hover:bg-gray-50 text-gray-700"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Anterior
          </button>
          <button
            onClick={() => moveTo(nextItem, (currentIndex ?? 0) + 1)}
            disabled={!nextItem}
            className={`px-3 py-2 rounded border text-sm ${
              nextItem
                ? "border-gray-300 hover:bg-gray-50 text-gray-700"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Siguiente →
          </button>
        </div>
      </div>

      <div className="border rounded-lg bg-white flex flex-col min-h-[65vh]">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={transcript.girlName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
            )}
            <div>
              <p className="font-semibold text-lg">{transcript.girlName}</p>
              <p className="text-sm text-gray-500">Vista de solo lectura</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total de mensajes: {transcript.messages?.length || 0}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-white">
          {transcript.messages?.map((m) => {
            const mine = m.sender === "user";
            const mediaUrl = m.mediaKey ? urls[m.mediaKey] : null;

            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                {!mine && (
                  avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={transcript.girlName || ""}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                  )
                )}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[70%]`}>
                  {!mine && <ReplyToBadge rt={m.replyTo} />}
                  {m.kind === "text" && (
                    <div
                      className={`px-4 py-2.5 rounded-3xl ${
                        mine
                          ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-[20px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                    </div>
                  )}
                  {m.kind === "audio" && (
                    <div
                      className={`px-3 py-2 rounded-3xl ${
                        mine ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gray-100"
                      }`}
                    >
                      {mediaUrl ? (
                        <audio controls src={mediaUrl} className="w-64 h-8" />
                      ) : (
                        <div className="w-64 h-8 bg-gray-200 rounded animate-pulse" />
                      )}
                    </div>
                  )}
                  {(m.kind === "image" || m.kind === "video") && (
                    <div
                      className={`rounded-2xl overflow-hidden ${
                        mine ? "bg-gradient-to-r from-blue-400/10 to-blue-600/10" : "bg-gray-100"
                      }`}
                    >
                      {m.kind === "image" ? (
                        mediaUrl ? (
                          <img
                            src={mediaUrl}
                            alt="Imagen"
                            className="max-h-80 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setEnlargedImage(mediaUrl)}
                          />
                        ) : (
                          <div className="w-64 h-64 bg-gray-200 animate-pulse" />
                        )
                      ) : mediaUrl ? (
                        <video src={mediaUrl} controls className="max-h-80 w-full" />
                      ) : (
                        <div className="w-64 h-40 bg-gray-200 animate-pulse" />
                      )}
                      {m.text && (
                        <div className="px-3 py-2 text-[19px] text-gray-700">
                          {m.text}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 px-2 text-[15px] text-gray-400">
                    <span>{mine ? "Usuario" : "AI"}</span>
                    <span>•</span>
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {m.durationSec ? <span>• {m.durationSec}s</span> : null}
                    {mine && m.aiError && (
                      <span className="text-red-500">AI no respondió</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={enlargedImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

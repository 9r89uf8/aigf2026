"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";

const MAX_IMAGE_MB = 3;
const MAX_VIDEO_MB = 5;

export default function MediaComposer({
  conversationId,
  ensurePermit,           // async () => { permitId, usesLeft, expiresAt }
  onSent,                 // callback after successful send
}) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const signUpload = useAction(api.s3.signChatUpload);
  const finalize = useAction(api.s3.finalizeChatUpload);
  const sendMedia = useMutation(api.chat.sendMediaMessage);

  const kind = useMemo(() => {
    if (!file) return null;
    return file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
  }, [file]);

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Unsupported file type");
      return;
    }
    if (isImage && f.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be ≤ ${MAX_IMAGE_MB}MB`);
      return;
    }
    if (isVideo && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video must be ≤ ${MAX_VIDEO_MB}MB`);
      return;
    }
    setError("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function onSend() {
    if (!file || !kind) return;
    setSending(true);
    try {
      const permit = await ensurePermit();
      const { uploadUrl, objectKey } = await signUpload({
        conversationId,
        kind,
        contentType: file.type,
        size: file.size,
      });

      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

      await finalize({ objectKey, kind }); // HEAD check + server validation

      await sendMedia({
        conversationId,
        kind,
        objectKey,
        caption: caption.trim() || undefined,
        permitId: permit.permitId,
      });

      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      onSent?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Could not send media");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Icon button trigger */}
      <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors" title="Attach photo or video">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={onPick}
        />
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </label>

      {/* Preview modal */}
      {file && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Send {kind}</h3>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setCaption("");
                  setError("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {kind === "image" ? (
                <img src={previewUrl} alt="preview" className="w-full max-h-96 object-contain rounded-lg" />
              ) : (
                <video src={previewUrl} controls className="w-full max-h-96 rounded-lg" />
              )}

              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add a caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              <div className="text-xs text-gray-500 px-2">
                {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>

              {!!error && <div className="text-sm text-red-600 px-2">{error}</div>}

              <button
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={onSend}
                disabled={sending}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
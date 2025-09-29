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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="btn-ghost cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={onPick}
          />
          Attach
        </label>
        {file && (
          <button className="btn" onClick={onSend} disabled={sending}>
            {sending ? "Sending…" : "Send media"}
          </button>
        )}
      </div>

      {file && (
        <div className="p-2 border rounded-md">
          {kind === "image" ? (
            <img src={previewUrl} alt="preview" className="max-h-64 rounded" />
          ) : (
            <video src={previewUrl} controls className="max-h-64 rounded" />
          )}
          <input
            className="mt-2 input w-full"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="mt-1 text-xs text-gray-500">
            {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      )}

      {!!error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
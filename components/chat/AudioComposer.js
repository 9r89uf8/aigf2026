"use client";

import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";

const MAX_AUDIO_MB = 2;

export default function AudioComposer({
  conversationId,
  ensurePermit,
  onSent,
}) {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [chunks, setChunks] = useState([]);

  const mediaRecorderRef = useRef(null);

  const signUpload = useAction(api.s3.signChatUpload);
  const finalize = useAction(api.s3.finalizeChatUpload);
  const sendAudio = useMutation(api.chat.sendAudioMessage);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;

      const tempChunks = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          tempChunks.push(e.data);
        }
      };

      mr.onstop = () => {
        const b = new Blob(tempChunks, { type: "audio/webm" });
        if (b.size > MAX_AUDIO_MB * 1024 * 1024) {
          setError(`Audio too large. Max ${MAX_AUDIO_MB}MB`);
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setRecording(true);
      setError("");
      setChunks(tempChunks);
    } catch (e) {
      setError("Mic permission denied or unsupported browser");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function onSend() {
    if (!blob) return;
    setSending(true);
    try {
      const permit = await ensurePermit();

      const { uploadUrl, objectKey } = await signUpload({
        conversationId,
        kind: "audio",
        contentType: blob.type || "audio/webm",
        size: blob.size,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob
      });

      await finalize({ objectKey, kind: "audio" });

      // Try to extract duration
      let durationSec;
      try {
        durationSec = await new Promise((resolve) => {
          const a = new Audio(previewUrl);
          a.addEventListener("loadedmetadata", () => resolve(Math.round(a.duration)));
          a.addEventListener("error", () => resolve(undefined));
        });
      } catch {}

      await sendAudio({
        conversationId,
        objectKey,
        durationSec,
        permitId: permit.permitId,
      });

      // Reset
      setBlob(null);
      setPreviewUrl(null);
      setChunks([]);
      setError("");
      onSent?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Could not send audio");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      {!recording ? (
        <button
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
          onClick={startRecording}
        >
          🎙️ Record audio
        </button>
      ) : (
        <button
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
          onClick={stopRecording}
        >
          ⏹ Stop recording
        </button>
      )}

      {blob && (
        <div className="p-2 border rounded-md bg-gray-50">
          <audio controls src={previewUrl} className="w-full" />
          <div className="text-xs text-gray-500 mt-1">
            {(blob.size/1024/1024).toFixed(2)} MB
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={onSend}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send audio"}
            </button>
            <button
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              onClick={() => {
                setBlob(null);
                setPreviewUrl(null);
                setChunks([]);
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {!!error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
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

      await finalize({ objectKey, kind: "audio", conversationId });

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
    <>
      {/* Icon button trigger */}
      {!recording ? (
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={startRecording}
          title="Record audio"
        >
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      ) : (
        <button
          className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors animate-pulse"
          onClick={stopRecording}
          title="Stop recording"
        >
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}

      {/* Preview modal */}
      {blob && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Send audio</h3>
              <button
                onClick={() => {
                  setBlob(null);
                  setPreviewUrl(null);
                  setChunks([]);
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
              <audio controls src={previewUrl} className="w-full" />

              <div className="text-xs text-gray-500 px-2">
                {(blob.size / 1024 / 1024).toFixed(2)} MB
              </div>

              {!!error && <div className="text-sm text-red-600 px-2">{error}</div>}

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={onSend}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
                <button
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors"
                  onClick={() => {
                    setBlob(null);
                    setPreviewUrl(null);
                    setChunks([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}